import { motion } from 'framer-motion'
import { ArrowRight, BookOpenText, Dumbbell, Sparkles, Trophy } from 'lucide-react'
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

export function LandingPage() {
  const { session, loading } = useSession()

  const primaryHref = loading ? '/login' : session ? '/dashboard' : '/login'
  const primaryLabel = loading ? 'Cargando...' : session ? 'Entrar a mi app' : 'Comenzar ahora'

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
            <p className="text-xs font-semibold text-purple-700">Productividad para estudiantes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="border-purple-200 bg-white/80 text-purple-800 hover:bg-purple-50">
            <Link to="/terms">Términos</Link>
          </Button>
          <Button asChild variant="outline" className="border-purple-200 bg-white/80 text-purple-800 hover:bg-purple-50">
            <Link to="/privacy">Privacidad</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-16 sm:px-8">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/80 px-4 py-2 text-xs font-bold text-pink-700">
              <Sparkles className="h-3.5 w-3.5" />
              Tu espacio para estudiar con calma, enfoque y motivación
            </span>

            <h1 className="mt-5 text-4xl font-black leading-tight text-purple-950 sm:text-5xl">
              Mochi te ayuda a organizar tu vida académica sin sentirte abrumada
            </h1>

            <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-purple-800 sm:text-lg">
              Mochi combina planificación de estudio, rutinas de ejercicio y gamificación en una
              sola app. Diseñada para que avances paso a paso y te sientas orgullosa de tu proceso.
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
            </div>

            <p className="mt-4 text-sm font-semibold text-purple-700">
              Disponible en web y móvil para acompañarte todos los días.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
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
                'Módulos de ánimo, gratitud y vales',
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
          <h2 className="text-2xl font-black text-purple-950 sm:text-3xl">¿Qué es Mochi?</h2>
          <p className="max-w-3xl text-base font-medium leading-relaxed text-purple-800">
            Es una plataforma de productividad para estudiantes que quieren crecer con orden y
            bienestar. En lugar de herramientas sueltas, aquí tienes estudio, ejercicio y
            motivación en un solo lugar para avanzar con claridad.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon

              return (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
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

        <section className="rounded-3xl border border-purple-200 bg-white/85 p-6 text-center shadow-sm sm:p-10">
          <h2 className="text-2xl font-black text-purple-950 sm:text-3xl">
            Lista para entrar a tu espacio en Mochi
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base font-medium text-purple-800">
            Empieza hoy con una rutina que sí se siente alcanzable: planifica, cumple y celebra cada
            progreso.
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
      </main>
    </div>
  )
}
