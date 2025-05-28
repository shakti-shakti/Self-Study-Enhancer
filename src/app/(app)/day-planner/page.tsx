
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { CalendarDays, PlusCircle, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function DayPlannerPage() {
  // Placeholder tasks
  const tasks = [
    { id: 1, title: "Physics: Read Chapter 1", startTime: "09:00 AM", duration: "1 hr", completed: true },
    { id: 2, title: "Chemistry: Solve 10 MCQs", startTime: "10:30 AM", duration: "45 mins", completed: false },
    { id: 3, title: "Biology: Revise Cell Structure", startTime: "02:00 PM", duration: "1.5 hrs", completed: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CalendarDays className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Day Planner</h1>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>Manage your daily tasks, mark them complete, and stay organized.</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <ul className="space-y-4">
              {tasks.map(task => (
                <li key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Checkbox id={`task-${task.id}`} checked={task.completed} />
                    <div>
                      <Label htmlFor={`task-${task.id}`} className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {task.startTime} ({task.duration})
                      </p>
                    </div>
                  </div>
                  {task.completed ? <CheckSquare className="h-5 w-5 text-green-500" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
              <p className="text-muted-foreground">No tasks scheduled for today. Add a task to get started!</p>
            </div>
          )}
          <p className="mt-4 text-sm text-muted-foreground">Incomplete tasks will be saved for later.</p>
        </CardContent>
      </Card>
    </div>
  );
}
