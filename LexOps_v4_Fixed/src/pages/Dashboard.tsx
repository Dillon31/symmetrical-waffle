import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, FileText, Clock, AlertTriangle,
  CheckSquare, DollarSign, Users, TrendingUp,
} from 'lucide-react'
import { dashboardApi } from '@/lib/lexops'
import type { DashboardKpis, DeadlineAlertRow, ArAgingRow, WipSummaryRow } from '@/lib/lexops'
import { useAuth, isFinanceRole } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

// ── KPI card ─────────────────────────────────────────────────

function KPICard({
  title, value, sub, icon: Icon, color, onClick,
}: {
  title: string; value: string; sub?: string
  icon: React.ElementType; color: string; onClick?: () => void
}) {
  return (
    <Card
      className={`p-5 ${onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </Card>
  )
}

// ── Skeleton loader ───────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card className="p-5">
      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
      <div className="mt-3 h-8 w-16 animate-pulse rounded bg-gray-200" />
    </Card>
  )
}

// ── Helpers ───────────────────────────────────────────────────

function formatZAR(n: number) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n)
}

function daysLabel(days: number | null) {
  if (days === null) return '—'
  if (days < 0)  return `${Math.abs(days)}d overdue`
  if (days === 0) return 'today'
  return `${days}d`
}

function urgencyColor(days: number | null) {
  if (days === null) return 'bg-gray-100 text-gray-600'
  if (days <= 7)  return 'bg-red-100 text-red-700'
  if (days <= 30) return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

// ── Dashboard ─────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  const canViewFinance = user ? isFinanceRole(user.role) : false
  const navigate = useNavigate()

  const [kpis, setKpis]           = useState<DashboardKpis | null>(null)
  const [deadlines, setDeadlines] = useState<DeadlineAlertRow[]>([])
  const [aging, setAging]         = useState<ArAgingRow[]>([])
  const [wip, setWip]             = useState<WipSummaryRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // Single round-trip — four DB views fetched in parallel via dashboardApi
        const data = await dashboardApi.getDashboardData()
        if (cancelled) return
        setKpis(data.kpis)
        setDeadlines(data.deadlines)
        setAging(data.arAging)
        setWip(data.wip)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Welcome back, {user?.name.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500">Here's what's happening at the firm today.</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KPICard
              title="Open Matters" value={String(kpis?.open_matters ?? 0)} sub="active cases"
              icon={Briefcase} color="bg-blue-500"
              onClick={() => navigate('/matters')}
            />
            <KPICard
              title="Pending Tasks" value={String(kpis?.pending_tasks ?? 0)}
              sub={canViewFinance ? 'firm-wide' : 'assigned to me'}
              icon={CheckSquare} color="bg-amber-500"
              onClick={() => navigate('/tasks')}
            />
            <KPICard
              title="Active Clients" value={String(kpis?.active_clients ?? 0)} sub="employer clients"
              icon={Users} color="bg-teal-600"
              onClick={() => navigate('/clients')}
            />
            {canViewFinance ? (
              <KPICard
                title="Overdue Invoices" value={String(kpis?.overdue_invoices ?? 0)}
                sub={kpis ? formatZAR(kpis.total_outstanding_zar) : ''}
                icon={DollarSign} color="bg-red-500"
                onClick={() => navigate('/invoices')}
              />
            ) : (
              <KPICard
                title="FICA Outstanding" value={String(kpis?.fica_incomplete_count ?? 0)} sub="clients pending"
                icon={FileText} color="bg-purple-500"
                onClick={() => navigate('/fica')}
              />
            )}
          </>
        )}
      </div>

      {/* Second KPI row — finance only */}
      {canViewFinance && !loading && kpis && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard title="Total WIP" value={formatZAR(kpis.total_wip_zar)} sub="unbilled work" icon={TrendingUp} color="bg-indigo-500" onClick={() => navigate('/reports')} />
          <KPICard title="FICA Outstanding" value={String(kpis.fica_incomplete_count)} sub="clients pending" icon={FileText} color="bg-purple-500" onClick={() => navigate('/fica')} />
          <KPICard title="Compliance Due 30d" value={String(kpis.compliance_due_30d)} sub="items due soon" icon={AlertTriangle} color="bg-orange-500" onClick={() => navigate('/compliance')} />
          <KPICard title="Retainer Alerts" value="—" sub="check retainers page" icon={Clock} color="bg-slate-500" onClick={() => navigate('/retainers')} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Prescription / deadline alerts */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-700">⏱ Prescription Deadlines</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4">
                    <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
                    <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
                  </div>
                ))
              : deadlines.length === 0
                ? <p className="p-5 text-sm text-gray-400">No urgent deadlines.</p>
                : deadlines.slice(0, 6).map((d) => (
                    <div
                      key={d.matter_id}
                      className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
                      onClick={() => navigate(`/matters/${d.matter_id}`)}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{d.title}</p>
                        <p className="text-xs text-gray-500">{d.client_name} · {d.responsible_attorney}</p>
                      </div>
                      <Badge className={urgencyColor(d.prescription_days_remaining)}>
                        {daysLabel(d.prescription_days_remaining)}
                      </Badge>
                    </div>
                  ))
            }
          </div>
        </Card>

        {/* AR Aging — finance roles only */}
        {canViewFinance && (
          <Card className="overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-700">💳 Overdue Invoices (AR)</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4">
                      <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </div>
                  ))
                : aging.length === 0
                  ? <p className="p-5 text-sm text-gray-400">No overdue invoices — great!</p>
                  : aging.slice(0, 6).map((inv) => (
                      <div
                        key={inv.invoice_id}
                        className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
                        onClick={() => navigate(`/invoices/${inv.invoice_id}`)}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{inv.company_name}</p>
                          <p className="text-xs text-gray-500">{inv.invoice_number} · {inv.days_overdue}d overdue</p>
                        </div>
                        <span className="text-sm font-semibold text-red-600">{formatZAR(inv.outstanding_zar)}</span>
                      </div>
                    ))
              }
            </div>
          </Card>
        )}

        {/* WIP Summary */}
        {canViewFinance && (
          <Card className="overflow-hidden lg:col-span-2">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-700">📊 Top WIP by Matter</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4">
                      <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </div>
                  ))
                : wip.length === 0
                  ? <p className="p-5 text-sm text-gray-400">No unbilled WIP.</p>
                  : wip.slice(0, 8).map((row) => (
                      <div
                        key={row.matter_id}
                        className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
                        onClick={() => navigate(`/matters/${row.matter_id}`)}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{row.title}</p>
                          <p className="text-xs text-gray-500">{row.client_name} · {row.total_hours.toFixed(1)} hrs</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{formatZAR(row.total_wip_zar)}</span>
                      </div>
                    ))
              }
            </div>
          </Card>
        )}

      </div>
    </div>
  )
}
