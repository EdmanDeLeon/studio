'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";

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
import { useFirestore } from "@/firebase";

const userFormSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Invalid email address."),
  college: z.string({ required_error: "Please select a college." }),
  role: z.enum(["user", "admin"], { required_error: "Please select a role." }),
  qrCodeIdentifier: z.string().optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

type UserFormDialogProps = {
  user?: User;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  onFormSubmit: () => void;
};

export function UserFormDialog({ user, open, onOpenChange, onFormSubmit }: UserFormDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
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
      qrCodeIdentifier: "",
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
        qrCodeIdentifier: user.qrCodeIdentifier || "",
      });
    } else if (!open) {
      form.reset();
    }
  }, [user, open, form]);

  const onSubmit = async (data: UserFormData) => {
    setIsPending(true);
    
    try {
        if (isEditMode && user) {
            // Update existing user
            const userRef = doc(firestore, "users", user.id);
            await setDoc(userRef, data, { merge: true });
        } else {
            // Create new user. In a real app, this should only be done for users
            // authenticated via an admin-created process, not generic sign-up.
            // For now, we'll create a new ID, but this isn't secure for production.
            const newId = `manual-${Date.now()}`;
            const avatarPlaceholders = PlaceHolderImages.filter(img => img.id.startsWith('avatar-'));
            const avatarIndex = (newId.charCodeAt(0) || 0) % avatarPlaceholders.length;
            const randomAvatar = avatarPlaceholders[avatarIndex].imageUrl;
            
            const newUser: User = {
                ...data,
                id: newId,
                isBlocked: false,
                avatarUrl: randomAvatar,
            };
            const userRef = doc(firestore, "users", newId);
            await setDoc(userRef, newUser);
        }
        
        onFormSubmit();
        
        toast({
            title: `User ${isEditMode ? "Updated" : "Added"}`,
            description: `${data.firstName} ${data.lastName} has been successfully ${isEditMode ? "updated" : "added"}.`,
        });
        
        onOpenChange(false);
    } catch (error) {
         toast({
            title: `Error ${isEditMode ? "Updating" : "Adding"} User`,
            description: "An unexpected error occurred.",
            variant: "destructive"
        });
    } finally {
        setIsPending(false);
    }
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

            <FormField
              control={form.control}
              name="qrCodeIdentifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Number / QR Code ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 24-12963-847" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>
                    The student number used for QR code check-ins.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
