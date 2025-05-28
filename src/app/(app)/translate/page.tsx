
"use client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages, ArrowRightLeft, Volume2 } from "lucide-react";
import { useState } from 'react';
import { translateText, type TranslateTextInput, type TranslateTextOutput } from '@/ai/flows/translate-text';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

const popularLanguages = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "bn", name: "Bengali" },
  { code: "mr", name: "Marathi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
];

export default function TranslatePage() {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [sourceLang, setSourceLang] = useState('en'); // Default source: English
  const [targetLang, setTargetLang] = useState('hi'); // Default target: Hindi
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError("Please enter text to translate.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setTranslatedText(null);
    try {
      const input: TranslateTextInput = { text: inputText, targetLanguage: popularLanguages.find(l => l.code === targetLang)?.name || targetLang };
      const result: TranslateTextOutput = await translateText(input);
      setTranslatedText(result.translation);
    } catch (err) {
      console.error("Error translating text:", err);
      setError("Failed to translate text. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSwapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    // Optionally swap text if desired
    // if(inputText && translatedText) {
    //   setInputText(translatedText);
    //   setTranslatedText(inputText);
    // }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Languages className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">AI Translator</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Translate Text</CardTitle>
          <CardDescription>Translate text between various languages using AI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <div>
              <Label htmlFor="source-lang">From</Label>
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger id="source-lang">
                  <SelectValue placeholder="Source Language" />
                </SelectTrigger>
                <SelectContent>
                  {popularLanguages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea 
                placeholder="Enter text to translate..." 
                className="mt-2 min-h-[150px]"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>
            
            <Button variant="outline" size="icon" onClick={handleSwapLanguages} className="mb-[4.5rem] md:mb-9 mx-auto">
              <ArrowRightLeft className="h-5 w-5" />
            </Button>

            <div>
              <Label htmlFor="target-lang">To</Label>
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger id="target-lang">
                  <SelectValue placeholder="Target Language" />
                </SelectTrigger>
                <SelectContent>
                  {popularLanguages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea 
                placeholder="Translation will appear here..." 
                className="mt-2 min-h-[150px] bg-muted/50"
                value={isLoading ? "Translating..." : translatedText || ""}
                readOnly
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleTranslate} disabled={isLoading}>
              {isLoading ? <Languages className="h-4 w-4 animate-pulse" /> : <Languages className="h-4 w-4"/>}
              <span className="ml-2">Translate</span>
            </Button>
          </div>
          
          {isLoading && (
             <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-full" />
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
        </CardContent>
      </Card>
    </div>
  );
}
