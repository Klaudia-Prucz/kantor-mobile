import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { clearToken } from "../../src/api";

function DrawerContent() {
  const router = useRouter();

  const logout = async () => {
    await clearToken();
    router.replace("/");
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "900" }}>Menu</Text>

      <Pressable
        onPress={() => router.replace("/(app)/(tabs)/home")}
        style={{ paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB" }}
      >
        <Text style={{ fontWeight: "800" }}>Home</Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace("/(app)/settings")}
        style={{ paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB" }}
      >
        <Text style={{ fontWeight: "800" }}>Ustawienia konta</Text>
      </Pressable>

      <View style={{ flex: 1 }} />

      <Pressable
        onPress={logout}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#111827",
          backgroundColor: "#111827",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>Wyloguj</Text>
      </Pressable>

      <Text style={{ textAlign: "center", opacity: 0.4, fontSize: 12, marginTop: 10 }}>
        © 2026 Kantor mobilny
      </Text>
    </View>
  );
}

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={() => <DrawerContent />}
      screenOptions={{
        headerShown: false, // własny header robimy w ekranach
      }}
    >
      <Drawer.Screen name="(tabs)" />
      <Drawer.Screen name="settings" />
    </Drawer>
  );
}
