import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Grid3x3,
  Truck,
  Users,
  ArrowLeftRight,
  LogOut,
  Menu,
  X,
  ScanLine,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';

type UserRole = 'admin' | 'staff';

interface DashboardLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  currentUser: {
    name: string;
    email: string;
    role: UserRole;
  };
}

const menuItems: Array<{ path: string; label: string; icon: LucideIcon; roles: UserRole[] }> = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { path: '/products', label: 'Products', icon: Package, roles: ['admin', 'staff'] },
  { path: '/variants', label: 'Variants', icon: Grid3x3, roles: ['admin', 'staff'] },
  { path: '/barcode-scanner', label: 'Barcode Scanner', icon: ScanLine, roles: ['admin', 'staff'] },
  { path: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['admin'] },
  { path: '/users', label: 'Users', icon: Users, roles: ['admin'] },
  { path: '/stock-movements', label: 'Stock Movements', icon: ArrowLeftRight, roles: ['admin', 'staff'] },
];

export default function DashboardLayout({ children, onLogout, currentUser }: DashboardLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) {
      return 'NA';
    }

    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-card"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border transition-transform duration-300 z-40 flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-semibold">Shoe Store</div>
              <div className="text-sm text-muted-foreground">Inventory</div>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems
            .filter((item) => item.roles.includes(currentUser.role))
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive ? 'bg-muted text-primary' : 'text-foreground hover:bg-muted'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted mb-2">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-white">
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{currentUser.name}</div>
              <div className="text-xs text-muted-foreground truncate">{currentUser.email}</div>
              <div className="text-xs text-muted-foreground">{currentUser.role === 'admin' ? 'Admin' : 'Staff'}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-primary hover:bg-muted"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
