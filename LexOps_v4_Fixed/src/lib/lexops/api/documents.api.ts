/**
 * LexOps — Documents API
 * Covers document generation, storage, and template management
 */
import { lexDB, supabase, callEdgeFunction } from '../supabase-client'
import type { Document, DocumentTemplate, GenerateDocumentPayload, GenerateDocumentResponse } from '../database.types'

export const documentsApi = {

  async getForMatter(matterId: string): Promise<Document[]> {
    const { data, error } = await lexDB('documents')
      .select('*')
      .eq('matter_id', matterId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getForClient(clientId: string): Promise<Document[]> {
    const { data, error } = await lexDB('documents')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  /** Generate a document from a template via Edge Function */
  async generate(payload: GenerateDocumentPayload): Promise<GenerateDocumentResponse> {
    return callEdgeFunction<GenerateDocumentPayload, GenerateDocumentResponse>(
      'lex-generate-document', payload
    )
  },

  /** List available templates */
  async getTemplates(): Promise<DocumentTemplate[]> {
    const { data, error } = await lexDB('document_templates')
      .select('*')
      .eq('active', true)
      .order('name')
    if (error) throw error
    return data
  },

  /**
   * Upload a file to Supabase Storage (bucket: 'lex-documents')
   * then insert a record into the documents table.
   */
  async upload(file: File, meta: {
    matter_id?: string
    client_id?: string
    title?: string
  }): Promise<Document> {
    const path = `${meta.matter_id ?? meta.client_id ?? 'general'}/${Date.now()}_${file.name}`

    const { error: storageError } = await supabase.storage
      .from('lex-documents')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (storageError) throw storageError

    const { data, error } = await lexDB('documents')
      .insert({
        title: meta.title ?? file.name,
        document_type: 'uploaded',
        matter_id: meta.matter_id ?? null,
        client_id: meta.client_id ?? null,
        file_path: path,
        version: 1,
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  /** Get a signed download URL (valid 60 minutes) */
  async getDownloadUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('lex-documents')
      .createSignedUrl(filePath, 3600)
    if (error) throw error
    return data.signedUrl
  },
}
