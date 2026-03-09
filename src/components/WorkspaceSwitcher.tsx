import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Building2, ChevronDown, Check, Plus, Briefcase } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  const { activeWorkspace, allWorkspaces, isAccountingFirm, clientWorkspaces, switchWorkspace } = useWorkspace();
  const navigate = useNavigate();

  // Only show switcher for accounting firms with multiple workspaces
  if (!isAccountingFirm && allWorkspaces.length <= 1) return null;

  const homeWorkspace = allWorkspaces.find(
    (w) => w.workspace_type === "accounting_firm" || w.workspace_type === "standard"
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 w-full rounded-lg px-2.5 py-2 hover:bg-accent/50 transition-colors focus:outline-none border border-border/60 bg-card/50">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            {activeWorkspace?.workspace_type === "client" ? (
              <Briefcase className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Building2 className="h-3.5 w-3.5 text-primary" />
            )}
          </div>
          {!compact && (
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-[12px] font-semibold text-foreground truncate">
                {activeWorkspace?.name || "Select workspace"}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {activeWorkspace?.workspace_type === "client" ? "Client workspace" :
                 activeWorkspace?.workspace_type === "accounting_firm" ? "Firm workspace" :
                 "Workspace"}
              </span>
            </div>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {/* Firm / Home workspace */}
        {homeWorkspace && (
          <>
            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium px-3 py-1.5">
              {isAccountingFirm ? "Firm" : "Workspace"}
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => switchWorkspace(homeWorkspace.id)}
              className="px-3 min-h-[40px]"
            >
              <Building2 className="h-3.5 w-3.5 mr-2 shrink-0" />
              <span className="text-[13px] truncate flex-1">{homeWorkspace.name}</span>
              {activeWorkspace?.id === homeWorkspace.id && (
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
            </DropdownMenuItem>
          </>
        )}

        {/* Client workspaces */}
        {clientWorkspaces.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium px-3 py-1.5">
              Client Workspaces ({clientWorkspaces.length})
            </DropdownMenuLabel>
            {clientWorkspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => switchWorkspace(ws.id)}
                className="px-3 min-h-[40px]"
              >
                <Briefcase className="h-3.5 w-3.5 mr-2 shrink-0 text-muted-foreground" />
                <span className="text-[13px] truncate flex-1">{ws.name}</span>
                {activeWorkspace?.id === ws.id && (
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Manage workspaces link */}
        {isAccountingFirm && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate("/app/workspaces")}
              className="px-3 min-h-[40px]"
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              <span className="text-[13px]">Manage Client Workspaces</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
