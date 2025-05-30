
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
import { useState, useEffect, type FormEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { logActivity } from "@/lib/activity-logger";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabaseClient";
import { format, parseISO } from 'date-fns';

interface MonthlyGoal {
  id: string;
  user_id: string;
  month_year: string; // e.g., "2024-07"
  title: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export default function MonthPlannerPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [currentEditingGoal, setCurrentEditingGoal] = useState<Partial<MonthlyGoal> & { id?: string }>({});
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [currentMonthYear, setCurrentMonthYear] = useState(format(new Date(), "yyyy-MM"));
  
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]); 

  const fetchGoals = async () => {
    if (!user) return;
    setIsLoadingGoals(true);
    try {
      const { data, error } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', currentMonthYear) // Fetch goals for the current month_year
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMonthlyGoals(data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Fetching Goals", description: (error as Error).message });
      logActivity("Month Planner Error", "Failed to fetch monthly goals", { error: (error as Error).message }, user?.id);
    } finally {
      setIsLoadingGoals(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchGoals();
    }
  }, [user, authLoading, currentMonthYear]); // Re-fetch if currentMonthYear changes

  const handleOpenDialog = (goal?: MonthlyGoal) => {
    if (goal) {
      setCurrentEditingGoal(goal);
      setGoalTitle(goal.title);
      setGoalDescription(goal.description || "");
    } else {
      setCurrentEditingGoal({});
      setGoalTitle("");
      setGoalDescription("");
    }
    setIsFormOpen(true);
  };

  const handleSaveGoal = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      return;
    }
    if (!goalTitle) {
      toast({ variant: "destructive", title: "Title Required", description: "Please enter a title for your goal." });
      return;
    }
    setIsSubmitting(true);

    const goalDataToSave = {
      user_id: user.id,
      month_year: currentMonthYear,
      title: goalTitle,
      description: goalDescription || null,
    };

    try {
      if (currentEditingGoal.id) { // Editing
        const { error } = await supabase
          .from('monthly_goals')
          .update({ ...goalDataToSave, updated_at: new Date().toISOString() })
          .eq('id', currentEditingGoal.id)
          .eq('user_id', user.id);
        if (error) throw error;
        toast({ title: "Goal Updated", description: `Goal "${goalTitle}" has been updated.` });
        logActivity("Month Planner", `Goal updated: "${goalTitle}"`, { goalId: currentEditingGoal.id }, user.id);
      } else { // Adding
        const { data, error } = await supabase
          .from('monthly_goals')
          .insert(goalDataToSave)
          .select()
          .single();
        if (error) throw error;
        toast({ title: "Goal Added", description: `Goal "${goalTitle}" added for ${format(parseISO(currentMonthYear + "-01"), "MMMM yyyy")}.` });
        logActivity("Month Planner", `Goal added: "${goalTitle}"`, { goalId: data?.id }, user.id);
      }
      fetchGoals();
      setIsFormOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Saving Goal", description: (error as Error).message });
      logActivity("Month Planner Error", "Failed to save goal", { error: (error as Error).message, goalTitle }, user.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    const goalToDelete = monthlyGoals.find(g => g.id === goalId);
    if (!goalToDelete) return;

    try {
      const { error } = await supabase
        .from('monthly_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user.id);
      if (error) throw error;
      toast({variant: "destructive", title: "Goal Deleted", description: `Goal "${goalToDelete.title}" removed.`});
      logActivity("Month Planner", `Goal deleted: "${goalToDelete.title}"`, { goalId }, user.id);
      fetchGoals(); // Refresh list
    } catch (error) {
      toast({variant: "destructive", title: "Error Deleting Goal", description: (error as Error).message});
      logActivity("Month Planner Error", "Failed to delete goal", { error: (error as Error).message, goalId }, user.id);
    }
  };
  
  const handleMonthChange = (offset: number) => {
    const currentDate = parseISO(currentMonthYear + "-01");
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentMonthYear(format(newDate, "yyyy-MM"));
  };


  if (authLoading && !user) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Month Planner</h1>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} disabled={!user || isSubmitting}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Goal for {format(parseISO(currentMonthYear + "-01"), "MMMM yyyy")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSaveGoal}>
              <DialogHeader>
                <DialogTitle>{currentEditingGoal.id ? "Edit Monthly Goal" : "Add New Monthly Goal"}</DialogTitle>
                <DialogDescription>Set a specific goal for {format(parseISO(currentMonthYear + "-01"), "MMMM yyyy")}.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="goal-title">Goal Title</Label>
                  <Input id="goal-title" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="e.g., Complete Physics Section X" />
                </div>
                <div>
                  <Label htmlFor="goal-description">Description (Optional)</Label>
                  <Textarea id="goal-description" value={goalDescription} onChange={(e) => setGoalDescription(e.target.value)} placeholder="Add details about your goal..." className="min-h-[100px]" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentEditingGoal.id ? "Save Changes" : "Save Goal"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Overview for {format(parseISO(currentMonthYear + "-01"), "MMMM yyyy")}</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleMonthChange(-1)}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => handleMonthChange(1)}>Next</Button>
            </div>
          </div>
          <CardDescription>Plan your subjects, tasks, and goals for the selected month.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingGoals ? (
             <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : monthlyGoals.length > 0 ? (
            <div className="space-y-3">
              {monthlyGoals.map(goal => (
                <Card key={goal.id} className="p-3 bg-card/80 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium truncate" title={goal.title}>{goal.title}</p>
                      {goal.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{goal.description}</p>}
                    </div>
                    <div className="flex space-x-1 flex-shrink-0 ml-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenDialog(goal)}><Edit2 className="h-4 w-4"/></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteGoal(goal.id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center text-center">
               <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No goals set for {format(parseISO(currentMonthYear + "-01"), "MMMM yyyy")}.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    