import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../../src/components/AppHeader";

export default function HistoryTab() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["bottom"]}>
      <AppHeader title="Witaj!" subtitle="Historia transakcji" />
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ opacity: 0.7 }}>
          Tu będzie historia transakcji (kupno/sprzedaż/zasilenia).
        </Text>
      </View>
    </SafeAreaView>
  );
}
