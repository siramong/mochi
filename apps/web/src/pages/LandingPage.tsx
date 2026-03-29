import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  BrainCircuit,
  Download,
  Dumbbell,
  Gem,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { MochiCompanion } from '@/components/common/MochiCompanion'
import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/useSession'

const featureCards = [
  {
    title: 'Planifica tu estudio',
    description:
      'Organiza bloques por materia, visualiza tu semana y mantén constancia con un ritmo realista.',
    icon: BookOpenText,
    bg: 'from-pink-100 to-rose-50',
    iconColor: 'text-rose-500',
  },
  {
    title: 'Entrena sin complicarte',
    description:
      'Crea rutinas, registra tus sesiones y construye hábitos saludables con pasos pequeños.',
    icon: Dumbbell,
    bg: 'from-emerald-100 to-emerald-50',
    iconColor: 'text-emerald-500',
  },
  {
    title: 'Gamificación que motiva',
    description:
      'Suma puntos, desbloquea logros y celebra cada avance con una experiencia cálida y bonita.',
    icon: Trophy,
    bg: 'from-sky-100 to-blue-50',
    iconColor: 'text-sky-500',
  },
] as const

const modules = [
  {
    title: 'Estudio estructurado',
    description: 'Organiza materias, crea bloques semanales y mantén foco sin improvisar.',
    icon: BookOpenText,
  },
  {
    title: 'Hábitos y bienestar',
    description: 'Combina ejercicio, estado de ánimo y gratitud para sostener tu energía.',
    icon: HeartHandshake,
  },
  {
    title: 'Logros y progreso',
    description: 'Convierte el avance diario en resultados visibles con métricas claras.',
    icon: Target,
  },
] as const

const trustBadges = [
  {
    title: 'Datos protegidos',
    description: 'Tu información se gestiona con autenticación segura y políticas por usuaria.',
    icon: ShieldCheck,
  },
  {
    title: 'Diseño con enfoque humano',
    description: 'Una experiencia cálida, clara y pensada para acompañarte en la universidad.',
    icon: BrainCircuit,
  },
  {
    title: 'Proceso medible',
    description: 'Visualiza avances semanales para tomar mejores decisiones de estudio.',
    icon: BadgeCheck,
  },
] as const

const APK_RELEASE_URL = 'https://github.com/siramong/mochi/releases/latest'

export function LandingPage() {
  const { session, loading } = useSession()
  const shouldReduceMotion = useReducedMotion()

  const primaryHref = loading ? '/login' : session ? '/dashboard' : '/login'
  const primaryLabel = loading ? 'Cargando...' : session ? 'Ir a mi dashboard' : 'Comenzar gratis'

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed,_#fdf2f8_45%,_#eff6ff_90%)] text-purple-950">
      <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-pink-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-24 right-0 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-8">
        <div className="flex items-center gap-3">
          <img src="/mascot/mochi-icon.png" alt="Mochi" className="h-10 w-10 rounded-2xl border border-purple-200 bg-white p-1" />
          <div>
            <p className="text-sm font-black tracking-wide text-purple-900">Mochi</p>
            <p className="text-xs font-semibold text-purple-700">Productividad para estudiantes universitarias</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="text-purple-800 hover:bg-purple-50">
            <Link to="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild className="rounded-2xl bg-purple-600 text-white hover:bg-purple-500">
            <Link to={primaryHref}>{primaryLabel}</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-16 sm:px-8">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/80 px-4 py-2 text-xs font-bold text-pink-700">
              <Sparkles className="h-3.5 w-3.5" />
              Tu espacio para estudiar con calma, enfoque y motivación
            </span>

            <h1 className="mt-5 text-4xl font-black leading-tight text-purple-950 sm:text-5xl">
              Convierte tus metas académicas en un plan claro, sostenible y medible
            </h1>

            <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-purple-800 sm:text-lg">
              Mochi integra estudio, hábitos de bienestar y seguimiento de progreso en una sola
              plataforma. Diseñada para ayudarte a mantener constancia sin sacrificar tu equilibrio.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                disabled={loading}
                className="h-11 rounded-2xl bg-purple-600 px-6 text-white hover:bg-purple-500"
              >
                <Link to={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 rounded-2xl border-purple-200 bg-white/80 px-6 text-purple-900 hover:bg-purple-50"
              >
                <a href="#que-es-mochi">Ver cómo funciona</a>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 rounded-2xl border-emerald-200 bg-emerald-50/80 px-6 text-emerald-900 hover:bg-emerald-100"
              >
                <a href={APK_RELEASE_URL} target="_blank" rel="noreferrer noopener">
                  Instalar app en Android
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <p className="mt-4 text-sm font-semibold text-purple-700">
              Disponible en web y móvil para acompañarte durante todo el semestre.
            </p>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0.1 }}
            className="rounded-3xl border border-purple-200/80 bg-white/85 p-6 shadow-[0_20px_60px_-30px_rgba(88,28,135,0.45)]"
          >
            <MochiCompanion
              mood="excited"
              size={120}
              title="Hola, soy Mochi"
              message="Estoy aquí para ayudarte a construir una rutina sostenible y bonita."
              className="mb-5"
            />

            <div className="grid gap-3">
              {[
                'Bloques de estudio por materia y horario',
                'Seguimiento de rachas y logros',
                'Módulos de estado de ánimo, gratitud y vales',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-purple-100 bg-purple-50/70 px-4 py-3 text-sm font-semibold text-purple-900"
                >
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section id="que-es-mochi" className="space-y-5">
          <h2 className="text-2xl font-black text-purple-950 sm:text-3xl">Beneficios principales</h2>
          <p className="max-w-3xl text-base font-medium leading-relaxed text-purple-800">
            Construimos una experiencia integral para que cada semana tengas claridad de prioridades,
            estructura de ejecución y visibilidad real de tu avance.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon

              return (
                <motion.article
                  key={feature.title}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.35, delay: index * 0.08 }}
                  className={`rounded-3xl border border-purple-100 bg-gradient-to-br ${feature.bg} p-5`}
                >
                  <div className="mb-3 inline-flex rounded-2xl border border-white/90 bg-white/80 p-2.5">
                    <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-black text-purple-950">{feature.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-purple-900/90">
                    {feature.description}
                  </p>
                </motion.article>
              )
            })}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-black text-purple-950 sm:text-3xl">Módulos que trabajan juntos</h2>
          <p className="max-w-3xl text-base font-medium leading-relaxed text-purple-800">
            Todo está conectado para evitar apps separadas y reducir fricción en tu rutina diaria.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {modules.map((module, index) => {
              const Icon = module.icon

              return (
                <motion.article
                  key={module.title}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.35, delay: index * 0.08 }}
                  className="rounded-3xl border border-purple-100 bg-white/85 p-5 shadow-sm"
                >
                  <div className="mb-3 inline-flex rounded-2xl border border-purple-100 bg-purple-50 p-2.5">
                    <Icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-black text-purple-950">{module.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-purple-900/90">
                    {module.description}
                  </p>
                </motion.article>
              )
            })}
          </div>
        </section>

        <section className="space-y-5 rounded-3xl border border-purple-200 bg-white/85 p-6 shadow-sm sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
            <Gem className="h-3.5 w-3.5" />
            Confianza y continuidad
          </div>

          <h2 className="text-2xl font-black text-purple-950 sm:text-3xl">
            Un sistema confiable para sostener resultados a largo plazo
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {trustBadges.map((badge) => {
              const Icon = badge.icon

              return (
                <article key={badge.title} className="rounded-3xl border border-purple-100 bg-white p-5">
                  <div className="mb-3 inline-flex rounded-2xl border border-purple-100 bg-purple-50 p-2.5">
                    <Icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-base font-black text-purple-950">{badge.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-purple-800">
                    {badge.description}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-purple-200 bg-white/85 p-6 text-center shadow-sm sm:p-10">
          <h2 className="text-2xl font-black text-purple-950 sm:text-3xl">
            Comienza hoy con una planificación que sí puedes mantener
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base font-medium text-purple-800">
            Centraliza tus clases, bloques de estudio y hábitos en un flujo simple. Menos dispersión,
            más consistencia.
          </p>
          <Button
            asChild
            size="lg"
            disabled={loading}
            className="mt-6 h-11 rounded-2xl bg-purple-600 px-8 text-white hover:bg-purple-500"
          >
            <Link to={primaryHref}>{primaryLabel}</Link>
          </Button>
        </section>

        <footer className="rounded-3xl border border-purple-200/80 bg-white/70 p-5 text-sm text-purple-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium">
              Mochi es una plataforma de productividad académica. Al usarla, aceptas nuestras
              condiciones y políticas de tratamiento de datos.
            </p>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <Link className="text-purple-700 transition-colors hover:text-purple-900" to="/terms">
                Términos
              </Link>
              <span className="text-purple-300">|</span>
              <Link className="text-purple-700 transition-colors hover:text-purple-900" to="/privacy">
                Privacidad
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
