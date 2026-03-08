import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, FileText, BarChart3,
  CreditCard, ScrollText, Cog, LifeBuoy, Shield, ArrowLeft, Sparkles, PenLine, Mail, Megaphone,
} from "lucide-react";
} from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Organizations", url: "/admin/organizations", icon: Building2 },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Documents", url: "/admin/documents", icon: FileText },
  { title: "Usage & Activity", url: "/admin/usage", icon: BarChart3 },
  { title: "Subscriptions", url: "/admin/subscriptions", icon: CreditCard },
  { title: "Audit Logs", url: "/admin/audit", icon: ScrollText },
  { title: "System Settings", url: "/admin/settings", icon: Cog },
  { title: "Demo Upload", url: "/admin/demo-settings", icon: Sparkles },
  { title: "Page Content", url: "/admin/cms", icon: PenLine },
  { title: "Email Templates", url: "/admin/email-templates", icon: Mail },
  { title: "Support", url: "/admin/support", icon: LifeBuoy },
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
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end={item.url === '/admin'}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
