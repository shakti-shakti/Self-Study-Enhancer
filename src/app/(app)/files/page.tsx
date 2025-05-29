
"use client";
import { useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { UploadCloud, FileText, ImageIcon, FolderOpen, Search, Trash2 } from "lucide-react";
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

interface AppFile {
  id: string;
  name: string;
  type: "pdf" | "image" | "doc" | "unknown";
  size: string;
  date: string;
  preview?: string; // URL for images
  aiHint?: string;
  fileObject?: File; // Actual file object for uploads
}

const initialFiles: AppFile[] = [
  { id: "1", name: "Physics_Notes_Ch1.pdf", type: "pdf", size: "2.3MB", date: "2023-10-26" },
  { id: "2", name: "Cell_Diagram.png", type: "image", size: "800KB", date: "2023-10-25", preview: "https://placehold.co/100x100.png", aiHint: "biology cell" },
  { id: "3", name: "Chemistry_Reactions.docx", type: "doc", size: "1.1MB", date: "2023-10-24" },
];

function getFileType(fileName: string): "pdf" | "image" | "doc" | "unknown" {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension || '')) return 'image';
  if (['doc', 'docx'].includes(extension || '')) return 'doc';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<AppFile[]>(initialFiles);
  const [searchTerm, setSearchTerm] = useState('');

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const newAppFiles: AppFile[] = Array.from(selectedFiles).map(file => ({
        id: crypto.randomUUID(),
        name: file.name,
        type: getFileType(file.name),
        size: formatFileSize(file.size),
        date: new Date().toISOString().split('T')[0],
        fileObject: file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        aiHint: file.type.startsWith('image/') ? 'uploaded image' : 'document file'
      }));
      setFiles(prevFiles => [...newAppFiles, ...prevFiles]);
      toast({
        title: `${newAppFiles.length} File(s) Added`,
        description: `${newAppFiles.map(f => f.name).join(', ')} ready for processing.`,
      });
      // Reset file input to allow selecting the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  const handleDeleteFile = (fileId: string) => {
    setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
    toast({
      title: "File Deleted",
      description: `The file has been removed from your list.`,
      variant: "destructive"
    });
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileSelected}
        multiple // Allow multiple file selection
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UploadCloud className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">My Files &amp; Resources</h1>
        </div>
        <Button onClick={handleUploadClick}>
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload File(s)
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Study Materials</CardTitle>
          <CardDescription>Upload and save notes (PDFs, Docs), images, and any helpful resources for easy access.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Input 
              placeholder="Search files..." 
              className="max-w-sm" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline" size="icon"><Search className="h-4 w-4"/></Button>
          </div>
          {filteredFiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map(file => (
                <Card key={file.id} className="hover:shadow-md transition-shadow flex flex-col">
                  <CardContent className="p-4 flex items-start space-x-3 flex-1">
                    {file.type === 'image' && file.preview ? (
                       <Image 
                         src={file.preview} 
                         alt={file.name} 
                         data-ai-hint={file.aiHint || "document placeholder"} 
                         width={64} height={64} 
                         className="rounded object-cover h-16 w-16 border bg-muted"
                         onError={(e) => { e.currentTarget.src = 'https://placehold.co/64x64.png?text=Error'; }}
                       />
                    ) : file.type === 'pdf' ? (
                      <FileText className="h-10 w-10 text-destructive flex-shrink-0 mt-1" />
                    ) : file.type === 'doc' ? (
                      <FileText className="h-10 w-10 text-blue-500 flex-shrink-0 mt-1" />
                    ) : (
                      <FileText className="h-10 w-10 text-muted-foreground flex-shrink-0 mt-1" />
                    )}
                    <div className="overflow-hidden flex-1">
                      <p className="font-semibold truncate text-sm" title={file.name}>{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.size} - {file.date}</p>
                      <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-xs" onClick={() => toast({title: "Open Action (Mock)", description: `Opening ${file.name}`})}>Open</Button>
                    </div>
                  </CardContent>
                  <CardFooter className="p-2 border-t">
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-center text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4 mr-1.5"/> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the file "{file.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteFile(file.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete
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
