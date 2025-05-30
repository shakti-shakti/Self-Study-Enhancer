
"use client";
import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, SearchPlus, SearchMinus, ArrowLeftRight, ExternalLink, AlertTriangle, FileText } from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { logActivity } from '@/lib/activity-logger';
import { useAuth } from '@/hooks/use-auth';

interface Chapter {
  id: string;
  name: string;
  pdfUrl?: string; // Optional: URL to the chapter's PDF
}

interface Book {
  id: string;
  name: string;
  classYear: string;
  subject: string;
  chapters: Chapter[];
  fullBookDownloadUrl?: string; // Optional: URL to download the full book PDF
}

// Expanded Mock NCERT Book Data
const ncertBooksData: Book[] = [
  {
    id: 'phy11', name: 'Physics Part I - Class 11', classYear: '11', subject: 'Physics', chapters: [
      { id: 'phy11_ch1', name: 'Physical World', pdfUrl: 'https://ncert.nic.in/textbook/pdf/keph101.pdf' },
      { id: 'phy11_ch2', name: 'Units and Measurement', pdfUrl: 'https://ncert.nic.in/textbook/pdf/keph102.pdf' },
      { id: 'phy11_ch3', name: 'Motion in a Straight Line' },
      { id: 'phy11_ch4', name: 'Motion in a Plane' },
    ], fullBookDownloadUrl: 'https://ncert.nic.in/textbook/pdf/keph1ps.zip'
  },
  {
    id: 'chem11', name: 'Chemistry Part I - Class 11', classYear: '11', subject: 'Chemistry', chapters: [
      { id: 'chem11_ch1', name: 'Some Basic Concepts of Chemistry', pdfUrl: 'https://ncert.nic.in/textbook/pdf/kech101.pdf' },
      { id: 'chem11_ch2', name: 'Structure of Atom' },
      { id: 'chem11_ch3', name: 'Classification of Elements' },
    ], fullBookDownloadUrl: 'https://ncert.nic.in/textbook/pdf/kech1ps.zip'
  },
  {
    id: 'bio11', name: 'Biology - Class 11', classYear: '11', subject: 'Biology', chapters: [
      { id: 'bio11_ch1', name: 'The Living World', pdfUrl: 'https://ncert.nic.in/textbook/pdf/kebo101.pdf' },
      { id: 'bio11_ch2', name: 'Biological Classification' },
      { id: 'bio11_ch3', name: 'Plant Kingdom' },
    ], fullBookDownloadUrl: 'https://ncert.nic.in/textbook/pdf/kebo1ps.zip'
  },
   {
    id: 'phy12', name: 'Physics Part I - Class 12', classYear: '12', subject: 'Physics', chapters: [
      { id: 'phy12_ch1', name: 'Electric Charges and Fields', pdfUrl: 'https://ncert.nic.in/textbook/pdf/leph101.pdf' },
      { id: 'phy12_ch2', name: 'Electrostatic Potential and Capacitance' },
      { id: 'phy12_ch3', name: 'Current Electricity' },
    ], fullBookDownloadUrl: 'https://ncert.nic.in/textbook/pdf/leph1ps.zip'
  },
  {
    id: 'chem12', name: 'Chemistry Part I - Class 12', classYear: '12', subject: 'Chemistry', chapters: [
      { id: 'chem12_ch1', name: 'The Solid State' }, // Example, actual NCERT might vary
      { id: 'chem12_ch2', name: 'Solutions', pdfUrl: 'https://ncert.nic.in/textbook/pdf/lech102.pdf' },
      { id: 'chem12_ch3', name: 'Electrochemistry' },
    ], fullBookDownloadUrl: 'https://ncert.nic.in/textbook/pdf/lech1ps.zip'
  },
   {
    id: 'bio12', name: 'Biology - Class 12', classYear: '12', subject: 'Biology', chapters: [
      { id: 'bio12_ch1', name: 'Reproduction in Organisms', pdfUrl: 'https://ncert.nic.in/textbook/pdf/lebo101.pdf' },
      { id: 'bio12_ch2', name: 'Sexual Reproduction in Flowering Plants' },
      { id: 'bio12_ch3', name: 'Human Reproduction' },
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const selectedBook = ncertBooksData.find(book => book.id === selectedBookId);
  const selectedChapter = selectedBook?.chapters.find(chap => chap.id === selectedChapterId);

  const handleBookChange = (bookId: string) => {
    setSelectedBookId(bookId);
    const newBook = ncertBooksData.find(b => b.id === bookId);
    if (newBook && newBook.chapters.length > 0) {
      setSelectedChapterId(newBook.chapters[0].id);
      setCurrentPdfUrl(newBook.chapters[0].pdfUrl);
      setPdfLoadFailed(false);
      logActivity("NCERT Viewer", `Selected book: ${newBook.name}`, undefined, user?.id);
    } else {
      setSelectedChapterId(undefined);
      setCurrentPdfUrl(undefined);
      setPdfLoadFailed(false);
    }
  };

  const handleChapterChange = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    const chapter = selectedBook?.chapters.find(chap => chap.id === chapterId);
    setCurrentPdfUrl(chapter?.pdfUrl);
    setPdfLoadFailed(false);
    if (chapter) logActivity("NCERT Viewer", `Selected chapter: ${chapter.name} from ${selectedBook?.name}`, undefined, user?.id);
  };
  
  const handleIframeError = () => {
    setPdfLoadFailed(true);
    toast({
      variant: "destructive",
      title: "PDF Embedding Failed",
      description: "This PDF might not allow direct embedding. Try opening externally.",
    });
  };
  
  const handleDownloadBook = (url?: string, type: 'chapter' | 'full' = 'full') => {
    if (url) {
      window.open(url, '_blank');
      logActivity("NCERT Viewer", `Attempted to download ${type}: ${selectedBook?.name} ${type === 'chapter' ? selectedChapter?.name : ''}`, { url }, user?.id);
    } else {
      toast({
        variant: "destructive",
        title: "Download Not Available",
        description: `No download URL found for this ${type === 'chapter' ? 'chapter' : 'book'}.`,
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
          PDFs are embedded for viewing. For annotations (highlighting, notes), please download the PDF and use an external PDF editor application. Some PDFs may not embed due to security restrictions; use "Open PDF Externally" in such cases. The book data here is for demonstration.
        </AlertDescription>
      </Alert>

      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle>Explore NCERT Textbooks</CardTitle>
          <CardDescription>Select a book and chapter to view its content. (Using NCERT example PDFs)</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="book-select" className="block text-sm font-medium mb-1">Select Book</label>
              <Select value={selectedBookId} onValueChange={handleBookChange}>
                <SelectTrigger id="book-select"> <SelectValue placeholder="Choose a book" /> </SelectTrigger>
                <SelectContent>
                  {ncertBooksData.map(book => (
                    <SelectItem key={book.id} value={book.id}>{book.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="chapter-select" className="block text-sm font-medium mb-1">Select Chapter</label>
              <Select value={selectedChapterId} onValueChange={handleChapterChange} disabled={!selectedBook}>
                <SelectTrigger id="chapter-select"> <SelectValue placeholder="Choose a chapter" /> </SelectTrigger>
                <SelectContent>
                  {selectedBook?.chapters.map(chapter => (
                    <SelectItem key={chapter.id} value={chapter.id}>{chapter.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap bg-muted p-2 rounded-md">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toast({ title: "Zoom In (Mock)"})}><SearchPlus className="mr-1 h-4 w-4"/>Zoom In</Button>
              <Button variant="outline" size="sm" onClick={() => toast({ title: "Zoom Out (Mock)"})}><SearchMinus className="mr-1 h-4 w-4"/>Zoom Out</Button>
              <Button variant="outline" size="sm" onClick={() => toast({ title: "Fit to Page (Mock)"})}><ArrowLeftRight className="mr-1 h-4 w-4"/>Fit Page</Button>
            </div>
            {currentPdfUrl && (
                <Button variant="outline" size="sm" onClick={() => handleDownloadBook(currentPdfUrl, 'chapter')}>
                    <ExternalLink className="mr-1 h-4 w-4"/> Open PDF Externally
                </Button>
            )}
          </div>

          <div className="p-1 border rounded-lg flex-1 bg-muted/30 flex flex-col items-center justify-center overflow-hidden relative">
            {pdfLoadFailed && currentPdfUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-10 p-4 text-center">
                    <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
                    <p className="font-semibold text-lg">Could Not Embed PDF</p>
                    <p className="text-sm text-muted-foreground mb-3">
                        This PDF could not be loaded directly. This might be due to security settings of the PDF source.
                    </p>
                    <Button onClick={() => handleDownloadBook(currentPdfUrl, 'chapter')} variant="secondary">
                        <ExternalLink className="mr-2 h-4 w-4" /> Open PDF Externally
                    </Button>
                </div>
            )}
            {currentPdfUrl && !pdfLoadFailed ? (
              <iframe
                key={currentPdfUrl} // Force re-render when URL changes
                ref={iframeRef}
                src={currentPdfUrl}
                title="NCERT Content Viewer"
                className="w-full h-full border-0"
                onError={handleIframeError}
                onLoad={() => setPdfLoadFailed(false)} // Reset error if new PDF loads successfully
              />
            ) : (
              <div className="text-center p-8">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {selectedChapter ? `Content for "${selectedChapter.name}" will appear here.` : "Select a book and chapter to view."}
                </p>
                {!currentPdfUrl && selectedChapter && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">No PDF link available for this chapter in the demo data.</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => handleDownloadBook(selectedBook?.fullBookDownloadUrl, 'full')}
            disabled={!selectedBook?.fullBookDownloadUrl}
          >
            <Download className="mr-2 h-4 w-4" /> 
            {selectedBook?.fullBookDownloadUrl ? "Download Full Book (External)" : "Full Book Download Not Available"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
    