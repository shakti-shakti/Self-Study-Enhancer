
"use client";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpenCheck, PlusCircle, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Added import
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

interface GuidelineTab {
  id: string;
  title: string;
  content: string;
}

const initialTabs: GuidelineTab[] = [
  { id: "general_tips", title: "General Tips", content: "1. Create a realistic study schedule and stick to it.\n2. Focus on understanding concepts rather than rote memorization.\n3. Solve previous year question papers regularly." },
  { id: "exam_strategy", title: "Exam Strategy", content: "1. Manage your time effectively during the exam.\n2. Read questions carefully before attempting.\n3. Prioritize sections you are strong in." },
  { id: "subject_notes", title: "Subject Notes", content: "Physics: Key formulas for Kinematics...\nChemistry: Important reactions for p-block...\nBiology: Key diagrams for Plant Anatomy..." },
];

export default function NeetGuidelinesPage() {
  const { toast } = useToast();
  const [tabs, setTabs] = useState<GuidelineTab[]>(initialTabs);
  const [activeTab, setActiveTab] = useState<string>(initialTabs[0]?.id || '');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<Partial<GuidelineTab> & { id?: string }>({});
  const [tabTitle, setTabTitle] = useState('');
  const [tabContent, setTabContent] = useState('');

  const handleOpenDialog = (tab?: GuidelineTab) => {
    if (tab) {
      setCurrentTab(tab);
      setTabTitle(tab.title);
      setTabContent(tab.content);
    } else {
      setCurrentTab({});
      setTabTitle('');
      setTabContent('');
    }
    setIsFormOpen(true);
  };

  const handleSaveTab = () => {
    if (!tabTitle || !tabContent) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide a title and content for the tab." });
      return;
    }

    if (currentTab.id) { // Editing
      setTabs(tabs.map(t => t.id === currentTab.id ? { ...t, title: tabTitle, content: tabContent } : t));
      toast({ title: "Tab Updated", description: `"${tabTitle}" has been updated.` });
    } else { // Adding
      const newTabId = tabTitle.toLowerCase().replace(/\s+/g, '_') + '_' + crypto.randomUUID().substring(0,4);
      const newTab: GuidelineTab = {
        id: newTabId,
        title: tabTitle,
        content: tabContent,
      };
      setTabs(prevTabs => [...prevTabs, newTab]);
      setActiveTab(newTabId); // Switch to the new tab
      toast({ title: "Tab Added", description: `New tab "${tabTitle}" created.` });
    }
    setIsFormOpen(false);
  };
  
  const handleDeleteTab = (tabId: string) => {
    if (tabs.length <= 1) {
      toast({ variant: "destructive", title: "Cannot Delete", description: "At least one tab must remain." });
      return;
    }
    const tabToDelete = tabs.find(t => t.id === tabId);
    setTabs(tabs.filter(t => t.id !== tabId));
    // If active tab is deleted, switch to the first available tab
    if (activeTab === tabId) {
      setActiveTab(tabs.filter(t => t.id !== tabId)[0]?.id || '');
    }
    if (tabToDelete) {
      toast({ variant: "destructive", title: "Tab Deleted", description: `"${tabToDelete.title}" has been removed.` });
    }
    
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpenCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">NEET Guidelines Dashboard</h1>
        </div>
         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
             <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Tab/Tip
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{currentTab.id ? "Edit Tab" : "Add New Tab"}</DialogTitle>
              <DialogDescription>
                {currentTab.id ? "Modify the content of this guideline tab." : "Create a new tab for your tips or notes."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="tab-title">Tab Title</Label>
                <Input id="tab-title" value={tabTitle} onChange={(e) => setTabTitle(e.target.value)} placeholder="e.g., Physics Formulas" />
              </div>
              <div>
                <Label htmlFor="tab-content">Content</Label>
                <Textarea id="tab-content" value={tabContent} onChange={(e) => setTabContent(e.target.value)} placeholder="Enter your notes or tips here..." className="min-h-[150px]" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" onClick={handleSaveTab}>Save Tab</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Important NEET Info</CardTitle>
          <CardDescription>Organize and access important NEET tips, reminders, or guidelines in custom tabs.</CardDescription>
        </CardHeader>
        <CardContent>
          {tabs.length > 0 ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 mb-4 h-auto flex-wrap">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id} className="relative group data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    {tab.title}
                    {tab.id === activeTab && ( // Show edit/delete only on active tab for simplicity
                      <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 -translate-y-1/2 flex">
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary/30" onClick={(e) => { e.stopPropagation(); handleOpenDialog(tab); }}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/20 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteTab(tab.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map(tab => (
                <TabsContent key={tab.id} value={tab.id}>
                  <Card className="bg-card/80 shadow-inner">
                    <CardHeader>
                      <CardTitle className="text-xl">{tab.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 min-h-[200px] whitespace-pre-wrap text-sm leading-relaxed">
                      {tab.content || <p className="text-muted-foreground">No content yet for this tab. Click edit to add some!</p>}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
             <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
              <p className="text-muted-foreground">No guideline tabs created yet. Click "Add New Tab/Tip" to start!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
