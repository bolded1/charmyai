export interface Document {
  id: string;
  fileName: string;
  type: 'expense_invoice' | 'sales_invoice' | 'receipt' | 'credit_note';
  supplier?: string;
  customer?: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  currency: string;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  vatNumber?: string;
  category: string;
  status: 'processing' | 'needs_review' | 'approved' | 'exported';
  uploadedAt: string;
  uploadedBy: string;
}

export interface Contact {
  id: string;
  name: string;
  type: 'supplier' | 'customer';
  vatNumber?: string;
  country: string;
  email?: string;
  phone?: string;
  defaultCategory?: string;
  documentsCount: number;
}

export interface AuditEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

export const mockDocuments: Document[] = [
  {
    id: '1', fileName: 'invoice-2024-001.pdf', type: 'expense_invoice',
    supplier: 'Acme Corp', invoiceNumber: 'INV-2024-001', date: '2024-03-15',
    dueDate: '2024-04-15', currency: 'EUR', netAmount: 1250.00, vatAmount: 262.50,
    totalAmount: 1512.50, vatNumber: 'DE123456789', category: 'Office Supplies',
    status: 'approved', uploadedAt: '2024-03-15T10:30:00', uploadedBy: 'John Doe'
  },
  {
    id: '2', fileName: 'receipt-coffee.jpg', type: 'receipt',
    supplier: 'Starbucks', invoiceNumber: 'R-00234', date: '2024-03-14',
    currency: 'EUR', netAmount: 12.50, vatAmount: 2.38, totalAmount: 14.88,
    category: 'Meals & Entertainment', status: 'approved',
    uploadedAt: '2024-03-14T14:20:00', uploadedBy: 'Jane Smith'
  },
  {
    id: '3', fileName: 'sales-inv-march.pdf', type: 'sales_invoice',
    customer: 'TechStart GmbH', invoiceNumber: 'SI-2024-042', date: '2024-03-12',
    dueDate: '2024-04-12', currency: 'EUR', netAmount: 5000.00, vatAmount: 950.00,
    totalAmount: 5950.00, vatNumber: 'DE987654321', category: 'Consulting Services',
    status: 'exported', uploadedAt: '2024-03-12T09:00:00', uploadedBy: 'John Doe'
  },
  {
    id: '4', fileName: 'aws-invoice-feb.pdf', type: 'expense_invoice',
    supplier: 'Amazon Web Services', invoiceNumber: 'AWS-2024-02', date: '2024-03-01',
    dueDate: '2024-03-31', currency: 'USD', netAmount: 847.23, vatAmount: 0,
    totalAmount: 847.23, category: 'Cloud Services', status: 'needs_review',
    uploadedAt: '2024-03-10T11:45:00', uploadedBy: 'Jane Smith'
  },
  {
    id: '5', fileName: 'office-rent-march.pdf', type: 'expense_invoice',
    supplier: 'Berlin Office Park', invoiceNumber: 'BOP-2024-03', date: '2024-03-01',
    dueDate: '2024-03-15', currency: 'EUR', netAmount: 3200.00, vatAmount: 608.00,
    totalAmount: 3808.00, vatNumber: 'DE111222333', category: 'Rent',
    status: 'approved', uploadedAt: '2024-03-01T08:00:00', uploadedBy: 'John Doe'
  },
  {
    id: '6', fileName: 'new-scan.pdf', type: 'expense_invoice',
    supplier: '', invoiceNumber: '', date: '2024-03-16',
    currency: 'EUR', netAmount: 0, vatAmount: 0, totalAmount: 0,
    category: '', status: 'processing',
    uploadedAt: '2024-03-16T16:00:00', uploadedBy: 'Jane Smith'
  },
];

export const mockContacts: Contact[] = [
  { id: '1', name: 'Acme Corp', type: 'supplier', vatNumber: 'DE123456789', country: 'Germany', email: 'billing@acme.com', defaultCategory: 'Office Supplies', documentsCount: 12 },
  { id: '2', name: 'TechStart GmbH', type: 'customer', vatNumber: 'DE987654321', country: 'Germany', email: 'finance@techstart.de', defaultCategory: 'Consulting Services', documentsCount: 8 },
  { id: '3', name: 'Amazon Web Services', type: 'supplier', country: 'USA', email: 'aws-billing@amazon.com', defaultCategory: 'Cloud Services', documentsCount: 24 },
  { id: '4', name: 'Berlin Office Park', type: 'supplier', vatNumber: 'DE111222333', country: 'Germany', email: 'invoice@berlinoffice.de', defaultCategory: 'Rent', documentsCount: 36 },
  { id: '5', name: 'Starbucks', type: 'supplier', country: 'Germany', defaultCategory: 'Meals & Entertainment', documentsCount: 5 },
];

export const mockAuditLog: AuditEntry[] = [
  { id: '1', action: 'Document uploaded', user: 'Jane Smith', timestamp: '2024-03-16T16:00:00', details: 'new-scan.pdf uploaded' },
  { id: '2', action: 'Document approved', user: 'John Doe', timestamp: '2024-03-15T11:00:00', details: 'invoice-2024-001.pdf approved' },
  { id: '3', action: 'Export generated', user: 'John Doe', timestamp: '2024-03-14T17:00:00', details: 'March expenses exported as CSV' },
  { id: '4', action: 'User invited', user: 'John Doe', timestamp: '2024-03-13T09:30:00', details: 'jane@company.com invited as Staff' },
  { id: '5', action: 'Document edited', user: 'Jane Smith', timestamp: '2024-03-12T14:15:00', details: 'SI-2024-042 VAT corrected' },
];

export const dashboardStats = {
  documentsUploaded: 156,
  expensesThisMonth: 8_570.73,
  incomeInvoices: 23_950.00,
  awaitingReview: 4,
  totalExtracted: 187_432.50,
};
