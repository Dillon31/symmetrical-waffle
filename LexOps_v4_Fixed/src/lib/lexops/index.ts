/**
 * LexOps Supabase Integration Layer
 * ===================================
 * Import from here — never import from individual files directly.
 *
 * Usage:
 *   import { mattersApi, invoicesApi, dashboardApi } from '@/lib/lexops'
 */

// Client & auth
export { supabase, lexDB, callEdgeFunction, auth, getCurrentUser, signIn, signOut } from './supabase-client'

// Domain APIs
export { clientsApi } from './api/clients.api'
export { mattersApi } from './api/matters.api'
export { tasksApi } from './api/tasks.api'
export { notificationsApi } from './api/notifications.api'
export { dashboardApi } from './api/dashboard.api'
export { documentsApi } from './api/documents.api'
export { complianceApi, knowledgeBaseApi } from './api/compliance.api'
export { usersApi, firmSettingsApi } from './api/users.api'
export { searchApi } from './api/search.api'
export {
  timeEntriesApi,
  disbursementsApi,
  invoicesApi,
  paymentsApi,
  creditNotesApi,
  writeOffApi,
  retainersApi,
} from './api/billing.api'

// All TypeScript types
export type * from './database.types'
