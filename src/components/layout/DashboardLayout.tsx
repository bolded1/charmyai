import { Outlet, useLocation, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "./DashboardSidebar";
import { MobileHeader } from "./MobileHeader";
import { AppMobileDrawer } from "./AppMobileDrawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, Building2, Palette, UsersRound, HelpCircle, Keyboard, LogOut, Upload, Camera } from "lucide-react";
import { useLayoutSettings } from "@/hooks/useLayoutSettings";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuGroup, DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useKeyboardShortcuts, MOD_LABEL } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { NotificationsPopover } from "@/components/NotificationsPopover";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);
  const { user, loading } = useAuth();
  const { profile, displayName, initials } = useProfile();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { settings: layoutSettings } = useLayoutSettings();
  const isMobile = useIsMobile();

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

  const profileMenu = (
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

        <DropdownMenuLabel className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          Workspace
        </DropdownMenuLabel>
        <DropdownMenuItem className="text-xs text-muted-foreground px-3 cursor-default" disabled>
          <Building2 className="h-3.5 w-3.5 mr-2" />
          Acme Ltd
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/app/settings")} className="px-3 min-h-[40px]">
            <User className="h-3.5 w-3.5 mr-2" />
            <span className="text-[13px]">My Profile</span>
            {!isMobile && <DropdownMenuShortcut>{MOD_LABEL},</DropdownMenuShortcut>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/app/settings?tab=organization")} className="px-3 min-h-[40px]">
            <Building2 className="h-3.5 w-3.5 mr-2" />
            <span className="text-[13px]">Organization Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/app/settings?tab=appearance")} className="px-3 min-h-[40px]">
            <Palette className="h-3.5 w-3.5 mr-2" />
            <span className="text-[13px]">Appearance</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/app/team")} className="px-3 min-h-[40px]">
            <UsersRound className="h-3.5 w-3.5 mr-2" />
            <span className="text-[13px]">Team Members</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className="px-3 min-h-[40px]">
            <HelpCircle className="h-3.5 w-3.5 mr-2" />
            <span className="text-[13px]">Help & Documentation</span>
          </DropdownMenuItem>
          {!isMobile && (
            <DropdownMenuItem className="px-3 min-h-[40px]" onClick={() => setShortcutsOpen(true)}>
              <Keyboard className="h-3.5 w-3.5 mr-2" />
              <span className="text-[13px]">Keyboard Shortcuts</span>
              <DropdownMenuShortcut>{MOD_LABEL}/</DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut} className="px-3 text-muted-foreground min-h-[40px]">
          <LogOut className="h-3.5 w-3.5 mr-2" />
          <span className="text-[13px]">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Show sticky upload FAB on document-heavy pages on mobile
  const showFab = isMobile && ["/app/documents", "/app/expenses", "/app/income"].includes(location.pathname);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <DashboardSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <MobileHeader
            pageTitle={pageTitle}
            drawerContent={<AppMobileDrawer />}
            profileMenu={profileMenu}
            showQuickActions
          />

          {/* Desktop header - hidden on mobile */}
          <header className="h-12 border-b border-border bg-card items-center justify-between px-6 shrink-0 hidden md:flex">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-sm font-medium text-foreground">{pageTitle}</span>
            </div>
            <div className="flex items-center gap-1">
              <NotificationsPopover />
              {profileMenu}
            </div>
          </header>

          <main className={`flex-1 overflow-auto surface-sunken ${layoutSettings.compactView ? "p-3 md:p-4" : "p-4 md:p-8"}`}>
            <Outlet />
          </main>

          {/* Sticky Upload FAB for mobile */}
          {showFab && (
            <div className="fixed bottom-6 right-4 z-50 md:hidden">
              <Button
                size="lg"
                className="h-12 w-12 rounded-full shadow-lg"
                onClick={() => navigate("/app")}
              >
                <Upload className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} shortcuts={shortcuts} />
    </SidebarProvider>
  );
}

function getPageTitle(path: string): string {
  const map: Record<string, string> = {
    '/app': 'Capture',
    '/app/upload': 'Capture',
    '/app/documents': 'Documents',
    '/app/expenses': 'Expenses',
    '/app/income': 'Income',
    '/app/contacts': 'Contacts',
    '/app/exports': 'Exports',
    '/app/team': 'Team',
    '/app/settings': 'Settings',
  };
  return map[path] || 'Capture';
}
