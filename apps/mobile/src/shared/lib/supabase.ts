import { createSupabaseClient } from '@mochi/supabase/client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppState } from 'react-native'

export const supabase = createSupabaseClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)

// Cuando la app vuelve al primer plano, reactivar el auto-refresh del token.
// Cuando va al fondo, pausarlo para no consumir recursos innecesarios.
// Esto evita el bug donde la sesión parece rota tras volver de segundo plano.
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    void supabase.auth.startAutoRefresh()
  } else {
    void supabase.auth.stopAutoRefresh()
  }
})