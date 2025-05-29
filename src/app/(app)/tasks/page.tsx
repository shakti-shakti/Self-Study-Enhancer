
"use client";
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BellRing, PlusCircle, Edit2, Trash2, AlarmClockCheck, AlarmClockOff } from "lucide-react";
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
import { useToast } from '@/hooks/use-toast';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/local-storage';
import { logActivity } from '@/lib/activity-logger';

interface Reminder {
  id: string;
  title: string;
  time: string;
  days: string[]; 
  isActive: boolean;
}

const TASK_REMINDERS_KEY = 'neetPrepProTaskReminders';
const availableDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TaskRemindersPage() {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<Partial<Reminder> & { id?: string }>({});
  
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [reminderIsActive, setReminderIsActive] = useState(true);

  useEffect(() => {
    setReminders(loadFromLocalStorage<Reminder[]>(TASK_REMINDERS_KEY, []));
  }, []);

  useEffect(() => {
    saveToLocalStorage(TASK_REMINDERS_KEY, reminders);
  }, [reminders]);

  const handleOpenDialog = (reminder?: Reminder) => {
    if (reminder) {
      setCurrentReminder(reminder);
      setReminderTitle(reminder.title);
      setReminderTime(reminder.time);
      setSelectedDays(reminder.days);
      setReminderIsActive(reminder.isActive);
    } else {
      setCurrentReminder({});
      setReminderTitle('');
      setReminderTime('09:00'); 
      setSelectedDays([]);
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
    if (!reminderTitle || !reminderTime || selectedDays.length === 0) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill in title, time, and select at least one day." });
      return;
    }

    if (currentReminder.id) { // Editing
      setReminders(reminders.map(r => r.id === currentReminder.id ? { ...r, title: reminderTitle, time: reminderTime, days: selectedDays, isActive: reminderIsActive } : r));
      toast({ title: "Reminder Updated", description: `"${reminderTitle}" has been updated.` });
      logActivity("Task Reminders", `Reminder updated: "${reminderTitle}"`);
    } else { // Adding
      const newReminder: Reminder = {
        id: crypto.randomUUID(),
        title: reminderTitle,
        time: reminderTime,
        days: selectedDays,
        isActive: reminderIsActive,
      };
      setReminders(prev => [newReminder, ...prev].sort((a,b) => a.time.localeCompare(b.time)));
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
                {currentReminder.id ? "Modify your existing reminder." : "Create a new reminder to stay on track."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="reminder-title">Title</Label>
                <Input id="reminder-title" value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} placeholder="e.g., Solve Physics problems" />
              </div>
              <div>
                <Label htmlFor="reminder-time">Time</Label>
                <Input id="reminder-time" type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
              </div>
              <div>
                <Label>Repeat</Label>
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
                    {(selectedDays.length === availableDays.length && selectedDays.every(day => availableDays.includes(day))) ? "Clear All Days" : "Set Daily"}
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
          <CardTitle>Upcoming Reminders</CardTitle>
          <CardDescription>Manage your study task reminders here. Set alarms to stay disciplined.</CardDescription>
        </CardHeader>
        <CardContent>
          {reminders.length > 0 ? (
             <ul className="space-y-3">
              {reminders.map(reminder => (
                <li key={reminder.id} className={`flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow ${reminder.isActive ? 'bg-card/80' : 'bg-muted/50 opacity-70'}`}>
                  <div className="flex items-center space-x-3">
                     {reminder.isActive ? <AlarmClockCheck className="h-5 w-5 text-green-500 flex-shrink-0" /> : <AlarmClockOff className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                    <div>
                      <p className={`font-medium ${!reminder.isActive ? 'line-through' : ''}`}>{reminder.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {reminder.time} - {reminder.days.sort((a, b) => availableDays.indexOf(a) - availableDays.indexOf(b)).join(', ')}
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
