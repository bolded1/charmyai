import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { usePageContent } from "@/hooks/usePageContent";
import { contactDefaults } from "@/lib/cms-defaults";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const { content: c } = usePageContent("contact", contactDefaults);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Message sent! We'll get back to you soon.");
    }, 1000);
  };

  return (
    <div>
      <section className="py-20">
        <div className="container max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">{c.title}</h1>
          <p className="text-lg text-muted-foreground text-center mb-12">{c.subtitle}</p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-6">
              {[
                { icon: Mail, title: "Email", detail: c.email },
                { icon: Phone, title: "Phone", detail: c.phone },
                { icon: MapPin, title: "Office", detail: c.office },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="md:col-span-2 surface-elevated rounded-xl p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Your name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@company.com" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="How can we help?" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Tell us more..." rows={5} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
