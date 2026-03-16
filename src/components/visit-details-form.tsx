'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFormState } from "react-hook-form"
import { z } from "zod"
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { colleges } from "@/lib/types"
import { submitVisitDetailsAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  college: z.string({ required_error: "Please select your college." }),
  reason: z.string().min(10, { message: "Please provide a reason for your visit (min. 10 characters)." }),
});

type VisitDetailsFormProps = {
  onSubmitSuccess: () => void;
  userId: string;
};

export function VisitDetailsForm({ onSubmitSuccess, userId }: VisitDetailsFormProps) {
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(submitVisitDetailsAction, null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    }
  });

  useEffect(() => {
    if (state?.success) {
        onSubmitSuccess();
    } else if (state?.message && !state.errors) {
        toast({
            variant: 'destructive',
            title: 'Submission Failed',
            description: state.message,
        });
    }
  }, [state, onSubmitSuccess, toast]);


  return (
    <Form {...form}>
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="userId" value={userId} />
        <FormField
          control={form.control}
          name="college"
          render={({ field }) => (
            <FormItem>
              <FormLabel>College Affiliation</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} name="college">
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
              <FormMessage>{state?.errors?.college?.[0]}</FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Visit</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Research for thesis, group study for finals, etc." {...field} name="reason" />
              </FormControl>
              <FormMessage>{state?.errors?.reasonForVisit?.[0]}</FormMessage>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </Form>
  );
}
