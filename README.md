
# Kantor Mobile

Aplikacja mobilna do obsługi kantoru walutowego (React Native + Expo).

## Funkcje
- Rejestracja i logowanie użytkownika
- Przeglądanie stanu konta i historii transakcji
- Zasilanie konta PLN
- Kupno i sprzedaż walut po kursach NBP
- Przeglądanie kursów walut
- Bezpieczne przechowywanie tokena użytkownika

## Wymagania
- Node.js (zalecana wersja 18+)
- Expo CLI (`npm install -g expo-cli`)
- Emulator Android/iOS lub Expo Go na telefonie

## Instalacja
1. Sklonuj repozytorium:
   ```bash
   git clone https://github.com/Klaudia-Prucz/kantor-mobile.git
   cd kantor-mobile
   ```
2. Zainstaluj zależności:
   ```bash
   npm install
   ```

## Uruchomienie
1. Wystartuj serwer Expo:
   ```bash
   npx expo start
   ```
2. Otwórz aplikację na emulatorze lub telefonie (Expo Go, kod QR).

## Backend
Aplikacja wymaga backendu REST API zgodnego z endpointami opisanymi w pliku `src/api.ts` (np. `/auth/login`, `/wallet/me`, `/exchange/buy`, ...).

## Konfiguracja
Adres backendu ustaw w pliku `src/config.ts`:
```ts
export const API_URL = "http://<adres-serwera>:3000";
```

## Kontakt
Autor: Klaudia Prucz
