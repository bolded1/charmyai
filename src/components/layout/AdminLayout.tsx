import { Outlet, useLocation, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { MobileHeader } from "./MobileHeader";
import { AdminMobileDrawer } from "./AdminMobileDrawer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Loader2, Search, Bell } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminLayout() {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const isAdmin = useIsAdmin();

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }

  const profileBadge = (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground hidden sm:block">Platform Admin</span>
      <Avatar className="h-7 w-7">
        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">SA</AvatarFallback>
      </Avatar>
    </div>
  );

  return (
    <SidebarProvider>
      <div className="marketing min-h-screen flex w-full bg-[hsl(var(--surface-sunken))]">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AdminSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <MobileHeader
            pageTitle={pageTitle}
            drawerContent={<AdminMobileDrawer />}
            profileMenu={profileBadge}
          />

          {/* Desktop header */}
          <header className="h-16 border-b border-border/60 bg-card/80 backdrop-blur-xl items-center justify-between px-6 shrink-0 hidden md:flex sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div>
                <h1 className="text-lg font-bold tracking-tight text-foreground">{pageTitle}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="w-48 pl-9 h-9 bg-muted/50 border-transparent focus:border-primary/30 rounded-xl text-sm"
                />
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="h-6 w-px bg-border/60" />
              <div className="flex items-center gap-2.5">
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-semibold text-foreground">Platform Admin</p>
                  <p className="text-[10px] text-muted-foreground">Super Admin</p>
                </div>
                <Avatar className="h-9 w-9 ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-[hsl(var(--violet))] text-primary-foreground text-xs font-bold">SA</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function getPageTitle(path: string): string {
  const map: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/organizations': 'Organizations',
    '/admin/users': 'Users',
    '/admin/documents': 'Documents',
    '/admin/usage': 'Usage & Activity',
    '/admin/subscriptions': 'Subscriptions',
    '/admin/audit': 'Audit Logs',
    '/admin/settings': 'System Settings',
    '/admin/support': 'Support Tools',
    '/admin/revenue': 'Revenue',
    '/admin/storage': 'Storage',
    '/admin/cms': 'Page Content',
    '/admin/email-templates': 'Email Templates',
    '/admin/broadcast': 'Broadcast',
    '/admin/demo-settings': 'Demo Settings',
    '/admin/system-health': 'System Health',
    '/admin/feature-flags': 'Feature Flags',
    '/admin/scheduled-jobs': 'Scheduled Jobs',
    '/admin/login-activity': 'Login Activity',
    '/admin/gdpr': 'GDPR / Data',
    '/admin/document-stats': 'Doc Processing',
    '/admin/feedback': 'User Feedback',
  };
  return map[path] || 'Admin';
}
