
"use client";
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { CalendarDays, PlusCircle, CheckSquare, Square, Edit2, Trash2 } from "lucide-react";
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
import { useToast } from '@/hooks/use-toast';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/local-storage';
import { logActivity } from '@/lib/activity-logger';

interface Task {
  id: string;
  title: string;
  startTime: string;
  duration: string;
  completed: boolean;
}

const DAY_PLANNER_TASKS_KEY = 'neetPrepProDayPlannerTasks';

export default function DayPlannerPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task> & { id?: string }>({});
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [taskDuration, setTaskDuration] = useState('');

  useEffect(() => {
    setTasks(loadFromLocalStorage<Task[]>(DAY_PLANNER_TASKS_KEY, []));
  }, []);

  useEffect(() => {
    saveToLocalStorage(DAY_PLANNER_TASKS_KEY, tasks);
  }, [tasks]);

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setCurrentTask(task);
      setTaskTitle(task.title);
      setTaskTime(task.startTime);
      setTaskDuration(task.duration);
    } else {
      setCurrentTask({});
      setTaskTitle('');
      setTaskTime('09:00'); // Default time
      setTaskDuration('1 hr'); // Default duration
    }
    setIsFormOpen(true);
  };

  const handleSaveTask = () => {
    if (!taskTitle || !taskTime || !taskDuration) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill in all task details." });
      return;
    }

    if (currentTask.id) { // Editing existing task
      setTasks(tasks.map(t => t.id === currentTask.id ? { ...t, title: taskTitle, startTime: taskTime, duration: taskDuration } : t));
      toast({ title: "Task Updated", description: `"${taskTitle}" has been updated.` });
      logActivity("Day Planner", `Task updated: "${taskTitle}"`);
    } else { // Adding new task
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: taskTitle,
        startTime: taskTime,
        duration: taskDuration,
        completed: false,
      };
      setTasks(prevTasks => [newTask, ...prevTasks].sort((a,b) => a.startTime.localeCompare(b.startTime)));
      toast({ title: "Task Added", description: `"${taskTitle}" has been scheduled.` });
      logActivity("Day Planner", `Task added: "${taskTitle}"`);
    }
    setIsFormOpen(false);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const updatedTask = { ...t, completed: !t.completed };
        if (updatedTask.completed) {
          logActivity("Day Planner", `Task completed: "${updatedTask.title}"`);
        } else {
          logActivity("Day Planner", `Task marked incomplete: "${updatedTask.title}"`);
        }
        return updatedTask;
      }
      return t;
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    setTasks(tasks.filter(t => t.id !== taskId));
    if (taskToDelete) {
      toast({ variant: "destructive", title: "Task Deleted", description: `"${taskToDelete.title}" removed.` });
      logActivity("Day Planner", `Task deleted: "${taskToDelete.title}"`);
    }
  };

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
                <Label htmlFor="task-time" className="text-right">Time</Label>
                <Input id="task-time" type="time" value={taskTime} onChange={(e) => setTaskTime(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="task-duration" className="text-right">Duration</Label>
                <Input id="task-duration" value={taskDuration} onChange={(e) => setTaskDuration(e.target.value)} className="col-span-3" placeholder="e.g., 1 hr 30 mins" />
              </div>
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
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>Manage your daily tasks, mark them complete, and stay organized.</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <ul className="space-y-3">
              {tasks.map(task => (
                <li key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow bg-card/80">
                  <div className="flex items-center space-x-3">
                    <Checkbox id={`task-${task.id}`} checked={task.completed} onCheckedChange={() => toggleTaskCompletion(task.id)} />
                    <div>
                      <Label htmlFor={`task-${task.id}`} className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {task.startTime} ({task.duration})
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
    </div>
  );
}
