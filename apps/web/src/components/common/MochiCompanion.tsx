import { motion } from 'framer-motion'

type MochiMood = 'happy' | 'thinking' | 'sleepy' | 'excited'

type MochiCompanionProps = {
  mood?: MochiMood
  size?: number
  title?: string
  message?: string
  className?: string
}

const moodScale: Record<MochiMood, number> = {
  happy: 1,
  thinking: 0.95,
  sleepy: 0.9,
  excited: 1.08,
}

export function MochiCompanion({
  mood = 'happy',
  size = 92,
  title,
  message,
  className,
}: MochiCompanionProps) {
  const resolvedSize = Math.round(size * moodScale[mood])

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="inline-flex items-center gap-3 rounded-3xl border border-purple-200 bg-white/85 px-4 py-3 shadow-sm"
      >
        <motion.img
          src="/mascot/mochi-icon.png"
          alt="Mochi"
          width={resolvedSize}
          height={resolvedSize}
          className="shrink-0"
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        />

        {(title || message) && (
          <div className="text-left">
            {title ? <p className="text-sm font-extrabold text-purple-900">{title}</p> : null}
            {message ? <p className="mt-1 text-xs font-semibold text-purple-700">{message}</p> : null}
          </div>
        )}
      </motion.div>
    </div>
  )
}
