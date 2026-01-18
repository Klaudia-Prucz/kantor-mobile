import { useRouter } from "expo-router";
import React, { useState } from "react";
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

export default function Index() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const title = mode === "login" ? "Zaloguj się" : "Utwórz konto";
  const subtitle =
    mode === "login"
      ? "Zaloguj się, aby przejść do panelu kantoru."
      : "Zarejestruj się, a następnie zaloguj do panelu.";

  const submit = async () => {
    try {
      const e = email.trim().toLowerCase();
      if (!e || !password) {
        Alert.alert("Uzupełnij dane", "Wpisz email i hasło.");
        return;
      }

      setBusy(true);

      if (mode === "register") {
        await apiRegister(e, password);
      }

      await apiLogin(e, password);
      router.replace("/(app)/home");
    } catch (err: any) {
      Alert.alert("Błąd", err?.message ?? "Coś poszło nie tak");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
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
              </View>

              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", opacity: 0.8 }}>Hasło</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Twoje hasło"
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
                {mode === "register" && (
                  <Text style={{ fontSize: 12, opacity: 0.6 }}>
                    Minimum 6 znaków
                  </Text>
                )}
              </View>

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
                  {busy ? "Proszę czekać..." : mode === "login" ? "Zaloguj" : "Zarejestruj i zaloguj"}
                </Text>
              </Pressable>

              {/* Toggle below form */}
              <Pressable
                onPress={() => setMode(mode === "login" ? "register" : "login")}
                style={{ paddingVertical: 10, alignItems: "center" }}
              >
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

            <Text style={{ textAlign: "center", opacity: 0.4, fontSize: 12 }}>
              © 2026 Kantor mobilny
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
