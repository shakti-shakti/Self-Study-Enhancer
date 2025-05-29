
"use client"; 

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Edit3, Palette, BellDot, CheckCircle, UploadCloud, KeyRound, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, type AppUser } from '@/hooks/use-auth'; // Ensure AppUser is correctly typed for Supabase
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { logActivity } from '@/lib/activity-logger';
import { supabase } from '@/lib/supabaseClient'; // For password change and potential avatar upload

export default function ProfileSettingsPage() {
  const { user, supabaseUser, isLoading: authLoading, updateUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Email is usually not changed by user directly
  const [selectedClass, setSelectedClass] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [theme, setTheme] = useState('dark'); // UI theme, managed by localStorage
  const [notifications, setNotifications] = useState(true); // UI preference, managed by localStorage
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); // For UI preview
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // For actual upload
  const [isSaving, setIsSaving] = useState(false);
  
  const [alarmToneName, setAlarmToneName] = useState<string | null>(null); // Mocked
  // const [currentPassword, setCurrentPassword] = useState(''); // Not needed for Supabase password update from client if user is authenticated
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);
  const alarmToneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || ''); // Comes from Supabase Auth
      setSelectedClass(user.class || '');
      setTargetYear(user.target_year || '');
      setAvatarPreview(user.avatar_url || null);
      
      const savedTheme = localStorage.getItem('appTheme');
      if (savedTheme) setTheme(savedTheme); else setTheme('dark');
      
      const savedNotifications = localStorage.getItem('appNotifications');
      if (savedNotifications) setNotifications(savedNotifications === 'true');

      const savedAlarmTone = localStorage.getItem('appAlarmToneName'); // Mocked
      if (savedAlarmTone) setAlarmToneName(savedAlarmTone);
    }
  }, [user]);


  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !supabaseUser) {
      toast({ variant: "destructive", title: "Error", description: "User not authenticated." });
      return;
    }
    setIsSaving(true);
    try {
      let newAvatarUrl = user.avatar_url; // Keep existing if no new file

      if (avatarFile) {
        // Upload new avatar to Supabase Storage
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${supabaseUser.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars') // Ensure you have a bucket named 'avatars'
          .upload(filePath, avatarFile);

        if (uploadError) {
          throw new Error(`Avatar upload failed: ${uploadError.message}`);
        }
        
        // Get public URL for the new avatar
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        newAvatarUrl = urlData.publicUrl;
        setAvatarFile(null); // Clear file after upload
      }

      const profileUpdates: Partial<Omit<AppUser, 'id' | 'email'>> = { 
        name, 
        class: selectedClass, 
        target_year: targetYear,
        avatar_url: newAvatarUrl 
      };
      
      await updateUserProfile(profileUpdates);
      
      localStorage.setItem('appTheme', theme);
      localStorage.setItem('appNotifications', String(notifications));
      if (alarmToneName) localStorage.setItem('appAlarmToneName', alarmToneName); // Mocked

      toast({ title: "Profile Updated", description: "Your changes have been saved.", action: <CheckCircle className="h-5 w-5 text-green-500" />, });
      logActivity("Profile Update", "User profile changes saved.", { updates: Object.keys(profileUpdates) });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed", description: err instanceof Error ? err.message : "Could not save profile changes.", });
       logActivity("Profile Update Error", "Failed to save profile changes.", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChangeClick = () => { fileInputRef.current?.click(); };
  const handleAlarmToneChangeClick = () => { alarmToneInputRef.current?.click(); };


  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file); // Store the file object for upload
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string); // Update UI preview
      };
      reader.readAsDataURL(file);
      toast({ title: "Photo Selected", description: `${file.name} preview updated. Save changes to upload.`, });
      logActivity("Profile Photo", "New photo selected for preview.", { fileName: file.name });
    }
  };
  
  const handleAlarmToneSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAlarmToneName(file.name);
      toast({ title: "Alarm Tone Selected (Mock)", description: `"${file.name}" selected. Save changes to confirm. Playback not implemented.`, });
      logActivity("Profile Alarm Tone", "New alarm tone file selected (mock).", { fileName: file.name });
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) {
      toast({ variant: "destructive", title: "Error", description: "New password and confirmation are required." });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ variant: "destructive", title: "Error", description: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "New password must be at least 6 characters long." });
      return;
    }
    if (!supabaseUser) {
       toast({ variant: "destructive", title: "Error", description: "Not signed in." });
       return;
    }
    
    setIsPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast({ title: "Password Changed", description: "Your password has been successfully updated.", duration: 5000 });
      // setCurrentPassword(''); // No longer needed
      setNewPassword('');
      setConfirmNewPassword('');
      logActivity("Profile Password", "Password change successful.");
    } catch (err) {
      console.error("Password change error:", err);
      toast({ variant: "destructive", title: "Password Change Failed", description: (err as Error).message || "An error occurred." });
      logActivity("Profile Password Error", "Password change failed.", { error: (err as Error).message });
    } finally {
      setIsPasswordSaving(false);
    }
  };

   if (authLoading && !user) {
    return (
        <div className="space-y-6">
          <div className="flex items-center space-x-3"> <Skeleton className="h-8 w-8 rounded-full" /> <Skeleton className="h-8 w-48" /> </div>
          <Card className="shadow-lg">
            <CardHeader> <Skeleton className="h-6 w-1/3 mb-2" /> <Skeleton className="h-4 w-2/3" /> </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4"> <Skeleton className="h-20 w-20 rounded-full" /> <Skeleton className="h-10 w-32" /> </div>
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
            <CardContent className="space-y-6"> <Skeleton className="h-16 w-full" /> <Skeleton className="h-16 w-full" /> </CardContent>
          </Card>
           <div className="flex justify-end"><Skeleton className="h-10 w-28" /></div>
        </div>
    );
  }


  return (
    <form onSubmit={handleSaveChanges} className="space-y-6">
      <div className="flex items-center space-x-3"> <Settings className="h-8 w-8 text-primary" /> <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1> </div>
      
      <Card className="shadow-lg">
        <CardHeader> <CardTitle>Personal Information</CardTitle> <CardDescription>Update your profile details and preferences. Email cannot be changed here.</CardDescription> </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarPreview || `https://placehold.co/100x100.png?text=${(user?.name || 'U').charAt(0)}`} alt={user?.name || "User"} data-ai-hint="user avatar large" />
              <AvatarFallback>{(user?.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" accept="image/*"/>
            <Button type="button" variant="outline" onClick={handlePhotoChangeClick}> <UploadCloud className="mr-2 h-4 w-4"/> Change Photo </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div> <Label htmlFor="name">Full Name</Label> <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" /> </div>
            <div> <Label htmlFor="email">Email Address</Label> <Input id="email" type="email" value={email} readOnly disabled placeholder="your@email.com" /> </div>
            <div> <Label htmlFor="class-select">Class</Label> <Select value={selectedClass} onValueChange={setSelectedClass}> <SelectTrigger id="class-select"> <SelectValue placeholder="Select Your Class" /> </SelectTrigger> <SelectContent> <SelectItem value="11">Class 11</SelectItem> <SelectItem value="12">Class 12</SelectItem> <SelectItem value="dropper">Dropper</SelectItem> <SelectItem value="none">None</SelectItem></SelectContent> </Select> </div>
            <div> <Label htmlFor="target-year">Target NEET Year</Label> <Select value={targetYear} onValueChange={setTargetYear}> <SelectTrigger id="target-year"> <SelectValue placeholder="Select Target Year" /> </SelectTrigger> <SelectContent> {[new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear() + 2, new Date().getFullYear() + 3].map(year => ( <SelectItem key={year} value={String(year)}>{String(year)}</SelectItem> ))} <SelectItem value="none">None</SelectItem></SelectContent> </Select> </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader> <CardTitle>Preferences</CardTitle> <CardDescription>Customize your app experience. Theme and notification settings are saved locally.</CardDescription> </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <div className="space-y-0.5"> <Label htmlFor="theme-select" className="text-base flex items-center"><Palette className="mr-2 h-5 w-5 text-muted-foreground"/>App Theme</Label> <p className="text-sm text-muted-foreground">Choose your preferred app appearance.</p> </div>
            <Select value={theme} onValueChange={(newTheme) => { setTheme(newTheme); if (typeof window !== "undefined") { document.documentElement.classList.remove('light', 'dark'); if (newTheme === 'system') { const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; document.documentElement.classList.add(systemTheme); } else { document.documentElement.classList.add(newTheme); } } }}> <SelectTrigger id="theme-select" className="w-[180px]"> <SelectValue placeholder="Select Theme" /> </SelectTrigger> <SelectContent> <SelectItem value="light">Light</SelectItem> <SelectItem value="dark">Dark</SelectItem> <SelectItem value="system">System Default</SelectItem> </SelectContent> </Select>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
             <div className="space-y-0.5"> <Label htmlFor="notifications-switch" className="text-base flex items-center"><BellDot className="mr-2 h-5 w-5 text-muted-foreground"/>Notifications</Label> <p className="text-sm text-muted-foreground">Enable or disable task and app notifications (visual only).</p> </div>
            <Switch id="notifications-switch" checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <div className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5"> <Label className="text-base flex items-center"><Volume2 className="mr-2 h-5 w-5 text-muted-foreground"/>Alarm Tone</Label> <p className="text-sm text-muted-foreground">Select a tone for reminders (mock upload, no playback).</p> {alarmToneName && <p className="text-xs text-accent">Current: {alarmToneName}</p>} </div>
                <input type="file" ref={alarmToneInputRef} onChange={handleAlarmToneSelected} className="hidden" accept="audio/*"/>
                <Button type="button" variant="outline" size="sm" onClick={handleAlarmToneChangeClick}> <UploadCloud className="mr-2 h-4 w-4"/> Choose Tone</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader><CardTitle>Security</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4"> {/* Use a div instead of a nested form */}
            <h3 className="text-lg font-medium flex items-center"><KeyRound className="mr-2 h-5 w-5 text-muted-foreground"/>Change Password</h3>
            {/* Supabase doesn't require current password for client-side update if user is authenticated */}
            {/* <div className="grid gap-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
            </div> */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div> <Label htmlFor="new-password">New Password</Label> <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" /> </div>
              <div> <Label htmlFor="confirm-new-password">Confirm New Password</Label> <Input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm new password" /> </div>
            </div>
            <Button type="button" variant="outline" onClick={handleChangePassword} disabled={isPasswordSaving}> {isPasswordSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <KeyRound className="mr-2 h-4 w-4"/>} Change Password </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end"> <Button type="submit" disabled={isSaving || authLoading}> {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />} Save Profile Changes </Button> </div>
    </form>
  );
}
