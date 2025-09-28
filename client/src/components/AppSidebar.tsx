import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  AlertTriangle, 
  Calendar, 
  Settings,
  Building2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

const menuItems = [
  {
    title: "Дашборд",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Исключения",
    url: "/exceptions",
    icon: AlertTriangle,
  },
  {
    title: "Сотрудники",
    url: "/employees",
    icon: Users,
  },
  {
    title: "Отчеты",
    url: "/reports",
    icon: ClipboardList,
  },
  {
    title: "Графики",
    url: "/schedules",
    icon: Calendar,
  },
  {
    title: "Настройки",
    url: "/settings",
    icon: Settings,
  }
];

function NavMain() {
  const [location] = useLocation();
  
  return (
    <nav className="grid gap-1 px-2 py-4">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.url;
        
        return (
          <Link
            key={item.url}
            href={item.url}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-4">
        <h1 className="text-lg font-semibold">outTime</h1>
      </div>
      <div className="flex-1 overflow-auto">
        <NavMain />
      </div>
      {user && (
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}