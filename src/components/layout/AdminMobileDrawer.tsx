import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";
import { ChevronDown, Shield, ArrowLeft } from "lucide-react";
import {
  LayoutDashboard, Building2, Users, FileText, BarChart3, TrendingUp, Activity, HardDrive,
  CreditCard, ScrollText, Cog, LifeBuoy, Sparkles, PenLine, Mail, Megaphone,
  KeyRound, UserX, MessageSquareHeart, ToggleLeft, HeartPulse, Clock, Tag, Brain, MailPlus, Briefcase,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface NavGroup {
  label: string;
  items: { title: string; url: string; icon: React.ElementType }[];
}

export function AdminMobileDrawer() {
  const { t } = useTranslation();

  const navGroups: NavGroup[] = [
    { label: t("admin.overview"), items: [{ title: t("admin.dashboard"), url: "/admin", icon: LayoutDashboard }] },
    { label: t("admin.usersAccess"), items: [
      { title: t("admin.organizations"), url: "/admin/organizations", icon: Building2 },
      { title: t("admin.firmAccounts"), url: "/admin/firm-accounts", icon: Briefcase },
      { title: t("admin.users"), url: "/admin/users", icon: Users },
      { title: t("admin.loginActivity"), url: "/admin/login-activity", icon: KeyRound },
      { title: t("admin.gdprData"), url: "/admin/gdpr", icon: UserX },
    ]},
    { label: t("admin.documentsData"), items: [
      { title: t("admin.documents"), url: "/admin/documents", icon: FileText },
      { title: t("admin.docProcessing"), url: "/admin/document-stats", icon: Activity },
      { title: t("admin.storage"), url: "/admin/storage", icon: HardDrive },
    ]},
    { label: t("admin.analyticsRevenue"), items: [
      { title: t("admin.usageActivity"), url: "/admin/usage", icon: BarChart3 },
      { title: t("admin.subscriptions"), url: "/admin/subscriptions", icon: CreditCard },
      { title: t("admin.promoCodes"), url: "/admin/promo-codes", icon: Tag },
      { title: t("admin.revenue"), url: "/admin/revenue", icon: TrendingUp },
      { title: t("admin.userFeedback"), url: "/admin/feedback", icon: MessageSquareHeart },
    ]},
    { label: t("admin.contentComms"), items: [
      { title: "Page Editor", url: "/admin/cms", icon: PenLine },
      { title: t("admin.emailTemplates"), url: "/admin/email-templates", icon: Mail },
      { title: t("admin.broadcast"), url: "/admin/broadcast", icon: Megaphone },
      { title: t("admin.demoSettings"), url: "/admin/demo-settings", icon: Sparkles },
      { title: t("admin.marketingEmail"), url: "/admin/marketing-email", icon: MailPlus },
    ]},
    { label: t("admin.systemOps"), items: [
      { title: t("admin.systemHealth"), url: "/admin/system-health", icon: HeartPulse },
      { title: t("admin.aiSettings"), url: "/admin/ai-settings", icon: Brain },
      { title: t("admin.featureFlags"), url: "/admin/feature-flags", icon: ToggleLeft },
      { title: t("admin.scheduledJobs"), url: "/admin/scheduled-jobs", icon: Clock },
      { title: t("admin.auditLogs"), url: "/admin/audit", icon: ScrollText },
      { title: t("admin.systemSettings"), url: "/admin/settings", icon: Cog },
    ]},
    { label: t("admin.help"), items: [{ title: t("admin.support"), url: "/admin/support", icon: LifeBuoy }] },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--violet))] flex items-center justify-center shadow-md shadow-primary/20">
            <Shield className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-sm text-foreground">{t("admin.title")}</span>
            <p className="text-[10px] text-muted-foreground -mt-0.5">{t("admin.controlPanel")}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-2 px-2 overflow-y-auto space-y-0.5">
        {navGroups.map((group) => (
          <CollapsibleGroup key={group.label} group={group} />
        ))}
      </nav>

      <div className="p-3 border-t border-border/40">
        <Link
          to="/app"
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" style={{ strokeWidth: 2.2 }} />
          <span>{t("navigation.backToApp")}</span>
        </Link>
      </div>
    </div>
  );
}

function CollapsibleGroup({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70 hover:text-foreground transition-colors">
        {group.label}
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {group.items.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/admin"}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors min-h-[44px]"
            activeClassName="bg-primary/10 text-primary font-semibold"
          >
            <item.icon className="h-4 w-4 shrink-0" style={{ strokeWidth: 2.2 }} />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
