import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Upload, FileText, Receipt, TrendingUp, Download, UsersRound, Settings,
  Search, Mail, HelpCircle, BookOpen, Zap, Shield, ChevronRight,
  Keyboard, CheckCircle2, ArrowRight, Tag, Bot,
  CreditCard, BarChart3, Contact, LifeBuoy, ListChecks, Code2,
  Car, Link2, Send, WifiOff, PlusCircle,
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
  isNew?: boolean;
  content: string[];
}

const helpArticles: HelpArticle[] = [
  // ─── Getting Started ──────────────────────────────────────────────────────
  {
    id: "capture",
    title: "Capture & Upload Documents",
    description: "Upload invoices and receipts — Charmy's AI extracts every field automatically.",
    icon: Upload,
    iconColor: "icon-bg-blue",
    category: "Getting Started",
    content: [
      "Go to the Capture page from the sidebar — it's your starting point for getting documents into Charmy.",
      "Drag and drop one or more PDF, PNG, or JPG files into the upload zone, or click to browse your device.",
      "Charmy's AI reads each document and extracts key fields automatically: supplier name, invoice number, date, net amount, VAT amount, total, currency, and more.",
      "You can also forward invoices by email — Charmy gives your organization a unique inbox address on the Capture page. Just forward the email and any attachments are processed automatically.",
      "Maximum file size is 10 MB per document. For best results, upload clear scans or original PDF invoices rather than photographs.",
      "Once processed, each document appears in your Documents list. Documents that need a manual review are flagged so you can quickly correct any field.",
    ],
  },
  {
    id: "documents",
    title: "Managing Documents",
    description: "View, search, edit, and organize every document in one place.",
    icon: FileText,
    iconColor: "icon-bg-violet",
    category: "Getting Started",
    content: [
      "The Documents page is your central library — every uploaded or emailed document lives here.",
      "Use the search bar to instantly filter by supplier name, invoice number, category, or any extracted text.",
      "Click any document row to open the detail panel, where you can view the original file alongside all extracted fields.",
      "Edit any field directly inside the detail panel if the AI made a mistake — changes are saved instantly.",
      "Filter documents by status (Pending, Processed, Needs Review) or by date range to quickly find what you need.",
      "Each document shows a confidence indicator. Low-confidence extractions are flagged for your review so nothing slips through.",
      "Bulk-select documents to delete or download multiple files at once, saving time during month-end cleanup.",
    ],
  },
  {
    id: "onboarding",
    title: "Onboarding Checklist",
    description: "Get up and running in minutes with the guided setup checklist.",
    icon: ListChecks,
    iconColor: "icon-bg-violet",
    category: "Getting Started",
    content: [
      "When you first sign up, Charmy shows a step-by-step onboarding checklist to guide you through the most important setup tasks.",
      "Steps include completing your profile, uploading your first document, setting your default currency, and exploring the Expenses and Income pages.",
      "Check off each item as you go — your progress is saved automatically and persists across sessions.",
      "The checklist disappears once all steps are completed. You can always come back to this Help page for detailed guidance on any feature.",
    ],
  },

  // ─── Finance ──────────────────────────────────────────────────────────────
  {
    id: "expenses",
    title: "Tracking Expenses",
    description: "Monitor, categorize, and bulk-manage all your business expenses.",
    icon: Receipt,
    iconColor: "icon-bg-rose",
    category: "Finance",
    content: [
      "The Expenses page gives you a full view of every outgoing cost across your organization.",
      "Expenses are created automatically when Charmy processes an expense invoice — no manual data entry required.",
      "Use the date range picker to filter by This Month, Last Month, This Quarter, This Year, or a custom range.",
      "Filter further by currency or category to drill into exactly the slice of spending you need.",
      "Click any expense row to open its full record, view the original document, and edit any field.",
      "Assign or change categories directly from the expense list to keep your bookkeeping organized.",
      "Bulk-select expenses with the checkboxes to download a ZIP archive of all original files, or to delete multiple records at once.",
      "Use the Add Expense button (+ Expense) to log a manual expense without a scanned document — see 'Manual Expense Entry' for details.",
      "The page loads the 50 most recent expenses first. Scroll to the bottom and click 'Load more' to fetch older records.",
    ],
  },
  {
    id: "manual-expenses",
    title: "Manual Expense Entry",
    description: "Log mileage, per diem, cash, and general expenses without a receipt.",
    icon: PlusCircle,
    iconColor: "icon-bg-rose",
    category: "Finance",
    isNew: true,
    content: [
      "Click the '+ Expense' button on the Expenses page to open the Manual Expense dialog.",
      "Choose one of four expense types: General (regular business expense), Mileage (vehicle or travel distance), Per Diem (daily allowance), or Cash (out-of-pocket payment).",
      "For Mileage expenses, enter the distance travelled and your per-km rate. Charmy calculates the total automatically and remembers your rate for next time.",
      "For Per Diem expenses, enter the number of days and the daily rate — the total is computed for you.",
      "All manual expenses support 50+ currencies. Select the right currency from the dropdown before saving.",
      "Auto-categorization rules apply to manual expenses too — if your supplier name matches a rule, the category is filled in automatically.",
      "Optionally attach a file (e.g. a photo of a receipt or a mileage log) to any manual expense for full audit trail.",
      "Manual expenses appear alongside all other expenses in the Expenses list and are included in CSV exports.",
    ],
  },
  {
    id: "income",
    title: "Tracking Income",
    description: "Keep track of all incoming revenue and sales invoices.",
    icon: TrendingUp,
    iconColor: "icon-bg-emerald",
    category: "Finance",
    content: [
      "The Income page shows every revenue record generated from your processed sales invoices.",
      "Income records are created automatically when Charmy identifies an incoming or sales invoice — just upload and let the AI do the rest.",
      "Track key metrics at a glance: total revenue per currency, number of invoices, and payment trends.",
      "Filter and sort by customer name, date, currency, or amount to quickly locate a specific record.",
      "Click any income record to view the full extracted data and make corrections if needed.",
      "All income data is export-ready for your accountant at any time — see 'Exporting Data' for details.",
    ],
  },
  {
    id: "exports",
    title: "Exporting Data",
    description: "Generate accountant-ready CSV exports for any date range.",
    icon: Download,
    iconColor: "icon-bg-amber",
    category: "Finance",
    content: [
      "Go to the Exports page to create structured CSV files ready to hand directly to your accountant or import into accounting software.",
      "Choose whether to export Expenses, Income, or All records in one file.",
      "Select a date range so you only export the period you need — monthly, quarterly, or custom.",
      "Each export row includes all extracted fields: supplier or customer name, invoice number, date, net amount, VAT amount, total, currency, and category.",
      "Exports are generated instantly and saved to your export history so you can re-download a previous export at any time without re-generating it.",
      "For direct integration with QuickBooks, Xero, or FreshBooks, see 'Accounting Software Sync'.",
    ],
  },
  {
    id: "categories",
    title: "Categories & Auto-Categorization",
    description: "Organize spending with custom categories and automatic rules.",
    icon: Tag,
    iconColor: "icon-bg-violet",
    category: "Finance",
    content: [
      "Go to the Categories page to create, edit, or delete custom expense categories that match your own bookkeeping chart of accounts.",
      "Once a category exists, you can assign it to any expense or income record — either manually or automatically via rules.",
      "Set up auto-categorization rules to tag incoming documents without lifting a finger. Example: if the supplier name contains 'AWS', automatically assign 'Cloud Services'.",
      "Rules can match on supplier name, customer name, or invoice number using 'contains', 'starts with', or 'equals' conditions.",
      "Rules are evaluated in order — drag to reorder if you need a more specific rule to take priority over a broader one.",
      "Auto-categorization also applies to Manual Expense entries, keeping your records consistent.",
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
      "Open the Category Analytics panel on the Categories page to see spending breakdowns and trends.",
      "Switch between currencies to view separate breakdowns for EUR, USD, or any other currency in your records.",
      "The top categories panel ranks your spending categories by total amount and shows each as a percentage of overall spend.",
      "The monthly trends chart plots your top 4 categories over the last 6 months so you can spot seasonal patterns or budget drift.",
      "Analytics update in real time as new expense records are processed or manually entered.",
    ],
  },

  // ─── Advanced Features ────────────────────────────────────────────────────
  {
    id: "email-import",
    title: "Email Import",
    description: "Forward invoices to your Charmy inbox for automatic processing.",
    icon: Mail,
    iconColor: "icon-bg-teal",
    category: "Advanced Features",
    content: [
      "Each organization gets a unique Charmy email address. Find it on the Capture page or in Settings → Email Import.",
      "Forward any invoice email to that address — Charmy automatically extracts and processes all PDF, PNG, and JPG attachments.",
      "The email body is ignored; only file attachments are processed, so you can forward threads without worrying about the message content.",
      "Processed documents appear in your Documents list with the source marked as 'email' for easy filtering.",
      "You can restrict which sender addresses are allowed to import via Settings → Email Import to prevent unwanted submissions.",
    ],
  },
  {
    id: "document-requests",
    title: "Document Requests",
    description: "Send secure upload links to clients and collect documents without email attachments.",
    icon: Send,
    iconColor: "icon-bg-blue",
    category: "Advanced Features",
    isNew: true,
    content: [
      "Go to Document Requests in the sidebar to create a secure, shareable upload link for any client or supplier.",
      "Click 'New Request', give it a title and an optional note, and set an expiry date. Charmy generates a unique link instantly.",
      "Copy the link and send it to your contact however you prefer — email, message, or any other channel.",
      "The recipient visits the link and uploads their documents directly through a simple branded page — no Charmy account required.",
      "Uploaded files land straight in your Documents list and are automatically processed by Charmy's AI, just like a normal upload.",
      "Each request shows its status: Active, Fulfilled, Expired, or Closed. Close a request manually at any time to disable the link.",
      "Reopen a closed request or create a new one if a client needs to submit additional documents.",
      "Document Requests are especially useful for accounting firms collecting documents from multiple clients at month-end.",
    ],
  },
  {
    id: "accounting-sync",
    title: "Accounting Software Sync",
    description: "Push bills and invoices directly to QuickBooks, Xero, or FreshBooks.",
    icon: Link2,
    iconColor: "icon-bg-emerald",
    category: "Advanced Features",
    isNew: true,
    content: [
      "Connect Charmy to your accounting software from Settings → Integrations.",
      "Supported platforms: QuickBooks Online, Xero, and FreshBooks — connect one or all three.",
      "Click 'Connect' next to a provider, sign in with your accounting software credentials, and authorize the integration. Charmy uses OAuth so your password is never shared.",
      "Once connected, Charmy can push processed expense records as draft bills and income records as draft invoices directly into your accounting ledger.",
      "Use the 'Sync' button on the integration card to trigger a manual sync, or let Charmy sync automatically as new documents are processed.",
      "The integration card shows the last sync date and how many records were pushed, so you always know the status.",
      "Disconnect an integration at any time from Settings → Integrations without losing any data in Charmy.",
    ],
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    description: "Ask Charmy's AI questions about your documents and financial data.",
    icon: Bot,
    iconColor: "icon-bg-blue",
    category: "Advanced Features",
    content: [
      "Access the AI Assistant from the sidebar to have a conversation with an AI that knows your financial data.",
      "Ask natural language questions like 'What were my top 5 expenses last quarter?', 'How much VAT did I pay in January?', or 'List all invoices from Supplier X'.",
      "The assistant has full context about your uploaded documents and extracted records — it doesn't just search keywords, it understands your data.",
      "Conversations are saved so you can scroll back and reference previous answers without re-asking.",
      "Start a new conversation anytime to reset context and ask a fresh set of questions.",
    ],
  },
  {
    id: "api-docs",
    title: "API & Integrations",
    description: "Access your data programmatically with the Charmy REST API.",
    icon: Code2,
    iconColor: "icon-bg-teal",
    category: "Advanced Features",
    content: [
      "Charmy provides a RESTful API for programmatic access to your documents, expenses, income, and contacts.",
      "Generate API keys from Settings → API. Each key has a human-readable prefix and can be revoked individually at any time.",
      "All API requests must include an x-api-key header with your generated key.",
      "Base URL: your project endpoint followed by /functions/v1/api-v1. Available resources: /documents, /expenses, /income, and /contacts.",
      "Paginate results with ?limit=50&offset=0. Filter by status with ?status=processed, or by date with ?from=2026-01-01&to=2026-03-31.",
      "Upload a new document via POST /documents using multipart/form-data with a 'file' field — Charmy processes it automatically.",
      "All responses use a consistent shape: { data, count, error } so your integration code stays simple.",
      "A full OpenAPI (Swagger) specification is available at /api-docs for interactive exploration of every endpoint.",
      "Connect with automation platforms like Zapier or Make using the API or webhooks configured in Settings.",
    ],
  },

  // ─── Organization ─────────────────────────────────────────────────────────
  {
    id: "team",
    title: "Team Management",
    description: "Invite colleagues and manage your organization's members.",
    icon: UsersRound,
    iconColor: "icon-bg-violet",
    category: "Organization",
    content: [
      "Go to the Team page to see everyone in your organization and invite new members.",
      "Enter a colleague's email address and click Invite — they receive an email with a link to join your workspace.",
      "All team members share the same document library, expense records, and income records.",
      "Organization owners can assign roles to control who can invite others, manage billing, or adjust settings.",
      "Remove a member at any time from the Team page — their previously uploaded documents remain in the organization.",
      "All team actions are logged for transparency and compliance.",
    ],
  },
  {
    id: "settings",
    title: "Settings & Customization",
    description: "Configure your profile, organization, currencies, and integrations.",
    icon: Settings,
    iconColor: "icon-bg-blue",
    category: "Organization",
    content: [
      "Update your personal profile — name, email, and notification preferences — from Settings → Profile.",
      "Set your organization's default currency so new records are pre-filled with the right currency. Charmy supports 50+ currencies.",
      "Upload your organization's logo and set a display name from Settings → Organization.",
      "Manage expense categories and auto-categorization rules from Settings or the dedicated Categories page.",
      "Connect accounting software (QuickBooks, Xero, FreshBooks) from Settings → Integrations.",
      "Generate and revoke API keys from Settings → API for programmatic access.",
      "Configure your unique email import address and allowed sender domains from Settings → Email Import.",
      "View and manage your plan and billing details from Settings → Billing.",
    ],
  },
  {
    id: "contacts",
    title: "Contacts",
    description: "Suppliers and customers auto-built from your invoice data.",
    icon: Contact,
    iconColor: "icon-bg-rose",
    category: "Organization",
    content: [
      "The Contacts page lists every supplier and customer found across all your processed documents — built automatically, with zero manual entry.",
      "Each contact card shows the total number of associated documents, total amounts, and the date of the most recent transaction.",
      "Search and filter contacts to quickly locate a specific supplier or customer.",
      "Click a contact to see all documents linked to that company in one view.",
      "Contacts update automatically as new documents are processed — no maintenance required.",
    ],
  },
  {
    id: "support-tickets",
    title: "Support Tickets",
    description: "Reach the Charmy team when you need help.",
    icon: LifeBuoy,
    iconColor: "icon-bg-emerald",
    category: "Organization",
    content: [
      "Go to the Support page to open a new ticket with the Charmy team.",
      "Write a clear subject and a detailed message describing your issue or question.",
      "Set a priority: Normal for general questions, Urgent for anything blocking your work.",
      "Track your ticket's status — Open, In Progress, or Resolved — directly on the Support page.",
      "All replies from the Charmy team appear in the ticket thread so the full conversation is in one place.",
      "You'll also receive replies via email so you don't have to keep checking the app.",
    ],
  },
  {
    id: "billing",
    title: "Billing & Plans",
    description: "Manage your plan and view past payment receipts.",
    icon: CreditCard,
    iconColor: "icon-bg-amber",
    category: "Organization",
    content: [
      "Charmy is available as a Pro Plan at €29.99 — a one-time payment that gives you lifetime access to all features.",
      "After purchase, your account is unlocked immediately with no recurring fees or usage limits.",
      "View your current plan status and purchase date from Settings → Billing.",
      "Download a PDF receipt for any past payment directly from the billing dashboard for your accounting records.",
      "Have a discount code? Apply it on the checkout screen before completing payment.",
    ],
  },

  // ─── Tips & Tricks ────────────────────────────────────────────────────────
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    description: "Navigate and act faster without touching the mouse.",
    icon: Keyboard,
    iconColor: "icon-bg-amber",
    category: "Tips & Tricks",
    content: [
      "Press ⌘/ (Mac) or Ctrl+/ (Windows/Linux) to open the full keyboard shortcuts reference at any time.",
      "Quick navigation: ⌘1 jumps to Capture, ⌘2 to Documents, ⌘3 to Expenses, ⌘4 to Income — and so on for each sidebar item.",
      "Press ⌘K or Ctrl+K to open the global quick search and jump directly to any record or page.",
      "Press Escape to close any open dialog, modal, or side panel.",
      "Shortcuts are shown next to menu items throughout the app as a reminder — you'll pick them up naturally as you use Charmy.",
    ],
  },
  {
    id: "offline",
    title: "Offline & Connection Awareness",
    description: "Charmy detects your connection and keeps you informed when offline.",
    icon: WifiOff,
    iconColor: "icon-bg-rose",
    category: "Tips & Tricks",
    isNew: true,
    content: [
      "Charmy automatically detects when your internet connection is lost and shows an offline indicator in the interface.",
      "While offline, write actions like uploading documents, saving edits, and creating expenses are disabled to prevent data loss.",
      "Read-only views — browsing your documents and expense lists — remain accessible so you can still reference your data.",
      "As soon as your connection is restored, the offline indicator disappears and all actions become available again.",
      "This means you never have to worry about accidentally submitting a form on a flaky connection — Charmy has your back.",
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
      "All data is encrypted in transit using TLS and encrypted at rest in the database.",
      "Row-level security controls mean each organization's data is completely isolated — no team can ever see another team's records.",
      "Demo uploads from the public landing page are automatically deleted after 1 hour and are never associated with any account.",
      "Document Request links expire on the date you set, and can be manually closed at any time to revoke access immediately.",
      "Charmy does not sell or share your financial data with any third parties.",
      "Significant actions — logins, exports, deletions, and integrations — are logged for audit and compliance purposes.",
      "API keys can be revoked instantly from Settings if you suspect a key has been compromised.",
    ],
  },
];

const categories = [...new Set(helpArticles.map((a) => a.category))];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isPublic = !location.pathname.startsWith("/app");

  const filtered = helpArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.some((line) => line.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const newCount = helpArticles.filter((a) => a.isNew).length;

  return (
    <div className="pt-24 px-4 pb-4 md:pt-24 md:px-8 md:pb-4 max-w-4xl mx-auto space-y-8">
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Help & Documentation</h1>
              {newCount > 0 && (
                <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  {newCount} new
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Everything you need to get the most out of Charmy.
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
            aria-label="Search help articles"
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Category filter chips */}
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

      {/* Articles grouped by category */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No articles found</p>
          <p className="text-sm">Try a different search term or browse a category above.</p>
        </div>
      ) : (
        <div className="space-y-3">
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
                    onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                    className="w-full flex items-center gap-4 p-4 text-left"
                  >
                    <div
                      className={`h-10 w-10 rounded-xl ${article.iconColor} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h3 className="font-semibold text-sm">{article.title}</h3>
                        <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                          {article.category}
                        </Badge>
                        {article.isNew && (
                          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                            New
                          </Badge>
                        )}
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
      )}

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-6 text-center cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate(isPublic ? "/contact" : "/app/support")}
      >
        <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
        <h3 className="font-semibold mb-1">Still have questions?</h3>
        <p className="text-sm text-muted-foreground">
          Open a support ticket and our team will get back to you within 24 hours.
        </p>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-3">
          Go to Support <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </motion.div>
    </div>
  );
}
