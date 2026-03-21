import "../global.css";
import { useEffect, useRef } from "react";
import { Stack, router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Notifications from "expo-notifications";
import { SystemBars } from "react-native-edge-to-edge";
import { SessionProvider, useSession } from "@/src/core/providers/SessionContext";
import { SystemBarsProvider, useSystemBars } from "@/src/core/providers/SystemBarsContext";
import { AchievementProvider } from "@/src/core/providers/AchievementContext";
import { MochiCharacter } from "@/src/shared/components/MochiCharacter";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootLayoutNavigator() {
  const { session, loading, requiresOnboarding, profileError, refreshProfile } = useSession();
  const { theme } = useSystemBars();
  const loadingScale = useSharedValue(1);
  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (loading) {
      loadingScale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 650, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 650, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
      return;
    }
    loadingScale.value = withTiming(1, { duration: 180 });
  }, [loading, loadingScale]);

  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: loadingScale.value }],
  }));

  useEffect(() => {
    if (loading) return;
    if (!session) { router.replace("/login"); return; }
    router.replace(requiresOnboarding ? "/onboarding" : "/");
  }, [session, loading, requiresOnboarding]);

  useEffect(() => {
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, unknown> | null;
        const screen = typeof data?.screen === "string" ? data.screen : null;

        if (screen === "habits") router.push("/habits");
        else if (screen === "study") router.push("/");
        else if (screen === "cooking") router.push("/?tab=cooking");
      });
    return () => { notificationResponseListener.current?.remove(); };
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-purple-50 px-6">
        <SystemBars style={{ statusBar: "dark", navigationBar: "dark" }} />
        <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm">
          <View className="items-center">
            <Animated.View style={loadingAnimatedStyle}>
              <MochiCharacter mood="thinking" size={90} />
            </Animated.View>
          </View>
          <Text className="mt-4 text-center text-base font-semibold text-purple-900">
            Cargando Mochi...
          </Text>
        </View>
      </View>
    );
  }

  if (profileError && session) {
    return (
      <View className="flex-1 items-center justify-center bg-yellow-50 px-6">
        <SystemBars style={{ statusBar: "dark", navigationBar: "dark" }} />
        <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm">
          <Text className="text-center text-lg font-semibold text-purple-900">
            Ups, no pudimos cargar tu perfil
          </Text>
          <Text className="mt-2 text-center text-sm text-purple-800">{profileError}</Text>
          <TouchableOpacity
            className="mt-5 rounded-2xl bg-yellow-300 px-4 py-3"
            onPress={() => { void refreshProfile(); }}
          >
            <Text className="text-center text-base font-semibold text-purple-900">Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <SystemBars
        style={{
          statusBar: theme.statusBarStyle,
          navigationBar: theme.navigationBarStyle,
        }}
      />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export function RootLayout() {
  return (
    <SystemBarsProvider>
      <SessionProvider>
        <AchievementProvider>
          <RootLayoutNavigator />
        </AchievementProvider>
      </SessionProvider>
    </SystemBarsProvider>
  );
}

export default RootLayout;