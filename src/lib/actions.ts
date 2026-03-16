'use server';

import { z } from 'zod';
import { adminCategorizeVisitReasons } from '@/ai/flows/admin-categorize-visit-reasons';
import { addDoc, collection, serverTimestamp, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getSdks, initializeFirebase } from '@/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const loginSchema = z.object({
  email: z.string().email(),
});

export async function loginAction(prevState: any, formData: FormData) {
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid email format.',
    };
  }

  const { email } = validatedFields.data;

  // In a real app, you would look up the user in your database
  if (email.endsWith('@neu.edu.ph')) {
    return { role: 'admin' };
  }
  
  if (email.endsWith('@neu.edu')) {
    return { role: 'user' };
  }

  return { message: 'Invalid institutional email.' };
}

export async function categorizeReasonAction(reason: string) {
  try {
    const result = await adminCategorizeVisitReasons({ reason });
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to categorize reason.' };
  }
}

const visitDetailsSchema = z.object({
    college: z.string(),
    reasonForVisit: z.string(),
    userId: z.string(),
});

export async function submitVisitDetailsAction(prevState: any, formData: FormData) {
    const validatedFields = visitDetailsSchema.safeParse({
        college: formData.get('college'),
        reasonForVisit: formData.get('reason'),
        userId: formData.get('userId'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid data.',
        };
    }

    try {
        const { firestore } = initializeFirebase();
        const { userId, reasonForVisit, college } = validatedFields.data;

        await addDoc(collection(firestore, 'visit_logs'), {
            userId,
            reasonForVisit,
            college,
            entryTime: serverTimestamp(),
        });
        return { success: true, message: 'Visit logged successfully.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to log visit.' };
    }
}

const userFormSchema = z.object({
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    email: z.string().email("Invalid email address."),
    college: z.string(),
    role: z.enum(["user", "admin"]),
  });
  
  export async function addUserAction(data: z.infer<typeof userFormSchema>) {
    const validatedFields = userFormSchema.safeParse(data);
  
    if (!validatedFields.success) {
      return {
        success: false,
        message: "Invalid user data.",
      };
    }
  
    try {
      const { firestore } = initializeFirebase();
      const newDocRef = doc(collection(firestore, 'users'));
      
      const avatarPlaceholders = PlaceHolderImages.filter(img => img.id.startsWith('avatar-'));
      // Use a deterministic way to pick an avatar to avoid Math.random() on server
      const avatarIndex = (newDocRef.id.charCodeAt(0) || 0) % avatarPlaceholders.length;
      const randomAvatar = avatarPlaceholders[avatarIndex].imageUrl;
  
      await setDoc(newDocRef, {
        ...validatedFields.data,
        id: newDocRef.id,
        isBlocked: false,
        avatarUrl: randomAvatar,
      });
  
      return { success: true };
    } catch (error) {
      console.error("Error adding user:", error);
      return { success: false, message: "A server error occurred." };
    }
  }
  
  export async function updateUserAction(userId: string, data: z.infer<typeof userFormSchema>) {
    const validatedFields = userFormSchema.safeParse(data);
  
    if (!validatedFields.success) {
      return {
        success: false,
        message: "Invalid user data.",
      };
    }
  
    try {
      const { firestore } = initializeFirebase();
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, validatedFields.data);
  
      return { success: true };
    } catch (error) {
      console.error("Error updating user:", error);
      return { success: false, message: "A server error occurred." };
    }
  }

  export async function deleteUserAction(userId: string) {
    try {
        const { firestore } = initializeFirebase();
        const userRef = doc(firestore, 'users', userId);
        await deleteDoc(userRef);

        return { success: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { success: false, message: "A server error occurred." };
    }
  }
