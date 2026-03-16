'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { visitReasons, type College } from "@/lib/types";

const formSchema = z.object({
  reason: z.string({ required_error: "Please select a reason for your visit." }),
  otherReason: z.string().optional(),
}).refine(data => {
    if (data.reason === 'Other') {
        return typeof data.otherReason === 'string' && data.otherReason.trim().length >= 10;
    }
    return true;
}, {
    message: "Please provide a specific reason (min. 10 characters).",
    path: ["otherReason"], 
});

type VisitDetailsFormData = z.infer<typeof formSchema>;

type VisitDetailsFormProps = {
  onSubmitSuccess: () => void;
  userId: string;
  userCollege: College;
};

export function VisitDetailsForm({ onSubmitSuccess, userId, userCollege }: VisitDetailsFormProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<VisitDetailsFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      otherReason: ""
    }
  });
  
  const reasonValue = form.watch("reason");

  const onSubmit = (data: VisitDetailsFormData) => {
    setIsPending(true);
    
    // This is a non-blocking mock submission.
    // In a real app, this would write to the database.
    console.log("Submitting visit log (mock):", {
      userId,
      college: userCollege,
      reasonForVisit: data.reason === 'Other' ? data.otherReason : data.reason,
      entryTime: new Date(),
    });
    
    // Immediately call success as we are not waiting for a database write.
    onSubmitSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Visit</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {visitReasons.map(reason => (
                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {reasonValue === 'Other' && (
            <FormField
                control={form.control}
                name="otherReason"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Please Specify</FormLabel>
                    <FormControl>
                        <Textarea placeholder="e.g., To use a specific software, attend a meeting, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}
        
        <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </Form>
  );
}
