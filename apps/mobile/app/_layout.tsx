import "../global.css";
import { useEffect, useRef } from "react";
import { Stack, router, usePathname } from "expo-router";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Notifications from "expo-notifications";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { SessionProvider, useSession } from "@/context/SessionContext";
import { MochiCharacter } from "@/components/MochiCharacter";

type SystemBarsTheme = {
  backgroundColor: string;
  statusBarStyle: "light" | "dark";
};

function getSystemBarsTheme(pathname: string): SystemBarsTheme {
  if (pathname.startsWith("/login")) {
    return {
      backgroundColor: "#f3e8ff",
      statusBarStyle: "dark",
    };
  }

  if (pathname.startsWith("/onboarding")) {
    return {
      backgroundColor: "#f5f3ff",
      statusBarStyle: "dark",
    };
  }

  if (pathname.startsWith("/study") || pathname.startsWith("/exam-log")) {
    return {
      backgroundColor: "#ede9fe",
      statusBarStyle: "dark",
    };
  }

  if (pathname.startsWith("/exercise") || pathname.startsWith("/routine")) {
    return {
      backgroundColor: "#ecfeff",
      statusBarStyle: "dark",
    };
  }

  if (pathname.startsWith("/habits") || pathname.startsWith("/gratitude") || pathname.startsWith("/mood")) {
    return {
      backgroundColor: "#ecfdf5",
      statusBarStyle: "dark",
    };
  }

  return {
    backgroundColor: "#f3e8ff",
    statusBarStyle: "dark",
  };
}

// Configure how notifications are displayed when the app is in the foreground
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
  const pathname = usePathname();
  const { session, loading, requiresOnboarding, profileError, refreshProfile } = useSession();
  const loadingScale = useSharedValue(1);
  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null);
  const { backgroundColor, statusBarStyle } = getSystemBarsTheme(pathname);

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

  const loadingAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: loadingScale.value }],
    };
  });

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

  // Register notification tap handler for deep navigation
  useEffect(() => {
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, unknown> | null;
        const screen = typeof data?.screen === "string" ? data.screen : null;

        if (screen === "habits") {
          router.push("/habits");
        } else if (screen === "study") {
          router.push("/");
        }
      });

    return () => {
      notificationResponseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    async function syncAndroidSystemBars() {
      await NavigationBar.setBackgroundColorAsync(backgroundColor);
      await NavigationBar.setButtonStyleAsync(statusBarStyle);
    }

    void syncAndroidSystemBars();
  }, [backgroundColor, statusBarStyle]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-purple-50 px-6">
        <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm">
          <View className="items-center">
            <Animated.View style={loadingAnimatedStyle}>
              <MochiCharacter mood="thinking" size={90} />
            </Animated.View>
          </View>
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

  return (
    <>
      <StatusBar style={statusBarStyle} backgroundColor={backgroundColor} translucent={false} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export function RootLayout() {
  return (
    <SessionProvider>
      <RootLayoutNavigator />
    </SessionProvider>
  );
}

export default RootLayout;