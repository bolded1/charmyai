import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface MobileCardField {
  label: string;
  value: React.ReactNode;
}

interface ResponsiveTableProps<T> {
  data: T[];
  desktopTable: React.ReactNode;
  mobileCardRenderer: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;
  loadingElement?: React.ReactNode;
}

export function ResponsiveTable<T>({
  data,
  desktopTable,
  mobileCardRenderer,
  emptyMessage = "No records found.",
  isLoading,
  loadingElement,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (isLoading && loadingElement) return <>{loadingElement}</>;

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-2">
        {data.map((item, i) => mobileCardRenderer(item, i))}
      </div>
    );
  }

  return <>{desktopTable}</>;
}

// Helper component for rendering a standard mobile card
interface MobileRecordCardProps {
  title: string;
  subtitle?: string;
  fields: MobileCardField[];
  badge?: { label: string; className?: string };
  onClick?: () => void;
  actions?: React.ReactNode;
}

export function MobileRecordCard({ title, subtitle, fields, badge, onClick, actions }: MobileRecordCardProps) {
  return (
    <Card className="cursor-pointer active:bg-accent/30 transition-colors" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium break-words">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {badge && (
              <Badge variant="secondary" className={`text-[10px] capitalize ${badge.className || ""}`}>
                {badge.label}
              </Badge>
            )}
            {actions}
          </div>
        </div>
        {fields.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
            {fields.map((field) => (
              <div key={field.label} className="min-w-0">
                <p className="text-[10px] text-muted-foreground">{field.label}</p>
                <p className="text-xs font-medium truncate">{field.value}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
