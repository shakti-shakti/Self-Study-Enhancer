
"use client";
import { useState, useEffect, type FormEvent, useCallback } from 'react'; // Added useCallback
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ClipboardList, PlusCircle, Edit2, Trash2, AlarmClock, CalendarIcon as CalendarIconLucide, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { logActivity } from '@/lib/activity-logger';

interface CustomTask {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  category: string;
  task_date?: string | null;
  has_reminder?: boolean | null;
  reminder_time?: string | null;
  created_at?: string;
  updated_at?: string;
}

const taskCategories = ["Personal", "Social", "Career", "Academic", "Health", "Other"];

export default function CustomTasksPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentEditingTask, setCurrentEditingTask] = useState<Partial<CustomTask> & { id?: string }>({});
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState(taskCategories[0]);
  const [taskDate, setTaskDate] = useState<Date | undefined>(undefined);
  const [taskHasReminder, setTaskHasReminder] = useState(false);
  const [taskReminderTime, setTaskReminderTime] = useState('09:00');

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setCustomTasks([]);
      setIsLoadingTasks(false);
      return;
    }
    setIsLoadingTasks(true);
    try {
      const { data, error } = await supabase
        .from('custom_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomTasks(data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Fetching Tasks", description: (error as Error).message });
      if (user) logActivity("Custom Tasks Error", "Failed to fetch custom tasks", { error: (error as Error).message }, user.id);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [user, toast]);

  useEffect(() => {
     if (!authLoading && user) {
      fetchTasks();
    } else if (!authLoading && !user) {
      setIsLoadingTasks(false);
      setCustomTasks([]);
    }
  }, [user, authLoading, fetchTasks]);

  const handleOpenDialog = (task?: CustomTask) => {
    if (task) {
      setCurrentEditingTask(task);
      setTaskTitle(task.title);
      setTaskDescription(task.description || '');
      setTaskCategory(task.category);
      setTaskDate(task.task_date && isValid(parseISO(task.task_date)) ? parseISO(task.task_date) : undefined);
      setTaskHasReminder(task.has_reminder || false);
      setTaskReminderTime(task.reminder_time || '09:00');
    } else {
      setCurrentEditingTask({});
      setTaskTitle('');
      setTaskDescription('');
      setTaskCategory(taskCategories[0]);
      setTaskDate(undefined);
      setTaskHasReminder(false);
      setTaskReminderTime('09:00');
    }
    setIsFormOpen(true);
  };

  const handleSaveTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in." });
      return;
    }
    if (!taskTitle || !taskCategory) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide a title and category." });
      return;
    }
    if (taskHasReminder && !taskReminderTime) {
      toast({ variant: "destructive", title: "Missing Reminder Time", description: "Please provide a time for the reminder." });
      return;
    }
    setIsSubmitting(true);

    const taskDataToSave: Omit<CustomTask, 'id' | 'created_at' | 'updated_at'> = {
      user_id: user.id,
      title: taskTitle,
      description: taskDescription || null,
      category: taskCategory,
      task_date: taskDate ? format(startOfDay(taskDate), 'yyyy-MM-dd') : null,
      has_reminder: taskHasReminder,
      reminder_time: taskHasReminder ? taskReminderTime : null,
      completed: currentEditingTask.id ? currentEditingTask.completed || false : false,
    };

    try {
      if (currentEditingTask.id) {
        const { error } = await supabase
          .from('custom_tasks')
          .update({ ...taskDataToSave, updated_at: new Date().toISOString() })
          .eq('id', currentEditingTask.id)
          .eq('user_id', user.id);
        if (error) throw error;
        toast({ title: "Task Updated", description: `"${taskTitle}" has been updated.` });
        logActivity("Custom Tasks", `Task updated: "${taskTitle}"`, { taskId: currentEditingTask.id }, user.id);
      } else {
        const { data, error } = await supabase
          .from('custom_tasks')
          .insert(taskDataToSave)
          .select()
          .single();
        if (error) throw error;
        toast({ title: "Task Added", description: `"${taskTitle}" has been added.` });
        if (data) logActivity("Custom Tasks", `Task added: "${taskTitle}"`, { taskId: data.id }, user.id);
      }
      fetchTasks();
      setIsFormOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Saving Task", description: (error as Error).message });
      if(user) logActivity("Custom Tasks Error", "Failed to save custom task", { error: (error as Error).message, taskTitle }, user.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    if (!user) return;

    const optimisticTasks = customTasks.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t);
    setCustomTasks(optimisticTasks);

    try {
      const { error } = await supabase
        .from('custom_tasks')
        .update({ completed: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .eq('user_id', user.id);
      if (error) {
        fetchTasks();
        throw error;
      }
      const task = customTasks.find(t=>t.id === taskId);
      if(task && user) {
        toast({title: `Task ${!currentStatus ? 'Completed' : 'Marked Incomplete'}`, description: `"${task.title}"`});
        logActivity("Custom Tasks", `Task ${!currentStatus ? 'completed' : 'marked incomplete'}: "${task.title}"`, { taskId }, user.id);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error Updating Task", description: (error as Error).message });
      if (user) logActivity("Custom Tasks Error", "Failed to toggle task completion", { error: (error as Error).message, taskId }, user.id);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    const taskToDelete = customTasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    setCustomTasks(customTasks.filter(t => t.id !== taskId));

    try {
      const { error } = await supabase
        .from('custom_tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);
      if (error) {
        fetchTasks();
        throw error;
      }
      toast({ variant: "destructive", title: "Task Deleted", description: `"${taskToDelete.title}" removed.` });
      if(user) logActivity("Custom Tasks", `Task deleted: "${taskToDelete.title}"`, { taskId }, user.id);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Deleting Task", description: (error as Error).message });
      if(user) logActivity("Custom Tasks Error", "Failed to delete task", { error: (error as Error).message, taskId }, user.id);
    }
  };

  if (authLoading && !user) {
     return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3"> <ClipboardList className="h-8 w-8 text-primary" /> <h1 className="text-3xl font-bold tracking-tight">Custom Tasks</h1> </div>
          <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Create New Task</Button>
        </div>
        <Card className="shadow-lg"><CardHeader><CardTitle>Loading Tasks...</CardTitle></CardHeader>
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
          <ClipboardList className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Custom Tasks</h1>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} disabled={!user}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSaveTask}>
              <DialogHeader>
                <DialogTitle>{currentEditingTask.id ? "Edit Custom Task" : "Add New Custom Task"}</DialogTitle>
                <DialogDescription>
                  {currentEditingTask.id ? "Modify the details of your custom task." : "Organize your non-academic life."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="custom-task-title">Title</Label>
                  <Input id="custom-task-title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g., Grocery Shopping" />
                </div>
                <div>
                  <Label htmlFor="custom-task-description">Description (Optional)</Label>
                  <Textarea id="custom-task-description" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Add more details..." className="min-h-[100px]"/>
                </div>
                <div>
                  <Label htmlFor="custom-task-category">Category</Label>
                  <Select value={taskCategory} onValueChange={setTaskCategory}>
                    <SelectTrigger id="custom-task-category"> <SelectValue placeholder="Select Category" /> </SelectTrigger>
                    <SelectContent> {taskCategories.map(cat => ( <SelectItem key={cat} value={cat}>{cat}</SelectItem> ))} </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="custom-task-date">Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="custom-task-date" variant={"outline"} className={cn("w-full justify-start text-left font-normal",!taskDate && "text-muted-foreground")}>
                        <CalendarIconLucide className="mr-2 h-4 w-4" />
                        {taskDate ? format(taskDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"> <Calendar mode="single" selected={taskDate} onSelect={setTaskDate} initialFocus /> </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="custom-task-reminder-enabled" checked={taskHasReminder} onCheckedChange={setTaskHasReminder}/>
                  <Label htmlFor="custom-task-reminder-enabled">Set Reminder (Visual Only)</Label>
                </div>
                {taskHasReminder && (
                  <div>
                    <Label htmlFor="custom-task-reminder-time">Reminder Time</Label>
                    <Input id="custom-task-reminder-time" type="time" value={taskReminderTime} onChange={(e) => setTaskReminderTime(e.target.value)} />
                    <p className="text-xs text-muted-foreground mt-1">Note: This is a visual reminder in the app; no system alarm will sound.</p>
                  </div>
                )}
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
          <CardTitle>Your Personal Task Board</CardTitle>
          <CardDescription>Manage personal tasks. Data saved to your Supabase account.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTasks ? (
            <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !user ? (
            <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
                <p className="text-muted-foreground">Please log in to manage your custom tasks.</p>
            </div>
          ) : customTasks.length > 0 ? (
            <ul className="space-y-3">
              {customTasks.map(task => (
                <li key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow bg-card/80">
                  <div className="flex items-start space-x-3">
                    <Checkbox id={`custom-task-${task.id}`} checked={task.completed} onCheckedChange={() => toggleTaskCompletion(task.id, task.completed)} className="mt-1"/>
                    <div className="flex-1">
                      <Label htmlFor={`custom-task-${task.id}`} className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </Label>
                      <div className="text-xs text-muted-foreground">
                        <span>{task.category}</span>
                        {task.task_date && isValid(parseISO(task.task_date)) && <span> - {format(parseISO(task.task_date), "EEE, MMM d")}</span>}
                      </div>
                      {task.description && <p className="text-sm mt-1 text-muted-foreground/80 whitespace-pre-wrap">{task.description}</p>}
                      {task.has_reminder && task.reminder_time && (
                        <div className="flex items-center text-xs text-accent mt-1">
                          <AlarmClock className="h-3.5 w-3.5 mr-1" /> {task.reminder_time} (Reminder set)
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-x-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(task)}><Edit2 className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteTask(task.id)}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
              <p className="text-muted-foreground">No custom tasks created yet. Add a task to organize your personal life!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
