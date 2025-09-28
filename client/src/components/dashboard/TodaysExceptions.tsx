import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Exception {
  id: string;
  employee_id: string;
  date: string;
  kind: string;
  severity: number;
  details: any;
  employee?: {
    full_name: string;
  };
}

export function TodaysExceptions() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['todaysExceptions'],
    queryFn: async () => {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('exception')
        .select(`
          id,
          employee_id,
          date,
          kind,
          severity,
          details
        `)
        .eq('date', today)
        .order('severity', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Fetch employee names separately
      if (data && data.length > 0) {
        // Create unique employee IDs array without using Set spread
        const employeeIdMap: Record<string, boolean> = {};
        data.forEach((e: any) => {
          employeeIdMap[e.employee_id] = true;
        });
        const employeeIds = Object.keys(employeeIdMap);
        
        const { data: employees, error: employeeError } = await supabase
          .from('employee')
          .select('id, full_name')
          .in('id', employeeIds);
        
        if (employeeError) throw employeeError;
        
        // Merge employee data with exceptions
        return data.map((exception: any) => {
          const employee = employees?.find((e: any) => e.id === exception.employee_id);
          return {
            ...exception,
            employee: employee ? { full_name: employee.full_name } : undefined
          };
        });
      }
      
      return data || [];
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Исключения сегодня</CardTitle>
          <CardDescription>Последние исключения за сегодня</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Исключения сегодня</CardTitle>
          <CardDescription>Последние исключения за сегодня</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Ошибка загрузки данных: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const getKindLabel = (kind: string) => {
    switch (kind) {
      case 'no_report': return 'Нет отчета';
      case 'late': return 'Опоздание';
      case 'short_day': return 'Короткий день';
      case 'long_break': return 'Долгий перерыв';
      case 'no_show': return 'Не вышел';
      default: return kind;
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-orange-100 text-orange-800';
      case 4: return 'bg-red-100 text-red-800';
      case 5: return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Исключения сегодня</CardTitle>
        <CardDescription>Последние исключения за сегодня</CardDescription>
      </CardHeader>
      <CardContent>
        {(data as Exception[]) && (data as Exception[]).length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Сотрудник</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Важность</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data as Exception[]).map((exception: Exception) => (
                <TableRow key={exception.id}>
                  <TableCell className="font-medium">
                    {exception.employee?.full_name || 'Неизвестный сотрудник'}
                  </TableCell>
                  <TableCell>
                    {getKindLabel(exception.kind)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(exception.severity)}`}>
                      {exception.severity}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Нет исключений сегодня</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
