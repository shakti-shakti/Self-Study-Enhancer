
"use client";
import { useState, useEffect, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { CalendarDays, PlusCircle, CheckSquare, Square, Edit2, Trash2, CalendarIcon as CalendarIconLucide, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabaseClient';
import { format, parseISO, isValid, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface Task {
  id: string; // UUID from Supabase
  user_id: string;
  title: string;
  task_date: string; // ISO string for the date (YYYY-MM-DD)
  start_time: string; // HH:MM
  duration: string;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function DayPlannerPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [currentTask, setCurrentTask] = useState<Partial<Task> & { id?: string }>({});
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDate, setTaskDate] = useState<Date | undefined>(new Date());
  const [taskTime, setTaskTime] = useState('09:00');
  const [taskDuration, setTaskDuration] = useState('1 hr');

  const fetchTasks = async () => {
    if (!user) return;
    setIsLoadingTasks(true);
    try {
      const { data, error } = await supabase
        .from('day_planner_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('task_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Fetching Tasks", description: (error as Error).message });
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchTasks();
    }
  }, [user, authLoading]);

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setCurrentTask(task);
      setTaskTitle(task.title);
      // Ensure task.task_date is a valid date string before parsing
      const parsedDate = task.task_date ? parseISO(task.task_date) : new Date();
      setTaskDate(isValid(parsedDate) ? parsedDate : new Date());
      setTaskTime(task.start_time);
      setTaskDuration(task.duration || '1 hr');
    } else {
      setCurrentTask({});
      setTaskTitle('');
      setTaskDate(new Date()); 
      setTaskTime('09:00');
      setTaskDuration('1 hr');
    }
    setIsFormOpen(true);
  };

  const handleSaveTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to save tasks." });
      return;
    }
    if (!taskTitle || !taskDate || !taskTime || !taskDuration) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill in title, date, time, and duration." });
      return;
    }
    setIsSubmitting(true);

    const taskDataToSave = {
      user_id: user.id,
      title: taskTitle,
      task_date: format(startOfDay(taskDate), 'yyyy-MM-dd'), // Store date only
      start_time: taskTime,
      duration: taskDuration,
      completed: currentTask.id ? currentTask.completed : false, // Preserve completed status on edit
    };

    try {
      if (currentTask.id) { // Editing existing task
        const { error } = await supabase
          .from('day_planner_tasks')
          .update({ ...taskDataToSave, updated_at: new Date().toISOString() })
          .eq('id', currentTask.id)
          .eq('user_id', user.id);
        if (error) throw error;
        toast({ title: "Task Updated", description: `"${taskTitle}" has been updated.` });
      } else { // Adding new task
        const { error } = await supabase
          .from('day_planner_tasks')
          .insert(taskDataToSave);
        if (error) throw error;
        toast({ title: "Task Added", description: `"${taskTitle}" has been scheduled.` });
      }
      fetchTasks(); // Refresh task list
      setIsFormOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Saving Task", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    if (!user) return;
    const optimisticTasks = tasks.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t);
    setTasks(optimisticTasks); // Optimistic update

    try {
      const { error } = await supabase
        .from('day_planner_tasks')
        .update({ completed: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .eq('user_id', user.id);
      if (error) {
        fetchTasks(); // Revert on error
        throw error;
      }
      // No need to call fetchTasks() again if successful, optimistic update is fine
      const task = tasks.find(t=>t.id === taskId);
      if(task) toast({title: `Task ${!currentStatus ? 'Completed' : 'Marked Incomplete'}`, description: `"${task.title}"`});
    } catch (error) {
      toast({ variant: "destructive", title: "Error Updating Task", description: (error as Error).message });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    // Optimistic delete
    setTasks(tasks.filter(t => t.id !== taskId));

    try {
      const { error } = await supabase
        .from('day_planner_tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);
      if (error) {
        fetchTasks(); // Revert on error
        throw error;
      }
      toast({ variant: "destructive", title: "Task Deleted", description: `"${taskToDelete.title}" removed.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error Deleting Task", description: (error as Error).message });
    }
  };
  
  const todayISO = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = tasks.filter(task => task.task_date === todayISO)
                         .sort((a,b) => a.start_time.localeCompare(b.start_time));

  if (authLoading || (isLoadingTasks && !tasks.length)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Day Planner</h1>
          </div>
          <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Add Task</Button>
        </div>
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Loading Tasks...</CardTitle></CardHeader>
          <CardContent className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CalendarDays className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Day Planner</h1>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSaveTask}>
              <DialogHeader>
                <DialogTitle>{currentTask.id ? "Edit Task" : "Add New Task"}</DialogTitle>
                <DialogDescription>
                  {currentTask.id ? "Modify the details of your task." : "Fill in the details for your new task."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="task-title" className="text-right">Title</Label>
                  <Input id="task-title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="col-span-3" placeholder="e.g., Physics Homework" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="task-date" className="text-right">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="task-date"
                        variant={"outline"}
                        className={cn(
                          "col-span-3 justify-start text-left font-normal",
                          !taskDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIconLucide className="mr-2 h-4 w-4" />
                        {taskDate ? format(taskDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={taskDate}
                        onSelect={setTaskDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="task-time" className="text-right">Time</Label>
                  <Input id="task-time" type="time" value={taskTime} onChange={(e) => setTaskTime(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="task-duration" className="text-right">Duration</Label>
                  <Input id="task-duration" value={taskDuration} onChange={(e) => setTaskDuration(e.target.value)} className="col-span-3" placeholder="e.g., 1 hr 30 mins" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Task
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Today's Schedule ({format(new Date(), "EEE, MMM d")})</CardTitle>
          <CardDescription>Manage your daily tasks, mark them complete, and stay organized.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTasks && todayTasks.length === 0 ? (
             <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : todayTasks.length > 0 ? (
            <ul className="space-y-3">
              {todayTasks.map(task => (
                <li key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow bg-card/80">
                  <div className="flex items-center space-x-3">
                    <Checkbox id={`task-${task.id}`} checked={task.completed} onCheckedChange={() => toggleTaskCompletion(task.id, task.completed)} />
                    <div>
                      <Label htmlFor={`task-${task.id}`} className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {task.start_time} ({task.duration})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                     {task.completed ? <CheckSquare className="h-5 w-5 text-green-500" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(task)}><Edit2 className="h-4 w-4"/></Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteTask(task.id)}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
              <p className="text-muted-foreground">No tasks scheduled for today. Add a task to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>
       <Card className="shadow-lg mt-6">
        <CardHeader>
          <CardTitle>All Scheduled Tasks</CardTitle>
          <CardDescription>View all tasks, not just for today.</CardDescription>
        </CardHeader>
        <CardContent>
             {isLoadingTasks && tasks.length === 0 ? (
                <div className="p-6 border rounded-lg min-h-[100px] bg-muted/30 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
             ) :tasks.length > 0 ? (
            <ul className="space-y-3">
              {tasks.map(task => ( // Already sorted by fetchTasks
                <li key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow bg-card/80">
                  <div className="flex items-center space-x-3">
                    <Checkbox id={`all-task-${task.id}`} checked={task.completed} onCheckedChange={() => toggleTaskCompletion(task.id, task.completed)} />
                    <div>
                      <Label htmlFor={`all-task-${task.id}`} className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(task.task_date), "EEE, MMM d, yyyy")} at {task.start_time} ({task.duration})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                     {task.completed ? <CheckSquare className="h-5 w-5 text-green-500" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(task)}><Edit2 className="h-4 w-4"/></Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteTask(task.id)}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 border rounded-lg min-h-[100px] bg-muted/30 flex items-center justify-center">
              <p className="text-muted-foreground">No tasks scheduled at all.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    