'use client';

import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useActionState } from 'react';
import { KeyRound, Mail, QrCode, LayoutDashboard, LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { loginAction } from '@/lib/actions';
import { Logo } from '@/components/logo';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Logging In...' : 'Log In'}
      <KeyRound className="ml-2" />
    </Button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [initialState, setInitialState] = useState<any>({});
  const [state, formAction] = useActionState(loginAction, initialState);
  const [showAdminChoice, setShowAdminChoice] = useState(false);

  useEffect(() => {
    if (state?.role === 'admin' && state.email) {
      toast({ title: 'Admin login successful', description: 'Please choose how to proceed.' });
      setShowAdminChoice(true);
    } else if (state?.role === 'user' && state.email) {
      toast({ title: 'Login successful!', description: 'Please provide your visit details.' });
      router.push(`/welcome?email=${encodeURIComponent(state.email)}`);
    } else if (state?.message) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: state.message,
      });
    }
  }, [state, router, toast]);

  const handleQrScan = () => {
    // Simulate a successful QR scan for a regular user
    toast({ title: 'QR Scan Successful!', description: 'Please provide your visit details.' });
    router.push('/welcome');
  };
  
  const handleAdminChoice = (destination: 'dashboard' | 'visit') => {
    setShowAdminChoice(false);
    if (destination === 'dashboard') {
        router.push('/admin/dashboard');
    } else {
        router.push(`/welcome?email=${encodeURIComponent(state.email)}`);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <Logo className="justify-center mb-6" />
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Library Log In</CardTitle>
            <CardDescription>Enter using your institutional account or QR code</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email"><Mail className="mr-2" /> Email</TabsTrigger>
                <TabsTrigger value="qr"><QrCode className="mr-2" /> QR Code ID</TabsTrigger>
              </TabsList>
              <TabsContent value="email">
                <form action={formAction} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Institutional Email</Label>
                    <Input id="email" name="email" type="email" placeholder="juan.delacruz@neu.edu" required />
                    {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
                  </div>
                  <SubmitButton />
                </form>
              </TabsContent>
              <TabsContent value="qr">
                <div className="flex flex-col items-center justify-center space-y-4 pt-4">
                  <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Position your QR code within the frame</p>
                  <Button onClick={handleQrScan} className="w-full">
                    Simulate QR Scan
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAdminChoice} onOpenChange={setShowAdminChoice}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Choose Your Destination</DialogTitle>
                <DialogDescription>
                    You've logged in as an administrator. How would you like to proceed?
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
                <Button variant="outline" onClick={() => handleAdminChoice('visit')}>
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
