import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
];

interface LanguageSwitcherProps {
  variant?: "ghost" | "outline" | "minimal";
  className?: string;
}

export function LanguageSwitcher({ variant = "ghost", className = "" }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    // Also persist to profile language field via localStorage
    localStorage.setItem("charmy-language", code);
    document.documentElement.lang = code;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant === "minimal" ? "ghost" : variant} size="sm" className={`h-8 px-2.5 gap-1.5 text-[13px] ${className}`}>
          <Globe className="h-3.5 w-3.5" />
          <span className="uppercase font-semibold">{currentLang.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className={`gap-2.5 ${lang.code === i18n.language ? "bg-primary/10 text-primary font-semibold" : ""}`}
          >
            <span className="text-base">{lang.flag}</span>
            <span className="text-[13px]">{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
