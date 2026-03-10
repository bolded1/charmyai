import { NavLink } from "@/components/NavLink";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { useTranslation } from "react-i18next";
import {
  Upload, FileText, Receipt, TrendingUp, Tag,
  Download, UsersRound, Settings,
} from "lucide-react";

export function AppMobileDrawer() {
  const brandLogo = useBrandLogo();
  const { t } = useTranslation();

  const navItems = [
    { title: t("navigation.capture"), url: "/app", icon: Upload },
    { title: t("navigation.documents"), url: "/app/documents", icon: FileText },
    { title: t("navigation.expenses"), url: "/app/expenses", icon: Receipt },
    { title: t("navigation.income"), url: "/app/income", icon: TrendingUp },
    { title: t("navigation.categories"), url: "/app/categories", icon: Tag },
    { title: t("navigation.exports"), url: "/app/exports", icon: Download },
    { title: t("navigation.team"), url: "/app/team", icon: UsersRound },
    { title: t("navigation.settings"), url: "/app/settings", icon: Settings },
  ];

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
        {navItems.map((item) => (
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
      </nav>
    </div>
  );
}
