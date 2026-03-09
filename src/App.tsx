import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CookieConsentProvider } from "@/components/CookieConsent";
import MarketingLayout from "@/components/layout/MarketingLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import Index from "./pages/Index";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Demo from "./pages/Demo";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import ActivateTrial from "./pages/ActivateTrial";
import BillingRequired from "./pages/BillingRequired";
import AcceptableUse from "./pages/AcceptableUse";

import Upload from "./pages/Upload";
import Documents from "./pages/Documents";
import Expenses from "./pages/Expenses";
import Income from "./pages/Income";

import Categories from "./pages/Categories";
import Exports from "./pages/Exports";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Support from "./pages/Support";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrganizations from "./pages/admin/AdminOrganizations";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminUsage from "./pages/admin/AdminUsage";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminDemoSettings from "./pages/admin/AdminDemoSettings";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminEmailTemplates from "./pages/admin/AdminEmailTemplates";
import AdminBroadcast from "./pages/admin/AdminBroadcast";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminDocumentStats from "./pages/admin/AdminDocumentStats";
import AdminStorage from "./pages/admin/AdminStorage";
import AdminLoginActivity from "./pages/admin/AdminLoginActivity";
import AdminGDPR from "./pages/admin/AdminGDPR";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminFeatureFlags from "./pages/admin/AdminFeatureFlags";
import AdminSystemHealth from "./pages/admin/AdminSystemHealth";
import AdminScheduledJobs from "./pages/admin/AdminScheduledJobs";
import AdminAISettings from "./pages/admin/AdminAISettings";
import AdminMarketingEmail from "./pages/admin/AdminMarketingEmail";
import AdminPromoCodes from "./pages/admin/AdminPromoCodes";
import Assistant from "./pages/Assistant";
import Workspaces from "./pages/Workspaces";
import NotFound from "./pages/NotFound";
import { useDynamicPwaManifest } from "./hooks/useDynamicPwaManifest";
import { PwaUpdatePrompt } from "./components/PwaUpdatePrompt";

const queryClient = new QueryClient();

// Ensure dark mode class is never applied
document.documentElement.classList.remove("dark");
localStorage.removeItem("theme-mode");

function PwaManifestUpdater() {
  useDynamicPwaManifest();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ImpersonationProvider>
    <WorkspaceProvider>
    <CookieConsentProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PwaManifestUpdater />
      <PwaUpdatePrompt />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Marketing pages */}
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/acceptable-use" element={<AcceptableUse />} />
          </Route>

          {/* Auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/activate-trial" element={<ActivateTrial />} />
          <Route path="/billing-required" element={<BillingRequired />} />

          {/* Dashboard pages */}
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<Upload />} />
            <Route path="upload" element={<Upload />} />
            <Route path="documents" element={<Documents />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="income" element={<Income />} />
            
            <Route path="categories" element={<Categories />} />
            <Route path="exports" element={<Exports />} />
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<Settings />} />
            <Route path="support" element={<Support />} />
            <Route path="help" element={<Help />} />
            <Route path="assistant" element={<Assistant />} />
          </Route>

          {/* Admin pages */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="organizations" element={<AdminOrganizations />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="document-stats" element={<AdminDocumentStats />} />
            <Route path="usage" element={<AdminUsage />} />
            <Route path="storage" element={<AdminStorage />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="audit" element={<AdminAuditLogs />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="ai-settings" element={<AdminAISettings />} />
            <Route path="feature-flags" element={<AdminFeatureFlags />} />
            <Route path="system-health" element={<AdminSystemHealth />} />
            <Route path="scheduled-jobs" element={<AdminScheduledJobs />} />
            <Route path="demo-settings" element={<AdminDemoSettings />} />
            <Route path="email-templates" element={<AdminEmailTemplates />} />
            <Route path="broadcast" element={<AdminBroadcast />} />
            <Route path="login-activity" element={<AdminLoginActivity />} />
            <Route path="gdpr" element={<AdminGDPR />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="marketing-email" element={<AdminMarketingEmail />} />
            <Route path="promo-codes" element={<AdminPromoCodes />} />
            <Route path="support" element={<AdminSupport />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </CookieConsentProvider>
    </ImpersonationProvider>
  </QueryClientProvider>
);

export default App;
