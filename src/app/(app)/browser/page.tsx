
"use client";
import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Globe, Search, RefreshCw, ArrowLeft, ArrowRight, ExternalLink, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activity-logger';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BrowserPage() {
  const { toast } = useToast();
  const [url, setUrl] = useState("https://www.google.com/search?igu=1");
  const [inputValue, setInputValue] = useState("https://www.google.com");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [history, setHistory] = useState<string[]>(["https://www.google.com/search?igu=1"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(Date.now()); // Used to force iframe re-render

  const navigate = (targetUrl: string, fromHistory = false) => {
    let finalUrl = targetUrl.trim();
    if (!finalUrl) return;

    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}&igu=1`;
    } else if (finalUrl.includes("google.com/search") && !finalUrl.includes("igu=1")){
      finalUrl = finalUrl.includes("?") ? `${finalUrl}&igu=1` : `${finalUrl}?igu=1`;
    }
    
    setUrl(finalUrl);
    setIframeKey(Date.now()); // Force iframe to re-render with new src

    if (!fromHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(finalUrl);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    setInputValue(finalUrl);
    logActivity("Browser", `Navigated to URL (or search): ${finalUrl.substring(0,100)}`);
  };

  const handleSearch = () => {
    navigate(inputValue);
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = url; // Re-assign src
      setIframeKey(Date.now()); // Force re-render if src didn't change but content might
      logActivity("Browser", `Refreshed URL: ${url.substring(0,100)}`);
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      navigate(history[newIndex], true); // Navigate from history
      logActivity("Browser", `Navigated back to: ${history[newIndex].substring(0,100)}`);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      navigate(history[newIndex], true); // Navigate from history
      logActivity("Browser", `Navigated forward to: ${history[newIndex].substring(0,100)}`);
    }
  };
  
  const openInNewTab = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      logActivity("Browser", `Opened in new tab: ${url.substring(0,100)}`);
    }
  }

  const handleIframeError = () => {
    toast({
      variant: "destructive",
      title: "Content Load Error",
      description: "Could not load content. Many websites (like YouTube) restrict embedding. Try opening the page in a new tab using the button above.",
      duration: 7000,
    });
    logActivity("Browser Error", `Iframe load error for URL: ${url.substring(0,100)}`);
  }

  // Try to detect iframes that might block content. This is not foolproof.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const listener = () => {
        try {
            // Try to access contentWindow. If it's null or throws an error, it's likely blocked.
            if (!iframe.contentWindow || !iframe.contentWindow.document) {
                 handleIframeError();
            }
        } catch (e) {
            handleIframeError();
        }
    };

    iframe.addEventListener('load', listener);
    return () => {
        iframe.removeEventListener('load', listener);
    };
  }, [url, iframeKey]); // Re-attach listener if URL or key changes

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center space-x-3">
        <Globe className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Mini Browser</h1>
      </div>
      <Alert variant="default" className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300">
        <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-700 dark:text-amber-300">Embedding Limitations</AlertTitle>
        <AlertDescription className="text-amber-600/90 dark:text-amber-400/90">
          Many websites (e.g., YouTube, Google login pages, news sites) prevent embedding in other applications for security reasons. 
          If a site doesn't load or function correctly, please use the <ExternalLink className="inline h-3 w-3 mx-0.5"/> "Open in new tab" button. 
          The `igu=1` parameter is added to Google search URLs to sometimes improve compatibility.
        </AlertDescription>
      </Alert>
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle>In-App Web Search</CardTitle>
          <CardDescription>Search doubts, watch lectures (if embeddable), and access online resources.</CardDescription>
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
              key={iframeKey} // Force re-render on URL change
              ref={iframeRef}
              src={url}
              title="Mini Browser Content"
              className="w-full h-full border-0"
              sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
              onError={handleIframeError}
              // onLoad is tricky because it might fire even for blocked pages.
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    