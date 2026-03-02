/**
 * LexOps — Clients API
 */
import { lexDB, supabase } from '../supabase-client'
import type { Client, ClientInsert, ClientUpdate, FicaChecklist, FicaChecklistUpdate, Contact, ContactInsert } from '../database.types'

export const clientsApi = {

  /** All active clients, ordered by company name */
  async getAll(): Promise<Client[]> {
    const { data, error } = await lexDB('clients')
      .select('*')
      .eq('active', true)
      .order('company_name')
    if (error) throw error
    return data
  },

  /** Single client with contacts, fica, and retainer balance */
  async getById(id: string) {
    const { data, error } = await lexDB('clients')
      .select(`
        *,
        contacts(*),
        fica_checklists(*),
        retainer_accounts(*)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  /** Full-text + trigram search (uses GIN indexes) */
  async search(query: string): Promise<Client[]> {
    const { data, error } = await supabase
      .schema('lex')
      .rpc('global_search', { search_query: query })
    if (error) throw error
    // Filter to clients only
    return (data as Array<{ result_type: string; id: string }>)
      .filter(r => r.result_type === 'client')
      .map(r => ({ id: r.id } as Client))
  },

  /** Create new client (auto-creates FICA checklist via trigger) */
  async create(payload: ClientInsert): Promise<Client> {
    const { data, error } = await lexDB('clients')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  /** Update client */
  async update(id: string, payload: ClientUpdate): Promise<Client> {
    const { data, error } = await lexDB('clients')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  /** Soft-delete (deactivate) */
  async deactivate(id: string): Promise<void> {
    const { error } = await lexDB('clients').update({ active: false }).eq('id', id)
    if (error) throw error
  },

  // ── FICA ────────────────────────────────────────────────────

  /** Get FICA checklist for a client */
  async getFica(clientId: string): Promise<FicaChecklist> {
    const { data, error } = await lexDB('fica_checklists')
      .select('*')
      .eq('client_id', clientId)
      .single()
    if (error) throw error
    return data
  },

  /**
   * Update FICA checklist items.
   * The trigger auto-derives status, completed_at and expiry_date.
   */
  async updateFica(clientId: string, payload: FicaChecklistUpdate): Promise<FicaChecklist> {
    const { data, error } = await lexDB('fica_checklists')
      .update(payload)
      .eq('client_id', clientId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ── CONTACTS ─────────────────────────────────────────────────

  async getContacts(clientId: string): Promise<Contact[]> {
    const { data, error } = await lexDB('contacts')
      .select('*')
      .eq('client_id', clientId)
      .order('is_primary', { ascending: false })
    if (error) throw error
    return data
  },

  async addContact(payload: ContactInsert): Promise<Contact> {
    const { data, error } = await lexDB('contacts')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
