import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Company() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Настройки сохранены",
      description: "Изменения успешно применены"
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Настройки компании</h1>
        <p className="text-muted-foreground">Управление параметрами компании</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Информация о компании</CardTitle>
          <CardDescription>Основные данные о вашей компании</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Название компании</Label>
            <Input id="company-name" placeholder="Название компании" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-address">Адрес</Label>
            <Input id="company-address" placeholder="Адрес компании" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-phone">Телефон</Label>
              <Input id="company-phone" placeholder="+7 (XXX) XXX-XX-XX" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company-email">Email</Label>
              <Input id="company-email" type="email" placeholder="info@company.com" />
            </div>
          </div>
          
          <Button onClick={handleSave}>Сохранить</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Биллинг</CardTitle>
          <CardDescription>Информация о подписке и платежах</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800">Бесплатный тариф</h3>
            <p className="text-sm text-blue-700">
              Вы используете бесплатный тариф системы. Все функции доступны в рамках ограничений free-tier.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium">Сотрудники</h4>
              <p className="text-2xl font-bold">5/10</p>
              <p className="text-sm text-muted-foreground">Активных сотрудников</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium">Хранилище</h4>
              <p className="text-2xl font-bold">15/100 МБ</p>
              <p className="text-sm text-muted-foreground">Использовано</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium">API вызовы</h4>
              <p className="text-2xl font-bold">1,245/10,000</p>
              <p className="text-sm text-muted-foreground">В этом месяце</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}