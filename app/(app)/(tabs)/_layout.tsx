import { Tabs } from "expo-router";
import React from "react";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="deposit" options={{ title: "Zasil konto" }} />
      <Tabs.Screen name="history" options={{ title: "Historia" }} />
      <Tabs.Screen name="rates" options={{ title: "Kursy" }} />
    </Tabs>
  );
}
