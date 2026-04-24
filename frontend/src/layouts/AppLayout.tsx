import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tag,
  PieChart,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/cn';

const nav = [
  { to: '/', label: 'Genel Bakış', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'İşlemler', icon: ArrowLeftRight },
  { to: '/accounts', label: 'Hesaplar', icon: Wallet },
  { to: '/categories', label: 'Kategoriler', icon: Tag },
  { to: '/reports', label: 'Raporlar', icon: PieChart },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const nav$ = useNavigate();
  const [open, setOpen] = useState(false);

  const initials = (user?.fullName ?? '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-canvas">
      {/* Mobile top bar */}
      <header className="lg:hidden flex items-center justify-between border-b border-line bg-white px-4 h-14 sticky top-0 z-30">
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-ink/70 hover:bg-ink/[0.04]"
          aria-label="Menüyü aç"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Brand />
        <div className="h-8 w-8 rounded-full bg-ink text-white text-xs font-semibold flex items-center justify-center">
          {initials}
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-line bg-white">
          <SidebarContent
            user={user}
            initials={initials}
            onLogout={() => {
              logout();
              nav$('/login');
            }}
          />
        </aside>

        {/* Sidebar - mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />
            <aside className="relative h-full w-72 bg-white border-r border-line animate-fade-in">
              <button
                className="absolute right-3 top-3 rounded-md p-2 text-ink/70 hover:bg-ink/[0.04]"
                onClick={() => setOpen(false)}
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent
                user={user}
                initials={initials}
                onLogout={() => {
                  logout();
                  nav$('/login');
                }}
                onNavigate={() => setOpen(false)}
              />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 lg:pl-64 min-h-screen">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-7 rounded-lg bg-ink text-white text-sm font-bold flex items-center justify-center">
        Ö
      </div>
      <span className="font-semibold text-ink">Öde</span>
    </div>
  );
}

function SidebarContent({
  user,
  initials,
  onLogout,
  onNavigate,
}: {
  user: { fullName: string; email: string } | null;
  initials: string;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Brand />
      </div>
      <nav className="px-3 flex-1 space-y-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-ink text-white shadow-sm'
                  : 'text-ink/70 hover:bg-ink/[0.04] hover:text-ink'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="m-3 rounded-xl border border-line p-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-ink text-white text-xs font-semibold flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">{user?.fullName}</p>
          <p className="text-xs text-muted truncate">{user?.email}</p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-md p-2 text-muted hover:bg-ink/[0.04] hover:text-ink"
          aria-label="Çıkış"
          title="Çıkış"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
