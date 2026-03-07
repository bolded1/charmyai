import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

export default function AdminLayout() {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold">{pageTitle}</h1>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                <Shield className="h-3 w-3 mr-1" /> Admin
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">Platform Admin</span>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-destructive/10 text-destructive text-xs">SA</AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto surface-sunken">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function getPageTitle(path: string): string {
  const map: Record<string, string> = {
    '/admin': 'Admin Dashboard',
    '/admin/organizations': 'Organizations',
    '/admin/users': 'Users',
    '/admin/documents': 'Documents',
    '/admin/usage': 'Usage & Activity',
    '/admin/subscriptions': 'Subscriptions',
    '/admin/audit': 'Audit Logs',
    '/admin/settings': 'System Settings',
    '/admin/support': 'Support Tools',
  };
  return map[path] || 'Admin';
}
