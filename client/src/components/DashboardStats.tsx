import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, AlertTriangle } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string | null;
  icon: React.ComponentType<any>;
  color?: string;
  onClick?: () => void;
}

function StatCard({ title, value, change, icon: Icon, color = "text-primary", onClick }: StatCardProps) {
  return (
    <Card
      onClick={onClick}
      data-testid={`stat-card-${title.toLowerCase().replace(' ', '-')}`}
      className={onClick ? 'cursor-pointer hover:bg-muted/40 transition-colors' : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change ? (
          <p className="text-xs text-muted-foreground">{change}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  totalEmployees: number;
  activeShifts: number;
  completedShifts: number;
  exceptions: number;
  onViewExceptions?: () => void;
  employeesDelta?: number | null;
}

export default function DashboardStats({ 
  totalEmployees, 
  activeShifts, 
  completedShifts, 
  exceptions,
  onViewExceptions,
  employeesDelta = null
}: DashboardStatsProps) {
  const handleViewExceptions = () => {
    console.log('View exceptions clicked');
    onViewExceptions?.();
  };

  const deltaLabel = employeesDelta === null
    ? null
    : employeesDelta === 0
      ? 'Без изменений за месяц'
      : employeesDelta > 0
        ? `+${employeesDelta} за месяц`
        : `${employeesDelta} за месяц`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Всего сотрудников"
        value={totalEmployees}
        icon={Users}
        change={deltaLabel}
      />
      <StatCard
        title="Активные смены"
        value={activeShifts}
        icon={UserCheck}
        color="text-shift-active"
      />
      <StatCard
        title="Завершено сегодня" 
        value={completedShifts}
        icon={UserX}
        color="text-shift-done"
      />
      <div onClick={handleViewExceptions} className="cursor-pointer">
        <StatCard
          title="Исключения"
          value={exceptions}
          change={exceptions > 0 ? "Требует внимания" : "Все в порядке"}
          icon={AlertTriangle}
          color={exceptions > 0 ? "text-shift-missed" : "text-shift-active"}
        />
      </div>
    </div>
  );
}
