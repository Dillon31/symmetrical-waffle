/**
 * LexOps — Global Search
 */
import { supabase } from '../supabase-client'

export interface SearchResult {
  result_type: 'client' | 'matter' | 'invoice' | 'knowledge_base'
  id: string
  title: string
  subtitle: string | null
  url: string
}

export const searchApi = {
  async search(query: string): Promise<SearchResult[]> {
    const { data, error } = await supabase
      .schema('lex')
      .rpc('global_search', { search_query: query })
    if (error) throw error
    return data as SearchResult[]
  },
}
