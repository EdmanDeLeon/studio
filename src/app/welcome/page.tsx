'use client';

import { useState } from 'react';
import { BookHeart } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisitDetailsForm } from '@/components/visit-details-form';
import { Logo } from '@/components/logo';

export default function WelcomePage() {
  const [isFormOpen, setIsFormOpen] = useState(true);
  const { toast } = useToast();

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    toast({
      title: "Welcome to NEU Library!",
      description: "Your visit has been logged. We wish you a productive time.",
      duration: 5000,
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-background">
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Visit Details</DialogTitle>
            <DialogDescription>
              Please provide the following details for our records. Click submit when you're done.
            </DialogDescription>
          </DialogHeader>
          <VisitDetailsForm onSubmit={handleFormSubmit} />
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
