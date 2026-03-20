'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { colleges } from '@/lib/types';
import { PlaceHolderImages } from "@/lib/placeholder-images";

const signupFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email(),
  college: z.string({ required_error: 'Please select your college.' }),
});

type SignupFormData = z.infer<typeof signupFormSchema>;

function SignupFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: firebaseUser, isUserLoading } = useUser();
  const [isPending, setIsPending] = useState(false);

  const emailFromParams = searchParams.get('email');
  const uidFromParams = searchParams.get('uid');

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: emailFromParams || '',
      college: undefined,
    },
  });
  
  useEffect(() => {
    // If we get user info from Firebase Auth, populate the form
    if (firebaseUser && !form.getValues('email')) {
      form.setValue('email', firebaseUser.email || '');
      const nameParts = firebaseUser.displayName?.split(' ') || [];
      form.setValue('firstName', nameParts[0] || '');
      form.setValue('lastName', nameParts.slice(1).join(' ') || '');
    } else if (emailFromParams) {
        form.setValue('email', emailFromParams);
    }
  }, [firebaseUser, emailFromParams, form]);


  const uid = firebaseUser?.uid || uidFromParams;

  if (!isUserLoading && !uid) {
    // If there is no user and no UID, we cannot proceed.
    toast({ title: 'Authentication Error', description: 'Please log in first to create an account.', variant: 'destructive'});
    if (typeof window !== 'undefined') {
        router.replace('/login');
    }
    return null;
  }

  const onSubmit = async (data: SignupFormData) => {
    if (!uid) {
        toast({ title: 'Error', description: 'User ID is missing. Cannot create account.', variant: 'destructive'});
        return;
    }
    setIsPending(true);

    const avatarPlaceholders = PlaceHolderImages.filter(img => img.id.startsWith('avatar-'));
    const avatarIndex = (uid.charCodeAt(0) || 0) % avatarPlaceholders.length;
    const randomAvatar = avatarPlaceholders[avatarIndex].imageUrl;

    const newUserProfile = {
        id: uid,
        ...data,
        role: 'user' as const,
        isBlocked: false,
        avatarUrl: randomAvatar,
    };

    try {
        await setDoc(doc(firestore, "userProfiles", uid), newUserProfile);
        toast({
            title: 'Account Created!',
            description: 'Your account has been successfully created. Please log your visit.',
        });
        router.push(`/welcome?uid=${uid}`);
    } catch (error) {
        toast({
            title: 'Error Creating Account',
            description: 'There was a problem saving your profile. Please try again.',
            variant: 'destructive',
        });
        setIsPending(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <Logo className="justify-center mb-8" large />
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>
              Complete the form below to finish setting up your library account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Dela Cruz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institutional Email</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="college"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College / Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your college" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colleges.map((college) => (
                            <SelectItem key={college} value={college}>
                              {college}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending || isUserLoading}>
                  {isPending || isUserLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Account & Log Visit
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignupFormComponent />
        </Suspense>
    );
}
