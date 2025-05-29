
"use client";
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BellRing, PlusCircle, Edit2, Trash2, AlarmClockCheck, AlarmClockOff, CalendarIcon } from "lucide-react";
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
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/local-storage';
import { logActivity } from '@/lib/activity-logger';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface Reminder {
  id: string;
  title: string;
  date: string; // ISO string for date
  time: string;
  days: string[]; 
  isActive: boolean;
}

const TASK_REMINDERS_KEY = 'neetPrepProTaskReminders';
const availableDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; // Should remain if recurring is kept

export default function TaskRemindersPage() {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<Partial<Reminder> & { id?: string }>({});
  
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | undefined>(new Date());
  const [reminderTime, setReminderTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<string[]>([]); // Keep for recurring option if desired, or remove if only specific date
  const [reminderIsActive, setReminderIsActive] = useState(true);

  useEffect(() => {
    setReminders(loadFromLocalStorage<Reminder[]>(TASK_REMINDERS_KEY, []));
  }, []);

  // This useEffect was potentially problematic if not careful with dependencies.
  // Saving should happen explicitly after state changes that warrant it.
  // For simplicity, let's save on any change to reminders array.
  useEffect(() => {
    saveToLocalStorage(TASK_REMINDERS_KEY, reminders);
  }, [reminders]);


  const handleOpenDialog = (reminder?: Reminder) => {
    if (reminder) {
      setCurrentReminder(reminder);
      setReminderTitle(reminder.title);
      setReminderDate(reminder.date ? parseISO(reminder.date) : new Date());
      setReminderTime(reminder.time);
      setSelectedDays(reminder.days || []); // Keep for now
      setReminderIsActive(reminder.isActive);
    } else {
      setCurrentReminder({});
      setReminderTitle('');
      setReminderDate(new Date());
      setReminderTime('09:00'); 
      setSelectedDays([]); // Default to no recurring days if single date is primary
      setReminderIsActive(true);
    }
    setIsFormOpen(true);
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };
  
  const handleSetDaily = () => {
    if(selectedDays.length === availableDays.length && selectedDays.every(day => availableDays.includes(day))) {
      setSelectedDays([]);
    } else {
      setSelectedDays([...availableDays]);
    }
  };

  const handleSaveReminder = () => {
    if (!reminderTitle || !reminderTime || !reminderDate) { // Added check for reminderDate
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill in title, date, and time." });
      return;
    }

    const reminderData: Omit<Reminder, 'id'> = {
      title: reminderTitle,
      date: reminderDate.toISOString(), // Save date as ISO string
      time: reminderTime,
      days: selectedDays, // Keep if supporting recurring days
      isActive: reminderIsActive,
    };

    if (currentReminder.id) { // Editing
      setReminders(reminders.map(r => r.id === currentReminder.id ? { ...r, ...reminderData } : r));
      toast({ title: "Reminder Updated", description: `"${reminderTitle}" has been updated.` });
      logActivity("Task Reminders", `Reminder updated: "${reminderTitle}"`);
    } else { // Adding
      const newReminder: Reminder = {
        id: crypto.randomUUID(),
        ...reminderData,
      };
      setReminders(prev => [...prev, newReminder].sort((a,b) => {
        const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        return a.time.localeCompare(b.time);
      }));
      toast({ title: "Reminder Added", description: `"${reminderTitle}" has been set.` });
      logActivity("Task Reminders", `Reminder added: "${reminderTitle}"`);
    }
    setIsFormOpen(false);
  };
  
  const toggleReminderActive = (reminderId: string) => {
    setReminders(reminders.map(r => {
      if (r.id === reminderId) {
        const updatedReminder = { ...r, isActive: !r.isActive };
        logActivity("Task Reminders", `Reminder "${updatedReminder.title}" ${updatedReminder.isActive ? 'activated' : 'deactivated'}`);
        toast({ title: `Reminder ${updatedReminder.isActive ? 'Activated' : 'Deactivated'}`, description: `"${updatedReminder.title}" is now ${updatedReminder.isActive ? 'active' : 'inactive'}.`});
        return updatedReminder;
      }
      return r;
    }));
  };

  const handleDeleteReminder = (reminderId: string) => {
    const reminderToDelete = reminders.find(r => r.id === reminderId);
    setReminders(reminders.filter(r => r.id !== reminderId));
    if(reminderToDelete) {
      toast({ variant: "destructive", title: "Reminder Deleted", description: `"${reminderToDelete.title}" removed.` });
      logActivity("Task Reminders", `Reminder deleted: "${reminderToDelete.title}"`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BellRing className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Task Reminders</h1>
        </div>
         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{currentReminder.id ? "Edit Reminder" : "Set New Reminder"}</DialogTitle>
              <DialogDescription>
                {currentReminder.id ? "Modify your existing reminder." : "Create a new reminder to stay on track. Note: Actual alarm sounds are not supported in this web version."}
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
                    <Button
                      id="reminder-date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !reminderDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reminderDate ? format(reminderDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={reminderDate}
                      onSelect={setReminderDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="reminder-time">Time</Label>
                <Input id="reminder-time" type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
              </div>
              <div>
                <Label>Repeat (Optional - for recurring tasks on specific days)</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {availableDays.map(day => (
                    <Button 
                      key={day} 
                      variant={selectedDays.includes(day) ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleDayToggle(day)}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
                 <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={handleSetDaily}>
                    {(selectedDays.length === availableDays.length && selectedDays.every(d => availableDays.includes(d))) ? "Clear All Days" : "Set Daily"}
                  </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="reminder-active" checked={reminderIsActive} onCheckedChange={setReminderIsActive} />
                <Label htmlFor="reminder-active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" onClick={handleSaveReminder}>Save Reminder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Reminders</CardTitle>
          <CardDescription>Manage your study task reminders. Note: Alarms will not sound; these are visual reminders.</CardDescription>
        </CardHeader>
        <CardContent>
          {reminders.length > 0 ? (
             <ul className="space-y-3">
              {reminders.sort((a,b) => { // Sort reminders by date then time
                 const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                 if (dateComparison !== 0) return dateComparison;
                 return a.time.localeCompare(b.time);
                }).map(reminder => (
                <li key={reminder.id} className={`flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow ${reminder.isActive ? 'bg-card/80' : 'bg-muted/50 opacity-70'}`}>
                  <div className="flex items-center space-x-3">
                     {reminder.isActive ? <AlarmClockCheck className="h-5 w-5 text-green-500 flex-shrink-0" /> : <AlarmClockOff className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                    <div>
                      <p className={`font-medium ${!reminder.isActive ? 'line-through' : ''}`}>{reminder.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(reminder.date), "EEE, MMM d, yyyy")} at {reminder.time}
                        {reminder.days.length > 0 && ` (Repeats: ${reminder.days.sort((a, b) => availableDays.indexOf(a) - availableDays.indexOf(b)).join(', ')})`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Switch checked={reminder.isActive} onCheckedChange={() => toggleReminderActive(reminder.id)} aria-label="Toggle reminder active state"/>
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

    