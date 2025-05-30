
"use client";
import { useState, useEffect, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpenCheck, PlusCircle, Edit2, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activity-logger';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabaseClient';

interface GuidelineTab {
  id: string; // Supabase UUID
  user_id: string;
  title: string;
  content: string;
  tab_order?: number; // Optional for ordering
  created_at?: string;
  updated_at?: string;
}

const initialDefaultTabs: Omit<GuidelineTab, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'tab_order'>[] = [
  { title: "General Tips", content: "1. Create a realistic study schedule and stick to it.\n2. Focus on understanding concepts rather than rote memorization.\n3. Solve previous year question papers regularly." },
  { title: "Exam Strategy", content: "1. Manage your time effectively during the exam.\n2. Read questions carefully before attempting.\n3. Prioritize sections you are strong in." },
  { title: "Subject Notes", content: "Physics: Key formulas for Kinematics...\nChemistry: Important reactions for p-block...\nBiology: Key diagrams for Plant Anatomy..." },
];

export default function NeetGuidelinesPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [tabs, setTabs] = useState<GuidelineTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [isLoadingTabs, setIsLoadingTabs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentEditingTab, setCurrentEditingTab] = useState<Partial<GuidelineTab> & { id?: string }>({});
  const [tabTitleInput, setTabTitleInput] = useState('');
  const [tabContentInput, setTabContentInput] = useState('');

  const fetchTabs = async () => {
    if (!user) return;
    setIsLoadingTabs(true);
    try {
      const { data, error } = await supabase
        .from('guideline_tabs')
        .select('*')
        .eq('user_id', user.id)
        .order('tab_order', { ascending: true, nullsFirst: false }) // Order by tab_order, then by created_at
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length === 0) {
        // If no tabs exist for the user, create the initial default ones
        const defaultTabsToInsert = initialDefaultTabs.map((t, index) => ({
          user_id: user.id,
          title: t.title,
          content: t.content,
          tab_order: index,
        }));
        const { data: insertedTabs, error: insertError } = await supabase
          .from('guideline_tabs')
          .insert(defaultTabsToInsert)
          .select();
        if (insertError) throw insertError;
        setTabs(insertedTabs || []);
        if (insertedTabs && insertedTabs.length > 0) setActiveTabId(insertedTabs[0].id);
      } else {
        setTabs(data || []);
        if (data && data.length > 0 && !data.find(t => t.id === activeTabId)) {
          setActiveTabId(data[0].id);
        } else if (data && data.length === 0) {
          setActiveTabId('');
        }
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error Fetching Tabs", description: (error as Error).message });
      logActivity("NEET Guidelines Error", "Failed to fetch tabs", { error: (error as Error).message, userId: user?.id });
    } finally {
      setIsLoadingTabs(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchTabs();
    }
  }, [user, authLoading]);


  const handleOpenDialog = (tab?: GuidelineTab) => {
    if (tab) {
      setCurrentEditingTab(tab);
      setTabTitleInput(tab.title);
      setTabContentInput(tab.content);
    } else {
      setCurrentEditingTab({});
      setTabTitleInput('');
      setTabContentInput('');
    }
    setIsFormOpen(true);
  };

  const handleSaveTab = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      return;
    }
    if (!tabTitleInput || !tabContentInput) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide a title and content for the tab." });
      return;
    }
    setIsSubmitting(true);

    const tabDataToSave = {
      user_id: user.id,
      title: tabTitleInput,
      content: tabContentInput,
      tab_order: currentEditingTab.id ? currentEditingTab.tab_order : tabs.length, // Simple ordering
    };

    try {
      if (currentEditingTab.id) { // Editing
        const { error } = await supabase
          .from('guideline_tabs')
          .update({ ...tabDataToSave, updated_at: new Date().toISOString() })
          .eq('id', currentEditingTab.id)
          .eq('user_id', user.id);
        if (error) throw error;
        toast({ title: "Tab Updated", description: `"${tabTitleInput}" has been updated.` });
        logActivity("NEET Guidelines", `Tab updated: "${tabTitleInput}"`, { tabId: currentEditingTab.id, userId: user.id });
      } else { // Adding
        const { data, error } = await supabase
          .from('guideline_tabs')
          .insert(tabDataToSave)
          .select()
          .single();
        if (error) throw error;
        toast({ title: "Tab Added", description: `New tab "${tabTitleInput}" created.` });
        if(data) setActiveTabId(data.id); 
        logActivity("NEET Guidelines", `Tab added: "${tabTitleInput}"`, { tabId: data?.id, userId: user.id });
      }
      fetchTabs();
      setIsFormOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Saving Tab", description: (error as Error).message });
      logActivity("NEET Guidelines Error", "Failed to save tab", { error: (error as Error).message, tabTitle: tabTitleInput, userId: user.id });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteTab = async (tabIdToDelete: string) => {
    if (!user) return;
    if (tabs.length <= 1) {
      toast({ variant: "destructive", title: "Cannot Delete", description: "At least one tab must remain." });
      return;
    }
    const tabToDelete = tabs.find(t => t.id === tabIdToDelete);
    if (!tabToDelete) return;

    try {
      const { error } = await supabase
        .from('guideline_tabs')
        .delete()
        .eq('id', tabIdToDelete)
        .eq('user_id', user.id);
      if (error) throw error;
      
      toast({ variant: "destructive", title: "Tab Deleted", description: `"${tabToDelete.title}" has been removed.` });
      logActivity("NEET Guidelines", `Tab deleted: "${tabToDelete.title}"`, { tabId: tabIdToDelete, userId: user.id });
      
      const remainingTabs = tabs.filter(t => t.id !== tabIdToDelete);
      setTabs(remainingTabs); // Optimistic update for UI
      if (activeTabId === tabIdToDelete && remainingTabs.length > 0) {
        setActiveTabId(remainingTabs[0].id);
      } else if (remainingTabs.length === 0) {
        setActiveTabId('');
      }
      // fetchTabs(); // Or just update locally if delete is confirmed
    } catch (error) {
       toast({ variant: "destructive", title: "Error Deleting Tab", description: (error as Error).message });
       logActivity("NEET Guidelines Error", "Failed to delete tab", { error: (error as Error).message, tabId: tabIdToDelete, userId: user.id });
    }
  };

  if (authLoading && !user) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpenCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">NEET Guidelines Dashboard</h1>
        </div>
         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
             <Button onClick={() => handleOpenDialog()} disabled={!user || isSubmitting}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Tab
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSaveTab}>
              <DialogHeader>
                <DialogTitle>{currentEditingTab.id ? "Edit Tab" : "Add New Tab"}</DialogTitle>
                <DialogDescription>
                  {currentEditingTab.id ? "Modify the content of this guideline tab." : "Create a new tab for your tips or notes."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="tab-title-input">Tab Title</Label>
                  <Input id="tab-title-input" value={tabTitleInput} onChange={(e) => setTabTitleInput(e.target.value)} placeholder="e.g., Physics Formulas" />
                </div>
                <div>
                  <Label htmlFor="tab-content-input">Content</Label>
                  <Textarea id="tab-content-input" value={tabContentInput} onChange={(e) => setTabContentInput(e.target.value)} placeholder="Enter your notes or tips here..." className="min-h-[150px]" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentEditingTab.id ? "Save Changes" : "Save Tab"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Important NEET Info</CardTitle>
          <CardDescription>Organize and access important NEET tips, reminders, or guidelines in custom tabs. Your notes are saved to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTabs ? (
            <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tabs.length > 0 ? (
            <Tabs value={activeTabId} onValueChange={setActiveTabId} className="w-full">
              <ScrollArea className="pb-2">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 mb-4 h-auto flex-wrap items-stretch">
                  {tabs.map(tab => (
                    <TabsTrigger key={tab.id} value={tab.id} className="relative group data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full py-2 px-3">
                      {tab.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>
              {tabs.map(tab => (
                <TabsContent key={tab.id} value={tab.id}>
                  <Card className="bg-card/80 shadow-inner">
                    <CardHeader className="flex flex-row justify-between items-center">
                      <CardTitle className="text-xl">{tab.title}</CardTitle>
                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(tab)}>
                          <Edit2 className="mr-1.5 h-3.5 w-3.5"/> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteTab(tab.id)} disabled={tabs.length <=1}>
                          <Trash2 className="mr-1.5 h-3.5 w-3.5"/> Delete
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 min-h-[200px] whitespace-pre-wrap text-sm leading-relaxed">
                      {tab.content || <p className="text-muted-foreground">No content yet for this tab. Click edit to add some!</p>}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
             <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center text-center">
              <BookOpenCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3"/>
              <p className="text-muted-foreground">No guideline tabs created yet. Click "Add New Tab" to start!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    