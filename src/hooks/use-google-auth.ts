'use client';

import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';

export function useGoogleAuth(role?: 'admin' | 'user') {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const signInWithGoogle = async () => {
    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication service not ready.' });
      return;
    }

    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: 'neu.edu.ph',
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Force token refresh so Firestore receives valid auth credentials
      await user.getIdToken(true);

      if (!user.email) {
        throw new Error("Email not available from Google Sign-In.");
      }

      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (role === 'admin') {
        if (userDocSnap.exists() && userDocSnap.data()?.role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else {
          await auth.signOut();
          throw new Error("This account does not have administrator privileges.");
        }
      } else {
        if (!userDocSnap.exists()) {
          window.location.href = `/signup?uid=${user.uid}&email=${encodeURIComponent(user.email)}`;
        } else {
          const userData = userDocSnap.data() as User;
          if (userData.role === 'admin') {
            toast({
              title: 'Admin Account',
              description: 'Please use the separate administrator login page.',
            });
            await auth.signOut();
            setIsSigningIn(false);
          } else {
            window.location.href = `/welcome?uid=${user.uid}`;
          }
        }
      }
    } catch (error: any) {
      setIsSigningIn(false);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          variant: 'destructive',
          title: 'Google Sign-In Failed',
          description: error.message || 'An unexpected error occurred.',
        });
        console.error(error);
      }
    }
  };

  return { signInWithGoogle, isSigningIn };
}