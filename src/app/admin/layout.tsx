'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Bell, Clock, LayoutDashboard, LogOut, Users } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import type { User } from '@/lib/types';
import { mockUsers } from '@/lib/data';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';

const menuItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
];

function RealTimeClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });

  return (
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <Clock className="h-4 w-4" />
      <span>{formattedTime}</span>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: firebaseUser, isUserLoading } = useUser();
  const auth = useAuth();
  const [appUser, setAppUser] = useState<User | null>(null);
  const [isAppUsersLoading, setIsAppUsersLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) return;

    const storedUsersString = localStorage.getItem('neu-liblog-users');
    const allUsers: User[] = storedUsersString ? JSON.parse(storedUsersString) : mockUsers;

    if (!firebaseUser) {
      // If not logged into Firebase and not on the login page, redirect to login
      if (pathname !== '/admin/login') {
        router.replace('/admin/login');
      }
      setIsAppUsersLoading(false);
      return;
    }

    // If there is a Firebase user, check their role in our app's user list
    const currentAppUser = allUsers.find(u => u.email.toLowerCase() === firebaseUser.email?.toLowerCase());

    if (currentAppUser?.role === 'admin') {
      setAppUser(currentAppUser);
      // If a logged-in admin lands on the login page, redirect them to the dashboard
      if (pathname === '/admin/login') {
        router.replace('/admin/dashboard');
      }
    } else {
      // If the user is not an admin or not in our list, sign them out and redirect
      auth?.signOut();
      setAppUser(null);
      if (pathname !== '/admin/login') {
        router.replace('/admin/login');
      }
    }
    setIsAppUsersLoading(false);

  }, [firebaseUser, isUserLoading, pathname, router, auth]);


  // If we are on the login path, just render the children (the login page itself).
  // The useEffect above will handle redirecting away if the user is already logged in.
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // For any other admin route, ensure user is authenticated and verified as an admin.
  // Show a loading state until verification is complete.
  if (isUserLoading || isAppUsersLoading || !appUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  const adminName = `${appUser.firstName} ${appUser.lastName}`;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3">
             <Avatar className="h-9 w-9">
                <AvatarImage src={appUser.avatarUrl} alt={adminName} />
                <AvatarFallback>{appUser.firstName.charAt(0)}{appUser.lastName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-sm group-data-[collapsible=icon]:hidden">
                <span className="font-semibold text-sidebar-foreground">{adminName}</span>
                <span className="text-xs text-sidebar-foreground/70">{appUser.email}</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
             {/* Can add breadcrumbs or page title here */}
          </div>
          <div className="flex items-center gap-4">
            <RealTimeClock />
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => auth?.signOut()}>
                <LogOut className="mr-2 h-4 w-4"/>
                Logout
            </Button>
            
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
