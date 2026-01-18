import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiRatesByDate, apiRatesLatest } from "../../../src/api";
import { AppHeader } from "../../../src/components/AppHeader";

type RatesDto = { date: string; rates: Record<string, number> };

function isValidYMD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function addDays(ymd: string, delta: number) {
  if (!isValidYMD(ymd)) return ymd;
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export default function RatesTab() {
  const [rates, setRates] = useState<RatesDto | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);

  const list = useMemo(() => {
    if (!rates?.rates) return [];
    return Object.entries(rates.rates)
      .map(([c, v]) => ({ c, v }))
      .sort((a, b) => a.c.localeCompare(b.c));
  }, [rates]);

  const loadLatest = useCallback(async () => {
    try {
      setLoading(true);
      const r = (await apiRatesLatest()) as any;
      setRates(r);
      setSelectedDate(r?.date ?? "");
    } catch (e: any) {
      Alert.alert("Błąd kursów", e?.message ?? "Nie udało się pobrać kursów");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDate = useCallback(async (ymd: string) => {
    if (!isValidYMD(ymd)) return Alert.alert("Niepoprawna data", "Format YYYY-MM-DD.");
    try {
      setLoading(true);
      setRates((await apiRatesByDate(ymd)) as any);
      setSelectedDate(ymd);
    } catch (e: any) {
      Alert.alert("Brak kursów", e?.message ?? "Nie udało się pobrać kursów dla tej daty");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["bottom"]}>
      <AppHeader title="Witaj!" subtitle="Kursy walut" />

      <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
          <Pressable
            onPress={() => selectedDate && loadDate(addDays(selectedDate, -1))}
            disabled={loading}
            style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", opacity: loading ? 0.6 : 1 }}
          >
            <Text style={{ fontWeight: "900" }}>◀︎</Text>
          </Pressable>

          <View style={{ flex: 1 }}>
            <TextInput
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff", fontWeight: "800" }}
            />
          </View>

          <Pressable
            onPress={() => loadDate(selectedDate)}
            disabled={loading}
            style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#111827", opacity: loading ? 0.6 : 1 }}
          >
            <Text style={{ fontWeight: "900", color: "#fff" }}>OK</Text>
          </Pressable>

          <Pressable
            onPress={() => selectedDate && loadDate(addDays(selectedDate, 1))}
            disabled={loading}
            style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", opacity: loading ? 0.6 : 1 }}
          >
            <Text style={{ fontWeight: "900" }}>▶︎</Text>
          </Pressable>
        </View>

        <Pressable onPress={loadLatest} disabled={loading} style={{ alignSelf: "flex-start", marginBottom: 10 }}>
          <Text style={{ fontWeight: "900", opacity: loading ? 0.5 : 0.7 }}>
            {loading ? "Ładowanie..." : "Pokaż najnowsze"}
          </Text>
        </Pressable>

        <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 10 }}>
          <Text style={{ fontWeight: "900" }}>Data: {rates?.date ?? "—"}</Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {list.map((x) => (
              <View
                key={x.c}
                style={{ width: "48%", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 14, padding: 12, backgroundColor: "#fff", gap: 6 }}
              >
                <Text style={{ fontSize: 12, opacity: 0.6, fontWeight: "800" }}>Waluta</Text>
                <Text style={{ fontSize: 18, fontWeight: "900" }}>{x.c}</Text>
                <Text style={{ fontSize: 12, opacity: 0.6, fontWeight: "800" }}>Kurs</Text>
                <Text style={{ fontSize: 16, fontWeight: "900" }}>{x.v}</Text>
              </View>
            ))}
            {list.length === 0 && <Text style={{ opacity: 0.6 }}>Brak danych kursów.</Text>}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
