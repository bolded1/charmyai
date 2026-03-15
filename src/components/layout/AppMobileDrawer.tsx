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

  const renderSection = (label: string, items: typeof documentItems, isLast = false) => (
    <div className={!isLast ? "pb-2 mb-2 border-b border-border/30" : "pb-2"}>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-5 pt-3 pb-1">
        {label}
      </p>
      {items.map((item) => (
        <NavLink
          key={item.url}
          to={item.url}
          end={item.url === "/app"}
          className="group flex items-center gap-3.5 px-5 py-2.5 text-[15px] font-medium text-foreground/80 hover:text-foreground hover:bg-accent/50 transition-all min-h-[44px]"
          activeClassName="text-primary font-semibold bg-primary/[0.06]"
        >
          <div className="h-8 w-8 rounded-lg bg-muted/50 group-hover:bg-accent flex items-center justify-center transition-colors shrink-0">
            <item.icon className="h-[16px] w-[16px] shrink-0" strokeWidth={2} />
          </div>
          <span>{item.title}</span>
        </NavLink>
      ))}
    </div>
  );

  const sections = [
    { label: t("sidebarGroups.documents"), items: documentItems },
    { label: t("sidebarGroups.finance"), items: financeItems },
    ...(!isClient && isAccountingFirm ? [{ label: t("sidebarGroups.firm"), items: firmItems }] : []),
    { label: t("sidebarGroups.system"), items: systemItems },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-5 pt-6 pb-5 border-b border-border/40">
        {brandLogo ? (
          <img src={brandLogo} alt="Logo" className="h-8 max-w-[8rem] object-contain" />
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-hero-gradient flex items-center justify-center shadow-md shadow-primary/20">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-foreground tracking-tight leading-none">Charmy</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t("common.documentManagement")}</p>
            </div>
          </div>
        )}
      </div>
      <nav className="flex-1 pt-2 overflow-y-auto">
        {sections.map((section, i) => renderSection(section.label, section.items, i === sections.length - 1))}
      </nav>
    </div>
  );
}
