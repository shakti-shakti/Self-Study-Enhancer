
"use client"; 

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Edit3, Palette, BellDot, CheckCircle, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, type AppUser } from '@/hooks/use-auth'; // Import AppUser type
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { logActivity } from '@/lib/activity-logger';
// Note: Firebase storage for avatar upload is not implemented in this step.
// Avatar preview will be a local data URL until persisted.

export default function ProfileSettingsPage() {
  const { user, isLoading: authLoading, updateUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Email is usually not changed by user directly, but good to display
  const [selectedClass, setSelectedClass] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [theme, setTheme] = useState('dark'); // Default to dark as per new theme
  const [notifications, setNotifications] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setSelectedClass(user.class || '');
      setTargetYear(user.targetYear || '');
      setAvatarPreview(user.avatarUrl || null);
      
      const savedTheme = localStorage.getItem('appTheme');
      if (savedTheme) setTheme(savedTheme); else setTheme('dark'); // Default to dark
      
      const savedNotifications = localStorage.getItem('appNotifications');
      if (savedNotifications) setNotifications(savedNotifications === 'true');
    }
  }, [user]);

  if (authLoading && !user) { // Show skeleton only during initial load
    return (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Card className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full" /></div>
                <div><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full" /></div>
                <div><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full" /></div>
                <div><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
           <div className="flex justify-end"><Skeleton className="h-10 w-28" /></div>
        </div>
    );
  }


  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "User not authenticated." });
      return;
    }
    setIsSaving(true);
    try {
      const profileUpdates: Partial<AppUser> = {
        name,
        // email is not updated here, usually a separate verification process
        class: selectedClass,
        targetYear,
        // avatarUrl would be updated if file upload to Firebase Storage was implemented
        // For now, avatarPreview is just local. If avatarUrl was fetched from Firebase Storage,
        // this would be the place to save the new URL.
        // avatarUrl: avatarPreview || user.avatarUrl 
      };

      await updateUserProfile(profileUpdates);

      localStorage.setItem('appTheme', theme);
      // Potentially save theme to user preferences in Firestore too if desired
      localStorage.setItem('appNotifications', String(notifications));
      // Potentially save notification pref to Firestore

      toast({
        title: "Profile Updated",
        description: "Your changes have been saved.",
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      logActivity("Profile Update", "User profile changes saved.", { updates: Object.keys(profileUpdates) });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err instanceof Error ? err.message : "Could not save profile changes.",
      });
       logActivity("Profile Update Error", "Failed to save profile changes.", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChangeClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you'd upload this file to Firebase Storage and get a URL.
      // For now, we just set a local preview.
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
         toast({
          title: "Photo Selected",
          description: `${file.name} preview updated. Save changes to persist (mock).`,
        });
        logActivity("Profile Photo", "New photo selected for preview.", { fileName: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSaveChanges} className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your profile details and preferences. Email cannot be changed here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarPreview || `https://placehold.co/100x100.png?text=${(user?.name || 'U').charAt(0)}`} alt={user?.name || "User"} data-ai-hint="user avatar large" />
              <AvatarFallback>{(user?.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelected} 
              className="hidden" 
              accept="image/*"
            />
            <Button type="button" variant="outline" onClick={handlePhotoChangeClick}>
              <UploadCloud className="mr-2 h-4 w-4"/>
              Change Photo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} readOnly disabled placeholder="your@email.com" />
            </div>
            <div>
              <Label htmlFor="class-select">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="Select Your Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="11">Class 11</SelectItem>
                  <SelectItem value="12">Class 12</SelectItem>
                  <SelectItem value="dropper">Dropper</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="target-year">Target NEET Year</Label>
              <Select value={targetYear} onValueChange={setTargetYear}>
                <SelectTrigger id="target-year">
                  <SelectValue placeholder="Select Target Year" />
                </SelectTrigger>
                <SelectContent>
                  {[new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear() + 2, new Date().getFullYear() + 3].map(year => (
                    <SelectItem key={year} value={String(year)}>{String(year)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your app experience. These settings are saved locally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <div className="space-y-0.5">
                <Label htmlFor="theme-select" className="text-base flex items-center"><Palette className="mr-2 h-5 w-5 text-muted-foreground"/>App Theme</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred app appearance.</p>
            </div>
            <Select value={theme} onValueChange={(newTheme) => {
                setTheme(newTheme);
                // Apply theme immediately to documentElement for instant feedback
                if (typeof window !== "undefined") {
                    document.documentElement.classList.remove('light', 'dark');
                    if (newTheme === 'system') {
                        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                        document.documentElement.classList.add(systemTheme);
                    } else {
                        document.documentElement.classList.add(newTheme);
                    }
                }
            }}>
              <SelectTrigger id="theme-select" className="w-[180px]">
                <SelectValue placeholder="Select Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System Default</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
             <div className="space-y-0.5">
                <Label htmlFor="notifications-switch" className="text-base flex items-center"><BellDot className="mr-2 h-5 w-5 text-muted-foreground"/>Notifications</Label>
                <p className="text-sm text-muted-foreground">Enable or disable task and app notifications.</p>
            </div>
            <Switch id="notifications-switch" checked={notifications} onCheckedChange={setNotifications} />
          </div>
          
          {/* Placeholder sections for future preference settings */}
          <div className="p-4 border rounded-lg hover:shadow-sm transition-shadow opacity-50">
            <h4 className="font-medium mb-1">Question Preferences (Coming Soon)</h4>
            <p className="text-sm text-muted-foreground">Customize default difficulty, subjects etc.</p>
             <div className="mt-2 space-y-2">
                <Select disabled>
                    <SelectTrigger><SelectValue placeholder="Default Difficulty (e.g. Medium)"/></SelectTrigger>
                    <SelectContent><SelectItem value="easy">Easy</SelectItem></SelectContent>
                </Select>
             </div>
          </div>
           <div className="p-4 border rounded-lg hover:shadow-sm transition-shadow opacity-50">
            <h4 className="font-medium mb-1">Task Preferences (Coming Soon)</h4>
            <p className="text-sm text-muted-foreground">Set default reminder times, task categories etc.</p>
            <div className="mt-2 space-y-2">
                <Input type="time" defaultValue="09:00" disabled />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving || authLoading}>
          {isSaving ? <CheckCircle className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
