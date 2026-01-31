import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiLogin, apiRegister } from "../src/api";

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export default function Index() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const title = mode === "login" ? "Zaloguj się" : "Utwórz konto";
  const subtitle =
    mode === "login"
      ? "Zaloguj się, aby przejść do panelu kantoru."
      : "Zarejestruj się, a następnie zaloguj do panelu.";

  const canSubmit = useMemo(() => {
    const e = email.trim().toLowerCase();
    if (!isValidEmail(e)) return false;
    if (password.length < 6) return false;
    if (mode === "register") {
      if (firstName.trim().length < 2) return false;
      if (lastName.trim().length < 2) return false;
    }
    return !busy;
  }, [email, password, mode, firstName, lastName, busy]);

  const submit = async () => {
    try {
      const e = email.trim().toLowerCase();

      if (!isValidEmail(e)) {
        return Alert.alert("Niepoprawny email", "Wpisz poprawny adres email.");
      }
      if (password.length < 6) {
        return Alert.alert("Hasło", "Hasło musi mieć co najmniej 6 znaków.");
      }

      if (mode === "register") {
        const fn = firstName.trim();
        const ln = lastName.trim();
        if (fn.length < 2 || ln.length < 2) {
          return Alert.alert("Dane", "Podaj imię i nazwisko (min. 2 znaki).");
        }
      }

      setBusy(true);

      if (mode === "register") {
        await apiRegister(e, password, firstName.trim(), lastName.trim());
      }

      await apiLogin(e, password);

      // ✅ poprawna ścieżka do home w tabs
      router.replace("/(app)/(tabs)/home");
    } catch (err: any) {
      Alert.alert("Błąd", err?.message ?? "Coś poszło nie tak");
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setPassword("");
    // opcjonalnie: czyścić imię/nazwisko gdy wracasz do login
    // setFirstName(""); setLastName("");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 22, gap: 14 }}>
            {/* Header */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 30, fontWeight: "900" }}>Kantor</Text>
              <Text style={{ opacity: 0.65, fontSize: 14 }}>{subtitle}</Text>
            </View>

            {/* Card */}
            <View
              style={{
                marginTop: 6,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 16,
                padding: 16,
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "900" }}>{title}</Text>

              {/* ✅ Imię i nazwisko tylko w register */}
              {mode === "register" && (
                <>
                  <View style={{ gap: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", opacity: 0.8 }}>Imię</Text>
                    <TextInput
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                      placeholder="np. Klaudia"
                      placeholderTextColor="#9CA3AF"
                      style={{
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        fontSize: 16,
                      }}
                    />
                  </View>

                  <View style={{ gap: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", opacity: 0.8 }}>Nazwisko</Text>
                    <TextInput
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                      placeholder="np. Nowak"
                      placeholderTextColor="#9CA3AF"
                      style={{
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        fontSize: 16,
                      }}
                    />
                  </View>
                </>
              )}

              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", opacity: 0.8 }}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="np. klaudia@test.pl"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    fontSize: 16,
                  }}
                />
                {email.length > 0 && !isValidEmail(email.trim().toLowerCase()) && (
                  <Text style={{ fontSize: 12, color: "#991B1B", fontWeight: "800" }}>Niepoprawny format email.</Text>
                )}
              </View>

              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", opacity: 0.8 }}>Hasło</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Minimum 6 znaków"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    fontSize: 16,
                  }}
                />
                <Text style={{ fontSize: 12, opacity: 0.6 }}>Minimum 6 znaków</Text>
              </View>

              <Pressable
                onPress={submit}
                disabled={!canSubmit}
                style={{
                  marginTop: 6,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: canSubmit ? "#111827" : "#E5E7EB",
                  backgroundColor: canSubmit ? "#111827" : "#E5E7EB",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <Text style={{ fontWeight: "900", color: canSubmit ? "#fff" : "#6B7280" }}>
                  {busy ? "Proszę czekać..." : mode === "login" ? "Zaloguj" : "Zarejestruj i zaloguj"}
                </Text>
              </Pressable>

              {/* Toggle below form */}
              <Pressable onPress={switchMode} style={{ paddingVertical: 10, alignItems: "center" }} disabled={busy}>
                {mode === "login" ? (
                  <Text style={{ opacity: 0.75 }}>
                    Nie masz konta? <Text style={{ fontWeight: "900" }}>Zarejestruj się</Text>
                  </Text>
                ) : (
                  <Text style={{ opacity: 0.75 }}>
                    Masz już konto? <Text style={{ fontWeight: "900" }}>Zaloguj się</Text>
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={{ flex: 1 }} />

            <Text style={{ textAlign: "center", opacity: 0.4, fontSize: 12 }}>© 2026 Kantor mobilny</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
