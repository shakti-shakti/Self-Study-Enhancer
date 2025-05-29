
"use client";
import { useState, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Target, CheckCircle, BarChart3, Clock, Edit, Save } from "lucide-react";
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/local-storage';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

interface LastQuizScore {
  score: number;
  totalQuestions: number;
  accuracy: number;
  timestamp: string;
}
const LAST_QUIZ_SCORE_KEY = 'neetPrepProLastQuizScore';
const COUNTDOWN_CONFIG_KEY = 'neetPrepProCountdownConfig';

interface CountdownConfig {
  eventName: string;
  eventDate: string; // ISO string
}

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
  const { toast } = useToast();
  const [lastQuizScore, setLastQuizScore] = useState<LastQuizScore | null>(null);
  const [randomFact, setRandomFact] = useState(syllabusFacts[0]);

  const [countdownConfig, setCountdownConfig] = useState<CountdownConfig | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isCountdownDialogOpen, setIsCountdownDialogOpen] = useState(false);
  const [tempEventName, setTempEventName] = useState('');
  const [tempEventDate, setTempEventDate] = useState('');


  useEffect(() => {
    const storedScore = loadFromLocalStorage<LastQuizScore | null>(LAST_QUIZ_SCORE_KEY, null);
    setLastQuizScore(storedScore);
    setRandomFact(syllabusFacts[Math.floor(Math.random() * syllabusFacts.length)]);

    const storedCountdownConfig = loadFromLocalStorage<CountdownConfig | null>(COUNTDOWN_CONFIG_KEY, null);
    if (storedCountdownConfig) {
      setCountdownConfig(storedCountdownConfig);
      setTempEventName(storedCountdownConfig.eventName);
      // Ensure date is in YYYY-MM-DD for input[type=date]
      setTempEventDate(new Date(storedCountdownConfig.eventDate).toISOString().split('T')[0]);
    } else {
      // Default countdown to a hypothetical NEET exam date (e.g., next May 5th)
      const today = new Date();
      let nextMay = new Date(today.getFullYear(), 4, 5); // May is month 4
      if (today > nextMay) {
        nextMay.setFullYear(today.getFullYear() + 1);
      }
      const defaultConfig: CountdownConfig = {
        eventName: "NEET Exam",
        eventDate: nextMay.toISOString()
      };
      setCountdownConfig(defaultConfig);
      setTempEventName(defaultConfig.eventName);
      setTempEventDate(nextMay.toISOString().split('T')[0]);
      saveToLocalStorage(COUNTDOWN_CONFIG_KEY, defaultConfig);
    }
  }, []);

  useEffect(() => {
    if (!countdownConfig) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(countdownConfig.eventDate) - +new Date();
      let newTimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      setTimeLeft(newTimeLeft);
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); // Initial calculation
    return () => clearInterval(timer);
  }, [countdownConfig]);

  const handleSaveCountdown = (e: FormEvent) => {
    e.preventDefault();
    if (!tempEventName || !tempEventDate) {
      toast({ variant: "destructive", title: "Error", description: "Event name and date are required." });
      return;
    }
    const newConfig: CountdownConfig = {
      eventName: tempEventName,
      eventDate: new Date(tempEventDate + "T00:00:00").toISOString(), // Ensure it's start of the day in UTC for consistency
    };
    setCountdownConfig(newConfig);
    saveToLocalStorage(COUNTDOWN_CONFIG_KEY, newConfig);
    setIsCountdownDialogOpen(false);
    toast({ title: "Countdown Updated", description: `Timer set for ${newConfig.eventName}.` });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Welcome to NEET Prep Pro!</h1>
      
      {countdownConfig && (
        <Card className="shadow-lg bg-gradient-to-r from-primary/20 to-accent/20 border-primary/40">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5 text-primary" />Countdown to {countdownConfig.eventName}</CardTitle>
              <Dialog open={isCountdownDialogOpen} onOpenChange={setIsCountdownDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-4 w-4"/></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Customize Countdown</DialogTitle>
                    <DialogDescription>Set the event name and date for your countdown timer.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveCountdown} className="grid gap-4 py-4">
                    <div>
                      <Label htmlFor="event-name">Event Name</Label>
                      <Input id="event-name" value={tempEventName} onChange={(e) => setTempEventName(e.target.value)} placeholder="e.g., NEET Exam 2025" />
                    </div>
                    <div>
                      <Label htmlFor="event-date">Event Date</Label>
                      <Input id="event-date" type="date" value={tempEventDate} onChange={(e) => setTempEventDate(e.target.value)} />
                    </div>
                    <DialogFooter>
                       <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                      <Button type="submit"><Save className="mr-2 h-4 w-4"/>Save Countdown</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-4xl font-bold">{timeLeft.days}</p>
                <p className="text-sm text-muted-foreground">Days</p>
              </div>
              <div>
                <p className="text-4xl font-bold">{timeLeft.hours}</p>
                <p className="text-sm text-muted-foreground">Hours</p>
              </div>
              <div>
                <p className="text-4xl font-bold">{timeLeft.minutes}</p>
                <p className="text-sm text-muted-foreground">Minutes</p>
              </div>
              <div>
                <p className="text-4xl font-bold">{timeLeft.seconds}</p>
                <p className="text-sm text-muted-foreground">Seconds</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <CardTitle className="text-lg">Performance Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            {lastQuizScore ? (
              <div>
                <p className="text-sm text-muted-foreground">Last Quiz ({new Date(lastQuizScore.timestamp).toLocaleDateString()}):</p>
                <p className="text-2xl font-bold">{lastQuizScore.accuracy.toFixed(0)}% 
                  <span className="text-sm font-normal text-muted-foreground"> ({lastQuizScore.score}/{lastQuizScore.totalQuestions} correct)</span>
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Complete a quiz in the <Link href="/question-generator" className="text-primary hover:underline">Question Generator</Link> to see your performance here.</p>
            )}
             <Link href="/question-generator" passHref>
                <Button variant="link" className="p-0 h-auto mt-2 text-primary">Go to Quiz</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center space-x-2 pb-2">
            <CheckCircle className="h-5 w-5 text-accent"/>
            <CardTitle className="text-lg">Quick Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-1 space-y-1">
                 <Link href="/tasks" passHref>
                    <Button variant="link" className="p-0 h-auto text-primary w-full justify-start">Manage Task Reminders</Button>
                </Link>
                 <Link href="/custom-tasks" passHref>
                    <Button variant="link" className="p-0 h-auto text-primary w-full justify-start">View Custom Tasks</Button>
                </Link>
                 <Link href="/day-planner" passHref>
                    <Button variant="link" className="p-0 h-auto text-primary w-full justify-start">Open Day Planner</Button>
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

    