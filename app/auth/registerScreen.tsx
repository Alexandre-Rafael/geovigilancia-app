// app/auth/registerScreen.tsx

import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebaseConfig';
import { setDoc, doc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Valor padrão para o role
  const [role, setRole] = useState('user');
  const router = useRouter();

  const handleRegister = async () => {
    try {
      if (email.trim() === '' || password.trim() === '') {
        Alert.alert('Erro', 'Por favor, insira um e-mail e senha válidos.');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Salvar o role no Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: role,
      });

      console.log('Usuário registrado:', user);

      // Navegar para a tela apropriada
      if (role === 'user') {
        router.replace('/user/UserHome');
      } else if (role === 'agent') {
        router.replace('/agent/AgentHome');
      }
    } catch (error: any) {
      console.error('Erro no registro:', error);

      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Erro no registro', 'Este e-mail já está em uso. Por favor, use outro e-mail.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Erro no registro', 'E-mail inválido. Por favor, insira um e-mail válido.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Erro no registro', 'A senha deve ter no mínimo 6 caracteres.');
      } else {
        Alert.alert('Erro no registro', error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
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

      {/* Seleção de perfil */}
      <Text style={styles.label}>Selecione seu perfil:</Text>
      <View style={styles.roleContainer}>
        <Button
          title="Usuário Comum"
          onPress={() => setRole('user')}
          color={role === 'user' ? 'blue' : 'gray'}
        />
        <Button
          title="Agente"
          onPress={() => setRole('agent')}
          color={role === 'agent' ? 'blue' : 'gray'}
        />
      </View>

      <Button title="Registrar" onPress={handleRegister} />
      <Button
        title="Já tem uma conta? Faça login"
        onPress={() => router.push('/auth/loginScreen')}
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
  label: {
    marginBottom: 8,
    textAlign: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
});
