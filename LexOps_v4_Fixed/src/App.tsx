import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Layout } from '@/components/Layout'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Login from '@/pages/Login'

// ── Lazy-load every page so the initial bundle stays tiny ────
const Dashboard           = lazy(() => import('@/pages/Dashboard'))
const Clients             = lazy(() => import('@/pages/Clients'))
const ClientDetail        = lazy(() => import('@/pages/ClientDetail'))
const Matters             = lazy(() => import('@/pages/Matters'))
const MatterDetail        = lazy(() => import('@/pages/MatterDetail'))
const Invoices            = lazy(() => import('@/pages/Invoices'))
const InvoiceDetail       = lazy(() => import('@/pages/InvoiceDetail'))
const TimeEntries         = lazy(() => import('@/pages/TimeEntries'))
const Disbursements       = lazy(() => import('@/pages/Disbursements'))
const Retainers           = lazy(() => import('@/pages/Retainers'))
const WriteOffs           = lazy(() => import('@/pages/WriteOffs'))
const Expenses            = lazy(() => import('@/pages/Expenses'))
const Accounts            = lazy(() => import('@/pages/Accounts'))
const BankReconciliation  = lazy(() => import('@/pages/BankReconciliation'))
const Reports             = lazy(() => import('@/pages/Reports'))
const Documents           = lazy(() => import('@/pages/Documents'))
const DocumentGenerator   = lazy(() => import('@/pages/DocumentGenerator'))
const KnowledgeBase       = lazy(() => import('@/pages/KnowledgeBase'))
const Tasks               = lazy(() => import('@/pages/Tasks'))
const CCMATracker         = lazy(() => import('@/pages/CCMATracker'))
const Compliance          = lazy(() => import('@/pages/Compliance'))
const FICA                = lazy(() => import('@/pages/FICA'))
const Vendors             = lazy(() => import('@/pages/Vendors'))
const Assets              = lazy(() => import('@/pages/Assets'))
const Settings            = lazy(() => import('@/pages/Settings'))

// ── Shared loading spinner ───────────────────────────────────
function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
    </div>
  )
}

// ── Auth-gated routes ─────────────────────────────────────────
function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index                  element={<Dashboard />} />
          <Route path="clients"         element={<Clients />} />
          <Route path="clients/:id"     element={<ClientDetail />} />
          <Route path="matters"         element={<Matters />} />
          <Route path="matters/:id"     element={<MatterDetail />} />
          <Route path="invoices"        element={<Invoices />} />
          <Route path="invoices/:id"    element={<InvoiceDetail />} />
          <Route path="time-entries"    element={<TimeEntries />} />
          <Route path="disbursements"   element={<Disbursements />} />
          <Route path="retainers"       element={<Retainers />} />
          <Route path="write-offs"      element={<WriteOffs />} />
          <Route path="expenses"        element={<Expenses />} />
          <Route path="accounts"        element={<Accounts />} />
          <Route path="bank-reconciliation" element={<BankReconciliation />} />
          <Route path="reports"         element={<Reports />} />
          <Route path="documents"       element={<Documents />} />
          <Route path="document-generator" element={<DocumentGenerator />} />
          <Route path="knowledge-base"  element={<KnowledgeBase />} />
          <Route path="tasks"           element={<Tasks />} />
          <Route path="ccma"            element={<CCMATracker />} />
          <Route path="compliance"      element={<Compliance />} />
          <Route path="fica"            element={<FICA />} />
          <Route path="vendors"         element={<Vendors />} />
          <Route path="assets"          element={<Assets />} />
          <Route path="settings"        element={<Settings />} />
          {/* Catch-all → Dashboard */}
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

// ── Root ─────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      {/*
        BrowserRouter MUST wrap AuthProvider so all children (including
        Login) can safely call useNavigate() and useLocation().
      */}
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
