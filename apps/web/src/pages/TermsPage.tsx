import { ArrowLeft, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

type Section = {
  id: string
  title: string
  content: React.ReactNode
}

const LAST_UPDATED = '1 de enero de 2026'
const APP_NAME = 'Mochi'
const CONTACT_EMAIL = 'soporte@siramong.tech'
const COMPANY_NAME = 'SirAmong'
const APP_URL = 'mochi.siramong.tech'

const sections: Section[] = [
  {
    id: 'aceptacion',
    title: '1. Aceptación de los términos',
    content: (
      <>
        <p>
          Al acceder o utilizar {APP_NAME} (la &quot;Aplicación&quot; o el &quot;Servicio&quot;),
          ya sea a través de la app móvil o de la plataforma web en{' '}
          <strong>{APP_URL}</strong>, aceptas quedar vinculada por estas Condiciones del Servicio
          (&quot;Condiciones&quot;). Si no estás de acuerdo con alguna de estas condiciones, no
          debes usar el Servicio.
        </p>
        <p className="mt-3">
          Estas Condiciones constituyen un acuerdo legal entre tú y {COMPANY_NAME}{' '}
          (&quot;nosotros&quot;). Nos reservamos el derecho de actualizar estas Condiciones en
          cualquier momento con previo aviso razonable.
        </p>
      </>
    ),
  },
  {
    id: 'descripcion-servicio',
    title: '2. Descripción del Servicio',
    content: (
      <>
        <p>
          {APP_NAME} es una plataforma de productividad personal diseñada para estudiantes. El
          Servicio incluye, entre otras funciones:
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            { icon: '📚', label: 'Planificación de estudio', desc: 'Bloques semanales y temporizador de enfoque' },
            { icon: '💪', label: 'Rutinas de ejercicio', desc: 'Creación de rutinas y seguimiento de entrenos' },
            { icon: '🌿', label: 'Hábitos y metas', desc: 'Registro diario y visualización de progreso' },
            { icon: '🍳', label: 'Cocina con IA', desc: 'Generación de recetas personalizadas' },
            { icon: '😊', label: 'Bienestar', desc: 'Estado de ánimo, gratitud y ciclo menstrual' },
            { icon: '🎁', label: 'Gamificación', desc: 'Puntos, logros, rachas y vales de recompensa' },
          ].map((feat) => (
            <div
              key={feat.label}
              className="rounded-2xl border border-purple-100 bg-purple-50/60 p-3"
            >
              <p className="text-sm font-bold text-purple-900">
                {feat.icon} {feat.label}
              </p>
              <p className="mt-0.5 text-xs text-purple-700">{feat.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-purple-800">
          Nos reservamos el derecho de modificar, suspender o descontinuar cualquier parte del
          Servicio en cualquier momento, con o sin aviso previo, sin incurrir en responsabilidad
          alguna frente a ti.
        </p>
      </>
    ),
  },
  {
    id: 'elegibilidad',
    title: '3. Elegibilidad y registro',
    content: (
      <>
        <p>Para usar {APP_NAME} debes:</p>
        <ul className="mt-3 space-y-2">
          {[
            'Tener al menos 13 años de edad. Si tienes entre 13 y 18 años, necesitas el consentimiento de tu padre, madre o tutor legal.',
            'Proporcionar información de registro veraz, precisa y completa.',
            'Mantener la seguridad de tu contraseña y notificarnos inmediatamente ante cualquier uso no autorizado de tu cuenta.',
            'Ser responsable de toda actividad que ocurra bajo tu cuenta.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-purple-900">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Está estrictamente prohibido crear múltiples cuentas con el propósito de abusar del
          sistema de gamificación o de cualquier otra función del Servicio.
        </p>
      </>
    ),
  },
  {
    id: 'uso-aceptable',
    title: '4. Uso aceptable',
    content: (
      <>
        <p>Al usar {APP_NAME}, te comprometes a:</p>
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-sm font-bold text-green-700">Puedes</p>
            <ul className="mt-2 space-y-1.5">
              {[
                'Usar el Servicio para tu productividad personal y bienestar.',
                'Compartir capturas de pantalla o imágenes generadas por la app (como los vales).',
                'Exportar tus datos personales para uso propio.',
                'Contactarnos con sugerencias o reportes de errores.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-purple-900">
                  <span className="mt-1 text-green-500">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold text-red-700">No puedes</p>
            <ul className="mt-2 space-y-1.5">
              {[
                'Usar el Servicio para actividades ilegales o que violen derechos de terceros.',
                'Intentar acceder a datos de otras usuarias o eludir las medidas de seguridad.',
                'Hacer ingeniería inversa, descompilar o intentar extraer el código fuente de la app.',
                'Usar scripts, bots o medios automatizados para acceder al Servicio.',
                'Transmitir malware, virus o cualquier código de naturaleza destructiva.',
                'Sobrecargar deliberadamente nuestra infraestructura (ataques de denegación de servicio).',
                'Revender o sublicenciar el acceso al Servicio a terceros.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-purple-900">
                  <span className="mt-1 text-red-400">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'contenido-usuario',
    title: '5. Contenido generado por el usuario',
    content: (
      <>
        <p>
          Todo el contenido que creas dentro de {APP_NAME} (notas, recetas, metas, registros de
          gratitud, etc.) es de tu propiedad. Al usar el Servicio, nos otorgas una licencia
          limitada, no exclusiva y no transferible para procesar y almacenar dicho contenido con el
          único fin de proveer el Servicio.
        </p>
        <p className="mt-3 text-sm text-purple-800">
          Eres responsable del contenido que introduces en la app, incluyendo los prompts enviados
          al sistema de IA. No debes introducir información confidencial de terceros, datos
          sensibles de otras personas o contenido que infrinja derechos de autor.
        </p>
        <p className="mt-3 text-sm text-purple-800">
          Las recetas y sugerencias generadas por IA son de carácter informativo y no constituyen
          asesoramiento médico o nutricional profesional. Consulta siempre a profesionales de la
          salud ante cualquier necesidad dietética específica.
        </p>
      </>
    ),
  },
  {
    id: 'ia',
    title: '6. Funciones de inteligencia artificial',
    content: (
      <>
        <p>
          {APP_NAME} incorpora funciones de IA generativa para mejorar tu experiencia. Al usar
          estas funciones, reconoces y aceptas que:
        </p>
        <ul className="mt-3 space-y-2">
          {[
            'Las respuestas generadas por IA pueden contener errores, inexactitudes o información desactualizada.',
            'Las recetas, sugerencias de ejercicio o motivaciones generadas no reemplazan el consejo de profesionales cualificados.',
            'No debes compartir información sensible, personal o de terceros en los prompts de IA.',
            'Nos reservamos el derecho de modificar, limitar o discontinuar las funciones de IA en cualquier momento.',
            'El uso de IA está sujeto a los términos de los proveedores de modelos (OpenRouter y sus partners).',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-purple-900">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: 'gamificacion',
    title: '7. Sistema de gamificación',
    content: (
      <>
        <p>
          {APP_NAME} incluye un sistema de puntos, logros, rachas y vales de recompensa. En
          relación a este sistema:
        </p>
        <ul className="mt-3 space-y-2">
          {[
            'Los puntos y logros no tienen valor monetario real y no son transferibles fuera de la plataforma.',
            'Nos reservamos el derecho de ajustar, corregir o reiniciar puntos en caso de actividad fraudulenta o abuso.',
            'Los vales generados dentro de la app son simbólicos; cualquier interpretación o valor que les asignes con terceros es responsabilidad tuya.',
            'No garantizamos la disponibilidad perpetua del sistema de gamificación ni de funciones específicas del mismo.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-purple-900">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: 'propiedad-intelectual',
    title: '8. Propiedad intelectual',
    content: (
      <>
        <p>
          {APP_NAME} y todo su contenido, características y funcionalidades, incluyendo pero no
          limitado a: diseño, código fuente, gráficos, la mascota Mochi, textos y la arquitectura
          del sistema son propiedad exclusiva de {COMPANY_NAME} y están protegidos por leyes de
          propiedad intelectual.
        </p>
        <p className="mt-3 text-sm text-purple-800">
          La licencia que te otorgamos para usar el Servicio es personal, no exclusiva,
          intransferible y limitada al uso personal no comercial de {APP_NAME} de acuerdo con estas
          Condiciones. No te otorgamos ningún otro derecho sobre nuestra propiedad intelectual.
        </p>
        <p className="mt-3 text-sm text-purple-800">
          Si crees que algún contenido del Servicio infringe tus derechos de autor u otros derechos
          de propiedad intelectual, contáctanos en{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-semibold text-purple-600 underline underline-offset-2 hover:text-purple-800"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: 'disponibilidad',
    title: '9. Disponibilidad y mantenimiento',
    content: (
      <>
        <p>
          Nos esforzamos por mantener el Servicio disponible de forma continua, pero no garantizamos
          una disponibilidad del 100%. El Servicio puede estar temporalmente no disponible por:
        </p>
        <ul className="mt-3 space-y-2">
          {[
            'Mantenimiento programado o de emergencia.',
            'Fallos de infraestructura fuera de nuestro control.',
            'Interrupciones de servicios de terceros (Supabase, OpenRouter, etc.).',
            'Fuerza mayor, desastres naturales u otros eventos imprevisibles.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-purple-900">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-purple-800">
          Cuando sea posible, anunciaremos interrupciones programadas con anticipación a través de
          la app o nuestros canales oficiales.
        </p>
      </>
    ),
  },
  {
    id: 'limitacion-responsabilidad',
    title: '10. Limitación de responsabilidad',
    content: (
      <>
        <p>
          En la máxima medida permitida por la ley aplicable, {COMPANY_NAME} no será responsable
          por:
        </p>
        <ul className="mt-3 space-y-2">
          {[
            'Daños indirectos, incidentales, especiales, consecuentes o punitivos.',
            'Pérdida de datos, ingresos, beneficios o buena voluntad.',
            'Interrupción del negocio o pérdida de productividad.',
            'La exactitud, integridad o idoneidad de las respuestas generadas por IA.',
            'Daños derivados del uso o la imposibilidad de usar el Servicio.',
            'Acceso no autorizado a tus datos resultante de tu propio incumplimiento de las medidas de seguridad.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-purple-900">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-2xl border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800">
          El Servicio se proporciona &quot;tal cual&quot; y &quot;según disponibilidad&quot;, sin
          garantías de ningún tipo, ya sean expresas o implícitas, incluyendo garantías de
          comerciabilidad, idoneidad para un propósito particular o no infracción.
        </p>
      </>
    ),
  },
  {
    id: 'terminacion',
    title: '11. Terminación',
    content: (
      <>
        <p>
          Puedes dejar de usar {APP_NAME} y eliminar tu cuenta en cualquier momento desde la
          sección de Ajustes de la aplicación o contactándonos directamente.
        </p>
        <p className="mt-3 text-sm text-purple-800">
          Nos reservamos el derecho de suspender o terminar tu acceso al Servicio, con o sin
          previo aviso, si:
        </p>
        <ul className="mt-3 space-y-2">
          {[
            'Violas estas Condiciones o nuestra Política de Privacidad.',
            'Tu uso del Servicio pone en riesgo la seguridad de otros usuarios o de nuestra infraestructura.',
            'Existen razones legales o regulatorias que lo requieran.',
            'Tu cuenta ha estado inactiva durante un período prolongado (más de 2 años).',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-purple-900">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-purple-800">
          Tras la terminación, tu acceso al Servicio cesará y tus datos serán eliminados conforme a
          lo descrito en nuestra Política de Privacidad.
        </p>
      </>
    ),
  },
  {
    id: 'ley-aplicable',
    title: '12. Ley aplicable y resolución de disputas',
    content: (
      <>
        <p>
          Estas Condiciones se rigen e interpretan de acuerdo con las leyes aplicables. Cualquier
          disputa que surja en relación con el Servicio se intentará resolver primero de manera
          amigable mediante contacto directo con nosotros.
        </p>
        <p className="mt-3 text-sm text-purple-800">
          Si no se alcanza una resolución amigable en un plazo de 30 días, las partes acuerdan
          someter la disputa a mediación antes de iniciar cualquier procedimiento legal formal.
          Nada en estas Condiciones limita tu derecho a presentar reclamaciones ante las autoridades
          de protección al consumidor competentes.
        </p>
      </>
    ),
  },
  {
    id: 'cambios',
    title: '13. Cambios en las Condiciones',
    content: (
      <p>
        Podemos modificar estas Condiciones en cualquier momento. Los cambios materiales se
        notificarán con al menos <strong>14 días de anticipación</strong> mediante un aviso
        destacado en la app o por correo electrónico. El uso continuado del Servicio después de la
        fecha efectiva de los cambios implica la aceptación de las nuevas Condiciones. Si no estás
        de acuerdo con los cambios, puedes eliminar tu cuenta antes de que entren en vigor.
      </p>
    ),
  },
  {
    id: 'contacto',
    title: '14. Contacto',
    content: (
      <>
        <p>
          Para cualquier pregunta sobre estas Condiciones o sobre el Servicio en general, puedes
          contactarnos:
        </p>
        <div className="mt-3 rounded-2xl border border-purple-200 bg-white p-4">
          <p className="text-sm font-bold text-purple-900">{COMPANY_NAME}</p>
          <p className="mt-2 text-sm text-purple-800">
            Soporte general:{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-purple-600 underline underline-offset-2 hover:text-purple-800"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mt-1 text-sm text-purple-800">
            Privacidad:{' '}
            <a
              href="mailto:privacidad@siramong.tech"
              className="font-semibold text-purple-600 underline underline-offset-2 hover:text-purple-800"
            >
              privacidad@siramong.tech
            </a>
          </p>
          <p className="mt-1 text-sm text-purple-800">
            Web:{' '}
            <a
              href={`https://${APP_URL}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-purple-600 underline underline-offset-2 hover:text-purple-800"
            >
              {APP_URL}
            </a>
          </p>
        </div>
      </>
    ),
  },
]

export function TermsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fce7f3,_#ede9fe_45%,_#dbeafe_100%)]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Back link */}
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-sm font-semibold text-purple-700 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-purple-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        {/* Header */}
        <div className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-purple-950 sm:text-3xl">
                Condiciones del Servicio
              </h1>
              <p className="mt-1 text-sm font-semibold text-purple-600">
                {APP_NAME} · Última actualización: {LAST_UPDATED}
              </p>
            </div>
          </div>

          <p className="mt-5 rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm font-semibold text-purple-800">
            Estas Condiciones regulan el uso de {APP_NAME}. Al crear una cuenta o usar el
            Servicio, confirmas que has leído, comprendido y aceptado estos términos. Por favor,
            léelos con atención.
          </p>
        </div>

        {/* Table of contents */}
        <nav className="mt-4 rounded-3xl border border-white/70 bg-white/50 p-5 backdrop-blur-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-purple-600">
            Contenido
          </p>
          <div className="grid gap-1 sm:grid-cols-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-100 hover:text-purple-900"
              >
                {section.title}
              </a>
            ))}
          </div>
        </nav>

        {/* Sections */}
        <div className="mt-4 space-y-4">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-6 rounded-3xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-sm"
            >
              <h2 className="mb-3 text-base font-black text-purple-950">{section.title}</h2>
              <div className="text-sm leading-relaxed text-purple-900">{section.content}</div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 rounded-3xl border border-purple-200 bg-white/60 p-5 text-center backdrop-blur-sm">
          <p className="text-xs font-semibold text-purple-600">
            © {new Date().getFullYear()} {COMPANY_NAME} · {APP_NAME} · Todos los derechos
            reservados
          </p>
          <div className="mt-2 flex justify-center gap-4">
            <Link
              to="/privacy"
              className="text-xs font-bold text-purple-500 underline underline-offset-2 hover:text-purple-700"
            >
              Política de Privacidad
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-xs font-bold text-purple-500 underline underline-offset-2 hover:text-purple-700"
            >
              Contacto
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsPage