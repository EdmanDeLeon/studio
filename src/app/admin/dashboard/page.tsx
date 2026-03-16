'use client';

import { useState, useMemo, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { BookCopy, CalendarClock, PieChart as PieChartIcon, UserCheck, Users } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockUsers, mockVisitLogs } from '@/lib/data';
import type { VisitLog, College } from '@/lib/types';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { AiCategorizerDialog } from '@/components/admin/ai-categorizer-dialog';

type TimeFrame = 'day' | 'week' | 'month';

const collegeChartConfig = {
  total: {
    label: 'Visits',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const reasonChartConfig = {
  visits: {
    label: "Visits",
  },
  "Study/Research": {
    label: "Study/Research",
    color: "hsl(var(--chart-1))",
  },
  "Borrow/Return Books": {
    label: "Borrow/Return Books",
    color: "hsl(var(--chart-2))",
  },
  "Computer/Internet Access": {
    label: "Computer/Internet Access",
    color: "hsl(var(--chart-3))",
  },
  "Printing/Scanning": {
    label: "Printing/Scanning",
    color: "hsl(var(--chart-4))",
  },
  "Quiet Study Area": {
    label: "Quiet Study Area",
    color: "hsl(var(--chart-5))",
  },
  "Group Study": {
    label: "Group Study",
    color: "hsl(var(--chart-1))",
    theme: {
        light: 'hsl(var(--chart-1) / 0.8)',
        dark: 'hsl(var(--chart-1) / 0.8)',
    }
  },
  "Event/Workshop": {
    label: "Event/Workshop",
    color: "hsl(var(--chart-2))",
    theme: {
        light: 'hsl(var(--chart-2) / 0.8)',
        dark: 'hsl(var(--chart-2) / 0.8)',
    }
  },
  Other: {
    label: "Other",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig;


export default function DashboardPage() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('day');
  const [filteredLogs, setFilteredLogs] = useState<VisitLog[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const now = new Date();
      let newLogs: VisitLog[];
      if (timeFrame === 'day') {
        newLogs = mockVisitLogs.filter(log => isWithinInterval(log.timestamp, { start: subDays(now, 1), end: now }));
      } else if (timeFrame === 'week') {
        const interval = { start: startOfWeek(now), end: endOfWeek(now) };
        newLogs = mockVisitLogs.filter(log => isWithinInterval(log.timestamp, interval));
      } else if (timeFrame === 'month') {
        const interval = { start: startOfMonth(now), end: endOfMonth(now) };
        newLogs = mockVisitLogs.filter(log => isWithinInterval(log.timestamp, interval));
      } else {
        newLogs = [];
      }
      setFilteredLogs(newLogs);
    }
  }, [timeFrame, isClient]);

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

  const visitsByReason = useMemo(() => {
    if (filteredLogs.length === 0) return [];
    const reasonCounts = filteredLogs.reduce((acc, log) => {
        const reason = typeof log.reason === 'string' ? log.reason : 'Other';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(reasonCounts)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total);
  }, [filteredLogs]);

  const topVisitReason = useMemo(() => {
      if (visitsByReason.length === 0) return { reason: 'N/A', count: 0 };
      const top = visitsByReason[0];
      return { reason: top.name, count: top.total };
  }, [visitsByReason]);

  const peakHour = useMemo(() => {
    if (filteredLogs.length === 0) return 'N/A';
    const hourCounts = filteredLogs.reduce((acc, log) => {
      const hour = format(log.timestamp, 'H'); // 24-hour format
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const peak = Object.entries(hourCounts).reduce(
      (peak, [hour, count]) => (count > peak.count ? { hour, count } : peak),
      { hour: '', count: 0 }
    );
    
    if (peak.hour) {
      const date = new Date();
      date.setHours(parseInt(peak.hour, 10));
      date.setMinutes(0);
      return format(date, 'p'); // Format to e.g., 3:00 PM
    }

    return 'N/A';
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
        <StatsCard title="Peak Hour" value={peakHour} icon={CalendarClock} subValue="Busiest time" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visits by College</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={collegeChartConfig} className="min-h-[300px] w-full">
                <BarChart data={visitsByCollege} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value.substring(0, 3)} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="size-5" />
              Visits by Purpose
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
                config={reasonChartConfig}
                className="mx-auto aspect-square max-h-[300px]"
            >
                <PieChart>
                <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                    data={visitsByReason}
                    dataKey="total"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                >
                    {visitsByReason.map((entry, index) => (
                        <Cell
                        key={`cell-${index}`}
                        fill={reasonChartConfig[entry.name as keyof typeof reasonChartConfig]?.color || 'hsl(var(--muted))'}
                        />
                    ))}
                </Pie>
                </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Visits</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentVisitsTable logs={filteredLogs.slice(0, 10)} />
        </CardContent>
      </Card>
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
