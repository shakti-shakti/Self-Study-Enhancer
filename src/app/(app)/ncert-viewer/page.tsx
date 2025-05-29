
"use client";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { BookOpen, Download, Edit, ZoomIn, ZoomOut, FileText, Link as LinkIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logActivity } from '@/lib/activity-logger';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const bookPdfUrls: Record<string, string> = {
  "physics_xi_part1": "https://ncert.nic.in/textbook/pdf/keph1ps.zip", 
  "physics_xi_part2": "https://ncert.nic.in/textbook/pdf/keph2ps.zip", 
  "chemistry_xi_part1": "https://ncert.nic.in/textbook/pdf/kech1ps.zip",
  "biology_xi": "https://ncert.nic.in/textbook/pdf/kebl1ps.zip",
  // Using general textbook page as fallback if specific book ZIP not known
  "physics_xii_part1": "https://ncert.nic.in/textbook.php",
  "chemistry_xii_part1": "https://ncert.nic.in/textbook.php",
  "biology_xii": "https://ncert.nic.in/textbook.php",
};

const chapterPdfLinks: Record<string, string> = {
    "physics_xi_part1_0": "https://ncert.nic.in/textbook/pdf/keph101.pdf", 
    "physics_xi_part1_1": "https://ncert.nic.in/textbook/pdf/keph102.pdf", 
    "physics_xi_part1_2": "https://ncert.nic.in/textbook/pdf/keph103.pdf", 
    "chemistry_xi_part1_0": "https://ncert.nic.in/textbook/pdf/kech101.pdf", 
    "chemistry_xi_part1_1": "https://ncert.nic.in/textbook/pdf/kech102.pdf", 
    "biology_xi_0": "https://ncert.nic.in/textbook/pdf/kebl101.pdf", 
    "biology_xi_1": "https://ncert.nic.in/textbook/pdf/kebl102.pdf", 
    // Add more direct chapter PDF links as available. These are examples.
};

interface Chapter {
  id: string; 
  name: string;
  mockContent?: string[]; 
}
interface Book {
  id: string;
  name: string;
  chapters: Chapter[];
  fullBookDownloadUrl?: string; 
}


const availableBooks: Book[] = [
  { 
    id: "physics_xi_part1", 
    name: "Physics XI - Part 1", 
    chapters: [
      { id: "physics_xi_part1_0", name: "Chapter 1: Physical World", mockContent: ["Content for Physics XI, Ch1...", "More details..."] },
      { id: "physics_xi_part1_1", name: "Chapter 2: Units and Measurement", mockContent: ["Content for Physics XI, Ch2..."] },
      { id: "physics_xi_part1_2", name: "Chapter 3: Motion in a Straight Line" },
      { id: "physics_xi_part1_3", name: "Chapter 4: Motion in a Plane" },
      { id: "physics_xi_part1_4", name: "Chapter 5: Laws of Motion" },
    ],
    fullBookDownloadUrl: bookPdfUrls["physics_xi_part1"] || "https://ncert.nic.in/textbook.php"
  },
   { 
    id: "chemistry_xi_part1", 
    name: "Chemistry XI - Part 1", 
    chapters: [
        {id: "chemistry_xi_part1_0", name: "Chapter 1: Some Basic Concepts of Chemistry", mockContent: ["Content for Chemistry XI, Ch1..."]},
        {id: "chemistry_xi_part1_1", name: "Chapter 2: Structure of Atom"},
        {id: "chemistry_xi_part1_2", name: "Chapter 3: Classification of Elements"},
    ],
    fullBookDownloadUrl: bookPdfUrls["chemistry_xi_part1"] || "https://ncert.nic.in/textbook.php"
  },
  { 
    id: "biology_xi", 
    name: "Biology XI", 
    chapters: [
        {id: "biology_xi_0", name: "Chapter 1: The Living World", mockContent: ["Content for Biology XI, Ch1..."]},
        {id: "biology_xi_1", name: "Chapter 2: Biological Classification"},
        {id: "biology_xi_2", name: "Chapter 3: Plant Kingdom"},
        {id: "biology_xi_3", name: "Chapter 4: Animal Kingdom"},
    ],
    fullBookDownloadUrl: bookPdfUrls["biology_xi"] || "https://ncert.nic.in/textbook.php"
  },
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
      toast({ title: `Selected Book: ${book.name}`, description: "Choose a chapter to view or download the full book." });
      logActivity("NCERT Viewer", `Selected book: ${book.name}`);
    }
  };

  const handleChapterSelect = (chapterId: string) => {
    const chapter = selectedBook?.chapters.find(c => c.id === chapterId);
    if (chapter) {
        setSelectedChapter(chapter);
        const chapterLink = chapterPdfLinks[chapter.id];
        if (chapterLink) {
          setCurrentPdfUrl(chapterLink);
          setPdfError(false);
          toast({ title: `Loading Chapter: ${chapter.name}`, description: "Attempting to display PDF. For annotation, please open externally." });
          logActivity("NCERT Viewer", `Viewing chapter PDF: ${chapter.name}`);
        } else {
          setCurrentPdfUrl(null);
          setPdfError(false); // Reset error for mock content
          toast({ title: `Chapter: ${chapter.name}`, description: "Displaying mock content. PDF link not available in mock data." });
          logActivity("NCERT Viewer", `Viewed chapter (mock content): ${chapter.name} from ${selectedBook?.name}`);
        }
    }
  };

  const handleDownloadBook = () => {
    if (selectedBook?.fullBookDownloadUrl) {
        window.open(selectedBook.fullBookDownloadUrl, '_blank');
        toast({ title: "Download Initialized", description: `Attempting to download ${selectedBook.name}. Your browser will handle the file.` });
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
        toast({ title: "Opening PDF Externally", description: `Opening chapter PDF in a new tab for full browser features (including annotation).` });
        logActivity("NCERT Viewer", `Opened chapter PDF externally: ${selectedChapter?.name}`);
    } else if (selectedChapter && !chapterPdfLinks[selectedChapter.id]) {
        toast({ title: "No PDF Link", description: `No direct PDF link is available for "${selectedChapter.name}" in our current mock data to open externally.`, variant: "destructive" });
    } else {
        toast({ title: "No PDF Selected", description: "No chapter PDF is currently loaded or link available.", variant: "destructive" });
    }
  }

  const handleViewerAction = (action: string) => {
     if (currentPdfUrl || selectedChapter) { 
        toast({ title: `Action: ${action}`, description: `For ${action.toLowerCase()} on "${selectedChapter?.name}", please use your PDF viewer's tools after opening the PDF externally.` });
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
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Note on PDF Annotation</AlertTitle>
        <AlertDescription>
          This viewer allows you to view NCERT PDFs within the app. For features like highlighting, making notes, or editing, please download the PDF or open it externally using the <LinkIcon className="inline h-3 w-3 mx-0.5"/> button and use your preferred PDF editing software.
        </AlertDescription>
      </Alert>
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle>Your Digital Textbooks</CardTitle>
          <CardDescription>Access NCERT books. View chapters as PDFs or download them.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
          <Card className="w-full md:w-1/3 lg:w-1/4 flex flex-col bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Select Book</CardTitle>
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
            <CardFooter className="p-4 border-t">
              <Button variant="outline" className="w-full" onClick={handleDownloadBook} disabled={!selectedBook}>
                <Download className="mr-2 h-4 w-4" /> Download Full Book
              </Button>
            </CardFooter>
          </Card>
          
          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-semibold truncate max-w-xs sm:max-w-sm md:max-w-md">
                {selectedChapter ? `${selectedBook?.name} - ${selectedChapter.name}` : selectedBook ? selectedBook.name : "Select a Book"}
              </h2>
              <div className="flex space-x-2">
                 {(currentPdfUrl || (selectedChapter && chapterPdfLinks[selectedChapter.id])) && (
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
                  {selectedBook.chapters.length > 0 ? selectedBook.chapters.map(chapter => (
                    <Button 
                      key={chapter.id} 
                      variant={selectedChapter?.id === chapter.id ? "secondary" : "ghost"} 
                      className="w-full justify-start text-left h-auto py-1.5 px-2 text-sm mb-1 truncate"
                      onClick={() => handleChapterSelect(chapter.id)}
                      title={chapter.name}
                    >
                      {chapter.name}
                    </Button>
                  )) : <p className="p-2 text-sm text-muted-foreground">No chapters listed for this book in mock data.</p>}
                </ScrollArea>
              )}
              <div className="flex-1 flex items-center justify-center p-1">
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
                             toast({variant: "destructive", title: "PDF Load Error", description: "Could not embed PDF. This might be due to the PDF provider's restrictions. Try opening externally using the link icon above."});
                             setPdfError(true); 
                             logActivity("NCERT Viewer Error", `Failed to embed PDF: ${selectedChapter.name}`);
                        }}
                    />
                )}
                {selectedChapter && (!currentPdfUrl || pdfError) && ( 
                  <ScrollArea className="h-full p-6 w-full">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <h3 className="text-lg font-semibold mb-2">{selectedChapter.name}</h3>
                      {(selectedChapter.mockContent || ["This is mock content for the selected chapter. If a PDF link were available and embeddable, it would be shown here. Try opening externally if a PDF link is configured and embedding fails."]).map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                      ))}
                      {!chapterPdfLinks[selectedChapter.id] && <p className="mt-4 text-xs text-muted-foreground">No direct PDF link configured for this chapter in the mock data.</p>}
                      {pdfError && <p className="mt-4 text-xs text-red-500">The PDF could not be embedded. Please use the 'Open PDF in new tab' <LinkIcon className="inline h-3 w-3 mx-0.5"/> option above if available.</p>}
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
