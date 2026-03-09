import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Upload, FileText, Receipt, TrendingUp, Tag,
  Download, UsersRound, Settings, LogOut, HelpCircle, LifeBuoy, Sparkles, Briefcase,
  BarChart3,
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { useLayoutSettings } from "@/hooks/useLayoutSettings";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardShortcuts, MOD_LABEL } from "@/hooks/useKeyboardShortcuts";
import { useOrganization } from "@/hooks/useOrganization";
import { useState } from "react";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { useClientRole } from "@/hooks/useClientRole";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuGroup, DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { User, Building2, Palette, Keyboard, HelpCircle as HelpIcon } from "lucide-react";

const financeItems = [
  { title: "Capture", url: "/app", icon: Upload },
  { title: "Documents", url: "/app/documents", icon: FileText },
];

const recordsItems = [
  { title: "Expenses", url: "/app/expenses", icon: Receipt },
  { title: "Income", url: "/app/income", icon: TrendingUp },
  { title: "Categories", url: "/app/categories", icon: Tag },
  { title: "Exports", url: "/app/exports", icon: Download },
];

const firmItems = [
  { title: "Firm Dashboard", url: "/app/workspaces", icon: BarChart3 },
  { title: "Team", url: "/app/team", icon: UsersRound },
];

const clientItems = [
  { title: "Capture", url: "/app", icon: Upload },
  { title: "Documents", url: "/app/documents", icon: FileText },
  { title: "Expenses", url: "/app/expenses", icon: Receipt },
  { title: "Exports", url: "/app/exports", icon: Download },
];

const systemItems = [
  { title: "AI Assistant", url: "/app/assistant", icon: Sparkles },
  { title: "Settings", url: "/app/settings", icon: Settings },
  { title: "Support", url: "/app/support", icon: LifeBuoy },
  { title: "Help & Documentation", url: "/app/help", icon: HelpCircle },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useLayoutSettings();
  const showLabels = settings.showSidebarLabels && !collapsed;
  const brandLogo = useBrandLogo();
  const { profile, displayName, initials } = useProfile();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { data: org } = useOrganization();
  const { activeWorkspace, isAccountingFirm } = useWorkspace();
  const { isClient } = useClientRole();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  
  const isClientContext = isAccountingFirm && activeWorkspace?.workspace_type === "client";
  const isFirmContext = isAccountingFirm && !isClientContext;

  const shortcuts = useKeyboardShortcuts(() => setShortcutsOpen(true));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const renderGroup = (label: string, items: typeof financeItems) => (
    <SidebarGroup className="py-1">
      {showLabels && (
        <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-muted px-2.5 mb-0.5 h-6">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                <NavLink to={item.url} end={item.url === '/app'}>
                  <item.icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {showLabels && <span className="text-sm font-medium text-foreground">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  const profileDropdownContent = (
    <DropdownMenuContent align="end" side="right" className="w-60">
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
        {!isClient && (
          <>
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
          </>
        )}
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
  );

  return (
    <>
      <Sidebar collapsible="none">
        <SidebarHeader className="px-4 py-5">
          <Link to="/app" className="flex items-center gap-2.5">
            {brandLogo ? (
              <img src={brandLogo} alt="Logo" className="h-7 max-w-[7rem] object-contain shrink-0" />
            ) : (
              <div className="h-7 w-7 rounded-lg bg-hero-gradient flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                <FileText className="h-3.5 w-3.5 text-white" />
              </div>
            )}
            {showLabels && !brandLogo && <span className="font-bold text-sm text-gradient tracking-tight">Charmy</span>}
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-2.5 pt-1">
          {/* Workspace Switcher */}
          <div className="px-1 mb-3">
            <WorkspaceSwitcher compact={collapsed} />
          </div>
          {(() => {
            // Clients get the same sidebar as pro users (no firm section)
            return (
              <>
                {renderGroup("Documents", financeItems)}
                {renderGroup("Finance", recordsItems)}
                {!isClient && isAccountingFirm && renderGroup("Firm", firmItems)}
                {renderGroup("System", systemItems)}
              </>
            );
          })()}
        </SidebarContent>
        <SidebarFooter className="px-3 pb-4 pt-3 border-t border-border/30 space-y-3">
          {/* Notifications row */}
          <div className="flex items-center justify-between px-1">
            {showLabels && <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Notifications</span>}
            <NotificationsPopover />
          </div>

          {/* User card */}
          <div className="rounded-xl bg-accent/40 border border-border/30 p-2.5 space-y-2">
            {/* Avatar + name — clickable, opens profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 w-full rounded-lg px-1 py-1 hover:bg-background/70 transition-all duration-150 focus:outline-none">
                  <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background shadow-sm">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  {showLabels && (
                    <div className="flex flex-col min-w-0 flex-1 text-left">
                      <span className="text-[13px] font-semibold text-foreground leading-tight truncate">{displayName}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight truncate">{profile?.email || user?.email}</span>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              {profileDropdownContent}
            </DropdownMenu>

            {showLabels && (
              <div className="space-y-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 w-full h-8 px-2.5 rounded-lg text-[12px] font-medium text-foreground hover:bg-background/70 border border-border/40 transition-all duration-150 focus:outline-none">
                      <Settings className="h-3.5 w-3.5" strokeWidth={2} />
                      <span>Settings</span>
                    </button>
                  </DropdownMenuTrigger>
                  {profileDropdownContent}
                </DropdownMenu>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full h-8 px-2.5 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/8 border border-border/40 transition-all duration-150"
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} shortcuts={shortcuts} />
    </>
  );
}
