import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface ScheduleTemplate {
  id: string;
  name: string;
  rules: any;
  created_at: string;
}

export default function Schedules() {
  const [name, setName] = useState('');
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('18:00');
  const [breakStart, setBreakStart] = useState('13:00');
  const [breakEnd, setBreakEnd] = useState('14:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch schedule templates
  const { data: schedules, isLoading, error } = useQuery<ScheduleTemplate[]>({
    queryKey: ['schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_template')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Create new schedule template
  const createSchedule = async () => {
    if (!name.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите название графика",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      // Get current user's company ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Пользователь не авторизован");

      const { data: adminUser, error: adminError } = await supabase
        .from('admin_user')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (adminError) throw adminError;
      if (!adminUser) throw new Error("Администратор не найден");

      // Prepare rules object
      const rules = {
        days: selectedDays,
        work: {
          start: workStart,
          end: workEnd
        },
        breaks: [[breakStart, breakEnd]]
      };

      // Insert new schedule template
      const { error: insertError } = await supabase
        .from('schedule_template')
        .insert({
          name,
          rules,
          company_id: adminUser.company_id
        });

      if (insertError) throw insertError;

      toast({
        title: "Успех",
        description: "График успешно создан"
      });

      // Reset form
      setName('');
      
      // Refresh schedules list
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать график",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle day selection
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  // Get day name
  const getDayName = (day: number) => {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[day];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Графики работы</h1>
          <p className="text-muted-foreground">Управление шаблонами графиков</p>
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
          <h1 className="text-3xl font-bold">Графики работы</h1>
          <p className="text-muted-foreground">Управление шаблонами графиков</p>
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
        <h1 className="text-3xl font-bold">Графики работы</h1>
        <p className="text-muted-foreground">Управление шаблонами графиков</p>
      </div>
      
      {/* Create Schedule Template */}
      <Card>
        <CardHeader>
          <CardTitle>Создать шаблон графика</CardTitle>
          <CardDescription>Определите новый шаблон графика работы</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="schedule-name">Название графика</Label>
            <Input
              id="schedule-name"
              placeholder="Стандартный рабочий день"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Рабочее время</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="work-start">Начало</Label>
                  <Input
                    id="work-start"
                    type="time"
                    value={workStart}
                    onChange={(e) => setWorkStart(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="work-end">Окончание</Label>
                  <Input
                    id="work-end"
                    type="time"
                    value={workEnd}
                    onChange={(e) => setWorkEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Перерыв</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="break-start">Начало</Label>
                  <Input
                    id="break-start"
                    type="time"
                    value={breakStart}
                    onChange={(e) => setBreakStart(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="break-end">Окончание</Label>
                  <Input
                    id="break-end"
                    type="time"
                    value={breakEnd}
                    onChange={(e) => setBreakEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Дни недели</Label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <Button
                  key={day}
                  variant={selectedDays.includes(day) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(day)}
                >
                  {getDayName(day)}
                </Button>
              ))}
            </div>
          </div>
          
          <Button onClick={createSchedule} disabled={isCreating}>
            {isCreating ? "Создание..." : "Создать шаблон"}
          </Button>
        </CardContent>
      </Card>
      
      {/* Schedule Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>Шаблоны графиков</CardTitle>
          <CardDescription>Существующие шаблоны графиков работы</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules && schedules.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Рабочее время</TableHead>
                  <TableHead>Перерыв</TableHead>
                  <TableHead>Дни недели</TableHead>
                  <TableHead>Дата создания</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      {schedule.name}
                    </TableCell>
                    <TableCell>
                      {schedule.rules?.work?.start} - {schedule.rules?.work?.end}
                    </TableCell>
                    <TableCell>
                      {schedule.rules?.breaks?.[0]?.[0]} - {schedule.rules?.breaks?.[0]?.[1]}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {schedule.rules?.days?.map((day: number) => (
                          <span key={day} className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {getDayName(day)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(schedule.created_at).toLocaleDateString('ru-RU')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Нет созданных шаблонов графиков</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
