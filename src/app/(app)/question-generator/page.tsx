
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { FileQuestion, Settings2, History, BarChart3, Save, Copy, HelpCircle, Loader2, ListChecks, BookOpen, ChevronRight, ChevronLeft, PlayCircle, RotateCcw, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { Progress } from '@/components/ui/progress';

const SAVED_QUESTIONS_KEY = 'neetPrepProSavedQuestionsMCQ';
const LAST_QUIZ_SCORE_KEY = 'neetPrepProLastQuizScore';

interface QuestionWithAnswer extends GenerateRandomQuestionOutput {
  id: string;
  userAnswerIndex?: number;
  isCorrect?: boolean;
}

interface SavedQuizQuestion extends GenerateRandomQuestionOutput {
  id: string;
  savedAt: string;
}

interface LastQuizScore {
  score: number;
  totalQuestions: number;
  accuracy: number;
  timestamp: string;
}

export default function QuestionGeneratorPage() {
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState('11');
  const [subject, setSubject] = useState('physics');
  const [topic, setTopic] = useState('');
  const [source, setSource] = useState('ncert');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'any'>('any');
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);

  const [quizState, setQuizState] = useState<'configuring' | 'inProgress' | 'completed'>('configuring');
  const [currentQuestionSet, setCurrentQuestionSet] = useState<QuestionWithAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>(undefined);
  
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [overallError, setOverallError] = useState<string | null>(null);

  const [score, setScore] = useState(0);
  const [lastQuizScore, setLastQuizScore] = useState<LastQuizScore | null>(null);

  const [savedIndividualQuestions, setSavedIndividualQuestions] = useState<SavedQuizQuestion[]>([]);
  const [isSavedQuestionsDialogOpen, setIsSavedQuestionsDialogOpen] = useState(false);
  
  const [isExplanationDialogOpen, setIsExplanationDialogOpen] = useState(false);
  const [detailedExplanation, setDetailedExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [questionToExplain, setQuestionToExplain] = useState<string | null>(null);

  useEffect(() => {
    setSavedIndividualQuestions(loadFromLocalStorage<SavedQuizQuestion[]>(SAVED_QUESTIONS_KEY, []));
    setLastQuizScore(loadFromLocalStorage<LastQuizScore | null>(LAST_QUIZ_SCORE_KEY, null));
  }, []);

  useEffect(() => {
    saveToLocalStorage(SAVED_QUESTIONS_KEY, savedIndividualQuestions);
  }, [savedIndividualQuestions]);

  const topicsBySubject: Record<string, string[]> = {
    physics: ["Kinematics", "Laws of Motion", "Work, Energy & Power", "Rotational Motion", "Gravitation", "Properties of Solids & Liquids", "Thermodynamics", "Oscillations & Waves", "Optics", "Electrostatics", "Current Electricity", "Magnetic Effects of Current", "EMI & AC", "EM Waves", "Dual Nature of Matter", "Atoms & Nuclei", "Semiconductors"],
    chemistry: ["Basic Concepts", "Structure of Atom", "Classification of Elements", "Chemical Bonding", "States of Matter", "Thermodynamics", "Equilibrium", "Redox Reactions", "Hydrogen", "s-Block", "p-Block (Gr 13-14)", "Organic - Basic Principles", "Hydrocarbons", "Environmental Chemistry", "Solid State", "Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry", "Metallurgy", "p-Block (Gr 15-18)", "d & f-Block", "Coordination Compounds", "Haloalkanes/Haloarenes", "Alcohols, Phenols, Ethers", "Aldehydes, Ketones, Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"],
    biology: ["The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom", "Morphology - Flowering Plants", "Anatomy - Flowering Plants", "Structural Organisation - Animals", "Cell: Unit of Life", "Biomolecules", "Cell Cycle & Division", "Transport in Plants", "Mineral Nutrition", "Photosynthesis", "Respiration in Plants", "Plant Growth & Development", "Digestion & Absorption", "Breathing & Gases", "Body Fluids & Circulation", "Excretory Products", "Locomotion & Movement", "Neural Control", "Chemical Coordination", "Reproduction in Organisms", "Sexual Reproduction - Plants", "Human Reproduction", "Reproductive Health", "Inheritance & Variation", "Molecular Basis of Inheritance", "Evolution", "Human Health & Disease", "Food Production Strategies", "Microbes in Human Welfare", "Biotech: Principles", "Biotech: Applications", "Organisms & Populations", "Ecosystem", "Biodiversity & Conservation", "Environmental Issues"],
  };

  useEffect(() => {
    if (subject && topicsBySubject[subject]?.length > 0) {
      setTopic(topicsBySubject[subject][0]);
    } else {
      setTopic('');
    }
  }, [subject]);

  const fetchNewQuestion = async () => {
    if (!selectedClass || !subject || !topic || !source) {
      setOverallError("Please select class, subject, topic, and source.");
      return null;
    }
    setIsLoadingQuestion(true);
    setOverallError(null);
    logActivity("Quiz Generation", `Fetching question ${currentQuestionSet.length + 1} for ${subject} - ${topic}`);
    try {
      const input: GenerateRandomQuestionInput = {
        subject,
        topic,
        source,
        ...(difficulty !== 'any' && { difficulty }),
      };
      const output = await generateRandomQuestion(input);
      logActivity("Quiz Generation", `Successfully fetched question: ${output.question.substring(0,30)}...`);
      return { ...output, id: crypto.randomUUID() };
    } catch (err) {
      console.error("Error generating question:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error generating question.";
      setOverallError(`Failed to generate question: ${errorMessage}`);
      toast({ variant: "destructive", title: "Question Generation Error", description: errorMessage });
      return null;
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleStartQuiz = async () => {
    setQuizState('inProgress');
    setCurrentQuestionIndex(0);
    setCurrentQuestionSet([]);
    setScore(0);
    setSelectedAnswer(undefined);
    setOverallError(null);
    
    const firstQuestion = await fetchNewQuestion();
    if (firstQuestion) {
      setCurrentQuestionSet([firstQuestion]);
    } else {
      setQuizState('configuring'); 
    }
  };

  const handleNextQuestion = async () => {
    if (selectedAnswer === undefined && currentQuestionIndex < currentQuestionSet.length) { 
        toast({variant: "destructive", title: "No Answer Selected", description: "Please select an answer before proceeding."});
        return;
    }

    const updatedQuestionSet = [...currentQuestionSet];
    if (currentQuestionIndex < updatedQuestionSet.length) { 
        const currentQ = updatedQuestionSet[currentQuestionIndex];
        currentQ.userAnswerIndex = parseInt(selectedAnswer!, 10);
        currentQ.isCorrect = currentQ.userAnswerIndex === currentQ.correctAnswerIndex;
        
        if (currentQ.isCorrect) {
            setScore(prevScore => prevScore + 1);
        }
    }
    // setCurrentQuestionSet(updatedQuestionSet); // Set this after potential new question fetch

    if (currentQuestionIndex < numberOfQuestions - 1) {
      setSelectedAnswer(undefined);
      const nextQIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQIndex);

      if (nextQIndex >= updatedQuestionSet.length) { // Fetch new question if we don't have it
        const nextQ = await fetchNewQuestion();
        if (nextQ) {
          setCurrentQuestionSet(prevSet => [...prevSet, nextQ]);
        } else {
          toast({variant: "destructive", title: "Failed to load next question", description: "You can review your current progress or restart."});
          setQuizState('completed'); // End quiz if question fails to load
          logActivity("Quiz Error", "Failed to load next question mid-quiz", { attempted: currentQuestionIndex + 1});
          // Save score with currently answered questions
          const finalTotalQuestions = updatedQuestionSet.length;
          const finalAccuracy = finalTotalQuestions > 0 ? (score / finalTotalQuestions) * 100 : 0;
          const newLastScore: LastQuizScore = {
              score: score, // Score up to this point
              totalQuestions: finalTotalQuestions,
              accuracy: finalAccuracy,
              timestamp: new Date().toISOString(),
          };
          saveToLocalStorage(LAST_QUIZ_SCORE_KEY, newLastScore);
          setLastQuizScore(newLastScore);
          return;
        }
      } else {
         setCurrentQuestionSet(updatedQuestionSet); // If question already exists, just update state
      }
    } else {
      // This is the last question, mark quiz as completed
      setCurrentQuestionSet(updatedQuestionSet); // Ensure last answer is recorded
      const finalScore = score; // Score has been updated for the last question
      const finalTotalQuestions = updatedQuestionSet.length;
      const finalAccuracy = finalTotalQuestions > 0 ? (finalScore / finalTotalQuestions) * 100 : 0;
      
      const newLastScore: LastQuizScore = {
          score: finalScore,
          totalQuestions: finalTotalQuestions,
          accuracy: finalAccuracy,
          timestamp: new Date().toISOString(),
      };
      saveToLocalStorage(LAST_QUIZ_SCORE_KEY, newLastScore);
      setLastQuizScore(newLastScore);

      setQuizState('completed');
      logActivity("Quiz Completed", `User finished quiz. Score: ${finalScore}/${finalTotalQuestions}`, { score: finalScore, total: finalTotalQuestions });
    }
  };
  
  const handleRestartQuiz = () => {
    setQuizState('configuring');
    setOverallError(null);
  };

  const handleSaveIndividualQuestion = (questionData: GenerateRandomQuestionOutput) => {
    const newSavedQuestion: SavedQuizQuestion = {
      ...questionData,
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
    };
    setSavedIndividualQuestions(prev => [newSavedQuestion, ...prev]);
    toast({title: "Question Saved!", description: "This question has been added to your saved questions list."});
    logActivity("Question Save", `Question saved: "${questionData.question.substring(0,30)}..."`);
  };

  const handleCopyQuestion = (questionText: string) => {
    navigator.clipboard.writeText(questionText)
      .then(() => {
        toast({ title: "Question Copied!", description: "Question text copied to clipboard." });
        logActivity("Question Action", "Question text copied.", { length: questionText.length });
      })
      .catch(err => {
        toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy question to clipboard." });
        console.error("Failed to copy question: ", err);
      });
  };

  const handleExplainThisQuestion = async (qText: string) => {
     if (!qText) return;
     setIsExplaining(true);
     setQuestionToExplain(qText);
     setDetailedExplanation(null);
     setIsExplanationDialogOpen(true);
     logActivity("Question Explanation", `Requested explanation for: "${qText.substring(0,50)}..."`);
     try {
        const input: ExplainQuestionInput = { question: qText };
        const output: ExplainQuestionOutput = await explainQuestion(input);
        setDetailedExplanation(output.explanation);
     } catch (err) {
        console.error("Error explaining question:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error explaining question.";
        setDetailedExplanation(`Failed to get detailed explanation: ${errorMessage}`);
        toast({ variant: "destructive", title: "Explanation Error", description: errorMessage});
        logActivity("Explanation Error", `Failed to explain question: "${qText.substring(0,50)}..."`, { error: errorMessage });
     } finally {
        setIsExplaining(false);
     }
  };

  const currentQuestionData = currentQuestionSet[currentQuestionIndex];

  if (quizState === 'inProgress') {
    if (isLoadingQuestion && !currentQuestionData) {
      return (
        <div className="space-y-6 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading first question...</p>
        </div>
      );
    }
     if (!currentQuestionData) {
        return (
             <div className="space-y-6 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <XCircle className="h-12 w-12 text-destructive mb-2" />
                <p className="text-lg">Error loading question.</p>
                <p className="text-muted-foreground mb-4">{overallError || "An unexpected error occurred."}</p>
                <Button onClick={handleRestartQuiz}><RotateCcw className="mr-2 h-4 w-4"/>Try Again</Button>
            </div>
        );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-primary">NEET Practice Quiz</h1>
          <div className="text-lg font-semibold">Question {currentQuestionIndex + 1} of {numberOfQuestions}</div>
        </div>
        <Progress value={((currentQuestionIndex + 1) / numberOfQuestions) * 100} className="w-full h-2" />
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl leading-tight">
              {currentQuestionData.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} className="space-y-3">
              {currentQuestionData.options.map((option, index) => (
                <Label 
                  key={index} 
                  htmlFor={`option-${index}`} 
                  className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary"
                >
                  <RadioGroupItem value={String(index)} id={`option-${index}`} />
                  <span>{option}</span>
                </Label>
              ))}
            </RadioGroup>
             {isLoadingQuestion && currentQuestionIndex < numberOfQuestions -1 && (
                <div className="mt-6 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary"/>
                    <span className="ml-2 text-muted-foreground">Loading next question...</span>
                </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end pt-4">
            <Button onClick={handleNextQuestion} disabled={selectedAnswer === undefined || (isLoadingQuestion && currentQuestionIndex < numberOfQuestions -1) }>
              {currentQuestionIndex < numberOfQuestions - 1 ? "Next Question" : "Finish Quiz"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (quizState === 'completed') {
    const accuracy = currentQuestionSet.length > 0 ? (score / currentQuestionSet.length) * 100 : 0;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Quiz Results</h1>
          <Button onClick={handleRestartQuiz} variant="outline"><RotateCcw className="mr-2 h-4 w-4"/> Start New Quiz</Button>
        </div>
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <CardTitle className="text-2xl">Your Performance</CardTitle>
            <CardDescription>You answered {score} out of {currentQuestionSet.length} questions correctly.</CardDescription>
            <div className="text-5xl font-bold text-primary mt-2">{accuracy.toFixed(0)}%</div>
            <Progress value={accuracy} className="w-1/2 mx-auto mt-2 h-3" />
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-semibold mb-4 mt-6 text-center">Review Your Answers</h3>
            <ScrollArea className="h-[calc(100vh-32rem)] sm:h-[calc(100vh-30rem)] md:h-[45vh] p-1 border rounded-md">
              <div className="space-y-4 p-3">
                {currentQuestionSet.map((q, index) => (
                  <Card key={q.id} className={`p-4 ${q.isCorrect ? 'border-green-500 bg-green-500/5' : 'border-destructive bg-destructive/5'}`}>
                    <p className="font-semibold">Q{index + 1}: {q.question}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} 
                             className={`flex items-center p-1.5 rounded-md
                                         ${optIndex === q.correctAnswerIndex ? 'bg-green-500/20 text-green-700 dark:text-green-300 font-medium' : ''}
                                         ${optIndex === q.userAnswerIndex && optIndex !== q.correctAnswerIndex ? 'bg-red-500/20 text-red-700 dark:text-red-400 line-through' : ''}
                                         ${optIndex === q.userAnswerIndex && optIndex === q.correctAnswerIndex ? 'ring-2 ring-green-500' : ''}
                                         `}
                        >
                          {optIndex === q.userAnswerIndex && q.isCorrect && <CheckCircle className="h-4 w-4 mr-2 text-green-500 shrink-0"/>}
                          {optIndex === q.userAnswerIndex && !q.isCorrect && <XCircle className="h-4 w-4 mr-2 text-red-500 shrink-0"/>}
                          {optIndex !== q.userAnswerIndex && optIndex === q.correctAnswerIndex && <CheckCircle className="h-4 w-4 mr-2 text-green-500 shrink-0 opacity-50"/>}
                           {!((optIndex === q.userAnswerIndex && q.isCorrect) || (optIndex === q.userAnswerIndex && !q.isCorrect) || (optIndex !== q.userAnswerIndex && optIndex === q.correctAnswerIndex)) && <span className="w-6 mr-2 shrink-0"></span>}
                          {opt}
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground"><strong className="text-accent">Explanation:</strong> {q.explanation}</p>
                    <div className="mt-3 flex space-x-2">
                       <Button variant="outline" size="sm" onClick={() => handleSaveIndividualQuestion(q)} className="text-xs"><Save className="mr-1.5 h-3.5 w-3.5"/>Save Q</Button>
                       <Button variant="outline" size="sm" onClick={() => handleExplainThisQuestion(q.question)} className="text-xs"><HelpCircle className="mr-1.5 h-3.5 w-3.5"/>Explain More</Button>
                       <Button variant="outline" size="sm" onClick={() => handleCopyQuestion(q.question)} className="text-xs"><Copy className="mr-1.5 h-3.5 w-3.5"/>Copy Q</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <FileQuestion className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">AI Question Generator</h1>
        </div>
         <Dialog open={isSavedQuestionsDialogOpen} onOpenChange={setIsSavedQuestionsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setIsSavedQuestionsDialogOpen(true)}>
              <ListChecks className="mr-2 h-4 w-4"/> View Saved Questions ({savedIndividualQuestions.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Saved Individual Questions</DialogTitle>
              <DialogDescription>Review questions you've saved. These are not quiz results. Saved on: {new Date(savedIndividualQuestions[0]?.savedAt || Date.now()).toLocaleDateString()}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1 mt-2">
              {savedIndividualQuestions.length > 0 ? (
                <div className="space-y-4">
                  {savedIndividualQuestions.map(sq => (
                    <Card key={sq.id} className="bg-card/60">
                      <CardContent className="p-4 space-y-2">
                        <p className="text-sm font-semibold">Q: {sq.question}</p>
                        <p className="text-xs">Options: {sq.options.map((o, i) => `${String.fromCharCode(65+i)}. ${o}`).join(" | ")}</p>
                        <p className="text-xs text-green-400">Correct: {String.fromCharCode(65+sq.correctAnswerIndex)}. {sq.options[sq.correctAnswerIndex]}</p>
                        <p className="text-xs text-muted-foreground">Expl: {sq.explanation}</p>
                        <p className="text-xs text-muted-foreground/70">Saved: {new Date(sq.savedAt).toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No individual questions saved yet.</p>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Configure Your Practice Quiz</CardTitle>
            <CardDescription>Select subject, topic, difficulty, and number of questions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="class-select">Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass} disabled={isLoadingQuestion}>
                  <SelectTrigger id="class-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="11">Class 11</SelectItem>
                    <SelectItem value="12">Class 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject-select">Subject</Label>
                <Select value={subject} onValueChange={(value) => { setSubject(value); }} disabled={isLoadingQuestion}>
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
                <Select value={topic} onValueChange={setTopic} disabled={isLoadingQuestion || !subject || topicsBySubject[subject]?.length === 0}>
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
                <Select value={source} onValueChange={setSource} disabled={isLoadingQuestion}>
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
                <Select value={difficulty} onValueChange={(value) => setDifficulty(value as 'easy' | 'medium' | 'hard' | 'any')} disabled={isLoadingQuestion}>
                  <SelectTrigger id="difficulty-select"><SelectValue placeholder="Any Difficulty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Difficulty</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="num-questions">Number of Questions</Label>
                <Input 
                    id="num-questions" 
                    type="number" 
                    value={numberOfQuestions} 
                    onChange={(e) => setNumberOfQuestions(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    min="1" 
                    max="50"
                    disabled={isLoadingQuestion} />
              </div>
            </div>
             {overallError && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Configuration Error</AlertTitle>
                <AlertDescription>{overallError}</AlertDescription>
              </Alert>
            )}
            <Button className="w-full mt-6" onClick={handleStartQuiz} disabled={isLoadingQuestion || !topic || numberOfQuestions < 1}>
              <PlayCircle className="mr-2 h-5 w-5" />
              Start Quiz
            </Button>
          </CardContent>
        </Card>

        <Dialog open={isExplanationDialogOpen} onOpenChange={setIsExplanationDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Detailed Explanation for: "{questionToExplain?.substring(0,70)}..."</DialogTitle>
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
           <CardDescription>Track your accuracy and review past performance.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-accent"/>Last Quiz Accuracy</h3>
            {lastQuizScore ? (
                <>
                    <p className="text-2xl font-bold">{lastQuizScore.accuracy.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">
                        ({lastQuizScore.score}/{lastQuizScore.totalQuestions} correct on {new Date(lastQuizScore.timestamp).toLocaleDateString()})
                    </p>
                </>
            ) : (
                <>
                    <p className="text-2xl font-bold">--%</p>
                    <p className="text-sm text-muted-foreground">Complete a quiz to see accuracy</p>
                </>
            )}
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold flex items-center"><History className="mr-2 h-5 w-5 text-accent"/>Performance History</h3>
            <p className="text-muted-foreground">View your progress over time.</p>
            <Button variant="link" className="p-0 h-auto mt-1" disabled>View History (Coming Soon)</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    