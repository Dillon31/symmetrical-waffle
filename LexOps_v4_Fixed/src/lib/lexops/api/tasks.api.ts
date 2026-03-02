/**
 * LexOps — Tasks API
 */
import { lexDB } from '../supabase-client'
import type { Task, TaskInsert, TaskUpdate } from '../database.types'

export const tasksApi = {

  /** Tasks assigned to current user or all tasks (finance/admin) */
  async getMyTasks(userId: string): Promise<Task[]> {
    const { data, error } = await lexDB('tasks')
      .select(`
        *,
        matter:matters(reference_number, title),
        client:clients(company_name),
        assigned_to_user:users!assigned_to(name)
      `)
      .eq('assigned_to', userId)
      .not('status', 'in', '("completed","cancelled")')
      .order('due_date', { nullsFirst: false })
    if (error) throw error
    return data
  },

  async getAll(): Promise<Task[]> {
    const { data, error } = await lexDB('tasks')
      .select(`
        *,
        matter:matters(reference_number, title),
        assigned_to_user:users!assigned_to(name),
        created_by_user:users!created_by(name)
      `)
      .not('status', 'in', '("completed","cancelled")')
      .order('priority', { ascending: false })
      .order('due_date', { nullsFirst: false })
    if (error) throw error
    return data
  },

  async getForMatter(matterId: string): Promise<Task[]> {
    const { data, error } = await lexDB('tasks')
      .select('*, assigned_to_user:users!assigned_to(name)')
      .eq('matter_id', matterId)
      .order('due_date', { nullsFirst: false })
    if (error) throw error
    return data
  },

  async create(payload: TaskInsert): Promise<Task> {
    const { data, error } = await lexDB('tasks').insert(payload).select().single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: TaskUpdate): Promise<Task> {
    const { data, error } = await lexDB('tasks')
      .update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  /** Marks completed — completed_at auto-set by trigger */
  async complete(id: string): Promise<Task> {
    return tasksApi.update(id, { status: 'completed' })
  },

  async delete(id: string): Promise<void> {
    const { error } = await lexDB('tasks').delete().eq('id', id)
    if (error) throw error
  },

  /** Tasks overdue (due_date < today, status not terminal) */
  async getOverdue(): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await lexDB('tasks')
      .select('*, assigned_to_user:users!assigned_to(name)')
      .lt('due_date', today)
      .not('status', 'in', '("completed","cancelled")')
      .order('due_date')
    if (error) throw error
    return data
  },
}
