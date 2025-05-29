"use client";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { History, ListFilter, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [filterTerm, setFilterTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setActivities(getActivityLog());
  }, []);
  
  const handleClearAllHistory = () => {
    saveToLocalStorage('neetPrepProActivityLog', []);
    setActivities([]); 
    logActivity("System", "Activity history completely cleared."); 
    toast({ title: "History Cleared", description: "Your entire activity log has been cleared." });
  };

  const handleDeleteSpecificActivity = (activityId: string) => {
    const updatedActivities = activities.filter(activity => activity.id !== activityId);
    setActivities(updatedActivities);
    saveToLocalStorage('neetPrepProActivityLog', updatedActivities);
    const deletedActivity = activities.find(a => a.id === activityId);
    toast({ title: "Activity Deleted", description: `Removed: "${deletedActivity?.description.substring(0,30)}..."` });
    logActivity("System", `Specific activity deleted: ${deletedActivity?.type} - ${deletedActivity?.description.substring(0,30)}...`);
  };

  const filteredActivities = activities.filter(activity => {
    const searchTerm = filterTerm.toLowerCase();
    return activity.type.toLowerCase().includes(searchTerm) || 
           activity.description.toLowerCase().includes(searchTerm) ||
           (activity.details && Object.values(activity.details).some(val => String(val).toLowerCase().includes(searchTerm)));
  });


  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <History className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Activity History</h1>
        </div>
        <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={activities.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete ALL your activity history. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAllHistory} className="bg-destructive hover:bg-destructive/90">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      </div>
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Recent Interactions</CardTitle>
          <CardDescription>Tracks completed tasks, solved tests, viewed content, and other app interactions.</CardDescription>
           <div className="pt-4">
            <Label htmlFor="filter-activities" className="sr-only">Filter activities</Label>
            <div className="flex items-center space-x-2">
                <Input 
                    id="filter-activities"
                    placeholder="Filter activities by type, description, details..." 
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Button variant="outline" size="icon" aria-label="Search activities"><Search className="h-4 w-4"/></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredActivities.length > 0 ? (
            <ul className="space-y-4">
              {filteredActivities.map(activity => (
                <li key={activity.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors bg-card/80">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold">{activity.type}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      {activity.details?.score !== undefined && activity.details?.total !== undefined && (
                        <p className="text-xs text-accent">Score: {activity.details.score}/{activity.details.total}</p>
                      )}
                      {activity.details && Object.entries(activity.details).map(([key, value]) => {
                        if (key !== 'score' && key !== 'total' && typeof value !== 'object') { // Avoid rendering complex objects directly
                           return <p key={key} className="text-xs text-muted-foreground/70">{key}: {String(value).substring(0,50)}{String(value).length > 50 ? '...' : ''}</p>
                        }
                        return null;
                      })}
                    </div>
                    <div className="flex flex-col items-end ml-2">
                        <p className="text-xs text-muted-foreground whitespace-nowrap" title={new Date(activity.timestamp).toLocaleString()}>
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                        <Button variant="ghost" size="icon" className="h-7 w-7 mt-1 text-destructive hover:text-destructive" onClick={() => handleDeleteSpecificActivity(activity.id)} title="Delete this activity">
                            <Trash2 className="h-3.5 w-3.5"/>
                        </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
          <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
            <p className="text-muted-foreground">{activities.length > 0 && filterTerm ? "No activities match your filter." : "No activities recorded yet."}</p>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    