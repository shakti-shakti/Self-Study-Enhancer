
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Calendar, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MonthPlannerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Month Planner</h1>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Monthly Goal
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Current Month Overview</CardTitle>
          <CardDescription>Plan your subjects, tasks, and classes for the month.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 border rounded-lg min-h-[300px] bg-muted/30 flex items-center justify-center">
            {/* Monthly calendar or task list view placeholder */}
            <p className="text-muted-foreground">Monthly planning interface will be here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
