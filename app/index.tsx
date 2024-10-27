// app/index.tsx

import React, { useEffect, useContext } from 'react';
import { useRouter } from 'expo-router';
import { AuthContext } from './context/AuthContext';
import { getDoc, doc } from 'firebase/firestore';
import { db } from './config/firebaseConfig';

export default function Index() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

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
      } else {
        router.replace('/auth/loginScreen');
      }
    };

    checkUser();
  }, [user]);

  return null;
}
