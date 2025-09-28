import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

interface ExceptionCount {
  kind: string;
  count: number;
}

interface ExceptionStatsData {
  today: number;
  noReport: number;
  late: number;
  totalCounts: ExceptionCount[];
}

export function ExceptionStats() {
  const { data, isLoading, error } = useQuery<ExceptionStatsData>({
    queryKey: ['exceptionStats'],
    queryFn: async () => {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's exceptions count
      const { count: todayCount, error: todayError } = await supabase
        .from('exception')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);
        
      if (todayError) throw todayError;
        
      // Get no_report exceptions count
      const { count: noReportCount, error: noReportError } = await supabase
        .from('exception')
        .select('*', { count: 'exact', head: true })
        .eq('kind', 'no_report');
        
      if (noReportError) throw noReportError;
        
      // Get late exceptions count
      const { count: lateCount, error: lateError } = await supabase
        .from('exception')
        .select('*', { count: 'exact', head: true })
        .eq('kind', 'late');
        
      if (lateError) throw lateError;
        
      // Get counts by kind
      const { data: exceptionsData, error: countsError } = await supabase
        .from('exception')
        .select('kind');

      if (countsError) throw countsError;

      // Count by kind
      const counts: Record<string, number> = {};
      exceptionsData?.forEach(item => {
        counts[item.kind] = (counts[item.kind] || 0) + 1;
      });
      
      const totalCounts = Object.entries(counts).map(([kind, count]) => ({ kind, count }));

      return {
        today: todayCount || 0,
        noReport: noReportCount || 0,
        late: lateCount || 0,
        totalCounts: totalCounts || []
      };
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Исключения</CardTitle>
          <CardDescription>Статистика по исключениям</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Исключения</CardTitle>
          <CardDescription>Статистика по исключениям</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Ошибка загрузки данных: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Исключения</CardTitle>
        <CardDescription>Статистика по исключениям</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">Сегодня</p>
              <p className="text-2xl font-bold text-red-800">{data?.today || 0}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-600">Нет отчета</p>
              <p className="text-2xl font-bold text-orange-800">{data?.noReport || 0}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-600">Опоздания</p>
              <p className="text-2xl font-bold text-yellow-800">{data?.late || 0}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Всего</p>
              <p className="text-2xl font-bold text-blue-800">
                {data?.totalCounts.reduce((sum, item) => sum + item.count, 0) || 0}
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">По типам</h3>
            <div className="space-y-2">
              {data?.totalCounts.map((item) => (
                <div key={item.kind} className="flex justify-between">
                  <span className="capitalize">
                    {item.kind === 'no_report' ? 'Нет отчета' : 
                     item.kind === 'late' ? 'Опоздание' : 
                     item.kind === 'short_day' ? 'Короткий день' : 
                     item.kind === 'long_break' ? 'Долгий перерыв' : 
                     item.kind === 'no_show' ? 'Не вышел' : item.kind}
                  </span>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}