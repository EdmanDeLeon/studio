'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { User, VisitLog } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
      if (!userId) return null;
      return doc(firestore, 'users', userId);
  }, [firestore, userId]);
  const { data: user, isLoading: isUserLoading } = useDoc<User>(userDocRef);

  const visitLogsQuery = useMemoFirebase(() => {
      if (!userId) return null;
      return query(
          collection(firestore, 'visit_logs'),
          where('userId', '==', userId),
          orderBy('entryTime', 'desc')
      );
  }, [firestore, userId]);
  const { data: visitLogs, isLoading: areLogsLoading } = useCollection<VisitLog>(visitLogsQuery);

  const isLoading = isUserLoading || areLogsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
        </Button>
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Visit Log History</h1>
            <p className="text-muted-foreground">Viewing all recorded visits for a specific user.</p>
        </div>
      </div>
      
      {isUserLoading ? (
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </CardHeader>
        </Card>
      ) : user ? (
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
              <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{user.firstName} {user.lastName}</CardTitle>
              <CardDescription className="text-base">{user.email} • {user.college}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
            <CardDescription>The user with the specified ID could not be found.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Visit History</CardTitle>
          <CardDescription>
            A total of {visitLogs?.length ?? 0} visits recorded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason for Visit</TableHead>
                <TableHead className="text-right">Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : visitLogs && visitLogs.length > 0 ? (
                visitLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.reasonForVisit}</TableCell>
                    <TableCell className="text-right">
                      {log.entryTime ? (
                        <>
                          <div>{format(log.entryTime.toDate(), 'MMMM d, yyyy')}</div>
                          <div className="text-sm text-muted-foreground">{format(log.entryTime.toDate(), 'p')}</div>
                        </>
                      ) : 'No timestamp'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    No visit history found for this user.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
