const AUTH_CALLBACK_PATH = '/auth/callback'
export const POST_AUTH_REDIRECT_PATH = '/dashboard'

function sanitizeBaseUrl(url: string): string | null {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

export function getWebBaseUrl(): string {
  const envBaseUrl = import.meta.env.VITE_APP_URL?.trim()

  if (envBaseUrl) {
    const sanitized = sanitizeBaseUrl(envBaseUrl)
    if (sanitized) return sanitized
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
}

export function getAuthCallbackUrl(): string {
  // Supuesto actual: la app web resuelve rutas en raíz. Si se despliega en subpath,
  // VITE_APP_URL debe incluir el path base correcto para construir redirectTo.
  const baseUrl = getWebBaseUrl()
  return baseUrl ? `${baseUrl}${AUTH_CALLBACK_PATH}` : AUTH_CALLBACK_PATH
}
