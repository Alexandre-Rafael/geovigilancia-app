// app/user/UserHome.tsx

import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function UserHome() {
  const router = useRouter();

  const goToMap = () => {
    router.push('/user/MapScreen'); // Certifique-se de que 'M' e 'S' estão em maiúsculas
  };

  return (
    <View style={styles.container}>
      <Text>Bem-vindo, Usuário!</Text>
      <Button title="Abrir Mapa" onPress={goToMap} />
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
