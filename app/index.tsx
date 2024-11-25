// app/index.tsx

import React, { useEffect, useContext } from 'react';
import { useRouter } from 'expo-router';
import { AuthContext } from './context/AuthContext';
import { getDoc, doc } from 'firebase/firestore';
import { db } from './config/firebaseConfig';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    const checkUser = async () => {
      if (user) {
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
            router.replace('/auth/loginScreen');
          }
        } else {
          console.log('Nenhum documento de usuário encontrado!');
          router.replace('/auth/loginScreen');
        }
      } else if (!loading) {
        // Se não estiver carregando e não houver usuário, redirecionar para login
        router.replace('/auth/loginScreen');
      }
      // Se estiver carregando, não faça nada
    };

    checkUser();
  }, [user, loading]);

  if (loading) {
    // Exibir indicador de carregamento enquanto verifica o estado de autenticação
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Evitar retornar null para não ter uma tela em branco
  return null;
}
