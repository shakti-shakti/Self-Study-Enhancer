
"use client";
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ClipboardList, PlusCircle, Edit2, Trash2, AlarmClock } from "lucide-react";
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
import { useToast } from '@/hooks/use-toast';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/local-storage';
import { logActivity } from '@/lib/activity-logger';

interface CustomTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  category: string;
  reminderTime?: string;
  hasReminder?: boolean;
}

const CUSTOM_TASKS_KEY = 'neetPrepProCustomTasks';
const taskCategories = ["Personal", "Social", "Career", "Academic", "Health", "Other"];

export default function CustomTasksPage() {
  const { toast } = useToast();
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<CustomTask> & { id?: string }>({});
  
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState(taskCategories[0]);
  const [taskHasReminder, setTaskHasReminder] = useState(false);
  const [taskReminderTime, setTaskReminderTime] = useState('');


  useEffect(() => {
    setCustomTasks(loadFromLocalStorage<CustomTask[]>(CUSTOM_TASKS_KEY, []));
  }, []);

  useEffect(() => {
    saveToLocalStorage(CUSTOM_TASKS_KEY, customTasks);
  }, [customTasks]);


  const handleOpenDialog = (task?: CustomTask) => {
    if (task) {
      setCurrentTask(task);
      setTaskTitle(task.title);
      setTaskDescription(task.description || '');
      setTaskCategory(task.category);
      setTaskHasReminder(task.hasReminder || false);
      setTaskReminderTime(task.reminderTime || '');
    } else {
      setCurrentTask({});
      setTaskTitle('');
      setTaskDescription('');
      setTaskCategory(taskCategories[0]);
      setTaskHasReminder(false);
      setTaskReminderTime('09:00');
    }
    setIsFormOpen(true);
  };

  const handleSaveTask = () => {
    if (!taskTitle || !taskCategory) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide a title and category." });
      return;
    }
    if (taskHasReminder && !taskReminderTime) {
      toast({ variant: "destructive", title: "Missing Reminder Time", description: "Please provide a time for the reminder." });
      return;
    }

    const taskData: Omit<CustomTask, 'id' | 'completed'> = {
        title: taskTitle,
        description: taskDescription,
        category: taskCategory,
        hasReminder: taskHasReminder,
        reminderTime: taskHasReminder ? taskReminderTime : undefined,
    };

    if (currentTask.id) { // Editing existing task
      setCustomTasks(customTasks.map(t => t.id === currentTask.id ? { ...t, ...taskData } : t));
      toast({ title: "Task Updated", description: `"${taskTitle}" has been updated.` });
      logActivity("Custom Tasks", `Task updated: "${taskTitle}"`);
    } else { // Adding new task
      const newTask: CustomTask = {
        id: crypto.randomUUID(),
        ...taskData,
        completed: false,
      };
      setCustomTasks(prevTasks => [newTask, ...prevTasks]);
      toast({ title: "Task Added", description: `"${taskTitle}" has been added to your custom tasks.` });
      logActivity("Custom Tasks", `Task added: "${taskTitle}"`);
    }
    setIsFormOpen(false);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setCustomTasks(customTasks.map(t => {
      if (t.id === taskId) {
        const updatedTask = { ...t, completed: !t.completed };
         if (updatedTask.completed) {
          logActivity("Custom Tasks", `Task completed: "${updatedTask.title}"`);
        } else {
          logActivity("Custom Tasks", `Task marked incomplete: "${updatedTask.title}"`);
        }
        return updatedTask;
      }
      return t;
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = customTasks.find(t => t.id === taskId);
    setCustomTasks(customTasks.filter(t => t.id !== taskId));
    if (taskToDelete) {
      toast({ variant: "destructive", title: "Task Deleted", description: `"${taskToDelete.title}" removed.` });
      logActivity("Custom Tasks", `Task deleted: "${taskToDelete.title}"`);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Custom Tasks</h1>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{currentTask.id ? "Edit Custom Task" : "Add New Custom Task"}</DialogTitle>
              <DialogDescription>
                {currentTask.id ? "Modify the details of your custom task." : "Organize your non-academic life."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="custom-task-title">Title</Label>
                <Input id="custom-task-title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g., Grocery Shopping" />
              </div>
              <div>
                <Label htmlFor="custom-task-description">Description (Optional)</Label>
                <Textarea id="custom-task-description" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Add more details..." />
              </div>
              <div>
                <Label htmlFor="custom-task-category">Category</Label>
                <Select value={taskCategory} onValueChange={setTaskCategory}>
                  <SelectTrigger id="custom-task-category">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="custom-task-reminder-enabled" checked={taskHasReminder} onCheckedChange={setTaskHasReminder}/>
                <Label htmlFor="custom-task-reminder-enabled">Set Reminder (Optional)</Label>
              </div>
              {taskHasReminder && (
                <div>
                  <Label htmlFor="custom-task-reminder-time">Reminder Time</Label>
                  <Input id="custom-task-reminder-time" type="time" value={taskReminderTime} onChange={(e) => setTaskReminderTime(e.target.value)} />
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" onClick={handleSaveTask}>Save Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Personal Task Board</CardTitle>
          <CardDescription>Manage personal tasks outside of your academic schedules. Fully customizable.</CardDescription>
        </CardHeader>
        <CardContent>
          {customTasks.length > 0 ? (
            <ul className="space-y-3">
              {customTasks.map(task => (
                <li key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow bg-card/80">
                  <div className="flex items-start space-x-3">
                    <Checkbox id={`custom-task-${task.id}`} checked={task.completed} onCheckedChange={() => toggleTaskCompletion(task.id)} className="mt-1"/>
                    <div className="flex-1">
                      <Label htmlFor={`custom-task-${task.id}`} className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </Label>
                      <p className="text-xs text-muted-foreground">{task.category}</p>
                      {task.description && <p className="text-sm mt-1 text-muted-foreground/80 whitespace-pre-wrap">{task.description}</p>}
                      {task.hasReminder && task.reminderTime && (
                        <div className="flex items-center text-xs text-accent mt-1">
                          <AlarmClock className="h-3.5 w-3.5 mr-1" /> {task.reminderTime} (Reminder set)
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
