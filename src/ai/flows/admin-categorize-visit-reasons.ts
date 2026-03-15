'use server';
/**
 * @fileOverview A Genkit flow for categorizing free-text library visit reasons.
 *
 * - adminCategorizeVisitReasons - A function that categorizes a given library visit reason.
 * - AdminCategorizeVisitReasonsInput - The input type for the adminCategorizeVisitReasons function.
 * - AdminCategorizeVisitReasonsOutput - The return type for the adminCategorizeVisitReasons function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdminCategorizeVisitReasonsInputSchema = z.object({
  reason: z.string().describe('The free-text reason for visiting the library.'),
});
export type AdminCategorizeVisitReasonsInput = z.infer<typeof AdminCategorizeVisitReasonsInputSchema>;

const AdminCategorizeVisitReasonsOutputSchema = z.object({
  categorizedReason: z
    .enum([
      'Study/Research',
      'Borrow/Return Books',
      'Computer/Internet Access',
      'Printing/Scanning',
      'Quiet Study Area',
      'Group Study',
      'Event/Workshop',
      'Librarian Assistance',
      'General Reading/Leisure',
      'Meeting/Collaboration',
      'Other',
    ])
    .describe('The standardized category for the library visit reason.'),
  explanation: z
    .string()
    .optional()
    .describe(
      'An optional explanation for why the reason was categorized as such.'
    ),
});
export type AdminCategorizeVisitReasonsOutput = z.infer<typeof AdminCategorizeVisitReasonsOutputSchema>;

const categorizeReasonPrompt = ai.definePrompt({
  name: 'categorizeLibraryVisitReason',
  input: {schema: AdminCategorizeVisitReasonsInputSchema},
  output: {schema: AdminCategorizeVisitReasonsOutputSchema},
  prompt: `You are an AI assistant specialized in categorizing library visit reasons.\nYour task is to analyze the user's free-text reason for visiting the library and assign it to one of the following standardized categories:\n\n- "Study/Research" (for academic work, research, thesis writing)\n- "Borrow/Return Books" (for checking out or returning physical library materials)\n- "Computer/Internet Access" (for using library computers or Wi-Fi)\n- "Printing/Scanning" (for using library printers or scanners)\n- "Quiet Study Area" (for seeking a silent place to study)\n- "Group Study" (for collaborative work with peers)\n- "Event/Workshop" (for attending library-hosted events, workshops, or seminars)\n- "Librarian Assistance" (for seeking help from library staff, inquiries, consultations)\n- "General Reading/Leisure" (for casual reading, browsing, or relaxation)\n- "Meeting/Collaboration" (for formal or informal meetings not necessarily group study)\n- "Other" (if the reason does not clearly fit into any of the above categories)\n\nPlease categorize the following reason. If the reason is ambiguous or doesn't fit any category well, choose "Other".\n\nReason: {{{reason}}}`,
});

const adminCategorizeVisitReasonsFlow = ai.defineFlow(
  {
    name: 'adminCategorizeVisitReasons',
    inputSchema: AdminCategorizeVisitReasonsInputSchema,
    outputSchema: AdminCategorizeVisitReasonsOutputSchema,
  },
  async input => {
    const {output} = await categorizeReasonPrompt(input);
    return output!;
  }
);

export async function adminCategorizeVisitReasons(
  input: AdminCategorizeVisitReasonsInput
): Promise<AdminCategorizeVisitReasonsOutput> {
  return adminCategorizeVisitReasonsFlow(input);
}
