import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        return;
      }

      if (!companyName.trim()) {
        throw new Error('Укажите название компании');
      }

      await signup(email, password, companyName.trim());
      toast({
        title: 'Регистрация успешна',
        description: 'Мы создали вашу компанию и выполнили вход'
      });
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: mode === 'login' ? 'Ошибка входа' : 'Ошибка регистрации',
        description:
          error?.message ||
          (mode === 'login' ? 'Неверный email или пароль' : 'Не удалось завершить регистрацию'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setCompanyName('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === 'login' ? 'Вход в outTime' : 'Регистрация администратора'}</CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Войдите в систему для доступа к панели администратора'
              : 'Создайте аккаунт и новую компанию для управления сменами'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="company">Название компании</Label>
                <Input
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder='ООО "Моя компания"'
                  required
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? mode === 'login'
                  ? 'Вход...'
                  : 'Регистрация...'
                : mode === 'login'
                  ? 'Войти'
                  : 'Зарегистрироваться'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
              >
                {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
