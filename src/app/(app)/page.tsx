
"use client";
import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Target, CheckCircle, BarChart3, Clock, Edit, Save, Loader2 } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// TaskManagement component seems like a standalone localStorage example, consider integrating its purpose or removing if redundant
// import TaskManagement from '@/components/TaskManagement'; 
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
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabaseClient';
import { format, parseISO } from 'date-fns';

const LAST_QUIZ_SCORE_KEY = 'neetPrepProLastQuizScore'; // This will be replaced by Supabase data eventually

interface LastQuizScore {
  score: number;
  totalQuestions: number;
  accuracy: number;
  timestamp: string;
}

interface CountdownConfig {
  eventName: string;
  eventDate: string; // ISO string for date part only, e.g., "2024-12-31"
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
  const { user, isLoading: authLoading } = useAuth();
  const [lastQuizScore, setLastQuizScore] = useState<LastQuizScore | null>(null); // Still from localStorage for now
  const [randomFact, setRandomFact] = useState(syllabusFacts[0]);

  const [countdownConfig, setCountdownConfig] = useState<CountdownConfig | null>(null);
  const [isLoadingCountdown, setIsLoadingCountdown] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isCountdownDialogOpen, setIsCountdownDialogOpen] = useState(false);
  const [isSubmittingCountdown, setIsSubmittingCountdown] = useState(false);
  const [tempEventName, setTempEventName] = useState('');
  const [tempEventDate, setTempEventDate] = useState(''); 

  const getDefaultNeetDate = useCallback(() => {
      const today = new Date();
      let nextMay = new Date(today.getFullYear(), 4, 5); 
      if (today.getMonth() > 4 || (today.getMonth() === 4 && today.getDate() > 5)) { // If past May 5th
        nextMay.setFullYear(today.getFullYear() + 1);
      }
      return format(nextMay, 'yyyy-MM-dd');
  }, []);

  const fetchCountdownConfig = useCallback(async () => {
    if (!user) {
        setIsLoadingCountdown(false);
        const localConfig = localStorage.getItem('dashboardCountdownConfig');
        if (localConfig) {
            const parsedConfig = JSON.parse(localConfig) as CountdownConfig;
            setCountdownConfig(parsedConfig);
            setTempEventName(parsedConfig.eventName);
            setTempEventDate(parsedConfig.eventDate);
        } else {
            const defaultConfig = { eventName: "NEET Exam", eventDate: getDefaultNeetDate() };
            setCountdownConfig(defaultConfig);
            setTempEventName(defaultConfig.eventName);
            setTempEventDate(defaultConfig.eventDate);
        }
        return;
    }
    setIsLoadingCountdown(true);
    try {
      const { data, error } = await supabase
        .from('dashboard_configurations')
        .select('countdown_event_name, countdown_event_date')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; 

      if (data && data.countdown_event_name && data.countdown_event_date) {
        setCountdownConfig({ eventName: data.countdown_event_name, eventDate: data.countdown_event_date });
        setTempEventName(data.countdown_event_name);
        setTempEventDate(data.countdown_event_date);
      } else {
        const defaultConfig = { eventName: "NEET Exam", eventDate: getDefaultNeetDate() };
        setCountdownConfig(defaultConfig);
        setTempEventName(defaultConfig.eventName);
        setTempEventDate(defaultConfig.eventDate);
        
        const { error: upsertError } = await supabase
            .from('dashboard_configurations')
            .upsert({ 
                user_id: user.id, 
                countdown_event_name: defaultConfig.eventName, 
                countdown_event_date: defaultConfig.eventDate,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        if(upsertError) console.error("Error saving default countdown to Supabase:", upsertError);
      }
    } catch (err) {
      console.error("Error fetching/setting countdown config from Supabase:", err);
      const defaultConfig = { eventName: "NEET Exam", eventDate: getDefaultNeetDate() };
      setCountdownConfig(defaultConfig); 
      setTempEventName(defaultConfig.eventName);
      setTempEventDate(defaultConfig.eventDate);
    } finally {
      setIsLoadingCountdown(false);
    }
  }, [user, getDefaultNeetDate]);
  

  useEffect(() => {
    const storedScore = localStorage.getItem(LAST_QUIZ_SCORE_KEY);
    if (storedScore) setLastQuizScore(JSON.parse(storedScore));
    
    setRandomFact(syllabusFacts[Math.floor(Math.random() * syllabusFacts.length)]);

    if (!authLoading) {
      fetchCountdownConfig();
    }
  }, [user, authLoading, fetchCountdownConfig]);

  useEffect(() => {
    if (!countdownConfig || !countdownConfig.eventDate) return;

    const calculateTimeLeft = () => {
      const targetDate = new Date(countdownConfig.eventDate + "T00:00:00"); // Treat as local date for countdown
      const difference = +targetDate - +new Date();
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
    calculateTimeLeft(); 
    return () => clearInterval(timer);
  }, [countdownConfig]);

  const handleSaveCountdown = async (e: FormEvent) => {
    e.preventDefault();
    if (!tempEventName || !tempEventDate) {
      toast({ variant: "destructive", title: "Error", description: "Event name and date are required." });
      return;
    }
    
    const newConfig: CountdownConfig = {
      eventName: tempEventName,
      eventDate: tempEventDate,
    };
    setCountdownConfig(newConfig); // Optimistic update for UI
    setIsCountdownDialogOpen(false);

    if (!user) { // Save to localStorage if not logged in
        localStorage.setItem('dashboardCountdownConfig', JSON.stringify(newConfig));
        toast({ title: "Countdown Updated (Locally)", description: `Timer set for ${newConfig.eventName}.` });
        return;
    }

    setIsSubmittingCountdown(true);
    try {
      const { error } = await supabase
        .from('dashboard_configurations')
        .upsert({ 
          user_id: user.id, 
          countdown_event_name: newConfig.eventName, 
          countdown_event_date: newConfig.eventDate,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      toast({ title: "Countdown Updated (Supabase)", description: `Timer set for ${newConfig.eventName}.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Error Saving Countdown to Supabase", description: (err as Error).message });
      localStorage.setItem('dashboardCountdownConfig', JSON.stringify(newConfig)); // Fallback to local if Supabase fails
    } finally {
        setIsSubmittingCountdown(false);
    }
  };
  
  if (authLoading && !user && isLoadingCountdown) { // Show loader if auth is loading and user isn't set yet
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Welcome{user ? `, ${user.name || 'User'}` : ''}!</h1>
      
      {isLoadingCountdown ? (
        <Card className="shadow-lg bg-gradient-to-r from-primary/20 to-accent/20 border-primary/40">
          <CardHeader><CardTitle><Loader2 className="mr-2 h-5 w-5 animate-spin inline-block"/>Loading Countdown...</CardTitle></CardHeader>
          <CardContent className="h-24"></CardContent>
        </Card>
      ) : countdownConfig ? (
        <Card className="shadow-lg bg-gradient-to-r from-primary/20 to-accent/20 border-primary/40">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5 text-primary" />Countdown to {countdownConfig.eventName}</CardTitle>
              <Dialog open={isCountdownDialogOpen} onOpenChange={setIsCountdownDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-4 w-4"/></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <form onSubmit={handleSaveCountdown}>
                    <DialogHeader>
                      <DialogTitle>Customize Countdown</DialogTitle>
                      <DialogDescription>Set the event name and date for your countdown timer.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="event-name">Event Name</Label>
                        <Input id="event-name" value={tempEventName} onChange={(e) => setTempEventName(e.target.value)} placeholder="e.g., NEET Exam 2025" />
                      </div>
                      <div>
                        <Label htmlFor="event-date">Event Date</Label>
                        <Input id="event-date" type="date" value={tempEventDate} onChange={(e) => setTempEventDate(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                       <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmittingCountdown}>Cancel</Button></DialogClose>
                      <Button type="submit" disabled={isSubmittingCountdown}>
                        {isSubmittingCountdown && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Save Countdown
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div><p className="text-4xl font-bold">{timeLeft.days}</p><p className="text-sm text-muted-foreground">Days</p></div>
              <div><p className="text-4xl font-bold">{timeLeft.hours}</p><p className="text-sm text-muted-foreground">Hours</p></div>
              <div><p className="text-4xl font-bold">{timeLeft.minutes}</p><p className="text-sm text-muted-foreground">Minutes</p></div>
              <div><p className="text-4xl font-bold">{timeLeft.seconds}</p><p className="text-sm text-muted-foreground">Seconds</p></div>
            </div>
          </CardContent>
        </Card>
      ) : (
         <Card className="shadow-lg bg-gradient-to-r from-primary/20 to-accent/20 border-primary/40">
          <CardHeader><CardTitle>Set Countdown</CardTitle></CardHeader>
          <CardContent><p>Could not load countdown configuration. You can set one by clicking the edit icon.</p></CardContent>
        </Card>
      )}

      <Card className="shadow-lg bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
        <CardHeader className="flex flex-row items-center space-x-3 pb-2">
          <Lightbulb className="h-6 w-6 text-primary" />
          <CardTitle>Random Syllabus Fact</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{randomFact.fact}</p>
          <CardDescription className="mt-2 text-sm">Source: {randomFact.source}</CardDescription>
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
            <CardTitle className="text-lg">Quick Tasks & Planners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-1 space-y-1">
                 <Link href="/tasks" passHref><Button variant="link" className="p-0 h-auto text-primary w-full justify-start">Task Reminders</Button></Link>
                 <Link href="/custom-tasks" passHref><Button variant="link" className="p-0 h-auto text-primary w-full justify-start">Custom Tasks</Button></Link>
                 <Link href="/day-planner" passHref><Button variant="link" className="p-0 h-auto text-primary w-full justify-start">Day Planner</Button></Link>
                 <Link href="/month-planner" passHref><Button variant="link" className="p-0 h-auto text-primary w-full justify-start">Month Planner</Button></Link>
                 <Link href="/year-planner" passHref><Button variant="link" className="p-0 h-auto text-primary w-full justify-start">Year Planner</Button></Link>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center space-x-2 pb-2">
            <BarChart3 className="h-5 w-5 text-accent"/>
            <CardTitle className="text-lg">Tools & Resources</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="mt-1 space-y-1">
                 <Link href="/ai-assistant" passHref><Button variant="link" className="p-0 h-auto text-primary w-full justify-start">Chat with AI Assistant</Button></Link>
                 <Link href="/ncert-viewer" passHref><Button variant="link" className="p-0 h-auto text-primary w-full justify-start">Open NCERT Viewer</Button></Link>
                <Link href="/activity-history" passHref><Button variant="link" className="p-0 h-auto text-primary w-full justify-start">View Activity History</Button></Link>
                 <Link href="/files" passHref><Button variant="link" className="p-0 h-auto text-primary w-full justify-start">My Files</Button></Link>
                 <Link href="/dictionary" passHref><Button variant="link" className="p-0 h-auto text-primary w-full justify-start">AI Dictionary</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
