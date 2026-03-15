'use client';

import { useState, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { BookCopy, CalendarClock, Clock, UserCheck, Users } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { mockUsers, mockVisitLogs } from '@/lib/data';
import type { VisitLog, College } from '@/lib/types';
import { ChartTooltipContent } from '@/components/ui/chart';
import { AiCategorizerDialog } from '@/components/admin/ai-categorizer-dialog';

type TimeFrame = 'day' | 'week' | 'month';

export default function DashboardPage() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('day');

  const filteredLogs = useMemo(() => {
    const now = new Date();
    if (timeFrame === 'day') {
      const yesterday = subDays(now, 1);
      return mockVisitLogs.filter(log => log.timestamp > yesterday);
    }
    if (timeFrame === 'week') {
      const interval = { start: startOfWeek(now), end: endOfWeek(now) };
      return mockVisitLogs.filter(log => isWithinInterval(log.timestamp, interval));
    }
    if (timeFrame === 'month') {
      const interval = { start: startOfMonth(now), end: endOfMonth(now) };
      return mockVisitLogs.filter(log => isWithinInterval(log.timestamp, interval));
    }
    return [];
  }, [timeFrame]);

  const totalVisits = filteredLogs.length;
  const uniqueVisitors = new Set(filteredLogs.map(log => log.userId)).size;

  const visitsByCollege = useMemo(() => {
    const counts = filteredLogs.reduce((acc, log) => {
      const user = mockUsers.find(u => u.id === log.userId);
      if (user) {
        acc[user.college] = (acc[user.college] || 0) + 1;
      }
      return acc;
    }, {} as Record<College, number>);

    return Object.entries(counts)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredLogs]);

  const topVisitReason = useMemo(() => {
    if (filteredLogs.length === 0) return { reason: 'N/A', count: 0 };
    const reasonCounts = filteredLogs.reduce((acc, log) => {
        const reason = typeof log.reason === 'string' ? log.reason : 'Other';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(reasonCounts).reduce((top, [reason, count]) => 
        count > top.count ? { reason, count } : top, { reason: '', count: 0 });
  }, [filteredLogs]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Real-time overview of library usage statistics.</p>
        </div>
        <div className="flex items-center gap-2">
            <AiCategorizerDialog />
        </div>
      </div>
      
      <Tabs defaultValue="day" onValueChange={(value) => setTimeFrame(value as TimeFrame)}>
        <TabsList>
          <TabsTrigger value="day">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>
        <TabsContent value="day" />
        <TabsContent value="week" />
        <TabsContent value="month" />
      </Tabs>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Visits" value={totalVisits} icon={Users} />
        <StatsCard title="Unique Visitors" value={uniqueVisitors} icon={UserCheck} />
        <StatsCard title="Top Reason" value={topVisitReason.reason} icon={BookCopy} subValue={`${topVisitReason.count} visits`} />
        <StatsCard title="Peak Hour" value="3:00 PM" icon={CalendarClock} subValue="Busiest time" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Visits by College</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={visitsByCollege}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value.substring(0, 3)} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={<ChartTooltipContent />}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentVisitsTable logs={filteredLogs.slice(0, 5)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, subValue }: { title: string, value: string | number, icon: React.ElementType, subValue?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
      </CardContent>
    </Card>
  );
}

function RecentVisitsTable({ logs }: { logs: VisitLog[] }) {
    const usersById = useMemo(() => new Map(mockUsers.map(user => [user.id, user])), []);
  
    if (logs.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-8">No visits in this time frame.</p>
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Visitor</TableHead>
            <TableHead>Time In</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const user = usersById.get(log.userId);
            return (
              <TableRow key={log.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                      <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                      <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5">
                      <p className="font-medium">{user?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{user?.college || 'N/A'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-medium">{format(log.timestamp, 'p')}</div>
                  <div className="text-xs text-muted-foreground">{format(log.timestamp, 'MMM d')}</div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    );
  }
