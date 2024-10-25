// app/index.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>Tela Inicial</Text>
      <Link href="/pagina/mapscreen">
        <Text style={{ fontSize: 18, color: 'blue' }}>Ir para o Mapa</Text>
      </Link>
    </View>
  );
}
