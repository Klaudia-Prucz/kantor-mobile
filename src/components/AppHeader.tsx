import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function AppHeader({
  title = "Witaj!",
  subtitle = "Panel kantoru",
}: {
  title?: string;
  subtitle?: string;
}) {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: "#F9FAFB" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 }}>
        {/* Avatar (otwiera menu) */}
        <Pressable
          onPress={() => navigation.openDrawer?.()}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "#111827",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>K</Text>
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "900" }}>{title}</Text>
          <Text style={{ fontSize: 12, opacity: 0.6 }}>{subtitle}</Text>
        </View>

        {/* szybki skrót do ustawień (opcjonalnie) */}
        {/* Możesz usunąć jeśli nie chcesz */}
      </View>
    </SafeAreaView>
  );
}
