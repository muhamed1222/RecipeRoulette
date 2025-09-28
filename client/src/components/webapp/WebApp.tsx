import React, { useEffect, useState } from 'react';
import { PlanForm } from './PlanForm';
import { ReportForm } from './ReportForm';
import { LunchForm } from './LunchForm';

export function WebApp() {
  const [formType, setFormType] = useState<'plan' | 'report' | 'lunch' | null>(null);
  const [lunchAction, setLunchAction] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    // Initialize Telegram WebApp
    const webapp = (window as any).Telegram?.WebApp;
    if (webapp) {
      webapp.ready();
      webapp.expand();
    }

    // Get form type from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type === 'plan') {
      setFormType('plan');
    } else if (type === 'report') {
      setFormType('report');
    } else if (type === 'lunch') {
      setFormType('lunch');
      const action = urlParams.get('action');
      if (action === 'start' || action === 'end') {
        setLunchAction(action);
      }
    }
  }, []);

  // Show loading state while determining form type
  if (formType === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка формы...</p>
        </div>
      </div>
    );
  }

  // Render appropriate form
  switch (formType) {
    case 'plan':
      return <PlanForm />;
    case 'report':
      return <ReportForm />;
    case 'lunch':
      if (lunchAction) {
        return <LunchForm action={lunchAction} />;
      } else {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-red-500">Ошибка: Не указан тип действия для перерыва</p>
              <button 
                className="mt-4 px-4 py-2 bg-gray-200 rounded"
                onClick={() => (window as any).Telegram?.WebApp?.close()}
              >
                Закрыть
              </button>
            </div>
          </div>
        );
      }
    default:
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-500">Ошибка: Неизвестный тип формы</p>
            <button 
              className="mt-4 px-4 py-2 bg-gray-200 rounded"
              onClick={() => (window as any).Telegram?.WebApp?.close()}
            >
              Закрыть
            </button>
          </div>
        </div>
      );
  }
}