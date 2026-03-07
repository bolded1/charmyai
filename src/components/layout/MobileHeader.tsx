import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Upload, Camera, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useBrandLogo } from "@/hooks/useBrandLogo";

interface MobileHeaderProps {
  pageTitle: string;
  drawerContent: React.ReactNode;
  profileMenu?: React.ReactNode;
  showQuickActions?: boolean;
}

export function MobileHeader({ pageTitle, drawerContent, profileMenu, showQuickActions }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);
  const brandLogo = useBrandLogo();
  const navigate = useNavigate();

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-3 shrink-0 md:hidden">
      <div className="flex items-center gap-2 min-w-0">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0" onClick={(e) => {
            // Close drawer on nav link click
            if ((e.target as HTMLElement).closest('a')) setOpen(false);
          }}>
            {drawerContent}
          </SheetContent>
        </Sheet>

        {brandLogo ? (
          <img src={brandLogo} alt="Logo" className="h-7 max-w-[5rem] object-contain shrink-0" />
        ) : (
          <div className="h-6 w-6 rounded-md bg-hero-gradient flex items-center justify-center shrink-0">
            <FileText className="h-3 w-3 text-white" />
          </div>
        )}

        <span className="text-sm font-medium text-foreground truncate">{pageTitle}</span>
      </div>

      <div className="flex items-center gap-1">
        {showQuickActions && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden"
              onClick={() => { navigate("/app"); document.getElementById("camera-input")?.click(); }}
            >
              <Camera className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden"
              onClick={() => navigate("/app")}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </>
        )}
        {profileMenu}
      </div>
    </header>
  );
}
