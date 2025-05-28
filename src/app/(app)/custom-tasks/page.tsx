
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ClipboardList, PlusCircle, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function CustomTasksPage() {
  // Placeholder custom tasks
  const customTasks = [
    { id: 1, title: "Buy new notebooks", completed: false, category: "Personal" },
    { id: 2, title: "Call a friend", completed: true, category: "Social" },
    { id: 3, title: "Research summer internships", completed: false, category: "Career" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Custom Tasks</h1>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Task
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Personal Task Board</CardTitle>
          <CardDescription>Manage personal tasks outside of your academic schedules. Fully customizable.</CardDescription>
        </CardHeader>
        <CardContent>
          {customTasks.length > 0 ? (
            <ul className="space-y-3">
              {customTasks.map(task => (
                <li key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center space-x-3">
                    <Checkbox id={`custom-task-${task.id}`} checked={task.completed} />
                    <div>
                      <Label htmlFor={`custom-task-${task.id}`} className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </Label>
                      <p className="text-xs text-muted-foreground">{task.category}</p>
                    </div>
                  </div>
                  <div className="space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
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
