import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiExchangeBuy, apiExchangeSell, apiRatesLatest, apiWalletMe } from "../../../src/api";
import { AppHeader } from "../../../src/components/AppHeader";

type WalletDto = { balancePLN: number | string; balances?: Array<{ currency: string; amount: number | string }> };
type RatesDto = { date: string; rates: Record<string, number> };

function formatMoney(v: number | string | undefined | null, digits = 2) {
  const n = typeof v === "string" ? Number(v) : v ?? 0;
  return Number.isFinite(n) ? n.toFixed(digits) : String(v ?? "0.00");
}

function parseAmount(s: string) {
  const clean = String(s ?? "").replace(",", ".").replace(/[^\d.]/g, "");
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
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
      <Text style={{ fontSize: 14, fontWeight: "900", opacity: 0.85 }}>{title}</Text>
      {children}
    </View>
  );
}

function getWalletBalance(wallet: WalletDto | null, currency: string) {
  if (!wallet) return 0;
  if (currency === "PLN") {
    const n = typeof wallet.balancePLN === "string" ? Number(wallet.balancePLN) : Number(wallet.balancePLN ?? 0);
    return Number.isFinite(n) ? n : 0;
  }
  const row = (wallet.balances ?? []).find((b) => b.currency === currency);
  const n = typeof row?.amount === "string" ? Number(row?.amount) : Number(row?.amount ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default function ExchangeTab() {
  const router = useRouter();

  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [rates, setRates] = useState<RatesDto | null>(null);

  const [loadingWallet, setLoadingWallet] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // BUY = kup walutę za PLN (PLN -> X)
  // SELL = sprzedaj walutę za PLN (X -> PLN)
  const [mode, setMode] = useState<"BUY" | "SELL">("BUY");

  const [currency, setCurrency] = useState("EUR"); // waluta kupowana / sprzedawana
  const [amountText, setAmountText] = useState("10"); // ✅ amount zawsze w WALUCIE (EUR/USD/...)
  const amount = useMemo(() => parseAmount(amountText), [amountText]);

  const balancesList = useMemo(
    () => (wallet?.balances ?? []).slice().sort((a, b) => a.currency.localeCompare(b.currency)),
    [wallet]
  );

  const currencyOptions = useMemo(() => {
    const s = new Set<string>();
    Object.keys(rates?.rates ?? {}).forEach((c) => s.add(c));
    (wallet?.balances ?? []).forEach((b) => s.add(b.currency));
    return Array.from(s)
      .filter((c) => c !== "PLN")
      .sort((a, b) => a.localeCompare(b));
  }, [rates, wallet]);

  const plnBalance = useMemo(() => getWalletBalance(wallet, "PLN"), [wallet]);
  const curBalance = useMemo(() => getWalletBalance(wallet, currency), [wallet, currency]);

  const ratePLN = useMemo(() => {
    const r = rates?.rates?.[currency];
    return typeof r === "number" && Number.isFinite(r) ? r : null; // PLN za 1 jednostkę waluty
  }, [rates, currency]);

  // ✅ Quote:
  // BUY: costPLN = amount(currency) * ratePLN
  // SELL: gainPLN = amount(currency) * ratePLN
  // (backend policzy finalnie po buyRate/sellRate, to jest orientacyjne)
  const plnValue = useMemo(() => {
    if (!ratePLN) return null;
    if (amount <= 0) return null;
    return amount * ratePLN;
  }, [ratePLN, amount]);

  const canSubmit = useMemo(() => {
    if (!wallet || !rates) return false;
    if (!ratePLN) return false;
    if (amount <= 0) return false;

    if (mode === "BUY") {
      // ✅ w BUY sprawdzamy PLN: czy stać nas na koszt
      if ((plnValue ?? 0) > plnBalance + 1e-9) return false;
      return true;
    }

    // SELL: sprawdzamy saldo waluty
    if (amount > curBalance + 1e-9) return false;
    return true;
  }, [wallet, rates, ratePLN, amount, mode, plnBalance, curBalance, plnValue]);

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

      const keys = Object.keys(r?.rates ?? {}).sort((a: string, b: string) => a.localeCompare(b));
      if (keys.length && (!r?.rates?.[currency] || currency === "PLN")) {
        setCurrency(keys[0]);
      }
    } catch (e: any) {
      Alert.alert("Błąd kursów", e?.message ?? "Nie udało się pobrać kursów");
    } finally {
      setLoadingRates(false);
    }
  }, [currency]);

  useEffect(() => {
    loadWallet();
    loadRatesLatest();
  }, [loadWallet, loadRatesLatest]);

  useFocusEffect(
    useCallback(() => {
      loadWallet();
    }, [loadWallet])
  );

  // Jeśli zmienisz walutę / tryb, a amountText było "100" (Twoje stare), zostawiamy,
  // ale ustawiamy sensownie domyślną kwotę w walucie.
  useEffect(() => {
    if (!amountText || parseAmount(amountText) <= 0) {
      setAmountText("10");
    }
  }, [currency, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!rates) return Alert.alert("Brak kursów", "Najpierw pobierz kursy.");
    if (!ratePLN) return Alert.alert("Brak kursu", `Brak kursu dla ${currency}.`);
    if (amount <= 0) return Alert.alert("Kwota", "Podaj kwotę większą od 0.");

    if (mode === "BUY") {
      const costPLN = plnValue ?? 0;
      if (costPLN > plnBalance + 1e-9) {
        return Alert.alert("Brak środków", `Koszt ok. ${formatMoney(costPLN)} PLN, a masz ${formatMoney(plnBalance)} PLN.`);
      }
    } else {
      if (amount > curBalance + 1e-9) {
        return Alert.alert("Brak środków", `Masz ${formatMoney(curBalance)} ${currency}.`);
      }
    }

    const approxPLN = plnValue != null ? formatMoney(plnValue) : "—";

    const msg =
      mode === "BUY"
        ? `Kupujesz ${currency} za PLN\n\nKupujesz: ${formatMoney(amount)} ${currency}\nSzacowany koszt: ${approxPLN} PLN\nKurs (orient.): 1 ${currency} = ${ratePLN} PLN\nData kursów: ${rates.date}\n\n*Finalny kurs i koszt wyliczy backend (buyRate).`
        : `Sprzedajesz ${currency} za PLN\n\nSprzedajesz: ${formatMoney(amount)} ${currency}\nSzacowany zysk: ${approxPLN} PLN\nKurs (orient.): 1 ${currency} = ${ratePLN} PLN\nData kursów: ${rates.date}\n\n*Finalny kurs i zysk wyliczy backend (sellRate).`;

    Alert.alert("Potwierdź", msg, [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Zatwierdź",
        onPress: async () => {
          try {
            setSubmitting(true);

            // ✅ backend oczekuje: { currency, amount } gdzie amount to ILOŚĆ WALUTY
            if (mode === "BUY") {
              await apiExchangeBuy(currency, amount);
            } else {
              await apiExchangeSell(currency, amount);
            }

            await loadWallet();
            Alert.alert("Gotowe", "Wymiana wykonana.");
            router.replace("/(app)/(tabs)/home");
          } catch (e: any) {
            Alert.alert("Błąd", e?.message ?? "Nie udało się wykonać wymiany");
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["bottom"]}>
      <AppHeader title="Exchange" subtitle="Kup / sprzedaj walutę" />

      <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 12 }}>
        <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
          <Card title="Tryb">
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setMode("BUY")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: mode === "BUY" ? "#111827" : "#fff",
                  borderWidth: 1,
                  borderColor: mode === "BUY" ? "#111827" : "#E5E7EB",
                }}
              >
                <Text style={{ fontWeight: "900", color: mode === "BUY" ? "#fff" : "#111827" }}>Kup</Text>
              </Pressable>

              <Pressable
                onPress={() => setMode("SELL")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: mode === "SELL" ? "#111827" : "#fff",
                  borderWidth: 1,
                  borderColor: mode === "SELL" ? "#111827" : "#E5E7EB",
                }}
              >
                <Text style={{ fontWeight: "900", color: mode === "SELL" ? "#fff" : "#111827" }}>Sprzedaj</Text>
              </Pressable>
            </View>

            <Text style={{ opacity: 0.65 }}>
              {mode === "BUY"
                ? "BUY: podajesz ilość waluty, którą chcesz kupić. System policzy koszt w PLN."
                : "SELL: podajesz ilość waluty, którą chcesz sprzedać. System policzy ile PLN dostaniesz."}
            </Text>
          </Card>

          <Card title="Twoje środki">
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text style={{ opacity: 0.7 }}>Saldo PLN</Text>
              <Text style={{ fontSize: 22, fontWeight: "900" }}>{wallet ? `${formatMoney(plnBalance)} PLN` : "—"}</Text>
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

            <Pressable onPress={loadWallet} disabled={loadingWallet} style={{ marginTop: 8, alignSelf: "flex-start" }}>
              <Text style={{ fontWeight: "900", opacity: loadingWallet ? 0.5 : 0.7 }}>
                {loadingWallet ? "Odświeżanie..." : "Odśwież portfel"}
              </Text>
            </Pressable>
          </Card>

          <Card title="Parametry">
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ opacity: 0.7 }}>Kursy (NBP)</Text>
              <Text style={{ fontWeight: "900" }}>{rates?.date ?? "—"}</Text>
            </View>

            <View style={{ gap: 8, marginTop: 8 }}>
              <Text style={{ fontSize: 12, opacity: 0.6, fontWeight: "800" }}>Waluta</Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {(currencyOptions.length ? currencyOptions : ["EUR", "USD", "GBP", "CHF"]).map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCurrency(c)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: currency === c ? "#111827" : "#E5E7EB",
                      backgroundColor: currency === c ? "#111827" : "#fff",
                    }}
                  >
                    <Text style={{ fontWeight: "900", color: currency === c ? "#fff" : "#111827" }}>{c}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={{ opacity: 0.65 }}>
                Dostępne: {formatMoney(plnBalance)} PLN • {formatMoney(curBalance)} {currency}
              </Text>

              <Text style={{ opacity: 0.7, fontWeight: "800" }}>
                Kwota ({currency}) {/* ✅ zawsze w walucie */}
              </Text>

              <TextInput
                value={amountText}
                onChangeText={setAmountText}
                placeholder={`np. 10 ${currency}`}
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: "#fff",
                  fontWeight: "900",
                }}
              />

              {mode === "SELL" && amount > 0 && amount > curBalance + 1e-9 && (
                <Text style={{ color: "#991B1B", fontWeight: "800" }}>
                  Za mało {currency}: masz {formatMoney(curBalance)} {currency}.
                </Text>
              )}

              {mode === "BUY" && plnValue != null && plnValue > plnBalance + 1e-9 && (
                <Text style={{ color: "#991B1B", fontWeight: "800" }}>
                  Za mało PLN: koszt ok. {formatMoney(plnValue)} PLN, a masz {formatMoney(plnBalance)} PLN.
                </Text>
              )}

              <Pressable onPress={loadRatesLatest} disabled={loadingRates} style={{ alignSelf: "flex-start" }}>
                <Text style={{ fontWeight: "900", opacity: loadingRates ? 0.5 : 0.7 }}>
                  {loadingRates ? "Ładowanie..." : "Pobierz najnowsze kursy"}
                </Text>
              </Pressable>
            </View>
          </Card>

          <Card title="Wycena (orientacyjnie)">
            {!rates ? (
              <Text style={{ opacity: 0.6 }}>Pobierz kursy, aby zobaczyć wycenę.</Text>
            ) : loadingRates ? (
              <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                <ActivityIndicator />
                <Text style={{ opacity: 0.7, fontWeight: "800" }}>Pobieram kursy…</Text>
              </View>
            ) : !ratePLN ? (
              <Text style={{ opacity: 0.6 }}>Brak kursu dla {currency}.</Text>
            ) : amount <= 0 ? (
              <Text style={{ opacity: 0.6 }}>Wpisz kwotę, aby policzyć wycenę.</Text>
            ) : (
              <>
                <Text style={{ fontWeight: "900" }}>Kurs: 1 {currency} = {ratePLN} PLN</Text>
                <View style={{ height: 1, backgroundColor: "#E5E7EB", marginTop: 8 }} />

                {mode === "BUY" ? (
                  <>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ opacity: 0.7 }}>Kupujesz</Text>
                      <Text style={{ fontWeight: "900" }}>{formatMoney(amount)} {currency}</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ opacity: 0.7 }}>Szacowany koszt</Text>
                      <Text style={{ fontWeight: "900" }}>{plnValue != null ? formatMoney(plnValue) : "—"} PLN</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ opacity: 0.7 }}>Sprzedajesz</Text>
                      <Text style={{ fontWeight: "900" }}>{formatMoney(amount)} {currency}</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ opacity: 0.7 }}>Szacowany zysk</Text>
                      <Text style={{ fontWeight: "900" }}>{plnValue != null ? formatMoney(plnValue) : "—"} PLN</Text>
                    </View>
                  </>
                )}

                <Text style={{ opacity: 0.6, marginTop: 6 }}>
                  Finalne wartości policzy backend (BUY: buyRate, SELL: sellRate).
                </Text>
              </>
            )}
          </Card>

          <Pressable
            onPress={submit}
            disabled={!canSubmit || submitting}
            style={{
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: "center",
              backgroundColor: !canSubmit ? "#E5E7EB" : "#111827",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            <Text style={{ fontWeight: "900", color: !canSubmit ? "#6B7280" : "#fff" }}>
              {submitting ? "Wykonywanie..." : mode === "BUY" ? "Kup" : "Sprzedaj"}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.replace("/(app)/(tabs)/home")} style={{ alignSelf: "center", marginTop: 6 }}>
            <Text style={{ fontWeight: "900", opacity: 0.6 }}>Wróć do Home</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
