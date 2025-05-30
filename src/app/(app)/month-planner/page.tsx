
"use client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Calendar, PlusCircle, Edit2, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { logActivity } from "@/lib/activity-logger";
import { useAuth } from "@/hooks/use-auth";

// Mock data structure - in a real app, this would come from Supabase
interface MonthlyGoal {
  id: string;
  monthYear: string; // e.g., "2024-07"
  title: string;
  description?: string;
}

export default function MonthPlannerPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  // Mock list of goals - replace with Supabase fetch in future
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]); 

  const handleAddOrEditGoal = (goal?: MonthlyGoal) => {
    if (goal) {
      setGoalTitle(goal.title);
      setGoalDescription(goal.description || "");
      // In a real app, you'd set currentGoalId for editing
    } else {
      setGoalTitle("");
      setGoalDescription("");
    }
    setIsGoalFormOpen(true);
  };

  const handleSaveGoal = () => {
    if (!goalTitle) {
      toast({ variant: "destructive", title: "Title Required", description: "Please enter a title for your goal." });
      return;
    }
    // This is a mock save. In a real app, you'd save to Supabase.
    const newGoal: MonthlyGoal = {
      id: crypto.randomUUID(),
      monthYear: new Date().toISOString().slice(0, 7), // current month
      title: goalTitle,
      description: goalDescription,
    };
    setMonthlyGoals(prev => [...prev, newGoal]);
    toast({
      title: "Monthly Goal (Mock Save)",
      description: `Goal "${goalTitle}" added for the current month. (Not saved to database yet)`,
    });
    logActivity("Month Planner", `Mock goal added: ${goalTitle}`, undefined, user?.id);
    setIsGoalFormOpen(false);
  };

  const handleDeleteGoal = (goalId: string) => {
     // Mock delete
    const goalToDelete = monthlyGoals.find(g => g.id === goalId);
    setMonthlyGoals(prev => prev.filter(g => g.id !== goalId));
    if (goalToDelete) {
      toast({variant: "destructive", title: "Goal Deleted (Mock)", description: `Goal "${goalToDelete.title}" removed.`});
      logActivity("Month Planner", `Mock goal deleted: ${goalToDelete.title}`, undefined, user?.id);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Month Planner</h1>
        </div>
        <Dialog open={isGoalFormOpen} onOpenChange={setIsGoalFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleAddOrEditGoal()} disabled={!user}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Monthly Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Monthly Goal</DialogTitle>
              <DialogDescription>Set a specific goal for the current month.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="goal-title">Goal Title</Label>
                <Input id="goal-title" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="e.g., Complete Physics Section X" />
              </div>
              <div>
                <Label htmlFor="goal-description">Description (Optional)</Label>
                <Textarea id="goal-description" value={goalDescription} onChange={(e) => setGoalDescription(e.target.value)} placeholder="Add details about your goal..." />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleSaveGoal}>Save Goal (Mock)</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Current Month Overview ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})</CardTitle>
          <CardDescription>Plan your subjects, tasks, and classes for the month. (Full Supabase integration coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyGoals.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="text-lg font-semibold">Your Goals for this Month:</h3>
              {monthlyGoals.map(goal => (
                <Card key={goal.id} className="p-3 bg-muted/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{goal.title}</p>
                      {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAddOrEditGoal(goal)}><Edit2 className="h-4 w-4"/></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteGoal(goal.id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <div className="p-6 border rounded-lg min-h-[300px] bg-muted/30 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">Monthly planning interface will be here.</p>
              <p className="text-sm text-muted-foreground">This could include a calendar view, list of major deadlines, or subject focus areas. Currently, you can add mock goals above.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
    