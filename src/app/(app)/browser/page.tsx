
"use client";
import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Globe, Search, RefreshCw, ArrowLeft, ArrowRight, ExternalLink, ShieldAlert, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activity-logger';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/hooks/use-auth';

export default function BrowserPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentUrl, setCurrentUrl] = useState("https://www.google.com/search?igu=1"); // Initial URL for the iframe
  const [inputValue, setInputValue] = useState("https://www.google.com/search?igu=1"); // URL in the input bar
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [history, setHistory] = useState<string[]>(["https://www.google.com/search?igu=1"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(Date.now()); // Used to force iframe re-render
  const [showLoadError, setShowLoadError] = useState(false);

  const navigate = (targetUrl: string, fromHistory = false) => {
    let finalUrl = targetUrl.trim();
    if (!finalUrl) return;
    setShowLoadError(false); // Reset error message on new navigation

    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}&igu=1`;
    } else if (finalUrl.includes("google.com/search") && !finalUrl.includes("igu=1")){
      finalUrl = finalUrl.includes("?") ? `${finalUrl}&igu=1` : `${finalUrl}?igu=1`;
    }
    
    setCurrentUrl(finalUrl); // This will be the src for the iframe
    setInputValue(finalUrl); // Update the address bar input

    if (!fromHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(finalUrl);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    setIframeKey(Date.now()); // Force iframe to re-render by changing its key
    if (user) logActivity("Browser", `Navigated to: ${finalUrl.substring(0,100)}`, undefined, user.id);
  };

  const handleSearchOrNavigate = (e?: FormEvent) => {
    if (e) e.preventDefault();
    navigate(inputValue);
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      // Setting src directly might not always re-trigger load if URL is the same.
      // Changing the key is more reliable for forcing a re-render and re-attempt load.
      setIframeKey(Date.now()); 
      setShowLoadError(false);
      if (user) logActivity("Browser", `Refreshed URL: ${currentUrl.substring(0,100)}`, undefined, user.id);
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      navigate(history[newIndex], true); 
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      navigate(history[newIndex], true); 
    }
  };
  
  const openInNewTab = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
      if (user) logActivity("Browser", `Opened in new tab: ${currentUrl.substring(0,100)}`, undefined, user.id);
    }
  }

  // This is a basic way to detect if content loaded. It's not foolproof.
  // Some sites might load a blank page instead of an error.
  const handleIframeLoad = () => {
    try {
      // Attempting to access contentWindow.document will throw a cross-origin error
      // if the iframe loaded content from a different origin and that content has
      // X-Frame-Options or CSP preventing access.
      // If it's null or doesn't throw, it might be okay or a blank page from same origin.
      // A successful load of a cross-origin page that allows embedding won't throw here.
      const isContentAccessible = iframeRef.current?.contentWindow?.document;
      // If we can't access document, it's likely blocked or cross-origin restricted.
      // This isn't a perfect detection for "blocked by X-Frame-Options" but a hint.
      // A more robust check might involve waiting a short period and checking iframe's src
      // vs. currentUrl, or listening for specific postMessages, but that's complex.
      // For now, we rely on the iframe's native behavior and the error message.
    } catch (e) {
      // This catch block itself indicates a cross-origin access attempt, common with blocked iframes.
      setShowLoadError(true);
      if (user) logActivity("Browser Error", `Iframe content likely blocked by security policy: ${currentUrl.substring(0,100)}`, undefined, user.id);
    }
  };
  
  // Alternative simpler error for iframes: just use onError
  const handleIframeError = () => {
    setShowLoadError(true);
    if (user) logActivity("Browser Error", `Iframe native error for URL: ${currentUrl.substring(0,100)}`, undefined, user.id);
  };


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
        </AlertDescription>
      </Alert>
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle>In-App Web Search</CardTitle>
          <CardDescription>Search doubts, watch lectures (if embeddable), and access online resources.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          <form onSubmit={handleSearchOrNavigate} className="flex items-center space-x-2">
            <Button type="button" variant="outline" size="icon" onClick={handleBack} disabled={historyIndex === 0}><ArrowLeft className="h-4 w-4" /></Button>
            <Button type="button" variant="outline" size="icon" onClick={handleForward} disabled={historyIndex === history.length - 1}><ArrowRight className="h-4 w-4" /></Button>
            <Button type="button" variant="outline" size="icon" onClick={handleRefresh}><RefreshCw className="h-4 w-4" /></Button>
            <Input 
              type="text" 
              placeholder="Search Google or type a URL" 
              className="flex-1" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              aria-label="Address or search bar"
            />
            <Button type="submit"><Search className="h-4 w-4 mr-2" />Search</Button>
            <Button type="button" variant="outline" size="icon" onClick={openInNewTab} title="Open in new tab">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </form>
          <div className="p-1 border rounded-lg h-full bg-muted/30 flex flex-col items-center justify-center overflow-hidden relative">
            {showLoadError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 p-4 text-center">
                    <XCircle className="h-12 w-12 text-destructive mb-3" />
                    <p className="font-semibold text-lg">Could Not Load Content</p>
                    <p className="text-sm text-muted-foreground mb-3">
                        This page might not allow embedding. Try opening it in a new tab.
                    </p>
                    <Button onClick={openInNewTab} variant="secondary">
                        <ExternalLink className="mr-2 h-4 w-4" /> Open in New Tab
                    </Button>
                </div>
            )}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={currentUrl}
              title="Mini Browser Content"
              className="w-full h-full border-0"
              sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
              onLoad={handleIframeLoad}
              onError={handleIframeError} // Generic error if the iframe itself fails
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    