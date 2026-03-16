'use server';

import { z } from 'zod';
import { adminCategorizeVisitReasons } from '@/ai/flows/admin-categorize-visit-reasons';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

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
    college: z.string({ required_error: "Please select your college." }),
    reason: z.string({ required_error: "Please select a reason." }),
    otherReason: z.string().optional(),
    userId: z.string(),
}).refine(data => {
    if (data.reason === 'Other') {
        return data.otherReason && data.otherReason.trim().length >= 10;
    }
    return true;
}, {
    message: "Please specify your reason (min. 10 characters).",
    path: ['otherReason'],
});

export async function submitVisitDetailsAction(prevState: any, formData: FormData) {
    const validatedFields = visitDetailsSchema.safeParse({
        college: formData.get('college'),
        reason: formData.get('reason'),
        otherReason: formData.get('otherReason'),
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
        const { userId, college, reason, otherReason } = validatedFields.data;

        const reasonForVisit = reason === 'Other' ? otherReason : reason;

        await addDoc(collection(firestore, 'visit_logs'), {
            userId,
            reasonForVisit,
            college,
            entryTime: serverTimestamp(),
        });
        return { success: true, message: 'Visit logged successfully.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'A server error occured.' };
    }
}
