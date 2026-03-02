/**
 * LexOps Database Types — generated from lex schema
 * Project: botes-labour-law (iyxvfktcmvwxuhqqlxgt)
 * Schema: lex
 * Generated: 2026-03-01
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================
// ENUM TYPES
// ============================================================

export type UserRole = 'admin' | 'partner' | 'finance' | 'attorney' | 'user'

export type MatterType =
  | 'unfair_dismissal'
  | 'retrenchment'
  | 'ccma'
  | 'labour_court'
  | 'disciplinary'
  | 'employment_equity'
  | 'section_197'
  | 'other'

export type MatterStatus = 'open' | 'in_progress' | 'pending_outcome' | 'closed' | 'archived'

export type CcmaStage =
  | 'referral'
  | 'conciliation_scheduled'
  | 'conciliation_complete'
  | 'arbitration_scheduled'
  | 'arbitration_heard'
  | 'award_issued'
  | 'review_application'
  | 'lc_enforcement'

export type MatterOutcome =
  | 'settled'
  | 'award_in_favour'
  | 'award_against'
  | 'withdrawn'
  | 'dismissed'
  | 'pending'

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'written_off'
  | 'voided'
  | 'credit_note_issued'

export type PaymentMethod = 'eft' | 'cash' | 'cheque' | 'retainer_drawdown' | 'credit_note'
export type BillingArrangement = 'hourly' | 'fixed_fee' | 'retainer'
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
export type RetainerTxType = 'deposit' | 'drawdown' | 'adjustment'
export type FicaStatus = 'pending' | 'in_progress' | 'compliant' | 'non_compliant'
export type ConflictResult = 'clear' | 'possible_match' | 'hard_block'
export type ComplianceCategory = 'lpc' | 'fais' | 'fica' | 'popia' | 'labour' | 'tax' | 'other'
export type ComplianceStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type DocType = 'generated' | 'uploaded' | 'template' | 'correspondence'
export type NotificationType =
  | 'prescription_deadline'
  | 'overdue_invoice'
  | 'retainer_low'
  | 'fica_incomplete'
  | 'task_due'
  | 'matter_update'
  | 'write_off_request'
  | 'general'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type PartyType = 'employee' | 'union' | 'third_party'
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor'

// ============================================================
// TABLE TYPES — Row / Insert / Update
// ============================================================

export interface LexUser {
  id: string
  name: string
  email: string
  role: UserRole
  hourly_rate_zar: number
  active: boolean
  created_at: string
  updated_at: string
}
export type LexUserInsert = Omit<LexUser, 'created_at' | 'updated_at'>
export type LexUserUpdate = Partial<Omit<LexUser, 'id' | 'created_at' | 'updated_at'>>

export interface FirmSettings {
  id: string
  firm_name: string
  lpc_number: string | null
  physical_address: string | null
  postal_address: string | null
  bank_name: string | null
  bank_account_number: string | null
  bank_branch_code: string | null
  bank_account_type: string | null
  vat_registration_number: string | null
  vat_registered: boolean
  vat_rate: number
  overdue_interest_rate: number
  matter_reference_prefix: string
  default_hourly_rate_zar: number
  invoice_payment_terms_days: number
  trust_account_disclaimer: string | null
  updated_at: string
  updated_by: string | null
}
export type FirmSettingsUpdate = Partial<Omit<FirmSettings, 'id' | 'updated_at'>>

export interface Client {
  id: string
  company_name: string
  trading_name: string | null
  registration_number: string | null
  vat_number: string | null
  physical_address: string | null
  postal_address: string | null
  industry: string | null
  billing_arrangement: BillingArrangement
  membership_type: 'standard' | 'premium' | 'vip' | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  primary_contact_phone: string | null
  fica_status: FicaStatus
  conflict_check_status: 'pending' | 'clear' | 'flagged' | 'override'
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}
export type ClientInsert = Omit<Client, 'id' | 'created_at' | 'updated_at' | 'fica_status'>
export type ClientUpdate = Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>

export interface Contact {
  id: string
  client_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  id_number: string | null
  position: string | null
  is_primary: boolean
  created_at: string
  created_by: string | null
}
export type ContactInsert = Omit<Contact, 'id' | 'created_at'>
export type ContactUpdate = Partial<Omit<Contact, 'id' | 'client_id' | 'created_at'>>

export interface Matter {
  id: string
  reference_number: string | null
  title: string
  description: string | null
  client_id: string
  matter_type: MatterType
  status: MatterStatus
  billing_arrangement: BillingArrangement
  fixed_fee_amount_zar: number | null
  responsible_attorney_id: string
  supervising_partner_id: string | null
  dismissal_date: string | null
  referral_deadline: string | null      // AUTO-COMPUTED by trigger
  hearing_date: string | null
  prescription_deadline: string | null  // AUTO-COMPUTED by trigger
  ccma_case_number: string | null
  ccma_stage: CcmaStage | null
  outcome: MatterOutcome | null
  outcome_notes: string | null
  notes: string | null
  closed_at: string | null
  // Denormalised totals — maintained by triggers
  total_time_value_zar: number
  total_disbursements_zar: number
  total_invoiced_zar: number
  total_collected_zar: number
  created_at: string
  updated_at: string
  created_by: string | null
}
export type MatterInsert = Omit<
  Matter,
  | 'id'
  | 'reference_number'
  | 'referral_deadline'
  | 'prescription_deadline'
  | 'closed_at'
  | 'total_time_value_zar'
  | 'total_disbursements_zar'
  | 'total_invoiced_zar'
  | 'total_collected_zar'
  | 'created_at'
  | 'updated_at'
>
export type MatterUpdate = Partial<Omit<Matter, 'id' | 'reference_number' | 'created_at' | 'updated_at'>>

export interface Party {
  id: string
  matter_id: string
  party_type: PartyType
  name: string
  id_number: string | null
  email: string | null
  phone: string | null
  represented_by: string | null
  created_at: string
}
export type PartyInsert = Omit<Party, 'id' | 'created_at'>
export type PartyUpdate = Partial<Omit<Party, 'id' | 'matter_id' | 'created_at'>>

export interface TimeEntry {
  id: string
  matter_id: string
  attorney_id: string
  date: string
  hours: number
  rate_zar: number
  amount_zar: number  // GENERATED ALWAYS AS (hours * rate_zar) STORED
  description: string
  billable: boolean
  billed: boolean
  written_off: boolean
  invoice_id: string | null
  created_at: string
  created_by: string | null
}
export type TimeEntryInsert = Omit<TimeEntry, 'id' | 'amount_zar' | 'billed' | 'written_off' | 'invoice_id' | 'created_at'>
export type TimeEntryUpdate = Partial<Pick<TimeEntry, 'date' | 'hours' | 'rate_zar' | 'description' | 'billable'>>

export interface Disbursement {
  id: string
  matter_id: string
  date: string
  description: string
  amount_zar: number
  billable: boolean
  billed: boolean
  vat_inclusive: boolean
  receipt_url: string | null
  invoice_id: string | null
  created_at: string
  created_by: string | null
}
export type DisbursementInsert = Omit<Disbursement, 'id' | 'billed' | 'invoice_id' | 'created_at'>
export type DisbursementUpdate = Partial<Pick<Disbursement, 'description' | 'amount_zar' | 'billable' | 'vat_inclusive' | 'receipt_url'>>

export interface Invoice {
  id: string
  invoice_number: string | null        // AUTO-GENERATED by trigger
  client_id: string
  matter_id: string
  issue_date: string
  due_date: string                     // AUTO-SET from firm_settings if not provided
  status: InvoiceStatus
  subtotal_zar: number
  vat_amount_zar: number
  total_zar: number                    // GENERATED: subtotal + vat
  amount_paid_zar: number
  outstanding_zar: number              // GENERATED: total - paid
  notes: string | null
  voided_reason: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}
export type InvoiceInsert = Pick<Invoice, 'client_id' | 'matter_id' | 'notes'> & {
  due_date?: string
}
export type InvoiceUpdate = Partial<Pick<Invoice, 'status' | 'notes' | 'voided_reason' | 'sent_at'>>

export interface InvoiceLineItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_amount_zar: number
  total_zar: number                    // GENERATED: quantity * unit_amount
  vat_applicable: boolean
  vat_amount_zar: number
  source_type: 'time_entry' | 'disbursement' | 'milestone' | 'manual' | null
  source_id: string | null
  sort_order: number
}

export interface Payment {
  id: string
  invoice_id: string
  client_id: string
  date: string
  amount_zar: number
  method: PaymentMethod
  reference: string | null
  notes: string | null
  created_at: string
  created_by: string | null
}
export type PaymentInsert = Omit<Payment, 'id' | 'created_at'>

export interface CreditNote {
  id: string
  cn_number: string                    // AUTO-GENERATED by trigger
  invoice_id: string
  client_id: string
  issue_date: string
  amount_zar: number
  reason: string
  status: 'issued' | 'applied' | 'voided'
  created_at: string
  created_by: string | null
}
export type CreditNoteInsert = Omit<CreditNote, 'id' | 'cn_number' | 'created_at'>

export interface WriteOffRequest {
  id: string
  matter_id: string
  invoice_id: string | null
  requested_by: string
  amount_zar: number
  reason: string
  status: ApprovalStatus
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  created_at: string
}
export type WriteOffRequestInsert = Pick<WriteOffRequest, 'matter_id' | 'invoice_id' | 'amount_zar' | 'reason'>

export interface Task {
  id: string
  title: string
  description: string | null
  matter_id: string | null
  client_id: string | null
  assigned_to: string
  created_by: string
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}
export type TaskInsert = Omit<Task, 'id' | 'completed_at' | 'created_at' | 'updated_at'>
export type TaskUpdate = Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date' | 'assigned_to'>>

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  link: string | null
  matter_id: string | null
  client_id: string | null
  invoice_id: string | null
  created_at: string
}

export interface FicaChecklist {
  id: string
  client_id: string
  id_document: boolean
  proof_of_address: boolean
  company_registration: boolean
  directors_resolution: boolean
  tax_clearance: boolean
  bank_confirmation: boolean
  source_of_funds: boolean
  beneficial_ownership: boolean
  pep_declaration: boolean
  status: FicaStatus                   // AUTO-DERIVED by trigger
  completed_at: string | null
  expiry_date: string | null           // AUTO: completed_at + 3 years
  notes: string | null
  updated_at: string
}
export type FicaChecklistUpdate = Partial<
  Pick<FicaChecklist,
    | 'id_document' | 'proof_of_address' | 'company_registration'
    | 'directors_resolution' | 'tax_clearance' | 'bank_confirmation'
    | 'source_of_funds' | 'beneficial_ownership' | 'pep_declaration' | 'notes'
  >
>

export interface ConflictCheckLog {
  id: string
  check_date: string
  checked_by: string
  client_id: string | null
  party_name: string
  result: ConflictResult
  similarity_score: number | null
  matched_entity: string | null
  partner_override_by: string | null
  partner_override_reason: string | null
  partner_override_at: string | null
  created_at: string
}

export interface ComplianceItem {
  id: string
  title: string
  description: string | null
  category: ComplianceCategory
  due_date: string | null
  recurrence: 'once' | 'monthly' | 'quarterly' | 'annual' | null
  responsible_user_id: string | null
  status: ComplianceStatus
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
export type ComplianceItemInsert = Omit<ComplianceItem, 'id' | 'created_at' | 'updated_at'>
export type ComplianceItemUpdate = Partial<Omit<ComplianceItem, 'id' | 'created_at' | 'updated_at'>>

export interface Account {
  id: string
  code: string
  name: string
  type: AccountType
  subtype: string | null
  balance_zar: number
  description: string | null
  active: boolean
  created_at: string
}

export interface JournalEntry {
  id: string
  date: string
  reference: string
  description: string
  debit_account_id: string
  credit_account_id: string
  amount_zar: number
  matter_id: string | null
  invoice_id: string | null
  created_at: string
  created_by: string | null
}

export interface RetainerAccount {
  id: string
  client_id: string
  current_balance_zar: number
  replenishment_threshold_zar: number
  monthly_amount_zar: number | null
  status: 'active' | 'suspended' | 'closed'
  last_replenished_at: string | null
  created_at: string
}

export interface RetainerTransaction {
  id: string
  retainer_account_id: string
  date: string
  type: RetainerTxType
  amount_zar: number
  invoice_id: string | null
  notes: string | null
  created_at: string
  created_by: string | null
}
export type RetainerTransactionInsert = Omit<RetainerTransaction, 'id' | 'created_at'>

export interface CorrespondenceLog {
  id: string
  matter_id: string
  date: string
  direction: 'inbound' | 'outbound'
  channel: 'email' | 'letter' | 'phone' | 'in_person' | 'fax' | 'whatsapp'
  parties_involved: string | null
  summary: string
  logged_by: string
  created_at: string
}
export type CorrespondenceLogInsert = Omit<CorrespondenceLog, 'id' | 'created_at'>

export interface MatterAssignmentHistory {
  id: string
  matter_id: string
  from_attorney_id: string | null
  to_attorney_id: string
  changed_by: string
  reason: string | null
  changed_at: string
}

export interface Document {
  id: string
  title: string
  document_type: DocType
  matter_id: string | null
  client_id: string | null
  file_path: string | null
  version: number
  template_type: string | null
  generated_by: string | null
  created_at: string
}

export interface DocumentTemplate {
  id: string
  name: string
  template_type: string
  description: string | null
  required_fields: string[]
  optional_fields: string[]
  active: boolean
  created_at: string
}

export interface KnowledgeBase {
  id: string
  title: string
  content: string
  category: 'procedure' | 'precedent' | 'template' | 'research' | 'policy'
  tags: string[] | null
  author_id: string
  published: boolean
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  vat_number: string | null
  payment_terms: string | null
  active: boolean
  created_at: string
}

export interface Expense {
  id: string
  date: string
  description: string
  amount_zar: number
  category: string
  vendor_id: string | null
  account_id: string | null
  receipt_url: string | null
  reimbursable: boolean
  notes: string | null
  created_at: string
  created_by: string | null
}

// ============================================================
// VIEW TYPES
// ============================================================

export interface ArAgingRow {
  company_name: string
  invoice_number: string
  issue_date: string
  due_date: string
  total_zar: number
  outstanding_zar: number
  days_overdue: number
  aging_bucket: 'current' | '1_30_days' | '31_60_days' | '61_90_days' | '90_plus_days'
  invoice_id: string
  client_id: string
}

export interface WipSummaryRow {
  matter_id: string
  reference_number: string | null
  title: string
  billing_arrangement: BillingArrangement
  matter_status: MatterStatus
  client_name: string
  responsible_attorney: string
  total_hours: number
  time_value_zar: number
  disbursements_zar: number
  total_wip_zar: number
}

export interface DeadlineAlertRow {
  matter_id: string
  reference_number: string | null
  title: string
  client_name: string
  dismissal_date: string | null
  referral_deadline: string | null
  referral_days_remaining: number | null
  prescription_deadline: string | null
  prescription_days_remaining: number | null
  ccma_stage: CcmaStage | null
  ccma_case_number: string | null
  responsible_attorney: string
  attorney_email: string
}

export interface DashboardKpis {
  open_matters: number
  pending_tasks: number
  active_clients: number
  overdue_invoices: number
  total_outstanding_zar: number
  total_wip_zar: number
  fica_incomplete_count: number
  compliance_due_30d: number
}

export interface CcmaTrackerRow {
  matter_id: string
  reference_number: string | null
  title: string
  client_name: string
  matter_type: MatterType
  ccma_stage: CcmaStage | null
  ccma_case_number: string | null
  dismissal_date: string | null
  referral_deadline: string | null
  prescription_deadline: string | null
  days_to_prescription: number | null
  hearing_date: string | null
  outcome: MatterOutcome | null
  responsible_attorney: string
  employee_name: string | null
}

// ============================================================
// EDGE FUNCTION PAYLOADS
// ============================================================

export interface GenerateInvoicePayload {
  matter_id: string
  client_id: string
  notes?: string
}
export interface GenerateInvoiceResponse {
  invoice_id: string
  invoice: Invoice & { invoice_line_items: InvoiceLineItem[] }
}

export interface ConflictCheckPayload {
  party_name: string
  client_id?: string
  checked_by: string
}
export interface ConflictCheckMatch {
  entity_type: 'client' | 'client_trading' | 'party'
  entity_id: string
  matched_name: string
  score: number
}
export interface ConflictCheckResponse {
  result: ConflictResult
  score: number
  matches: ConflictCheckMatch[]
  log_id: string
}

export interface ApproveWriteOffPayload {
  request_id: string
  approved: boolean
  rejection_reason?: string
}

export interface GenerateDocumentPayload {
  template_type: string
  matter_id?: string
  field_values?: Record<string, string>
}
export interface GenerateDocumentResponse {
  document_id: string
  content: string
  title: string
  template_name: string
  auto_filled_fields: string[]
  missing_fields?: string[]
}
