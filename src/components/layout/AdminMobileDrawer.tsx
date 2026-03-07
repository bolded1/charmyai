import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";
import { ChevronDown, Shield, ArrowLeft } from "lucide-react";
import {
  LayoutDashboard, Building2, Users, FileText, BarChart3,
  CreditCard, ScrollText, Cog, LifeBuoy, Sparkles,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface NavGroup {
  label: string;
  items: { title: string; url: string; icon: React.ElementType }[];
}

const navGroups: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
      { title: "Organizations", url: "/admin/organizations", icon: Building2 },
      { title: "Users", url: "/admin/users", icon: Users },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Documents", url: "/admin/documents", icon: FileText },
      { title: "Usage & Activity", url: "/admin/usage", icon: BarChart3 },
      { title: "Audit Logs", url: "/admin/audit", icon: ScrollText },
    ],
  },
  {
    label: "Billing",
    items: [
      { title: "Subscriptions", url: "/admin/subscriptions", icon: CreditCard },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", url: "/admin/settings", icon: Cog },
      { title: "Demo Upload", url: "/admin/demo-settings", icon: Sparkles },
      { title: "Support", url: "/admin/support", icon: LifeBuoy },
    ],
  },
];

export function AdminMobileDrawer() {
  return (
    <div className="flex flex-col h-full">
      {/* Drawer Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Shield className="h-3.5 w-3.5 text-destructive" />
          </div>
          <span className="font-bold text-sm">Admin Panel</span>
        </div>
      </div>

      {/* Grouped Nav */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto space-y-1">
        {navGroups.map((group) => (
          <CollapsibleGroup key={group.label} group={group} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <Link
          to="/app"
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to App</span>
        </Link>
      </div>
    </div>
  );
}

function CollapsibleGroup({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground transition-colors">
        {group.label}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {group.items.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/admin"}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px]"
            activeClassName="bg-accent text-accent-foreground"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
