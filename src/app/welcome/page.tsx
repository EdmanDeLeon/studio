'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookHeart, CircleUserRound } from 'lucide-react';
import { doc } from 'firebase/firestore';

import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisitDetailsForm } from '@/components/visit-details-form';
import { Logo } from '@/components/logo';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@/lib/types';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';

function WelcomeComponent() {
  const [isFormOpen, setIsFormOpen] = useState(true);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();
  
  const uid = searchParams.get('uid');

  const userRef = useMemoFirebase(() => (uid ? doc(firestore, 'users', uid) : null), [firestore, uid]);
  const { data: user, isLoading: isUserLoading } = useDoc<User>(userRef);

  useEffect(() => {
    if (!isFormOpen) {
      // After form submission, isFormOpen becomes false.
      // We show the thank you message and then redirect.
      const timer = setTimeout(() => {
        router.push('/login');
      }, 5000); // 5 seconds

      // Clear the timeout if the component unmounts
      // to prevent memory leaks or navigation errors.
      return () => clearTimeout(timer);
    }
  }, [isFormOpen, router]);

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    toast({
      title: "Welcome to NEU Library!",
      description: "Your visit has been logged. You will be redirected shortly.",
      duration: 5000,
    });
  };

  if (!isUserLoading && !uid) {
    // If there's no uid in the query params and we're not loading, something is wrong. Redirect to login.
    if (typeof window !== 'undefined') {
        router.replace('/login');
    }
    return null; // Render nothing while redirecting
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-background">
      <Dialog open={isFormOpen} onOpenChange={(open) => {
          if (!open) router.push('/login'); // If user closes dialog, send them back to login
          setIsFormOpen(open);
        }}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
            {isUserLoading && (
                <>
                    <DialogHeader>
                        <DialogTitle>Verifying Account</DialogTitle>
                        <DialogDescription>
                            Please wait while we check your details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-4 pt-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                </>
            )}
            {!isUserLoading && user && (
                 <>
                    <DialogHeader>
                        <DialogTitle>Welcome, {user.firstName || 'Visitor'}!</DialogTitle>
                        <DialogDescription>
                        Please provide the following details for our records. Click submit when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <VisitDetailsForm onSubmitSuccess={handleFormSubmit} userId={user.id} />
                 </>
            )}
            {!isUserLoading && !user && uid && (
                <div className="flex flex-col items-center gap-4 text-center py-8">
                    <CircleUserRound className="w-12 h-12 text-destructive" />
                    <DialogHeader>
                        <DialogTitle>Login Error</DialogTitle>
                        <DialogDescription>
                            No user account found. Please try again or sign up.
                        </DialogDescription>
                    </DialogHeader>
                </div>
            )}
        </DialogContent>
      </Dialog>
      
      {!isFormOpen && (
        <div className="flex flex-col items-center gap-6 animate-in fade-in-50 duration-500">
          <Logo large />
          <div className="space-y-2">
            <h2 className="text-4xl font-bold tracking-tight text-primary">Thank You!</h2>
            <p className="text-muted-foreground max-w-md">
              Your visit has been successfully logged. Have a productive and pleasant time at the library.
            </p>
          </div>
          <BookHeart className="w-16 h-16 text-accent" />
        </div>
      )}
    </main>
  );
}

export default function WelcomePage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-background">
                <Dialog open={true}>
                    <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle>Loading...</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center space-x-4 pt-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        }>
            <WelcomeComponent />
        </Suspense>
    )
}

    