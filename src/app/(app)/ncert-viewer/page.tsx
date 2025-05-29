
"use client";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { BookOpen, Download, Edit, ZoomIn, ZoomOut, FileText, Link as LinkIcon } from "lucide-react"; // Added LinkIcon
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logActivity } from '@/lib/activity-logger';

// Example: Map book IDs to potential direct PDF URLs (replace with actual URLs)
const bookPdfUrls: Record<string, string> = {
  "physics_xi": "https://ncert.nic.in/textbook/pdf/keph1ps.zip", // Example: This is a ZIP, ideally direct PDF
  "chemistry_xi": "https://ncert.nic.in/textbook/pdf/kech1ps.zip",
  "biology_xi": "https://ncert.nic.in/textbook/pdf/kebl1ps.zip",
  // Add more actual PDF URLs here for chapters or full books
};
// Example: Map chapter names to specific PDF page or anchor if available, or just a placeholder URL
const chapterPdfLinks: Record<string, string> = {
    "Physical World": "https://ncert.nic.in/textbook/pdf/keph101.pdf", // Example chapter PDF
    "Units and Measurement": "https://ncert.nic.in/textbook/pdf/keph102.pdf",
    // ... more specific chapter links
};


const availableBooks = [
  { id: "physics_xi", name: "Physics XI", chapters: ["Physical World", "Units and Measurement", "Motion in a Straight Line", "Laws of Motion", "Work, Energy and Power"] },
  { id: "chemistry_xi", name: "Chemistry XI", chapters: ["Some Basic Concepts of Chemistry", "Structure of Atom", "Classification of Elements", "Chemical Bonding", "States of Matter"] },
  { id: "biology_xi", name: "Biology XI", chapters: ["The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom", "Morphology of Flowering Plants"] },
  { id: "physics_xii", name: "Physics XII", chapters: ["Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter"] },
];

const chapterMockContent: Record<string, string[]> = {
  "Physical World": ["Introduction to Physics", "Scope and Excitement of Physics", "Fundamental Forces in Nature", "Nature of Physical Laws. This chapter explores the very basics of what physics is."],
  "Units and Measurement": ["The International System of Units", "Measurement of Length, Mass and Time", "Accuracy, Precision of Instruments and Errors in Measurement", "Significant Figures", "Dimensions of Physical Quantities. Essential for all quantitative science."],
  "Motion in a Straight Line": ["Position, Path Length and Displacement", "Average Velocity and Average Speed", "Instantaneous Velocity and Speed", "Acceleration", "Kinematic Equations for Uniformly Accelerated Motion. Describes the fundamentals of movement."],
  "Some Basic Concepts of Chemistry": ["Importance of Chemistry", "Nature of Matter", "Properties of Matter and their Measurement", "Uncertainty in Measurement", "Laws of Chemical Combinations. Foundation for all chemistry."],
  "The Living World": ["What is Living?", "Diversity in the Living World", "Taxonomic Categories", "Taxonomical Aids. Introduces the study of life."],
  "Electric Charges and Fields": ["Introduction to Electric Charge", "Conductors and Insulators", "Charging by Induction", "Basic Properties of Electric Charge", "Coulomb's Law. First chapter in electromagnetism."],
};


export default function NcertViewerPage() {
  const { toast } = useToast();
  const [selectedBook, setSelectedBook] = useState<typeof availableBooks[0] | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);

  const handleBookSelect = (bookId: string) => {
    const book = availableBooks.find(b => b.id === bookId);
    setSelectedBook(book || null);
    setSelectedChapter(null); 
    setCurrentPdfUrl(null); // Clear PDF URL when book changes
    if (book) {
      toast({ title: `Selected: ${book.name}`, description: "Choose a chapter to view or download the full book." });
      logActivity("NCERT Viewer", `Selected book: ${book.name}`);
    }
  };

  const handleChapterSelect = (chapterName: string) => {
    setSelectedChapter(chapterName);
    const chapterLink = chapterPdfLinks[chapterName];
    if (chapterLink) {
      setCurrentPdfUrl(chapterLink);
      toast({ title: `Chapter: ${chapterName}`, description: "Displaying PDF. Annotation features are external." });
       logActivity("NCERT Viewer", `Viewing chapter PDF: ${chapterName}`);
    } else {
      setCurrentPdfUrl(null); // No specific PDF for this chapter in our mock data
      toast({ title: `Chapter: ${chapterName}`, description: "Displaying mock content. PDF link not available for this chapter." });
      logActivity("NCERT Viewer", `Viewed chapter (mock content): ${chapterName} from ${selectedBook?.name}`);
    }
  };

  const handleDownloadBook = () => {
    if (selectedBook) {
        const bookUrl = bookPdfUrls[selectedBook.id];
        if (bookUrl) {
            window.open(bookUrl, '_blank'); // Open the download link in a new tab
            toast({ title: "Download Initialized", description: `Attempting to download ${selectedBook.name}... Your browser will handle the file.` });
            logActivity("NCERT Viewer", `Initiated download for book: ${selectedBook.name}`, { url: bookUrl });
        } else {
            toast({ title: "Download URL Missing", description: `No download link configured for ${selectedBook.name}.`, variant: "destructive" });
            logActivity("NCERT Viewer", `Download failed (URL missing) for book: ${selectedBook.name}`);
        }
    } else {
        toast({ title: "No Book Selected", description: "Please select a book first.", variant: "destructive" });
    }
  };
  
  const handleOpenChapterPdfExternally = () => {
     if (currentPdfUrl) {
        window.open(currentPdfUrl, '_blank');
        toast({ title: "Opening PDF", description: `Opening chapter PDF in a new tab for full browser features.` });
        logActivity("NCERT Viewer", `Opened chapter PDF externally: ${selectedChapter}`);
    } else {
        toast({ title: "No PDF Selected", description: "No chapter PDF is currently loaded.", variant: "destructive" });
    }
  }


  const handleViewerAction = (action: string) => {
     if (currentPdfUrl) { // Action relevant if PDF is loaded
        toast({ title: `Action: ${action} (on PDF)`, description: `For ${action.toLowerCase()} on "${selectedChapter}", use your PDF viewer's tools after opening externally.` });
        logActivity("NCERT Viewer", `Viewer action info: ${action} on chapter ${selectedChapter}`);
    } else if (selectedChapter) { // Action on mock content
        toast({ title: `Action: ${action} (Mock)`, description: `Performing ${action.toLowerCase()} on mock content for "${selectedChapter}".` });
        logActivity("NCERT Viewer", `Viewer action (mock): ${action} on chapter ${selectedChapter}`);
    } else {
         toast({ title: "No Content Selected", description: "Please select a chapter first.", variant: "destructive" });
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
          <CardDescription>Access NCERT books. View chapters as PDFs or download them. Annotation requires external tools.</CardDescription>
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
                <Download className="mr-2 h-4 w-4" /> Download Full Book
              </Button>
            </CardFooter>
          </Card>
          
          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-semibold truncate max-w-xs sm:max-w-sm md:max-w-md">
                {selectedBook ? selectedBook.name : "Select a Book"}
                {selectedChapter && ` - ${selectedChapter}`}
              </h2>
              <div className="flex space-x-2">
                 {currentPdfUrl && (
                  <Button variant="outline" size="icon" onClick={handleOpenChapterPdfExternally} title="Open PDF in new tab">
                    <LinkIcon className="h-5 w-5"/>
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={() => handleViewerAction("Zoom In")} disabled={!selectedChapter}><ZoomIn className="h-5 w-5"/></Button>
                <Button variant="outline" size="icon" onClick={() => handleViewerAction("Zoom Out")} disabled={!selectedChapter}><ZoomOut className="h-5 w-5"/></Button>
                <Button variant="outline" size="icon" onClick={() => handleViewerAction("Edit/Annotate")} disabled={!selectedChapter}><Edit className="h-5 w-5"/></Button>
              </div>
            </div>
            <Card className="flex-1 border rounded-lg bg-muted/30 flex overflow-hidden">
              {selectedBook && (
                <ScrollArea className="w-1/3 md:w-1/4 p-2 border-r border-border">
                   <h3 className="font-medium mb-2 p-2 text-base sticky top-0 bg-muted/80 backdrop-blur-sm z-10">Chapters</h3>
                  {selectedBook.chapters.map(chapter => (
                    <Button 
                      key={chapter} 
                      variant={selectedChapter === chapter ? "secondary" : "ghost"} 
                      className="w-full justify-start text-left h-auto py-1.5 px-2 text-sm mb-1 truncate"
                      onClick={() => handleChapterSelect(chapter)}
                      title={chapter}
                    >
                      {chapter}
                    </Button>
                  ))}
                </ScrollArea>
              )}
              <div className="flex-1">
                {currentPdfUrl ? (
                    <iframe 
                        src={currentPdfUrl} 
                        title={selectedChapter || "PDF Document"} 
                        className="w-full h-full border-0"
                        onError={() => {
                             toast({variant: "destructive", title: "PDF Load Error", description: "Could not embed PDF. Try opening externally."});
                             setCurrentPdfUrl(null); // Fallback to mock content display
                        }}
                    />
                ) : (
                  <ScrollArea className="h-full p-4">
                    {!selectedBook && (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <BookOpen className="h-16 w-16 text-muted-foreground mb-4"/>
                        <p className="text-muted-foreground">Select a book from the left panel.</p>
                      </div>
                    )}
                    {selectedBook && !selectedChapter && (
                       <div className="h-full flex flex-col items-center justify-center text-center">
                        <FileText className="h-16 w-16 text-muted-foreground mb-4"/>
                        <p className="text-muted-foreground">Select a chapter to view its content or PDF.</p>
                      </div>
                    )}
                    {selectedChapter && !currentPdfUrl && ( // Display mock content if no PDF URL
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <h3 className="text-lg font-semibold mb-2">{selectedChapter}</h3>
                        {(chapterMockContent[selectedChapter] || ["This is mock content. If available, the PDF would be shown here or can be opened externally."]).map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                        <p className="mt-4 text-xs text-muted-foreground">End of mock content for {selectedChapter}.</p>
                      </div>
                    )}
                  </ScrollArea>
                )}
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
