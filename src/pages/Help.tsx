import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Upload, FileText, Receipt, TrendingUp, Download, UsersRound, Settings,
  Search, Mail, HelpCircle, BookOpen, Zap, Shield, ChevronRight,
  Keyboard, FolderOpen, CheckCircle2, ArrowRight, Tag, Bot,
  CreditCard, BarChart3, Contact, LifeBuoy, ListChecks,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  category: string;
  content: string[];
}

const helpArticles: HelpArticle[] = [
  {
    id: "capture",
    title: "Capture & Upload Documents",
    description: "Learn how to upload invoices and receipts for automatic extraction.",
    icon: Upload,
    iconColor: "icon-bg-blue",
    category: "Getting Started",
    content: [
      "Navigate to the Capture page from the sidebar — it's your main entry point.",
      "Drag and drop PDF, PNG, or JPG files into the upload zone, or click to browse.",
      "Charmy's AI will automatically read the document and extract key financial fields like supplier name, invoice number, amounts, VAT, and dates.",
      "You can also forward invoices via email to your unique Charmy email address found on the Capture page.",
      "Maximum file size is 10MB per document.",
    ],
  },
  {
    id: "documents",
    title: "Managing Documents",
    description: "View, search, and organize all your uploaded documents.",
    icon: FileText,
    iconColor: "icon-bg-violet",
    category: "Getting Started",
    content: [
      "The Documents page shows all uploaded and processed files in one place.",
      "Use the search bar to find documents by supplier name, invoice number, or any extracted field.",
      "Click on any document to view its full extracted data and make corrections if needed.",
      "Documents can be filtered by status: pending, processed, or needs review.",
      "Each document shows a confidence score indicating how accurately the AI extracted the data.",
    ],
  },
  {
    id: "expenses",
    title: "Tracking Expenses",
    description: "Monitor and categorize your business expenses.",
    icon: Receipt,
    iconColor: "icon-bg-rose",
    category: "Finance",
    content: [
      "The Expenses page provides an overview of all your outgoing invoices and costs.",
      "Expenses are automatically created when an expense invoice is processed.",
      "You can assign categories to expenses for better bookkeeping organization.",
      "View summary stats including total expenses, VAT totals, and average invoice amounts.",
      "Filter expenses by date range, supplier, category, or amount.",
    ],
  },
  {
    id: "income",
    title: "Tracking Income",
    description: "Keep track of your incoming revenue and sales invoices.",
    icon: TrendingUp,
    iconColor: "icon-bg-emerald",
    category: "Finance",
    content: [
      "The Income page shows all revenue records from processed sales invoices.",
      "Income records are automatically created when a sales or income invoice is processed.",
      "Track key metrics like total revenue, outstanding amounts, and payment trends.",
      "Filter and sort by customer, date, or amount to find specific records.",
      "All income data is export-ready for your accountant.",
    ],
  },
  {
    id: "exports",
    title: "Exporting Data",
    description: "Export structured CSV files ready for your accountant.",
    icon: Download,
    iconColor: "icon-bg-amber",
    category: "Finance",
    content: [
      "Navigate to the Exports page to generate accountant-ready CSV files.",
      "Choose between exporting expenses, income, or all records.",
      "Select a date range to export only the period you need.",
      "Exported files include all extracted fields: supplier/customer, invoice number, dates, amounts, VAT, and category.",
      "View your export history to re-download previous exports.",
    ],
  },
  {
    id: "email-import",
    title: "Email Import",
    description: "Forward invoices to Charmy via email for automatic processing.",
    icon: Mail,
    iconColor: "icon-bg-teal",
    category: "Advanced Features",
    content: [
      "Each organization gets a unique email address for document import.",
      "Find your import email address on the Capture page or in Settings.",
      "Simply forward invoices and receipts to this address — attachments are automatically processed.",
      "Supported attachment types: PDF, PNG, JPG (same as manual upload).",
      "Email imports appear in your Documents list with the source marked as 'email'.",
    ],
  },
  {
    id: "team",
    title: "Team Management",
    description: "Invite team members and manage access to your organization.",
    icon: UsersRound,
    iconColor: "icon-bg-violet",
    category: "Organization",
    content: [
      "Go to the Team page to view and manage your organization's members.",
      "Invite new members by email — they'll receive an invitation to join.",
      "Team members share the same document library and financial records.",
      "Organization owners can manage member roles and permissions.",
      "All team activity is tracked for transparency and audit purposes.",
    ],
  },
  {
    id: "settings",
    title: "Settings & Customization",
    description: "Configure your profile, organization branding, and preferences.",
    icon: Settings,
    iconColor: "icon-bg-blue",
    category: "Organization",
    content: [
      "Update your personal profile including name, email, and timezone.",
      "Customize your organization's branding with a logo and primary color.",
      "Configure expense categories to match your bookkeeping structure.",
      "Manage your subscription plan and billing details.",
      "Set up email import preferences and allowed sender domains.",
    ],
  },
  {
    id: "categories",
    title: "Categories & Auto-Categorization",
    description: "Organize expenses with categories and automatic rules.",
    icon: Tag,
    iconColor: "icon-bg-violet",
    category: "Finance",
    content: [
      "Go to the Categories page to create custom expense categories that match your bookkeeping.",
      "Edit or delete categories at any time — changes apply to future categorizations.",
      "Set up auto-categorization rules to automatically tag incoming documents (e.g. if supplier contains 'AWS' → assign 'Cloud Services').",
      "Rules can match on supplier name, customer name, or invoice number using contains, starts with, or equals.",
      "The Category Analytics section shows spending breakdowns, top categories, and monthly trends per currency.",
    ],
  },
  {
    id: "category-analytics",
    title: "Category Analytics",
    description: "Visualize spending patterns across categories and currencies.",
    icon: BarChart3,
    iconColor: "icon-bg-teal",
    category: "Finance",
    content: [
      "Open the Category Analytics panel on the Categories page to see spending insights.",
      "Switch between currencies to view breakdowns for EUR, USD, or any currency in your records.",
      "View your top spending categories ranked by total amount and percentage.",
      "The monthly trends chart shows how your top 4 categories have changed over the last 6 months.",
      "Analytics update automatically as new expense records are added.",
    ],
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    description: "Ask Charmy's AI for help with your financial data.",
    icon: Bot,
    iconColor: "icon-bg-blue",
    category: "Advanced Features",
    content: [
      "Access the AI Assistant from the sidebar to ask questions about your documents and finances.",
      "Ask things like 'What were my top expenses last month?' or 'Summarize my VAT totals'.",
      "The assistant has context about your uploaded documents and extracted data.",
      "Conversations are saved so you can revisit previous chats.",
      "Start a new conversation anytime to reset context.",
    ],
  },
  {
    id: "contacts",
    title: "Contacts",
    description: "View suppliers and customers extracted from your documents.",
    icon: Contact,
    iconColor: "icon-bg-rose",
    category: "Organization",
    content: [
      "The Contacts page lists all suppliers and customers found across your documents.",
      "Contacts are automatically created from extracted invoice data — no manual entry needed.",
      "Search and filter contacts to quickly find a specific supplier or customer.",
      "View how many documents and total amounts are associated with each contact.",
    ],
  },
  {
    id: "support-tickets",
    title: "Support Tickets",
    description: "Get help from the Charmy team when you need it.",
    icon: LifeBuoy,
    iconColor: "icon-bg-emerald",
    category: "Organization",
    content: [
      "Go to the Support page to create a new support ticket.",
      "Describe your issue with a subject and detailed message.",
      "Set a priority level (normal or urgent) to help us triage faster.",
      "Track ticket status: open, in progress, or resolved.",
      "Receive replies directly within the ticket conversation thread.",
    ],
  },
  {
    id: "billing",
    title: "Billing & Plans",
    description: "Manage your Pro Plan and payment details.",
    icon: CreditCard,
    iconColor: "icon-bg-amber",
    category: "Organization",
    content: [
      "Charmy offers a Pro Plan at €29.99 (one-time payment) with lifetime access.",
      "Purchase your plan on first login — a one-time payment gives you immediate access to all features.",
      "View your current plan status in Settings → Billing.",
      "Download PDF invoices for any past payment directly from the billing dashboard.",
    ],
  },
  {
    id: "onboarding",
    title: "Onboarding Checklist",
    description: "Get started quickly with the guided setup checklist.",
    icon: ListChecks,
    iconColor: "icon-bg-violet",
    category: "Getting Started",
    content: [
      "When you first sign up, Charmy shows an onboarding checklist to guide you through setup.",
      "Steps include completing your profile, uploading your first document, and exploring key features.",
      "Check off items as you go — your progress is saved automatically.",
      "The checklist disappears once all steps are completed.",
      "You can always revisit the Help page for detailed guidance on any feature.",
    ],
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    description: "Navigate faster with keyboard shortcuts.",
    icon: Keyboard,
    iconColor: "icon-bg-amber",
    category: "Tips & Tricks",
    content: [
      "Press ⌘/ (Mac) or Ctrl+/ (Windows) to open the keyboard shortcuts dialog.",
      "Quick navigation: ⌘1 for Capture, ⌘2 for Documents, ⌘3 for Expenses, etc.",
      "Use ⌘K or Ctrl+K to open the quick search.",
      "Press Escape to close any open dialog or modal.",
      "Shortcuts are shown next to menu items for easy reference.",
    ],
  },
  {
    id: "security",
    title: "Security & Privacy",
    description: "How Charmy keeps your financial data safe.",
    icon: Shield,
    iconColor: "icon-bg-emerald",
    category: "Tips & Tricks",
    content: [
      "All data is encrypted in transit (TLS) and at rest.",
      "Documents are stored securely with row-level access controls — only your team can see your data.",
      "Demo uploads from the public landing page are automatically deleted after 1 hour.",
      "Charmy does not share your financial data with third parties.",
      "Audit logs track all significant actions for compliance and transparency.",
    ],
  },
];

const categories = [...new Set(helpArticles.map((a) => a.category))];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const navigate = useNavigate();

  const filtered = helpArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-hero-gradient flex items-center justify-center shadow-md shadow-primary/20">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Help & Documentation</h1>
            <p className="text-sm text-muted-foreground">
              Everything you need to know about using Charmy.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex flex-wrap gap-2"
      >
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant="secondary"
            className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => setSearchQuery(cat)}
          >
            {cat}
          </Badge>
        ))}
        {searchQuery && (
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-destructive/10 transition-colors"
            onClick={() => setSearchQuery("")}
          >
            Clear filter ✕
          </Badge>
        )}
      </motion.div>

      {/* Articles */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No articles found</p>
            <p className="text-sm">Try a different search term.</p>
          </div>
        )}

        {filtered.map((article, i) => {
          const isExpanded = expandedArticle === article.id;
          const Icon = article.icon;

          return (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <div
                className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${
                  isExpanded ? "shadow-lg" : "hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                {/* Header row */}
                <button
                  onClick={() =>
                    setExpandedArticle(isExpanded ? null : article.id)
                  }
                  className="w-full flex items-center gap-4 p-4 text-left"
                >
                  <div
                    className={`h-10 w-10 rounded-xl ${article.iconColor} flex items-center justify-center shrink-0`}
                  >
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm">{article.title}</h3>
                      <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                        {article.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {article.description}
                    </p>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="px-4 pb-4"
                  >
                    <div className="border-t border-border/50 pt-4 ml-14 space-y-2.5">
                      {article.content.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-6 text-center cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate("/app/support")}
      >
        <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
        <h3 className="font-semibold mb-1">Still need help?</h3>
        <p className="text-sm text-muted-foreground">
          Contact our support team and we'll get back to you within 24 hours.
        </p>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-3">
          Go to Support <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </motion.div>
    </div>
  );
}
