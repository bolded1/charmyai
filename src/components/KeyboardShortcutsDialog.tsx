import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shortcut, formatShortcut } from "@/hooks/useKeyboardShortcuts";
import { Separator } from "@/components/ui/separator";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: Shortcut[];
}

export function KeyboardShortcutsDialog({ open, onOpenChange, shortcuts }: Props) {
  const groups = shortcuts.reduce<Record<string, Shortcut[]>>((acc, s) => {
    (acc[s.group] ??= []).push(s);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {Object.entries(groups).map(([group, items], gi) => (
            <div key={group}>
              {gi > 0 && <Separator className="mb-4" />}
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2">{group}</p>
              <div className="space-y-1">
                {items.map((s) => (
                  <div key={s.key + s.group} className="flex items-center justify-between py-1.5 px-1 rounded hover:bg-accent/40 transition-colors">
                    <span className="text-sm text-foreground">{s.label}</span>
                    <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                      {formatShortcut(s)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
