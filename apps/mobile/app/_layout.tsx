import "../global.css";
import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useSession } from "@/hooks/useSession";

export function RootLayout() {
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
        <View className="w-full max-w-sm rounded-3xl bg-pink-100 p-6 shadow-sm">
          <ActivityIndicator size="large" />
          <Text className="mt-4 text-center text-base font-semibold text-purple-700">Cargando Mochi...</Text>
        </View>
      </View>
    );
  }

  if (profileError && session) {
    return (
      <View className="flex-1 items-center justify-center bg-blue-50 px-6">
        <View className="w-full max-w-sm rounded-3xl bg-yellow-100 p-6 shadow-sm">
          <Text className="text-center text-lg font-semibold text-purple-700">Ups, no pudimos cargar tu perfil</Text>
          <Text className="mt-2 text-center text-sm text-purple-600">{profileError}</Text>
          <TouchableOpacity
            className="mt-5 rounded-2xl bg-green-100 px-4 py-3"
            onPress={() => {
              void refreshProfile();
            }}
          >
            <Text className="text-center text-base font-semibold text-purple-700">Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default RootLayout;