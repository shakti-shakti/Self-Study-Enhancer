
"use client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { CalendarCheck, Target, BookCopy, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function YearPlannerPage() {
  const { toast } = useToast();

  const handleCustomizePlan = () => {
    toast({
      title: "Customize Plan (Mock)",
      description: "A detailed interface for customizing your yearly plan would open.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CalendarCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Year Planner</h1>
        </div>
        <Button onClick={handleCustomizePlan}>
          <Edit3 className="mr-2 h-4 w-4" />
          Customize Plan
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Long-Term Academic Plan</CardTitle>
          <CardDescription>Set your goals, track syllabus progress, and schedule revision plans for the entire year. (Detailed views coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow bg-card/80">
              <CardHeader className="flex flex-row items-center space-x-2 pb-2">
                <Target className="h-5 w-5 text-accent"/>
                <CardTitle className="text-lg">My Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Define and track your yearly academic targets. (e.g. Target Score, Subjects to Master)</p>
                 <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => toast({title: "View Goals (Mock)"})}>View/Edit Goals</Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow bg-card/80">
              <CardHeader className="flex flex-row items-center space-x-2 pb-2">
                <BookCopy className="h-5 w-5 text-accent"/>
                <CardTitle className="text-lg">Syllabus Tracker</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Monitor your progress through the NEET syllabus chapter by chapter.</p>
                 <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => toast({title: "View Syllabus (Mock)"})}>Track Progress</Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow bg-card/80">
              <CardHeader className="flex flex-row items-center space-x-2 pb-2">
                <CalendarCheck className="h-5 w-5 text-accent"/>
                <CardTitle className="text-lg">Revision Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Schedule and manage your revision cycles for optimal retention.</p>
                <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => toast({title: "View Revisions (Mock)"})}>Manage Revisions</Button>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
             <div className="text-center">
                <CalendarCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">Detailed yearly planning interface will be implemented here.</p>
                <p className="text-sm text-muted-foreground">This section will visualize your yearly goals, syllabus coverage, and revision schedules.</p>
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
