
"use client";
import { useRef, useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { UploadCloud, FileText, ImageIcon, FolderOpen, Search, Trash2, ExternalLink, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import Link from 'next/link';

interface AppFile {
  id: string; 
  user_id: string;
  file_name: string;
  file_type: "pdf" | "image" | "doc" | "unknown";
  file_size_text: string;
  original_upload_date?: string | null;
  ai_hint?: string | null;
  created_at?: string;
  storage_path: string; 
}

const FILES_FETCH_LIMIT = 50;
const STORAGE_BUCKET_NAME = 'user-uploads'; // CORRECTED: Using hyphen

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
  const [uploadProgress, setUploadProgress] = useState<Record<string, { progress: number; error?: string; name: string }>>({});
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
      setFiles((data as AppFile[]) || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Fetching Files List", description: (error as Error).message });
      if(user) logActivity("Error", "Failed to fetch files list", { error: (error as Error).message }, user.id);
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
    const currentUploadProgress: Record<string, { progress: number, error?: string, name: string }> = {};
    Array.from(selectedFiles).forEach(file => {
        currentUploadProgress[file.name + Date.now()] = { progress: 0, name: file.name }; // Use unique key for progress state
    });
    setUploadProgress(currentUploadProgress);

    const uploadPromises = Array.from(selectedFiles).map(async (file, index) => {
      const progressKey = Object.keys(currentUploadProgress)[index]; // Get the unique key

      const sanitizedBaseName = file.name.substring(0, file.name.lastIndexOf('.')).replace(/[^a-zA-Z0-9_.-]/g, '_');
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const uniqueFileNameForStorage = `${sanitizedBaseName}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${uniqueFileNameForStorage}`;

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false, // Set to true if you want to overwrite if file with same path exists
            contentType: file.type,
            // Supabase JS client v2's upload method doesn't have a direct progress callback.
            // For true progress, a more complex setup with XHR or a library like Uppy is needed.
            // We simulate basic steps.
          });
        
        // Simulate upload part done
        setUploadProgress(prev => ({...prev, [progressKey]: { ...prev[progressKey], progress: 50 }}));

        if (uploadError) throw uploadError;
        if (!uploadData) throw new Error("Upload completed but no data returned from Supabase Storage.");

        const fileMetadata: Omit<AppFile, 'id' | 'created_at'> = {
          user_id: user.id,
          file_name: file.name, // Store original file name
          file_type: getFileType(file.name),
          file_size_text: formatFileSize(file.size),
          original_upload_date: new Date().toISOString().split('T')[0],
          ai_hint: file.type.startsWith('image/') ? 'uploaded image' : 'document file',
          storage_path: uploadData.path, 
        };

        const { data: dbData, error: dbError } = await supabase
          .from('user_files')
          .insert(fileMetadata)
          .select()
          .single();

        if (dbError) {
          // If DB insert fails, try to remove the uploaded file from storage
          await supabase.storage.from(STORAGE_BUCKET_NAME).remove([uploadData.path]);
          throw dbError;
        }
        setUploadProgress(prev => ({ ...prev, [progressKey]: { ...prev[progressKey], progress: 100 } }));
        return dbData as AppFile;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown upload error';
        toast({ variant: "destructive", title: `Error Uploading ${file.name}`, description: errorMessage });
        if(user) logActivity("File Upload Error", `Failed to upload ${file.name}: ${errorMessage}`, undefined, user.id);
        setUploadProgress(prev => ({ ...prev, [progressKey]: { ...prev[progressKey], progress: 0, error: errorMessage } }));
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulDbFiles = results.filter(Boolean) as AppFile[];

    if (successfulDbFiles.length > 0) {
      fetchFiles(); 
      toast({
        title: `${successfulDbFiles.length} File(s) Uploaded Successfully`,
        description: `${successfulDbFiles.map(f => f.file_name).join(', ')} stored in Supabase.`,
      });
      if(user) logActivity("File Upload", `${successfulDbFiles.length} file(s) uploaded.`, { names: successfulDbFiles.map(f => f.file_name) }, user.id);
    }
    
    // Clear progress for successful/failed uploads after a delay
    setTimeout(() => {
        setUploadProgress(prev => {
            const newProgress = { ...prev };
            Object.keys(newProgress).forEach(key => {
                if (newProgress[key].progress === 100 || newProgress[key].error) {
                    delete newProgress[key];
                }
            });
            return newProgress;
        });
        if (Object.keys(uploadProgress).length === 0) { // Only set isUploading to false if all done
           setIsUploading(false);
        }
    }, 3000);


    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };
  
  const handleDeleteFile = async (fileToDelete: AppFile) => {
    if (!user || !fileToDelete.id || !fileToDelete.storage_path) return;

    const originalFiles = files;
    setFiles(prevFiles => prevFiles.filter(f => f.id !== fileToDelete.id));

    try {
      const { error: storageError } = await supabase.storage
          .from(STORAGE_BUCKET_NAME)
          .remove([fileToDelete.storage_path]);
      // We might not want to throw an error if storage deletion fails but DB deletion succeeds,
      // or vice versa. Log it, but proceed.
      if (storageError) {
          console.warn("Error deleting file from Supabase Storage, but proceeding with DB record deletion:", storageError);
          toast({variant:"destructive", title: "Storage Deletion Warning", description: `Could not delete ${fileToDelete.file_name} from storage: ${storageError.message}. DB record will still be removed.`});
          logActivity("File Storage Warning", `Failed to delete ${fileToDelete.file_name} from storage, but DB record deletion will proceed.`, { fileId: fileToDelete.id, storagePath: fileToDelete.storage_path, error: storageError.message }, user.id);
      }

      const { error: dbError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', fileToDelete.id)
        .eq('user_id', user.id);
      if (dbError) throw dbError;

      toast({ title: "File Removed", description: `"${fileToDelete.file_name}" has been removed.` });
      if(user) logActivity("File Delete", `File removed: "${fileToDelete.file_name}"`, { fileId: fileToDelete.id, storagePath: fileToDelete.storage_path }, user.id);
    } catch (error) {
      setFiles(originalFiles); 
      toast({ variant: "destructive", title: "Error Removing File", description: (error as Error).message });
      if(user) logActivity("Error", `Error removing file: ${(error as Error).message}`, { fileId: fileToDelete.id }, user.id);
    }
  };

  const handleOpenFile = async (file: AppFile) => {
    if (!user || !file.storage_path) {
      toast({ variant: "destructive", title: "File Not Stored Correctly", description: "This file does not have a valid storage path." });
      return;
    }
    try {
      // Create a signed URL for temporary access (e.g., 5 minutes)
      // This is generally safer than relying on public URLs, especially if your bucket isn't fully public.
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .createSignedUrl(file.storage_path, 60 * 5); // Expires in 5 minutes

      if (error) throw error;
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
        if(user) logActivity("File Open", `Opened file: ${file.file_name}`, { path: file.storage_path }, user.id);
      } else {
        toast({ variant: "destructive", title: "Could not get file URL", description: "Unable to generate a link for this file." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error Opening File", description: (error as Error).message });
      if(user) logActivity("File Open Error", `Error opening file ${file.file_name}: ${(error as Error).message}`, undefined, user.id);
    }
  };

  const filteredFiles = files.filter(file => 
    file.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading && !user) { // Show main loader if auth is determining user state
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user && !authLoading) { // If auth is done and no user, show login prompt
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <FolderOpen className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">Please log in to manage your files.</p>
        <Link href="/login" passHref>
          <Button>Log In</Button>
        </Link>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileSelected}
        multiple // Allow multiple file selection
        disabled={isUploading || !user}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FolderOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">My Files &amp; Resources</h1>
        </div>
        <Button onClick={handleUploadClick} disabled={isUploading || !user}>
          {isUploading && Object.values(uploadProgress).some(p => p.progress > 0 && p.progress < 100) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4" />}
          {isUploading && Object.values(uploadProgress).some(p => p.progress > 0 && p.progress < 100) ? 'Uploading...' : 'Upload File(s)'}
        </Button>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Storage Information</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                Files are uploaded to Supabase Storage in the bucket named <code className="bg-muted px-1 py-0.5 rounded-sm text-xs">{STORAGE_BUCKET_NAME}</code> under your user ID (e.g., <code className="bg-muted px-1 py-0.5 rounded-sm text-xs">{"{user_id}/yourfile.pdf"}</code>).
                Metadata is stored in the <code className="bg-muted px-1 py-0.5 rounded-sm text-xs">user_files</code> table.
                Ensure the storage bucket exists and has RLS policies allowing authenticated uploads to the user's folder and appropriate read access (e.g., via signed URLs).
            </p>
        </CardContent>
       </Card>
      
      {Object.keys(uploadProgress).length > 0 && (
        <Card className="mt-4">
          <CardHeader><CardTitle>Upload Progress</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(uploadProgress).map(([key, status]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="truncate max-w-[70%]">{status.name}</span>
                  {status.error ? <span className="text-destructive">Error</span> : 
                   status.progress === 100 ? <CheckCircle className="h-5 w-5 text-green-500"/> : 
                   <span className="text-muted-foreground">{status.progress}%</span>}
                </div>
                {status.progress >= 0 && !status.error && <Progress value={status.progress} className="h-2" />}
                {status.error && <p className="text-xs text-destructive">{status.error}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Uploaded Materials</CardTitle>
          <CardDescription>Manage your uploaded files from Supabase. Showing latest {FILES_FETCH_LIMIT}.</CardDescription>
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
                            This will remove "{file.file_name}" from your list and delete it from Supabase storage. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteFile(fileToDelete)} className="bg-destructive hover:bg-destructive/90">
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

    