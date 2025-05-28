
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { UploadCloud, FileText, ImageIcon, FolderOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function FilesPage() {
  // Placeholder files
  const files = [
    { id: 1, name: "Physics_Notes_Ch1.pdf", type: "pdf", size: "2.3MB", date: "2023-10-26" },
    { id: 2, name: "Cell_Diagram.png", type: "image", size: "800KB", date: "2023-10-25", preview: "https://placehold.co/100x100.png" , aiHint: "biology cell" },
    { id: 3, name: "Chemistry_Reactions.docx", type: "doc", size: "1.1MB", date: "2023-10-24" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UploadCloud className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">My Files &amp; Resources</h1>
        </div>
        <Button>
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Study Materials</CardTitle>
          <CardDescription>Upload and save notes (PDFs, Docs), images, and any helpful resources for easy access.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Input placeholder="Search files..." className="max-w-sm"/>
            <Button variant="outline"><Search className="h-4 w-4"/></Button>
          </div>
          {files.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map(file => (
                <Card key={file.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-start space-x-3">
                    {file.type === 'image' && file.preview ? (
                       <Image src={file.preview} alt={file.name} data-ai-hint={file.aiHint || "document placeholder"} width={64} height={64} className="rounded object-cover h-16 w-16" />
                    ) : file.type === 'pdf' ? (
                      <FileText className="h-10 w-10 text-destructive flex-shrink-0 mt-1" />
                    ) : (
                      <FileText className="h-10 w-10 text-blue-500 flex-shrink-0 mt-1" />
                    )}
                    <div>
                      <p className="font-semibold truncate" title={file.name}>{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.size} - {file.date}</p>
                      <Button variant="link" size="sm" className="p-0 h-auto mt-1">Open</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex flex-col items-center justify-center text-center">
              <FolderOpen className="h-16 w-16 text-muted-foreground mb-4"/>
              <p className="text-muted-foreground">No files uploaded yet.</p>
              <p className="text-sm text-muted-foreground">Click "Upload File" to add your study materials.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
