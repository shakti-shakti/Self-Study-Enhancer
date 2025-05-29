
"use client";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BookOpen, Download, Edit, ZoomIn, ZoomOut, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const availableBooks = [
  { id: "physics_xi", name: "Physics XI", chapters: ["Physical World", "Units and Measurement", "Motion in a Straight Line"] },
  { id: "chemistry_xi", name: "Chemistry XI", chapters: ["Some Basic Concepts of Chemistry", "Structure of Atom", "Classification of Elements"] },
  { id: "biology_xi", name: "Biology XI", chapters: ["The Living World", "Biological Classification", "Plant Kingdom"] },
  { id: "physics_xii", name: "Physics XII", chapters: ["Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity"] },
];

export default function NcertViewerPage() {
  const { toast } = useToast();
  const [selectedBook, setSelectedBook] = useState<typeof availableBooks[0] | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  const handleBookSelect = (bookId: string) => {
    const book = availableBooks.find(b => b.id === bookId);
    setSelectedBook(book || null);
    setSelectedChapter(null); // Reset chapter when book changes
    if (book) {
      toast({ title: `Selected: ${book.name}`, description: "Choose a chapter to view." });
    }
  };

  const handleChapterSelect = (chapterName: string) => {
    setSelectedChapter(chapterName);
    toast({ title: `Chapter: ${chapterName}`, description: "Displaying content (mock)." });
  };

  const handleDownloadBook = () => {
    toast({ title: "Download Started (Mock)", description: "Your book is being downloaded..." });
  };

  const handleViewerAction = (action: string) => {
    toast({ title: `Action: ${action} (Mock)`, description: `Performing ${action.toLowerCase()} operation on the document.` });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center space-x-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">NCERT Book Viewer</h1>
      </div>
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle>Your Digital Textbooks</CardTitle>
          <CardDescription>Download, save, view chapters, and make notes directly on your NCERT books.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
          {/* Sidebar for book list */}
          <Card className="w-full md:w-1/3 lg:w-1/4 flex flex-col bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">My Books</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-4 space-y-2">
              {availableBooks.map(book => (
                <Button 
                  key={book.id} 
                  variant={selectedBook?.id === book.id ? "secondary" : "ghost"} 
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => handleBookSelect(book.id)}
                >
                  {book.name}
                </Button>
              ))}
            </ScrollArea>
            <CardFooter className="p-4">
              <Button variant="outline" className="w-full" onClick={handleDownloadBook}>
                <Download className="mr-2 h-4 w-4" /> Download New Book
              </Button>
            </CardFooter>
          </Card>
          
          {/* Main viewer area */}
          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {selectedBook ? selectedBook.name : "Select a Book"}
                {selectedChapter && ` - ${selectedChapter}`}
              </h2>
              <div className="flex space-x-2">
                <Button variant="outline" size="icon" onClick={() => handleViewerAction("Zoom In")} disabled={!selectedChapter}><ZoomIn className="h-5 w-5"/></Button>
                <Button variant="outline" size="icon" onClick={() => handleViewerAction("Zoom Out")} disabled={!selectedChapter}><ZoomOut className="h-5 w-5"/></Button>
                <Button variant="outline" size="icon" onClick={() => handleViewerAction("Edit/Annotate")} disabled={!selectedChapter}><Edit className="h-5 w-5"/></Button>
              </div>
            </div>
            <Card className="flex-1 p-2 border rounded-lg bg-muted/30 flex flex-col">
              {selectedBook && (
                <ScrollArea className="w-1/3 md:w-1/4 p-2 border-r">
                   <h3 className="font-medium mb-2 p-2 text-base">Chapters</h3>
                  {selectedBook.chapters.map(chapter => (
                    <Button 
                      key={chapter} 
                      variant={selectedChapter === chapter ? "secondary" : "ghost"} 
                      className="w-full justify-start text-left h-auto py-1.5 px-2 text-sm mb-1"
                      onClick={() => handleChapterSelect(chapter)}
                    >
                      {chapter}
                    </Button>
                  ))}
                </ScrollArea>
              )}
              <ScrollArea className="flex-1 p-4">
                {!selectedBook && (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground mb-4"/>
                    <p className="text-muted-foreground">Select a book from the left panel to view its content and chapters.</p>
                  </div>
                )}
                {selectedBook && !selectedChapter && (
                   <div className="h-full flex flex-col items-center justify-center text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4"/>
                    <p className="text-muted-foreground">Please select a chapter from the list to view its content.</p>
                  </div>
                )}
                {selectedChapter && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <h3 className="text-lg font-semibold mb-2">{selectedChapter}</h3>
                    <p>Mock content for {selectedChapter}. In a real application, the PDF or text content of the chapter would be displayed here. This could involve using a PDF rendering library or fetching HTML content.</p>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                    {/* More mock content */}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
