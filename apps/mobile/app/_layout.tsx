import "../global.css";
import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { useSession } from "@/hooks/useSession";

export default function RootLayout() {
  const { session, loading } = useSession();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/login");
    } else {
      router.replace("/");
    }
  }, [session, loading]);

  return <Stack screenOptions={{ headerShown: false }} />;
}