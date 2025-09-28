import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Report {
  id: string;
  shift_id: string;
  planned_items: string[] | null;
  done_items: string[] | null;
  blockers: string | null;
  tasks_links: string[] | null;
  time_spent: Record<string, number> | null;
  attachments: any | null;
  submitted_at: string | null;
  shift: {
    employee_id: string;
    planned_start_at: string;
    planned_end_at: string;
  };
  employee: {
    full_name: string;
  };
}

export default function Reports() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);

  // Fetch reports data
  const { data: reports, isLoading, error, refetch } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_report')
        .select(`
          id,
          shift_id,
          planned_items,
          done_items,
          blockers,
          tasks_links,
          time_spent,
          attachments,
          submitted_at
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      // Fetch shift data
      if (data && data.length > 0) {
        const shiftIds = data.map((report: any) => report.shift_id);
        const { data: shifts, error: shiftError } = await supabase
          .from('shift')
          .select(`
            id,
            employee_id,
            planned_start_at,
            planned_end_at
          `)
          .in('id', shiftIds);
        
        if (shiftError) throw shiftError;
        
        // Fetch employee names
        // Create unique employee IDs array without using Set spread
        const employeeIdMap: Record<string, boolean> = {};
        shifts?.forEach((shift: any) => {
          employeeIdMap[shift.employee_id] = true;
        });
        const employeeIds = Object.keys(employeeIdMap);
        
        const { data: employees, error: employeeError } = await supabase
          .from('employee')
          .select('id, full_name')
          .in('id', employeeIds);
        
        if (employeeError) throw employeeError;
        
        // Merge data
        return data.map((report: any) => {
          const shift = shifts?.find((s: any) => s.id === report.shift_id);
          const employee = employees?.find((e: any) => e.id === shift?.employee_id);
          return {
            ...report,
            shift: shift || { employee_id: '', planned_start_at: '', planned_end_at: '' },
            employee: employee ? { full_name: employee.full_name } : { full_name: 'Неизвестный сотрудник' }
          };
        });
      }
      
      return data || [];
    }
  });

  // Filter reports based on search criteria
  useEffect(() => {
    if (!reports) return;

    let filtered = [...(reports as Report[])];

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(report => 
        report.submitted_at && report.submitted_at >= startDate
      );
    }

    if (endDate) {
      // Add one day to include the end date
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      const endDatePlusOne = endDateTime.toISOString().split('T')[0];
      
      filtered = filtered.filter(report => 
        report.submitted_at && report.submitted_at < endDatePlusOne
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(report => 
        report.employee.full_name.toLowerCase().includes(term) ||
        (report.done_items && report.done_items.some((item: string) => item.toLowerCase().includes(term))) ||
        (report.blockers && report.blockers.toLowerCase().includes(term))
      );
    }

    setFilteredReports(filtered);
  }, [reports, startDate, endDate, searchTerm]);

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredReports.length) return;

    // Create CSV content
    const headers = [
      'Сотрудник',
      'Дата',
      'План',
      'Факт',
      'Блокеры',
      'Время (минуты)',
      'Ссылки'
    ].join(';');

    const rows = filteredReports.map(report => {
      const totalTime = report.time_spent 
        ? Object.values(report.time_spent).reduce((sum, val) => sum + val, 0)
        : 0;
        
      return [
        `"${report.employee.full_name}"`,
        `"${report.submitted_at ? format(new Date(report.submitted_at), 'dd.MM.yyyy', { locale: ru }) : ''}"`,
        `"${report.planned_items ? report.planned_items.join(', ') : ''}"`,
        `"${report.done_items ? report.done_items.join(', ') : ''}"`,
        `"${report.blockers || ''}"`,
        `"${totalTime}"`,
        `"${report.tasks_links ? report.tasks_links.join(', ') : ''}"`
      ].join(';');
    });

    const csvContent = [headers, ...rows].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `отчеты_${format(new Date(), 'yyyy-MM-dd', { locale: ru })}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Отчеты</h1>
          <p className="text-muted-foreground">Ежедневные отчеты сотрудников</p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Отчеты</h1>
          <p className="text-muted-foreground">Ежедневные отчеты сотрудников</p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Ошибка загрузки данных: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Отчеты</h1>
        <p className="text-muted-foreground">Ежедневные отчеты сотрудников</p>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
          <CardDescription>Отфильтруйте отчеты по дате и сотруднику</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Дата начала</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date">Дата окончания</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search">Поиск</Label>
              <Input
                id="search"
                placeholder="Поиск по сотруднику или содержимому"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Найдено отчетов: {filteredReports.length}
            </p>
            <Button onClick={exportToCSV} disabled={!filteredReports.length}>
              Экспорт в CSV
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Отчеты сотрудников</CardTitle>
          <CardDescription>Список ежедневных отчетов</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Сотрудник</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>План</TableHead>
                  <TableHead>Факт</TableHead>
                  <TableHead>Блокеры</TableHead>
                  <TableHead>Часы</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.employee.full_name}
                    </TableCell>
                    <TableCell>
                      {report.submitted_at 
                        ? format(new Date(report.submitted_at), 'dd.MM.yyyy', { locale: ru })
                        : 'Не отправлен'}
                    </TableCell>
                    <TableCell>
                      {report.planned_items?.slice(0, 2).join(', ')}
                      {report.planned_items && report.planned_items.length > 2 ? '...' : ''}
                    </TableCell>
                    <TableCell>
                      {report.done_items?.slice(0, 2).join(', ')}
                      {report.done_items && report.done_items.length > 2 ? '...' : ''}
                    </TableCell>
                    <TableCell>
                      {report.blockers ? report.blockers.slice(0, 30) + (report.blockers.length > 30 ? '...' : '') : ''}
                    </TableCell>
                    <TableCell>
                      {report.time_spent 
                        ? Object.values(report.time_spent).reduce((sum, val) => sum + val, 0) + ' мин'
                        : '0 мин'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Нет отчетов, соответствующих фильтрам</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
