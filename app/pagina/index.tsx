// app/pagina/index.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function PaginaIndex() {
  return (
    <View>
      <Text>Página Inicial da Seção Pagina</Text>
      <Link href="/pagina/mapscreen">
        <Text>Ir para o Mapa</Text>
      </Link>
    </View>
  );
}
