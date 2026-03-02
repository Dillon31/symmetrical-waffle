/**
 * LexOps — Matters API
 */
import { lexDB, callEdgeFunction } from '../supabase-client'
import type {
  Matter, MatterInsert, MatterUpdate,
  Party, PartyInsert,
  CorrespondenceLog, CorrespondenceLogInsert,
  MatterAssignmentHistory,
  WipSummaryRow, DeadlineAlertRow, CcmaTrackerRow,
  ConflictCheckPayload, ConflictCheckResponse,
} from '../database.types'

export const mattersApi = {

  /** All open/in-progress matters with client + attorney info */
  async getOpen(): Promise<Matter[]> {
    const { data, error } = await lexDB('matters')
      .select(`
        *,
        clients(company_name, primary_contact_email),
        responsible_attorney:users!responsible_attorney_id(name, email),
        supervising_partner:users!supervising_partner_id(name)
      `)
      .not('status', 'in', '("closed","archived")')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  /** Single matter — full detail with related entities */
  async getById(id: string) {
    const { data, error } = await lexDB('matters')
      .select(`
        *,
        clients(*),
        responsible_attorney:users!responsible_attorney_id(id, name, email, role),
        supervising_partner:users!supervising_partner_id(id, name, email),
        parties(*),
        correspondence_logs(* , logged_by_user:users!logged_by(name)),
        time_entries(*, attorney:users!attorney_id(name)),
        disbursements(*),
        tasks(*),
        documents(*)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  /** Create matter — reference_number, deadlines auto-set by triggers */
  async create(payload: MatterInsert): Promise<Matter> {
    const { data, error } = await lexDB('matters')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  /** Update matter — reassignment auto-logged by trigger */
  async update(id: string, payload: MatterUpdate): Promise<Matter> {
    const { data, error } = await lexDB('matters')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  /** Close a matter */
  async close(id: string, outcomeData: Pick<MatterUpdate, 'outcome' | 'outcome_notes'>): Promise<Matter> {
    return mattersApi.update(id, { ...outcomeData, status: 'closed' })
  },

  // ── DEADLINES & CCMA ─────────────────────────────────────────

  /** Deadline alerts view — sorted by urgency */
  async getDeadlineAlerts(): Promise<DeadlineAlertRow[]> {
    const { data, error } = await lexDB('v_deadline_alerts').select('*')
    if (error) throw error
    return data
  },

  /** CCMA tracker view */
  async getCcmaTracker(): Promise<CcmaTrackerRow[]> {
    const { data, error } = await lexDB('v_ccma_tracker').select('*')
    if (error) throw error
    return data
  },

  /** Matters with prescription expiring within N days */
  async getPrescriptionUrgent(daysAhead = 30): Promise<DeadlineAlertRow[]> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + daysAhead)
    const { data, error } = await lexDB('v_deadline_alerts')
      .select('*')
      .lte('prescription_deadline', cutoff.toISOString().split('T')[0])
      .order('prescription_days_remaining')
    if (error) throw error
    return data
  },

  // ── WIP ───────────────────────────────────────────────────────

  /** WIP summary per matter */
  async getWipSummary(): Promise<WipSummaryRow[]> {
    const { data, error } = await lexDB('v_wip_summary').select('*')
      .order('total_wip_zar', { ascending: false })
    if (error) throw error
    return data
  },

  /** WIP for a single matter */
  async getMatterWip(matterId: string): Promise<WipSummaryRow | null> {
    const { data, error } = await lexDB('v_wip_summary')
      .select('*')
      .eq('matter_id', matterId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  // ── PARTIES ───────────────────────────────────────────────────

  async getParties(matterId: string): Promise<Party[]> {
    const { data, error } = await lexDB('parties')
      .select('*')
      .eq('matter_id', matterId)
    if (error) throw error
    return data
  },

  async addParty(payload: PartyInsert): Promise<Party> {
    const { data, error } = await lexDB('parties').insert(payload).select().single()
    if (error) throw error
    return data
  },

  // ── CORRESPONDENCE ────────────────────────────────────────────

  async getCorrespondence(matterId: string): Promise<CorrespondenceLog[]> {
    const { data, error } = await lexDB('correspondence_logs')
      .select('*, logged_by_user:users!logged_by(name)')
      .eq('matter_id', matterId)
      .order('date', { ascending: false })
    if (error) throw error
    return data
  },

  async logCorrespondence(payload: CorrespondenceLogInsert): Promise<CorrespondenceLog> {
    const { data, error } = await lexDB('correspondence_logs')
      .insert(payload).select().single()
    if (error) throw error
    return data
  },

  // ── ASSIGNMENT HISTORY ────────────────────────────────────────

  async getAssignmentHistory(matterId: string): Promise<MatterAssignmentHistory[]> {
    const { data, error } = await lexDB('matter_assignment_history')
      .select(`
        *,
        from_attorney:users!from_attorney_id(name),
        to_attorney:users!to_attorney_id(name),
        changed_by_user:users!changed_by(name)
      `)
      .eq('matter_id', matterId)
      .order('changed_at', { ascending: false })
    if (error) throw error
    return data
  },

  // ── CONFLICT CHECK ────────────────────────────────────────────

  async runConflictCheck(payload: ConflictCheckPayload): Promise<ConflictCheckResponse> {
    return callEdgeFunction<ConflictCheckPayload, ConflictCheckResponse>(
      'lex-conflict-check', payload
    )
  },
}
