'use client';

import { useState, useMemo, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDown, ArrowUp, BookCopy, CalendarClock, PieChart as PieChartIcon, UserCheck, Users } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { collection, collectionGroup, doc, Timestamp } from 'firebase/firestore';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { VisitLog, User, College } from '@/lib/types';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { AiCategorizerDialog } from '@/components/admin/ai-categorizer-dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';

type TimeFrame = 'day' | 'week' | 'month';
type SortKey = 'visitor' | 'reasonForVisit' | 'entryTime';
type SortDirection = 'asc' | 'desc';

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

const getDate = (time: Timestamp | Date) => {
    if (time instanceof Date) {
        return time;
    }
    return time.toDate();
}

export default function DashboardPage() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('day');
  const [filteredLogs, setFilteredLogs] = useState<VisitLog[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'entryTime', direction: 'desc' });
  const firestore = useFirestore();

  const visitLogsQuery = useMemoFirebase(() => collectionGroup(firestore, 'libraryVisits'), [firestore]);
  const { data: visitLogs, isLoading: isVisitsLoading } = useCollection<VisitLog>(visitLogsQuery);

  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  const isLoading = isVisitsLoading || isUsersLoading;

  const usersById = useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map(user => [user.id, user]));
  }, [users]);

  useEffect(() => {
    if (visitLogs) {
      const now = new Date();
      let interval;
      if (timeFrame === 'day') {
        const dayStart = new Date(now);
        dayStart.setHours(0,0,0,0);
        interval = { start: dayStart, end: now };
      } else if (timeFrame === 'week') {
        interval = { start: startOfWeek(now), end: endOfWeek(now) };
      } else { // month
        interval = { start: startOfMonth(now), end: endOfMonth(now) };
      }
      const newLogs = visitLogs.filter(log => log.entryTime && isWithinInterval(getDate(log.entryTime), interval));
      setFilteredLogs(newLogs);
    }
  }, [timeFrame, visitLogs]);

  const totalVisits = filteredLogs.length;
  const uniqueVisitors = new Set(filteredLogs.map(log => log.userId)).size;

  const visitsByCollege = useMemo(() => {
    const counts = filteredLogs.reduce((acc, log) => {
      const user = usersById.get(log.userId);
      const college = user?.college || 'Unknown College';
      if (college) {
        acc[college] = (acc[college] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredLogs, usersById]);

  const visitsByReason = useMemo(() => {
    if (filteredLogs.length === 0) return [];
    const reasonCounts = filteredLogs.reduce((acc, log) => {
        const reason = typeof log.reasonForVisit === 'string' && log.reasonForVisit.trim() !== '' ? log.reasonForVisit : 'Other';
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
      if (!log.entryTime) return acc;
      const hour = format(getDate(log.entryTime), 'H'); // 24-hour format
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

  const handleSort = (key: SortKey) => {
    setSortConfig(prevConfig => {
      const isAsc = prevConfig.key === key && prevConfig.direction === 'asc';
      return { key, direction: isAsc ? 'desc' : 'asc' };
    });
  };

  const sortedLogs = useMemo(() => {
    const sortableLogs = [...filteredLogs];
    sortableLogs.sort((a, b) => {
        if (sortConfig.key === 'entryTime') {
            const dateA = getDate(a.entryTime).getTime();
            const dateB = getDate(b.entryTime).getTime();
            if (dateA < dateB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (dateA > dateB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        }
        if (sortConfig.key === 'reasonForVisit') {
            const reasonA = String(a.reasonForVisit || '');
            const reasonB = String(b.reasonForVisit || '');
            if (reasonA < reasonB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (reasonA > reasonB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        }
        if (sortConfig.key === 'visitor') {
            const userA = usersById.get(a.userId);
            const userB = usersById.get(b.userId);
            const nameA = userA ? `${userA.firstName} ${userA.lastName}` : 'Unknown';
            const nameB = userB ? `${userB.firstName} ${userB.lastName}` : 'Unknown';
            return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }
        return 0;
    });
    return sortableLogs;
  }, [filteredLogs, sortConfig, usersById]);

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
      
      {isLoading ? <p>Loading statistics...</p> :
      <>
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
            <RecentVisitsTable 
              logs={sortedLogs.slice(0, 10)} 
              usersById={usersById}
              onSort={handleSort}
              sortConfig={sortConfig}
            />
          </CardContent>
        </Card>
      </>
      }
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

function RecentVisitsTable({ logs, usersById, onSort, sortConfig }: { 
  logs: VisitLog[], 
  usersById: Map<string, User>,
  onSort: (key: SortKey) => void,
  sortConfig: { key: SortKey, direction: SortDirection } 
}) {
    if (logs.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-8">No visits in this time frame.</p>
    }

    const renderSortIcon = (key: SortKey) => {
      if (sortConfig.key !== key) return null;
      if (sortConfig.direction === 'asc') {
        return <ArrowUp className="h-3 w-3" />;
      }
      return <ArrowDown className="h-3 w-3" />;
    };

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => onSort('visitor')}>
              <div className="flex items-center gap-1">
                Visitor
                {renderSortIcon('visitor')}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => onSort('reasonForVisit')}>
               <div className="flex items-center gap-1">
                Reason for Visit
                {renderSortIcon('reasonForVisit')}
              </div>
            </TableHead>
            <TableHead className="text-right cursor-pointer" onClick={() => onSort('entryTime')}>
               <div className="flex items-center justify-end gap-1">
                Time In
                {renderSortIcon('entryTime')}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const user = usersById.get(log.userId);
            const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown';
            const userCollege = user?.college || 'Unknown College';

            return (
              <TableRow key={log.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                      <AvatarImage src={user?.avatarUrl} alt={userName} />
                      <AvatarFallback>{user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5">
                      <p className="font-medium">{userName}</p>
                      <p className="text-xs text-muted-foreground">{userCollege}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{log.reasonForVisit}</TableCell>
                <TableCell className="text-right">
                    {log.entryTime && <>
                        <div className="font-medium">{format(getDate(log.entryTime), 'p')}</div>
                        <div className="text-xs text-muted-foreground">{format(getDate(log.entryTime), 'MMM d')}</div>
                    </>}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    );
  }

    