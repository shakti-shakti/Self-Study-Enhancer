
"use client";
import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Globe, Search, RefreshCw, ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';

export default function BrowserPage() {
  const { toast } = useToast();
  const [url, setUrl] = useState("https://www.google.com/search?igu=1"); // igu=1 to attempt to bypass Google's iframe restrictions
  const [inputValue, setInputValue] = useState("https://www.google.com");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [history, setHistory] = useState<string[]>(["https://www.google.com/search?igu=1"]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const navigate = (targetUrl: string) => {
    let finalUrl = targetUrl;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      finalUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}&igu=1`;
    } else if (targetUrl.includes("google.com") && !targetUrl.includes("igu=1")){
      finalUrl = targetUrl.includes("?") ? `${targetUrl}&igu=1` : `${targetUrl}?igu=1`;
    }
    
    setUrl(finalUrl);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(finalUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setInputValue(finalUrl); // Update input field with the actual URL being loaded
  };

  const handleSearch = () => {
    navigate(inputValue);
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src; // Simple way to refresh iframe
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setUrl(history[newIndex]);
      setInputValue(history[newIndex]);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setUrl(history[newIndex]);
      setInputValue(history[newIndex]);
    }
  };
  
  const openInNewTab = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center space-x-3">
        <Globe className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Mini Browser</h1>
      </div>
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle>In-App Web Search</CardTitle>
          <CardDescription>Search doubts on Google, watch YouTube lectures, and access online resources without leaving the app.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleBack} disabled={historyIndex === 0}><ArrowLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={handleForward} disabled={historyIndex === history.length - 1}><ArrowRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={handleRefresh}><RefreshCw className="h-4 w-4" /></Button>
            <Input 
              type="text" 
              placeholder="Search Google or type a URL" 
              className="flex-1" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}><Search className="h-4 w-4 mr-2" />Search</Button>
            <Button variant="outline" size="icon" onClick={openInNewTab} title="Open in new tab">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-1 border rounded-lg h-full bg-muted/30 flex items-center justify-center overflow-hidden">
            <iframe
              ref={iframeRef}
              src={url}
              title="Mini Browser Content"
              className="w-full h-full border-0"
              sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts" // Security for iframe
              onError={() => {
                toast({
                  variant: "destructive",
                  title: "Content Load Error",
                  description: "Could not load content. Some websites restrict embedding. Try opening in a new tab.",
                });
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Note: Some websites may not work correctly within this embedded browser due to security restrictions (e.g., X-Frame-Options). Use the "Open in new tab" button if needed.</p>
        </CardContent>
      </Card>
    </div>
  );
}
