import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";
import { ChevronDown, Shield, ArrowLeft } from "lucide-react";
import {
  LayoutDashboard, Building2, Users, FileText, BarChart3, TrendingUp, Activity, HardDrive,
  CreditCard, ScrollText, Cog, LifeBuoy, Sparkles, PenLine, Mail, Megaphone,
  KeyRound, UserX, MessageSquareHeart, ToggleLeft, HeartPulse, Clock,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface NavGroup {
  label: string;
  items: { title: string; url: string; icon: React.ElementType }[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Users & Access",
    items: [
      { title: "Organizations", url: "/admin/organizations", icon: Building2 },
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Login Activity", url: "/admin/login-activity", icon: KeyRound },
      { title: "GDPR / Data", url: "/admin/gdpr", icon: UserX },
    ],
  },
  {
    label: "Documents & Data",
    items: [
      { title: "Documents", url: "/admin/documents", icon: FileText },
      { title: "Doc Processing", url: "/admin/document-stats", icon: Activity },
      { title: "Storage", url: "/admin/storage", icon: HardDrive },
    ],
  },
  {
    label: "Analytics & Revenue",
    items: [
      { title: "Usage & Activity", url: "/admin/usage", icon: BarChart3 },
      { title: "Subscriptions", url: "/admin/subscriptions", icon: CreditCard },
      { title: "Revenue", url: "/admin/revenue", icon: TrendingUp },
      { title: "User Feedback", url: "/admin/feedback", icon: MessageSquareHeart },
    ],
  },
  {
    label: "Content & Comms",
    items: [
      { title: "Page Content", url: "/admin/cms", icon: PenLine },
      { title: "Email Templates", url: "/admin/email-templates", icon: Mail },
      { title: "Broadcast", url: "/admin/broadcast", icon: Megaphone },
      { title: "Demo Upload", url: "/admin/demo-settings", icon: Sparkles },
    ],
  },
  {
    label: "System & Ops",
    items: [
      { title: "System Health", url: "/admin/system-health", icon: HeartPulse },
      { title: "Feature Flags", url: "/admin/feature-flags", icon: ToggleLeft },
      { title: "Scheduled Jobs", url: "/admin/scheduled-jobs", icon: Clock },
      { title: "Audit Logs", url: "/admin/audit", icon: ScrollText },
      { title: "System Settings", url: "/admin/settings", icon: Cog },
    ],
  },
  {
    label: "Help",
    items: [
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
