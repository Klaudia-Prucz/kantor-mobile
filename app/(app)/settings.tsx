import { useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { clearToken } from "../../src/api";
import { AppHeader } from "../../src/components/AppHeader";

export default function Settings() {
  const router = useRouter();

  const logout = async () => {
    await clearToken();
    router.replace("/");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["bottom"]}>
      <AppHeader title="Witaj!" subtitle="Ustawienia konta" />

      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <View style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 16, padding: 14, backgroundColor: "#fff", gap: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: "900" }}>Ustawienia</Text>

          <Pressable
            onPress={() => Alert.alert("Wkrótce", "Tu dodamy np. zmianę hasła / dane konta.")}
            style={{ paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB" }}
          >
            <Text style={{ fontWeight: "800" }}>Dane konta (wkrótce)</Text>
          </Pressable>

          <Pressable
            onPress={logout}
            style={{
              marginTop: 6,
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#111827",
              backgroundColor: "#111827",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>Wyloguj</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
