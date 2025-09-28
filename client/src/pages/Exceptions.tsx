import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import ExceptionCard, { type ExceptionType } from "@/components/ExceptionCard";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { format, isSameDay, subDays } from "date-fns";
import { ru } from "date-fns/locale";

interface AdminProfile {
  company_id: string;
  role: string;
}

interface ExceptionRow {
  id: string;
  date: string;
  kind: string;
  severity: number | null;
  details: Record<string, any> | null;
  employee: {
    full_name: string;
    position: string | null;
  };
}

function buildDescription(kind: ExceptionType, details: Record<string, any> | null): string {
  if (details?.message) {
    return details.message;
  }

  switch (kind) {
    case 'late':
      return 'Сотрудник опоздал на смену.';
    case 'no_report':
      return 'Ежедневный отчёт не был отправлен.';
    case 'short_day':
      return 'Смена завершена раньше запланированного времени.';
    case 'long_break':
      return 'Перерыв длится дольше допустимого.';
    case 'no_show':
      return 'Сотрудник не вышел на смену.';
    default:
      return 'Обновление статуса сотрудника.';
  }
}

function formatTimestamp(row: ExceptionRow): string {
  const occurredAtIso = row.details?.occurred_at as string | undefined;
  const createdAt = occurredAtIso ? new Date(occurredAtIso) : new Date(row.date);
  if (isSameDay(createdAt, new Date())) {
    return format(createdAt, 'HH:mm', { locale: ru });
  }
  if (isSameDay(createdAt, subDays(new Date(), 1))) {
    return 'Вчера';
  }
  return format(createdAt, 'dd MMM', { locale: ru });
}

function normalizeSeverity(value: number | null): 1 | 2 | 3 {
  if (!value) return 1;
  if (value >= 3) return 3;
  if (value <= 1) return 1;
  return 2;
}

async function fetchAdminProfile(userId: string): Promise<AdminProfile> {
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

async function fetchExceptions(companyId: string): Promise<ExceptionRow[]> {
  const { data, error } = await supabase
    .from('exception')
    .select(`
      id,
      date,
      kind,
      severity,
      details,
      employee:employee_id!inner (
        full_name,
        position,
        company_id
      )
    `)
    .eq('employee.company_id', companyId)
    .order('severity', { ascending: false })
    .order('date', { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return (data ?? []) as ExceptionRow[];
}

export default function Exceptions() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<ExceptionType | null>(null);

  const { data: adminProfile } = useQuery({
    queryKey: ['adminProfile', user?.id],
    queryFn: () => fetchAdminProfile(user!.id),
    enabled: Boolean(user?.id)
  });

  const companyId = adminProfile?.company_id;

  const {
    data: exceptions,
    isLoading,
    error
  } = useQuery({
    queryKey: ['exceptions', companyId],
    queryFn: () => fetchExceptions(companyId!),
    enabled: Boolean(companyId)
  });

  const severityLabels = {
    1: { label: "Низкая", color: "bg-yellow-100 text-yellow-800" },
    2: { label: "Средняя", color: "bg-orange-100 text-orange-800" },
    3: { label: "Высокая", color: "bg-red-100 text-red-800" }
  };

  const typeLabels = {
    late: "Опоздание",
    no_report: "Нет отчета", 
    short_day: "Короткий день",
    long_break: "Долгий перерыв",
    no_show: "Не явился"
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleSeverityFilter = (severity: number) => {
    setSelectedSeverity(selectedSeverity === severity ? null : severity);
  };

  const handleTypeFilter = (type: ExceptionType) => {
    setSelectedType(selectedType === type ? null : type);
  };

  const clearFilters = () => {
    setSelectedSeverity(null);
    setSelectedType(null);
    setSearchQuery('');
  };

  const mappedExceptions = useMemo(() => {
    if (!exceptions) return [];

    return exceptions.map((row) => {
      const type = (row.kind as ExceptionType) ?? 'late';
      const description = buildDescription(type, row.details ?? null);
      const timestamp = formatTimestamp(row);
      return {
        id: row.id,
        employeeName: row.employee?.full_name ?? 'Сотрудник',
        type,
        description,
        timestamp,
        severity: normalizeSeverity(row.severity)
      };
    });
  }, [exceptions]);

  const filteredExceptions = useMemo(() => {
    return mappedExceptions.filter((exception) => {
      const matchesSearch =
        exception.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exception.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity = selectedSeverity === null || exception.severity === selectedSeverity;
      const matchesType = selectedType === null || exception.type === selectedType;

      return matchesSearch && matchesSeverity && matchesType;
    });
  }, [mappedExceptions, searchQuery, selectedSeverity, selectedType]);

  const hasFilters = selectedSeverity !== null || selectedType !== null || searchQuery.length > 0;

  return (
    <div className="space-y-6" data-testid="page-exceptions">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Исключения</h1>
          <p className="text-muted-foreground">Мониторинг нарушений и проблем</p>
        </div>
        <Badge variant={mappedExceptions.length > 0 ? "destructive" : "secondary"}>
          {mappedExceptions.length} активных
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Поиск исключений..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-exceptions"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Важность:</span>
            {Object.entries(severityLabels).map(([severity, config]) => (
              <Badge
                key={severity}
                variant={selectedSeverity === parseInt(severity) ? "default" : "outline"}
                className="cursor-pointer hover-elevate"
                onClick={() => handleSeverityFilter(parseInt(severity))}
                data-testid={`filter-severity-${severity}`}
              >
                {config.label}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Тип:</span>
            {Object.entries(typeLabels).map(([type, label]) => (
              <Badge
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                className="cursor-pointer hover-elevate"
                onClick={() => handleTypeFilter(type as ExceptionType)}
                data-testid={`filter-type-${type}`}
              >
                {label}
              </Badge>
            ))}
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
              <X className="w-4 h-4 mr-1" />
              Очистить
            </Button>
          )}
        </div>
      </div>

      {/* Exception Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <p>Не удалось загрузить исключения</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        ) : filteredExceptions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {hasFilters ? "Исключения не найдены" : "Нет активных исключений"}
            </p>
          </div>
        ) : (
          filteredExceptions.map((exception) => (
            <ExceptionCard
              key={exception.id}
              employeeName={exception.employeeName}
              type={exception.type}
              description={exception.description}
              timestamp={exception.timestamp}
              severity={exception.severity}
            />
          ))
        )}
      </div>
    </div>
  );
}
