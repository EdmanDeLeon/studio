'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, FormEvent } from 'react';
import { KeyRound, Mail, LayoutDashboard, LogIn, Loader2 } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { mockUsers } from '@/lib/data';
import type { User } from '@/lib/types';

const USERS_STORAGE_KEY = 'neu-liblog-users';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.658-3.317-11.297-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.242,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { user: firebaseUser, isUserLoading: isFirebaseUserLoading } = useUser();
  
  const [appUsers, setAppUsers] = useState<User[]>([]);
  const [isAppUsersLoading, setIsAppUsersLoading] = useState(true);
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);
  const [showAdminChoice, setShowAdminChoice] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    setIsAppUsersLoading(true);
    try {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsers) {
        setAppUsers(JSON.parse(storedUsers));
      } else {
        setAppUsers(mockUsers);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mockUsers));
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      setAppUsers(mockUsers);
    } finally {
      setIsAppUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    // This effect handles the logic after a user has successfully signed in via Firebase
    if (isFirebaseUserLoading || isAppUsersLoading || isProcessingLogin || !firebaseUser || !firebaseUser.email) {
      return;
    }
    
    // Prevent this effect from running multiple times for the same login
    setIsProcessingLogin(true);

    const email = firebaseUser.email;
    const appUser = appUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    const isAdminDomain = email.endsWith('@neu.edu.ph');
    const isUserDomain = email.endsWith('@neu.edu');

    if (!isAdminDomain && !isUserDomain) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid institutional email. Please use a @neu.edu or @neu.edu.ph account.',
      });
      auth.signOut(); // Sign out the user with the invalid email
      setIsProcessingLogin(false);
      return;
    }

    if (appUser) {
      // User exists in our app's database
      if (appUser.role === 'admin') {
        toast({
          title: 'Admin login successful',
          description: 'Please choose how to proceed.',
        });
        setAdminEmail(email);
        setShowAdminChoice(true);
      } else {
        toast({
          title: 'Login successful!',
          description: 'Please provide your visit details.',
        });
        router.push(`/welcome?email=${encodeURIComponent(email)}`);
      }
    } else {
      // User does not exist, redirect to signup
      toast({
          title: 'Account Not Found',
          description: 'Please complete the sign up form to create your account.',
      });
      router.push(`/signup?email=${encodeURIComponent(email)}`);
    }

    // Do not reset isProcessingLogin here as we are navigating away.
    // It will be reset on component unmount or next mount.

  }, [firebaseUser, isFirebaseUserLoading, isAppUsersLoading, appUsers, router, toast, auth, isProcessingLogin]);


  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsProcessingLogin(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;

    const validatedFields = loginSchema.safeParse({ email });

    if (!validatedFields.success) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: validatedFields.error.flatten().fieldErrors.email?.[0] ?? 'Invalid email format.',
      });
      setIsProcessingLogin(false);
      return;
    }
    
    // For email form, we just check our local list and redirect. This doesn't create a real Firebase Auth session.
    const appUser = appUsers.find(u => u.email.toLowerCase() === validatedFields.data.email.toLowerCase());
    
    const isAdminDomain = validatedFields.data.email.endsWith('@neu.edu.ph');
    const isUserDomain = validatedFields.data.email.endsWith('@neu.edu');

    if (!isAdminDomain && !isUserDomain) {
      toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid institutional email.' });
      setIsProcessingLogin(false);
      return;
    }

    if (appUser) {
      if (appUser.role === 'admin') {
        setAdminEmail(appUser.email);
        setShowAdminChoice(true);
      } else {
        router.push(`/welcome?email=${encodeURIComponent(appUser.email)}`);
      }
    } else {
      router.push(`/signup?email=${encodeURIComponent(validatedFields.data.email)}`);
    }
  }

  const handleGoogleSignIn = async () => {
    if (!auth) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication service not ready.' });
      return;
    }
    
    setIsProcessingLogin(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: 'select_account'
    });
    try {
      await signInWithPopup(auth, provider);
      // The useEffect hook will handle the logic after successful login.
    } catch (error: any) {
      // Don't show toast for user-cancelled popups
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        toast({
            variant: 'destructive',
            title: 'Google Sign-In Failed',
            description: error.message || 'An unexpected error occurred.',
        });
      }
      setIsProcessingLogin(false); // Reset processing state only if sign-in fails
    }
  };

  const handleAdminChoice = (destination: 'dashboard' | 'visit') => {
    setShowAdminChoice(false);
    if (destination === 'dashboard') {
      router.push('/admin/dashboard');
    } else {
      router.push(`/welcome?email=${encodeURIComponent(adminEmail)}`);
    }
    // Don't sign out here, allow navigation
    setIsProcessingLogin(false);
  };

  const isLoading = isProcessingLogin || isAppUsersLoading || isFirebaseUserLoading;

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <Logo className="justify-center mb-8" large />
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Library Log In</CardTitle>
            <CardDescription>
              Enter using your institutional account
            </CardDescription>
          </CardHeader>
          <CardContent>
             <form
                onSubmit={handleEmailSubmit}
                className="space-y-4 pt-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Institutional Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="juan.delacruz@neu.edu"
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin mr-2" /> : <KeyRound className="mr-2" />}
                  {isProcessingLogin ? 'Logging In...' : (isAppUsersLoading || isFirebaseUserLoading ? 'Loading...' : 'Log In')}
                </Button>
              </form>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or log in with
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <GoogleIcon className="h-5 w-5" />}
              Google
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAdminChoice} onOpenChange={(open) => {
          if (!open) {
              setShowAdminChoice(false);
              setIsProcessingLogin(false);
              auth.signOut(); // Sign out if the dialog is closed without a choice
          }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Your Destination</DialogTitle>
            <DialogDescription>
              You've logged in as an administrator. How would you like to
              proceed?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
            <Button
              variant="outline"
              onClick={() => handleAdminChoice('visit')}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Log a Personal Visit
            </Button>
            <Button onClick={() => handleAdminChoice('dashboard')}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
