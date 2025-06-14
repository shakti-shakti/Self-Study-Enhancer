
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { FileQuestion, Settings2, History, BarChart3, Save, Copy, HelpCircle, Loader2, ListChecks, BookOpen, ChevronRight, ChevronLeft, PlayCircle, RotateCcw, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { generateRandomQuestion, type GenerateRandomQuestionInput, type GenerateRandomQuestionOutput } from '@/ai/flows/generate-random-questions';
import { explainQuestion, type ExplainQuestionInput, type ExplainQuestionOutput } from '@/ai/flows/explain-question';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { logActivity } from '@/lib/activity-logger';
import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface QuestionWithAnswer extends GenerateRandomQuestionOutput {
  id: string;
  userAnswerIndex?: number;
  isCorrect?: boolean;
}

interface SavedQuestionSupabase {
  id: string;
  user_id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
  subject?: string | null;
  topic?: string | null;
  source?: string | null;
  difficulty?: string | null;
  saved_at: string;
}

const SAVED_QUESTIONS_FETCH_LIMIT = 50;

export default function QuestionGeneratorPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

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
  const [isFetchingSavedQuestions, setIsFetchingSavedQuestions] = useState(false);
  const [overallError, setOverallError] = useState<string | null>(null);

  const [score, setScore] = useState(0);

  const [savedIndividualQuestions, setSavedIndividualQuestions] = useState<SavedQuestionSupabase[]>([]);
  const [isSavedQuestionsDialogOpen, setIsSavedQuestionsDialogOpen] = useState(false);

  const [isExplanationDialogOpen, setIsExplanationDialogOpen] = useState(false);
  const [detailedExplanation, setDetailedExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [questionToExplain, setQuestionToExplain] = useState<string | null>(null);


  const fetchSavedQuestions = useCallback(async () => {
    if (!user) {
      setSavedIndividualQuestions([]);
      setIsFetchingSavedQuestions(false);
      return;
    }
    setIsFetchingSavedQuestions(true);
    try {
      const { data, error } = await supabase
        .from('saved_questions')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false })
        .limit(SAVED_QUESTIONS_FETCH_LIMIT);
      if (error) throw error;
      setSavedIndividualQuestions((data as SavedQuestionSupabase[]) || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Fetching Saved Questions", description: (error as Error).message });
      if (user) logActivity("Error", "Failed to fetch saved questions", { error: (error as Error).message }, user.id);
    } finally {
      setIsFetchingSavedQuestions(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user && !authLoading && isSavedQuestionsDialogOpen) {
      fetchSavedQuestions();
    }
  }, [user, authLoading, isSavedQuestionsDialogOpen, fetchSavedQuestions]);


  const topicsBySubject: Record<string, string[]> = {
    physics: ["Kinematics", "Laws of Motion", "Work, Energy & Power", "Rotational Motion", "Gravitation", "Properties of Solids & Liquids", "Thermodynamics", "Oscillations & Waves", "Optics", "Electrostatics", "Current Electricity", "Magnetic Effects of Current", "EMI & AC", "EM Waves", "Dual Nature of Matter", "Atoms & Nuclei", "Semiconductors"],
    chemistry: ["Basic Concepts", "Structure of Atom", "Classification of Elements", "Chemical Bonding", "States of Matter", "Thermodynamics", "Equilibrium", "Redox Reactions", "Hydrogen", "s-Block", "p-Block (Gr 13-14)", "Organic - Basic Principles", "Hydrocarbons", "Environmental Chemistry", "Solid State", "Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry", "Metallurgy", "p-Block (Gr 15-18)", "d & f-Block", "Coordination Compounds", "Haloalkanes/Haloarenes", "Alcohols, Phenols, Ethers", "Aldehydes, Ketones, Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"],
    biology: ["The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom", "Morphology - Flowering Plants", "Anatomy - Flowering Plants", "Structural Organisation - Animals", "Cell: Unit of Life", "Biomolecules", "Cell Cycle & Division", "Transport in Plants", "Mineral Nutrition", "Photosynthesis", "Respiration in Plants", "Plant Growth & Development", "Digestion & Absorption", "Breathing & Gases", "Body Fluids & Circulation", "Excretory Products", "Locomotion & Movement", "Neural Control", "Chemical Coordination", "Reproduction in Organisms", "Sexual Reproduction - Plants", "Human Reproduction", "Reproductive Health", "Inheritance & Variation", "Molecular Basis of Inheritance", "Evolution", "Human Health & Disease", "Food Production Strategies", "Microbes in Human Welfare", "Biotech: Principles", "Biotech: Applications", "Organisms & Populations", "Ecosystem", "Biodiversity & Conservation", "Environmental Issues"],
  };

  useEffect(() => {
    if (subject && topicsBySubject[subject]?.length > 0) {
      if (!topicsBySubject[subject].includes(topic)) {
        setTopic(topicsBySubject[subject][0]);
      }
    } else {
      setTopic('');
    }
  }, [subject, topic]);

  const fetchNewQuestion = useCallback(async (): Promise<QuestionWithAnswer | null> => {
    if (!user) {
      setOverallError("Please log in to generate questions.");
      return null;
    }
    if (!selectedClass || !subject || !topic || !source) {
      setOverallError("Please select class, subject, topic, and source.");
      return null;
    }
    setIsLoadingQuestion(true);
    setOverallError(null);
    logActivity(
      "Quiz Generation",
      `Fetching question ${currentQuestionSet.length + 1} for ${subject} - ${topic}`,
      { class: selectedClass, subject, topic, source, difficulty },
      user.id
    );
    try {
      const input: GenerateRandomQuestionInput = {
        subject,
        topic,
        source,
        ...(difficulty !== 'any' && { difficulty: difficulty as 'easy' | 'medium' | 'hard' }),
      };
      const output = await generateRandomQuestion(input);
      logActivity(
        "Quiz Generation Success",
        `Successfully fetched question: ${output.question.substring(0, 30)}...`,
        undefined, user.id
      );
      return { ...output, id: crypto.randomUUID() };
    } catch (err) {
      console.error("Error generating question:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error generating question.";
      setOverallError(`Failed to generate question: ${errorMessage}`);
      toast({ variant: "destructive", title: "Question Generation Error", description: errorMessage });
      logActivity("Quiz Generation Error", errorMessage, { class: selectedClass, subject, topic, source, difficulty }, user.id);
      return null;
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [user, selectedClass, subject, topic, source, difficulty, currentQuestionSet.length, toast]);

  const handleStartQuiz = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Not Logged In", description: "Please log in to start a quiz." });
      return;
    }
    if (!topic || !subject) {
      toast({ variant: "destructive", title: "Configuration Missing", description: "Please select a subject and topic." });
      return;
    }
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
    if (!user) return;
    if (selectedAnswer === undefined && currentQuestionIndex < currentQuestionSet.length) {
      toast({ variant: "destructive", title: "No Answer Selected", description: "Please select an answer before proceeding." });
      return;
    }

    const updatedQuestionSet = [...currentQuestionSet];
    let currentScore = score;

    if (currentQuestionIndex < updatedQuestionSet.length) {
      const currentQ = updatedQuestionSet[currentQuestionIndex];
      currentQ.userAnswerIndex = parseInt(selectedAnswer!, 10);
      currentQ.isCorrect = currentQ.userAnswerIndex === currentQ.correctAnswerIndex;

      if (currentQ.isCorrect) {
        currentScore++;
      }
    }
    setScore(currentScore);

    if (currentQuestionIndex < numberOfQuestions - 1) {
      setSelectedAnswer(undefined);
      const nextQIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQIndex);

      if (nextQIndex >= updatedQuestionSet.length) {
        const nextQ = await fetchNewQuestion();
        if (nextQ) {
          setCurrentQuestionSet(prevSet => [...prevSet, nextQ]);
        } else {
          toast({ variant: "destructive", title: "Failed to load next question", description: "Quiz ended. You can review your progress or restart." });
          setQuizState('completed');
          if (user) {
            logActivity(
              "Quiz Error",
              "Failed to load next question mid-quiz",
              { attempted: currentQuestionIndex + 1 },
              user.id
            );
            const finalTotalQuestions = updatedQuestionSet.length; // Use the actual number of questions presented
            if (finalTotalQuestions > 0) {
                const finalAccuracy = (currentScore / finalTotalQuestions) * 100;
                const newQuizAttempt = {
                    user_id: user.id,
                    score: currentScore,
                    total_questions: finalTotalQuestions,
                    accuracy: finalAccuracy,
                    subject: subject,
                    topic: topic,
                    quiz_timestamp: new Date().toISOString(),
                };
                await supabase.from('quiz_attempts').insert(newQuizAttempt);
            }
          }
          return;
        }
      } else {
        setCurrentQuestionSet(updatedQuestionSet);
      }
    } else {
      setCurrentQuestionSet(updatedQuestionSet);
      const finalTotalQuestions = updatedQuestionSet.length;
      if (user && finalTotalQuestions > 0) {
        const finalAccuracy = (currentScore / finalTotalQuestions) * 100;
        const newQuizAttempt = {
          user_id: user.id,
          score: currentScore,
          total_questions: finalTotalQuestions,
          accuracy: finalAccuracy,
          subject: subject,
          topic: topic,
          quiz_timestamp: new Date().toISOString(),
        };
        try {
          const { error: insertError } = await supabase.from('quiz_attempts').insert(newQuizAttempt);
          if (insertError) throw insertError;
        } catch (dbError) {
          console.error("Error saving quiz attempt to DB:", dbError);
          toast({ variant: "destructive", title: "DB Error", description: "Could not save quiz results to your account." });
        }

        logActivity(
          "Quiz Completed",
          `User finished quiz. Score: ${currentScore}/${finalTotalQuestions}`,
          { score: currentScore, total: finalTotalQuestions, subject, topic, numQuestionsAttempted: finalTotalQuestions },
          user.id
        );
      }
      setQuizState('completed');
    }
  };

  const handleRestartQuiz = () => {
    setQuizState('configuring');
    setOverallError(null);
    if (user) logActivity("Quiz Action", "User restarted quiz configuration.", undefined, user.id);
  };

  const handleSaveIndividualQuestion = async (questionData: QuestionWithAnswer) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not Logged In", description: "You must be logged in to save questions." });
      return;
    }
    const questionToSave = {
      user_id: user.id,
      question_text: questionData.question,
      options: questionData.options,
      correct_answer_index: questionData.correctAnswerIndex,
      explanation: questionData.explanation,
      subject: subject,
      topic: topic,
      source: source,
      difficulty: difficulty === 'any' ? null : difficulty,
    };

    try {
      const { data, error } = await supabase.from('saved_questions').insert(questionToSave).select().single();
      if (error) throw error;
      toast({ title: "Question Saved!", description: "This question has been saved to your account." });
      if (data && isSavedQuestionsDialogOpen) {
        fetchSavedQuestions();
      }
      if (user) logActivity("Question Save", `Question saved: "${questionData.question.substring(0, 30)}..."`, { questionId: data?.id }, user.id);
    } catch (err) {
      toast({ variant: "destructive", title: "Save Failed", description: (err as Error).message });
      if (user) logActivity("Question Save Error", `Failed to save question: ${(err as Error).message}`, { questionText: questionData.question }, user.id);
    }
  };

  const handleDeleteSavedQuestion = async (questionId: string) => {
    if (!user || !questionId) return;
    try {
      const { error } = await supabase
        .from('saved_questions')
        .delete()
        .eq('id', questionId)
        .eq('user_id', user.id);
      if (error) throw error;
      setSavedIndividualQuestions(prev => prev.filter(q => q.id !== questionId));
      toast({ title: "Question Deleted", description: "Saved question removed." });
      if (user) logActivity("Saved Question Delete", `Deleted saved question ID: ${questionId}`, undefined, user.id);
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message });
      if (user) logActivity("Error", `Failed to delete saved question: ${(error as Error).message}`, { questionId }, user.id);
    }
  };

  const handleCopyQuestion = (questionText: string) => {
    navigator.clipboard.writeText(questionText)
      .then(() => {
        toast({ title: "Question Copied!", description: "Question text copied to clipboard." });
        if (user) logActivity("Question Action", "Question text copied.", { length: questionText.length }, user.id);
      })
      .catch(err => {
        toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy question to clipboard." });
        console.error("Failed to copy question: ", err);
      });
  };

  const handleExplainThisQuestion = async (qText: string) => {
    if (!qText || !user) return;
    setIsExplaining(true);
    setQuestionToExplain(qText);
    setDetailedExplanation(null);
    setIsExplanationDialogOpen(true);
    logActivity("Question Explanation", `Requested explanation for: "${qText.substring(0, 50)}..."`, undefined, user.id);
    try {
      const input: ExplainQuestionInput = { question: qText };
      const output: ExplainQuestionOutput = await explainQuestion(input);
      setDetailedExplanation(output.explanation);
    } catch (err) {
      console.error("Error explaining question:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error explaining question.";
      setDetailedExplanation(`Failed to get detailed explanation: ${errorMessage}`);
      toast({ variant: "destructive", title: "Explanation Error", description: errorMessage });
      logActivity("Explanation Error", `Failed to explain: "${qText.substring(0, 50)}..."`, { error: errorMessage }, user.id);
    } finally {
      setIsExplaining(false);
    }
  };

  const currentQuestionData = currentQuestionSet[currentQuestionIndex];

  if (authLoading && !user) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <FileQuestion className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">Please log in to use the AI Question Generator.</p>
        <Link href="/login" passHref>
          <Button>Log In</Button>
        </Link>
      </div>
    );
  }


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
          <Button onClick={handleRestartQuiz}><RotateCcw className="mr-2 h-4 w-4" />Try Again</Button>
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
            <CardTitle className="text-xl md:text-2xl leading-tight whitespace-pre-wrap">
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
            {isLoadingQuestion && currentQuestionIndex < numberOfQuestions - 1 && (
              <div className="mt-6 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading next question...</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end pt-4">
            <Button onClick={handleNextQuestion} disabled={selectedAnswer === undefined || (isLoadingQuestion && currentQuestionIndex < numberOfQuestions - 1)}>
              {currentQuestionIndex < numberOfQuestions - 1 ? "Next Question" : "Finish Quiz"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (quizState === 'completed') {
    const actualQuestionsAnswered = currentQuestionSet.length;
    const accuracy = actualQuestionsAnswered > 0 ? (score / actualQuestionsAnswered) * 100 : 0;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Quiz Results</h1>
          <Button onClick={handleRestartQuiz} variant="outline"><RotateCcw className="mr-2 h-4 w-4" /> Start New Quiz</Button>
        </div>
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <CardTitle className="text-2xl">Your Performance</CardTitle>
            <CardDescription>You answered {score} out of {actualQuestionsAnswered} questions correctly.</CardDescription>
            <div className="text-5xl font-bold text-primary mt-2">{accuracy.toFixed(0)}%</div>
            <Progress value={accuracy} className="w-1/2 mx-auto mt-2 h-3" />
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-semibold mb-4 mt-6 text-center">Review Your Answers</h3>
            <ScrollArea className="h-[calc(100vh-32rem)] sm:h-[calc(100vh-30rem)] md:h-[40vh] lg:h-[45vh] p-1 border rounded-md">
              <div className="space-y-4 p-3">
                {currentQuestionSet.map((q, index) => (
                  <Card key={q.id} className={`p-4 ${q.isCorrect ? 'border-green-500 bg-green-500/5' : 'border-destructive bg-destructive/5'}`}>
                    <p className="font-semibold whitespace-pre-wrap">Q{index + 1}: {q.question}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex}
                          className={`flex items-center p-1.5 rounded-md
                                         ${optIndex === q.correctAnswerIndex ? 'bg-green-500/20 text-green-700 dark:text-green-300 font-medium' : ''}
                                         ${optIndex === q.userAnswerIndex && optIndex !== q.correctAnswerIndex ? 'bg-red-500/20 text-red-700 dark:text-red-400 line-through' : ''}
                                         ${optIndex === q.userAnswerIndex && optIndex === q.correctAnswerIndex ? 'ring-2 ring-green-500' : ''}
                                         `}
                        >
                          {optIndex === q.userAnswerIndex && q.isCorrect && <CheckCircle className="h-4 w-4 mr-2 text-green-500 shrink-0" />}
                          {optIndex === q.userAnswerIndex && !q.isCorrect && <XCircle className="h-4 w-4 mr-2 text-red-500 shrink-0" />}
                          {optIndex !== q.userAnswerIndex && optIndex === q.correctAnswerIndex && <CheckCircle className="h-4 w-4 mr-2 text-green-500 shrink-0 opacity-50" />}
                          {!((optIndex === q.userAnswerIndex && q.isCorrect) || (optIndex === q.userAnswerIndex && !q.isCorrect) || (optIndex !== q.userAnswerIndex && optIndex === q.correctAnswerIndex)) && <span className="w-6 mr-2 shrink-0"></span>}
                          {opt}
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap"><strong className="text-accent">Explanation:</strong> {q.explanation}</p>
                    <div className="mt-3 flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleSaveIndividualQuestion(q)} className="text-xs"><Save className="mr-1.5 h-3.5 w-3.5" />Save Q</Button>
                      <Button variant="outline" size="sm" onClick={() => handleExplainThisQuestion(q.question)} className="text-xs"><HelpCircle className="mr-1.5 h-3.5 w-3.5" />Explain More</Button>
                      <Button variant="outline" size="sm" onClick={() => handleCopyQuestion(q.question)} className="text-xs"><Copy className="mr-1.5 h-3.5 w-3.5" />Copy Q</Button>
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

  // Configuration View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <FileQuestion className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">AI Question Generator</h1>
        </div>
        <Dialog open={isSavedQuestionsDialogOpen} onOpenChange={setIsSavedQuestionsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => { setIsSavedQuestionsDialogOpen(true); if (user) fetchSavedQuestions(); }} disabled={!user || authLoading || isFetchingSavedQuestions}>
              {isFetchingSavedQuestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListChecks className="mr-2 h-4 w-4" />}
              View Saved Questions ({authLoading || !user ? '...' : savedIndividualQuestions.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Saved Individual Questions</DialogTitle>
              <DialogDescription>Review questions you've saved to your account. Showing latest {SAVED_QUESTIONS_FETCH_LIMIT}.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1 mt-2">
              {isFetchingSavedQuestions ? (
                <div className="flex justify-center items-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : savedIndividualQuestions.length > 0 ? (
                <div className="space-y-4">
                  {savedIndividualQuestions.map(sq => (
                    <Card key={sq.id} className="bg-card/60">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-semibold flex-1 whitespace-pre-wrap">Q: {sq.question_text}</p>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteSavedQuestion(sq.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <p className="text-xs">Options: {Array.isArray(sq.options) ? sq.options.map((o: string, i: number) => `${String.fromCharCode(65 + i)}. ${o}`).join(" | ") : "Options not available"}</p>
                        <p className="text-xs text-green-400">Correct: {String.fromCharCode(65 + sq.correct_answer_index)}. {Array.isArray(sq.options) && sq.options[sq.correct_answer_index] ? sq.options[sq.correct_answer_index] : "N/A"}</p>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">Expl: {sq.explanation}</p>
                        <p className="text-xs text-muted-foreground/70">Saved: {new Date(sq.saved_at).toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No individual questions saved yet.</p>
              )}
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
            </DialogFooter>
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
              <Select value={selectedClass} onValueChange={setSelectedClass} disabled={isLoadingQuestion || !user || authLoading}>
                <SelectTrigger id="class-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="11">Class 11</SelectItem>
                  <SelectItem value="12">Class 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject-select">Subject</Label>
              <Select value={subject} onValueChange={(value) => { setSubject(value); }} disabled={isLoadingQuestion || !user || authLoading}>
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
              <Select value={topic} onValueChange={setTopic} disabled={isLoadingQuestion || !subject || topicsBySubject[subject]?.length === 0 || !user || authLoading}>
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
              <Select value={source} onValueChange={setSource} disabled={isLoadingQuestion || !user || authLoading}>
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
              <Label htmlFor="difficulty-select">Difficulty</Label>
              <Select value={difficulty} onValueChange={(value) => setDifficulty(value as 'easy' | 'medium' | 'hard' | 'any')} disabled={isLoadingQuestion || !user || authLoading}>
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
                disabled={isLoadingQuestion || !user || authLoading} />
            </div>
          </div>
          {overallError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Configuration Error</AlertTitle>
              <AlertDescription>{overallError}</AlertDescription>
            </Alert>
          )}
          <Button className="w-full mt-6" onClick={handleStartQuiz} disabled={isLoadingQuestion || !topic || numberOfQuestions < 1 || !user || authLoading}>
            {isLoadingQuestion ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
            Start Quiz
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isExplanationDialogOpen} onOpenChange={setIsExplanationDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detailed Explanation for: "{questionToExplain?.substring(0, 70)}..."</DialogTitle>
            <DialogDescription>AI-generated detailed breakdown of the question.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-1 mt-2 border rounded-md bg-muted/30">
            <div className="p-4 whitespace-pre-wrap text-sm">
              {isExplaining && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
              {!isExplaining && detailedExplanation && <p>{detailedExplanation}</p>}
              {!isExplaining && !detailedExplanation && !isExplaining && <p>No explanation available or an error occurred while fetching it.</p>}
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
