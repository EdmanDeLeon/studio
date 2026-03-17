'use server';

import { z } from 'zod';
import { adminCategorizeVisitReasons } from '@/ai/flows/admin-categorize-visit-reasons';
import { mockUsers } from './data';

const loginSchema = z.object({
  email: z.string().email(),
});

export async function loginAction(prevState: any, formData: FormData) {
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid email format.',
    };
  }

  const { email } = validatedFields.data;
  const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

  const isAdminDomain = email.endsWith('@neu.edu.ph');
  const isUserDomain = email.endsWith('@neu.edu');

  if (!isAdminDomain && !isUserDomain) {
    return { status: 'error', message: 'Invalid institutional email.' };
  }

  if (user) {
    // User exists, proceed with login
    return { status: 'success', role: user.role, email: user.email };
  } else {
    // User does not exist, but has valid institutional email -> needs to sign up
    return { status: 'needs-signup', email: email };
  }
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
