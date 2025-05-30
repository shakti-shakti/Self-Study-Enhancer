
"use client"; 

import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Palette, BellDot, CheckCircle, UploadCloud, KeyRound, Volume2, Loader2, UserCircle2 } from "lucide-react";
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
import Link from 'next/link';
import type { AuthError, PostgrestError } from '@supabase/supabase-js';

const AVATAR_STORAGE_BUCKET_NAME = 'user-uploads'; // Using hyphen

export default function ProfileSettingsPage() {
  const { user, supabaseUser, isLoading: authLoading, fetchAppUser } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
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
      setSelectedClass(user.class || 'none');
      setTargetYear(user.target_year || 'none');
      setAvatarPreview(user.avatar_url || null);
      
      const savedTheme = typeof window !== "undefined" ? localStorage.getItem('appTheme') : 'dark';
      if (savedTheme) setTheme(savedTheme); else setTheme('dark');
      
      const savedNotifications = typeof window !== "undefined" ? localStorage.getItem('appNotifications') : 'true';
      if (savedNotifications) setNotifications(savedNotifications === 'true'); else setNotifications(true);

      const savedAlarmTone = typeof window !== "undefined" ? localStorage.getItem('appAlarmToneName') : null;
      if (savedAlarmTone) setAlarmToneName(savedAlarmTone);
    }
  }, [user]);

  const handleProfileSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !supabaseUser) {
      toast({ variant: "destructive", title: "Authentication Error", description: "User not authenticated. Please log in again." });
      return;
    }
    setIsSavingProfile(true);
    let finalAvatarUrl = user.avatar_url || undefined;
    let profileUpdateError: PostgrestError | null = null;
    let authMetaError: AuthError | null = null;

    try {
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const uniqueFileName = `avatar_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${supabaseUser.id}/${uniqueFileName}`; 

        if (user.avatar_url && user.avatar_url.includes(supabaseUser.id) && user.avatar_url.includes(AVATAR_STORAGE_BUCKET_NAME)) {
            const oldPathParts = user.avatar_url.split(`${AVATAR_STORAGE_BUCKET_NAME}/`);
            if (oldPathParts.length > 1) {
                const oldStoragePathWithPotentialQuery = oldPathParts[1];
                const oldStoragePath = oldStoragePathWithPotentialQuery.split('?')[0];
                if(oldStoragePath && oldStoragePath.startsWith('avatars/')){ 
                    try {
                        await supabase.storage.from(AVATAR_STORAGE_BUCKET_NAME).remove([oldStoragePath]);
                    } catch (removeError) {
                        console.warn("Could not remove old avatar, proceeding:", removeError);
                        logActivity("Profile Warning", "Could not remove old avatar during update.", { error: (removeError as Error).message, path: oldStoragePath }, supabaseUser.id);
                    }
                }
            }
        }
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(AVATAR_STORAGE_BUCKET_NAME) 
          .upload(filePath, avatarFile, { upsert: true, contentType: avatarFile.type }); 

        if (uploadError) throw new Error(`Avatar upload failed: ${uploadError.message}`);
        
        const { data: urlData } = supabase.storage.from(AVATAR_STORAGE_BUCKET_NAME).getPublicUrl(filePath);
        finalAvatarUrl = urlData.publicUrl;
        setAvatarFile(null); 
        setAvatarPreview(finalAvatarUrl); 
      }

      const profileUpdates: Partial<Omit<AppUser, 'id' | 'email'>> = { 
        name, 
        class: selectedClass === "none" ? null : selectedClass, 
        target_year: targetYear === "none" ? null : targetYear,
        avatar_url: finalAvatarUrl,
        updated_at: new Date().toISOString()
      };
      
      const { error: dbError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', supabaseUser.id);
      
      profileUpdateError = dbError;
      if (profileUpdateError) throw profileUpdateError;

      const metadataUpdates: { data: Record<string, any> } = { data: {} };
      if (profileUpdates.name !== user.name) metadataUpdates.data.name = profileUpdates.name;
      if (profileUpdates.avatar_url !== user.avatar_url) metadataUpdates.data.avatar_url = profileUpdates.avatar_url;

      if (Object.keys(metadataUpdates.data).length > 0) {
        const { error: metaErr } = await supabase.auth.updateUser(metadataUpdates);
        authMetaError = metaErr;
        if (authMetaError) {
            console.warn("Profile DB updated, but auth user_metadata update failed:", authMetaError);
        }
      }
      
      // Save UI preferences locally
      if (typeof window !== "undefined") {
        localStorage.setItem('appTheme', theme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme); // Simplified logic, assumes theme is 'light' or 'dark'
        
        localStorage.setItem('appNotifications', String(notifications));
        if (alarmToneName) localStorage.setItem('appAlarmToneName', alarmToneName);
      }

      toast({ title: "Profile Updated", description: "Your changes have been successfully saved.", action: <CheckCircle className="h-5 w-5 text-green-500" />, });
      logActivity("Profile Update", "User profile changes saved.", { updates: Object.keys(profileUpdates).filter(k => profileUpdates[k as keyof typeof profileUpdates] !== undefined) }, supabaseUser.id);
      
      if(fetchAppUser) await fetchAppUser(supabaseUser);

    } catch (err) {
      const castError = err as AuthError | PostgrestError | Error;
      toast({ variant: "destructive", title: "Update Failed", description: castError.message || "Could not save profile changes." });
      logActivity("Profile Update Error", "Failed to save profile changes.", { error: castError.message || String(err) }, supabaseUser.id);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoChangeClick = () => { fileInputRef.current?.click(); };
  const handleAlarmToneChangeClick = () => { alarmToneInputRef.current?.click(); };

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setAvatarFile(file); 
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string); 
      };
      reader.readAsDataURL(file);
      if (user) logActivity("Profile Photo Select", "New photo selected for preview.", { fileName: file.name }, user.id);
    } else if (file) {
      toast({variant: "destructive", title: "Invalid File", description: "Please select an image file for your avatar."});
    }
  };
  
  const handleAlarmToneSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAlarmToneName(file.name); 
      if (typeof window !== "undefined") localStorage.setItem('appAlarmToneName', file.name);
      toast({ title: "Alarm Tone Selected", description: `"${file.name}" selected. This is saved locally.`, });
      if(user) logActivity("Profile Alarm Tone Select", "New alarm tone file selected (mock).", { fileName: file.name }, user.id);
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
      logActivity("Profile Password Change", "Password change successful.", undefined, supabaseUser.id);
    } catch (err) {
      console.error("Password change error:", err);
      const castError = err as AuthError | Error;
      toast({ variant: "destructive", title: "Password Change Failed", description: castError.message || "An error occurred." });
      logActivity("Profile Password Error", "Password change failed.", { error: castError.message }, supabaseUser.id);
    } finally {
      setIsPasswordSaving(false);
    }
  };

   if (authLoading || (!user && !authLoading && !supabaseUser)) { 
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
  if (!user && !supabaseUser && !authLoading) { 
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Settings className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">Please log in to view and edit your profile.</p>
        <Link href="/login" passHref>
          <Button>Log In</Button>
        </Link>
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
                <AvatarImage src={avatarPreview || `https://placehold.co/100x100.png?text=${(user?.name || supabaseUser?.email ||'U').charAt(0)}`} alt={user?.name || supabaseUser?.email || "User"} data-ai-hint="user avatar large" />
                <AvatarFallback>{(user?.name || supabaseUser?.email ||"U").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" accept="image/*"/>
              <Button type="button" variant="outline" onClick={handlePhotoChangeClick} disabled={isSavingProfile}> <UploadCloud className="mr-2 h-4 w-4"/> Change Photo </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div> <Label htmlFor="name">Full Name</Label> <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" disabled={isSavingProfile} /> </div>
              <div> <Label htmlFor="email">Email Address</Label> <Input id="email" type="email" value={email || supabaseUser?.email || ''} readOnly disabled placeholder="your@email.com" /> </div>
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
        <CardHeader> <CardTitle>App Preferences</CardTitle> <CardDescription>Customize your app experience. Theme and notification preferences are saved locally to your browser when you "Save Personal Info". Alarm tone selection is for UI demonstration.</CardDescription> </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <div className="space-y-0.5"> <Label htmlFor="theme-select" className="text-base flex items-center"><Palette className="mr-2 h-5 w-5 text-muted-foreground"/>App Theme</Label> <p className="text-sm text-muted-foreground">Choose your preferred app appearance.</p> </div>
            <Select value={theme} onValueChange={(newTheme) => { setTheme(newTheme); }} disabled={isSavingProfile}> <SelectTrigger id="theme-select" className="w-[180px]"> <SelectValue placeholder="Select Theme" /> </SelectTrigger> <SelectContent> <SelectItem value="light">Light</SelectItem> <SelectItem value="dark">Dark</SelectItem></SelectContent> </Select>
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
          <p className="text-xs text-muted-foreground ml-auto">App preferences are saved locally when you click "Save Personal Info".</p>
        </CardFooter>
      </Card>

      <Card className="shadow-lg">
        <CardHeader><CardTitle>Security</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h3 className="text-lg font-medium flex items-center"><KeyRound className="mr-2 h-5 w-5 text-muted-foreground"/>Change Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div> <Label htmlFor="new-password">New Password</Label> <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min. 6 chars)" disabled={isPasswordSaving}/> </div>
              <div> <Label htmlFor="confirm-new-password">Confirm New Password</Label <Input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm new password" disabled={isPasswordSaving}/> </div>
            </div>
            <Button type="submit" variant="outline" disabled={isPasswordSaving || !newPassword || newPassword.length < 6 || newPassword !== confirmNewPassword}> {isPasswordSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <KeyRound className="mr-2 h-4 w-4"/>} Update Password </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

    