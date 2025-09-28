import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Download } from "lucide-react";
import DashboardStats from "@/components/DashboardStats";
import ShiftCard from "@/components/ShiftCard";
import RecentActivity, { type ActivityItem } from "@/components/RecentActivity";
import employeeImage from '@assets/generated_images/Professional_employee_avatar_7b6fbe18.png';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  //todo: remove mock functionality
  const mockStats = {
    totalEmployees: 24,
    activeShifts: 12,
    completedShifts: 8,
    exceptions: 3
  };

  const mockShifts = [
    {
      employeeName: "Анна Петрова",
      employeeImage: employeeImage,
      position: "Менеджер продаж", 
      shiftStart: "09:00",
      shiftEnd: "18:00",
      status: "active" as const,
      location: "Офис Москва",
      lastReport: "Встреча с клиентом завершена"
    },
    {
      employeeName: "Михаил Сидоров",
      position: "Разработчик",
      shiftStart: "10:00", 
      shiftEnd: "19:00",
      status: "break" as const,
      lastReport: "Работаю над новой функцией"
    },
    {
      employeeName: "Елена Козлова",
      position: "Дизайнер",
      shiftStart: "09:30",
      shiftEnd: "18:30", 
      status: "late" as const,
      location: "Удаленно"
    },
    {
      employeeName: "Дмитрий Волков",
      position: "Аналитик",
      shiftStart: "09:00",
      shiftEnd: "18:00",
      status: "done" as const,
      location: "Офис СПб"
    }
  ];

  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      employeeName: 'Анна Петрова',
      employeeImage: employeeImage,
      type: 'shift_start',
      description: 'Начала рабочую смену',
      timestamp: '09:15'
    },
    {
      id: '2', 
      employeeName: 'Михаил Сидоров',
      type: 'report_submitted',
      description: 'Отправил ежедневный отчет',
      timestamp: '18:30'
    },
    {
      id: '3',
      employeeName: 'Елена Козлова',
      type: 'break_start',
      description: 'Начала обеденный перерыв',
      timestamp: '13:00'
    }
  ];

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    console.log('Search query:', value);
  };

  const handleAddEmployee = () => {
    console.log('Add employee clicked');
  };

  const handleFilter = () => {
    console.log('Filter clicked');
  };

  const handleExport = () => {
    console.log('Export clicked');
  };

  const filteredShifts = mockShifts.filter(shift =>
    shift.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shift.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="page-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Дашборд</h1>
          <p className="text-muted-foreground">Обзор активности сотрудников</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleFilter} data-testid="button-filter">
            <Filter className="w-4 h-4 mr-2" />
            Фильтр
          </Button>
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </Button>
          <Button onClick={handleAddEmployee} data-testid="button-add-employee">
            <Plus className="w-4 h-4 mr-2" />
            Добавить
          </Button>
        </div>
      </div>

      {/* Stats */}
      <DashboardStats {...mockStats} />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Поиск сотрудников..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shift Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Активные смены</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredShifts.map((shift) => (
              <ShiftCard key={shift.employeeName} {...shift} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <RecentActivity activities={mockActivities} />
        </div>
      </div>
    </div>
  );
}
