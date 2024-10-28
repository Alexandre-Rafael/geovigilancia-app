// app/user/UserHome.tsx

import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

export default function UserHome() {
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
    router.push('/user/MapScreen');
  };

  return (
    <View style={styles.container}>
      <Text>Bem-vindo, Usuário!</Text>
      <Button title="Abrir Mapa" onPress={goToMap} />
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
