
"use client";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { ClipboardList, PlusCircle, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
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

interface CustomTask {
  id: string;
  title: string;
  completed: boolean;
  category: string;
}

const initialCustomTasks: CustomTask[] = [
  { id: "1", title: "Buy new notebooks", completed: false, category: "Personal" },
  { id: "2", title: "Call a friend", completed: true, category: "Social" },
  { id: "3", title: "Research summer internships", completed: false, category: "Career" },
];

const taskCategories = ["Personal", "Social", "Career", "Academic", "Health", "Other"];

export default function CustomTasksPage() {
  const { toast } = useToast();
  const [customTasks, setCustomTasks] = useState<CustomTask[]>(initialCustomTasks);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<CustomTask> & { id?: string }>({});
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('');

  const handleOpenDialog = (task?: CustomTask) => {
    if (task) {
      setCurrentTask(task);
      setTaskTitle(task.title);
      setTaskCategory(task.category);
    } else {
      setCurrentTask({});
      setTaskTitle('');
      setTaskCategory(taskCategories[0]); // Default to first category
    }
    setIsFormOpen(true);
  };

  const handleSaveTask = () => {
    if (!taskTitle || !taskCategory) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide a title and category." });
      return;
    }

    if (currentTask.id) { // Editing existing task
      setCustomTasks(customTasks.map(t => t.id === currentTask.id ? { ...t, title: taskTitle, category: taskCategory } : t));
      toast({ title: "Task Updated", description: `"${taskTitle}" has been updated.` });
    } else { // Adding new task
      const newTask: CustomTask = {
        id: crypto.randomUUID(),
        title: taskTitle,
        category: taskCategory,
        completed: false,
      };
      setCustomTasks(prevTasks => [newTask, ...prevTasks]);
      toast({ title: "Task Added", description: `"${taskTitle}" has been added to your custom tasks.` });
    }
    setIsFormOpen(false);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setCustomTasks(customTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTask = (taskId: string) => {
    setCustomTasks(customTasks.filter(t => t.id !== taskId));
    toast({ variant: "destructive", title: "Task Deleted", description: "The custom task has been removed." });
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{currentTask.id ? "Edit Custom Task" : "Add New Custom Task"}</DialogTitle>
              <DialogDescription>
                {currentTask.id ? "Modify the details of your custom task." : "Organize your non-academic life."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="custom-task-title" className="text-right">Title</Label>
                <Input id="custom-task-title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="col-span-3" placeholder="e.g., Grocery Shopping" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="custom-task-category" className="text-right">Category</Label>
                <Select value={taskCategory} onValueChange={setTaskCategory}>
                  <SelectTrigger id="custom-task-category" className="col-span-3">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          <CardTitle>Your Personal Task Board</CardTitle>
          <CardDescription>Manage personal tasks outside of your academic schedules. Fully customizable.</CardDescription>
        </CardHeader>
        <CardContent>
          {customTasks.length > 0 ? (
            <ul className="space-y-3">
              {customTasks.map(task => (
                <li key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow bg-card/80">
                  <div className="flex items-center space-x-3">
                    <Checkbox id={`custom-task-${task.id}`} checked={task.completed} onCheckedChange={() => toggleTaskCompletion(task.id)}/>
                    <div>
                      <Label htmlFor={`custom-task-${task.id}`} className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </Label>
                      <p className="text-xs text-muted-foreground">{task.category}</p>
                    </div>
                  </div>
                  <div className="space-x-1">
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
