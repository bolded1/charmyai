import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateContact, type CreateContactInput } from "@/hooks/useDocuments";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddContactDialog({ open, onOpenChange }: Props) {
  const createContact = useCreateContact();

  const [name, setName] = useState("");
  const [type, setType] = useState<"supplier" | "customer" | "both">("supplier");
  const [vatNumber, setVatNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setName("");
    setType("supplier");
    setVatNumber("");
    setEmail("");
    setPhone("");
    setNotes("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const isValid = () => !!name.trim();

  const handleSubmit = async () => {
    if (!isValid()) return;

    const input: CreateContactInput = {
      name: name.trim(),
      type,
      vat_number: vatNumber || undefined,
      email: email || undefined,
      phone: phone || undefined,
      notes: notes || undefined,
    };

    await createContact.mutateAsync(input);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label className="text-xs text-muted-foreground">Name *</Label>
            <Input
              className="h-8 text-sm"
              placeholder="e.g. Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Type */}
          <div>
            <Label className="text-xs text-muted-foreground">Type *</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supplier">Supplier (Expense)</SelectItem>
                <SelectItem value="customer">Customer (Income)</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* VAT Number */}
          <div>
            <Label className="text-xs text-muted-foreground">VAT Number</Label>
            <Input
              className="h-8 text-sm"
              placeholder="Optional"
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
            />
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input
                className="h-8 text-sm"
                type="email"
                placeholder="Optional"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <Input
                className="h-8 text-sm"
                type="tel"
                placeholder="Optional"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Input
              className="h-8 text-sm"
              placeholder="Optional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleSubmit}
              disabled={!isValid() || createContact.isPending}
            >
              {createContact.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Add Contact
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
