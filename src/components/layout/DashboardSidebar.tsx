import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Upload, FileText, Receipt, TrendingUp, Users2,
  Download, UsersRound, Settings, LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLayoutSettings } from "@/hooks/useLayoutSettings";

const financeItems = [
  { title: "Capture", url: "/app", icon: Upload },
  { title: "Documents", url: "/app/documents", icon: FileText },
];

const recordsItems = [
  { title: "Expenses", url: "/app/expenses", icon: Receipt },
  { title: "Income", url: "/app/income", icon: TrendingUp },
  { title: "Contacts", url: "/app/contacts", icon: Users2 },
  { title: "Exports", url: "/app/exports", icon: Download },
];

const systemItems = [
  { title: "Team", url: "/app/team", icon: UsersRound },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useLayoutSettings();
  const showLabels = settings.showSidebarLabels && !collapsed;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const renderGroup = (label: string, items: typeof financeItems) => (
    <SidebarGroup className="py-1">
      {!collapsed && (
        <SidebarGroupLabel className="text-[10px] font-medium uppercase tracking-[0.08em] text-sidebar-muted px-2.5 mb-0.5 h-6">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                <NavLink to={item.url} end={item.url === '/app'}>
                  <item.icon className="h-3.5 w-3.5" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link to="/app" className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md bg-hero-gradient flex items-center justify-center shrink-0">
            <FileText className="h-3 w-3 text-white" />
          </div>
          {!collapsed && <span className="font-semibold text-[13px] text-sidebar-accent-foreground">DocuLedger</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-1.5 pt-1">
        {renderGroup("Documents", financeItems)}
        {renderGroup("Finance", recordsItems)}
        {renderGroup("System", systemItems)}
      </SidebarContent>
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="text-sidebar-muted hover:text-sidebar-accent-foreground">
              <LogOut className="h-3.5 w-3.5" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
