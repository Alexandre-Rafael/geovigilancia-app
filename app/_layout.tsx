// app/_layout.tsx

import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from './context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/loginScreen" options={{ headerShown: false }} />
        <Stack.Screen name="auth/registerScreen" options={{ headerShown: false }} />
        <Stack.Screen name="user/UserHome" options={{ headerShown: false }} />
        <Stack.Screen name="user/MapScreen" options={{ headerShown: false }} />
        <Stack.Screen name="agent/AgentHome" options={{ headerShown: false }} />
        <Stack.Screen name="agent/AgentMapScreen" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
