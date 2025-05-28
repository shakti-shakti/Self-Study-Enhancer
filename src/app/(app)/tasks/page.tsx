
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BellRing, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TaskRemindersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BellRing className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Task Reminders</h1>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Reminder
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Reminders</CardTitle>
          <CardDescription>Manage your study task reminders here. Set alarms to stay disciplined.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-2">No reminders set yet.</p>
            <p className="text-sm text-muted-foreground">Click "Add Reminder" to create your first task reminder.</p>
            <div className="mt-6">
              <p className="text-lg font-semibold">Example Reminder:</p>
              <p className="text-2xl font-bold mt-1">"Solve Physics Chapter 3 Numericals"</p>
              <p className="text-sm text-muted-foreground">at 4:00 PM</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

