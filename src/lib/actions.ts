'use server';

import { adminCategorizeVisitReasons } from '@/ai/flows/admin-categorize-visit-reasons';

export async function categorizeReasonAction(reason: string) {
  try {
    const result = await adminCategorizeVisitReasons({ reason });
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to categorize reason.' };
  }
}
