'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { collection, serverTimestamp } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { colleges, visitReasons } from "@/lib/types";
import { useFirestore, addDocumentNonBlocking } from "@/firebase";

const formSchema = z.object({
  college: z.string({ required_error: "Please select your college." }),
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
};

export function VisitDetailsForm({ onSubmitSuccess, userId }: VisitDetailsFormProps) {
  const firestore = useFirestore();
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
    
    const visitLogCollection = collection(firestore, 'visit_logs');
    const reasonForVisit = data.reason === 'Other' ? data.otherReason : data.reason;

    addDocumentNonBlocking(visitLogCollection, {
        userId,
        college: data.college,
        reasonForVisit,
        entryTime: serverTimestamp(),
    });
    
    // The write is non-blocking, so we can immediately call success.
    onSubmitSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="college"
          render={({ field }) => (
            <FormItem>
              <FormLabel>College Affiliation</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your college" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {colleges.map(college => (
                    <SelectItem key={college} value={college}>{college}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
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
