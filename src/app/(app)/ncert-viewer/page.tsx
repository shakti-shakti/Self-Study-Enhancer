
"use client";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { BookOpen, Download, Edit, ZoomIn, ZoomOut, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logActivity } from '@/lib/activity-logger';

const availableBooks = [
  { id: "physics_xi", name: "Physics XI", chapters: ["Physical World", "Units and Measurement", "Motion in a Straight Line", "Laws of Motion", "Work, Energy and Power"] },
  { id: "chemistry_xi", name: "Chemistry XI", chapters: ["Some Basic Concepts of Chemistry", "Structure of Atom", "Classification of Elements", "Chemical Bonding", "States of Matter"] },
  { id: "biology_xi", name: "Biology XI", chapters: ["The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom", "Morphology of Flowering Plants"] },
  { id: "physics_xii", name: "Physics XII", chapters: ["Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter"] },
];

const chapterMockContent: Record<string, string[]> = {
  "Physical World": ["Introduction to Physics", "Scope and Excitement of Physics", "Fundamental Forces in Nature", "Nature of Physical Laws"],
  "Units and Measurement": ["The International System of Units", "Measurement of Length, Mass and Time", "Accuracy, Precision of Instruments and Errors in Measurement", "Significant Figures", "Dimensions of Physical Quantities"],
  "Motion in a Straight Line": ["Position, Path Length and Displacement", "Average Velocity and Average Speed", "Instantaneous Velocity and Speed", "Acceleration", "Kinematic Equations for Uniformly Accelerated Motion"],
  "Some Basic Concepts of Chemistry": ["Importance of Chemistry", "Nature of Matter", "Properties of Matter and their Measurement", "Uncertainty in Measurement", "Laws of Chemical Combinations"],
  "The Living World": ["What is Living?", "Diversity in the Living World", "Taxonomic Categories", "Taxonomical Aids"],
  "Electric Charges and Fields": ["Introduction to Electric Charge", "Conductors and Insulators", "Charging by Induction", "Basic Properties of Electric Charge", "Coulomb's Law"],
};


export default function NcertViewerPage() {
  const { toast } = useToast();
  const [selectedBook, setSelectedBook] = useState<typeof availableBooks[0] | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  const handleBookSelect = (bookId: string) => {
    const book = availableBooks.find(b => b.id === bookId);
    setSelectedBook(book || null);
    setSelectedChapter(null); 
    if (book) {
      toast({ title: `Selected: ${book.name}`, description: "Choose a chapter to view." });
      logActivity("NCERT Viewer", `Selected book: ${book.name}`);
    }
  };

  const handleChapterSelect = (chapterName: string) => {
    setSelectedChapter(chapterName);
    toast({ title: `Chapter: ${chapterName}`, description: "Displaying content." });
    if (selectedBook) {
        logActivity("NCERT Viewer", `Viewed chapter: ${chapterName} from ${selectedBook.name}`);
    }
  };

  const handleDownloadBook = () => {
    if (selectedBook) {
        toast({ title: "Download Started (Mock)", description: `Simulating download for ${selectedBook.name}...` });
        logActivity("NCERT Viewer", `Attempted download for book: ${selectedBook.name}`);
    } else {
        toast({ title: "No Book Selected", description: "Please select a book first.", variant: "destructive" });
    }
  };

  const handleViewerAction = (action: string) => {
    if (selectedChapter) {
        toast({ title: `Action: ${action} (Mock)`, description: `Performing ${action.toLowerCase()} on "${selectedChapter}".` });
        logActivity("NCERT Viewer", `Viewer action: ${action} on chapter ${selectedChapter}`);
    } else {
         toast({ title: "No Chapter Selected", description: "Please select a chapter first.", variant: "destructive" });
    }
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
          <CardDescription>Download, save, view chapters, and make notes directly on your NCERT books. (Content is mock)</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
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
              <Button variant="outline" className="w-full" onClick={handleDownloadBook} disabled={!selectedBook}>
                <Download className="mr-2 h-4 w-4" /> Download Selected Book
              </Button>
            </CardFooter>
          </Card>
          
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
            <Card className="flex-1 border rounded-lg bg-muted/30 flex overflow-hidden">
              {selectedBook && (
                <ScrollArea className="w-1/3 md:w-1/4 p-2 border-r border-border">
                   <h3 className="font-medium mb-2 p-2 text-base sticky top-0 bg-muted/50 z-10">Chapters</h3>
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
                    {(chapterMockContent[selectedChapter] || ["This is mock content for the selected chapter. In a real application, actual chapter text or PDF would be rendered here."]).map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                    <p className="mt-4 text-xs text-muted-foreground">End of mock content for {selectedChapter}.</p>
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
