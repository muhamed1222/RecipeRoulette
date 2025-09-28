import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface PlanItem {
  id: number;
  text: string;
}

interface TaskLink {
  id: number;
  url: string;
}

export function PlanForm() {
  const { toast } = useToast();
  const [planItems, setPlanItems] = useState<PlanItem[]>([{ id: 1, text: '' }]);
  const [taskLinks, setTaskLinks] = useState<TaskLink[]>([{ id: 1, url: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addPlanItem = () => {
    setPlanItems([...planItems, { id: Date.now(), text: '' }]);
  };

  const removePlanItem = (id: number) => {
    if (planItems.length > 1) {
      setPlanItems(planItems.filter(item => item.id !== id));
    }
  };

  const updatePlanItem = (id: number, text: string) => {
    setPlanItems(planItems.map(item => item.id === id ? { ...item, text } : item));
  };

  const addTaskLink = () => {
    setTaskLinks([...taskLinks, { id: Date.now(), url: '' }]);
  };

  const removeTaskLink = (id: number) => {
    if (taskLinks.length > 1) {
      setTaskLinks(taskLinks.filter(link => link.id !== id));
    }
  };

  const updateTaskLink = (id: number, url: string) => {
    setTaskLinks(taskLinks.map(link => link.id === id ? { ...link, url } : link));
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
        plannedItems: planItems.map(item => item.text).filter(text => text.trim() !== ''),
        tasksLinks: taskLinks.map(link => link.url).filter(url => url.trim() !== ''),
        plannedStartAt: new Date().toISOString(),
        plannedEndAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // Default 8 hours
      };

      // Submit to Edge Function
      const response = await fetch('/functions/v1/webapp/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData,
          type: 'plan',
          payload
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Успех",
          description: "План успешно сохранен"
        });
        
        // Close WebApp
        (window as any).Telegram?.WebApp?.close();
      } else {
        throw new Error(result.error || 'Ошибка при сохранении плана');
      }
    } catch (error) {
      console.error('Error submitting plan:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить план",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>План на день</CardTitle>
        <CardDescription>Заполните план на рабочий день</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Что планирую сделать</Label>
            {planItems.map((item) => (
              <div key={item.id} className="flex gap-2">
                <Input
                  value={item.text}
                  onChange={(e) => updatePlanItem(item.id, e.target.value)}
                  placeholder={`Пункт плана ${planItems.findIndex(i => i.id === item.id) + 1}`}
                />
                {planItems.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removePlanItem(item.id)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addPlanItem}>
              + Добавить пункт
            </Button>
          </div>

          <div className="space-y-4">
            <Label>Ссылки на задачи</Label>
            {taskLinks.map((link) => (
              <div key={link.id} className="flex gap-2">
                <Input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateTaskLink(link.id, e.target.value)}
                  placeholder="https://example.com/task"
                />
                {taskLinks.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeTaskLink(link.id)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addTaskLink}>
              + Добавить ссылку
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Сохранение..." : "Сохранить план"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}