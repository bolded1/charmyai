import { useEffect } from "react";
import { Outlet, useLocation, Navigate, useSearchParams } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "./DashboardSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, Building2, Palette, UsersRound, HelpCircle, Keyboard, LogOut, Upload, Camera, FileText, Receipt, TrendingUp, Download, Settings, ShieldAlert, X, LifeBuoy, ChevronLeft, ChevronRight, Sparkles, AlertTriangle } from "lucide-react";
import { useLayoutSettings } from "@/hooks/useLayoutSettings";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useOrganization } from "@/hooks/useOrganization";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuGroup, DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useKeyboardShortcuts, MOD_LABEL } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { applyAccentColor, DEFAULT_ACCENT_COLOR } from "@/lib/color-utils";
import { NPSWidget } from "@/components/NPSWidget";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { OfflineIndicator } from "@/components/OfflineIndicator";

const mobileNavItems = [
  { title: "Capture", url: "/app", icon: Upload },
  { title: "Documents", url: "/app/documents", icon: FileText },
  { title: "Expenses", url: "/app/expenses", icon: Receipt },
  { title: "Income", url: "/app/income", icon: TrendingUp },
  { title: "Exports", url: "/app/exports", icon: Download },
  { title: "AI Assistant", url: "/app/assistant", icon: Sparkles },
  { title: "Team", url: "/app/team", icon: UsersRound },
  { title: "Help & Documentation", url: "/app/help", icon: HelpCircle },
  { title: "Support", url: "/app/support", icon: LifeBuoy },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);
  const { user, loading } = useAuth();
  const { profile, displayName, initials } = useProfile();
  const { data: org } = useOrganization();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { settings: layoutSettings } = useLayoutSettings();
  const isMobile = useIsMobile();
  const brandLogo = useBrandLogo();
  const { impersonating, stopImpersonating } = useImpersonation();
  const subscription = useSubscription();
  const { data: systemSettings } = useSystemSettings();
  const isAdmin = useIsAdmin();

  // Apply org accent color
  useEffect(() => {
    applyAccentColor(org?.primary_color || DEFAULT_ACCENT_COLOR);
  }, [org?.primary_color]);

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

  // Maintenance mode: block non-admin users
  if (systemSettings?.maintenance && isAdmin === false) {
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

  // Subscription gate: if not subscribed and not on billing/settings page, redirect
  const isBillingPage = location.pathname === "/app/settings" && searchParams.get("tab") === "billing";
  if (!subscription.loading && !subscription.subscribed && !isBillingPage) {
    // If they had a subscription before (expired/cancelled), show billing required
    // Otherwise redirect to activate trial
    if (subscription.status && subscription.status !== "active" && subscription.status !== "trialing") {
      return <Navigate to="/billing-required" replace />;
    }
    if (!subscription.status) {
      return <Navigate to="/activate-trial" replace />;
    }
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
          {org?.name || "My Organization"}
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
          <DropdownMenuItem className="px-3 min-h-[40px]" onClick={() => navigate("/app/help")}>
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




  return (
    <SidebarProvider>
      <div className="h-[100dvh] flex w-full bg-background overflow-hidden">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <DashboardSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
          {/* Background gradient orbs matching login page */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(224 76% 48% / 0.5), transparent 70%)' }} />
            <div className="absolute bottom-[-15%] right-[-8%] w-[400px] h-[400px] rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(262 83% 58% / 0.4), transparent 70%)' }} />
          </div>
          {/* Install banner & offline indicator */}
          <div className="relative z-10 flex flex-col min-h-0 flex-1">
          <OfflineIndicator />
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
          <header className="h-14 border-b border-border/40 bg-card/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 md:hidden">
            <div className="flex items-center gap-2">
              {brandLogo ? (
                <img src={brandLogo} alt="Logo" className="h-7 max-w-[5rem] object-contain" />
              ) : (
                <Link to="/app" className="flex items-center gap-1.5">
                  <div className="h-7 w-7 rounded-md bg-hero-gradient flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
                    <FileText className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-bold text-sm text-gradient">Charmy</span>
                </Link>
              )}
            </div>
            <div className="flex items-center gap-1">
              <NotificationsPopover />
              {profileMenu}
            </div>
          </header>

          {/* Mobile navigation tab bar */}
          <div className="md:hidden border-b border-border/40 bg-card/80 backdrop-blur-xl flex items-center">
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

          {/* Desktop header - hidden on mobile */}
          <header className="h-14 border-b border-border/40 bg-card/80 backdrop-blur-xl items-center justify-between px-6 shrink-0 hidden md:flex">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">{pageTitle}</span>
            </div>
            <div className="flex items-center gap-1">
              <NotificationsPopover />
              {profileMenu}
            </div>
          </header>

          <main className={`flex-1 min-h-0 surface-sunken ${location.pathname === "/app/assistant" ? "overflow-hidden p-0" : `overflow-auto ${layoutSettings.compactView ? "p-3 md:p-4" : "p-4 md:p-8"}`}`}>
            <Outlet />
            <NPSWidget />
          </main>


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
