/**
 * LexOps — Compliance API
 * Covers regulatory compliance items and knowledge base
 */
import { lexDB } from '../supabase-client'
import type { ComplianceItem, ComplianceItemInsert, ComplianceItemUpdate, KnowledgeBase } from '../database.types'

export const complianceApi = {

  async getAll(): Promise<ComplianceItem[]> {
    const { data, error } = await lexDB('compliance_items')
      .select('*, responsible_user:users!responsible_user_id(name)')
      .order('due_date', { nullsFirst: false })
    if (error) throw error
    return data
  },

  async getOverdue(): Promise<ComplianceItem[]> {
    const { data, error } = await lexDB('compliance_items')
      .select('*')
      .eq('status', 'overdue')
      .order('due_date')
    if (error) throw error
    return data
  },

  async getDueSoon(days = 30): Promise<ComplianceItem[]> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + days)
    const { data, error } = await lexDB('compliance_items')
      .select('*')
      .not('status', 'eq', 'completed')
      .lte('due_date', cutoff.toISOString().split('T')[0])
      .order('due_date')
    if (error) throw error
    return data
  },

  async create(payload: ComplianceItemInsert): Promise<ComplianceItem> {
    const { data, error } = await lexDB('compliance_items').insert(payload).select().single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: ComplianceItemUpdate): Promise<ComplianceItem> {
    const { data, error } = await lexDB('compliance_items')
      .update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async complete(id: string): Promise<ComplianceItem> {
    return complianceApi.update(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
  },
}

// ============================================================
// KNOWLEDGE BASE
// ============================================================
export const knowledgeBaseApi = {

  async getAll(): Promise<KnowledgeBase[]> {
    const { data, error } = await lexDB('knowledge_base')
      .select('*, author:users!author_id(name)')
      .eq('published', true)
      .order('title')
    if (error) throw error
    return data
  },

  async getById(id: string): Promise<KnowledgeBase> {
    const { data, error } = await lexDB('knowledge_base')
      .select('*, author:users!author_id(name)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async search(query: string): Promise<KnowledgeBase[]> {
    const { data, error } = await lexDB('knowledge_base')
      .select('*')
      .textSearch('content', query, { type: 'websearch', config: 'english' })
      .eq('published', true)
    if (error) throw error
    return data
  },

  async create(payload: Omit<KnowledgeBase, 'id' | 'created_at' | 'updated_at'>): Promise<KnowledgeBase> {
    const { data, error } = await lexDB('knowledge_base').insert(payload).select().single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: Partial<KnowledgeBase>): Promise<KnowledgeBase> {
    const { data, error } = await lexDB('knowledge_base')
      .update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },
}
