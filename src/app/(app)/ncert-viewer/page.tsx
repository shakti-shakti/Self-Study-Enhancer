
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, ZoomIn, ZoomOut, ArrowLeftRight, ExternalLink, AlertTriangle, FileText } from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { logActivity } from '@/lib/activity-logger';
import { useAuth } from '@/hooks/use-auth';

interface Chapter {
  id: string;
  name: string;
  pdfUrl?: string; 
}

interface Book {
  id: string;
  name: string;
  classYear: string;
  subject: string;
  chapters: Chapter[];
  fullBookDownloadUrl?: string; 
}

const ncertBooksData: Book[] = [
  {
    id: 'phy11_p1', name: 'Physics Part I - Class 11', classYear: '11', subject: 'Physics', chapters: [
      { id: 'phy11_p1_ch1', name: 'Chapter 1: Physical World', pdfUrl: 'https://ncert.nic.in/textbook/pdf/keph101.pdf' },
      { id: 'phy11_p1_ch2', name: 'Chapter 2: Units and Measurement', pdfUrl: 'https://ncert.nic.in/textbook/pdf/keph102.pdf' },
      { id: 'phy11_p1_ch3', name: 'Chapter 3: Motion in a Straight Line', pdfUrl: 'https://ncert.nic.in/textbook/pdf/keph103.pdf' },
      { id: 'phy11_p1_ch4', name: 'Chapter 4: Motion in a Plane', pdfUrl: 'https://ncert.nic.in/textbook/pdf/keph104.pdf' },
      { id: 'phy11_p1_ch5', name: 'Chapter 5: Laws of Motion' }, // Example without direct PDF link
      { id: 'phy11_p1_ch6', name: 'Chapter 6: Work, Energy and Power' },
      { id: 'phy11_p1_ch7', name: 'Chapter 7: System of Particles and Rotational Motion' },
      { id: 'phy11_p1_ch8', name: 'Chapter 8: Gravitation' },
    ], fullBookDownloadUrl: 'https://ncert.nic.in/textbook/pdf/keph1ps.zip'
  },
  {
    id: 'phy11_p2', name: 'Physics Part II - Class 11', classYear: '11', subject: 'Physics', chapters: [
      { id: 'phy11_p2_ch9', name: 'Chapter 9: Mechanical Properties of Solids'},
      { id: 'phy11_p2_ch10', name: 'Chapter 10: Mechanical Properties of Fluids'},
      { id: 'phy11_p2_ch11', name: 'Chapter 11: Thermal Properties of Matter'},
      { id: 'phy11_p2_ch12', name: 'Chapter 12: Thermodynamics'},
      { id: 'phy11_p2_ch13', name: 'Chapter 13: Kinetic Theory'},
      { id: 'phy11_p2_ch14', name: 'Chapter 14: Oscillations'},
      { id: 'phy11_p2_ch15', name: 'Chapter 15: Waves'},
    ], fullBookDownloadUrl: 'https://ncert.nic.in/textbook/pdf/keph2ps.zip'
  },
  {
    id: 'chem11_p1', name: 'Chemistry Part I - Class 11', classYear: '11', subject: 'Chemistry', chapters: [
      { id: 'chem11_p1_ch1', name: 'Chapter 1: Some Basic Concepts of Chemistry', pdfUrl: 'https://ncert.nic.in/textbook/pdf/kech101.pdf' },
      { id: 'chem11_p1_ch2', name: 'Chapter 2: Structure of Atom', pdfUrl: 'https://ncert.nic.in/textbook/pdf/kech102.pdf' },
      { id: 'chem11_p1_ch3', name: 'Chapter 3: Classification of Elements and Periodicity in Properties' },
      { id: 'chem11_p1_ch4', name: 'Chapter 4: Chemical Bonding and Molecular Structure' },
    ], fullBookDownloadUrl: 'https://ncert.nic.in/textbook/pdf/kech1ps.zip'
  },
   {
    id: 'chem11_p2', name: 'Chemistry Part II - Class 11', classYear: '11', subject: 'Chemistry', chapters: [
      { id: 'chem11_p2_ch8', name: 'Chapter 8: Redox Reactions' },
      { id: 'chem11_p2_ch9', name: 'Chapter 9: Hydrogen' },
      { id: 'chem11_p2_ch10', name: 'Chapter 10: The s-Block Elements' },
      { id: 'chem11_p2_ch11', name: 'Chapter 11: The p-Block Elements' },
    ], fullBookDownloadUrl: 'https://ncert.nic.in/textbook/pdf/kech2ps.zip'
  },
  {
    id: 'bio11', name: 'Biology - Class 11', classYear: '11', subject: 'Biology', chapters: [
      { id: 'bio11_ch1', name: 'Chapter 1: The Living World', pdfUrl: 'https://ncert.nic.in/textbook/pdf/kebo101.pdf' },
      { id: 'bio11_ch2', name: 'Chapter 2: Biological Classification', pdfUrl: 'https://ncert.nic.in/textbook/pdf/kebo102.pdf' },
      { id: 'bio11_ch3', name: 'Chapter 3: Plant Kingdom', pdfUrl: 'https://ncert.nic.in/textbook/pdf/kebo103.pdf' },
      { id: 'bio11_ch4', name: 'Chapter 4: Animal Kingdom' },
      { id: 'bio11_ch5', name: 'Chapter 5: Morphology of Flowering Plants' },
    ], fullBookDownloadUrl: 'https://ncert.nic.in/textbook/pdf/kebo1ps.zip'
  },
   {
    id: 'phy12_p1', name: 'Physics Part I - Class 12', classYear: '12', subject: 'Physics', chapters: [
      { id: 'phy12_p1_ch1', name: 'Chapter 1: Electric Charges and Fields', pdfUrl: 'https://ncert.nic.in/textbook/pdf/leph101.pdf' },
      { id: 'phy12_p1_ch2', name: 'Chapter 2: Electrostatic Potential and Capacitance', pdfUrl: 'https://ncert.nic.in/textbook/pdf/leph102.pdf' },
      { id: 'phy12_p1_ch3', name: 'Chapter 3: Current Electricity' },
      { id: 'phy12_p1_ch4', name: 'Chapter 4: Moving Charges and Magnetism' },
    ], fullBookDownloadUrl: 'https://ncert.nic.in/textbook/pdf/leph1ps.zip'
  },
  {
    id: 'phy12_p2', name: 'Physics Part II - Class 12', classYear: '12', subject: 'Physics', chapters: [
      { id: 'phy12_p2_ch9', name: 'Chapter 9: Ray Optics and Optical Instruments' },
      { id: 'phy12_p2_ch10', name: 'Chapter 10: Wave Optics' },
    ], fullBookDownloadUrl: 'https://ncert.nic.in/textbook/pdf/leph2ps.zip'
  },
  {
    id: 'chem12_p1', name: 'Chemistry Part I - Class 12', classYear: '12', subject: 'Chemistry', chapters: [
      { id: 'chem12_p1_ch1', name: 'Chapter 1: The Solid State', pdfUrl: 'https://ncert.nic.in/textbook/pdf/lech101.pdf'  }, 
      { id: 'chem12_p1_ch2', name: 'Chapter 2: Solutions', pdfUrl: 'https://ncert.nic.in/textbook/pdf/lech102.pdf' },
      { id: 'chem12_p1_ch3', name: 'Chapter 3: Electrochemistry' },
      { id: 'chem12_p1_ch4', name: 'Chapter 4: Chemical Kinetics' },
    ], fullBookDownloadUrl: 'https://ncert.nic.in/textbook/pdf/lech1ps.zip' 
  },
  {
    id: 'chem12_p2', name: 'Chemistry Part II - Class 12', classYear: '12', subject: 'Chemistry', chapters: [
      { id: 'chem12_p2_ch10', name: 'Chapter 10: Haloalkanes and Haloarenes' },
      { id: 'chem12_p2_ch11', name: 'Chapter 11: Alcohols, Phenols and Ethers' },
    ], fullBookDownloadUrl: 'https://ncert.nic.in/textbook/pdf/lech2ps.zip'
  },
   {
    id: 'bio12', name: 'Biology - Class 12', classYear: '12', subject: 'Biology', chapters: [
      { id: 'bio12_ch1', name: 'Chapter 1: Reproduction in Organisms', pdfUrl: 'https://ncert.nic.in/textbook/pdf/lebo101.pdf' },
      { id: 'bio12_ch2', name: 'Chapter 2: Sexual Reproduction in Flowering Plants', pdfUrl: 'https://ncert.nic.in/textbook/pdf/lebo102.pdf' },
      { id: 'bio12_ch3', name: 'Chapter 3: Human Reproduction' },
      { id: 'bio12_ch4', name: 'Chapter 4: Reproductive Health' },
    ], fullBookDownloadUrl: 'https://ncert.nic.in/textbook/pdf/lebo1ps.zip'
  },
];


export default function NcertViewerPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedBookId, setSelectedBookId] = useState<string | undefined>(ncertBooksData[0]?.id);
  const [selectedChapterId, setSelectedChapterId] = useState<string | undefined>(ncertBooksData[0]?.chapters[0]?.id);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | undefined>(ncertBooksData[0]?.chapters[0]?.pdfUrl);
  const [pdfLoadFailed, setPdfLoadFailed] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now()); // To force iframe re-render

  const selectedBook = ncertBooksData.find(book => book.id === selectedBookId);
  const selectedChapter = selectedBook?.chapters.find(chap => chap.id === selectedChapterId);
  
  useEffect(() => {
    const newBook = ncertBooksData.find(b => b.id === selectedBookId);
    if (newBook && newBook.chapters.length > 0) {
      const firstChapter = newBook.chapters[0];
      setSelectedChapterId(firstChapter.id);
      setCurrentPdfUrl(firstChapter.pdfUrl);
      setPdfLoadFailed(false);
      setIframeKey(Date.now()); // Force iframe reload
    } else if (newBook && newBook.chapters.length === 0) {
      setSelectedChapterId(undefined);
      setCurrentPdfUrl(undefined);
      setPdfLoadFailed(false);
      setIframeKey(Date.now());
    } else { // If selectedBookId is somehow invalid or no book found
      setSelectedChapterId(undefined);
      setCurrentPdfUrl(undefined);
      setPdfLoadFailed(false);
      setIframeKey(Date.now());
    }
  }, [selectedBookId]);


  const handleBookChange = (bookId: string) => {
    setSelectedBookId(bookId);
    // The useEffect above will handle updating chapter and PDF URL
    const newBook = ncertBooksData.find(b => b.id === bookId);
    if (user && newBook) logActivity("NCERT Viewer", `Selected book: ${newBook.name}`, { bookId: newBook.id }, user.id);
  };

  const handleChapterChange = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    const chapter = selectedBook?.chapters.find(chap => chap.id === chapterId);
    setCurrentPdfUrl(chapter?.pdfUrl);
    setPdfLoadFailed(false);
    setIframeKey(Date.now()); // Force iframe reload
    if (user && chapter && selectedBook) logActivity("NCERT Viewer", `Selected chapter: ${chapter.name} from ${selectedBook.name}`, { chapterId: chapter.id, bookId: selectedBook.id }, user.id);
  };
  
  const handleIframeError = (event: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    if (currentPdfUrl) { 
        setPdfLoadFailed(true);
        toast({
        variant: "destructive",
        title: "PDF Embedding Issue",
        description: "This PDF might not allow direct embedding or the link is broken/invalid. Try opening externally.",
        });
    }
  };
  
  const handleExternalOpenOrDownload = (url?: string, type: 'chapter' | 'full' = 'full', bookName?: string, chapterName?: string) => {
    if (url) {
      window.open(url, '_blank');
      if (user) logActivity("NCERT Viewer Action", `Opened ${type} externally: ${bookName || selectedBook?.name} ${type === 'chapter' ? (chapterName || selectedChapter?.name) : ''}`, { url }, user.id);
    } else {
      toast({
        variant: "destructive",
        title: "Link Not Available",
        description: `No direct link found for this ${type === 'chapter' ? 'chapter' : 'book'} in the demo data.`,
      });
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center space-x-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">NCERT Viewer</h1>
      </div>

      <Alert variant="default" className="bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300">
        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-700 dark:text-blue-300">PDF Viewing & Annotation</AlertTitle>
        <AlertDescription className="text-blue-600/90 dark:text-blue-400/90">
          This viewer attempts to embed NCERT PDFs for in-app viewing. For annotations (highlighting, notes), please use the "Open Externally" button to view/download the PDF and use an external PDF editor. Some PDFs may not embed due to security restrictions; use "Open PDF Externally" in such cases. The book data uses publicly available NCERT PDF links. Full book downloads are ZIP files from NCERT.
        </AlertDescription>
      </Alert>

      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle>Explore NCERT Textbooks</CardTitle>
          <CardDescription>Select a book and chapter to view. (Using official NCERT PDF links for chapters where available)</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="book-select" className="block text-sm font-medium mb-1">Select Book</label>
              <Select value={selectedBookId} onValueChange={handleBookChange}>
                <SelectTrigger id="book-select"> <SelectValue placeholder="Choose a book" /> </SelectTrigger>
                <SelectContent>
                  {ncertBooksData.map(book => (
                    <SelectItem key={book.id} value={book.id}>{book.name} (Class {book.classYear})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="chapter-select" className="block text-sm font-medium mb-1">Select Chapter</label>
              <Select value={selectedChapterId} onValueChange={handleChapterChange} disabled={!selectedBook || selectedBook.chapters.length === 0}>
                <SelectTrigger id="chapter-select"> <SelectValue placeholder={!selectedBook ? "Select a book first" : (selectedBook.chapters.length === 0 ? "No chapters in this book" : "Choose a chapter")} /> </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {selectedBook?.chapters.map(chapter => (
                    <SelectItem key={chapter.id} value={chapter.id}>{chapter.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap bg-muted p-2 rounded-md">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toast({ title: "Zoom In (Feature Not Implemented)", description: "Use browser zoom or external PDF viewer for zooming."})}><ZoomIn className="mr-1 h-4 w-4"/>Zoom In</Button>
              <Button variant="outline" size="sm" onClick={() => toast({ title: "Zoom Out (Feature Not Implemented)", description: "Use browser zoom or external PDF viewer for zooming."})}><ZoomOut className="mr-1 h-4 w-4"/>Zoom Out</Button>
              <Button variant="outline" size="sm" onClick={() => toast({ title: "Fit to Page (Feature Not Implemented)", description: "PDF viewer default behavior."})}><ArrowLeftRight className="mr-1 h-4 w-4"/>Fit Page</Button>
            </div>
            {currentPdfUrl && selectedChapter && (
                <Button variant="outline" size="sm" onClick={() => handleExternalOpenOrDownload(currentPdfUrl, 'chapter', selectedBook?.name, selectedChapter?.name)}>
                    <ExternalLink className="mr-1 h-4 w-4"/> Open Chapter Externally
                </Button>
            )}
          </div>

          <div className="p-1 border rounded-lg flex-1 bg-muted/30 flex flex-col items-center justify-center overflow-hidden relative min-h-[400px] md:min-h-[500px]">
            {pdfLoadFailed && currentPdfUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-10 p-4 text-center">
                    <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
                    <p className="font-semibold text-lg">Could Not Embed PDF</p>
                    <p className="text-sm text-muted-foreground mb-3">
                        This PDF could not be loaded directly in the app. This might be due to security settings of the PDF source (NCERT website) or an invalid link.
                    </p>
                    <Button onClick={() => handleExternalOpenOrDownload(currentPdfUrl, 'chapter', selectedBook?.name, selectedChapter?.name)} variant="secondary">
                        <ExternalLink className="mr-2 h-4 w-4" /> Open PDF Externally
                    </Button>
                </div>
            )}
            {currentPdfUrl && !pdfLoadFailed ? (
              <iframe
                key={iframeKey} // Use key to force re-render
                ref={iframeRef}
                src={currentPdfUrl}
                title="NCERT Content Viewer"
                className="w-full h-full border-0"
                onError={handleIframeError}
                onLoad={() => {
                    setPdfLoadFailed(false); 
                }}
              />
            ) : (
              <div className="text-center p-8">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {selectedChapter ? (currentPdfUrl ? `Loading "${selectedChapter.name}"...` : `No direct PDF link available for "${selectedChapter.name}" in the demo data. Try "Open Externally".`) : "Select a book and chapter to view."}
                </p>
                 {!currentPdfUrl && selectedChapter && (
                     <Button 
                        variant="link" 
                        onClick={() => handleExternalOpenOrDownload(undefined, 'chapter', selectedBook?.name, selectedChapter?.name)}
                        className="mt-2"
                    >
                        Try finding chapter on NCERT website
                    </Button>
                 )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => handleExternalOpenOrDownload(selectedBook?.fullBookDownloadUrl, 'full', selectedBook?.name)}
            disabled={!selectedBook?.fullBookDownloadUrl}
          >
            <Download className="mr-2 h-4 w-4" /> 
            {selectedBook?.fullBookDownloadUrl ? `Go to Download Page for "${selectedBook.name}" (ZIP from NCERT)` : "Full Book Download Link Not Available"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
