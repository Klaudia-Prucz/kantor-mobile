import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getToken } from "../src/api";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  const refreshAuth = useCallback(async () => {
    const t = await getToken();
    setIsAuthed(Boolean(t));
    setChecking(false);
  }, []);

  // start
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  // ważne: odświeżaj przy każdej zmianie ścieżki (login/logout)
  useEffect(() => {
    refreshAuth();
  }, [pathname, refreshAuth]);

  useEffect(() => {
    if (checking) return;

    const inProtectedGroup = segments.includes("(app)");

    if (!isAuthed && inProtectedGroup) router.replace("/");
    if (isAuthed && !inProtectedGroup) router.replace("/(app)/home");
  }, [checking, isAuthed, segments, router]);

  return (
    <SafeAreaProvider>
      {checking ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false }} />
      )}
    </SafeAreaProvider>
  );
}
