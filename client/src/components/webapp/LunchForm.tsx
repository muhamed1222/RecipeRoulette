import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface LunchFormProps {
  action: 'start' | 'end';
}

export function LunchForm({ action }: LunchFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get Telegram WebApp init data
      const initData = (window as any).Telegram?.WebApp?.initData;
      
      if (!initData) {
        toast({
          title: "Ошибка",
          description: "Не удалось получить данные из Telegram WebApp",
          variant: "destructive"
        });
        return;
      }

      // Prepare payload
      const payload = {
        action
      };

      // Submit to Edge Function
      const response = await fetch('/functions/v1/webapp/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData,
          type: 'lunch',
          payload
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Успех",
          description: action === 'start' 
            ? "Перерыв начат" 
            : "Перерыв завершен"
        });
        
        // Close WebApp
        (window as any).Telegram?.WebApp?.close();
      } else {
        throw new Error(result.error || 'Ошибка при обработке перерыва');
      }
    } catch (error) {
      console.error('Error submitting lunch:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обработать перерыв",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {action === 'start' ? 'Начать перерыв' : 'Завершить перерыв'}
        </CardTitle>
        <CardDescription>
          {action === 'start' 
            ? 'Вы уверены, что хотите начать перерыв?' 
            : 'Вы уверены, что хотите завершить перерыв?'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {action === 'start'
              ? 'Это завершит текущий рабочий интервал и начнет перерыв.'
              : 'Это завершит перерыв и начнет новый рабочий интервал.'}
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1"
            onClick={() => (window as any).Telegram?.WebApp?.close()}
          >
            Отмена
          </Button>
          <Button 
            type="submit" 
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (action === 'start' ? "Начинаем..." : "Завершаем...") 
              : (action === 'start' ? "Начать" : "Завершить")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}