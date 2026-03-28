import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { StudyBlock } from '@/types/database'

export type NewStudyBlock = {
  subject: string
  day_of_week: number
  start_time: string
  end_time: string
  color: string
}

type StudyBlocksState = {
  blocks: StudyBlock[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createBlock: (payload: NewStudyBlock) => Promise<void>
  updateBlock: (blockId: string, payload: NewStudyBlock) => Promise<void>
  deleteBlock: (blockId: string) => Promise<void>
}

export function useStudyBlocks(dayOfWeek?: number): StudyBlocksState {
  const { session } = useSession()
  const [blocks, setBlocks] = useState<StudyBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const userId = session?.user.id
    if (!userId) {
      setBlocks([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    let query = supabase
      .from('study_blocks')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true })

    if (typeof dayOfWeek === 'number') {
      query = query.eq('day_of_week', dayOfWeek)
    }

    const { data, error: queryError } = await query.returns<StudyBlock[]>()

    if (queryError) {
      setError(queryError.message)
      setBlocks([])
      setLoading(false)
      return
    }

    setBlocks(data ?? [])
    setLoading(false)
  }, [session?.user.id, dayOfWeek])

  const createBlock = useCallback(
    async (payload: NewStudyBlock) => {
      const userId = session?.user.id
      if (!userId) {
        throw new Error('Debes iniciar sesión para crear un bloque de estudio')
      }

      const { error: insertError } = await supabase.from('study_blocks').insert({
        ...payload,
        user_id: userId,
      })
      if (insertError) throw insertError
      await refresh()
    },
    [session?.user.id, refresh],
  )

  const updateBlock = useCallback(
    async (blockId: string, payload: NewStudyBlock) => {
      const userId = session?.user.id
      if (!userId) {
        throw new Error('Debes iniciar sesión para actualizar un bloque de estudio')
      }

      const { error: updateError } = await supabase
        .from('study_blocks')
        .update(payload)
        .eq('id', blockId)
        .eq('user_id', userId)

      if (updateError) throw updateError
      await refresh()
    },
    [session?.user.id, refresh],
  )

  const deleteBlock = useCallback(
    async (blockId: string) => {
      const userId = session?.user.id
      if (!userId) {
        throw new Error('Debes iniciar sesión para eliminar un bloque de estudio')
      }

      const { error: detachError } = await supabase
        .from('study_sessions')
        .update({ study_block_id: null })
        .eq('study_block_id', blockId)
        .eq('user_id', userId)

      if (detachError) throw detachError

      const { error: deleteError } = await supabase
        .from('study_blocks')
        .delete()
        .eq('id', blockId)
        .eq('user_id', userId)

      if (deleteError) throw deleteError
      await refresh()
    },
    [session?.user.id, refresh],
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    blocks,
    loading,
    error,
    refresh,
    createBlock,
    updateBlock,
    deleteBlock,
  }
}
