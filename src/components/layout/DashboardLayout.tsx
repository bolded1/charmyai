import { Outlet, useLocation, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);
  const { user, loading } = useAuth();
  const { profile, displayName, initials } = useProfile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-13 border-b border-border bg-card flex items-center justify-between px-5 shrink-0 shadow-theme-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-[13px] font-semibold text-foreground tracking-tight">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    <Avatar className="h-7 w-7">
                      {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">{initials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{profile?.job_title || profile?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/app/settings")}>My Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/app/settings")}>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-muted-foreground">Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
    '/app': 'Dashboard',
    '/app/upload': 'Upload Documents',
    '/app/documents': 'Documents',
    '/app/expenses': 'Expenses',
    '/app/exports': 'Exports',
    '/app/team': 'Team',
    '/app/settings': 'Settings',
  };
  return map[path] || 'Dashboard';
}
