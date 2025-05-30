
"use client"; 

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Edit3, Palette, BellDot, CheckCircle, UploadCloud, KeyRound, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, type AppUser } from '@/hooks/use-auth';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { logActivity } from '@/lib/activity-logger';
import { supabase } from '@/lib/supabaseClient';

const AVATAR_STORAGE_BUCKET_NAME = 'user_uploads'; // Or 'avatars' if you have a dedicated bucket

export default function ProfileSettingsPage() {
  const { user, supabaseUser, isLoading: authLoading, updateUserProfile, fetchAppUser } = useAuth();
  const { toast } = useToast();
  
  // Form states, initialized when user data is available
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Email is usually not changed by user directly
  const [selectedClass, setSelectedClass] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // For actual upload
  
  // Preferences (managed by localStorage, but saved on profile save for UX consistency)
  const [theme, setTheme] = useState('dark'); 
  const [notifications, setNotifications] = useState(true);
  const [alarmToneName, setAlarmToneName] = useState<string | null>(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const alarmToneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setSelectedClass(user.class || 'none'); // Default to 'none' if null/undefined
      setTargetYear(user.target_year || 'none'); // Default to 'none' if null/undefined
      setAvatarPreview(user.avatar_url || null);
      
      // Load preferences from localStorage
      const savedTheme = localStorage.getItem('appTheme');
      if (savedTheme) setTheme(savedTheme); else setTheme('dark');
      
      const savedNotifications = localStorage.getItem('appNotifications');
      if (savedNotifications) setNotifications(savedNotifications === 'true'); else setNotifications(true);

      const savedAlarmTone = localStorage.getItem('appAlarmToneName');
      if (savedAlarmTone) setAlarmToneName(savedAlarmTone);
    }
  }, [user]);

  const handleProfileSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !supabaseUser) {
      toast({ variant: "destructive", title: "Error", description: "User not authenticated." });
      return;
    }
    setIsSavingProfile(true);
    let publicAvatarUrl = user.avatar_url || undefined; // Keep existing if no new file or if upload fails

    try {
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const uniqueFileName = `avatar_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${supabaseUser.id}/${uniqueFileName}`; // User-specific folder for avatars

        // Attempt to delete old avatar if one exists and is from our storage
        if (user.avatar_url && user.avatar_url.includes(supabaseUser.id)) { // Basic check
            const oldPathParts = user.avatar_url.split(`${AVATAR_STORAGE_BUCKET_NAME}/`);
            if (oldPathParts.length > 1) {
                const oldStoragePath = oldPathParts[1].split('?')[0]; // Remove query params if any
                if(oldStoragePath){
                    await supabase.storage.from(AVATAR_STORAGE_BUCKET_NAME).remove([oldStoragePath]);
                }
            }
        }
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(AVATAR_STORAGE_BUCKET_NAME) 
          .upload(filePath, avatarFile, { upsert: false }); 

        if (uploadError) {
          console.error('Avatar Upload Error:', uploadError);
          throw new Error(`Avatar upload failed: ${uploadError.message}`);
        }
        
        const { data: urlData } = supabase.storage.from(AVATAR_STORAGE_BUCKET_NAME).getPublicUrl(filePath);
        publicAvatarUrl = urlData.publicUrl;
        setAvatarFile(null); // Clear file after successful upload
        setAvatarPreview(publicAvatarUrl); // Update preview immediately
      }

      const profileUpdates: Partial<Omit<AppUser, 'id' | 'email'>> = { 
        name, 
        class: selectedClass === "none" ? null : selectedClass, 
        target_year: targetYear === "none" ? null : targetYear,
        avatar_url: publicAvatarUrl 
      };
      
      await updateUserProfile(profileUpdates); // This updates 'profiles' table and auth.user_metadata
      
      // Save theme to localStorage and apply it
      localStorage.setItem('appTheme', theme);
      document.documentElement.classList.remove('light', 'dark');
      if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.classList.add(systemTheme);
      } else {
          document.documentElement.classList.add(theme);
      }

      localStorage.setItem('appNotifications', String(notifications));
      if (alarmToneName) localStorage.setItem('appAlarmToneName', alarmToneName); // Still local for mock

      toast({ title: "Profile Updated", description: "Your changes have been saved to Supabase.", action: <CheckCircle className="h-5 w-5 text-green-500" />, });
      logActivity("Profile Update", "User profile changes saved.", { updates: Object.keys(profileUpdates).filter(k => profileUpdates[k as keyof typeof profileUpdates] !== undefined) });
      if (supabaseUser) await fetchAppUser(supabaseUser); // Re-fetch user to update context globally

    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed", description: err instanceof Error ? err.message : "Could not save profile changes.", });
       logActivity("Profile Update Error", "Failed to save profile changes.", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoChangeClick = () => { fileInputRef.current?.click(); };
  const handleAlarmToneChangeClick = () => { alarmToneInputRef.current?.click(); };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setAvatarFile(file); 
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string); 
      };
      reader.readAsDataURL(file);
      // toast({ title: "Photo Selected", description: `${file.name} preview updated. Click 'Save Personal Info' to upload.`, });
      logActivity("Profile Photo Select", "New photo selected for preview.", { fileName: file.name });
    } else if (file) {
      toast({variant: "destructive", title: "Invalid File", description: "Please select an image file for your avatar."});
    }
  };
  
  const handleAlarmToneSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAlarmToneName(file.name); 
      toast({ title: "Alarm Tone Selected (Mock)", description: `"${file.name}" selected. This is a UI mock; tone not saved/used for actual alarms.`, });
      logActivity("Profile Alarm Tone Select", "New alarm tone file selected (mock).", { fileName: file.name });
    } else if (file) {
       toast({variant: "destructive", title: "Invalid File", description: "Please select an audio file."});
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
      setNewPassword('');
      setConfirmNewPassword('');
      logActivity("Profile Password Change", "Password change successful.");
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
             <CardFooter><Skeleton className="h-10 w-28 ml-auto" /></CardFooter>
          </Card>
          <Card className="shadow-lg">
            <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
            <CardContent className="space-y-6"> <Skeleton className="h-16 w-full" /> <Skeleton className="h-16 w-full" /> </CardContent>
             <CardFooter><Skeleton className="h-10 w-36 ml-auto" /></CardFooter>
          </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3"> <Settings className="h-8 w-8 text-primary" /> <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1> </div>
      
      <form onSubmit={handleProfileSaveChanges}>
        <Card className="shadow-lg mb-6">
          <CardHeader> <CardTitle>Personal Information</CardTitle> <CardDescription>Update your profile details. Email cannot be changed here.</CardDescription> </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview || `https://placehold.co/100x100.png?text=${(user?.name || 'U').charAt(0)}`} alt={user?.name || "User"} data-ai-hint="user avatar large" />
                <AvatarFallback>{(user?.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" accept="image/*"/>
              <Button type="button" variant="outline" onClick={handlePhotoChangeClick} disabled={isSavingProfile}> <UploadCloud className="mr-2 h-4 w-4"/> Change Photo </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div> <Label htmlFor="name">Full Name</Label> <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" disabled={isSavingProfile} /> </div>
              <div> <Label htmlFor="email">Email Address</Label> <Input id="email" type="email" value={email} readOnly disabled placeholder="your@email.com" /> </div>
              <div> <Label htmlFor="class-select">Class</Label> <Select value={selectedClass || "none"} onValueChange={setSelectedClass} disabled={isSavingProfile}> <SelectTrigger id="class-select"> <SelectValue placeholder="Select Your Class" /> </SelectTrigger> <SelectContent> <SelectItem value="none">None</SelectItem> <SelectItem value="11">Class 11</SelectItem> <SelectItem value="12">Class 12</SelectItem> <SelectItem value="dropper">Dropper</SelectItem></SelectContent> </Select> </div>
              <div> <Label htmlFor="target-year">Target NEET Year</Label> <Select value={targetYear || "none"} onValueChange={setTargetYear} disabled={isSavingProfile}> <SelectTrigger id="target-year"> <SelectValue placeholder="Select Target Year" /> </SelectTrigger> <SelectContent> <SelectItem value="none">None</SelectItem> {[new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear() + 2, new Date().getFullYear() + 3].map(year => ( <SelectItem key={year} value={String(year)}>{String(year)}</SelectItem> ))} </SelectContent> </Select> </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="ml-auto" disabled={isSavingProfile || authLoading}> {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />} Save Personal Info </Button>
          </CardFooter>
        </Card>
      </form>

      <Card className="shadow-lg mb-6">
        <CardHeader> <CardTitle>App Preferences</CardTitle> <CardDescription>Customize your app experience. These settings are saved locally to your browser when you save your profile.</CardDescription> </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <div className="space-y-0.5"> <Label htmlFor="theme-select" className="text-base flex items-center"><Palette className="mr-2 h-5 w-5 text-muted-foreground"/>App Theme</Label> <p className="text-sm text-muted-foreground">Choose your preferred app appearance.</p> </div>
            <Select value={theme} onValueChange={(newTheme) => { setTheme(newTheme); }} disabled={isSavingProfile}> <SelectTrigger id="theme-select" className="w-[180px]"> <SelectValue placeholder="Select Theme" /> </SelectTrigger> <SelectContent> <SelectItem value="light">Light</SelectItem> <SelectItem value="dark">Dark</SelectItem> <SelectItem value="system">System Default</SelectItem> </SelectContent> </Select>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
             <div className="space-y-0.5"> <Label htmlFor="notifications-switch" className="text-base flex items-center"><BellDot className="mr-2 h-5 w-5 text-muted-foreground"/>Notifications</Label> <p className="text-sm text-muted-foreground">Enable or disable task and app notifications (visual only).</p> </div>
            <Switch id="notifications-switch" checked={notifications} onCheckedChange={setNotifications} disabled={isSavingProfile}/>
          </div>
          <div className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5"> <Label className="text-base flex items-center"><Volume2 className="mr-2 h-5 w-5 text-muted-foreground"/>Alarm Tone</Label> <p className="text-sm text-muted-foreground">Select a tone for reminders (mock upload, no playback).</p> {alarmToneName && <p className="text-xs text-accent">Current: {alarmToneName}</p>} </div>
                <input type="file" ref={alarmToneInputRef} onChange={handleAlarmToneSelected} className="hidden" accept="audio/*"/>
                <Button type="button" variant="outline" size="sm" onClick={handleAlarmToneChangeClick} disabled={isSavingProfile}> <UploadCloud className="mr-2 h-4 w-4"/> Choose Tone</Button>
            </div>
          </div>
        </CardContent>
         <CardFooter>
          {/* The main form submission button will save these preferences as well */}
          <p className="text-xs text-muted-foreground ml-auto">App preferences are saved when you click "Save Personal Info".</p>
        </CardFooter>
      </Card>

      <Card className="shadow-lg">
        <CardHeader><CardTitle>Security</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h3 className="text-lg font-medium flex items-center"><KeyRound className="mr-2 h-5 w-5 text-muted-foreground"/>Change Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div> <Label htmlFor="new-password">New Password</Label> <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min. 6 chars)" disabled={isPasswordSaving}/> </div>
              <div> <Label htmlFor="confirm-new-password">Confirm New Password</Label> <Input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm new password" disabled={isPasswordSaving}/> </div>
            </div>
            <Button type="submit" variant="outline" disabled={isPasswordSaving || !newPassword || newPassword.length < 6 || newPassword !== confirmNewPassword}> {isPasswordSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <KeyRound className="mr-2 h-4 w-4"/>} Update Password </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
