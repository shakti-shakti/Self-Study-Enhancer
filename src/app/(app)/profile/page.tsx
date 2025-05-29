
"use client"; 

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, User, Edit3, Palette, BellDot, CheckCircle, UploadCloud } from "lucide-react"; // Added UploadCloud
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/hooks/use-auth';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast'; // Import useToast

export default function ProfileSettingsPage() {
  const { user, isLoading: authLoading, login } = useAuth(); // Assuming login updates user info, or add an updateUser function to useAuth
  const { toast } = useToast(); // Initialize toast
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [theme, setTheme] = useState('light'); 
  const [notifications, setNotifications] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setSelectedClass(user.class || '');
      setTargetYear(user.targetYear || '');
      setAvatarPreview(user.avatarUrl || null);
      // Load theme and notifications from localStorage or user preferences if available
      const savedTheme = localStorage.getItem('appTheme');
      if (savedTheme) setTheme(savedTheme);
      const savedNotifications = localStorage.getItem('appNotifications');
      if (savedNotifications) setNotifications(savedNotifications === 'true');
    }
  }, [user]);

  if (authLoading) {
    return <div className="p-6">Loading profile...</div>;
  }

  const handleSaveChanges = async () => {
    // In a real app, you would send this data to your backend to persist.
    // For this mock, we'll update localStorage and the AuthContext user (if an updateUser function exists).
    console.log("Saving changes:", { name, email, selectedClass, targetYear, theme, notifications, avatarPreview });
    
    // Mock update:
    if (user) {
      const updatedUser = { 
        ...user, 
        name, 
        email, 
        class: selectedClass, 
        targetYear,
        avatarUrl: avatarPreview || user.avatarUrl // Keep existing if no new preview
      };
      // This is a mock, ideally useAuth would have an updateUser function
      localStorage.setItem('neetPrepProUser', JSON.stringify(updatedUser)); 
      // If useAuth.login re-fetches/updates user, you could call it, or better have a dedicated updateUser.
      // Forcing a reload or manually updating context is not ideal for real apps.
      // await login(email, 'mockpassword'); // This is a hacky way if login re-fetches
    }

    localStorage.setItem('appTheme', theme);
    localStorage.setItem('appNotifications', String(notifications));

    toast({
      title: "Profile Updated",
      description: "Your changes have been saved locally.",
      action: <CheckCircle className="h-5 w-5 text-green-500" />,
    });
  };

  const handlePhotoChangeClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
       toast({
        title: "Photo Selected",
        description: `${file.name} is ready to be uploaded. Save changes to apply.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your profile details and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarPreview || `https://placehold.co/100x100.png?text=${name.charAt(0)}`} alt={name} data-ai-hint="user avatar large" />
              <AvatarFallback>{name.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelected} 
              className="hidden" 
              accept="image/*"
            />
            <Button variant="outline" onClick={handlePhotoChangeClick}>
              <UploadCloud className="mr-2 h-4 w-4"/> {/* Changed icon */}
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
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
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
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <div className="space-y-0.5">
                <Label htmlFor="theme-select" className="text-base flex items-center"><Palette className="mr-2 h-5 w-5 text-muted-foreground"/>App Theme</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred app appearance.</p>
            </div>
            <Select value={theme} onValueChange={setTheme}>
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
          
          <div className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <h4 className="font-medium mb-1">Question Preferences</h4>
            <p className="text-sm text-muted-foreground">Customize default difficulty, subjects etc.</p>
             <div className="mt-2 space-y-2">
                <Select disabled>
                    <SelectTrigger><SelectValue placeholder="Default Difficulty (e.g. Medium)"/></SelectTrigger>
                    <SelectContent><SelectItem value="easy">Easy</SelectItem></SelectContent>
                </Select>
             </div>
          </div>
           <div className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <h4 className="font-medium mb-1">Task Preferences</h4>
            <p className="text-sm text-muted-foreground">Set default reminder times, task categories etc.</p>
            <div className="mt-2 space-y-2">
                <Input type="time" defaultValue="09:00" disabled />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSaveChanges}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
