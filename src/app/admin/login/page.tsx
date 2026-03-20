'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useGoogleAuth } from '@/hooks/use-google-auth';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Logo } from '@/components/logo';

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
  const { signInWithGoogle, isSigningIn } = useGoogleAuth('admin');

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <Logo className="justify-center mb-8" large />
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Administrator Log In</CardTitle>
            <CardDescription>
              Please use your administrative Google account to proceed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="pt-4">
                <Button
                variant="outline"
                className="w-full gap-2"
                onClick={signInWithGoogle}
                disabled={isSigningIn}
                >
                {isSigningIn ? <Loader2 className="animate-spin mr-2" /> : <GoogleIcon className="h-5 w-5" />}
                {isSigningIn ? 'Verifying...' : 'Log In with Google'}
                </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground pt-6">
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
