
"use client";

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activity-logger';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userClass, setUserClass] = useState(''); // Keep as empty string default
  const [targetYear, setTargetYear] = useState(''); // Keep as empty string default

  const { signup, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !email || !password || !confirmPassword) {
        setError("All fields are required.");
        return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }
    try {
      // Pass empty strings if "none" was selected, or actual values
      const classToSave = userClass === "none" ? "" : userClass;
      const yearToSave = targetYear === "none" ? "" : targetYear;

      await signup(email, name, password, classToSave, yearToSave);
      toast({
        title: "✅ Registration Successful!",
        description: (
          <div>
            <p className="font-semibold">Please check your email inbox (and spam folder) for a verification link from Supabase to activate your account.</p>
            <p className="mt-2 text-xs text-muted-foreground">You will be redirected shortly once your session is active.</p>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Note: If confirmation links go to `localhost:3000`, ensure your Supabase "Site URL" (Authentication &gt; URL Configuration) is set to `http://localhost:9002` (or your app's actual dev port).
            </p>
          </div>
        ),
        duration: 10000, // Keep toast visible for 10 seconds
      });
      logActivity("Auth", "User signed up successfully, verification email sent.", { email });
      // Redirection is handled by AuthProvider onAuthStateChange
      // router.push('/'); 
    } catch (err) {
      let errorMessage = "Failed to sign up. Please try again.";
       if (err instanceof Error) {
        if (err.message.includes("User already registered")) {
            errorMessage = "This email is already registered. Please try logging in.";
        } else if (err.message.includes("rate limit")) {
            errorMessage = "Too many signup attempts. Please try again later.";
        }
         else {
            errorMessage = err.message;
        }
      }
      setError(errorMessage);
      logActivity("Auth Error", "Signup failed.", { email, error: errorMessage });
      console.error(err);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1 text-center">
         <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>Enter your details to get started with NEET Prep Pro.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="class-select">Class (Optional)</Label>
            <Select value={userClass} onValueChange={setUserClass} disabled={isLoading}>
              <SelectTrigger id="class-select">
                <SelectValue placeholder="Select Your Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="11">Class 11</SelectItem>
                <SelectItem value="12">Class 12</SelectItem>
                <SelectItem value="dropper">Dropper</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="target-year">Target NEET Year (Optional)</Label>
            <Select value={targetYear} onValueChange={setTargetYear} disabled={isLoading}>
              <SelectTrigger id="target-year">
                <SelectValue placeholder="Select Target Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {[new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear() + 2, new Date().getFullYear() + 3].map(year => (
                  <SelectItem key={year} value={String(year)}>{String(year)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full mt-2" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign Up
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
