import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

interface ReportItem {
  id: number;
  text: string;
}

interface TimeSpent {
  [key: string]: number;
}

export function ReportForm() {
  const { toast } = useToast();
  const [doneItems, setDoneItems] = useState<ReportItem[]>([{ id: 1, text: '' }]);
  const [blockers, setBlockers] = useState('');
  const [timeSpent, setTimeSpent] = useState<TimeSpent>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addDoneItem = () => {
    setDoneItems([...doneItems, { id: Date.now(), text: '' }]);
  };

  const removeDoneItem = (id: number) => {
    if (doneItems.length > 1) {
      setDoneItems(doneItems.filter(item => item.id !== id));
    }
  };

  const updateDoneItem = (id: number, text: string) => {
    setDoneItems(doneItems.map(item => item.id === id ? { ...item, text } : item));
  };

  const handleTimeSpentChange = (task: string, value: number[]) => {
    setTimeSpent({ ...timeSpent, [task]: value[0] });
  };

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
        doneItems: doneItems.map(item => item.text).filter(text => text.trim() !== ''),
        blockers: blockers.trim(),
        timeSpent,
        attachments: [] // For future implementation
      };

      // Submit to Edge Function
      const response = await fetch('/functions/v1/webapp/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData,
          type: 'report',
          payload
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Успех",
          description: "Отчет успешно сохранен"
        });
        
        // Close WebApp
        (window as any).Telegram?.WebApp?.close();
      } else {
        throw new Error(result.error || 'Ошибка при сохранении отчета');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить отчет",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Итоги дня</CardTitle>
        <CardDescription>Заполните отчет о проделанной работе</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Что было сделано</Label>
            {doneItems.map((item) => (
              <div key={item.id} className="flex gap-2">
                <Textarea
                  value={item.text}
                  onChange={(e) => updateDoneItem(item.id, e.target.value)}
                  placeholder={`Описание выполненной задачи ${doneItems.findIndex(i => i.id === item.id) + 1}`}
                />
                {doneItems.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeDoneItem(item.id)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addDoneItem}>
              + Добавить выполненную задачу
            </Button>
          </div>

          <div className="space-y-4">
            <Label>Блокеры</Label>
            <Textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Что мешало работе? Какие проблемы возникли?"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Распределение времени</Label>
            <div className="space-y-3">
              {doneItems.map((item, index) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      Задача {index + 1}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {timeSpent[item.id] || 0}%
                    </span>
                  </div>
                  <Slider
                    value={[timeSpent[item.id] || 0]}
                    onValueChange={(value) => handleTimeSpentChange(item.id.toString(), value)}
                    max={100}
                    step={1}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Сохранение..." : "Сохранить отчет"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}