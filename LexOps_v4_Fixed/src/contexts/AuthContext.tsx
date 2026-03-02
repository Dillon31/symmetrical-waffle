import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/lexops/supabase-client'
import type { UserRole } from '@/lib/lexops/database.types'

// ── Types ────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  hourly_rate_zar: number
}

interface AuthContextValue {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

// ── Context ──────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Hydrate from existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) await resolveProfile(session.user)
      setLoading(false)
    })

    // 2. Keep in sync with auth state changes (sign-in / sign-out / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
          await resolveProfile(session.user)
        } else {
          setUser(null)
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  /**
   * Fetch the lex.users row that matches the Supabase auth user.
   * If the row doesn't exist yet (e.g. new invite), the user gets a
   * minimal 'user' role profile — an admin must then set their role.
   */
  async function resolveProfile(authUser: SupabaseUser) {
    try {
      const { data, error } = await supabase
        .schema('lex')
        .from('users')
        .select('id, name, email, role, hourly_rate_zar')
        .eq('id', authUser.id)
        .single()

      if (error || !data) {
        // Auth user exists but no lex.users row yet
        setUser({
          id: authUser.id,
          email: authUser.email ?? '',
          name: authUser.email?.split('@')[0] ?? 'User',
          role: 'user',
          hourly_rate_zar: 0,
        })
        return
      }

      setUser({
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role as UserRole,
        hourly_rate_zar: data.hourly_rate_zar ?? 0,
      })
    } catch {
      setUser(null)
    }
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

// ── RBAC helpers (pure — no context needed) ──────────────────

export type Permission =
  | 'canViewFinancials'
  | 'canApproveWriteOffs'
  | 'canViewAllMatters'
  | 'canViewAllRates'
  | 'canEditSettings'
  | 'canDeleteRecords'
  | 'canViewReports'

const RBAC: Record<UserRole, Record<Permission, boolean>> = {
  admin:    { canViewFinancials:true,  canApproveWriteOffs:true,  canViewAllMatters:true,  canViewAllRates:true,  canEditSettings:true,  canDeleteRecords:true,  canViewReports:true  },
  partner:  { canViewFinancials:true,  canApproveWriteOffs:true,  canViewAllMatters:true,  canViewAllRates:true,  canEditSettings:false, canDeleteRecords:false, canViewReports:true  },
  finance:  { canViewFinancials:true,  canApproveWriteOffs:false, canViewAllMatters:true,  canViewAllRates:false, canEditSettings:false, canDeleteRecords:false, canViewReports:true  },
  attorney: { canViewFinancials:false, canApproveWriteOffs:false, canViewAllMatters:false, canViewAllRates:false, canEditSettings:false, canDeleteRecords:false, canViewReports:false },
  user:     { canViewFinancials:false, canApproveWriteOffs:false, canViewAllMatters:false, canViewAllRates:false, canEditSettings:false, canDeleteRecords:false, canViewReports:false },
}

export function can(role: UserRole, permission: Permission): boolean {
  return RBAC[role]?.[permission] ?? false
}

export function isFinanceRole(role: UserRole): boolean {
  return ['admin', 'partner', 'finance'].includes(role)
}
