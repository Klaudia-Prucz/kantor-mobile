import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiRatesByDate, apiRatesLatest, apiWalletMe } from "../../../src/api";
import { AppHeader } from "../../../src/components/AppHeader";

type WalletDto = { balancePLN: number | string; balances?: Array<{ currency: string; amount: number | string }> };
type RatesDto = { date: string; rates: Record<string, number> };

function formatMoneyPLN(v: number | string | undefined | null) {
  const n = typeof v === "string" ? Number(v) : v ?? 0;
  return Number.isFinite(n) ? n.toFixed(2) : String(v ?? "0.00");
}
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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 16, padding: 14, backgroundColor: "#fff", gap: 10 }}>
      <Text style={{ fontSize: 14, fontWeight: "900", opacity: 0.85 }}>{title}</Text>
      {children}
    </View>
  );
}

export default function HomeTab() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [rates, setRates] = useState<RatesDto | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const balancesList = useMemo(() => (wallet?.balances ?? []).sort((a, b) => a.currency.localeCompare(b.currency)), [wallet]);
  const ratesList = useMemo(() => (rates?.rates ? Object.entries(rates.rates).map(([c, v]) => ({ c, v })).sort((a, b) => a.c.localeCompare(b.c)) : []), [rates]);

  const loadWallet = useCallback(async () => {
    try {
      setLoadingWallet(true);
      setWallet((await apiWalletMe()) as any);
    } catch (e: any) {
      Alert.alert("Błąd portfela", e?.message ?? "Nie udało się pobrać portfela");
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  const loadRatesLatest = useCallback(async () => {
    try {
      setLoadingRates(true);
      const r = (await apiRatesLatest()) as any;
      setRates(r);
      setSelectedDate(r?.date ?? "");
    } catch (e: any) {
      Alert.alert("Błąd kursów", e?.message ?? "Nie udało się pobrać kursów");
    } finally {
      setLoadingRates(false);
    }
  }, []);

  const loadRatesForDate = useCallback(async (ymd: string) => {
    if (!isValidYMD(ymd)) return Alert.alert("Niepoprawna data", "Format YYYY-MM-DD, np. 2026-01-16.");
    try {
      setLoadingRates(true);
      setRates((await apiRatesByDate(ymd)) as any);
      setSelectedDate(ymd);
    } catch (e: any) {
      Alert.alert("Brak kursów", e?.message ?? "Nie udało się pobrać kursów dla tej daty");
    } finally {
      setLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
    loadRatesLatest();
  }, [loadWallet, loadRatesLatest]);

  useFocusEffect(
    useCallback(() => {
      loadWallet(); // odśwież po powrocie z zasilenia
    }, [loadWallet])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["bottom"]}>
      <AppHeader title="Witaj!" subtitle="Home • stan konta i kursy" />

      <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 12 }}>
        <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
          <Card title="Stan konta">
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text style={{ opacity: 0.7 }}>Saldo PLN</Text>
              <Text style={{ fontSize: 22, fontWeight: "900" }}>{wallet ? `${formatMoneyPLN(wallet.balancePLN)} PLN` : "—"}</Text>
            </View>

            <View style={{ height: 1, backgroundColor: "#E5E7EB" }} />

            {balancesList.length === 0 ? (
              <Text style={{ opacity: 0.6 }}>Brak innych walut.</Text>
            ) : (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: "800", opacity: 0.7 }}>Posiadane waluty</Text>
                {balancesList.map((b) => (
                  <View key={b.currency} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontWeight: "900" }}>{b.currency}</Text>
                    <Text style={{ opacity: 0.85 }}>{String(b.amount)}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Pressable
                onPress={() => router.push("/(app)/(tabs)/deposit")}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: "center", backgroundColor: "#111827" }}
              >
                <Text style={{ fontWeight: "900", color: "#fff" }}>Zasil konto</Text>
              </Pressable>

              <Pressable
                onPress={() => Alert.alert("Wkrótce", "Następny krok: kup walutę.")}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB" }}
              >
                <Text style={{ fontWeight: "900" }}>Kup walutę</Text>
              </Pressable>
            </View>

            <Pressable onPress={loadWallet} disabled={loadingWallet} style={{ marginTop: 8, alignSelf: "flex-start" }}>
              <Text style={{ fontWeight: "900", opacity: loadingWallet ? 0.5 : 0.7 }}>
                {loadingWallet ? "Odświeżanie..." : "Odśwież portfel"}
              </Text>
            </Pressable>
          </Card>

          <Card title="Kursy walut (NBP)">
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ opacity: 0.7 }}>Data</Text>
              <Text style={{ fontWeight: "900" }}>{rates?.date ?? "—"}</Text>
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <Pressable
                onPress={() => selectedDate && loadRatesForDate(addDays(selectedDate, -1))}
                disabled={loadingRates}
                style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", opacity: loadingRates ? 0.6 : 1 }}
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
                onPress={() => loadRatesForDate(selectedDate)}
                disabled={loadingRates}
                style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#111827", opacity: loadingRates ? 0.6 : 1 }}
              >
                <Text style={{ fontWeight: "900", color: "#fff" }}>OK</Text>
              </Pressable>

              <Pressable
                onPress={() => selectedDate && loadRatesForDate(addDays(selectedDate, 1))}
                disabled={loadingRates}
                style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", opacity: loadingRates ? 0.6 : 1 }}
              >
                <Text style={{ fontWeight: "900" }}>▶︎</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={loadRatesLatest}
              disabled={loadingRates}
              style={{ marginTop: 8, alignSelf: "flex-start" }}
            >
              <Text style={{ fontWeight: "900", opacity: loadingRates ? 0.5 : 0.7 }}>
                {loadingRates ? "Ładowanie..." : "Pokaż najnowsze"}
              </Text>
            </Pressable>

            <View style={{ height: 1, backgroundColor: "#E5E7EB", marginTop: 10 }} />

            <View style={{ marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {ratesList.map((x) => (
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
              {ratesList.length === 0 && <Text style={{ opacity: 0.6 }}>Brak danych kursów.</Text>}
            </View>
          </Card>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
