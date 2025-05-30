
"use client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { CalendarCheck, Target, BookCopy, Edit3, PlusCircle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { logActivity } from "@/lib/activity-logger";
import { useAuth } from "@/hooks/use-auth";

// Mock data structure - in a real app, this would come from Supabase
interface YearlyPlanItem {
  id: string;
  type: 'goal' | 'syllabus_milestone' | 'revision_block';
  title: string;
  details?: string;
  targetDate?: string; // Optional target date or month
}

export default function YearPlannerPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);
  const [itemTitle, setItemTitle] = useState("");
  const [itemDetails, setItemDetails] = useState("");
  const [itemType, setItemType] = useState<'goal' | 'syllabus_milestone' | 'revision_block'>('goal');
  
  // Mock list of plan items - replace with Supabase fetch in future
  const [yearlyPlanItems, setYearlyPlanItems] = useState<YearlyPlanItem[]>([]); 

  const handleAddOrEditItem = (item?: YearlyPlanItem) => {
    if (item) {
      setItemTitle(item.title);
      setItemDetails(item.details || "");
      setItemType(item.type);
      // In a real app, set currentItemId for editing
    } else {
      setItemTitle("");
      setItemDetails("");
      setItemType('goal');
    }
    setIsPlanFormOpen(true);
  };

  const handleSaveItem = () => {
    if (!itemTitle) {
      toast({ variant: "destructive", title: "Title Required", description: "Please enter a title for your plan item." });
      return;
    }
    // This is a mock save.
    const newItem: YearlyPlanItem = {
      id: crypto.randomUUID(),
      type: itemType,
      title: itemTitle,
      details: itemDetails,
    };
    setYearlyPlanItems(prev => [...prev, newItem]);
    toast({
      title: "Yearly Plan Item (Mock Save)",
      description: `Item "${itemTitle}" added to your yearly plan. (Not saved to database yet)`,
    });
    logActivity("Year Planner", `Mock yearly plan item added: ${itemTitle}`, undefined, user?.id);
    setIsPlanFormOpen(false);
  };

  const handleDeleteItem = (itemId: string) => {
    const itemToDelete = yearlyPlanItems.find(i => i.id === itemId);
    setYearlyPlanItems(prev => prev.filter(i => i.id !== itemId));
    if(itemToDelete) {
      toast({variant: "destructive", title: "Item Deleted (Mock)", description: `Item "${itemToDelete.title}" removed.`});
      logActivity("Year Planner", `Mock yearly plan item deleted: ${itemToDelete.title}`, undefined, user?.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CalendarCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Year Planner</h1>
        </div>
        <Dialog open={isPlanFormOpen} onOpenChange={setIsPlanFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleAddOrEditItem()} disabled={!user}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Plan Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add to Yearly Plan</DialogTitle>
              <DialogDescription>Define a goal, milestone, or revision block for your year.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="item-type">Item Type</Label>
                 <select id="item-type" value={itemType} onChange={(e) => setItemType(e.target.value as any)} className="w-full mt-1 p-2 border rounded-md bg-background">
                  <option value="goal">Goal</option>
                  <option value="syllabus_milestone">Syllabus Milestone</option>
                  <option value="revision_block">Revision Block</option>
                </select>
              </div>
              <div>
                <Label htmlFor="item-title">Title</Label>
                <Input id="item-title" value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} placeholder="e.g., Master Organic Chemistry" />
              </div>
              <div>
                <Label htmlFor="item-details">Details (Optional)</Label>
                <Textarea id="item-details" value={itemDetails} onChange={(e) => setItemDetails(e.target.value)} placeholder="Add specifics..." />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleSaveItem}>Save Item (Mock)</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Long-Term Academic Plan</CardTitle>
          <CardDescription>Set goals, track syllabus progress, and schedule revisions for the year. (Full Supabase integration coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card className="hover:shadow-md transition-shadow bg-card/80">
              <CardHeader className="flex flex-row items-center space-x-2 pb-2"> <Target className="h-5 w-5 text-accent"/> <CardTitle className="text-lg">My Goals</CardTitle> </CardHeader>
              <CardContent> <p className="text-sm text-muted-foreground">Define yearly academic targets.</p> <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => {setItemType('goal'); handleAddOrEditItem()}}>Add Goal</Button> </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow bg-card/80">
              <CardHeader className="flex flex-row items-center space-x-2 pb-2"> <BookCopy className="h-5 w-5 text-accent"/> <CardTitle className="text-lg">Syllabus Milestones</CardTitle> </CardHeader>
              <CardContent> <p className="text-sm text-muted-foreground">Track progress through the NEET syllabus.</p> <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => {setItemType('syllabus_milestone'); handleAddOrEditItem()}}>Add Milestone</Button> </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow bg-card/80">
              <CardHeader className="flex flex-row items-center space-x-2 pb-2"> <CalendarCheck className="h-5 w-5 text-accent"/> <CardTitle className="text-lg">Revision Plans</CardTitle> </CardHeader>
              <CardContent> <p className="text-sm text-muted-foreground">Schedule revision cycles.</p> <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => {setItemType('revision_block'); handleAddOrEditItem()}}>Add Revision Block</Button> </CardContent>
            </Card>
          </div>

          {yearlyPlanItems.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-xl font-semibold">Your Yearly Plan Items:</h3>
              {yearlyPlanItems.map(item => (
                <Card key={item.id} className="p-4 bg-muted/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-primary">{item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: <span className="text-foreground">{item.title}</span></p>
                      {item.details && <p className="text-sm text-muted-foreground mt-1">{item.details}</p>}
                    </div>
                     <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAddOrEditItem(item)}><Edit3 className="h-4 w-4"/></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6 p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
             <div className="text-center">
                <CalendarCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">Detailed yearly planning interface will be implemented here.</p>
                <p className="text-sm text-muted-foreground">This section will visualize your yearly goals, syllabus coverage, and revision schedules. Currently, you can add mock items above.</p>
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
    