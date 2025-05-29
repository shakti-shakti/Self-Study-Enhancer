
"use client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SpellCheck, BookText, Search, History, Trash2 } from "lucide-react";
import { useState, useEffect } from 'react';
import { defineWord, type DefineWordInput, type DefineWordOutput } from '@/ai/flows/define-word';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/local-storage";
import { logActivity } from "@/lib/activity-logger";

interface SearchHistoryItem {
  id: string;
  word: string;
  definition: string;
  timestamp: string;
}
const DICTIONARY_HISTORY_KEY = 'neetPrepProDictionaryHistory';

export default function DictionaryPage() {
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    setSearchHistory(loadFromLocalStorage<SearchHistoryItem[]>(DICTIONARY_HISTORY_KEY, []));
  }, []);

  useEffect(() => {
    saveToLocalStorage(DICTIONARY_HISTORY_KEY, searchHistory);
  }, [searchHistory]);

  const handleDefineWord = async () => {
    if (!word.trim()) {
      setError("Please enter a word.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setDefinition(null);
    logActivity("Dictionary", `User searched for word: "${word}"`);
    try {
      const input: DefineWordInput = { word };
      const result: DefineWordOutput = await defineWord(input);
      setDefinition(result.definition);
      
      // Add to history
      const newHistoryItem: SearchHistoryItem = {
        id: crypto.randomUUID(),
        word: word,
        definition: result.definition,
        timestamp: new Date().toISOString(),
      };
      setSearchHistory(prev => [newHistoryItem, ...prev].slice(0, 20)); // Keep last 20 searches
      logActivity("Dictionary Success", `Definition found for: "${word}"`);

    } catch (err) {
      console.error("Error defining word:", err);
      setError("Failed to get definition. Please try again.");
      logActivity("Dictionary Error", `Failed to define word: "${word}"`, { error: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    logActivity("Dictionary", "Search history cleared.");
  };
  
  const handleHistoryItemClick = (item: SearchHistoryItem) => {
    setWord(item.word);
    setDefinition(item.definition);
    setError(null);
    setIsLoading(false);
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
            <CardDescription>Enter a word to get its AI-powered definition.</CardDescription>
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
              />
              <Button onClick={handleDefineWord} disabled={isLoading}>
                {isLoading ? <Search className="h-4 w-4 animate-pulse" /> : <Search className="h-4 w-4"/>}
                <span className="ml-2">Define</span>
              </Button>
            </div>
            
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
                  <p className="text-base leading-relaxed">{definition}</p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center"><History className="mr-2 h-5 w-5"/>Search History</CardTitle>
                    {searchHistory.length > 0 && (
                        <Button variant="ghost" size="icon" onClick={handleClearHistory} title="Clear history">
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                    )}
                </div>
                <CardDescription>Your recent word searches.</CardDescription>
            </CardHeader>
            <CardContent>
                {searchHistory.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                        <ul className="space-y-2">
                            {searchHistory.map(item => (
                                <li key={item.id}>
                                    <Button 
                                        variant="link" 
                                        className="p-0 h-auto text-left text-sm text-primary hover:text-primary/80"
                                        onClick={() => handleHistoryItemClick(item)}
                                    >
                                        {item.word}
                                    </Button>
                                    <p className="text-xs text-muted-foreground truncate">{item.definition}</p>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                ) : (
                    <p className="text-sm text-muted-foreground">No search history yet.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    