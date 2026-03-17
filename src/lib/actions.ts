'use server';

import { adminCategorizeVisitReasons } from '@/ai/flows/admin-categorize-visit-reasons';

// Login logic has been moved to the client-side in src/app/login/page.tsx
// to support dynamic user lists from localStorage.

export async function categorizeReasonAction(reason: string) {
  try {
    const result = await adminCategorizeVisitReasons({ reason });
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to categorize reason.' };
  }
}
