import { useState, useMemo, useRef, useEffect } from "react";
import { useWorkspace, Workspace } from "@/contexts/WorkspaceContext";
import { Building2, ChevronDown, Check, Plus, Briefcase, Search, BarChart3, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useClientRole } from "@/hooks/useClientRole";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

export function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  const { activeWorkspace, allWorkspaces, isAccountingFirm, clientWorkspaces, switchWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const { isClient } = useClientRole();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide switcher entirely for client-role users
  if (isClient) return null;

  // Only show switcher for accounting firms with multiple workspaces
  if (!isAccountingFirm && allWorkspaces.length <= 1) return null;

  const homeWorkspace = allWorkspaces.find(
    (w) => w.workspace_type === "accounting_firm" || w.workspace_type === "standard"
  );

  const filteredClients = clientWorkspaces.filter((ws) =>
    ws.name.toLowerCase().includes(search.toLowerCase()) ||
    (ws.trading_name && ws.trading_name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = async (ws: Workspace) => {
    await switchWorkspace(ws.id);
    setOpen(false);
    setSearch("");
  };

  const handleFirmDashboard = () => {
    if (homeWorkspace) switchWorkspace(homeWorkspace.id);
    navigate("/app/workspaces");
    setOpen(false);
    setSearch("");
  };

  // Determine display info for active workspace
  const isOnFirmWs = activeWorkspace?.workspace_type === "accounting_firm" || activeWorkspace?.workspace_type === "standard";
  const wsLabel = isOnFirmWs ? "Firm" : "Client";
  const wsName = activeWorkspace?.name || "Select workspace";

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 w-full rounded-xl px-2.5 py-2 hover:bg-accent/50 transition-colors focus:outline-none border border-border/60 bg-card/50 group">
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${isOnFirmWs ? "bg-primary/10" : "bg-accent"}`}>
            {isOnFirmWs ? (
              <Building2 className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
          {!compact && (
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-[12px] font-semibold text-foreground truncate leading-tight">
                {wsName}
              </span>
              <span className="text-[10px] text-muted-foreground truncate leading-tight">
                {wsLabel} workspace
              </span>
            </div>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" className="w-72 p-0" sideOffset={6}>
        {/* Search — only show if 4+ workspaces */}
        {clientWorkspaces.length >= 4 && (
          <div className="p-2 pb-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workspaces..."
                className="pl-8 h-8 text-xs border-border/60"
                autoFocus
              />
            </div>
          </div>
        )}

        <div className="max-h-[320px] overflow-y-auto p-1.5">
          {/* Firm dashboard entry */}
          {homeWorkspace && (
            <>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium px-2.5 py-1.5">
                {isAccountingFirm ? "Firm" : "Workspace"}
              </p>
              <button
                onClick={() => handleSelect(homeWorkspace)}
                className={`flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                  activeWorkspace?.id === homeWorkspace.id
                    ? "bg-primary/5 border border-primary/20"
                    : "hover:bg-accent/50"
                }`}
              >
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-foreground truncate">{homeWorkspace.name}</p>
                  <p className="text-[10px] text-muted-foreground">Firm workspace</p>
                </div>
                {activeWorkspace?.id === homeWorkspace.id && (
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
              </button>
            </>
          )}

          {/* Client workspaces */}
          {(search ? filteredClients : clientWorkspaces).length > 0 && (
            <>
              <Separator className="my-1.5" />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium px-2.5 py-1.5">
                Client Workspaces ({clientWorkspaces.length})
              </p>
              {(search ? filteredClients : clientWorkspaces).map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => handleSelect(ws)}
                  className={`flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                    activeWorkspace?.id === ws.id
                      ? "bg-primary/5 border border-primary/20"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <div className="h-7 w-7 rounded-md bg-accent flex items-center justify-center shrink-0">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-foreground truncate">{ws.name}</p>
                    {ws.trading_name && (
                      <p className="text-[10px] text-muted-foreground truncate">{ws.trading_name}</p>
                    )}
                  </div>
                  {activeWorkspace?.id === ws.id && (
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  )}
                </button>
              ))}
              {search && filteredClients.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No workspaces found</p>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {isAccountingFirm && (
          <>
            <Separator />
            <div className="p-1.5 space-y-0.5">
              <button
                onClick={handleFirmDashboard}
                className="flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-left hover:bg-accent/50 transition-colors"
              >
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[13px] text-foreground">Firm Dashboard</span>
              </button>
              <button
                onClick={() => { navigate("/app/workspaces"); setOpen(false); }}
                className="flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-left hover:bg-accent/50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                <span className="text-[13px] text-foreground">Create Workspace</span>
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
