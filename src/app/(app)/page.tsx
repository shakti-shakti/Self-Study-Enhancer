
"use client"; // Make it a client component to use hooks
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Target, CheckCircle, BarChart3 } from "lucide-react";
import { loadFromLocalStorage } from '@/lib/local-storage'; // Import localStorage helper
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface LastQuizScore {
  score: number;
  totalQuestions: number;
  accuracy: number;
  timestamp: string;
}
const LAST_QUIZ_SCORE_KEY = 'neetPrepProLastQuizScore';

// Placeholder for more facts
const syllabusFacts = [
  {
    fact: "The human brain generates about 12-25 watts of electricity, enough to power a low-wattage LED light bulb.",
    source: "Class 11 Biology (Neural Control and Coordination)",
  },
  {
    fact: "Mitochondria are often called the 'powerhouses of the cell' because they generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.",
    source: "Class 11 Biology (Cell: The Unit of Life)",
  },
  {
    fact: "The law of conservation of energy states that energy cannot be created or destroyed, only converted from one form to another.",
    source: "Class 11 Physics (Work, Energy and Power)",
  }
];


export default function DashboardPage() {
  const [lastQuizScore, setLastQuizScore] = useState<LastQuizScore | null>(null);
  const [randomFact, setRandomFact] = useState(syllabusFacts[0]);

  useEffect(() => {
    // Load last quiz score from local storage
    const storedScore = loadFromLocalStorage<LastQuizScore | null>(LAST_QUIZ_SCORE_KEY, null);
    setLastQuizScore(storedScore);

    // Select a random fact
    setRandomFact(syllabusFacts[Math.floor(Math.random() * syllabusFacts.length)]);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Welcome to NEET Prep Pro!</h1>
      
      <Card className="shadow-lg bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
        <CardHeader className="flex flex-row items-center space-x-3 pb-2">
          <Lightbulb className="h-6 w-6 text-primary" />
          <CardTitle>Random Syllabus Fact</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">
            {randomFact.fact}
          </p>
          <CardDescription className="mt-2 text-sm">
            Source: {randomFact.source}
          </CardDescription>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center space-x-2 pb-2">
             <Target className="h-5 w-5 text-accent"/>
            <CardTitle className="text-lg">Today's Focus</CardTitle>
          </CardHeader>
          <CardContent>
            {lastQuizScore ? (
              <div>
                <p className="text-sm text-muted-foreground">Last Quiz Performance:</p>
                <p className="text-2xl font-bold">{lastQuizScore.accuracy.toFixed(0)}% 
                  <span className="text-sm font-normal text-muted-foreground"> ({lastQuizScore.score}/{lastQuizScore.totalQuestions} correct)</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Taken on: {new Date(lastQuizScore.timestamp).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Complete a quiz in the <Link href="/question-generator" className="text-primary hover:underline">Question Generator</Link> to see your performance here.</p>
            )}
             <Link href="/day-planner" passHref>
                <Button variant="link" className="p-0 h-auto mt-2 text-primary">View Day Planner</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center space-x-2 pb-2">
            <CheckCircle className="h-5 w-5 text-accent"/>
            <CardTitle className="text-lg">Quick Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Jump into your tasks or add new ones.</p>
            <div className="mt-2 space-y-1">
                 <Link href="/tasks" passHref>
                    <Button variant="link" className="p-0 h-auto text-primary w-full justify-start">Manage Task Reminders</Button>
                </Link>
                 <Link href="/custom-tasks" passHref>
                    <Button variant="link" className="p-0 h-auto text-primary w-full justify-start">View Custom Tasks</Button>
                </Link>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center space-x-2 pb-2">
            <BarChart3 className="h-5 w-5 text-accent"/>
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="mt-1 space-y-1">
                 <Link href="/ai-assistant" passHref>
                    <Button variant="link" className="p-0 h-auto text-primary w-full justify-start">Chat with AI Assistant</Button>
                </Link>
                 <Link href="/ncert-viewer" passHref>
                    <Button variant="link" className="p-0 h-auto text-primary w-full justify-start">Open NCERT Viewer</Button>
                </Link>
                <Link href="/activity-history" passHref>
                    <Button variant="link" className="p-0 h-auto text-primary w-full justify-start">View Activity History</Button>
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
