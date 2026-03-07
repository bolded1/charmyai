export interface AdminOrganization {
  id: string;
  name: string;
  owner: string;
  ownerEmail: string;
  plan: 'starter' | 'professional' | 'enterprise';
  users: number;
  documentsUploaded: number;
  documentsProcessed: number;
  storageUsedMB: number;
  createdAt: string;
  status: 'active' | 'suspended' | 'trial';
  country: string;
  vatNumber?: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  organization: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'accountant' | 'staff';
  status: 'active' | 'disabled' | 'pending';
  lastLogin: string;
  createdAt: string;
}

export interface AdminDocument {
  id: string;
  organization: string;
  user: string;
  fileName: string;
  documentType: 'expense_invoice' | 'sales_invoice' | 'receipt' | 'credit_note';
  status: 'processing' | 'needs_review' | 'approved' | 'failed';
  uploadDate: string;
  processingTime?: number;
  confidence?: number;
}

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  user: string;
  organization: string;
  action: string;
  entity: string;
  details: string;
}

export const adminOrganizations: AdminOrganization[] = [
  { id: '1', name: 'Acme Corp', owner: 'John Doe', ownerEmail: 'john@acme.com', plan: 'professional', users: 5, documentsUploaded: 342, documentsProcessed: 328, storageUsedMB: 1240, createdAt: '2024-01-15', status: 'active', country: 'Germany', vatNumber: 'DE123456789', billingCycle: 'monthly', nextBillingDate: '2024-04-15' },
  { id: '2', name: 'TechStart GmbH', owner: 'Maria Schmidt', ownerEmail: 'maria@techstart.de', plan: 'enterprise', users: 12, documentsUploaded: 1205, documentsProcessed: 1198, storageUsedMB: 4520, createdAt: '2023-11-20', status: 'active', country: 'Germany', vatNumber: 'DE987654321', billingCycle: 'yearly', nextBillingDate: '2024-11-20' },
  { id: '3', name: 'Weber & Partners', owner: 'Thomas Weber', ownerEmail: 'thomas@weber.de', plan: 'professional', users: 3, documentsUploaded: 89, documentsProcessed: 85, storageUsedMB: 320, createdAt: '2024-02-01', status: 'active', country: 'Germany', billingCycle: 'monthly', nextBillingDate: '2024-04-01' },
  { id: '4', name: 'Nordic Finance', owner: 'Erik Larsen', ownerEmail: 'erik@nordicfin.no', plan: 'starter', users: 1, documentsUploaded: 23, documentsProcessed: 20, storageUsedMB: 78, createdAt: '2024-03-01', status: 'trial', country: 'Norway', billingCycle: 'monthly', nextBillingDate: '2024-04-01' },
  { id: '5', name: 'Retail Hub Ltd', owner: 'Sarah Chen', ownerEmail: 'sarah@retailhub.co.uk', plan: 'professional', users: 4, documentsUploaded: 567, documentsProcessed: 554, storageUsedMB: 1890, createdAt: '2023-09-12', status: 'active', country: 'UK', vatNumber: 'GB123456789', billingCycle: 'yearly', nextBillingDate: '2024-09-12' },
  { id: '6', name: 'CloudBooks Inc', owner: 'Alex Rivera', ownerEmail: 'alex@cloudbooks.com', plan: 'enterprise', users: 8, documentsUploaded: 2340, documentsProcessed: 2301, storageUsedMB: 8750, createdAt: '2023-06-05', status: 'active', country: 'USA', billingCycle: 'yearly', nextBillingDate: '2024-06-05' },
  { id: '7', name: 'FreshStart BV', owner: 'Jan de Vries', ownerEmail: 'jan@freshstart.nl', plan: 'starter', users: 1, documentsUploaded: 12, documentsProcessed: 10, storageUsedMB: 35, createdAt: '2024-03-10', status: 'trial', country: 'Netherlands', billingCycle: 'monthly', nextBillingDate: '2024-04-10' },
  { id: '8', name: 'OldBooks GmbH', owner: 'Franz Müller', ownerEmail: 'franz@oldbooks.de', plan: 'professional', users: 2, documentsUploaded: 145, documentsProcessed: 140, storageUsedMB: 510, createdAt: '2024-01-20', status: 'suspended', country: 'Germany', vatNumber: 'DE555666777', billingCycle: 'monthly', nextBillingDate: '2024-03-20' },
];

export const adminUsers: AdminUser[] = [
  { id: '1', name: 'John Doe', email: 'john@acme.com', organization: 'Acme Corp', organizationId: '1', role: 'owner', status: 'active', lastLogin: '2024-03-16T14:30:00', createdAt: '2024-01-15' },
  { id: '2', name: 'Jane Smith', email: 'jane@acme.com', organization: 'Acme Corp', organizationId: '1', role: 'accountant', status: 'active', lastLogin: '2024-03-16T10:00:00', createdAt: '2024-01-20' },
  { id: '3', name: 'Mike Wilson', email: 'mike@acme.com', organization: 'Acme Corp', organizationId: '1', role: 'staff', status: 'active', lastLogin: '2024-03-15T16:45:00', createdAt: '2024-02-05' },
  { id: '4', name: 'Maria Schmidt', email: 'maria@techstart.de', organization: 'TechStart GmbH', organizationId: '2', role: 'owner', status: 'active', lastLogin: '2024-03-16T09:00:00', createdAt: '2023-11-20' },
  { id: '5', name: 'Thomas Weber', email: 'thomas@weber.de', organization: 'Weber & Partners', organizationId: '3', role: 'owner', status: 'active', lastLogin: '2024-03-14T11:20:00', createdAt: '2024-02-01' },
  { id: '6', name: 'Erik Larsen', email: 'erik@nordicfin.no', organization: 'Nordic Finance', organizationId: '4', role: 'owner', status: 'active', lastLogin: '2024-03-13T15:00:00', createdAt: '2024-03-01' },
  { id: '7', name: 'Sarah Chen', email: 'sarah@retailhub.co.uk', organization: 'Retail Hub Ltd', organizationId: '5', role: 'owner', status: 'active', lastLogin: '2024-03-16T08:30:00', createdAt: '2023-09-12' },
  { id: '8', name: 'Alex Rivera', email: 'alex@cloudbooks.com', organization: 'CloudBooks Inc', organizationId: '6', role: 'owner', status: 'active', lastLogin: '2024-03-16T12:00:00', createdAt: '2023-06-05' },
  { id: '9', name: 'Lisa Park', email: 'lisa@cloudbooks.com', organization: 'CloudBooks Inc', organizationId: '6', role: 'admin', status: 'active', lastLogin: '2024-03-15T17:30:00', createdAt: '2023-07-10' },
  { id: '10', name: 'Sarah Johnson', email: 'sarah@acme.com', organization: 'Acme Corp', organizationId: '1', role: 'admin', status: 'pending', lastLogin: '', createdAt: '2024-03-13' },
  { id: '11', name: 'Franz Müller', email: 'franz@oldbooks.de', organization: 'OldBooks GmbH', organizationId: '8', role: 'owner', status: 'disabled', lastLogin: '2024-02-28T10:00:00', createdAt: '2024-01-20' },
];

export const adminDocuments: AdminDocument[] = [
  { id: 'DOC-001', organization: 'Acme Corp', user: 'Jane Smith', fileName: 'invoice-2024-001.pdf', documentType: 'expense_invoice', status: 'approved', uploadDate: '2024-03-16T10:30:00', processingTime: 3.2, confidence: 97 },
  { id: 'DOC-002', organization: 'TechStart GmbH', user: 'Maria Schmidt', fileName: 'sales-inv-march.pdf', documentType: 'sales_invoice', status: 'approved', uploadDate: '2024-03-16T09:15:00', processingTime: 2.8, confidence: 99 },
  { id: 'DOC-003', organization: 'Acme Corp', user: 'Mike Wilson', fileName: 'receipt-coffee.jpg', documentType: 'receipt', status: 'needs_review', uploadDate: '2024-03-16T14:20:00', processingTime: 4.1, confidence: 72 },
  { id: 'DOC-004', organization: 'Retail Hub Ltd', user: 'Sarah Chen', fileName: 'supplier-inv-456.pdf', documentType: 'expense_invoice', status: 'approved', uploadDate: '2024-03-15T16:00:00', processingTime: 2.5, confidence: 95 },
  { id: 'DOC-005', organization: 'CloudBooks Inc', user: 'Alex Rivera', fileName: 'credit-note-cn01.pdf', documentType: 'credit_note', status: 'approved', uploadDate: '2024-03-15T11:30:00', processingTime: 3.0, confidence: 94 },
  { id: 'DOC-006', organization: 'Nordic Finance', user: 'Erik Larsen', fileName: 'scan-blurry.jpg', documentType: 'expense_invoice', status: 'failed', uploadDate: '2024-03-15T09:45:00', processingTime: 8.5, confidence: 23 },
  { id: 'DOC-007', organization: 'Acme Corp', user: 'John Doe', fileName: 'aws-invoice-feb.pdf', documentType: 'expense_invoice', status: 'processing', uploadDate: '2024-03-16T16:00:00' },
  { id: 'DOC-008', organization: 'Weber & Partners', user: 'Thomas Weber', fileName: 'client-inv-w045.pdf', documentType: 'sales_invoice', status: 'approved', uploadDate: '2024-03-14T13:00:00', processingTime: 2.1, confidence: 98 },
  { id: 'DOC-009', organization: 'CloudBooks Inc', user: 'Lisa Park', fileName: 'office-receipt.png', documentType: 'receipt', status: 'needs_review', uploadDate: '2024-03-14T10:20:00', processingTime: 5.2, confidence: 68 },
  { id: 'DOC-010', organization: 'TechStart GmbH', user: 'Maria Schmidt', fileName: 'vendor-inv-789.pdf', documentType: 'expense_invoice', status: 'approved', uploadDate: '2024-03-13T15:45:00', processingTime: 2.3, confidence: 96 },
];

export const adminAuditLogs: AdminAuditEntry[] = [
  { id: '1', timestamp: '2024-03-16T16:05:00', user: 'John Doe', organization: 'Acme Corp', action: 'document_uploaded', entity: 'Document', details: 'aws-invoice-feb.pdf uploaded' },
  { id: '2', timestamp: '2024-03-16T14:20:00', user: 'Mike Wilson', organization: 'Acme Corp', action: 'document_uploaded', entity: 'Document', details: 'receipt-coffee.jpg uploaded' },
  { id: '3', timestamp: '2024-03-16T12:00:00', user: 'System', organization: 'TechStart GmbH', action: 'document_processed', entity: 'Document', details: 'sales-inv-march.pdf processed successfully' },
  { id: '4', timestamp: '2024-03-16T10:30:00', user: 'Jane Smith', organization: 'Acme Corp', action: 'document_approved', entity: 'Document', details: 'invoice-2024-001.pdf approved' },
  { id: '5', timestamp: '2024-03-16T09:00:00', user: 'Maria Schmidt', organization: 'TechStart GmbH', action: 'export_generated', entity: 'Export', details: 'March expenses exported as CSV' },
  { id: '6', timestamp: '2024-03-15T17:30:00', user: 'Alex Rivera', organization: 'CloudBooks Inc', action: 'user_invited', entity: 'User', details: 'dev@cloudbooks.com invited as Staff' },
  { id: '7', timestamp: '2024-03-15T16:00:00', user: 'Sarah Chen', organization: 'Retail Hub Ltd', action: 'document_uploaded', entity: 'Document', details: 'supplier-inv-456.pdf uploaded' },
  { id: '8', timestamp: '2024-03-15T14:00:00', user: 'System', organization: 'Nordic Finance', action: 'document_failed', entity: 'Document', details: 'scan-blurry.jpg failed processing — low quality' },
  { id: '9', timestamp: '2024-03-15T11:30:00', user: 'Alex Rivera', organization: 'CloudBooks Inc', action: 'document_uploaded', entity: 'Document', details: 'credit-note-cn01.pdf uploaded' },
  { id: '10', timestamp: '2024-03-14T13:00:00', user: 'Thomas Weber', organization: 'Weber & Partners', action: 'document_uploaded', entity: 'Document', details: 'client-inv-w045.pdf uploaded' },
  { id: '11', timestamp: '2024-03-14T10:20:00', user: 'Lisa Park', organization: 'CloudBooks Inc', action: 'document_edited', entity: 'Document', details: 'office-receipt.png VAT amount corrected' },
  { id: '12', timestamp: '2024-03-13T15:00:00', user: 'System', organization: 'Acme Corp', action: 'user_registered', entity: 'User', details: 'sarah@acme.com registered as Admin' },
  { id: '13', timestamp: '2024-03-13T10:00:00', user: 'System', organization: 'Nordic Finance', action: 'organization_created', entity: 'Organization', details: 'Nordic Finance created (trial)' },
  { id: '14', timestamp: '2024-03-12T09:00:00', user: 'System', organization: 'OldBooks GmbH', action: 'subscription_suspended', entity: 'Subscription', details: 'Payment failed — subscription suspended' },
];

export const adminDashboardStats = {
  totalOrganizations: 8,
  totalUsers: 36,
  documentsUploaded: 4723,
  documentsProcessed: 4636,
  awaitingReview: 14,
  processingSuccessRate: 98.2,
  storageUsedGB: 17.3,
  aiProcessingHours: 42.5,
};

export const dailyProcessingData = [
  { date: 'Mar 10', uploads: 45, processed: 43, failed: 2 },
  { date: 'Mar 11', uploads: 62, processed: 60, failed: 2 },
  { date: 'Mar 12', uploads: 38, processed: 37, failed: 1 },
  { date: 'Mar 13', uploads: 71, processed: 69, failed: 2 },
  { date: 'Mar 14', uploads: 55, processed: 54, failed: 1 },
  { date: 'Mar 15', uploads: 48, processed: 46, failed: 2 },
  { date: 'Mar 16', uploads: 67, processed: 64, failed: 3 },
];

export const orgActivityData = [
  { name: 'CloudBooks Inc', documents: 2340 },
  { name: 'TechStart GmbH', documents: 1205 },
  { name: 'Retail Hub Ltd', documents: 567 },
  { name: 'Acme Corp', documents: 342 },
  { name: 'OldBooks GmbH', documents: 145 },
  { name: 'Weber & Partners', documents: 89 },
  { name: 'Nordic Finance', documents: 23 },
  { name: 'FreshStart BV', documents: 12 },
];
