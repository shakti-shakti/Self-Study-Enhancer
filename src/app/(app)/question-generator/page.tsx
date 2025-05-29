
"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { FileQuestion, Settings2, History, BarChart3, Save, Copy, HelpCircle, Loader2, ListChecks, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateRandomQuestion, type GenerateRandomQuestionInput, type GenerateRandomQuestionOutput } from '@/ai/flows/generate-random-questions';
import { explainQuestion, type ExplainQuestionInput, type ExplainQuestionOutput } from '@/ai/flows/explain-question';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/local-storage';
import { logActivity } from '@/lib/activity-logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';


const SAVED_QUESTIONS_KEY = 'neetPrepProSavedQuestions';

interface SavedQuestion extends GenerateRandomQuestionOutput {
  id: string;
  savedAt: string;
}

export default function QuestionGeneratorPage() {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState('11'); // Default to Class 11
  const [subject, setSubject] = useState('physics'); // Default to Physics
  const [topic, setTopic] = useState('');
  const [source, setSource] = useState('ncert'); // Default to NCERT
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | ''>('');
  
  const [generatedData, setGeneratedData] = useState<GenerateRandomQuestionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const [isSavedQuestionsDialogOpen, setIsSavedQuestionsDialogOpen] = useState(false);
  const [isExplanationDialogOpen, setIsExplanationDialogOpen] = useState(false);
  const [detailedExplanation, setDetailedExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);


  useEffect(() => {
    setSavedQuestions(loadFromLocalStorage<SavedQuestion[]>(SAVED_QUESTIONS_KEY, []));
  }, []);

  useEffect(() => {
    saveToLocalStorage(SAVED_QUESTIONS_KEY, savedQuestions);
  }, [savedQuestions]);

  const topicsBySubject: Record<string, string[]> = {
    physics: ["Kinematics", "Laws of Motion", "Work, Energy and Power", "Rotational Motion", "Gravitation", "Properties of Solids and Liquids", "Thermodynamics", "Oscillations and Waves", "Optics"],
    chemistry: ["Some Basic Concepts of Chemistry", "Structure of Atom", "Classification of Elements", "Chemical Bonding", "States of Matter", "Thermodynamics", "Equilibrium", "Redox Reactions", "Organic Chemistry - Basic Principles", "Hydrocarbons", "Solutions", "Electrochemistry", "Chemical Kinetics"],
    biology: ["The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom", "Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Structural Organisation in Animals", "Cell: The Unit of Life", "Biomolecules", "Cell Cycle and Cell Division", "Transport in Plants", "Mineral Nutrition", "Photosynthesis", "Respiration in Plants", "Plant Growth and Development", "Digestion and Absorption", "Breathing and Exchange of Gases", "Body Fluids and Circulation", "Excretory Products and their Elimination", "Locomotion and Movement", "Neural Control and Coordination", "Chemical Coordination and Integration", "Reproduction in Organisms", "Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health", "Principles of Inheritance and Variation", "Molecular Basis of Inheritance", "Evolution", "Human Health and Disease", "Strategies for Enhancement in Food Production", "Microbes in Human Welfare", "Biotechnology: Principles and Processes", "Biotechnology and its Applications", "Organisms and Populations", "Ecosystem", "Biodiversity and Conservation", "Environmental Issues"],
  };
   // Set default topic when subject changes
  useEffect(() => {
    if (subject && topicsBySubject[subject]?.length > 0) {
      setTopic(topicsBySubject[subject][0]);
    } else {
      setTopic('');
    }
  }, [subject]);


  const handleGenerateQuestion = async () => {
    if (!selectedClass || !subject || !topic || !source) {
      setError("Please select class, subject, topic, and source.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedData(null);

    logActivity("Question Generation", `Attempting to generate question for ${subject} - ${topic}`);

    try {
      const input: GenerateRandomQuestionInput = {
        subject,
        topic,
        source,
        ...(difficulty && { difficulty }), 
      };
      const output = await generateRandomQuestion(input);
      setGeneratedData(output);
      logActivity("Question Generation", `Successfully generated question for ${subject} - ${topic}`, { question: output.question });
    } catch (err) {
      console.error("Error generating question:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during question generation.";
      setError(`Failed to generate question: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "Error Generating Question",
        description: errorMessage,
      });
      logActivity("Question Generation", `Failed to generate question for ${subject} - ${topic}`, { error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuestion = () => {
    if (!generatedData) return;
    const newSavedQuestion: SavedQuestion = {
      ...generatedData,
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
    };
    setSavedQuestions(prev => [newSavedQuestion, ...prev]);
    toast({
      title: "Question Saved!",
      description: "This question has been added to your saved questions list.",
    });
    logActivity("Question Save", `Question saved: "${generatedData.question.substring(0,30)}..."`);
  };

  const handleCopyQuestion = () => {
    if (!generatedData) return;
    navigator.clipboard.writeText(`Question: ${generatedData.question}\nAnswer: ${generatedData.answer}\nExplanation: ${generatedData.explanation}`)
      .then(() => {
        toast({
          title: "Question Copied!",
          description: "The question, answer and explanation have been copied.",
        });
      })
      .catch(err => {
        toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy." });
      });
  };

  const handleExplainQuestion = async () => {
     if (!generatedData?.question) return;
     setIsExplaining(true);
     setDetailedExplanation(null);
     setIsExplanationDialogOpen(true);
     logActivity("Question Explanation", `Requested explanation for: "${generatedData.question.substring(0,50)}..."`);
     try {
        const input: ExplainQuestionInput = { question: generatedData.question };
        const output: ExplainQuestionOutput = await explainQuestion(input);
        setDetailedExplanation(output.explanation);
     } catch (err) {
        console.error("Error explaining question:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error explaining question.";
        setDetailedExplanation(`Failed to get detailed explanation: ${errorMessage}`);
        toast({ variant: "destructive", title: "Explanation Error", description: errorMessage});
     } finally {
        setIsExplaining(false);
     }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileQuestion className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Random Question Generator</h1>
        </div>
        <Dialog open={isSavedQuestionsDialogOpen} onOpenChange={setIsSavedQuestionsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setIsSavedQuestionsDialogOpen(true)}>
              <ListChecks className="mr-2 h-4 w-4"/> View Saved Questions ({savedQuestions.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Saved Questions</DialogTitle>
              <DialogDescription>Review your saved questions here.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1">
              {savedQuestions.length > 0 ? (
                <div className="space-y-4">
                  {savedQuestions.map(sq => (
                    <Card key={sq.id} className="bg-card/60">
                      <CardContent className="p-4 space-y-2">
                        <p className="text-sm font-semibold">Q: {sq.question}</p>
                        <p className="text-xs text-green-400">A: {sq.answer}</p>
                        <p className="text-xs text-muted-foreground">Expl: {sq.explanation}</p>
                        <p className="text-xs text-muted-foreground/70">Saved: {new Date(sq.savedAt).toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No questions saved yet.</p>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
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
                <SelectTrigger id="class-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="11">Class 11</SelectItem>
                  <SelectItem value="12">Class 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject-select">Subject</Label>
              <Select value={subject} onValueChange={(value) => { setSubject(value); }} disabled={isLoading}>
                <SelectTrigger id="subject-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="topic-select">Topic</Label>
              <Select value={topic} onValueChange={setTopic} disabled={isLoading || !subject || topicsBySubject[subject]?.length === 0}>
                <SelectTrigger id="topic-select">
                  <SelectValue placeholder={!subject ? "Select Subject First" : (topicsBySubject[subject]?.length > 0 ? "Select Topic" : "No topics for subject")} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {(topicsBySubject[subject] || []).map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source-select">Question Source</Label>
              <Select value={source} onValueChange={setSource} disabled={isLoading}>
                <SelectTrigger id="source-select"><SelectValue /></SelectTrigger>
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
                <SelectTrigger id="difficulty-select"><SelectValue placeholder="Any Difficulty" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Difficulty</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleGenerateQuestion} disabled={isLoading || !topic}>
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
            <Button variant="secondary" onClick={handleExplainQuestion} disabled={!generatedData || isLoading || isExplaining}>
                {isExplaining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HelpCircle className="mr-2 h-4 w-4" />} Explain
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Dialog open={isExplanationDialogOpen} onOpenChange={setIsExplanationDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Detailed Explanation</DialogTitle>
              <DialogDescription>AI-generated detailed breakdown of the question.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1 mt-2 border rounded-md bg-muted/30">
                <div className="p-4 whitespace-pre-wrap text-sm">
                {isExplaining && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
                {!isExplaining && detailedExplanation && <p>{detailedExplanation}</p>}
                {!isExplaining && !detailedExplanation && <p>No explanation available or error occurred.</p>}
                </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

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
