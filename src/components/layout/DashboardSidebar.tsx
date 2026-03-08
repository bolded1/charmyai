import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Upload, FileText, Receipt, TrendingUp,
  Download, UsersRound, Settings, LogOut, HelpCircle, LifeBuoy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLayoutSettings } from "@/hooks/useLayoutSettings";
import { useBrandLogo } from "@/hooks/useBrandLogo";

const financeItems = [
  { title: "Capture", url: "/app", icon: Upload },
  { title: "Documents", url: "/app/documents", icon: FileText },
];

const recordsItems = [
  { title: "Expenses", url: "/app/expenses", icon: Receipt },
  { title: "Income", url: "/app/income", icon: TrendingUp },
  
  { title: "Exports", url: "/app/exports", icon: Download },
];

const systemItems = [
  { title: "Team", url: "/app/team", icon: UsersRound },
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
                  {showLabels && <span className="font-medium">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="none">
      <SidebarHeader className="px-3 py-4">
        <Link to="/app" className="flex items-center gap-2.5">
          {brandLogo ? (
            <img src={brandLogo} alt="Logo" className="h-10 max-w-[9rem] object-contain shrink-0" />
          ) : (
            <div className="h-7 w-7 rounded-lg bg-hero-gradient flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
              <FileText className="h-3.5 w-3.5 text-white" />
            </div>
          )}
          {showLabels && !brandLogo && <span className="font-bold text-[13px] text-gradient">Charmy</span>}
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
              <LogOut className="h-3.5 w-3.5" strokeWidth={2.5} />
              {showLabels && <span className="font-medium">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
