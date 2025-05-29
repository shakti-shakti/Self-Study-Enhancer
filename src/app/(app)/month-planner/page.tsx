
"use client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Calendar, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function MonthPlannerPage() {
  const { toast } = useToast();

  const handleAddGoal = () => {
    toast({
      title: "Add Monthly Goal (Mock)",
      description: "Functionality to add a new monthly goal would appear here, perhaps in a dialog.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Month Planner</h1>
        </div>
        <Button onClick={handleAddGoal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Monthly Goal
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Current Month Overview</CardTitle>
          <CardDescription>Plan your subjects, tasks, and classes for the month. (Full calendar view coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 border rounded-lg min-h-[300px] bg-muted/30 flex items-center justify-center">
            {/* Monthly calendar or task list view placeholder */}
            <div className="text-center">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">Monthly planning interface will be here.</p>
              <p className="text-sm text-muted-foreground">This could include a calendar view, list of major deadlines, or subject focus areas.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
