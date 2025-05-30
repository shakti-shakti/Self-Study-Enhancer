
"use client";
import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BellRing, PlusCircle, Edit2, Trash2, AlarmClockCheck, AlarmClockOff, CalendarIcon as CalendarIconLucide, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabaseClient';
import { format, parseISO, isValid, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { logActivity } from '@/lib/activity-logger';

interface Reminder {
  id: string; 
  user_id: string;
  title: string;
  reminder_date: string; 
  reminder_time: string; 
  recurring_days?: string[] | null; 
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const availableDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TaskRemindersPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [currentEditingReminder, setCurrentEditingReminder] = useState<Partial<Reminder> & { id?: string }>({});
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | undefined>(new Date());
  const [reminderTime, setReminderTime] = useState('09:00');
  const [selectedRecurringDays, setSelectedRecurringDays] = useState<string[]>([]);
  const [reminderIsActive, setReminderIsActive] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!user) {
        setReminders([]);
        setIsLoadingReminders(false);
        return;
    }
    setIsLoadingReminders(true);
    try {
      const { data, error } = await supabase
        .from('task_reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('reminder_date', { ascending: true })
        .order('reminder_time', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Fetching Reminders", description: (error as Error).message });
      if (user) logActivity("Task Reminders Error", "Failed to fetch reminders", { error: (error as Error).message }, user.id);
    } finally {
      setIsLoadingReminders(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading) {
      fetchReminders();
    }
  }, [user, authLoading, fetchReminders]);

  const handleOpenDialog = (reminder?: Reminder) => {
    if (reminder) {
      setCurrentEditingReminder(reminder);
      setReminderTitle(reminder.title);
      const parsedDate = reminder.reminder_date ? parseISO(reminder.reminder_date) : new Date();
      setReminderDate(isValid(parsedDate) ? parsedDate : new Date());
      setReminderTime(reminder.reminder_time);
      setSelectedRecurringDays(reminder.recurring_days || []);
      setReminderIsActive(reminder.is_active);
    } else {
      setCurrentEditingReminder({});
      setReminderTitle('');
      setReminderDate(new Date());
      setReminderTime('09:00'); 
      setSelectedRecurringDays([]);
      setReminderIsActive(true);
    }
    setIsFormOpen(true);
  };

  const handleDayToggle = (day: string) => {
    setSelectedRecurringDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };
  
  const handleSetDaily = () => {
    setSelectedRecurringDays(prev => 
        prev.length === availableDays.length && prev.every(d => availableDays.includes(d)) 
        ? [] 
        : [...availableDays]
    );
  };

  const handleSaveReminder = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      return;
    }
    if (!reminderTitle || !reminderDate || !reminderTime) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill in title, date, and time." });
      return;
    }
    setIsSubmitting(true);

    const reminderDataToSave = {
      user_id: user.id,
      title: reminderTitle,
      reminder_date: format(startOfDay(reminderDate), 'yyyy-MM-dd'),
      reminder_time: reminderTime,
      recurring_days: selectedRecurringDays.length > 0 ? selectedRecurringDays : null,
      is_active: reminderIsActive,
    };

    try {
      if (currentEditingReminder.id) { 
        const { error } = await supabase
          .from('task_reminders')
          .update({ ...reminderDataToSave, updated_at: new Date().toISOString() })
          .eq('id', currentEditingReminder.id)
          .eq('user_id', user.id);
        if (error) throw error;
        toast({ title: "Reminder Updated", description: `"${reminderTitle}" has been updated.` });
        logActivity("Task Reminders", `Reminder updated: "${reminderTitle}"`, { reminderId: currentEditingReminder.id }, user.id);
      } else { 
        const {data, error} = await supabase
          .from('task_reminders')
          .insert(reminderDataToSave)
          .select()
          .single();
        if (error) throw error;
        toast({ title: "Reminder Added", description: `"${reminderTitle}" has been set.` });
        if(data) logActivity("Task Reminders", `Reminder added: "${reminderTitle}"`, { reminderId: data.id }, user.id);
      }
      fetchReminders();
      setIsFormOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Saving Reminder", description: (error as Error).message });
      if (user) logActivity("Task Reminders Error", "Failed to save reminder", { error: (error as Error).message, reminderTitle }, user.id);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const toggleReminderActive = async (reminderId: string, currentStatus: boolean) => {
    if (!user) return;

    const optimisticReminders = reminders.map(r => r.id === reminderId ? { ...r, is_active: !currentStatus } : r);
    setReminders(optimisticReminders);
    
    try {
      const { error } = await supabase
        .from('task_reminders')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', reminderId)
        .eq('user_id', user.id);
      if (error) {
        fetchReminders(); 
        throw error;
      }
      const reminder = reminders.find(r => r.id === reminderId);
      if(reminder && user) {
        toast({ title: `Reminder ${!currentStatus ? 'Activated' : 'Deactivated'}`, description: `"${reminder.title}" is now ${!currentStatus ? 'active' : 'inactive'}.`});
        logActivity("Task Reminders", `Reminder "${reminder.title}" ${!currentStatus ? 'activated' : 'deactivated'}`, { reminderId }, user.id);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error Updating Reminder", description: (error as Error).message });
      if (user) logActivity("Task Reminders Error", "Failed to toggle reminder active state", { error: (error as Error).message, reminderId }, user.id);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!user) return;
    const reminderToDelete = reminders.find(r => r.id === reminderId);
    if(!reminderToDelete) return;

    setReminders(reminders.filter(r => r.id !== reminderId)); 

    try {
      const { error } = await supabase
        .from('task_reminders')
        .delete()
        .eq('id', reminderId)
        .eq('user_id', user.id);
      if (error) {
        fetchReminders(); 
        throw error;
      }
      toast({ variant: "destructive", title: "Reminder Deleted", description: `"${reminderToDelete.title}" removed.` });
      if(user) logActivity("Task Reminders", `Reminder deleted: "${reminderToDelete.title}"`, { reminderId }, user.id);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Deleting Reminder", description: (error as Error).message });
      if(user) logActivity("Task Reminders Error", "Failed to delete reminder", { error: (error as Error).message, reminderId }, user.id);
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3"> <BellRing className="h-8 w-8 text-primary" /> <h1 className="text-3xl font-bold tracking-tight">Task Reminders</h1> </div>
          <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Add Reminder</Button>
        </div>
        <Card className="shadow-lg"><CardHeader><CardTitle>Loading Reminders...</CardTitle></CardHeader>
          <CardContent className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BellRing className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Task Reminders</h1>
        </div>
         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} disabled={!user}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSaveReminder}>
              <DialogHeader>
                <DialogTitle>{currentEditingReminder.id ? "Edit Reminder" : "Set New Reminder"}</DialogTitle>
                <DialogDescription>
                  {currentEditingReminder.id ? "Modify your existing reminder." : "Create a new reminder. Visual only."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="reminder-title">Title</Label>
                  <Input id="reminder-title" value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} placeholder="e.g., Solve Physics problems" />
                </div>
                <div>
                  <Label htmlFor="reminder-date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="reminder-date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !reminderDate && "text-muted-foreground")}>
                        <CalendarIconLucide className="mr-2 h-4 w-4" />
                        {reminderDate ? format(reminderDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"> <Calendar mode="single" selected={reminderDate} onSelect={setReminderDate} initialFocus /> </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="reminder-time">Time</Label>
                  <Input id="reminder-time" type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
                </div>
                <div>
                  <Label>Repeat (Optional)</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {availableDays.map(day => (
                      <Button key={day} type="button" variant={selectedRecurringDays.includes(day) ? "secondary" : "outline"} size="sm" onClick={() => handleDayToggle(day)}> {day} </Button>
                    ))}
                  </div>
                  <Button type="button" variant="link" size="sm" className="p-0 h-auto mt-1" onClick={handleSetDaily}>
                    {(selectedRecurringDays.length === availableDays.length && selectedRecurringDays.every(d => availableDays.includes(d))) ? "Clear All Days" : "Set Daily"}
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="reminder-active" checked={reminderIsActive} onCheckedChange={setReminderIsActive} />
                  <Label htmlFor="reminder-active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Reminder
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Reminders</CardTitle>
          <CardDescription>Manage your study task reminders. Data saved to your Supabase account. Visual reminders only.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingReminders ? (
            <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !user ? (
            <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex items-center justify-center">
                 <p className="text-muted-foreground">Please log in to manage your task reminders.</p>
            </div>
          ) : reminders.length > 0 ? (
             <ul className="space-y-3">
              {reminders.map(reminder => ( 
                <li key={reminder.id} className={`flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow ${reminder.is_active ? 'bg-card/80' : 'bg-muted/50 opacity-70'}`}>
                  <div className="flex items-center space-x-3">
                     {reminder.is_active ? <AlarmClockCheck className="h-5 w-5 text-green-500 flex-shrink-0" /> : <AlarmClockOff className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                    <div>
                      <p className={`font-medium ${!reminder.is_active ? 'line-through' : ''}`}>{reminder.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(reminder.reminder_date), "EEE, MMM d, yyyy")} at {reminder.reminder_time}
                        {reminder.recurring_days && reminder.recurring_days.length > 0 && ` (Repeats: ${reminder.recurring_days.sort((a, b) => availableDays.indexOf(a) - availableDays.indexOf(b)).join(', ')})`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Switch checked={reminder.is_active} onCheckedChange={() => toggleReminderActive(reminder.id, reminder.is_active)} aria-label="Toggle reminder active state"/>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(reminder)}><Edit2 className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteReminder(reminder.id)}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 border rounded-lg min-h-[200px] bg-muted/30 flex flex-col items-center justify-center text-center">
              <BellRing className="h-16 w-16 text-muted-foreground mb-4"/>
              <p className="text-muted-foreground mb-2">No reminders set yet.</p>
              <p className="text-sm text-muted-foreground">Click "Add Reminder" to create your first task reminder.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
