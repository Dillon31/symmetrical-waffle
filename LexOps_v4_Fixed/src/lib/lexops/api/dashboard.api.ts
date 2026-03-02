/**
 * LexOps — Dashboard API
 */
import { lexDB } from '../supabase-client'
import type { DashboardKpis, ArAgingRow, WipSummaryRow, DeadlineAlertRow } from '../database.types'

export const dashboardApi = {

  /** Single-row KPI snapshot — sourced from v_dashboard_kpis view */
  async getKpis(): Promise<DashboardKpis> {
    const { data, error } = await lexDB('v_dashboard_kpis').select('*').single()
    if (error) throw error
    return data
  },

  /** Combined dashboard fetch — all data in one round-trip */
  async getDashboardData() {
    const [kpis, aging, wip, deadlines] = await Promise.all([
      lexDB('v_dashboard_kpis').select('*').single(),
      lexDB('v_ar_aging').select('*').order('days_overdue', { ascending: false }).limit(20),
      lexDB('v_wip_summary').select('*').order('total_wip_zar', { ascending: false }).limit(20),
      lexDB('v_deadline_alerts').select('*').limit(15),
    ])

    if (kpis.error) throw kpis.error
    if (aging.error) throw aging.error
    if (wip.error) throw wip.error
    if (deadlines.error) throw deadlines.error

    return {
      kpis: kpis.data as DashboardKpis,
      arAging: aging.data as ArAgingRow[],
      wip: wip.data as WipSummaryRow[],
      deadlines: deadlines.data as DeadlineAlertRow[],
    }
  },

  /** Trial balance — used on Finance tab */
  async getTrialBalance() {
    const { data, error } = await lexDB('v_trial_balance').select('*')
    if (error) throw error
    return data
  },
}
