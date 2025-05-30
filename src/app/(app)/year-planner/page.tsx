
"use client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { CalendarCheck, Target, BookCopy, Edit3, PlusCircle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
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
import { useState, useEffect, type FormEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logActivity } from "@/lib/activity-logger";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabaseClient";

interface YearlyPlanItem {
  id: string;
  user_id: string;
  type: 'goal' | 'syllabus_milestone' | 'revision_block';
  title: string;
  details?: string;
  target_date?: string; // Optional target date or month, e.g., "2024-Q3" or "2024-10"
  created_at?: string;
  updated_at?: string;
}

const itemTypes: YearlyPlanItem['type'][] = ['goal', 'syllabus_milestone', 'revision_block'];

export default function YearPlannerPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentEditingItem, setCurrentEditingItem] = useState<Partial<YearlyPlanItem> & { id?: string }>({});
  const [itemTitle, setItemTitle] = useState("");
  const [itemDetails, setItemDetails] = useState("");
  const [itemType, setItemType] = useState<YearlyPlanItem['type']>('goal');
  const [itemTargetDate, setItemTargetDate] = useState("");
  
  const [yearlyPlanItems, setYearlyPlanItems] = useState<YearlyPlanItem[]>([]); 

  const fetchItems = async () => {
    if (!user) return;
    setIsLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from('yearly_plan_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }); // Or by target_date if preferred

      if (error) throw error;
      setYearlyPlanItems(data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Fetching Plan Items", description: (error as Error).message });
      logActivity("Year Planner Error", "Failed to fetch yearly plan items", { error: (error as Error).message }, user?.id);
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchItems();
    }
  }, [user, authLoading]);

  const handleOpenDialog = (item?: YearlyPlanItem) => {
    if (item) {
      setCurrentEditingItem(item);
      setItemTitle(item.title);
      setItemDetails(item.details || "");
      setItemType(item.type);
      setItemTargetDate(item.target_date || "");
    } else {
      setCurrentEditingItem({});
      setItemTitle("");
      setItemDetails("");
      setItemType('goal');
      setItemTargetDate("");
    }
    setIsFormOpen(true);
  };

  const handleSaveItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      return;
    }
    if (!itemTitle || !itemType) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please enter a title and select a type." });
      return;
    }
    setIsSubmitting(true);

    const itemDataToSave = {
      user_id: user.id,
      type: itemType,
      title: itemTitle,
      details: itemDetails || null,
      target_date: itemTargetDate || null,
    };

    try {
      if (currentEditingItem.id) { // Editing
        const { error } = await supabase
          .from('yearly_plan_items')
          .update({ ...itemDataToSave, updated_at: new Date().toISOString() })
          .eq('id', currentEditingItem.id)
          .eq('user_id', user.id);
        if (error) throw error;
        toast({ title: "Plan Item Updated", description: `"${itemTitle}" has been updated.` });
        logActivity("Year Planner", `Item updated: "${itemTitle}"`, { itemId: currentEditingItem.id }, user.id);
      } else { // Adding
        const { data, error } = await supabase
          .from('yearly_plan_items')
          .insert(itemDataToSave)
          .select()
          .single();
        if (error) throw error;
        toast({ title: "Plan Item Added", description: `"${itemTitle}" added to your yearly plan.` });
        logActivity("Year Planner", `Item added: "${itemTitle}"`, { itemId: data?.id }, user.id);
      }
      fetchItems();
      setIsFormOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Saving Item", description: (error as Error).message });
      logActivity("Year Planner Error", "Failed to save item", { error: (error as Error).message, itemTitle }, user.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return;
    const itemToDelete = yearlyPlanItems.find(i => i.id === itemId);
    if(!itemToDelete) return;

    try {
      const { error } = await supabase
        .from('yearly_plan_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);
      if (error) throw error;
      toast({variant: "destructive", title: "Item Deleted", description: `Item "${itemToDelete.title}" removed.`});
      logActivity("Year Planner", `Item deleted: "${itemToDelete.title}"`, { itemId }, user.id);
      fetchItems(); // Refresh list
    } catch (error) {
      toast({variant: "destructive", title: "Error Deleting Item", description: (error as Error).message});
      logActivity("Year Planner Error", "Failed to delete item", { error: (error as Error).message, itemId }, user.id);
    }
  };

  if (authLoading && !user) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CalendarCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Year Planner</h1>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} disabled={!user || isSubmitting}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Plan Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSaveItem}>
              <DialogHeader>
                <DialogTitle>{currentEditingItem.id ? "Edit Yearly Plan Item" : "Add to Yearly Plan"}</DialogTitle>
                <DialogDescription>Define a goal, milestone, or revision block for your year.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="item-type">Item Type</Label>
                  <Select value={itemType} onValueChange={(value) => setItemType(value as YearlyPlanItem['type'])}>
                    <SelectTrigger id="item-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {itemTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="item-title">Title</Label>
                  <Input id="item-title" value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} placeholder="e.g., Master Organic Chemistry" />
                </div>
                <div>
                  <Label htmlFor="item-details">Details (Optional)</Label>
                  <Textarea id="item-details" value={itemDetails} onChange={(e) => setItemDetails(e.target.value)} placeholder="Add specifics..." className="min-h-[100px]" />
                </div>
                <div>
                  <Label htmlFor="item-target-date">Target Date/Period (Optional)</Label>
                  <Input id="item-target-date" value={itemTargetDate} onChange={(e) => setItemTargetDate(e.target.value)} placeholder="e.g., 2024-Q4 or Oct 2024" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentEditingItem.id ? "Save Changes" : "Save Item"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Long-Term Academic Plan</CardTitle>
          <CardDescription>Set goals, track syllabus progress, and schedule revisions for the year. Data is saved to your account.</CardDescription>
        </CardHeader>
        <CardContent>
           {isLoadingItems ? (
             <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : yearlyPlanItems.length > 0 ? (
            <div className="space-y-4">
              {yearlyPlanItems.map(item => (
                <Card key={item.id} className="p-4 bg-card/80 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold text-primary">{item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: <span className="text-foreground font-medium truncate" title={item.title}>{item.title}</span></p>
                      {item.target_date && <p className="text-xs text-muted-foreground">Target: {item.target_date}</p>}
                      {item.details && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">{item.details}</p>}
                    </div>
                     <div className="flex space-x-1 flex-shrink-0 ml-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenDialog(item)}><Edit3 className="h-4 w-4"/></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
             <div className="mt-6 p-6 border rounded-lg min-h-[200px] bg-muted/30 flex flex-col items-center justify-center text-center">
                <CalendarCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">No yearly plan items added yet.</p>
                <p className="text-sm text-muted-foreground">Click "Add Plan Item" to start your long-term planning.</p>
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    