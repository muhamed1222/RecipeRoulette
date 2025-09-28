import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

interface Company {
  id: string;
  name: string;
  timezone: string;
  locale: string;
  privacy_settings: any;
}

export default function Settings() {
  const [companyName, setCompanyName] = useState('');
  const [timezone, setTimezone] = useState('Europe/Moscow');
  const [locale, setLocale] = useState('ru');
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch company data
  const { data: company, isLoading, error } = useQuery<Company>({
    queryKey: ['company'],
    queryFn: async () => {
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

      const { data, error: companyError } = await supabase
        .from('company')
        .select('*')
        .eq('id', adminUser.company_id)
        .single();

      if (companyError) throw companyError;
      return data;
    }
  });

  // Update form when company data loads
  useEffect(() => {
    if (company) {
      setCompanyName(company.name);
      setTimezone(company.timezone);
      setLocale(company.locale);
    }
  }, [company]);

  // Save company settings
  const saveSettings = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите название компании",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('company')
        .update({
          name: companyName,
          timezone,
          locale
        })
        .eq('id', company?.id);

      if (updateError) throw updateError;

      toast({
        title: "Успех",
        description: "Настройки компании успешно сохранены"
      });

      // Refresh company data
      queryClient.invalidateQueries({ queryKey: ['company'] });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось сохранить настройки",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Настройки компании</h1>
          <p className="text-muted-foreground">Конфигурация компании и системы</p>
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
          <h1 className="text-3xl font-bold">Настройки компании</h1>
          <p className="text-muted-foreground">Конфигурация компании и системы</p>
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
        <h1 className="text-3xl font-bold">Настройки компании</h1>
        <p className="text-muted-foreground">Конфигурация компании и системы</p>
      </div>
      
      {/* Company Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Основные настройки</CardTitle>
          <CardDescription>Общая информация о компании</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company-name">Название компании</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="timezone">Часовой пояс</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Moscow">Москва (GMT+3)</SelectItem>
                  <SelectItem value="Europe/Amsterdam">Амстердам (GMT+2)</SelectItem>
                  <SelectItem value="Asia/Yekaterinburg">Екатеринбург (GMT+5)</SelectItem>
                  <SelectItem value="Asia/Novosibirsk">Новосибирск (GMT+7)</SelectItem>
                  <SelectItem value="Asia/Vladivostok">Владивосток (GMT+10)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="locale">Язык</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? "Сохранение..." : "Сохранить настройки"}
          </Button>
        </CardContent>
      </Card>
      
      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Политика конфиденциальности</CardTitle>
          <CardDescription>Настройки приватности и хранения данных</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-800">В разработке</h3>
            <p className="text-sm text-yellow-700">
              Настройки политики конфиденциальности будут доступны в следующих версиях системы.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Уведомления</CardTitle>
          <CardDescription>Настройки уведомлений и напоминаний</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-800">В разработке</h3>
            <p className="text-sm text-yellow-700">
              Настройки уведомлений будут доступны в следующих версиях системы.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}