// app/auth/loginScreen.tsx

import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      if (email.trim() === '' || password.trim() === '') {
        Alert.alert('Erro', 'Por favor, insira o e-mail e a senha.');
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Obter o role do usuário
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const role = userData.role;

        if (role === 'user') {
          router.replace('/user/UserHome');
        } else if (role === 'agent') {
          router.replace('/agent/AgentHome');
        } else {
          Alert.alert('Erro', 'Role inválido.');
        }
      } else {
        console.log('Nenhum documento de usuário encontrado!');
        Alert.alert('Erro', 'Usuário não encontrado.');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);

      if (error.code === 'auth/invalid-email') {
        Alert.alert('Erro no login', 'E-mail inválido. Por favor, verifique o e-mail inserido.');
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert('Erro no login', 'Usuário não encontrado. Verifique suas credenciais.');
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert('Erro no login', 'Senha incorreta. Tente novamente.');
      } else {
        Alert.alert('Erro no login', error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Entrar" onPress={handleLogin} />
      <Button
        title="Não tem uma conta? Registre-se"
        onPress={() => router.push('/auth/registerScreen')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // ... seus estilos
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
});
