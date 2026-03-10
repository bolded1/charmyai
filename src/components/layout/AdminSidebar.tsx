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
  KeyRound, UserX, MessageSquareHeart, ToggleLeft, HeartPulse, Clock, Brain, MailPlus, Tag, Briefcase,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { t } = useTranslation();

  const navGroups = [
    {
      label: t("admin.overview"),
      items: [
        { title: t("admin.dashboard"), url: "/admin", icon: LayoutDashboard },
      ],
    },
    {
      label: t("admin.usersAccess"),
      items: [
        { title: t("admin.organizations"), url: "/admin/organizations", icon: Building2 },
        { title: t("admin.firmAccounts"), url: "/admin/firm-accounts", icon: Briefcase },
        { title: t("admin.users"), url: "/admin/users", icon: Users },
        { title: t("admin.loginActivity"), url: "/admin/login-activity", icon: KeyRound },
        { title: t("admin.gdprData"), url: "/admin/gdpr", icon: UserX },
      ],
    },
    {
      label: t("admin.documentsData"),
      items: [
        { title: t("admin.documents"), url: "/admin/documents", icon: FileText },
        { title: t("admin.docProcessing"), url: "/admin/document-stats", icon: Activity },
        { title: t("admin.storage"), url: "/admin/storage", icon: HardDrive },
      ],
    },
    {
      label: t("admin.analyticsRevenue"),
      items: [
        { title: t("admin.usageActivity"), url: "/admin/usage", icon: BarChart3 },
        { title: t("admin.subscriptions"), url: "/admin/subscriptions", icon: CreditCard },
        { title: t("admin.promoCodes"), url: "/admin/promo-codes", icon: Tag },
        { title: t("admin.revenue"), url: "/admin/revenue", icon: TrendingUp },
        { title: t("admin.userFeedback"), url: "/admin/feedback", icon: MessageSquareHeart },
      ],
    },
    {
      label: t("admin.contentComms"),
      items: [
        { title: t("admin.emailTemplates"), url: "/admin/email-templates", icon: Mail },
        { title: t("admin.broadcast"), url: "/admin/broadcast", icon: Megaphone },
        { title: t("admin.demoSettings"), url: "/admin/demo-settings", icon: Sparkles },
        { title: t("admin.marketingEmail"), url: "/admin/marketing-email", icon: MailPlus },
      ],
    },
    {
      label: t("admin.systemOps"),
      items: [
        { title: t("admin.systemHealth"), url: "/admin/system-health", icon: HeartPulse },
        { title: t("admin.aiSettings"), url: "/admin/ai-settings", icon: Brain },
        { title: t("admin.featureFlags"), url: "/admin/feature-flags", icon: ToggleLeft },
        { title: t("admin.scheduledJobs"), url: "/admin/scheduled-jobs", icon: Clock },
        { title: t("admin.auditLogs"), url: "/admin/audit", icon: ScrollText },
        { title: t("admin.systemSettings"), url: "/admin/settings", icon: Cog },
      ],
    },
    {
      label: t("admin.help"),
      items: [
        { title: t("admin.support"), url: "/admin/support", icon: LifeBuoy },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-card">
      <SidebarHeader className="p-4 pb-3">
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--violet))] flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-sm text-foreground tracking-tight">{t("admin.title")}</span>
              <p className="text-[10px] text-muted-foreground -mt-0.5">{t("admin.controlPanel")}</p>
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
                    <SidebarMenuButton asChild isActive={active} className={active ? "bg-primary/10 text-primary font-bold border border-primary/15 shadow-sm" : "text-foreground hover:text-foreground hover:bg-muted/60"}>
                      <NavLink to={item.url} end={item.url === "/admin"} className="rounded-xl">
                        <item.icon className="h-4 w-4" style={{ strokeWidth: 2.2 }} />
                        {!collapsed && <span className="text-[11.5px] font-semibold">{item.title}</span>}
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
                          <SidebarMenuButton asChild isActive={active} className={active ? "bg-primary/10 text-primary" : "text-foreground"}>
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
                  <SidebarGroupLabel className="cursor-pointer hover:text-foreground transition-colors flex items-center justify-between pr-2 text-[11px] font-semibold tracking-normal text-foreground mb-0.5">
                    <span>{group.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const active = location.pathname.startsWith(item.url) && (item.url !== "/admin" || location.pathname === "/admin");
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={active} className={active ? "bg-primary/10 text-primary font-bold border border-primary/15 shadow-sm" : "text-foreground hover:text-foreground hover:bg-muted/60"}>
                              <NavLink to={item.url} end={item.url === "/admin"} className="rounded-xl">
                                <item.icon className="h-4 w-4" style={{ strokeWidth: 2.2 }} />
                                <span className="text-[11.5px] font-semibold">{item.title}</span>
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

      <SidebarFooter className="p-3 border-t border-border/40 space-y-2">
        {!collapsed && (
          <div className="flex justify-center">
            <LanguageSwitcher variant="ghost" />
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-foreground/80 hover:text-foreground hover:bg-muted/60 rounded-xl">
              <Link to="/app" className="text-foreground hover:text-foreground hover:bg-muted/60 rounded-xl">
                <ArrowLeft className="h-4 w-4" style={{ strokeWidth: 2.2 }} />
                {!collapsed && <span className="text-[11.5px] font-semibold">{t("navigation.backToApp")}</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
