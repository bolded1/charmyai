import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MarketingLayout from "@/components/layout/MarketingLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Index from "./pages/Index";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Documents from "./pages/Documents";
import Expenses from "./pages/Expenses";
import Income from "./pages/Income";
import Contacts from "./pages/Contacts";
import Exports from "./pages/Exports";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
            <Route index element={<Dashboard />} />
            <Route path="upload" element={<Upload />} />
            <Route path="documents" element={<Documents />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="income" element={<Income />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="exports" element={<Exports />} />
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
