import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import {
  LayoutDashboard, Building2, Users, FileText, BarChart3, TrendingUp, Activity, HardDrive,
  CreditCard, ScrollText, Cog, LifeBuoy, Shield, ArrowLeft, Sparkles, PenLine, Mail, Megaphone,
  KeyRound, UserX, MessageSquareHeart, ToggleLeft, HeartPulse, Clock,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Users & Access",
    items: [
      { title: "Organizations", url: "/admin/organizations", icon: Building2 },
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Login Activity", url: "/admin/login-activity", icon: KeyRound },
      { title: "GDPR / Data", url: "/admin/gdpr", icon: UserX },
    ],
  },
  {
    label: "Documents & Data",
    items: [
      { title: "Documents", url: "/admin/documents", icon: FileText },
      { title: "Doc Processing", url: "/admin/document-stats", icon: Activity },
      { title: "Storage", url: "/admin/storage", icon: HardDrive },
    ],
  },
  {
    label: "Analytics & Revenue",
    items: [
      { title: "Usage & Activity", url: "/admin/usage", icon: BarChart3 },
      { title: "Subscriptions", url: "/admin/subscriptions", icon: CreditCard },
      { title: "Revenue", url: "/admin/revenue", icon: TrendingUp },
      { title: "User Feedback", url: "/admin/feedback", icon: MessageSquareHeart },
    ],
  },
  {
    label: "Content & Comms",
    items: [
      { title: "Page Content", url: "/admin/cms", icon: PenLine },
      { title: "Email Templates", url: "/admin/email-templates", icon: Mail },
      { title: "Broadcast", url: "/admin/broadcast", icon: Megaphone },
      { title: "Demo Upload", url: "/admin/demo-settings", icon: Sparkles },
    ],
  },
  {
    label: "System & Ops",
    items: [
      { title: "System Health", url: "/admin/system-health", icon: HeartPulse },
      { title: "Feature Flags", url: "/admin/feature-flags", icon: ToggleLeft },
      { title: "Scheduled Jobs", url: "/admin/scheduled-jobs", icon: Clock },
      { title: "Audit Logs", url: "/admin/audit", icon: ScrollText },
      { title: "System Settings", url: "/admin/settings", icon: Cog },
    ],
  },
  {
    label: "Help",
    items: [
      { title: "Support", url: "/admin/support", icon: LifeBuoy },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-card">
      <SidebarHeader className="p-4 pb-3">
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--violet))] flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-sm text-foreground tracking-tight">Admin</span>
              <p className="text-[10px] text-muted-foreground -mt-0.5">Control Panel</p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {navGroups.map((group) => {
          const isGroupActive = group.items.some(
            (item) => item.url === "/admin"
              ? location.pathname === "/admin"
              : location.pathname.startsWith(item.url)
          );

          if (group.items.length === 1) {
            const item = group.items[0];
            const active = item.url === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.url);
            return (
              <SidebarGroup key={group.label} className="py-0.5">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={active} className={active ? "bg-primary/10 text-primary font-semibold border border-primary/15 shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"}>
                      <NavLink to={item.url} end={item.url === "/admin"} className="rounded-xl">
                        <item.icon className="h-4 w-4" style={{ strokeWidth: 2.2 }} />
                        {!collapsed && <span className="text-[13px]">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            );
          }

          if (collapsed) {
            return (
              <SidebarGroup key={group.label} className="py-0.5">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const active = location.pathname.startsWith(item.url) && (item.url !== "/admin" || location.pathname === "/admin");
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={active} className={active ? "bg-primary/10 text-primary" : "text-muted-foreground"}>
                            <NavLink to={item.url} end={item.url === "/admin"}>
                              <item.icon className="h-4 w-4" style={{ strokeWidth: 2.2 }} />
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          return (
            <Collapsible key={group.label} defaultOpen={isGroupActive} className="group/collapsible">
              <SidebarGroup className="py-0.5">
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:text-foreground transition-colors flex items-center justify-between pr-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70 mb-0.5">
                    <span>{group.label}</span>
                    <ChevronRight className="h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const active = location.pathname.startsWith(item.url) && (item.url !== "/admin" || location.pathname === "/admin");
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={active} className={active ? "bg-primary/10 text-primary font-semibold border border-primary/15 shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"}>
                              <NavLink to={item.url} end={item.url === "/admin"} className="rounded-xl">
                                <item.icon className="h-4 w-4" style={{ strokeWidth: 2.2 }} />
                                <span className="text-[13px]">{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/40">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl">
              <Link to="/app">
                <ArrowLeft className="h-4 w-4" style={{ strokeWidth: 2.2 }} />
                {!collapsed && <span className="text-[13px]">Back to App</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
