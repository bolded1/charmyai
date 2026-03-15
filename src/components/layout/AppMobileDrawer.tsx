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
    { title: t("navigation.team"), url: "/app/team", icon: UsersRound },
  ];

  const systemItems = [
    { title: t("navigation.documentRequests"), url: "/app/document-requests", icon: Link2 },
    { title: t("navigation.aiAssistant"), url: "/app/assistant", icon: Sparkles },
    { title: t("navigation.settings"), url: "/app/settings", icon: Settings },
    { title: t("navigation.support"), url: "/app/support", icon: LifeBuoy },
    { title: t("navigation.help"), url: "/app/help", icon: HelpCircle },
  ];

  const renderSection = (label: string, items: typeof documentItems) => (
    <div className="mb-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground px-3 py-1.5">
        {label}
      </p>
      {items.map((item) => (
        <NavLink
          key={item.url}
          to={item.url}
          end={item.url === "/app"}
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px]"
          activeClassName="bg-accent text-accent-foreground"
        >
          <item.icon className="h-4.5 w-4.5 shrink-0" />
          <span>{item.title}</span>
        </NavLink>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        {brandLogo ? (
          <img src={brandLogo} alt="Logo" className="h-8 max-w-[8rem] object-contain" />
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-hero-gradient flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm">Charmy</span>
          </div>
        )}
      </div>
      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        {renderSection(t("sidebarGroups.documents"), documentItems)}
        {renderSection(t("sidebarGroups.finance"), financeItems)}
        {!isClient && isAccountingFirm && renderSection(t("sidebarGroups.firm"), firmItems)}
        {renderSection(t("sidebarGroups.system"), systemItems)}
      </nav>
    </div>
  );
}
