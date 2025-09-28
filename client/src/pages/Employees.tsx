import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

interface Employee {
  id: string;
  full_name: string;
  position: string | null;
  telegram_user_id: string | null;
  status: string;
  created_at: string;
}

interface Invite {
  id: string;
  code: string;
  full_name: string | null;
  position: string | null;
  created_at: string;
  used_by_employee: string | null;
  used_at: string | null;
}

export default function Employees() {
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch employees data
  const { data: employees, isLoading: employeesLoading, error: employeesError } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch invites data
  const { data: invites, isLoading: invitesLoading, error: invitesError } = useQuery<Invite[]>({
    queryKey: ['invites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_invite')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Generate invite
  const generateInvite = async () => {
    if (!fullName.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите имя сотрудника",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingInvite(true);
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

      // Call Edge Function to generate invite
      const response = await fetch('/functions/v1/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`
        },
        body: JSON.stringify({
          fullName,
          position,
          companyId: adminUser.company_id
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Ошибка при создании приглашения');
      }

      toast({
        title: "Успех",
        description: "Приглашение успешно создано"
      });

      // Reset form
      setFullName('');
      setPosition('');
      
      // Refresh invites list
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    } catch (error: any) {
      console.error('Error generating invite:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать приглашение",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  // Copy invite link to clipboard
  const copyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      toast({
        title: "Скопировано",
        description: "Ссылка скопирована в буфер обмена"
      });
    }).catch(() => {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать ссылку",
        variant: "destructive"
      });
    });
  };

  if (employeesLoading || invitesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Сотрудники</h1>
          <p className="text-muted-foreground">Управление сотрудниками и приглашениями</p>
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

  if (employeesError || invitesError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Сотрудники</h1>
          <p className="text-muted-foreground">Управление сотрудниками и приглашениями</p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">
              Ошибка загрузки данных: {employeesError?.message || invitesError?.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Сотрудники</h1>
        <p className="text-muted-foreground">Управление сотрудниками и приглашениями</p>
      </div>
      
      {/* Invite Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Пригласить сотрудника</CardTitle>
          <CardDescription>Создайте приглашение для нового сотрудника</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Полное имя</Label>
              <Input
                id="full-name"
                placeholder="Иванов Иван Иванович"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position">Должность</Label>
              <Input
                id="position"
                placeholder="Должность (необязательно)"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>
          
          <Button onClick={generateInvite} disabled={isGeneratingInvite}>
            {isGeneratingInvite ? "Создание..." : "Создать приглашение"}
          </Button>
        </CardContent>
      </Card>
      
      {/* Active Invites */}
      <Card>
        <CardHeader>
          <CardTitle>Активные приглашения</CardTitle>
          <CardDescription>Список отправленных приглашений</CardDescription>
        </CardHeader>
        <CardContent>
          {invites && invites.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Должность</TableHead>
                  <TableHead>Код</TableHead>
                  <TableHead>Ссылка</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">
                      {invite.full_name || 'Не указано'}
                    </TableCell>
                    <TableCell>
                      {invite.position || 'Не указана'}
                    </TableCell>
                    <TableCell>
                      {invite.code}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(`https://t.me/your_bot_username?start=${invite.code}`)}
                      >
                        Копировать
                      </Button>
                    </TableCell>
                    <TableCell>
                      {invite.used_at ? (
                        <span className="text-green-600">Использовано</span>
                      ) : (
                        <span className="text-blue-600">Активно</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Нет активных приглашений</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Employees List */}
      <Card>
        <CardHeader>
          <CardTitle>Список сотрудников</CardTitle>
          <CardDescription>Все зарегистрированные сотрудники</CardDescription>
        </CardHeader>
        <CardContent>
          {employees && employees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Должность</TableHead>
                  <TableHead>Telegram</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата регистрации</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.full_name}
                    </TableCell>
                    <TableCell>
                      {employee.position || 'Не указана'}
                    </TableCell>
                    <TableCell>
                      {employee.telegram_user_id ? (
                        <span className="text-green-600">Подключен</span>
                      ) : (
                        <span className="text-yellow-600">Ожидает</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        employee.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.status === 'active' ? 'Активен' : 'Неактивен'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(employee.created_at).toLocaleDateString('ru-RU')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Нет зарегистрированных сотрудников</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}