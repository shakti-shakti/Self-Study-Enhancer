
"use client";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { BookOpen, Download, Edit, ZoomIn, ZoomOut, FileText, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logActivity } from '@/lib/activity-logger';

// Example: Map book IDs to potential direct PDF URLs (replace with actual URLs from NCERT or other sources)
const bookPdfUrls: Record<string, string> = {
  "physics_xi_part1": "https://ncert.nic.in/textbook/pdf/keph1ps.zip", // Example: Physics XI Part 1 (often full books are ZIPs)
  "physics_xi_part2": "https://ncert.nic.in/textbook/pdf/keph2ps.zip", // Example: Physics XI Part 2
  "chemistry_xi_part1": "https://ncert.nic.in/textbook/pdf/kech1ps.zip",
  // It's better to link to the main NCERT page for book downloads if direct combined PDFs aren't reliably available.
  // e.g., "https://ncert.nic.in/textbook.php"
};

// Example: Map chapter IDs (bookId_chapterIndex) to specific PDF chapter URLs
const chapterPdfLinks: Record<string, string> = {
    "physics_xi_part1_0": "https://ncert.nic.in/textbook/pdf/keph101.pdf", // Chapter 1: Physical World
    "physics_xi_part1_1": "https://ncert.nic.in/textbook/pdf/keph102.pdf", // Chapter 2: Units and Measurement
    "physics_xi_part1_2": "https://ncert.nic.in/textbook/pdf/keph103.pdf", // Motion in a Straight Line
    "chemistry_xi_part1_0": "https://ncert.nic.in/textbook/pdf/kech101.pdf", // Some Basic Concepts of Chemistry
    "biology_xi_0": "https://ncert.nic.in/textbook/pdf/kebl101.pdf", // The Living World
    // Add more direct chapter PDF links as available. These are examples.
};

interface Chapter {
  id: string; // unique ID for the chapter, e.g., bookId_chapterIndex
  name: string;
  mockContent?: string[]; // For fallback if PDF not available
}
interface Book {
  id: string;
  name: string;
  chapters: Chapter[];
  fullBookDownloadUrl?: string; // URL for downloading the entire book (can be a ZIP or a page)
}


const availableBooks: Book[] = [
  { 
    id: "physics_xi_part1", 
    name: "Physics XI - Part 1", 
    chapters: [
      { id: "physics_xi_part1_0", name: "Physical World", mockContent: ["Introduction to Physics...", "Fundamental Forces..."] },
      { id: "physics_xi_part1_1", name: "Units and Measurement", mockContent: ["SI Units...", "Errors in Measurement..."] },
      { id: "physics_xi_part1_2", name: "Motion in a Straight Line" },
      { id: "physics_xi_part1_3", name: "Motion in a Plane" },
      { id: "physics_xi_part1_4", name: "Laws of Motion" },
      { id: "physics_xi_part1_5", name: "Work, Energy and Power" },
      { id: "physics_xi_part1_6", name: "System of Particles and Rotational Motion" },
      { id: "physics_xi_part1_7", name: "Gravitation" },
    ],
    fullBookDownloadUrl: bookPdfUrls["physics_xi_part1"] || "https://ncert.nic.in/textbook.php"
  },
  { 
    id: "chemistry_xi_part1", 
    name: "Chemistry XI - Part 1", 
    chapters: [
        {id: "chemistry_xi_part1_0", name: "Some Basic Concepts of Chemistry"},
        {id: "chemistry_xi_part1_1", name: "Structure of Atom"},
        {id: "chemistry_xi_part1_2", name: "Classification of Elements and Periodicity in Properties"},
        {id: "chemistry_xi_part1_3", name: "Chemical Bonding and Molecular Structure"},
        {id: "chemistry_xi_part1_4", name: "States of Matter: Gases and Liquids"},
        {id: "chemistry_xi_part1_5", name: "Chemical Thermodynamics"},
        {id: "chemistry_xi_part1_6", name: "Equilibrium"},
    ],
    fullBookDownloadUrl: bookPdfUrls["chemistry_xi_part1"] || "https://ncert.nic.in/textbook.php"
  },
  { 
    id: "biology_xi", 
    name: "Biology XI", 
    chapters: [
        {id: "biology_xi_0", name: "The Living World"},
        {id: "biology_xi_1", name: "Biological Classification"},
        {id: "biology_xi_2", name: "Plant Kingdom"},
        {id: "biology_xi_3", name: "Animal Kingdom"},
        // ... Add all Biology XI chapters
    ],
    fullBookDownloadUrl: "https://ncert.nic.in/textbook.php" // General link if specific not available
  },
  // ... Add more books like Physics XII, Chemistry XII, Biology XII with their chapters
];


export default function NcertViewerPage() {
  const { toast } = useToast();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<boolean>(false);

  const handleBookSelect = (bookId: string) => {
    const book = availableBooks.find(b => b.id === bookId);
    setSelectedBook(book || null);
    setSelectedChapter(null); 
    setCurrentPdfUrl(null);
    setPdfError(false);
    if (book) {
      toast({ title: `Selected: ${book.name}`, description: "Choose a chapter to view or download the full book." });
      logActivity("NCERT Viewer", `Selected book: ${book.name}`);
    }
  };

  const handleChapterSelect = (chapterId: string) => {
    const chapter = selectedBook?.chapters.find(c => c.id === chapterId);
    if (chapter) {
        setSelectedChapter(chapter);
        const chapterLink = chapterPdfLinks[chapter.id]; // Use chapter.id for lookup
        if (chapterLink) {
          setCurrentPdfUrl(chapterLink);
          setPdfError(false);
          toast({ title: `Chapter: ${chapter.name}`, description: "Attempting to display PDF. Annotation features are external." });
          logActivity("NCERT Viewer", `Viewing chapter PDF: ${chapter.name}`);
        } else {
          setCurrentPdfUrl(null);
          setPdfError(false);
          toast({ title: `Chapter: ${chapter.name}`, description: "Displaying mock content. PDF link not available for this chapter in mock data." });
          logActivity("NCERT Viewer", `Viewed chapter (mock content): ${chapter.name} from ${selectedBook?.name}`);
        }
    }
  };

  const handleDownloadBook = () => {
    if (selectedBook?.fullBookDownloadUrl) {
        window.open(selectedBook.fullBookDownloadUrl, '_blank');
        toast({ title: "Download Initialized", description: `Attempting to download ${selectedBook.name}... Your browser will handle the file.` });
        logActivity("NCERT Viewer", `Initiated download for book: ${selectedBook.name}`, { url: selectedBook.fullBookDownloadUrl });
    } else if (selectedBook) {
        toast({ title: "Download URL Missing", description: `No specific download link configured for ${selectedBook.name}. Visit ncert.nic.in.`, variant: "destructive" });
        logActivity("NCERT Viewer", `Download failed (URL missing) for book: ${selectedBook.name}`);
    } else {
        toast({ title: "No Book Selected", description: "Please select a book first.", variant: "destructive" });
    }
  };
  
  const handleOpenChapterPdfExternally = () => {
     if (currentPdfUrl) {
        window.open(currentPdfUrl, '_blank');
        toast({ title: "Opening PDF", description: `Opening chapter PDF in a new tab for full browser features.` });
        logActivity("NCERT Viewer", `Opened chapter PDF externally: ${selectedChapter?.name}`);
    } else {
        toast({ title: "No PDF Selected", description: "No chapter PDF is currently loaded or link available.", variant: "destructive" });
    }
  }

  const handleViewerAction = (action: string) => {
     if (currentPdfUrl || selectedChapter) { 
        toast({ title: `Action: ${action}`, description: `For ${action.toLowerCase()} on "${selectedChapter?.name}", please use your PDF viewer's tools after opening externally.` });
        logActivity("NCERT Viewer", `Viewer action info: ${action} on chapter ${selectedChapter?.name}`);
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
          <CardDescription>Access NCERT books. View chapters as PDFs or download them. Annotation requires external PDF tools.</CardDescription>
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
                {selectedChapter && ` - ${selectedChapter.name}`}
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
                      key={chapter.id} 
                      variant={selectedChapter?.id === chapter.id ? "secondary" : "ghost"} 
                      className="w-full justify-start text-left h-auto py-1.5 px-2 text-sm mb-1 truncate"
                      onClick={() => handleChapterSelect(chapter.id)}
                      title={chapter.name}
                    >
                      {chapter.name}
                    </Button>
                  ))}
                </ScrollArea>
              )}
              <div className="flex-1 flex items-center justify-center">
                {!selectedBook && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <BookOpen className="h-16 w-16 text-muted-foreground mb-4"/>
                    <p className="text-muted-foreground">Select a book from the left panel.</p>
                  </div>
                )}
                {selectedBook && !selectedChapter && (
                   <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4"/>
                    <p className="text-muted-foreground">Select a chapter to view its content or PDF.</p>
                  </div>
                )}
                {selectedChapter && currentPdfUrl && !pdfError && (
                    <iframe 
                        src={currentPdfUrl} 
                        title={selectedChapter.name || "PDF Document"} 
                        className="w-full h-full border-0"
                        onError={() => {
                             toast({variant: "destructive", title: "PDF Load Error", description: "Could not embed PDF. Some PDFs have restrictions. Try opening externally using the link icon above."});
                             setPdfError(true); // Fallback to mock content display
                             logActivity("NCERT Viewer Error", `Failed to embed PDF: ${selectedChapter.name}`);
                        }}
                    />
                )}
                {selectedChapter && (!currentPdfUrl || pdfError) && ( // Display mock content if no PDF URL or if error
                  <ScrollArea className="h-full p-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <h3 className="text-lg font-semibold mb-2">{selectedChapter.name}</h3>
                      {(selectedChapter.mockContent || ["This is mock content. If available, the PDF would be shown here. Try opening externally if a PDF link is configured."]).map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                      ))}
                      {!currentPdfUrl && <p className="mt-4 text-xs text-muted-foreground">No PDF link configured for this chapter in the mock data.</p>}
                      {pdfError && <p className="mt-4 text-xs text-red-500">The PDF could not be embedded. Please use the 'Open PDF in new tab' option.</p>}
                    </div>
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

    