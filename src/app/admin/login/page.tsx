'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore, useUser } from '@/firebase';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';

const EMAIL_STORAGE_KEY = 'admin-email-for-signin';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Start true to check for link on load
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { user: firebaseUser, isUserLoading } = useUser();

  useEffect(() => {
    // This effect handles the user returning from the email link
    const completeSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let storedEmail = window.localStorage.getItem(EMAIL_STORAGE_KEY);
        if (!storedEmail) {
          // This can happen if the user opens the link on a different browser.
          setError("Your sign-in link is valid, but we couldn't find the original email address. Please try signing in again from the beginning.");
          setIsLoading(false);
          return;
        }

        try {
          const result = await signInWithEmailLink(auth, storedEmail, window.location.href);
          window.localStorage.removeItem(EMAIL_STORAGE_KEY);

          // After sign in, we must check for admin role
          const userDocRef = doc(firestore, 'users', result.user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists() && userDocSnap.data()?.role === 'admin') {
            toast({ title: 'Sign-In Successful', description: 'Redirecting to dashboard...' });
            router.replace('/admin/dashboard'); // Use replace to prevent back button from going to login page
          } else {
            await auth.signOut();
            setError('This account does not have administrator privileges.');
            setIsLoading(false);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to sign in. The link may have expired or been used already.');
          setIsLoading(false);
        }
      } else {
        // Not a sign-in link, so just finish initial loading
        setIsLoading(false);
      }
    };

    if (auth && firestore && !isUserLoading) {
       // If a user is already logged in, redirect them away from login page
       if(firebaseUser) {
        router.replace('/admin/dashboard');
        return;
       }
       completeSignIn();
    }
  }, [auth, firestore, router, toast, isUserLoading, firebaseUser]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const actionCodeSettings = {
      url: window.location.href, // This will be the URL the user is redirected to
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // While checking for link or if user is already logged in
  if (isLoading) {
    return (
        <main className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </main>
    );
  }
  
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <Logo className="justify-center mb-8" large />
        <Card>
          {!emailSent ? (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Administrator Log In</CardTitle>
                <CardDescription>
                  Enter your administrative email to receive a secure sign-in link.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@neu.edu.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading || !email}>
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                    Send Sign-In Link
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Check Your Email</CardTitle>
                <CardDescription>
                  A secure sign-in link has been sent to <strong>{email}</strong>. Click the link in the email to complete your login.
                </CardDescription>
              </CardHeader>
               <CardContent>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </CardContent>
            </>
          )}
          <CardFooter className="flex flex-col gap-4 justify-center text-sm text-muted-foreground pt-6">
            <p>
              Not an administrator?{' '}
              <Link href="/login" className="underline text-primary hover:text-primary/80">
                Return to Visitor Log In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
