import { useEffect, useState } from "react";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { WorkspaceContextBar } from "@/components/WorkspaceContextBar";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppMobileDrawer } from "./AppMobileDrawer";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "./DashboardSidebar";
import { Loader2, FileText, ShieldAlert, X, AlertTriangle } from "lucide-react";
import { useLayoutSettings } from "@/hooks/useLayoutSettings";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useOrganization } from "@/hooks/useOrganization";
import { useNavigate, Link } from "react-router-dom";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { applyAccentColor, DEFAULT_ACCENT_COLOR } from "@/lib/color-utils";
import { NPSWidget } from "@/components/NPSWidget";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useClientRole } from "@/hooks/useClientRole";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function DashboardLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { profile, displayName, initials, isLoading: profileLoading } = useProfile();
  const { data: org } = useOrganization();
  const { settings: layoutSettings } = useLayoutSettings();
  const brandLogo = useBrandLogo();
  const { impersonating, stopImpersonating } = useImpersonation();
  const subscription = useSubscription();
  const { data: systemSettings } = useSystemSettings();
  const isAdmin = useIsAdmin();
  const { isClient } = useClientRole();
  const { isAccountingFirm } = useWorkspace();

  useEffect(() => {
    applyAccentColor(org?.primary_color || DEFAULT_ACCENT_COLOR);
  }, [org?.primary_color]);

  // Block all rendering until auth, profile, and subscription checks complete
  if (loading || subscription.loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Onboarding guard: client users skip onboarding, others need it completed
  // Admins impersonating skip all gates
  if (!impersonating && !isClient && (!profile || !profile.onboarding_completed_at)) {
    return <Navigate to="/onboarding" replace />;
  }

  // Maintenance mode: block non-admin users
  if (!impersonating && systemSettings?.maintenance && isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Under Maintenance</h1>
          <p className="text-sm text-muted-foreground">
            The platform is currently undergoing maintenance. Please check back soon.
          </p>
        </div>
      </div>
    );
  }

  // Billing setup gate — client users skip billing (their firm pays)
  if (!impersonating && !isClient && !profile.billing_setup_at) {
    return <Navigate to="/activate-trial" replace />;
  }

  // Subscription gate — client users skip subscription check
  if (!impersonating && !isClient && !subscription.subscribed) {
    if (subscription.status && subscription.status !== "active" && subscription.status !== "promo_active") {
      return <Navigate to="/billing-required" replace />;
    }
    return <Navigate to="/activate-trial" replace />;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Simple mobile profile menu
  const mobileProfileMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent transition-colors focus:outline-none">
          <Avatar className="h-6 w-6">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-medium">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => navigate("/app/settings")} className="px-3">
          <User className="h-3.5 w-3.5 mr-2" />
          <span className="text-[13px]">{t("common.myProfile")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="px-3 text-muted-foreground">
          <LogOut className="h-3.5 w-3.5 mr-2" />
          <span className="text-[13px]">{t("auth.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <SidebarProvider>
      <div className="h-[100dvh] flex w-full bg-background overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:flex md:shrink-0 border-r border-border/40">
          <DashboardSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
          {/* Subtle background gradient */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
            <div className="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[100px]" style={{ background: 'radial-gradient(circle, hsl(224 76% 48%), transparent 70%)' }} />
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.05] blur-[100px]" style={{ background: 'radial-gradient(circle, hsl(262 83% 58%), transparent 70%)' }} />
          </div>

          <div className="relative z-10 flex flex-col min-h-0 flex-1">
            <PwaInstallBanner />
            <OfflineIndicator />

            {/* Workspace context bar for client workspaces */}
            <WorkspaceContextBar />

            {/* Impersonation banner */}
            {impersonating && (
              <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span className="font-medium">Viewing as:</span>
                  <span>{impersonating.displayName} ({impersonating.email})</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 h-7"
                  onClick={() => { stopImpersonating(); navigate("/admin/users"); }}
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Stop
                </Button>
              </div>
            )}

            {/* Mobile header with logo + profile */}
            <header className="h-14 border-b border-border/30 bg-card/90 backdrop-blur-xl flex items-center justify-between px-3 shrink-0 md:hidden shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {brandLogo ? (
                  <img src={brandLogo} alt="Logo" className="h-7 max-w-[5rem] object-contain shrink-0" />
                ) : (
                  <Link to="/app" className="flex items-center gap-1.5 shrink-0">
                    <div className="h-7 w-7 rounded-md bg-hero-gradient flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
                      <FileText className="h-3.5 w-3.5 text-white" />
                    </div>
                  </Link>
                )}
                <div className="flex-1 min-w-0 max-w-[180px]">
                  <WorkspaceSwitcher compact={false} />
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <LanguageSwitcher variant="ghost" />
                <NotificationsPopover />
                {mobileProfileMenu}
                <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-xl border-border/60 bg-muted/50 hover:bg-accent shadow-sm">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[280px] p-0 border-l border-border/40" onClick={(e) => {
                    if ((e.target as HTMLElement).closest('a')) setDrawerOpen(false);
                  }}>
                    <AppMobileDrawer />
                  </SheetContent>
                </Sheet>
              </div>
            </header>
            <main className={`flex-1 min-h-0 surface-sunken ${location.pathname === "/app/assistant" ? "overflow-hidden p-0" : `overflow-auto scrollbar-thin ${layoutSettings.compactView ? "p-3 md:p-5" : "p-4 md:p-8"}`}`}>
              <Outlet />
              <NPSWidget />
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
