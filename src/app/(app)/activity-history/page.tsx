
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { History, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ActivityHistoryPage() {
  // Placeholder activities
  const activities = [
    { id: 1, type: "Test Solved", description: "Physics Mock Test 3", timestamp: "2 hours ago", score: "75%" },
    { id: 2, type: "Task Completed", description: "Revise Chemical Bonding", timestamp: "5 hours ago" },
    { id: 3, type: "Content Viewed", description: "NCERT Biology - Chapter 5", timestamp: "Yesterday" },
    { id: 4, type: "AI Query", description: "Asked about Newton's Laws", timestamp: "Yesterday" },
  ];

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <History className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Activity History</h1>
        </div>
        <Button variant="outline">
          <ListFilter className="mr-2 h-4 w-4" />
          Filter Activities
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Recent Interactions</CardTitle>
          <CardDescription>Tracks completed tasks, solved tests, viewed content, and other app interactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <ul className="space-y-4">
              {activities.map(activity => (
                <li key={activity.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{activity.type}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      {activity.score && <p className="text-xs text-accent">Score: {activity.score}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
          <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
            <p className="text-muted-foreground">No activities recorded yet. Start using the app to see your history!</p>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
