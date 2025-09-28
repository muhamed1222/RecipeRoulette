import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Download } from "lucide-react";
import DashboardStats from "@/components/DashboardStats";
import ShiftCard from "@/components/ShiftCard";
import RecentActivity, { type ActivityItem } from "@/components/RecentActivity";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { ShiftStatus } from "@/components/StatusBadge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface DashboardStatsData {
  totalEmployees: number;
  activeShifts: number;
  completedShifts: number;
  exceptions: number;
  employeesDelta: number | null;
}

interface ShiftRow {
  id: string;
  status: string;
  planned_start_at: string;
  planned_end_at: string | null;
  employee: {
    id: string;
    full_name: string;
    position: string | null;
  };
  daily_report?: Array<{
    id: string;
    submitted_at: string | null;
    done_items: string[] | null;
  }>;
}

function mapStatus(status: string): ShiftStatus {
  switch (status) {
    case 'active':
    case 'done':
    case 'planned':
    case 'missed':
    case 'late':
      return status as ShiftStatus;
    default:
      return 'planned';
  }
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'HH:mm', { locale: ru });
  } catch (_error) {
    return '—';
  }
}

async function fetchAdminProfile(userId: string) {
  const { data, error } = await supabase
    .from('admin_user')
    .select('company_id, role')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function fetchDashboardStats(companyId: string): Promise<DashboardStatsData> {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const startDate = startOfDay.toISOString().split('T')[0];
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
  const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999).toISOString();

  const { data: employees, error: employeesError } = await supabase
    .from('employee')
    .select('id, created_at')
    .eq('company_id', companyId);

  if (employeesError) throw employeesError;

  const employeeIds = employees?.map((employee) => employee.id) ?? [];
  const totalEmployees = employeeIds.length;

  if (employeeIds.length === 0) {
    return {
      totalEmployees: 0,
      activeShifts: 0,
      completedShifts: 0,
      exceptions: 0,
      employeesDelta: null
    };
  }

  const currentMonthHires = employees?.filter((employee) => {
    const createdAt = employee.created_at ? new Date(employee.created_at).toISOString() : null;
    return createdAt && createdAt >= startOfMonth;
  }).length ?? 0;

  const previousMonthHires = employees?.filter((employee) => {
    const createdAt = employee.created_at ? new Date(employee.created_at).toISOString() : null;
    return createdAt && createdAt >= prevMonthStart && createdAt <= prevMonthEnd;
  }).length ?? 0;

  const employeesDelta = previousMonthHires === 0 && currentMonthHires === 0
    ? null
    : currentMonthHires - previousMonthHires;

  const [
    { count: activeCount, error: activeError },
    { count: completedCount, error: completedError },
    { count: exceptionCount, error: exceptionError }
  ] = await Promise.all([
    supabase
      .from('shift')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .in('employee_id', employeeIds),
    supabase
      .from('shift')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'done')
      .gte('planned_end_at', startOfDay.toISOString())
      .lte('planned_end_at', endOfDay.toISOString())
      .in('employee_id', employeeIds),
    supabase
      .from('exception')
      .select('id', { count: 'exact', head: true })
      .eq('date', startDate)
      .in('employee_id', employeeIds)
  ]);

  if (activeError) throw activeError;
  if (completedError) throw completedError;
  if (exceptionError) throw exceptionError;

  return {
    totalEmployees,
    activeShifts: activeCount ?? 0,
    completedShifts: completedCount ?? 0,
    exceptions: exceptionCount ?? 0,
    employeesDelta
  };
}

async function fetchActiveShifts(companyId: string): Promise<ShiftRow[]> {
  const { data, error } = await supabase
    .from('shift')
    .select(`
      id,
      status,
      planned_start_at,
      planned_end_at,
      employee:employee_id!inner (
        id,
        full_name,
        position,
        company_id
      ),
      daily_report (
        id,
        submitted_at,
        done_items
      )
    `)
    .eq('status', 'active')
    .eq('employee.company_id', companyId)
    .order('planned_start_at', { ascending: true })
    .limit(10);

  if (error) {
    throw error;
  }

  return data as ShiftRow[];
}

async function fetchRecentActivity(companyId: string, userId: string | undefined) {
  const { data: employees, error: employeesError } = await supabase
    .from('employee')
    .select('id, full_name, telegram_user_id')
    .eq('company_id', companyId);

  if (employeesError) throw employeesError;

  const employeeMap = new Map<string, { name: string; telegram?: string | null }>();
  employees?.forEach((employee) => {
    employeeMap.set(employee.id, { name: employee.full_name, telegram: employee.telegram_user_id });
  });

  const telegramIds = new Set(
    employees?.map((e) => e.telegram_user_id).filter(Boolean) as string[]
  );

  const { data: auditLogs, error: auditError } = await supabase
    .from('audit_log')
    .select('id, actor, action, at, payload')
    .order('at', { ascending: false })
    .limit(50);

  if (auditError) throw auditError;

  const shiftIds = Array.from(
    new Set(
      auditLogs
        ?.map((log) => (log.payload as Record<string, any> | null)?.shift_id)
        .filter((id): id is string => Boolean(id)) ?? []
    )
  );

  let shiftMap = new Map<string, { employeeId: string }>();
  if (shiftIds.length > 0) {
    const { data: shifts, error: shiftError } = await supabase
      .from('shift')
      .select('id, employee_id')
      .in('id', shiftIds);

    if (!shiftError && shifts) {
      shiftMap = new Map(shifts.map((shift) => [shift.id, { employeeId: shift.employee_id }]));
    }
  }

  const actionTypeMap: Record<string, ActivityItem['type']> = {
    start_shift: 'shift_start',
    finish_shift: 'shift_end',
    start_lunch: 'break_start',
    end_lunch: 'break_end',
    submit_report: 'report_submitted'
  };

  const descriptionMap: Record<ActivityItem['type'], string> = {
    shift_start: 'Начал(а) смену',
    shift_end: 'Завершил(а) смену',
    break_start: 'Начал(а) перерыв',
    break_end: 'Завершил(а) перерыв',
    report_submitted: 'Отправил(а) отчет'
  };

  const activities: ActivityItem[] = [];

  auditLogs?.forEach((log) => {
    const type = actionTypeMap[log.action];
    if (!type) return;

    const payload = (log.payload ?? {}) as Record<string, any>;

    let employeeName = 'Сотрудник';
    let employeeId: string | undefined;

    if (payload.employee_id && employeeMap.has(payload.employee_id)) {
      employeeId = payload.employee_id;
    } else if (payload.shift_id && shiftMap.has(payload.shift_id)) {
      employeeId = shiftMap.get(payload.shift_id)?.employeeId;
    }

    if (employeeId && employeeMap.has(employeeId)) {
      employeeName = employeeMap.get(employeeId)!.name;
    } else if (log.actor?.startsWith('admin:') && userId && log.actor === `admin:${userId}`) {
      employeeName = 'Администратор';
    } else if (log.actor?.startsWith('tg:')) {
      const actorId = log.actor.replace('tg:', '');
      const matchedEmployee = employees?.find((employee) => employee.telegram_user_id === actorId);
      if (matchedEmployee) {
        employeeName = matchedEmployee.full_name;
      }
    }

    const timestamp = format(new Date(log.at), 'dd MMM HH:mm', { locale: ru });

    activities.push({
      id: log.id.toString(),
      employeeName,
      type,
      description: descriptionMap[type],
      timestamp
    });
  });

  return activities.slice(0, 10);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ShiftStatus>('all');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleAddEmployee = () => {
    setLocation('/employees');
  };

  const handleFilter = () => {
    /* handled via dropdown menu */
  };

  const handleExport = () => {
    if (!filteredShiftData.length) {
      toast({
        title: 'Нет данных для экспорта',
        description: 'Добавьте активные смены или измените фильтры.',
        variant: 'destructive'
      });
      return;
    }

    const headers = ['Сотрудник', 'Должность', 'Статус', 'Начало', 'Окончание', 'Последний отчёт'];
    const rows = filteredShiftData.map((shift) => [
      shift.employeeName,
      shift.position,
      shift.status,
      shift.shiftStart,
      shift.shiftEnd,
      shift.lastReport ?? ''
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `active-shifts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: 'Экспорт выполнен', description: 'Файл со сменами загружен.' });
  };

  const {
    data: adminProfile,
    isLoading: isAdminLoading,
    error: adminError
  } = useQuery({
    queryKey: ['adminProfile', user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => fetchAdminProfile(user!.id)
  });

  const companyId = adminProfile?.company_id;

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError
  } = useQuery({
    queryKey: ['dashboardStats', companyId],
    enabled: Boolean(companyId),
    queryFn: () => fetchDashboardStats(companyId!)
  });

  const {
    data: activeShifts,
    isLoading: shiftsLoading,
    error: shiftsError
  } = useQuery({
    queryKey: ['activeShifts', companyId],
    enabled: Boolean(companyId),
    queryFn: () => fetchActiveShifts(companyId!)
  });

  const {
    data: recentActivity,
    isLoading: activityLoading,
    error: activityError
  } = useQuery({
    queryKey: ['recentActivity', companyId],
    enabled: Boolean(companyId && user?.id),
    queryFn: () => fetchRecentActivity(companyId!, user?.id)
  });

  const filteredShiftData = useMemo(() => {
    if (!activeShifts) return [];
    return activeShifts
      .map((shift) => {
        const report = shift.daily_report?.[0];
        const doneItem = report?.done_items?.[0];
        return {
          id: shift.id,
          employeeName: shift.employee.full_name,
          position: shift.employee.position || '—',
          status: mapStatus(shift.status),
          shiftStart: formatTime(shift.planned_start_at),
          shiftEnd: formatTime(shift.planned_end_at),
          lastReport: doneItem || undefined
        };
      })
      .filter((shift) => {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          shift.employeeName.toLowerCase().includes(query) ||
          shift.position.toLowerCase().includes(query);
        const matchesStatus = statusFilter === 'all' || shift.status === statusFilter;
        return matchesQuery && matchesStatus;
      });
  }, [activeShifts, searchQuery, statusFilter]);

  const isLoading = isAdminLoading || statsLoading || shiftsLoading;
  const hasError = adminError || statsError || shiftsError;

  return (
    <div className="space-y-6" data-testid="page-dashboard">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Дашборд</h1>
          <p className="text-muted-foreground">Обзор активности сотрудников</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" onClick={handleFilter} data-testid="button-filter">
                <Filter className="w-4 h-4 mr-2" />
                Фильтр
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Статус смен</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                {statusFilter === 'all' ? '• ' : ''}Все смены
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                {statusFilter === 'active' ? '• ' : ''}Активные
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('done')}>
                {statusFilter === 'done' ? '• ' : ''}Завершённые
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('late')}>
                {statusFilter === 'late' ? '• ' : ''}Опоздания
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </Button>
          <Button onClick={handleAddEmployee} data-testid="button-add-employee">
            <Plus className="w-4 h-4 mr-2" />
            Добавить
          </Button>
        </div>
      </div>

      {hasError && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
          {(adminError || statsError || shiftsError)?.message || 'Не удалось загрузить данные дашборда'}
        </div>
      )}

      {companyId ? (
        <>
          <DashboardStats
            totalEmployees={stats?.totalEmployees ?? 0}
            activeShifts={stats?.activeShifts ?? 0}
            completedShifts={stats?.completedShifts ?? 0}
            exceptions={stats?.exceptions ?? 0}
            employeesDelta={stats?.employeesDelta ?? null}
          />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Поиск сотрудников..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold">Активные смены</h2>
              {isLoading ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="h-40 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredShiftData.length > 0 ? (
                    filteredShiftData.map((shift) => (
                      <ShiftCard
                        key={shift.id}
                        employeeName={shift.employeeName}
                        position={shift.position}
                        shiftStart={shift.shiftStart}
                        shiftEnd={shift.shiftEnd}
                        status={shift.status}
                        lastReport={shift.lastReport}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center text-sm text-muted-foreground py-6">
                      {searchQuery ? 'Совпадений не найдено' : 'Нет активных смен'}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {activityLoading ? (
                <div className="h-64 bg-muted animate-pulse rounded-lg" />
              ) : (
                <RecentActivity activities={recentActivity ?? []} />
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="p-4 bg-muted rounded-md text-sm">
          {isAdminLoading
            ? 'Загрузка данных компании...'
            : 'Не удалось определить компанию администратора'}
        </div>
      )}
    </div>
  );
}
