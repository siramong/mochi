import "../global.css";
import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SessionProvider, useSession } from "@/context/SessionContext";

function RootLayoutNavigator() {
  const { session, loading, requiresOnboarding, profileError, refreshProfile } = useSession();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/login");
      return;
    }

    if (requiresOnboarding) {
      router.replace("/onboarding");
    } else {
      router.replace("/");
    }
  }, [session, loading, requiresOnboarding]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-purple-50 px-6">
        <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm">
          <ActivityIndicator size="large" />
          <Text className="mt-4 text-center text-base font-semibold text-purple-900">Cargando Mochi...</Text>
        </View>
      </View>
    );
  }

  if (profileError && session) {
    return (
      <View className="flex-1 items-center justify-center bg-yellow-50 px-6">
        <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm">
          <Text className="text-center text-lg font-semibold text-purple-900">Ups, no pudimos cargar tu perfil</Text>
          <Text className="mt-2 text-center text-sm text-purple-800">{profileError}</Text>
          <TouchableOpacity
            className="mt-5 rounded-2xl bg-yellow-300 px-4 py-3"
            onPress={() => {
              void refreshProfile();
            }}
          >
            <Text className="text-center text-base font-semibold text-purple-900">Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export function RootLayout() {
  return (
    <SessionProvider>
      <RootLayoutNavigator />
    </SessionProvider>
  );
}

export default RootLayout;