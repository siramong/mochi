import { ArrowLeft, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

type Section = {
  id: string
  title: string
  content: React.ReactNode
}

const LAST_UPDATED = '1 de enero de 2026'
const APP_NAME = 'Mochi'
const CONTACT_EMAIL = 'privacidad@siramong.tech'
const COMPANY_NAME = 'SirAmong'

const sections: Section[] = [
  {
    id: 'introduccion',
    title: '1. Introducción',
    content: (
      <>
        <p>
          Bienvenida a {APP_NAME}. Esta Política de Privacidad describe cómo {COMPANY_NAME}{' '}
          (&quot;nosotros&quot;, &quot;nuestro&quot; o &quot;la empresa&quot;) recopila, usa,
          almacena y protege tu información personal cuando utilizas nuestra aplicación móvil y
          plataforma web (colectivamente, el &quot;Servicio&quot;).
        </p>
        <p className="mt-3">
          Al crear una cuenta o usar {APP_NAME}, aceptas las prácticas descritas en esta política.
          Te recomendamos leerla con atención. Si tienes dudas, puedes contactarnos en cualquier
          momento.
        </p>
      </>
    ),
  },
  {
    id: 'datos-recopilados',
    title: '2. Datos que recopilamos',
    content: (
      <>
        <p>Recopilamos los siguientes tipos de información:</p>
        <div className="mt-3 space-y-4">
          <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
            <p className="text-sm font-bold text-purple-900">Datos de cuenta</p>
            <p className="mt-1 text-sm text-purple-800">
              Correo electrónico y contraseña (almacenada de forma cifrada) al registrarte. Si
              accedes con Google, recibimos tu nombre y foto de perfil públicos.
            </p>
          </div>
          <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
            <p className="text-sm font-bold text-purple-900">Datos de perfil</p>
            <p className="mt-1 text-sm text-purple-800">
              Nombre, hora de despertar y preferencias de módulos que tú misma configuras dentro
              de la app.
            </p>
          </div>
          <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
            <p className="text-sm font-bold text-purple-900">Contenido generado por ti</p>
            <p className="mt-1 text-sm text-purple-800">
              Bloques de estudio, sesiones, exámenes, rutinas, hábitos, metas, registros de ánimo,
              diario de gratitud, recetas y vales que creas dentro de la plataforma.
            </p>
          </div>
          <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
            <p className="text-sm font-bold text-purple-900">Datos de salud (opcional, solo móvil)</p>
            <p className="mt-1 text-sm text-purple-800">
              Si conectas Health Connect en Android, podemos leer registros de menstruación para
              personalizar recomendaciones. Estos datos{' '}
              <strong>nunca salen de tu dispositivo</strong> ni se almacenan en nuestros servidores.
            </p>
          </div>
          <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
            <p className="text-sm font-bold text-purple-900">Datos de uso</p>
            <p className="mt-1 text-sm text-purple-800">
              Información técnica anónima como tipo de dispositivo, versión del sistema operativo y
              métricas de uso general para mejorar el Servicio.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'uso-de-datos',
    title: '3. Cómo usamos tus datos',
    content: (
      <>
        <p>Utilizamos tu información exclusivamente para:</p>
        <ul className="mt-3 space-y-2">
          {[
            'Proveer y mantener el Servicio, incluyendo la sincronización entre dispositivos.',
            'Personalizar tu experiencia y mostrarte recomendaciones relevantes según tus módulos activos.',
            'Calcular puntos, logros y rachas dentro del sistema de gamificación.',
            'Enviarte notificaciones que tú misma configuras (recordatorios de estudio, hábitos, etc.).',
            'Generar recetas y sugerencias mediante inteligencia artificial usando los prompts que tú proporcionas.',
            'Mejorar la calidad del Servicio a través de análisis agregados y anónimos.',
            'Responderte cuando nos contactas por soporte.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-purple-900">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Importante:</strong> Nunca vendemos, alquilamos ni compartimos tus datos
          personales con terceros con fines publicitarios. {APP_NAME} no muestra anuncios.
        </p>
      </>
    ),
  },
  {
    id: 'ia-y-openrouter',
    title: '4. Inteligencia artificial y servicios de terceros',
    content: (
      <>
        <p>
          {APP_NAME} utiliza modelos de inteligencia artificial a través de{' '}
          <strong>OpenRouter</strong> para funciones como generación de recetas, motivación diaria y
          sugerencias de ejercicios. Cuando usas estas funciones:
        </p>
        <ul className="mt-3 space-y-2">
          {[
            'Tu prompt o texto de entrada se envía de forma segura a OpenRouter para generar una respuesta.',
            'No se envían datos de identificación personal (nombre, correo, ID) junto con las solicitudes de IA.',
            'Las respuestas generadas se almacenan en tu cuenta para que puedas acceder a ellas.',
            'Los datos de salud (ciclo menstrual) solo se usan como contexto local en tu dispositivo; nunca se envían a servicios de IA.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-purple-900">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-purple-800">
          También usamos <strong>Supabase</strong> como proveedor de base de datos y autenticación.
          Supabase almacena tus datos en servidores seguros con cifrado en tránsito y en reposo.
          Puedes consultar su política de privacidad en{' '}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-purple-600 underline underline-offset-2 hover:text-purple-800"
          >
            supabase.com/privacy
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: 'almacenamiento',
    title: '5. Almacenamiento y seguridad',
    content: (
      <>
        <p>
          Tus datos se almacenan en servidores de Supabase con las siguientes medidas de
          protección:
        </p>
        <ul className="mt-3 space-y-2">
          {[
            'Cifrado en tránsito mediante TLS 1.2 o superior en todas las comunicaciones.',
            'Cifrado en reposo para todos los datos almacenados en la base de datos.',
            'Row Level Security (RLS) en todas las tablas: solo tú puedes acceder a tus propios datos.',
            'Contraseñas almacenadas con hash seguro; nunca en texto plano.',
            'Autenticación de dos factores disponible a través de Google OAuth.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-purple-900">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-purple-800">
          Aunque implementamos medidas de seguridad estándar de la industria, ningún sistema es
          100% infalible. En caso de una brecha de seguridad que afecte tus datos, te notificaremos
          conforme a la legislación aplicable.
        </p>
      </>
    ),
  },
  {
    id: 'retencion',
    title: '6. Retención de datos',
    content: (
      <p>
        Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, tus datos
        personales serán eliminados de nuestros servidores activos en un plazo de{' '}
        <strong>30 días</strong>. Algunos datos pueden permanecer en copias de respaldo cifradas
        durante un período adicional de hasta <strong>90 días</strong> antes de su eliminación
        permanente. Los datos de salud leídos de Health Connect nunca se almacenan en nuestros
        servidores y se procesan exclusivamente en tu dispositivo.
      </p>
    ),
  },
  {
    id: 'derechos',
    title: '7. Tus derechos',
    content: (
      <>
        <p>Tienes derecho a:</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            { title: 'Acceso', desc: 'Solicitar una copia de todos los datos que tenemos sobre ti.' },
            { title: 'Rectificación', desc: 'Corregir datos incorrectos o incompletos desde los ajustes de la app.' },
            { title: 'Eliminación', desc: 'Solicitar la eliminación completa de tu cuenta y datos asociados.' },
            { title: 'Portabilidad', desc: 'Recibir tus datos en un formato estructurado y legible por máquina.' },
            { title: 'Oposición', desc: 'Oponerte al procesamiento de tus datos en determinadas circunstancias.' },
            { title: 'Limitación', desc: 'Solicitar que limitemos el procesamiento de tus datos en ciertos casos.' },
          ].map((right) => (
            <div key={right.title} className="rounded-2xl border border-purple-100 bg-purple-50/60 p-3">
              <p className="text-sm font-bold text-purple-900">{right.title}</p>
              <p className="mt-1 text-xs text-purple-700">{right.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-purple-800">
          Para ejercer cualquiera de estos derechos, escríbenos a{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-semibold text-purple-600 underline underline-offset-2 hover:text-purple-800"
          >
            {CONTACT_EMAIL}
          </a>
          . Responderemos en un plazo máximo de <strong>30 días hábiles</strong>.
        </p>
      </>
    ),
  },
  {
    id: 'menores',
    title: '8. Menores de edad',
    content: (
      <p>
        {APP_NAME} está diseñada para personas mayores de <strong>13 años</strong>. No recopilamos
        intencionadamente datos de menores de 13 años. Si eres padre, madre o tutor y crees que tu
        hija menor de 13 años ha creado una cuenta, contáctanos en{' '}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-semibold text-purple-600 underline underline-offset-2 hover:text-purple-800"
        >
          {CONTACT_EMAIL}
        </a>{' '}
        y eliminaremos la cuenta de inmediato.
      </p>
    ),
  },
  {
    id: 'cookies',
    title: '9. Cookies y almacenamiento local',
    content: (
      <>
        <p>
          La versión web de {APP_NAME} utiliza <strong>localStorage</strong> y cookies de sesión
          estrictamente necesarias para mantener tu sesión iniciada. No utilizamos cookies de
          seguimiento ni publicidad de terceros.
        </p>
        <p className="mt-3 text-sm text-purple-800">
          La aplicación móvil utiliza <strong>AsyncStorage</strong> para guardar preferencias
          locales como configuración de notificaciones y caché de datos de ciclo. Estos datos
          permanecen en tu dispositivo y puedes eliminarlos desinstalando la aplicación.
        </p>
      </>
    ),
  },
  {
    id: 'cambios',
    title: '10. Cambios en esta política',
    content: (
      <p>
        Podemos actualizar esta Política de Privacidad ocasionalmente. Cuando hagamos cambios
        materiales, te notificaremos mediante un aviso visible en la app o por correo electrónico
        al menos <strong>14 días antes</strong> de que entren en vigor. La fecha de la última
        actualización siempre estará indicada al inicio de este documento. El uso continuado del
        Servicio después de esa fecha constituye la aceptación de la política actualizada.
      </p>
    ),
  },
  {
    id: 'contacto',
    title: '11. Contacto',
    content: (
      <>
        <p>
          Si tienes preguntas, inquietudes o solicitudes relacionadas con tu privacidad, puedes
          contactarnos por cualquiera de estos medios:
        </p>
        <div className="mt-3 rounded-2xl border border-purple-200 bg-white p-4">
          <p className="text-sm font-bold text-purple-900">{COMPANY_NAME}</p>
          <p className="mt-2 text-sm text-purple-800">
            Correo de privacidad:{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-purple-600 underline underline-offset-2 hover:text-purple-800"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mt-1 text-sm text-purple-800">
            Sitio web:{' '}
            <a
              href="https://mochi.siramong.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-purple-600 underline underline-offset-2 hover:text-purple-800"
            >
              mochi.siramong.tech
            </a>
          </p>
        </div>
      </>
    ),
  },
]

export function PrivacyPage() {
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
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-purple-950 sm:text-3xl">
                Política de Privacidad
              </h1>
              <p className="mt-1 text-sm font-semibold text-purple-600">
                {APP_NAME} · Última actualización: {LAST_UPDATED}
              </p>
            </div>
          </div>

          <p className="mt-5 rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm font-semibold text-purple-800">
            Tu privacidad es fundamental para nosotros. {APP_NAME} está diseñada para ayudarte a
            crecer sin comprometer tus datos. Lee este documento para entender exactamente qué
            información recopilamos y cómo la usamos.
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
              to="/terms"
              className="text-xs font-bold text-purple-500 underline underline-offset-2 hover:text-purple-700"
            >
              Condiciones del Servicio
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

export default PrivacyPage