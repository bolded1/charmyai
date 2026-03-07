import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { useSaasLogo } from "@/hooks/useSaasLogo";

interface SaasLogoProps {
  size?: "sm" | "md" | "lg";
  asLink?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: "h-8 w-8", iconInner: "h-4 w-4", text: "text-lg", img: "h-8" },
  md: { icon: "h-10 w-10", iconInner: "h-5 w-5", text: "text-xl", img: "h-10" },
  lg: { icon: "h-12 w-12", iconInner: "h-6 w-6", text: "text-2xl", img: "h-12" },
};

export function SaasLogo({ size = "md", asLink = true, className = "" }: SaasLogoProps) {
  const logo = useSaasLogo();
  const s = sizes[size];

  const content = logo ? (
    <img src={logo} alt="Charmy" className={`${s.img} max-w-[12rem] object-contain`} />
  ) : (
    <>
      <div className={`${s.icon} rounded-lg bg-hero-gradient flex items-center justify-center`}>
        <FileText className={`${s.iconInner} text-primary-foreground`} />
      </div>
      <span className="text-foreground">Charmy</span>
    </>
  );

  if (asLink) {
    return (
      <Link to="/" className={`inline-flex items-center gap-2 font-bold ${s.text} ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 font-bold ${s.text} ${className}`}>
      {content}
    </div>
  );
}
