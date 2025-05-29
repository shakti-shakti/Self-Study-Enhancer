
"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { FileQuestion, Settings2, History, BarChart3, Save, Copy, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateRandomQuestion, type GenerateRandomQuestionInput, type GenerateRandomQuestionOutput } from '@/ai/flows/generate-random-questions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';

const initialQuestionData: GenerateRandomQuestionOutput = {
  question: "",
  answer: "",
  explanation: ""
};

export default function QuestionGeneratorPage() {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [source, setSource] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | ''>('');
  
  const [generatedData, setGeneratedData] = useState<GenerateRandomQuestionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock topics - in a real app, these might be fetched based on subject
  const topicsBySubject: Record<string, string[]> = {
    physics: ["Kinematics", "Laws of Motion", "Optics", "Thermodynamics"],
    chemistry: ["Chemical Bonding", "Atomic Structure", "Organic Chemistry Basics", "Solutions"],
    biology: ["Cell Biology", "Genetics", "Human Physiology", "Plant Kingdom"],
  };

  const handleGenerateQuestion = async () => {
    if (!selectedClass || !subject || !topic || !source) {
      setError("Please select class, subject, topic, and source.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedData(null);

    try {
      const input: GenerateRandomQuestionInput = {
        subject,
        topic,
        source,
        ...(difficulty && { difficulty }), // Add difficulty only if selected
      };
      const output = await generateRandomQuestion(input);
      setGeneratedData(output);
    } catch (err) {
      console.error("Error generating question:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during question generation.";
      setError(`Failed to generate question: ${errorMessage}`);
       toast({
        variant: "destructive",
        title: "Error Generating Question",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuestion = () => {
    if (!generatedData) return;
    // Mock save functionality
    console.log("Saving question:", generatedData);
    toast({
      title: "Question Saved (Mock)",
      description: "This question has been added to your saved questions.",
    });
  };

  const handleCopyQuestion = () => {
    if (!generatedData) return;
    navigator.clipboard.writeText(generatedData.question)
      .then(() => {
        toast({
          title: "Question Copied!",
          description: "The question text has been copied to your clipboard.",
        });
      })
      .catch(err => {
        toast({
          variant: "destructive",
          title: "Copy Failed",
          description: "Could not copy question to clipboard.",
        });
        console.error("Failed to copy text: ", err);
      });
  };

  const handleExplainQuestion = () => {
     if (!generatedData) return;
    // Mock explanation functionality - in a real app, this might call another AI flow
    toast({
      title: "Explanation Requested (Mock)",
      description: "Displaying detailed explanation for the question.",
    });
     // Potentially show a dialog with generatedData.explanation or call another AI for more details
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <FileQuestion className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Random Question Generator</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle>Configure Your Test</CardTitle>
            <CardDescription>Select options to generate questions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="class-select">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass} disabled={isLoading}>
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="11">Class 11</SelectItem>
                  <SelectItem value="12">Class 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject-select">Subject</Label>
              <Select value={subject} onValueChange={(value) => { setSubject(value); setTopic(''); }} disabled={isLoading}>
                <SelectTrigger id="subject-select">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="topic-select">Topic</Label>
              <Select value={topic} onValueChange={setTopic} disabled={isLoading || !subject}>
                <SelectTrigger id="topic-select">
                  <SelectValue placeholder={subject ? "Select Topic" : "Select Subject First"} />
                </SelectTrigger>
                <SelectContent>
                  {(topicsBySubject[subject] || []).map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source-select">Question Source</Label>
              <Select value={source} onValueChange={setSource} disabled={isLoading}>
                <SelectTrigger id="source-select">
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ncert">NCERT</SelectItem>
                  <SelectItem value="previous_year">Previous Year Papers</SelectItem>
                  <SelectItem value="exemplar">Exemplar</SelectItem>
                  <SelectItem value="general_knowledge">General Knowledge</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="difficulty-select">Difficulty (Optional)</Label>
              <Select value={difficulty} onValueChange={(value) => setDifficulty(value as 'easy' | 'medium' | 'hard' | '')} disabled={isLoading}>
                <SelectTrigger id="difficulty-select">
                  <SelectValue placeholder="Any Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Difficulty</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleGenerateQuestion} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Settings2 className="mr-2 h-4 w-4" />}
              Generate Question
            </Button>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>Generated Question</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[300px] p-6 border rounded-lg bg-card/80 flex flex-col justify-start items-start space-y-4">
            {isLoading && (
              <div className="w-full space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-10 w-1/2 mt-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            )}
            {!isLoading && !generatedData && (
              <div className="text-center w-full py-10">
                <FileQuestion className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Your generated question will appear here.</p>
                <p className="text-sm text-muted-foreground">Configure options on the left and click "Generate Question".</p>
              </div>
            )}
            {generatedData && !isLoading && (
              <div className="w-full text-left space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-1">Question:</h3>
                  <p className="text-base whitespace-pre-wrap">{generatedData.question}</p>
                </div>
                <div>
                  <h3 className="text-md font-semibold text-accent mt-3 mb-1">Answer:</h3>
                  <p className="text-base whitespace-pre-wrap bg-muted/50 p-2 rounded">{generatedData.answer}</p>
                </div>
                <div>
                  <h3 className="text-md font-semibold text-accent mt-3 mb-1">Explanation:</h3>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">{generatedData.explanation}</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleSaveQuestion} disabled={!generatedData || isLoading}><Save className="mr-2 h-4 w-4" /> Save</Button>
            <Button variant="outline" onClick={handleCopyQuestion} disabled={!generatedData || isLoading}><Copy className="mr-2 h-4 w-4" /> Copy</Button>
            <Button variant="secondary" onClick={handleExplainQuestion} disabled={!generatedData || isLoading}><HelpCircle className="mr-2 h-4 w-4" /> Explain</Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
           <CardDescription>Track your accuracy and review past performance (feature coming soon).</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-accent"/>Accuracy</h3>
            <p className="text-2xl font-bold">--%</p>
            <p className="text-sm text-muted-foreground">Based on last test (mock)</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold flex items-center"><History className="mr-2 h-5 w-5 text-accent"/>Performance History</h3>
            <p className="text-muted-foreground">View your progress over time.</p>
            <Button variant="link" className="p-0 h-auto mt-1" disabled>View History</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
