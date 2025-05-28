
"use client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SpellCheck, BookText, Search } from "lucide-react";
import { useState } from 'react';
import { defineWord, type DefineWordInput, type DefineWordOutput } from '@/ai/flows/define-word'; // Assuming this path
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function DictionaryPage() {
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDefineWord = async () => {
    if (!word.trim()) {
      setError("Please enter a word.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setDefinition(null);
    try {
      const input: DefineWordInput = { word };
      const result: DefineWordOutput = await defineWord(input);
      setDefinition(result.definition);
    } catch (err) {
      console.error("Error defining word:", err);
      setError("Failed to get definition. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <SpellCheck className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">AI Dictionary</h1>
      </div>
      <Card>
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
    </div>
  );
}
