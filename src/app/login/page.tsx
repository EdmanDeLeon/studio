'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth, useUser, useFirestore } from '@/firebase';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';

const loginFormSchema = z.object({
    email: z.string().email('Please enter a valid email address.'),
});
type LoginFormInputs = z.infer<typeof loginFormSchema>;


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
  const firestore = useFirestore();
  const { user: firebaseUser, isUserLoading } = useUser();
  
  const [isSigningIn, setIsSigningIn] = useState(false);

  const form = useForm<LoginFormInputs>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '' },
  });

  const processLogin = useCallback(async (user: import('firebase/auth').User) => {
    setIsSigningIn(true);
    const { uid, email } = user;
    
    if (!email) {
      toast({ variant: 'destructive', title: 'Login Failed', description: 'Could not retrieve email from provider.' });
      setIsSigningIn(false);
      return;
    }
    
    const userDocRef = doc(firestore, 'userProfiles', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      if (userData.role === 'admin') {
        toast({
          title: 'Admin Account',
          description: 'Please use the separate administrator login page.',
        });
        await auth?.signOut();
      } else {
        // User exists and is not an admin, proceed to welcome page
        router.push(`/welcome?uid=${uid}`);
      }
    } else {
      // User does not exist, redirect to signup
      router.push(`/signup?uid=${uid}&email=${encodeURIComponent(email)}`);
    }

    setIsSigningIn(false);
  }, [firestore, router, toast, auth]);

  useEffect(() => {
    // This effect runs only when a new firebaseUser is detected.
    if (firebaseUser && !isSigningIn) {
      processLogin(firebaseUser);
    }
  }, [firebaseUser, processLogin, isSigningIn]);


  const handleGoogleSignIn = async () => {
    if (!auth) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication service not ready.' });
      return;
    }
    
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      // The useEffect hook will now handle the logic with the new user object.
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        toast({
            variant: 'destructive',
            title: 'Google Sign-In Failed',
            description: error.message || 'An unexpected error occurred.',
        });
      }
      setIsSigningIn(false);
    }
  };

  const onEmailSubmit = (data: LoginFormInputs) => {
    // This is a mock sign-in for email. In a real app, this would involve
    // sending a magic link or password authentication.
    // For this app, we'll just redirect to signup with email.
    toast({
        title: 'Check your email',
        description: 'For this demo, we will redirect you to the signup page. In a real app, you would receive a login link.',
    });
    router.push(`/signup?email=${encodeURIComponent(data.email)}`);
  };

  const isLoading = isSigningIn || isUserLoading;

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <Logo className="justify-center mb-8" large />
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Library Log In</CardTitle>
            <CardDescription>
              Sign in using your institutional account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onEmailSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="sr-only">Email</FormLabel>
                        <FormControl>
                            <Input placeholder="your.email@neu.edu" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Continue with Email
                    </Button>
                </form>
            </Form>
             <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
            </div>
            <div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                {isLoading && !form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <GoogleIcon className="h-5 w-5" />}
                Google
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground pt-6">
             <p>
              Are you an administrator?{' '}
              <Link href="/admin/login" className="underline text-primary hover:text-primary/80">
                Log in here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
