
"use client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SpellCheck, BookText, Search, History, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from 'react';
import { defineWord, type DefineWordInput, type DefineWordOutput } from '@/ai/flows/define-word';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { logActivity } from "@/lib/activity-logger";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle, // Added AlertDialogTitle
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SearchHistoryItem {
  id: string; 
  user_id: string;
  word: string;
  definition: string;
  timestamp: string; 
}

const HISTORY_FETCH_LIMIT = 20;

export default function DictionaryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const { toast } = useToast();

  const fetchHistory = useCallback(async () => {
    if (!user) {
        setSearchHistory([]);
        setIsFetchingHistory(false);
        return;
    }
    setIsFetchingHistory(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('dictionary_history')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(HISTORY_FETCH_LIMIT);
      if (fetchError) throw fetchError;
      setSearchHistory(data || []);
    } catch (err) {
      console.error("Error fetching dictionary history:", err);
      toast({ variant: "destructive", title: "History Fetch Error", description: (err as Error).message });
    } finally {
      setIsFetchingHistory(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchHistory();
    } else if (!user && !authLoading) {
      setSearchHistory([]); // Clear history if user logs out
    }
  }, [user, authLoading, fetchHistory]);

  const handleDefineWord = async () => {
    if (!word.trim()) {
      setError("Please enter a word.");
      return;
    }
    if (!user) {
        setError("Please log in to use the dictionary.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setDefinition(null);
    
    try {
      const input: DefineWordInput = { word };
      const result: DefineWordOutput = await defineWord(input);
      setDefinition(result.definition);
      
      logActivity("Dictionary", `User searched for word: "${word}"`, { word }, user.id);
      
      const newHistoryItem = {
        user_id: user.id,
        word: word,
        definition: result.definition,
        timestamp: new Date().toISOString(),
      };
      const { data: savedItem, error: saveError } = await supabase
        .from('dictionary_history')
        .insert(newHistoryItem)
        .select()
        .single();

      if (saveError) throw saveError;
      if (savedItem) {
        // Optimistically add to local state to avoid immediate re-fetch if not critical
         setSearchHistory(prev => [savedItem as SearchHistoryItem, ...prev].slice(0, HISTORY_FETCH_LIMIT));
      }
      
    } catch (err) {
      console.error("Error defining word or saving history:", err);
      setError("Failed to get definition or save to history. Please try again.");
      logActivity("Dictionary Error", `Failed to define/save word: "${word}"`, { error: (err as Error).message, word }, user.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    try {
      const { error: deleteError } = await supabase
        .from('dictionary_history')
        .delete()
        .eq('user_id', user.id);
      if (deleteError) throw deleteError;
      setSearchHistory([]);
      toast({ title: "History Cleared", description: "Your dictionary search history has been cleared."});
      logActivity("Dictionary", "Search history cleared.", undefined, user.id);
    } catch (err) {
      toast({ variant: "destructive", title: "Error Clearing History", description: (err as Error).message });
      logActivity("Dictionary Error", "Failed to clear history.", { error: (err as Error).message }, user.id);
    }
  };
  
  const handleHistoryItemClick = (item: SearchHistoryItem) => {
    setWord(item.word);
    setDefinition(item.definition);
    setError(null);
    setIsLoading(false); 
  };

  if (authLoading && !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3"> <SpellCheck className="h-8 w-8 text-primary" /> <h1 className="text-3xl font-bold tracking-tight">AI Dictionary</h1> </div>
        <Card>
          <CardHeader><CardTitle>Define a Word</CardTitle></CardHeader>
          <CardContent className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <SpellCheck className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">AI Dictionary</h1>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Define a Word</CardTitle>
            <CardDescription>Enter a word to get its AI-powered definition. Your searches are saved to your Supabase account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input 
                type="text" 
                placeholder="Enter a word (e.g., osmosis)" 
                className="flex-1" 
                value={word}
                onChange={(e) => setWord(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleDefineWord()}
                disabled={isLoading || !user}
              />
              <Button onClick={handleDefineWord} disabled={isLoading || !word.trim() || !user}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4"/>}
                <span className="ml-2">Define</span>
              </Button>
            </div>
            
            {!user && (
                <Alert variant="default" className="mt-4 bg-amber-500/10 border-amber-500/30">
                    <AlertTitle className="text-amber-700 dark:text-amber-300">Login Required</AlertTitle>
                    <AlertDescription className="text-amber-600/90 dark:text-amber-400/90">Please log in to use the dictionary and save your search history.</AlertDescription>
                </Alert>
            )}

            {isLoading && (
              <div className="space-y-2 pt-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {definition && !isLoading && (
              <Card className="mt-4 bg-muted/30">
                <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                  <BookText className="h-6 w-6 text-primary"/>
                  <CardTitle className="text-xl">Definition for "{word}"</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{definition}</p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center"><History className="mr-2 h-5 w-5"/>Search History</CardTitle>
                    {searchHistory.length > 0 && user && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="ghost" size="icon" title="Clear history">
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete your dictionary search history from your Supabase account.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClearHistory} className="bg-destructive hover:bg-destructive/90">
                                        Clear History
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
                <CardDescription>Your recent word searches. (Last {HISTORY_FETCH_LIMIT} entries)</CardDescription>
            </CardHeader>
            <CardContent>
                {isFetchingHistory ? (
                    <div className="flex justify-center items-center p-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : !user ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Log in to see your search history.</p>
                ): searchHistory.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                        <ul className="space-y-2">
                            {searchHistory.map(item => (
                                <li key={item.id}>
                                    <Button 
                                        variant="link" 
                                        className="p-0 h-auto text-left text-sm text-primary hover:text-primary/80 whitespace-normal leading-tight"
                                        onClick={() => handleHistoryItemClick(item)}
                                        title={`Define "${item.word}" again`}
                                    >
                                        {item.word}
                                    </Button>
                                    <p className="text-xs text-muted-foreground truncate" title={item.definition}>{item.definition}</p>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No search history yet.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
