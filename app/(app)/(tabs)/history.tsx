import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiTransactionsMe } from "../../../src/api";
import { AppHeader } from "../../../src/components/AppHeader";

type TxType = "DEPOSIT" | "BUY" | "SELL";

type TxDto = {
  id?: string | number;
  type: TxType;
  currencyCode?: string; // backend często tak ma
  currency?: string;     // a czasem tak
  amount?: string | number;
  rate?: string | number;
  createdAt?: string;    // ISO
  created_at?: string;
  // opcjonalnie pola zależnie od backendu
};

function asNumber(v: any) {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

function fmt(v: any, digits = 2) {
  const n = asNumber(v);
  return n == null ? "—" : n.toFixed(digits);
}

function normalizeTx(raw: any): TxDto {
  return {
    ...raw,
    currency: (raw?.currency ?? raw?.currencyCode ?? raw?.currency_code ?? "").toUpperCase() || undefined,
    createdAt: raw?.createdAt ?? raw?.created_at ?? raw?.timestamp ?? undefined,
  };
}

function typeLabel(t: TxType) {
  if (t === "DEPOSIT") return "Zasilenie";
  if (t === "BUY") return "Kupno";
  return "Sprzedaż";
}

function signedPLN(t: TxDto) {
  // Wyliczamy orientacyjny wpływ na PLN:
  // BUY: - amount * rate
  // SELL: + amount * rate
  // DEPOSIT: + amount (zakładamy, że amount = PLN)
  const type = t.type;
  const amount = asNumber(t.amount);
  const rate = asNumber(t.rate);

  if (type === "DEPOSIT") return amount != null ? amount : null;
  if (type === "BUY") return amount != null && rate != null ? -(amount * rate) : null;
  if (type === "SELL") return amount != null && rate != null ? amount * rate : null;
  return null;
}

function TxCard({ tx }: { tx: TxDto }) {
  const currency = tx.currency ?? "—";
  const impact = signedPLN(tx);
  const isPlus = impact != null && impact > 0;

  return (
    <View style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 16, padding: 14, backgroundColor: "#fff", gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text style={{ fontWeight: "900", fontSize: 16 }}>{typeLabel(tx.type as TxType)}</Text>
        <Text style={{ fontWeight: "900", opacity: 0.75 }}>{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "—"}</Text>
      </View>

      <View style={{ height: 1, backgroundColor: "#E5E7EB" }} />

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ opacity: 0.7 }}>Waluta</Text>
        <Text style={{ fontWeight: "900" }}>{tx.type === "DEPOSIT" ? "PLN" : currency}</Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ opacity: 0.7 }}>Ilość</Text>
        <Text style={{ fontWeight: "900" }}>
          {fmt(tx.amount)} {tx.type === "DEPOSIT" ? "PLN" : currency}
        </Text>
      </View>

      {tx.type !== "DEPOSIT" && (
        <>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ opacity: 0.7 }}>Kurs</Text>
            <Text style={{ fontWeight: "900" }}>1 {currency} = {fmt(tx.rate, 6)} PLN</Text>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ opacity: 0.7 }}>{tx.type === "BUY" ? "Koszt (szac.)" : "Wpływ (szac.)"}</Text>
            <Text style={{ fontWeight: "900", color: impact == null ? "#111827" : isPlus ? "#065F46" : "#991B1B" }}>
              {impact == null ? "—" : `${fmt(Math.abs(impact))} PLN`}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

export default function HistoryTab() {
  const [items, setItems] = useState<TxDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"ALL" | TxType>("ALL");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const raw = (await apiTransactionsMe()) as any;
      const list = Array.isArray(raw) ? raw : raw?.items ?? raw?.data ?? [];
      setItems(list.map(normalizeTx));
    } catch (e: any) {
      Alert.alert("Błąd", e?.message ?? "Nie udało się pobrać historii");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((x) => x.type === filter);
  }, [items, filter]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["bottom"]}>
      <AppHeader title="Historia" subtitle="Twoje transakcje" />

      <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
          {(["ALL", "DEPOSIT", "BUY", "SELL"] as const).map((k) => (
            <Pressable
              key={k}
              onPress={() => setFilter(k as any)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: filter === k ? "#111827" : "#E5E7EB",
                backgroundColor: filter === k ? "#111827" : "#fff",
              }}
            >
              <Text style={{ fontWeight: "900", color: filter === k ? "#fff" : "#111827" }}>
                {k === "ALL" ? "Wszystkie" : typeLabel(k as TxType)}
              </Text>
            </Pressable>
          ))}

          <View style={{ flex: 1 }} />

          <Pressable onPress={load} disabled={loading} style={{ paddingVertical: 8, paddingHorizontal: 10 }}>
            <Text style={{ fontWeight: "900", opacity: loading ? 0.5 : 0.7 }}>
              {loading ? "Ładowanie…" : "Odśwież"}
            </Text>
          </Pressable>
        </View>

        {loading && items.length === 0 ? (
          <View style={{ paddingTop: 30, alignItems: "center", gap: 10 }}>
            <ActivityIndicator />
            <Text style={{ fontWeight: "800", opacity: 0.7 }}>Pobieram historię…</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
            {filtered.map((tx, idx) => (
              <TxCard key={String(tx.id ?? idx)} tx={tx} />
            ))}
            {filtered.length === 0 && <Text style={{ opacity: 0.6 }}>Brak transakcji do pokazania.</Text>}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
