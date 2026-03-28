import { useEffect, useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import { generateFlashcards } from '@/lib/ai'
import type { Flashcard, FlashcardDeck } from '@/types/database'

type DeckWithCards = FlashcardDeck & { flashcards: Flashcard[] }

type Difficulty = 1 | 2 | 3

export function FlashcardsPage() {
  const { session } = useSession()
  const userId = session?.user.id

  const [decks, setDecks] = useState<DeckWithCards[]>([])
  const [selectedDeck, setSelectedDeck] = useState<DeckWithCards | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(8)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    async function loadDecks() {
      const { data: decksData, error: decksError } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .returns<FlashcardDeck[]>()

      if (decksError) {
        setError(decksError.message)
        return
      }

      const deckIds = (decksData ?? []).map((deck) => deck.id)
      const cardsRes = deckIds.length
        ? await supabase.from('flashcards').select('*').in('deck_id', deckIds).returns<Flashcard[]>()
        : { data: [] as Flashcard[], error: null }

      if (cardsRes.error) {
        setError(cardsRes.error.message)
        return
      }

      const cardsByDeck = new Map<string, Flashcard[]>()
      ;(cardsRes.data ?? []).forEach((card) => {
        cardsByDeck.set(card.deck_id, [...(cardsByDeck.get(card.deck_id) ?? []), card])
      })

      setDecks(
        (decksData ?? []).map((deck) => ({
          ...deck,
          flashcards: cardsByDeck.get(deck.id) ?? [],
        }))
      )
    }

    void loadDecks()
  }, [userId, creating])

  const activeCard = selectedDeck?.flashcards[currentIndex] ?? null
  const progress = selectedDeck ? Math.round(((currentIndex + 1) / Math.max(1, selectedDeck.flashcards.length)) * 100) : 0

  const handleCreateDeck = async () => {
    if (!userId || !subject.trim() || !topic.trim()) return

    setCreating(true)
    setError(null)

    try {
      const generated = await generateFlashcards(subject.trim(), topic.trim(), count)

      const { data: deckData, error: deckError } = await supabase
        .from('flashcard_decks')
        .insert({
          user_id: userId,
          subject: subject.trim(),
          topic: topic.trim(),
          study_session_id: null,
        })
        .select('*')
        .single<FlashcardDeck>()

      if (deckError || !deckData) throw new Error(deckError?.message ?? 'No se pudo crear el mazo')

      const { error: cardsError } = await supabase.from('flashcards').insert(
        generated.map((card) => ({
          deck_id: deckData.id,
          front: card.front,
          back: card.back,
          difficulty_rating: null,
          review_count: 0,
        }))
      )

      if (cardsError) throw new Error(cardsError.message)

      setSubject('')
      setTopic('')
      setCount(8)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el mazo')
    } finally {
      setCreating(false)
    }
  }

  const rateCard = async (difficulty: Difficulty) => {
    if (!activeCard) return

    await supabase
      .from('flashcards')
      .update({
        difficulty_rating: difficulty,
        review_count: activeCard.review_count + 1,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq('id', activeCard.id)

    if (!selectedDeck) return
    if (currentIndex < selectedDeck.flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setFlipped(false)
    }
  }

  const deckRows = useMemo(() => decks, [decks])

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Flashcards</h1>
      <p className="mt-1 text-sm text-purple-700">Crea mazos con IA y repasa por dificultad.</p>

      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}

      {!selectedDeck ? (
        <>
          <section className="mt-5 rounded-3xl border border-purple-200 bg-white p-4">
            <h2 className="text-base font-bold text-purple-900">Crear mazo manual con IA</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-4">
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Materia" className="rounded-xl border border-purple-200 px-3 py-2 text-sm" />
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Tema" className="rounded-xl border border-purple-200 px-3 py-2 text-sm" />
              <input type="number" min={4} max={20} value={count} onChange={(e) => setCount(Math.max(4, Math.min(20, Number(e.target.value))))} className="rounded-xl border border-purple-200 px-3 py-2 text-sm" />
              <button type="button" onClick={() => { void handleCreateDeck() }} disabled={creating} className="rounded-xl bg-purple-500 px-3 py-2 text-sm font-semibold text-white">
                {creating ? 'Generando...' : 'Generar con IA'}
              </button>
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-blue-200 bg-white p-4">
            <h2 className="text-base font-bold text-blue-900">Mazos disponibles</h2>
            <div className="mt-3 space-y-2">
              {deckRows.map((deck) => (
                <article key={deck.id} className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-blue-950">{deck.subject}</p>
                      <p className="text-sm text-blue-800">{deck.topic}</p>
                      <p className="text-xs font-semibold text-blue-700">{deck.flashcards.length} cards</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-xl bg-blue-500 px-3 py-2 text-xs font-bold text-white"
                      onClick={() => {
                        setSelectedDeck(deck)
                        setCurrentIndex(0)
                        setFlipped(false)
                      }}
                    >
                      Estudiar
                    </button>
                  </div>
                </article>
              ))}
              {deckRows.length === 0 ? <p className="text-sm font-semibold text-blue-700">Aún no hay mazos.</p> : null}
            </div>
          </section>
        </>
      ) : (
        <section className="mt-5 rounded-3xl border border-purple-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-purple-700">{selectedDeck.subject}</p>
              <p className="text-lg font-black text-purple-950">{selectedDeck.topic}</p>
            </div>
            <button type="button" className="rounded-xl border border-purple-200 px-3 py-2 text-sm font-semibold text-purple-800" onClick={() => setSelectedDeck(null)}>
              Volver a mazos
            </button>
          </div>

          <div className="mt-4 h-2 w-full rounded-full bg-purple-100">
            <div className="h-2 rounded-full bg-purple-500" style={{ width: `${progress}%` }} />
          </div>

          {activeCard ? (
            <>
              <button
                type="button"
                className="mt-4 block w-full rounded-3xl border border-purple-200 bg-purple-50 p-8 text-left"
                onClick={() => setFlipped((prev) => !prev)}
                onKeyDown={(event) => {
                  if (event.key === ' ') {
                    event.preventDefault()
                    setFlipped((prev) => !prev)
                  }
                }}
              >
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-purple-700">
                  <Layers className="h-3 w-3" />
                  {flipped ? 'Respuesta' : 'Pregunta'}
                </div>
                <p className="text-lg font-bold text-purple-950 whitespace-pre-wrap">{flipped ? activeCard.back : activeCard.front}</p>
              </button>

              {flipped ? (
                <div className="mt-4 flex gap-2">
                  <button type="button" className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white" onClick={() => { void rateCard(1) }}>Difícil</button>
                  <button type="button" className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-bold text-white" onClick={() => { void rateCard(2) }}>Bien</button>
                  <button type="button" className="rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white" onClick={() => { void rateCard(3) }}>Fácil</button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-5 rounded-2xl bg-green-50 p-4">
              <p className="text-lg font-black text-green-900">Sesión completada</p>
              <p className="text-sm font-semibold text-green-700">Terminaste el mazo completo. Excelente repaso.</p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
