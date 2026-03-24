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
import { useGoogleAuth } from '@/hooks/use-google-auth';

const EMAIL_STORAGE_KEY = 'admin-email-for-signin';

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

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { user: firebaseUser, isUserLoading } = useUser();
  const { signInWithGoogle, isSigningIn: isGoogleSigningIn } = useGoogleAuth('admin');

  const isProcessing = isUserLoading || isLoading || isSubmitting || isGoogleSigningIn;

  useEffect(() => {
    const completeSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let storedEmail = window.localStorage.getItem(EMAIL_STORAGE_KEY);
        if (!storedEmail) {
          setError("Your sign-in link is valid, but we couldn't find the original email address. Please try signing in again from the beginning.");
          setIsLoading(false);
          return;
        }

        try {
          const result = await signInWithEmailLink(auth, storedEmail, window.location.href);
          window.localStorage.removeItem(EMAIL_STORAGE_KEY);

          const userDocRef = doc(firestore, 'users', result.user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists() && userDocSnap.data()?.role === 'admin') {
            toast({ title: 'Sign-In Successful', description: 'Redirecting to dashboard...' });
            router.replace('/admin/dashboard');
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
        setIsLoading(false);
      }
    };

    if (auth && firestore && !isUserLoading) {
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
    setIsSubmitting(true);

    const actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isUserLoading) {
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
                  Choose your preferred sign-in method.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={signInWithGoogle}
                    disabled={isProcessing}
                >
                    {isGoogleSigningIn ? <Loader2 className="animate-spin mr-2" /> : <GoogleIcon className="h-5 w-5" />}
                    Sign in with Google
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                        Or with a secure link
                        </span>
                    </div>
                </div>
                
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
                      disabled={isProcessing}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isProcessing || !email}>
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
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
