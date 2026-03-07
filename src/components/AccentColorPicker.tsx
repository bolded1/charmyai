import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, RotateCcw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { isValidHex, generateColorVariations, applyAccentColor, DEFAULT_ACCENT_COLOR, PRESET_COLORS } from "@/lib/color-utils";

interface AccentColorPickerProps {
  currentColor: string;
  onSave: (hex: string) => Promise<void>;
}

export function AccentColorPicker({ currentColor, onSave }: AccentColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(currentColor || DEFAULT_ACCENT_COLOR);
  const [hexInput, setHexInput] = useState(currentColor || DEFAULT_ACCENT_COLOR);
  const [hexError, setHexError] = useState("");
  const [saving, setSaving] = useState(false);
  const hasChanges = selectedColor !== (currentColor || DEFAULT_ACCENT_COLOR);

  // Sync when currentColor changes (e.g. org loads)
  useEffect(() => {
    if (currentColor) {
      setSelectedColor(currentColor);
      setHexInput(currentColor);
    }
  }, [currentColor]);

  const handleColorPickerChange = (hex: string) => {
    const upper = hex.toUpperCase();
    setSelectedColor(upper);
    setHexInput(upper);
    setHexError("");
    applyAccentColor(upper); // live preview
  };

  const handleHexInputChange = (value: string) => {
    setHexInput(value);
    const normalized = value.startsWith("#") ? value : `#${value}`;
    if (isValidHex(normalized)) {
      const upper = normalized.toUpperCase();
      setSelectedColor(upper);
      setHexError("");
      applyAccentColor(upper);
    } else if (value.length > 0) {
      setHexError("Invalid HEX color");
    }
  };

  const handlePresetClick = (hex: string) => {
    handleColorPickerChange(hex);
  };

  const handleReset = () => {
    handleColorPickerChange(DEFAULT_ACCENT_COLOR);
  };

  const handleSave = async () => {
    if (!isValidHex(selectedColor)) {
      toast.error("Please enter a valid color.");
      return;
    }
    setSaving(true);
    try {
      await onSave(selectedColor);
      toast.success("Accent color saved!");
    } catch {
      toast.error("Failed to save color.");
    } finally {
      setSaving(false);
    }
  };

  const vars = generateColorVariations(selectedColor);

  return (
    <div className="space-y-5">
      {/* Color picker + HEX input */}
      <div className="flex flex-wrap items-start gap-5">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Color Picker</Label>
          <input
            type="color"
            value={selectedColor.length === 7 ? selectedColor : DEFAULT_ACCENT_COLOR}
            onChange={(e) => handleColorPickerChange(e.target.value)}
            className="h-20 w-20 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
            style={{ WebkitAppearance: "none" }}
          />
        </div>

        <div className="space-y-2 flex-1 min-w-[180px]">
          <Label className="text-xs font-medium text-muted-foreground">HEX Value</Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                value={hexInput}
                onChange={(e) => handleHexInputChange(e.target.value)}
                placeholder="#2563EB"
                className={`font-mono text-sm ${hexError ? "border-destructive" : ""}`}
                maxLength={7}
              />
              {hexError && (
                <div className="flex items-center gap-1 mt-1 text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-[11px]">{hexError}</span>
                </div>
              )}
            </div>
            <div
              className="h-9 w-9 rounded-md border border-border shrink-0"
              style={{ backgroundColor: isValidHex(selectedColor) ? selectedColor : "#ccc" }}
            />
          </div>
        </div>
      </div>

      {/* Preset colors */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Quick Presets</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.hex}
              onClick={() => handlePresetClick(preset.hex)}
              className="group flex flex-col items-center gap-1"
              title={preset.name}
            >
              <div className="relative">
                <div
                  className={`h-8 w-8 rounded-full transition-all ${
                    selectedColor === preset.hex
                      ? "ring-2 ring-offset-2 ring-offset-background scale-105"
                      : "hover:scale-110"
                  }`}
                  style={{
                    backgroundColor: preset.hex,
                    ...(selectedColor === preset.hex ? { "--tw-ring-color": preset.hex } as React.CSSProperties : {}),
                  }}
                />
                {selectedColor === preset.hex && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>
              <span className={`text-[9px] ${selectedColor === preset.hex ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Live preview */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-3 block">Preview</Label>
        <div className="rounded-lg border border-border overflow-hidden bg-background p-4">
          <div className="flex gap-3">
            {/* Sidebar preview */}
            <div className="w-24 shrink-0 rounded-md bg-sidebar p-2 space-y-1">
              <div className="h-5 rounded-sm px-2 flex items-center" style={{ backgroundColor: `hsl(${vars.soft})` }}>
                <span className="text-[9px] font-medium" style={{ color: `hsl(${vars.primary})` }}>Dashboard</span>
              </div>
              <div className="h-5 rounded-sm px-2 flex items-center">
                <span className="text-[9px] text-sidebar-foreground">Documents</span>
              </div>
              <div className="h-5 rounded-sm px-2 flex items-center">
                <span className="text-[9px] text-sidebar-foreground">Expenses</span>
              </div>
            </div>
            {/* Content preview */}
            <div className="flex-1 space-y-2">
              <div className="rounded-md border border-border bg-card p-3">
                <span className="text-xs font-medium">Card Title</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">This is how cards will look.</p>
              </div>
              <div className="flex gap-2">
                <div className="h-6 px-3 rounded-md flex items-center" style={{ backgroundColor: `hsl(${vars.primary})` }}>
                  <span className="text-[9px] font-medium text-white">Primary</span>
                </div>
                <div className="h-6 px-3 rounded-md border border-border bg-card flex items-center">
                  <span className="text-[9px] text-foreground">Secondary</span>
                </div>
                <div className="h-6 px-3 rounded-md flex items-center" style={{ backgroundColor: `hsl(${vars.primary} / 0.1)` }}>
                  <span className="text-[9px] font-medium" style={{ color: `hsl(${vars.primary})` }}>Soft</span>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <a className="text-[10px] underline" style={{ color: `hsl(${vars.primary})` }}>Link color</a>
                <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-3/4 rounded-full" style={{ backgroundColor: `hsl(${vars.primary})` }} />
                </div>
                <div className="h-3 w-3 rounded-sm border-2" style={{ borderColor: `hsl(${vars.primary})`, backgroundColor: `hsl(${vars.primary})` }}>
                  <Check className="h-2 w-2 text-white" />
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="success" className="text-[9px] h-4 px-1.5">Success</Badge>
                <Badge variant="warning" className="text-[9px] h-4 px-1.5">Warning</Badge>
                <Badge variant="info" className="text-[9px] h-4 px-1.5">Info</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <Button onClick={handleSave} disabled={!hasChanges || saving || !!hexError} size="sm">
          {saving ? "Saving..." : "Save Color"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset} disabled={selectedColor === DEFAULT_ACCENT_COLOR}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset to Default
        </Button>
        {hasChanges && (
          <span className="text-[11px] text-muted-foreground">Unsaved changes</span>
        )}
      </div>
    </div>
  );
}
