'use server';

import { z } from 'zod';
import { adminCategorizeVisitReasons } from '@/ai/flows/admin-categorize-visit-reasons';

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
    return { role: 'user', email: email };
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
