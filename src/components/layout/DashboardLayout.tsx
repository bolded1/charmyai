import { Outlet, useLocation, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Bell, User, Building2, Palette, UsersRound, HelpCircle, Keyboard, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuGroup, DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useKeyboardShortcuts, MOD_LABEL, SHIFT_LABEL } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);
  const { user, loading } = useAuth();
  const { profile, displayName, initials } = useProfile();
  const [hasNotifications] = useState(true);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const shortcuts = useKeyboardShortcuts(() => setShortcutsOpen(true));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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
          <header className="h-12 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-sm font-medium text-foreground">{pageTitle}</span>
            </div>
            <div className="flex items-center gap-1">
              {/* Notifications */}
              <button
                className="relative h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                onClick={() => {/* TODO: notifications panel */}}
              >
                <Bell className="h-4 w-4" />
                {hasNotifications && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                )}
              </button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 rounded-md px-2 py-1 hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-6 w-6">
                      {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                      <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-medium">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-[13px] font-medium text-foreground leading-tight">{displayName}</span>
                      {profile?.job_title && (
                        <span className="text-[11px] text-muted-foreground leading-tight">{profile.job_title}</span>
                      )}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  {/* User identity */}
                  <DropdownMenuLabel className="font-normal p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{profile?.email || user?.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Workspace */}
                  <DropdownMenuLabel className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    Workspace
                  </DropdownMenuLabel>
                  <DropdownMenuItem className="text-xs text-muted-foreground px-3 cursor-default" disabled>
                    <Building2 className="h-3.5 w-3.5 mr-2" />
                    Acme Ltd
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  {/* Account */}
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => navigate("/app/settings")} className="px-3">
                      <User className="h-3.5 w-3.5 mr-2" />
                      <span className="text-[13px]">My Profile</span>
                      <DropdownMenuShortcut>{MOD_LABEL},</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/app/settings?tab=organization")} className="px-3">
                      <Building2 className="h-3.5 w-3.5 mr-2" />
                      <span className="text-[13px]">Organization Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/app/settings?tab=appearance")} className="px-3">
                      <Palette className="h-3.5 w-3.5 mr-2" />
                      <span className="text-[13px]">Appearance</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/app/team")} className="px-3">
                      <UsersRound className="h-3.5 w-3.5 mr-2" />
                      <span className="text-[13px]">Team Members</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />

                  {/* System */}
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="px-3">
                      <HelpCircle className="h-3.5 w-3.5 mr-2" />
                      <span className="text-[13px]">Help & Documentation</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="px-3" onClick={() => setShortcutsOpen(true)}>
                      <Keyboard className="h-3.5 w-3.5 mr-2" />
                      <span className="text-[13px]">Keyboard Shortcuts</span>
                      <DropdownMenuShortcut>{MOD_LABEL}/</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />

                  {/* Logout */}
                  <DropdownMenuItem onClick={handleSignOut} className="px-3 text-muted-foreground">
                    <LogOut className="h-3.5 w-3.5 mr-2" />
                    <span className="text-[13px]">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-8 overflow-auto surface-sunken">
            <Outlet />
          </main>
        </div>
      </div>

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} shortcuts={shortcuts} />
    </SidebarProvider>
  );
}

function getPageTitle(path: string): string {
  const map: Record<string, string> = {
    '/app': 'Dashboard',
    '/app/upload': 'Upload',
    '/app/documents': 'Documents',
    '/app/expenses': 'Expenses',
    '/app/income': 'Income',
    '/app/contacts': 'Contacts',
    '/app/exports': 'Exports',
    '/app/team': 'Team',
    '/app/settings': 'Settings',
  };
  return map[path] || 'Dashboard';
}
