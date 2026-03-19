import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { HardDrive, Plus, Minus, ShoppingCart, Loader2, X } from "lucide-react";
import { useStorageUsage, formatBytes } from "@/hooks/useStorageUsage";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";

const STRIPE_PK =
  "pk_live_51Dzp0JBmkvUKJ0fuaOO3lXgQ83A5srdQrW5qKGr4ve9yaED1A5UmEel695J4wGxsokdAznHG53i33ELPjqgCFzqV00Y3AyofY0";
const stripePromise = loadStripe(STRIPE_PK);

export default function StorageSettings() {
  const { data: storage, isLoading } = useStorageUsage();
  const { activeWorkspace } = useWorkspace();
  const [quantity, setQuantity] = useState(1);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Handle return from embedded checkout
  useEffect(() => {
    const purchased = searchParams.get("purchased");
    if (purchased) {
      searchParams.delete("purchased");
      searchParams.delete("session_id");
      setSearchParams(searchParams, { replace: true });
      toast.success(`Storage upgrade successful! ${purchased} GB added to your workspace.`);
      queryClient.invalidateQueries({ queryKey: ["storage-usage"] });
    }
  }, [searchParams]);

  const handlePurchase = async () => {
    if (!activeWorkspace?.id) return;
    setPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-storage", {
        body: { quantity, organizationId: activeWorkspace.id },
      });
      if (error) throw error;
      if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start purchase");
    } finally {
      setPurchasing(false);
    }
  };

  const handleComplete = useCallback(() => {
    setClientSecret(null);
    queryClient.invalidateQueries({ queryKey: ["storage-usage"] });
    toast.success("Storage purchase complete!");
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!storage) return null;

  const usedPercent = storage.usedPercent;
  const progressColor =
    usedPercent >= 90
      ? "bg-destructive"
      : usedPercent >= 70
        ? "bg-yellow-500"
        : "bg-primary";

  // Show embedded checkout
  if (clientSecret) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Complete your purchase</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setClientSecret(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="rounded-xl border bg-background overflow-hidden">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret, onComplete: handleComplete }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Usage */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <HardDrive className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Storage Usage</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {formatBytes(storage.usedBytes)} of {formatBytes(storage.totalLimitBytes)} used
              </span>
              <Badge
                variant={storage.isFull ? "destructive" : "secondary"}
                className="text-xs"
              >
                {usedPercent.toFixed(1)}%
              </Badge>
            </div>

            <div className="relative h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${Math.min(usedPercent, 100)}%` }}
              />
            </div>

            {storage.isFull && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <span className="font-medium">Storage full!</span>
                <span className="text-destructive/70">
                  You won't be able to upload new documents until you purchase more
                  storage.
                </span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold text-foreground">
                  {formatBytes(storage.limitBytes)}
                </p>
                <p className="text-[11px] text-muted-foreground">Base Storage</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold text-foreground">
                  {formatBytes(storage.purchasedBytes)}
                </p>
                <p className="text-[11px] text-muted-foreground">Extra Purchased</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold text-foreground">
                  {formatBytes(storage.remainingBytes)}
                </p>
                <p className="text-[11px] text-muted-foreground">Remaining</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase More Storage */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">
              Purchase Extra Storage
            </h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Add more storage to your workspace. Each 1 GB costs{" "}
            <strong>$10</strong> (one-time, lifetime).
          </p>

          <div className="flex items-center gap-4 mb-6">
            <Label className="text-sm font-medium shrink-0">Quantity:</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-lg font-bold w-10 text-center">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity((q) => Math.min(100, q + 1))}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-sm text-muted-foreground ml-2">GB</span>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {quantity} GB extra storage
              </p>
              <p className="text-xs text-muted-foreground">
                One-time payment, permanent addition
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-foreground">
                ${quantity * 10}
              </span>
              <Button
                onClick={handlePurchase}
                disabled={purchasing}
                className="rounded-xl"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />{" "}
                    Processing…
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-1.5" /> Purchase
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
