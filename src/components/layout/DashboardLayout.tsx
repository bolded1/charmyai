import { useEffect, useState } from "react";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { WorkspaceContextBar } from "@/components/WorkspaceContextBar";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "./DashboardSidebar";
import { Loader2, Upload, FileText, Receipt, TrendingUp, Download, Settings, ShieldAlert, X, LifeBuoy, ChevronLeft, ChevronRight, Sparkles, AlertTriangle, UsersRound, HelpCircle, Tag, BarChart3, Link2 } from "lucide-react";
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

  const mobileNavItems = [
    { title: t("navigation.capture"), url: "/app", icon: Upload },
    { title: t("navigation.documents"), url: "/app/documents", icon: FileText },
    { title: t("navigation.expenses"), url: "/app/expenses", icon: Receipt },
    { title: t("navigation.income"), url: "/app/income", icon: TrendingUp },
    { title: t("navigation.categories"), url: "/app/categories", icon: Tag },
    { title: t("navigation.exports"), url: "/app/exports", icon: Download },
    ...(!isClient && isAccountingFirm
      ? [
          { title: t("navigation.firmDashboard"), url: "/app/workspaces", icon: BarChart3 },
          { title: t("navigation.documentRequests"), url: "/app/document-requests", icon: Link2 },
          { title: t("navigation.team"), url: "/app/team", icon: UsersRound },
          { title: t("navigation.documentRequests"), url: "/app/document-requests", icon: Link2 },
        ]
      : []),
    { title: t("navigation.aiAssistant"), url: "/app/assistant", icon: Sparkles },
    { title: t("navigation.settings"), url: "/app/settings", icon: Settings },
    { title: t("navigation.support"), url: "/app/support", icon: LifeBuoy },
    { title: t("navigation.help"), url: "/app/help", icon: HelpCircle },
  ];
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
              </div>
            </header>

            {/* Mobile navigation tab bar */}
            <div className="md:hidden border-b border-border/30 bg-card/90 backdrop-blur-xl flex items-center">
              <button
                onClick={() => {
                  const el = document.getElementById("mobile-nav-scroll");
                  if (el) el.scrollBy({ left: -120, behavior: "smooth" });
                }}
                className="shrink-0 px-1.5 py-2.5 text-muted-foreground/60 hover:text-foreground transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <nav id="mobile-nav-scroll" className="flex-1 overflow-x-auto scrollbar-hide">
                <div className="flex min-w-max">
                  {mobileNavItems.map((item) => {
                    const isActive = item.url === "/app"
                      ? location.pathname === "/app"
                      : location.pathname.startsWith(item.url);
                    return (
                      <Link
                        key={item.url}
                        to={item.url}
                        className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors ${
                          isActive
                            ? "border-primary text-primary"
                            : "border-transparent text-foreground/80 hover:text-foreground"
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </nav>
              <button
                onClick={() => {
                  const el = document.getElementById("mobile-nav-scroll");
                  if (el) el.scrollBy({ left: 120, behavior: "smooth" });
                }}
                className="shrink-0 px-1.5 py-2.5 text-muted-foreground/60 hover:text-foreground transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

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
