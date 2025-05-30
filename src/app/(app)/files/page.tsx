
"use client";
import { useRef, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { UploadCloud, FileText, ImageIcon, FolderOpen, Search, Trash2, ExternalLink, Loader2 } from "lucide-react";
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

interface AppFile {
  id: string; // Supabase UUID
  user_id: string;
  file_name: string;
  file_type: "pdf" | "image" | "doc" | "unknown";
  file_size_text: string;
  original_upload_date?: string; // ISO Date string
  ai_hint?: string;
  created_at?: string;
  local_preview_url?: string; 
}

const FILES_FETCH_LIMIT = 50;

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
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFiles = async () => {
    if (!user) {
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
      toast({ variant: "destructive", title: "Error Fetching Files", description: (error as Error).message });
      logActivity("Error", "Failed to fetch files list", { userId: user.id, error: (error as Error).message });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchFiles();
    } else if (!authLoading && !user) {
        setIsLoadingFiles(false);
        setFiles([]); // Clear files if user logs out
    }
  }, [user, authLoading]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
        toast({variant: "destructive", title: "Not Logged In", description: "Please log in to add files."});
        return;
    }
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      setIsUploading(true);
      const filesToUploadPromises = Array.from(selectedFiles).map(file => {
        const fileData = {
          user_id: user.id,
          file_name: file.name,
          file_type: getFileType(file.name),
          file_size_text: formatFileSize(file.size),
          original_upload_date: new Date().toISOString().split('T')[0],
          ai_hint: file.type.startsWith('image/') ? 'uploaded image' : 'document file',
        };
        return supabase.from('user_files').insert(fileData).select().single();
      });

      try {
        const results = await Promise.all(filesToUploadPromises);
        const newDbFiles: AppFile[] = results.map(res => res.data).filter(Boolean) as AppFile[];
        
        const clientSidePreviews: Partial<Record<string, string>> = {};
        Array.from(selectedFiles).forEach((file, index) => {
            if(newDbFiles[index] && file.type.startsWith('image/')) {
                clientSidePreviews[newDbFiles[index].id] = URL.createObjectURL(file);
            }
        });

        setFiles(prevFiles => [...newDbFiles.map(dbFile => ({...dbFile, local_preview_url: clientSidePreviews[dbFile.id]})), ...prevFiles].slice(0, FILES_FETCH_LIMIT));

        toast({
          title: `${newDbFiles.length} File(s) Added`,
          description: `${newDbFiles.map(f => f.file_name).join(', ')} added to your list.`,
        });
        logActivity("File Add", `${newDbFiles.length} file(s) metadata added`, { names: newDbFiles.map(f => f.file_name)}, user.id);
      } catch (error) {
        toast({ variant: "destructive", title: "Error Adding Files", description: (error as Error).message });
        logActivity("Error", `Error adding files: ${(error as Error).message}`, {userId: user.id});
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; 
        }
      }
    }
  };
  
  const handleDeleteFile = async (fileId: string) => {
    if (!user) return;
    const fileToDelete = files.find(f => f.id === fileId);
    if (!fileToDelete) return;

    if (fileToDelete.local_preview_url) {
      URL.revokeObjectURL(fileToDelete.local_preview_url);
    }

    try {
        const { error } = await supabase
            .from('user_files')
            .delete()
            .eq('id', fileId)
            .eq('user_id', user.id);
        if (error) throw error;
        
        setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
        toast({
            title: "File Removed",
            description: `"${fileToDelete.file_name}" has been removed from your list.`,
            variant: "destructive"
        });
        logActivity("File Delete", `File metadata removed: "${fileToDelete.file_name}"`, { fileId }, user.id);
    } catch (error) {
        toast({ variant: "destructive", title: "Error Removing File", description: (error as Error).message });
        logActivity("Error", `Error removing file metadata: ${(error as Error).message}`, {userId: user.id, fileId});
    }
  };

  const handleOpenFile = (file: AppFile) => {
    if (file.file_type === 'image' && file.local_preview_url) {
        window.open(file.local_preview_url, '_blank');
        if (user) logActivity("File Open Preview", `Opened local image preview: ${file.file_name}`, undefined, user.id);
    } else {
        toast({
            title: "Open File (Info)", 
            description: `This app stores file references. To open "${file.file_name}", you'd typically use a download link if it were stored in cloud storage. For now, only image previews from new selections are directly viewable.`
        });
        if (user) logActivity("File Open Action", `File open action (info): ${file.file_name}`, undefined, user.id);
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
          <UploadCloud className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">My Files &amp; Resources</h1>
        </div>
        <Button onClick={handleUploadClick} disabled={isUploading || !user}>
          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4" />}
          Add File(s)
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Study Materials</CardTitle>
          <CardDescription>Add references to your notes, images, and resources. File metadata is saved to your account. Showing latest {FILES_FETCH_LIMIT}.</CardDescription>
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
                    {file.file_type === 'image' && file.local_preview_url ? (
                       <Image 
                         src={file.local_preview_url} 
                         alt={file.file_name} 
                         data-ai-hint={file.ai_hint || "document placeholder"} 
                         width={64} height={64} 
                         className="rounded object-cover h-16 w-16 border bg-muted"
                         onError={(e) => { e.currentTarget.src = 'https://placehold.co/64x64.png?text=Err'; }}
                       />
                    ) : file.file_type === 'image' ? ( 
                       <ImageIcon className="h-10 w-10 text-blue-500 flex-shrink-0 mt-1" />
                    ) : file.file_type === 'pdf' ? (
                      <FileText className="h-10 w-10 text-destructive flex-shrink-0 mt-1" />
                    ) : file.file_type === 'doc' ? (
                      <FileText className="h-10 w-10 text-blue-500 flex-shrink-0 mt-1" />
                    ) : (
                      <FileText className="h-10 w-10 text-muted-foreground flex-shrink-0 mt-1" />
                    )}
                    <div className="overflow-hidden flex-1">
                      <p className="font-semibold truncate text-sm" title={file.file_name}>{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">{file.file_size_text} - {file.original_upload_date ? new Date(file.original_upload_date).toLocaleDateString() : (file.created_at ? new Date(file.created_at).toLocaleDateString() : 'N/A')}</p>
                      <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-xs" onClick={() => handleOpenFile(file)}>
                        <ExternalLink className="mr-1 h-3 w-3"/>Open/Preview Info
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
                            This will remove the file reference for "{file.file_name}" from your account. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteFile(file.id)} className="bg-destructive hover:bg-destructive/90">
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
              <p className="text-muted-foreground">{searchTerm ? "No files match your search." : "No files added yet."}</p>
              <p className="text-sm text-muted-foreground">Click "Add File(s)" to add references to your study materials.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
