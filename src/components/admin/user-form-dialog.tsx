'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/types";
import { colleges } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const userFormSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Invalid email address."),
  college: z.string({ required_error: "Please select a college." }),
  role: z.enum(["user", "admin"], { required_error: "Please select a role." }),
});

type UserFormData = z.infer<typeof userFormSchema>;

type UserFormDialogProps = {
  user?: User;
  users: User[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  onFormSubmit: (user: User) => void;
};

export function UserFormDialog({ user, users, open, onOpenChange, onFormSubmit }: UserFormDialogProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const isEditMode = !!user;

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      college: undefined,
      role: "user",
    },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        college: user.college,
        role: user.role,
      });
    } else if (!open) {
      form.reset();
    }
  }, [user, open, form]);

  const onSubmit = async (data: UserFormData) => {
    setIsPending(true);
    
    let submittedUser: User;

    if (isEditMode && user) {
        submittedUser = { ...user, ...data };
    } else {
        const currentYear = new Date().getFullYear();
        let maxIdNum = 0;
        if (users && users.length > 0) {
          for (const u of users) {
            if (u.qrCodeIdentifier && u.qrCodeIdentifier.includes('-')) {
              const numPart = parseInt(u.qrCodeIdentifier.split('-')[1], 10);
              if (!isNaN(numPart) && numPart > maxIdNum) {
                maxIdNum = numPart;
              }
            }
          }
        }
        const nextIdNum = maxIdNum + 1;
        const newQrCodeIdentifier = `${currentYear}-${String(nextIdNum).padStart(6, '0')}`;
        
        // simple hash for a unique-ish ID for mock data
        const newId = `mock-${Date.now()}-${Math.random()}`;
        const avatarPlaceholders = PlaceHolderImages.filter(img => img.id.startsWith('avatar-'));
        const avatarIndex = (newId.charCodeAt(5) || 0) % avatarPlaceholders.length;
        const randomAvatar = avatarPlaceholders[avatarIndex].imageUrl;

        submittedUser = {
            ...data,
            id: newId,
            qrCodeIdentifier: newQrCodeIdentifier,
            isBlocked: false,
            avatarUrl: randomAvatar,
        };
    }
    
    onFormSubmit(submittedUser);
    
    toast({
        title: `User ${isEditMode ? "Updated" : "Added"}`,
        description: `${data.firstName} ${data.lastName} has been successfully ${isEditMode ? "updated" : "added"}.`,
    });
    
    setIsPending(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details of the existing user." : "Fill in the details to add a new user to the system."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Dela Cruz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="juan.delacruz@neu.edu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEditMode && user ? (
                <FormItem>
                    <FormLabel>Student ID (QR/Tap)</FormLabel>
                    <FormControl>
                        <Input value={user.qrCodeIdentifier} disabled />
                    </FormControl>
                    <FormDescription>Student ID cannot be changed.</FormDescription>
                </FormItem>
            ) : (
              <FormItem>
                <FormLabel>Student ID (QR/Tap)</FormLabel>
                <FormControl>
                    <Input value="Will be auto-generated" disabled />
                </FormControl>
                <FormDescription>The Student ID is generated automatically for new users.</FormDescription>
              </FormItem>
            )}
            <FormField
              control={form.control}
              name="college"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>College</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a college" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colleges.map((college) => (
                        <SelectItem key={college} value={college}>
                          {college}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isEditMode ? "Save Changes" : "Create User"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
