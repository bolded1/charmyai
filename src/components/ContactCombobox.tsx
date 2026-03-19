import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useExpenseRecords, useIncomeRecords, useContacts } from "@/hooks/useDocuments";

export interface ContactComboboxProps {
  value: string;
  onChange: (name: string, vatNumber?: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface ContactOption {
  name: string;
  vatNumber: string | null;
}

export function ContactCombobox({
  value,
  onChange,
  placeholder = "Search contacts…",
  className,
  disabled,
}: ContactComboboxProps) {
  const [open, setOpen] = useState(false);

  const { data: expenses = [] } = useExpenseRecords();
  const { data: income = [] } = useIncomeRecords();
  const { data: contacts = [] } = useContacts();

  const options = useMemo<ContactOption[]>(() => {
    const map = new Map<string, ContactOption>();

    // Manual contacts first (have the most complete data)
    for (const c of contacts) {
      const key = c.name.toLowerCase();
      map.set(key, { name: c.name, vatNumber: c.vat_number });
    }

    // Expense suppliers
    for (const e of expenses) {
      const key = e.supplier_name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name: e.supplier_name, vatNumber: e.vat_number || null });
      } else if (!map.get(key)!.vatNumber && e.vat_number) {
        map.set(key, { ...map.get(key)!, vatNumber: e.vat_number });
      }
    }

    // Income customers
    for (const i of income) {
      const key = i.customer_name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name: i.customer_name, vatNumber: i.vat_number || null });
      } else if (!map.get(key)!.vatNumber && i.vat_number) {
        map.set(key, { ...map.get(key)!, vatNumber: i.vat_number });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts, expenses, income]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <User className="h-3.5 w-3.5 shrink-0 opacity-50" />
            <span className="truncate">{value || placeholder}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={value}
            onValueChange={(v) => onChange(v)}
          />
          <CommandList>
            <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">
              No contacts found — type to enter a new name.
            </CommandEmpty>
            {options.filter((o) =>
              o.name.toLowerCase().includes((value || "").toLowerCase())
            ).length > 0 && (
              <CommandGroup heading="Known contacts">
                {options
                  .filter((o) =>
                    o.name.toLowerCase().includes((value || "").toLowerCase())
                  )
                  .map((opt) => (
                    <CommandItem
                      key={opt.name.toLowerCase()}
                      value={opt.name}
                      onSelect={() => {
                        onChange(opt.name, opt.vatNumber ?? undefined);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.toLowerCase() === opt.name.toLowerCase()
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <span className="flex-1 truncate">{opt.name}</span>
                      {opt.vatNumber && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {opt.vatNumber}
                        </span>
                      )}
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
