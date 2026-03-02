/**
 * LexOps — Users & Firm Settings API
 */
import { lexDB } from '../supabase-client'
import type { LexUser, LexUserInsert, LexUserUpdate, FirmSettings, FirmSettingsUpdate } from '../database.types'

export const usersApi = {

  async getAll(): Promise<LexUser[]> {
    const { data, error } = await lexDB('users')
      .select('*')
      .eq('active', true)
      .order('name')
    if (error) throw error
    return data
  },

  async getById(id: string): Promise<LexUser> {
    const { data, error } = await lexDB('users').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async getAttorneys(): Promise<LexUser[]> {
    const { data, error } = await lexDB('users')
      .select('*')
      .in('role', ['attorney', 'partner', 'admin'])
      .eq('active', true)
      .order('name')
    if (error) throw error
    return data
  },

  /** Insert user record after auth.users entry is created */
  async create(payload: LexUserInsert): Promise<LexUser> {
    const { data, error } = await lexDB('users').insert(payload).select().single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: LexUserUpdate): Promise<LexUser> {
    const { data, error } = await lexDB('users').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },
}

// ============================================================
// FIRM SETTINGS (singleton row, id = 1)
// ============================================================
export const firmSettingsApi = {

  async get(): Promise<FirmSettings> {
    const { data, error } = await lexDB('firm_settings').select('*').single()
    if (error) throw error
    return data
  },

  async update(payload: FirmSettingsUpdate): Promise<FirmSettings> {
    const { data, error } = await lexDB('firm_settings')
      .update(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
