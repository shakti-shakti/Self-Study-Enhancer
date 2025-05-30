
"use client";
import { useRef, useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { UploadCloud, FileText, ImageIcon, FolderOpen, Search, Trash2, ExternalLink, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { logActivity } from '@/lib/activity-logger';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabaseClient';
import { Progress } from '@/components/ui/progress';

interface AppFile {
  id: string; 
  user_id: string;
  file_name: string;
  file_type: "pdf" | "image" | "doc" | "unknown";
  file_size_text: string;
  original_upload_date?: string;
  ai_hint?: string;
  created_at?: string;
  storage_path?: string | null; // Path in Supabase Storage
  local_preview_url?: string; // For client-side image previews before/during upload
}

const FILES_FETCH_LIMIT = 50;
const STORAGE_BUCKET_NAME = 'user_uploads'; // Define your bucket name

function getFileType(fileName: string): AppFile['file_type'] {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension || '')) return 'image';
  if (['doc', 'docx', 'txt', 'md'].includes(extension || '')) return 'doc';
  return 'unknown';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function FilesPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<AppFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({}); //fileName: progress
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFiles = useCallback(async () => {
    if (!user) {
      setFiles([]);
      setIsLoadingFiles(false);
      return;
    }
    setIsLoadingFiles(true);
    try {
      const { data, error } = await supabase
        .from('user_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(FILES_FETCH_LIMIT);
      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Fetching Files List", description: (error as Error).message });
      logActivity("Error", "Failed to fetch files list", { error: (error as Error).message });
    } finally {
      setIsLoadingFiles(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchFiles();
    } else if (!authLoading && !user) {
      setIsLoadingFiles(false);
      setFiles([]);
    }
  }, [user, authLoading, fetchFiles]);

  const handleUploadClick = () => {
    if (!user) {
        toast({variant: "destructive", title: "Not Logged In", description: "Please log in to upload files."});
        return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress({});
    let allUploadsSuccessful = true;

    const uploadPromises = Array.from(selectedFiles).map(async (file) => {
      const fileNameForProgress = file.name; // Use original file name for progress tracking
      setUploadProgress(prev => ({ ...prev, [fileNameForProgress]: 0 }));
      
      // Sanitize file name for storage path, make it unique
      const sanitizedBaseName = file.name.substring(0, file.name.lastIndexOf('.')).replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileExt = file.name.split('.').pop() || 'bin';
      const uniqueFileNameForStorage = `${sanitizedBaseName}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${uniqueFileNameForStorage}`;

      try {
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false, // true if you want to overwrite if same path exists
            contentType: file.type,
          });

        if (uploadError) {
          console.error('Supabase Storage Upload Error:', uploadError);
          throw uploadError;
        }

        // If upload successful, insert metadata into 'user_files' table
        const fileMetadata: Omit<AppFile, 'id' | 'created_at' | 'local_preview_url'> = {
          user_id: user.id,
          file_name: file.name, // Store original file name
          file_type: getFileType(file.name),
          file_size_text: formatFileSize(file.size),
          original_upload_date: new Date().toISOString().split('T')[0],
          ai_hint: file.type.startsWith('image/') ? 'uploaded image' : 'document file',
          storage_path: filePath, // Store the path in Supabase Storage
        };

        const { data: dbData, error: dbError } = await supabase
          .from('user_files')
          .insert(fileMetadata)
          .select()
          .single();

        if (dbError) {
          // If DB insert fails, try to delete the orphaned file from storage
          console.error('Supabase DB Insert Error after upload:', dbError);
          await supabase.storage.from(STORAGE_BUCKET_NAME).remove([filePath]);
          throw dbError;
        }
        setUploadProgress(prev => ({ ...prev, [fileNameForProgress]: 100 }));
        return dbData as AppFile;
      } catch (err) {
        allUploadsSuccessful = false;
        const errorMessage = err instanceof Error ? err.message : 'Unknown upload error';
        toast({ variant: "destructive", title: `Error Uploading ${file.name}`, description: errorMessage });
        logActivity("File Upload Error", `Failed to upload ${file.name}: ${errorMessage}`);
        setUploadProgress(prev => ({ ...prev, [fileNameForProgress]: -1 })); // -1 for error
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulDbFiles = results.filter(Boolean) as AppFile[];

    if (successfulDbFiles.length > 0) {
      fetchFiles(); // Refresh the list from DB
      toast({
        title: `${successfulDbFiles.length} File(s) Uploaded Successfully`,
        description: `${successfulDbFiles.map(f => f.file_name).join(', ')} stored.`,
      });
      logActivity("File Upload", `${successfulDbFiles.length} file(s) uploaded and metadata saved.`, { names: successfulDbFiles.map(f => f.file_name) });
    }
    if (!allUploadsSuccessful && selectedFiles.length > successfulDbFiles.length) {
        toast({variant: "warning", title: "Some Uploads Failed", description: "Check individual error messages if any, or try again."});
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };
  
  const handleDeleteFile = async (fileToDelete: AppFile) => {
    if (!user || !fileToDelete.id) return;

    const originalFiles = files;
    setFiles(prevFiles => prevFiles.filter(f => f.id !== fileToDelete.id));

    try {
      const { error: dbError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', fileToDelete.id)
        .eq('user_id', user.id);
      if (dbError) throw dbError;

      if (fileToDelete.storage_path) {
        const { error: storageError } = await supabase.storage
          .from(STORAGE_BUCKET_NAME)
          .remove([fileToDelete.storage_path]);
        if (storageError) {
          console.error("Error deleting file from storage, but DB entry removed:", storageError);
          toast({ variant: "warning", title: "Storage Deletion Issue", description: `Could not remove ${fileToDelete.file_name} from storage. DB entry removed. Error: ${storageError.message}` });
        }
      }
      
      toast({ title: "File Removed", description: `"${fileToDelete.file_name}" has been removed.` });
      logActivity("File Delete", `File removed: "${fileToDelete.file_name}"`, { fileId: fileToDelete.id, storagePath: fileToDelete.storage_path });
    } catch (error) {
      setFiles(originalFiles); 
      toast({ variant: "destructive", title: "Error Removing File", description: (error as Error).message });
      logActivity("Error", `Error removing file: ${(error as Error).message}`, { fileId: fileToDelete.id });
    }
  };

  const handleOpenFile = async (file: AppFile) => {
    if (!file.storage_path) {
      toast({ title: "File Not Stored Correctly", description: "This file does not have a valid storage path." });
      return;
    }
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .createSignedUrl(file.storage_path, 60 * 5); // Signed URL valid for 5 minutes

      if (error) throw error;
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
        logActivity("File Open", `Opened file: ${file.file_name}`, { path: file.storage_path });
      } else {
        toast({ variant: "destructive", title: "Could not get file URL", description: "Unable to generate a link for this file." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error Opening File", description: (error as Error).message });
      logActivity("File Open Error", `Error opening file ${file.file_name}: ${(error as Error).message}`);
    }
  };

  const filteredFiles = files.filter(file => 
    file.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading && !user) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileSelected}
        multiple 
        disabled={isUploading || !user}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FolderOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">My Files &amp; Resources</h1>
        </div>
        <Button onClick={handleUploadClick} disabled={isUploading || !user}>
          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4" />}
          Upload File(s)
        </Button>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Storage Information</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                Files uploaded here are stored in your Supabase Storage bucket named <code className="bg-muted px-1 py-0.5 rounded-sm text-xs">{STORAGE_BUCKET_NAME}</code>.
                Ensure this bucket exists and has appropriate RLS policies for uploads (e.g., based on authenticated user ID in path <code className="bg-muted px-1 py-0.5 rounded-sm text-xs">{"${user_id}/*"}</code>) and access (e.g., public read or signed URLs for viewing).
                The SQL to add a `storage_path` column to your `user_files` table has been provided.
            </p>
        </CardContent>
       </Card>
      
      {isUploading && Object.keys(uploadProgress).length > 0 && (
        <Card className="mt-4">
          <CardHeader><CardTitle>Upload Progress</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="truncate max-w-[70%]">{fileName}</span>
                  {progress === -1 ? <span className="text-destructive">Error</span> : 
                   progress === 100 ? <CheckCircle className="h-5 w-5 text-green-500"/> : 
                   <span className="text-muted-foreground">{progress}%</span>}
                </div>
                {progress >= 0 && <Progress value={progress} className="h-2" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Uploaded Materials</CardTitle>
          <CardDescription>Manage your uploaded files. Showing latest {FILES_FETCH_LIMIT}.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Input 
              placeholder="Search files..." 
              className="max-w-sm" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoadingFiles || !user}
            />
            <Button variant="outline" size="icon" disabled={isLoadingFiles || !user}><Search className="h-4 w-4"/></Button>
          </div>
          {isLoadingFiles ? (
            <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !user ? (
             <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center text-center">
                 <FolderOpen className="h-16 w-16 text-muted-foreground mb-4"/>
                <p className="text-muted-foreground">Please log in to manage your files.</p>
             </div>
          ) : filteredFiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map(file => (
                <Card key={file.id} className="hover:shadow-md transition-shadow flex flex-col bg-card/80">
                  <CardContent className="p-4 flex items-start space-x-3 flex-1">
                    {file.file_type === 'image' ? (
                       <ImageIcon className="h-10 w-10 text-blue-500 flex-shrink-0 mt-1" />
                    ) : file.file_type === 'pdf' ? (
                      <FileText className="h-10 w-10 text-red-500 flex-shrink-0 mt-1" />
                    ) : file.file_type === 'doc' ? (
                      <FileText className="h-10 w-10 text-blue-500 flex-shrink-0 mt-1" />
                    ) : (
                      <FileText className="h-10 w-10 text-muted-foreground flex-shrink-0 mt-1" />
                    )}
                    <div className="overflow-hidden flex-1">
                      <p className="font-semibold truncate text-sm" title={file.file_name}>{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">{file.file_size_text} - {file.original_upload_date ? new Date(file.original_upload_date).toLocaleDateString() : (file.created_at ? new Date(file.created_at).toLocaleDateString() : 'N/A')}</p>
                      <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-xs" onClick={() => handleOpenFile(file)} disabled={!file.storage_path}>
                        <ExternalLink className="mr-1 h-3 w-3"/>Open File
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="p-2 border-t">
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-center text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4 mr-1.5"/> Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove "{file.file_name}" from your list and delete it from storage. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteFile(file)} className="bg-destructive hover:bg-destructive/90">
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex flex-col items-center justify-center text-center">
              <FolderOpen className="h-16 w-16 text-muted-foreground mb-4"/>
              <p className="text-muted-foreground">{searchTerm ? "No files match your search." : "No files uploaded yet."}</p>
              <p className="text-sm text-muted-foreground">Click "Upload File(s)" to add your study materials.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
