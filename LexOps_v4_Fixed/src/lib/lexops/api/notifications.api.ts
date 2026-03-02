/**
 * LexOps — Notifications API
 */
import { lexDB, supabase } from '../supabase-client'
import type { Notification } from '../database.types'

export const notificationsApi = {

  async getUnread(userId: string): Promise<Notification[]> {
    const { data, error } = await lexDB('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getAll(userId: string, limit = 50): Promise<Notification[]> {
    const { data, error } = await lexDB('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  },

  async markRead(id: string): Promise<void> {
    const { error } = await lexDB('notifications').update({ read: true }).eq('id', id)
    if (error) throw error
  },

  async markAllRead(userId: string): Promise<void> {
    const { error } = await lexDB('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    if (error) throw error
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await lexDB('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
    if (error) throw error
    return count ?? 0
  },

  /**
   * Subscribe to real-time notifications for the current user.
   * Call the returned unsubscribe function on cleanup.
   */
  subscribe(userId: string, onNew: (n: Notification) => void) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'lex',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => onNew(payload.new as Notification),
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  },
}
