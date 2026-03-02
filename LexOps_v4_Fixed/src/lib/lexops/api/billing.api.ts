/**
 * LexOps — Billing API
 * Covers: time entries, disbursements, invoices, payments, credit notes, write-offs, retainers
 */
import { lexDB, callEdgeFunction } from '../supabase-client'
import type {
  TimeEntry, TimeEntryInsert, TimeEntryUpdate,
  Disbursement, DisbursementInsert, DisbursementUpdate,
  Invoice, InvoiceUpdate,
  Payment, PaymentInsert,
  CreditNote, CreditNoteInsert,
  WriteOffRequest, WriteOffRequestInsert,
  RetainerAccount, RetainerTransaction, RetainerTransactionInsert,
  ArAgingRow,
  GenerateInvoicePayload, GenerateInvoiceResponse,
  ApproveWriteOffPayload,
} from '../database.types'

// ============================================================
// TIME ENTRIES
// ============================================================
export const timeEntriesApi = {

  async getForMatter(matterId: string): Promise<TimeEntry[]> {
    const { data, error } = await lexDB('time_entries')
      .select('*, attorney:users!attorney_id(name)')
      .eq('matter_id', matterId)
      .order('date', { ascending: false })
    if (error) throw error
    return data
  },

  async getUnbilled(matterId?: string): Promise<TimeEntry[]> {
    let q = lexDB('time_entries')
      .select('*, matter:matters(reference_number, title), attorney:users!attorney_id(name)')
      .eq('billable', true)
      .eq('billed', false)
      .eq('written_off', false)
      .order('date', { ascending: false })
    if (matterId) q = q.eq('matter_id', matterId)
    const { data, error } = await q
    if (error) throw error
    return data
  },

  /** amount_zar is GENERATED — do not pass it in payload */
  async create(payload: TimeEntryInsert): Promise<TimeEntry> {
    const { data, error } = await lexDB('time_entries').insert(payload).select().single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: TimeEntryUpdate): Promise<TimeEntry> {
    const { data, error } = await lexDB('time_entries')
      .update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await lexDB('time_entries').delete().eq('id', id)
    if (error) throw error
  },
}

// ============================================================
// DISBURSEMENTS
// ============================================================
export const disbursementsApi = {

  async getForMatter(matterId: string): Promise<Disbursement[]> {
    const { data, error } = await lexDB('disbursements')
      .select('*')
      .eq('matter_id', matterId)
      .order('date', { ascending: false })
    if (error) throw error
    return data
  },

  async create(payload: DisbursementInsert): Promise<Disbursement> {
    const { data, error } = await lexDB('disbursements').insert(payload).select().single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: DisbursementUpdate): Promise<Disbursement> {
    const { data, error } = await lexDB('disbursements')
      .update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await lexDB('disbursements').delete().eq('id', id)
    if (error) throw error
  },
}

// ============================================================
// INVOICES
// ============================================================
export const invoicesApi = {

  async getAll(status?: Invoice['status']): Promise<Invoice[]> {
    let q = lexDB('invoices')
      .select(`
        *,
        client:clients(company_name),
        matter:matters(reference_number, title)
      `)
      .order('created_at', { ascending: false })
    if (status) q = q.eq('status', status)
    const { data, error } = await q
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await lexDB('invoices')
      .select(`
        *,
        client:clients(company_name, primary_contact_email, physical_address),
        matter:matters(reference_number, title),
        invoice_line_items(*),
        payments(*),
        credit_notes(*)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async getForMatter(matterId: string): Promise<Invoice[]> {
    const { data, error } = await lexDB('invoices')
      .select('*, invoice_line_items(*)')
      .eq('matter_id', matterId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  /**
   * Generate invoice via Edge Function.
   * Atomically: creates invoice shell → pulls unbilled time/disbursements
   * → calculates VAT → marks sources billed → posts journal entries.
   */
  async generate(payload: GenerateInvoicePayload): Promise<GenerateInvoiceResponse> {
    return callEdgeFunction<GenerateInvoicePayload, GenerateInvoiceResponse>(
      'lex-generate-invoice', payload
    )
  },

  async update(id: string, payload: InvoiceUpdate): Promise<Invoice> {
    const { data, error } = await lexDB('invoices')
      .update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async markSent(id: string): Promise<Invoice> {
    return invoicesApi.update(id, { status: 'sent', sent_at: new Date().toISOString() })
  },

  async void(id: string, reason: string): Promise<Invoice> {
    return invoicesApi.update(id, { status: 'voided', voided_reason: reason })
  },

  // ── AR AGING ─────────────────────────────────────────────────

  async getArAging(): Promise<ArAgingRow[]> {
    const { data, error } = await lexDB('v_ar_aging').select('*')
      .order('days_overdue', { ascending: false })
    if (error) throw error
    return data
  },

  async getOverdue(): Promise<Invoice[]> {
    const { data, error } = await lexDB('invoices')
      .select('*, client:clients(company_name, primary_contact_email)')
      .in('status', ['overdue'])
      .order('due_date')
    if (error) throw error
    return data
  },
}

// ============================================================
// PAYMENTS
// ============================================================
export const paymentsApi = {

  async getForInvoice(invoiceId: string): Promise<Payment[]> {
    const { data, error } = await lexDB('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('date', { ascending: false })
    if (error) throw error
    return data
  },

  /**
   * Record payment — triggers auto-update invoice status
   * (partially_paid / paid) and updates matter.total_collected_zar.
   */
  async create(payload: PaymentInsert): Promise<Payment> {
    const { data, error } = await lexDB('payments').insert(payload).select().single()
    if (error) throw error
    return data
  },
}

// ============================================================
// CREDIT NOTES
// ============================================================
export const creditNotesApi = {

  async create(payload: CreditNoteInsert): Promise<CreditNote> {
    const { data, error } = await lexDB('credit_notes').insert(payload).select().single()
    if (error) throw error
    return data
  },

  async getForClient(clientId: string): Promise<CreditNote[]> {
    const { data, error } = await lexDB('credit_notes')
      .select('*')
      .eq('client_id', clientId)
      .order('issue_date', { ascending: false })
    if (error) throw error
    return data
  },
}

// ============================================================
// WRITE-OFF REQUESTS
// ============================================================
export const writeOffApi = {

  async getPending(): Promise<WriteOffRequest[]> {
    const { data, error } = await lexDB('write_off_requests')
      .select(`
        *,
        matter:matters(reference_number, title),
        requester:users!requested_by(name)
      `)
      .eq('status', 'pending')
      .order('created_at')
    if (error) throw error
    return data
  },

  async request(payload: WriteOffRequestInsert): Promise<WriteOffRequest> {
    const { data, error } = await lexDB('write_off_requests').insert(payload).select().single()
    if (error) throw error
    return data
  },

  /**
   * Approve or reject via Edge Function (partner/admin only).
   * Triggers: marks time entries written_off, posts journal entry, notifies requester.
   */
  async approve(payload: ApproveWriteOffPayload): Promise<void> {
    await callEdgeFunction('lex-approve-write-off', payload)
  },
}

// ============================================================
// RETAINER ACCOUNTS
// ============================================================
export const retainersApi = {

  async getForClient(clientId: string): Promise<RetainerAccount | null> {
    const { data, error } = await lexDB('retainer_accounts')
      .select('*, retainer_transactions(*)')
      .eq('client_id', clientId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async createAccount(clientId: string, opts: {
    replenishment_threshold_zar: number
    monthly_amount_zar?: number
  }): Promise<RetainerAccount> {
    const { data, error } = await lexDB('retainer_accounts')
      .insert({ client_id: clientId, ...opts, current_balance_zar: 0 })
      .select()
      .single()
    if (error) throw error
    return data
  },

  /** Deposit/drawdown/adjustment — balance updated by trigger */
  async addTransaction(payload: RetainerTransactionInsert): Promise<RetainerTransaction> {
    const { data, error } = await lexDB('retainer_transactions').insert(payload).select().single()
    if (error) throw error
    return data
  },

  async getTransactions(retainerAccountId: string): Promise<RetainerTransaction[]> {
    const { data, error } = await lexDB('retainer_transactions')
      .select('*')
      .eq('retainer_account_id', retainerAccountId)
      .order('date', { ascending: false })
    if (error) throw error
    return data
  },
}
