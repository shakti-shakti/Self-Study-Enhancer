
"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { History, ListFilter, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActivityLog, type ActivityLog, logActivity } from "@/lib/activity-logger"; // Assuming logActivity is also exported for potential manual logging elsewhere, or for clearing.
import { formatDistanceToNow } from 'date-fns';
import { saveToLocalStorage } from "@/lib/local-storage";

export default function ActivityHistoryPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    setActivities(getActivityLog());
  }, []);
  
  const handleClearHistory = () => {
    // Clear activities in localStorage
    saveToLocalStorage('neetPrepProActivityLog', []);
    // Update state to reflect the change
    setActivities([]); 
     logActivity("System", "Activity history cleared."); // Log this action itself
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <History className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Activity History</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" disabled>
            <ListFilter className="mr-2 h-4 w-4" />
            Filter Activities
          </Button>
          <Button variant="destructive" onClick={handleClearHistory} disabled={activities.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
          </Button>
        </div>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Recent Interactions</CardTitle>
          <CardDescription>Tracks completed tasks, solved tests, viewed content, and other app interactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <ul className="space-y-4">
              {activities.map(activity => (
                <li key={activity.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors bg-card/80">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{activity.type}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      {activity.details?.score && <p className="text-xs text-accent">Score: {activity.details.score}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground" title={new Date(activity.timestamp).toLocaleString()}>
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
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
