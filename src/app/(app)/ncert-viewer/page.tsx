
"use client";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { BookOpen, Download, Edit, ZoomIn, ZoomOut, FileText, Link as LinkIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logActivity } from '@/lib/activity-logger';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Note: These URLs should point to actual, publicly accessible PDF files for full functionality.
// Many NCERT PDFs are in ZIPs, so direct chapter PDFs are better if available.
// For a real app, this data would come from a database or a more robust source.
const bookPdfUrls: Record<string, string> = {
  "physics_xi_part1": "https://ncert.nic.in/textbook/pdf/keph1ps.zip", 
  "physics_xi_part2": "https://ncert.nic.in/textbook/pdf/keph2ps.zip", 
  "chemistry_xi_part1": "https://ncert.nic.in/textbook/pdf/kech1ps.zip",
  "biology_xi": "https://ncert.nic.in/textbook/pdf/kebl1ps.zip",
  "physics_xii_part1": "https://ncert.nic.in/textbook/pdf/leph1ps.zip",
  "physics_xii_part2": "https://ncert.nic.in/textbook/pdf/leph2ps.zip",
  "chemistry_xii_part1": "https://ncert.nic.in/textbook/pdf/lech1ps.zip",
  "biology_xii": "https://ncert.nic.in/textbook/pdf/lebl1ps.zip",
};

const chapterPdfLinks: Record<string, string> = {
    "physics_xi_part1_ch1": "https://ncert.nic.in/textbook/pdf/keph101.pdf", 
    "physics_xi_part1_ch2": "https://ncert.nic.in/textbook/pdf/keph102.pdf", 
    "physics_xi_part1_ch3": "https://ncert.nic.in/textbook/pdf/keph103.pdf", 
    "chemistry_xi_part1_ch1": "https://ncert.nic.in/textbook/pdf/kech101.pdf", 
    "chemistry_xi_part1_ch2": "https://ncert.nic.in/textbook/pdf/kech102.pdf", 
    "biology_xi_ch1": "https://ncert.nic.in/textbook/pdf/kebl101.pdf", 
    "biology_xi_ch2": "https://ncert.nic.in/textbook/pdf/kebl102.pdf", 
    "physics_xii_part1_ch1": "https://ncert.nic.in/textbook/pdf/leph101.pdf",
    "chemistry_xii_part1_ch1": "https://ncert.nic.in/textbook/pdf/lech101.pdf",
    "biology_xii_ch1": "https://ncert.nic.in/textbook/pdf/lebl101.pdf",
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
    id: "physics_xi_part1", name: "Physics XI - Part 1", 
    chapters: [
      { id: "physics_xi_part1_ch1", name: "Chapter 1: Physical World", mockContent: ["Content for Physics XI, Ch1...", "More details..."] },
      { id: "physics_xi_part1_ch2", name: "Chapter 2: Units and Measurement", mockContent: ["Content for Physics XI, Ch2..."] },
      { id: "physics_xi_part1_ch3", name: "Chapter 3: Motion in a Straight Line" },
      { id: "physics_xi_part1_ch4", name: "Chapter 4: Motion in a Plane" },
      { id: "physics_xi_part1_ch5", name: "Chapter 5: Laws of Motion" },
    ],
    fullBookDownloadUrl: bookPdfUrls["physics_xi_part1"]
  },
   { 
    id: "chemistry_xi_part1", name: "Chemistry XI - Part 1", 
    chapters: [
        {id: "chemistry_xi_part1_ch1", name: "Chapter 1: Some Basic Concepts of Chemistry", mockContent: ["Content for Chemistry XI, Ch1..."]},
        {id: "chemistry_xi_part1_ch2", name: "Chapter 2: Structure of Atom"},
        {id: "chemistry_xi_part1_ch3", name: "Chapter 3: Classification of Elements"},
    ],
    fullBookDownloadUrl: bookPdfUrls["chemistry_xi_part1"]
  },
  { 
    id: "biology_xi", name: "Biology XI", 
    chapters: [
        {id: "biology_xi_ch1", name: "Chapter 1: The Living World", mockContent: ["Content for Biology XI, Ch1..."]},
        {id: "biology_xi_ch2", name: "Chapter 2: Biological Classification"},
        {id: "biology_xi_ch3", name: "Chapter 3: Plant Kingdom"},
    ],
    fullBookDownloadUrl: bookPdfUrls["biology_xi"]
  },
  { 
    id: "physics_xii_part1", name: "Physics XII - Part 1", 
    chapters: [
      { id: "physics_xii_part1_ch1", name: "Chapter 1: Electric Charges and Fields"},
      { id: "physics_xii_part1_ch2", name: "Chapter 2: Electrostatic Potential and Capacitance"},
    ],
    fullBookDownloadUrl: bookPdfUrls["physics_xii_part1"]
  },
  { 
    id: "chemistry_xii_part1", name: "Chemistry XII - Part 1", 
    chapters: [
        {id: "chemistry_xii_part1_ch1", name: "Chapter 1: Solutions"},
        {id: "chemistry_xii_part1_ch2", name: "Chapter 2: Electrochemistry"},
    ],
    fullBookDownloadUrl: bookPdfUrls["chemistry_xii_part1"]
  },
  { 
    id: "biology_xii", name: "Biology XII", 
    chapters: [
        {id: "biology_xii_ch1", name: "Chapter 1: Reproduction in Organisms"},
        {id: "biology_xii_ch2", name: "Chapter 2: Sexual Reproduction in Flowering Plants"},
    ],
    fullBookDownloadUrl: bookPdfUrls["biology_xii"]
  },
];


export default function NcertViewerPage() {
  const { toast } = useToast();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
          toast({ title: `Loading Chapter: ${chapter.name}`, description: "Attempting to display PDF. For annotation, please open externally or download." });
          logActivity("NCERT Viewer", `Viewing chapter PDF: ${chapter.name}`);
        } else {
          setCurrentPdfUrl(null);
          setPdfError(false); 
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
        toast({ title: `Action: ${action}`, description: `For ${action.toLowerCase()} on "${selectedChapter?.name}", please use your PDF viewer's tools after opening the PDF externally or downloading it.` });
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
      <Alert variant="default" className="bg-primary/10 border-primary/30">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">Note on PDF Annotation & Download</AlertTitle>
        <AlertDescription className="text-primary/80">
          This viewer allows you to view NCERT PDFs within the app. For features like highlighting, making notes, editing, or offline access, please use the <Download className="inline h-3 w-3 mx-0.5"/> "Download Full Book" button or the <LinkIcon className="inline h-3 w-3 mx-0.5"/> "Open PDF in new tab" button for chapters, then use your preferred PDF editing software or save the file.
        </AlertDescription>
      </Alert>
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle>Your Digital Textbooks</CardTitle>
          <CardDescription>Access NCERT books. View chapters as PDFs (if embeddable) or download them.</CardDescription>
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
              <Button variant="outline" className="w-full" onClick={handleDownloadBook} disabled={!selectedBook || !selectedBook.fullBookDownloadUrl}>
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
                  <Button variant="outline" size="icon" onClick={handleOpenChapterPdfExternally} title="Open PDF in new tab for full features">
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
                        ref={iframeRef}
                        src={currentPdfUrl} 
                        title={selectedChapter.name || "PDF Document"} 
                        className="w-full h-full border-0"
                        // Sandbox can sometimes interfere with PDF viewers, test with and without if issues
                        // sandbox="allow-scripts allow-same-origin allow-popups" 
                        onError={() => {
                             toast({variant: "destructive", title: "PDF Load Error", description: "Could not embed PDF. This might be due to the PDF provider's restrictions (e.g. X-Frame-Options). Try opening externally using the link icon above.", duration: 7000});
                             setPdfError(true); 
                             logActivity("NCERT Viewer Error", `Failed to embed PDF: ${selectedChapter.name}`);
                        }}
                        onLoad={() => {
                            logActivity("NCERT Viewer", `Successfully loaded PDF in iframe: ${selectedChapter.name}`);
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

    