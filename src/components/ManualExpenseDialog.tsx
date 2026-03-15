import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Car, Coffee, ShoppingCart, FileText } from "lucide-react";
import { CategorySelect } from "@/components/CategorySelect";
import { useCreateManualExpense, type ManualExpenseInput } from "@/hooks/useDocuments";
import { format } from "date-fns";

type ExpenseType = "general" | "mileage" | "per_diem" | "cash";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCurrency?: string;
}

const EXPENSE_TYPES: { value: ExpenseType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "general", label: "General", icon: <FileText className="h-4 w-4" />, description: "Regular business expense" },
  { value: "mileage", label: "Mileage", icon: <Car className="h-4 w-4" />, description: "Vehicle / travel distance" },
  { value: "per_diem", label: "Per Diem", icon: <Coffee className="h-4 w-4" />, description: "Daily allowance" },
  { value: "cash", label: "Cash", icon: <ShoppingCart className="h-4 w-4" />, description: "Cash or out-of-pocket" },
];

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD", "AUD", "SEK", "NOK", "DKK", "JPY"];

export function ManualExpenseDialog({ open, onOpenChange, defaultCurrency = "EUR" }: Props) {
  const createExpense = useCreateManualExpense();
  const today = format(new Date(), "yyyy-MM-dd");

  const [type, setType] = useState<ExpenseType>("general");

  // General / Cash fields
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(today);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [category, setCategory] = useState("");
  const [netAmount, setNetAmount] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");

  // Mileage fields
  const [distanceKm, setDistanceKm] = useState("");
  const [ratePerKm, setRatePerKm] = useState("0.30");

  // Per diem fields
  const [days, setDays] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [location, setLocation] = useState("");

  // Auto-compute total for mileage
  useEffect(() => {
    if (type === "mileage") {
      const dist = parseFloat(distanceKm) || 0;
      const rate = parseFloat(ratePerKm) || 0;
      const computed = (dist * rate).toFixed(2);
      setNetAmount(computed);
      setVatAmount("0.00");
      setTotalAmount(computed);
    }
  }, [type, distanceKm, ratePerKm]);

  // Auto-compute total for per diem
  useEffect(() => {
    if (type === "per_diem") {
      const d = parseFloat(days) || 0;
      const r = parseFloat(dailyRate) || 0;
      const computed = (d * r).toFixed(2);
      setNetAmount(computed);
      setVatAmount("0.00");
      setTotalAmount(computed);
    }
  }, [type, days, dailyRate]);

  // Auto-compute total for general/cash when net+vat change
  useEffect(() => {
    if (type === "general" || type === "cash") {
      const net = parseFloat(netAmount) || 0;
      const vat = parseFloat(vatAmount) || 0;
      setTotalAmount((net + vat).toFixed(2));
    }
  }, [type, netAmount, vatAmount]);

  const reset = () => {
    setType("general");
    setDescription("");
    setReference("");
    setDate(today);
    setCurrency(defaultCurrency);
    setCategory("");
    setNetAmount("");
    setVatAmount("");
    setTotalAmount("");
    setDistanceKm("");
    setRatePerKm("0.30");
    setDays("");
    setDailyRate("");
    setLocation("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const isValid = () => {
    if (!date) return false;
    if (type === "mileage") return !!description && parseFloat(distanceKm) > 0 && parseFloat(ratePerKm) > 0;
    if (type === "per_diem") return !!(location || description) && parseFloat(days) > 0 && parseFloat(dailyRate) > 0;
    return !!description && parseFloat(totalAmount) > 0;
  };

  const handleSubmit = async () => {
    if (!isValid()) return;

    let supplierName = description;
    let invoiceRef = reference;

    if (type === "mileage") {
      supplierName = description || "Mileage";
      invoiceRef = reference || `${distanceKm} km @ ${ratePerKm}/km`;
    } else if (type === "per_diem") {
      supplierName = location || description || "Per Diem";
      invoiceRef = reference || `${days} day(s) @ ${dailyRate}/day`;
    }

    const input: ManualExpenseInput = {
      expense_type: type,
      supplier_name: supplierName,
      invoice_number: invoiceRef || undefined,
      invoice_date: date,
      currency,
      net_amount: parseFloat(netAmount) || 0,
      vat_amount: parseFloat(vatAmount) || 0,
      total_amount: parseFloat(totalAmount) || 0,
      category: category || undefined,
      ...(type === "mileage" && {
        distance_km: parseFloat(distanceKm) || 0,
        rate_per_km: parseFloat(ratePerKm) || 0,
      }),
      ...(type === "per_diem" && {
        days: parseFloat(days) || 0,
        daily_rate: parseFloat(dailyRate) || 0,
      }),
    };

    await createExpense.mutateAsync(input);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Manual Expense</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Expense type tabs */}
          <Tabs value={type} onValueChange={(v) => setType(v as ExpenseType)}>
            <TabsList className="grid grid-cols-4 h-auto gap-1 p-1">
              {EXPENSE_TYPES.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="flex flex-col gap-1 py-2 px-1 h-auto text-xs data-[state=active]:bg-background"
                >
                  {t.icon}
                  <span>{t.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Type-specific description */}
          <p className="text-xs text-muted-foreground -mt-2">
            {EXPENSE_TYPES.find((t) => t.value === type)?.description}
          </p>

          {/* --- MILEAGE FORM --- */}
          {type === "mileage" && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Description / Vehicle</Label>
                <Input
                  className="h-8 text-sm"
                  placeholder="e.g. Client visit – Toyota Corolla"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Distance (km)</Label>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Rate per km</Label>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="0.30"
                    value={ratePerKm}
                    onChange={(e) => setRatePerKm(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Route / Reference</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="e.g. Home → Office"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <Input className="h-8 text-sm" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <CategorySelect value={category || "Mileage"} onValueChange={setCategory} />
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Calculated total</span>
                <span className="text-sm font-semibold tabular-nums">
                  {currency} {totalAmount || "0.00"}
                </span>
              </div>
            </div>
          )}

          {/* --- PER DIEM FORM --- */}
          {type === "per_diem" && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Location / Trip purpose</Label>
                <Input
                  className="h-8 text-sm"
                  placeholder="e.g. Berlin – Annual Conference"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Number of days</Label>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="1"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Daily rate</Label>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <Input className="h-8 text-sm" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <CategorySelect value={category || "Per Diem"} onValueChange={setCategory} />
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Calculated total</span>
                <span className="text-sm font-semibold tabular-nums">
                  {currency} {totalAmount || "0.00"}
                </span>
              </div>
            </div>
          )}

          {/* --- GENERAL / CASH FORM --- */}
          {(type === "general" || type === "cash") && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  {type === "cash" ? "Payee / Description" : "Supplier / Description"}
                </Label>
                <Input
                  className="h-8 text-sm"
                  placeholder={type === "cash" ? "e.g. Stationery – office supplies" : "e.g. Acme Corp"}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Reference / Receipt #</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="Optional"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <Input className="h-8 text-sm" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <CategorySelect value={category} onValueChange={setCategory} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Net Amount</Label>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={netAmount}
                    onChange={(e) => setNetAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">VAT Amount</Label>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={vatAmount}
                    onChange={(e) => setVatAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total</Label>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleSubmit}
              disabled={!isValid() || createExpense.isPending}
            >
              {createExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Add Expense
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
