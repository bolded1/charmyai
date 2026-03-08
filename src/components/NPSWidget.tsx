import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X, MessageSquareHeart, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NPS_COOLDOWN_DAYS = 30;
const NPS_STORAGE_KEY = "charmy_nps_last";

export function NPSWidget() {
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const lastShown = localStorage.getItem(NPS_STORAGE_KEY);
    if (lastShown) {
      const daysSince = (Date.now() - Number(lastShown)) / (1000 * 60 * 60 * 24);
      if (daysSince < NPS_COOLDOWN_DAYS) return;
    }
    // Show after 60s delay
    const timer = setTimeout(() => setVisible(true), 60000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(NPS_STORAGE_KEY, String(Date.now()));
  };

  const handleSubmit = async () => {
    if (score === null) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("user_feedback").insert({
        user_id: user.id,
        score,
        feedback_type: "nps",
        comment: comment.trim() || null,
        page: window.location.pathname,
      });
      if (error) throw error;
      setSubmitted(true);
      localStorage.setItem(NPS_STORAGE_KEY, String(Date.now()));
      setTimeout(() => setVisible(false), 2500);
    } catch (err: any) {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const scoreLabels: Record<number, string> = {
    0: "Not at all likely",
    5: "Neutral",
    10: "Extremely likely",
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border bg-card shadow-xl"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquareHeart className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Quick feedback</p>
              </div>
              <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-4">
                <p className="text-sm font-medium text-primary">Thank you for your feedback! 🎉</p>
                <p className="text-xs text-muted-foreground mt-1">Your input helps us improve Charmy.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  How likely are you to recommend Charmy to a colleague?
                </p>
                <div className="flex gap-1 mb-1">
                  {Array.from({ length: 11 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setScore(i)}
                      className={`flex-1 h-8 rounded text-[11px] font-medium transition-all ${
                        score === i
                          ? i <= 6
                            ? "bg-destructive text-destructive-foreground"
                            : i <= 8
                            ? "bg-secondary text-secondary-foreground ring-1 ring-border"
                            : "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-[10px] text-muted-foreground">Not likely</span>
                  <span className="text-[10px] text-muted-foreground">Very likely</span>
                </div>

                {score !== null && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
                    <Textarea
                      placeholder="What could we do better? (optional)"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                      className="text-xs mb-3"
                    />
                    <Button onClick={handleSubmit} disabled={submitting} size="sm" className="w-full">
                      {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Submit Feedback
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
