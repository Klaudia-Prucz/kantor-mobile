import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiWalletDeposit } from "../../../src/api";
import { AppHeader } from "../../../src/components/AppHeader";

export default function DepositTab() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    try {
      const normalized = amount.replace(",", ".").trim();
      const value = Number(normalized);

      if (!Number.isFinite(value) || value <= 0) {
        Alert.alert("Błędna kwota", "Podaj kwotę większą od 0.");
        return;
      }

      setBusy(true);
      await apiWalletDeposit(value);

      Alert.alert("Sukces", "Konto zostało zasilone.", [
        {
          text: "OK",
          onPress: () => router.replace("/(app)/(tabs)/home"),
        },
      ]);
    } catch (e: any) {
      Alert.alert("Błąd", e?.message ?? "Nie udało się zasilić konta");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["bottom"]}>
      <AppHeader title="Witaj!" subtitle="Zasil konto (symulowany przelew)" />

      <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 12, gap: 12 }}>
        <View style={{ gap: 6, marginTop: 6 }}>
          <Text style={{ fontSize: 22, fontWeight: "900" }}>Zasil konto</Text>
          <Text style={{ opacity: 0.65 }}>
            Podaj kwotę — zostanie dopisana do salda PLN w Twoim portfelu.
          </Text>
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: "#E5E7EB",
            borderRadius: 16,
            padding: 14,
            backgroundColor: "#fff",
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "800", opacity: 0.8 }}>Kwota (PLN)</Text>

          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="np. 100.00"
            placeholderTextColor="#9CA3AF"
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 16,
              backgroundColor: "#fff",
            }}
          />

          <Pressable
            onPress={submit}
            disabled={busy}
            style={{
              marginTop: 6,
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#111827",
              backgroundColor: "#111827",
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Text style={{ fontWeight: "900", color: "#fff" }}>
              {busy ? "Przetwarzanie..." : "Zasil konto"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/(app)/(tabs)/home")}
            disabled={busy}
            style={{ paddingVertical: 10, alignItems: "center" }}
          >
            <Text style={{ opacity: 0.7, fontWeight: "800" }}>Wróć do Home</Text>
          </Pressable>
        </View>

        <Text style={{ textAlign: "center", opacity: 0.4, fontSize: 12 }}>
          Symulowany przelew — bez prawdziwych płatności.
        </Text>
      </View>
    </SafeAreaView>
  );
}
