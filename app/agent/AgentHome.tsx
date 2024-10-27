// app/agent/AgentHome.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AgentHome() {
  return (
    <View style={styles.container}>
      <Text>Bem-vindo, Agente!</Text>
      {/* Adicione mais componentes conforme necessário */}
    </View>
  );
}

const styles = StyleSheet.create({
  // ... seus estilos
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
