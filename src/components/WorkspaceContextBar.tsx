import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useNavigate } from "react-router-dom";
import { Building2, Briefcase, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function WorkspaceContextBar() {
  const { activeWorkspace, allWorkspaces, isAccountingFirm } = useWorkspace();
  const navigate = useNavigate();

  // Only show for accounting firms viewing a client workspace
  if (!isAccountingFirm || !activeWorkspace) return null;

  const isClientWs = activeWorkspace.workspace_type === "client";
  if (!isClientWs) return null;

  const firmOrg = allWorkspaces.find(
    (w) => w.workspace_type === "accounting_firm"
  );

  return (
    <div className="shrink-0 bg-primary/5 border-b border-primary/10 px-4 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Breadcrumb: Firm > Client */}
          <button
            onClick={() => navigate("/app/workspaces")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium hidden sm:inline">{firmOrg?.name || "Firm"}</span>
          </button>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <Briefcase className="h-3.5 w-3.5 text-foreground shrink-0" />
            <span className="text-xs font-semibold text-foreground truncate">
              {activeWorkspace.name}
            </span>
            {activeWorkspace.trading_name && (
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                ({activeWorkspace.trading_name})
              </span>
            )}
          </div>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/20 text-primary shrink-0">
            Client
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => navigate("/app/workspaces")}
        >
          <ArrowLeft className="h-3 w-3" />
          <span className="hidden sm:inline">Back to Firm</span>
        </Button>
      </div>
    </div>
  );
}
