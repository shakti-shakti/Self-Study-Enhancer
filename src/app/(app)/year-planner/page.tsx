
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { CalendarCheck, Target, BookCopy, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function YearPlannerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CalendarCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Year Planner</h1>
        </div>
        <Button>
          <Edit3 className="mr-2 h-4 w-4" />
          Customize Plan
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Long-Term Academic Plan</CardTitle>
          <CardDescription>Set your goals, track syllabus progress, and schedule revision plans for the entire year.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center space-x-2 pb-2">
                <Target className="h-5 w-5 text-accent"/>
                <CardTitle className="text-lg">My Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Define and track your yearly academic targets.</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center space-x-2 pb-2">
                <BookCopy className="h-5 w-5 text-accent"/>
                <CardTitle className="text-lg">Syllabus Tracker</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Monitor your progress through the NEET syllabus.</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center space-x-2 pb-2">
                <CalendarCheck className="h-5 w-5 text-accent"/>
                <CardTitle className="text-lg">Revision Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Schedule and manage your revision cycles.</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
            <p className="text-muted-foreground">Detailed yearly planning interface will be implemented here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
