'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookHeart, CircleUserRound } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';

import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisitDetailsForm } from '@/components/visit-details-form';
import { Logo } from '@/components/logo';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@/lib/types';

function WelcomeComponent() {
  const [isFormOpen, setIsFormOpen] = useState(true);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const email = searchParams.get('email');
  const firestore = useFirestore();

  const userQuery = useMemoFirebase(() => {
    if (!email) return null;
    return query(collection(firestore, 'users'), where('email', '==', email));
  }, [firestore, email]);

  const { data: users, isLoading: isUserLoading } = useCollection<User>(userQuery);
  const user = users?.[0];

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    toast({
      title: "Welcome to NEU Library!",
      description: "Your visit has been logged. We wish you a productive time.",
      duration: 5000,
    });
  };

  if (!isUserLoading && !email) {
    // If there's no email in the query params and we're not loading, something is wrong. Redirect to login.
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
                    <VisitDetailsForm onSubmitSuccess={handleFormSubmit} userId={user.id} userCollege={user.college} />
                 </>
            )}
            {!isUserLoading && !user && email && (
                <div className="flex flex-col items-center gap-4 text-center py-8">
                    <CircleUserRound className="w-12 h-12 text-destructive" />
                    <DialogHeader>
                        <DialogTitle>Login Error</DialogTitle>
                        <DialogDescription>
                            No user account found for "{email}". Please try again or contact an administrator.
                        </DialogDescription>
                    </DialogHeader>
                </div>
            )}
        </DialogContent>
      </Dialog>
      
      {!isFormOpen && (
        <div className="flex flex-col items-center gap-6 animate-in fade-in-50 duration-500">
          <Logo />
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
