
"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { History, ListFilter, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActivityLog, type ActivityLog, logActivity } from "@/lib/activity-logger"; 
import { formatDistanceToNow } from 'date-fns';
import { saveToLocalStorage } from "@/lib/local-storage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function ActivityHistoryPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setActivities(getActivityLog());
  }, []);
  
  const handleClearHistory = () => {
    saveToLocalStorage('neetPrepProActivityLog', []);
    setActivities([]); 
    logActivity("System", "Activity history cleared."); 
    toast({ title: "History Cleared", description: "Your activity log has been cleared." });
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={activities.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete all your activity history. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearHistory} className="bg-destructive hover:bg-destructive/90">
                  Clear History
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
                      {activity.details?.score !== undefined && activity.details?.total !== undefined && (
                        <p className="text-xs text-accent">Score: {activity.details.score}/{activity.details.total}</p>
                      )}
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
