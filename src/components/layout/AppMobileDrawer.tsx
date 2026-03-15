import { NavLink } from "@/components/NavLink";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useClientRole } from "@/hooks/useClientRole";
import {
  Upload, FileText, Receipt, TrendingUp, Tag,
  Download, UsersRound, Settings, Sparkles, LifeBuoy,
  HelpCircle, BarChart3, Link2,
} from "lucide-react";

export function AppMobileDrawer() {
  const brandLogo = useBrandLogo();
  const { t } = useTranslation();
  const { isAccountingFirm, activeWorkspace } = useWorkspace();
  const { isClient } = useClientRole();

  const isClientContext = isAccountingFirm && activeWorkspace?.workspace_type === "client";

  const documentItems = [
    { title: t("navigation.capture"), url: "/app", icon: Upload },
    { title: t("navigation.documents"), url: "/app/documents", icon: FileText },
  ];

  const financeItems = [
    { title: t("navigation.expenses"), url: "/app/expenses", icon: Receipt },
    { title: t("navigation.income"), url: "/app/income", icon: TrendingUp },
    { title: t("navigation.categories"), url: "/app/categories", icon: Tag },
    { title: t("navigation.exports"), url: "/app/exports", icon: Download },
  ];

  const firmItems = [
    { title: t("navigation.firmDashboard"), url: "/app/workspaces", icon: BarChart3 },
    { title: t("navigation.documentRequests"), url: "/app/document-requests", icon: Link2 },
    { title: t("navigation.team"), url: "/app/team", icon: UsersRound },
    { title: t("navigation.documentRequests"), url: "/app/document-requests", icon: Link2 },
  ];

  const systemItems = [
    { title: t("navigation.aiAssistant"), url: "/app/assistant", icon: Sparkles },
    { title: t("navigation.settings"), url: "/app/settings", icon: Settings },
    { title: t("navigation.support"), url: "/app/support", icon: LifeBuoy },
    { title: t("navigation.help"), url: "/app/help", icon: HelpCircle },
  ];

  const renderSection = (label: string, items: typeof documentItems) => (
    <div className="mb-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-4 pt-4 pb-1.5">
        {label}
      </p>
      {items.map((item) => (
        <NavLink
          key={item.url}
          to={item.url}
          end={item.url === "/app"}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[15px] font-semibold text-foreground hover:bg-accent/60 transition-colors min-h-[44px] mx-1"
          activeClassName="bg-primary/10 text-primary"
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          <span>{item.title}</span>
        </NavLink>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-5 py-5 border-b border-border/50">
        {brandLogo ? (
          <img src={brandLogo} alt="Logo" className="h-8 max-w-[8rem] object-contain" />
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-hero-gradient flex items-center justify-center shadow-sm shadow-primary/20">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-base text-foreground tracking-tight">Charmy</span>
          </div>
        )}
      </div>
      <nav className="flex-1 py-1 overflow-y-auto">
        {renderSection(t("sidebarGroups.documents"), documentItems)}
        {renderSection(t("sidebarGroups.finance"), financeItems)}
        {!isClient && isAccountingFirm && renderSection(t("sidebarGroups.firm"), firmItems)}
        {renderSection(t("sidebarGroups.system"), systemItems)}
      </nav>
    </div>
  );
}
