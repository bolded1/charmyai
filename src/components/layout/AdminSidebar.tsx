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
    <Sidebar collapsible="icon" className="border-r-destructive/10">
      <SidebarHeader className="p-4">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-destructive" />
          </div>
          {!collapsed && <span className="font-bold text-sidebar-accent-foreground">Admin Panel</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => {
          const isGroupActive = group.items.some(
            (item) => item.url === "/admin"
              ? location.pathname === "/admin"
              : location.pathname.startsWith(item.url)
          );

          // Single-item groups don't need collapsible
          if (group.items.length === 1) {
            const item = group.items[0];
            return (
              <SidebarGroup key={group.label}>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={item.url === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.url)}>
                      <NavLink to={item.url} end={item.url === "/admin"}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            );
          }

          if (collapsed) {
            return (
              <SidebarGroup key={group.label}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.url) && (item.url !== "/admin" || location.pathname === "/admin")}>
                          <NavLink to={item.url} end={item.url === "/admin"}>
                            <item.icon className="h-4 w-4" />
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          return (
            <Collapsible key={group.label} defaultOpen={isGroupActive} className="group/collapsible">
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:text-foreground transition-colors flex items-center justify-between pr-2">
                    <span>{group.label}</span>
                    <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.url) && (item.url !== "/admin" || location.pathname === "/admin")}>
                            <NavLink to={item.url} end={item.url === "/admin"}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/app">
                <ArrowLeft className="h-4 w-4" />
                {!collapsed && <span>Back to App</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
