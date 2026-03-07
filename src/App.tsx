import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MarketingLayout from "@/components/layout/MarketingLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import Index from "./pages/Index";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";

import Upload from "./pages/Upload";
import Documents from "./pages/Documents";
import Expenses from "./pages/Expenses";
import Income from "./pages/Income";
import Contacts from "./pages/Contacts";
import Categories from "./pages/Categories";
import Exports from "./pages/Exports";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrganizations from "./pages/admin/AdminOrganizations";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminUsage from "./pages/admin/AdminUsage";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSupport from "./pages/admin/AdminSupport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ACCENT_COLORS = [
  { name: "Emerald", hue: "160 84% 36%" },
  { name: "Blue", hue: "217 85% 50%" },
  { name: "Violet", hue: "262 70% 50%" },
  { name: "Rose", hue: "350 70% 50%" },
  { name: "Amber", hue: "38 90% 50%" },
  { name: "Teal", hue: "174 70% 36%" },
  { name: "Indigo", hue: "234 70% 52%" },
  { name: "Slate", hue: "220 14% 40%" },
];

// Apply persisted theme & accent on startup
function applyPersistedSettings() {
  const root = document.documentElement;
  const theme = localStorage.getItem("theme-mode") || "system";
  if (theme === "dark") root.classList.add("dark");
  else if (theme === "light") root.classList.remove("dark");
  else root.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);

  const accentIdx = parseInt(localStorage.getItem("accent-color") || "0", 10);
  const color = ACCENT_COLORS[accentIdx] || ACCENT_COLORS[0];
  root.style.setProperty("--primary", color.hue);
  root.style.setProperty("--ring", color.hue);
  root.style.setProperty("--sidebar-primary", color.hue);
  root.style.setProperty("--sidebar-ring", color.hue);
  const [h, s, l] = color.hue.split(" ").map((v: string) => parseFloat(v));
  root.style.setProperty("--primary-hover", `${h} ${s}% ${Math.max(l - 6, 10)}%`);
  const isDark = root.classList.contains("dark");
  root.style.setProperty("--brand-soft", isDark ? `${h} 30% 14%` : `${h} 40% 95%`);
  root.style.setProperty("--sidebar-active-bg", isDark ? `${h} 25% 12%` : `${h} 40% 95%`);
  root.style.setProperty("--sidebar-active-text", isDark ? `${h} 50% 62%` : `${h} ${s}% ${Math.max(l - 8, 10)}%`);

  const btnText = localStorage.getItem("button-text-color") || "white";
  root.style.setProperty("--primary-foreground", btnText === "white" ? "0 0% 100%" : "0 0% 0%");
  root.style.setProperty("--sidebar-primary-foreground", btnText === "white" ? "0 0% 100%" : "0 0% 0%");
}
applyPersistedSettings();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Marketing pages */}
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* Auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Dashboard pages */}
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<Upload />} />
            <Route path="upload" element={<Upload />} />
            <Route path="documents" element={<Documents />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="income" element={<Income />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="categories" element={<Categories />} />
            <Route path="exports" element={<Exports />} />
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Admin pages */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="organizations" element={<AdminOrganizations />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="usage" element={<AdminUsage />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="audit" element={<AdminAuditLogs />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="support" element={<AdminSupport />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
