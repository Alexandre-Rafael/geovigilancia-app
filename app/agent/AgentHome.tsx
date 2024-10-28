// app/agent/AgentHome.tsx

import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

export default function AgentHome() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/auth/loginScreen');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const goToMap = () => {
    router.push('/agent/AgentMapScreen');
  };

  return (
    <View style={styles.container}>
      <Text>Bem-vindo, Agente!</Text>
      <Button title="Ver Mapa" onPress={goToMap} />
      <Button title="Sair" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Seus estilos
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
