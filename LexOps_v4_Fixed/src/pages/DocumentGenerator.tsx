import { useState, useEffect } from 'react'
import { FileText, Download, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { documentsApi, mattersApi, clientsApi } from '@/lib/lexops'
import type { DocumentTemplate, Matter, Client } from '@/lib/lexops'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'

// ── Field label mapping ───────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  client_name: 'Client Company Name',
  employee_name: 'Employee Full Name',
  employee_id_number: 'Employee ID Number',
  dismissal_date: 'Date of Dismissal',
  nature_of_dispute: 'Nature of Dispute',
  relief_sought: 'Relief Sought',
  union_name: 'Trade Union Name',
  ccma_office: 'CCMA Office',
  employee_number: 'Employee Number',
  charges: 'Charges / Allegations',
  hearing_date: 'Hearing Date',
  hearing_venue: 'Hearing Venue',
  hearing_time: 'Hearing Time',
  presiding_officer: 'Presiding Officer',
  union_representation_note: 'Union Representation Note',
  case_number: 'Case Number',
  parties: 'Parties (Applicant / Respondent)',
  arbitrator_name: 'Arbitrator Name',
  settlement_amount: 'Settlement Amount (ZAR)',
  payment_date: 'Payment Date',
  confidentiality_clause: 'Confidentiality Clause Text',
  non_disparagement: 'Non-Disparagement Clause',
  reinstatement_waiver: 'Reinstatement Waiver',
  matter_description: 'Matter Description',
  billing_arrangement: 'Billing Arrangement',
  rate_or_fee: 'Hourly Rate or Fixed Fee',
  payment_terms: 'Payment Terms',
  retainer_amount: 'Retainer Amount',
  disbursements_note: 'Disbursements Note',
  recipient_name: 'Recipient Name',
  recipient_address: 'Recipient Address',
  claim_description: 'Claim Description',
  amount_claimed: 'Amount Claimed',
  payment_deadline: 'Payment Deadline',
  interest_rate: 'Interest Rate',
  litigation_warning: 'Litigation Warning',
}

type FieldStatus = 'filled' | 'required_empty' | 'optional'

// ── Component ─────────────────────────────────────────────────

export default function DocumentGenerator() {
  const { user } = useAuth()

  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [matters, setMatters]     = useState<Matter[]>([])
  const [clients, setClients]     = useState<Client[]>([])
  const [selected, setSelected]   = useState<DocumentTemplate | null>(null)
  const [matterId, setMatterId]   = useState('')
  const [fields, setFields]       = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      documentsApi.getTemplates(),
      mattersApi.getOpen(),
      clientsApi.getAll(),
    ]).then(([tmpl, mats, cls]) => {
      setTemplates(tmpl)
      setMatters(mats as unknown as Matter[])
      setClients(cls as unknown as Client[])
    }).catch(err => setError(err.message))
  }, [])

  // Revoke old blob URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl) }
  }, [downloadUrl])

  function selectTemplate(t: DocumentTemplate) {
    setSelected(t)
    setFields({})
    setDownloadUrl(null)
    setError(null)
  }

  function autoFill() {
    if (!matterId || !selected) return
    const m = matters.find(x => x.id === matterId) as Record<string, unknown> | undefined
    const c = clients.find(x => x.id === (m?.client_id as string)) as Record<string, unknown> | undefined
    const auto: Record<string, string> = {}
    if (c?.company_name)       auto.client_name   = c.company_name as string
    if (m?.ccma_case_number)   auto.case_number   = m.ccma_case_number as string
    if (m?.dismissal_date)     auto.dismissal_date = m.dismissal_date as string
    if (m?.hearing_date)       auto.hearing_date  = m.hearing_date as string
    setFields(prev => ({ ...auto, ...prev }))
  }

  function fieldStatus(f: string): FieldStatus {
    if (fields[f]?.trim()) return 'filled'
    return selected?.required_fields.includes(f) ? 'required_empty' : 'optional'
  }

  const canGenerate = selected?.required_fields.every(f => fields[f]?.trim()) ?? false

  async function generate() {
    if (!selected || !canGenerate || !user) return
    setGenerating(true)
    setError(null)
    try {
      const result = await documentsApi.generate({
        template_type: selected.template_type,
        matter_id: matterId || undefined,
        field_values: fields,
      })

      // Create a download-able blob from the returned content
      const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' })
      const url  = URL.createObjectURL(blob)
      if (downloadUrl) URL.revokeObjectURL(downloadUrl)
      setDownloadUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const allFields = [
    ...(selected?.required_fields ?? []),
    ...(selected?.optional_fields ?? []),
  ]

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="p-6">
      <h1 className="mb-5 text-xl font-bold text-gray-900">Document Generator</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Template list */}
        <div className="space-y-2">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Select Template</h2>
          {templates.length === 0
            ? <p className="text-sm text-gray-400">No templates available.</p>
            : templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => selectTemplate(t)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selected?.id === t.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{t.name}</p>
                  {t.description && (
                    <p className="mt-0.5 text-xs text-gray-500">{t.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {t.required_fields.length} required · {t.optional_fields.length} optional fields
                  </p>
                </button>
              ))
          }
        </div>

        {/* Form */}
        {selected && (
          <div className="space-y-4 lg:col-span-2">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">
                  {selected.name}
                </h2>
                <div className="flex gap-2">
                  <Select
                    value={matterId}
                    onChange={e => setMatterId(e.target.value)}
                    className="text-xs"
                  >
                    <option value="">— Link to matter (optional) —</option>
                    {matters.map(m => (
                      <option key={m.id} value={m.id}>
                        {(m as Record<string, unknown>).reference_number as string ?? ''} {m.title}
                      </option>
                    ))}
                  </Select>
                  {matterId && (
                    <Button size="sm" variant="secondary" onClick={autoFill}>
                      Auto-fill
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {allFields.map(f => {
                  const status = fieldStatus(f)
                  return (
                    <div key={f}>
                      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-700">
                        {FIELD_LABELS[f] ?? f}
                        {status === 'filled'         && <CheckCircle  size={12} className="text-green-500" />}
                        {status === 'required_empty' && <XCircle      size={12} className="text-red-400"   />}
                        {status === 'optional'       && <AlertCircle  size={12} className="text-gray-300"  />}
                        {selected.required_fields.includes(f) && (
                          <span className="text-red-400">*</span>
                        )}
                      </label>
                      {f === 'litigation_warning' || f === 'confidentiality_clause' ? (
                        <Textarea
                          rows={3}
                          value={fields[f] ?? ''}
                          onChange={e => setFields(prev => ({ ...prev, [f]: e.target.value }))}
                          placeholder={FIELD_LABELS[f] ?? f}
                        />
                      ) : (
                        <Input
                          value={fields[f] ?? ''}
                          onChange={e => setFields(prev => ({ ...prev, [f]: e.target.value }))}
                          placeholder={FIELD_LABELS[f] ?? f}
                          type={f.includes('date') ? 'date' : 'text'}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-6 flex items-center gap-3">
                <Button
                  onClick={generate}
                  disabled={!canGenerate || generating}
                  className="flex items-center gap-2"
                >
                  {generating
                    ? <><RefreshCw size={14} className="animate-spin" /> Generating…</>
                    : 'Generate Document'
                  }
                </Button>

                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={`${selected.name.replace(/\s+/g, '_')}.txt`}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    <Download size={14} /> Download
                  </a>
                )}
              </div>

              {!canGenerate && selected.required_fields.length > 0 && (
                <p className="mt-2 text-xs text-gray-400">
                  Fill all required fields (*) to enable generation.
                </p>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
