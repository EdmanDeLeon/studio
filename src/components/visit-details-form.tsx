'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { colleges, visitReasons } from "@/lib/types"

const formSchema = z.object({
  college: z.string({ required_error: "Please select your college." }),
  reason: z.string().min(10, { message: "Please provide a reason for your visit (min. 10 characters)." }),
});

type VisitDetailsFormProps = {
  onSubmit: () => void;
};

export function VisitDetailsForm({ onSubmit }: VisitDetailsFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    }
  });

  function handleFormSubmit(values: z.infer<typeof formSchema>) {
    console.log(values); // In a real app, you'd save this data
    onSubmit();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
              <FormControl>
                <Textarea placeholder="e.g., Research for thesis, group study for finals, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Submit</Button>
      </form>
    </Form>
  );
}
