import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarIcon: ({ focused, size, color }) => {

          const iconSize = size ?? 22;

          let name: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "home") name = focused ? "home" : "home-outline";
          if (route.name === "deposit") name = focused ? "add-circle" : "add-circle-outline";
          if (route.name === "history") name = focused ? "time" : "time-outline";
          if (route.name === "rates") name = focused ? "swap-horizontal" : "swap-horizontal-outline";

          return <Ionicons name={name} size={iconSize} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="deposit" options={{ title: "Zasil konto" }} />
      <Tabs.Screen name="history" options={{ title: "Historia" }} />
      <Tabs.Screen name="rates" options={{ title: "Kursy" }} />
      <Tabs.Screen
  name="exchange"
  options={{
    title: "Exchange",
    href: null,  
  }}
/>

    </Tabs>
  );
}
