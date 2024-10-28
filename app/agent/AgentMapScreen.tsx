// app/agent/AgentMapScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { db } from '../config/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import * as Location from 'expo-location';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AgentMapScreen() {
  const [reports, setReports] = useState<
    { id: string; latitude: number; longitude: number; description: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigation = useNavigation();

  // Estilo de mapa personalizado para ocultar todos os elementos
  const customMapStyle = [
    {
      elementType: 'geometry',
      stylers: [{ visibility: 'off' }],
    },
    {
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ];

  useEffect(() => {
    const fetchReports = () => {
      const unsubscribe = onSnapshot(collection(db, 'reports'), (snapshot) => {
        const reportsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          latitude: doc.data().latitude,
          longitude: doc.data().longitude,
          description: doc.data().description,
        }));
        setReports(reportsData);

        // Centralizar o mapa nos relatórios ou na localização do agente
        if (reportsData.length > 0) {
          const latitudes = reportsData.map((report) => report.latitude);
          const longitudes = reportsData.map((report) => report.longitude);

          const minLat = Math.min(...latitudes);
          const maxLat = Math.max(...latitudes);
          const minLng = Math.min(...longitudes);
          const maxLng = Math.max(...longitudes);

          const midLat = (minLat + maxLat) / 2;
          const midLng = (minLng + maxLng) / 2;

          const deltaLat = (maxLat - minLat) + 0.02;
          const deltaLng = (maxLng - minLng) + 0.02;

          setMapRegion({
            latitude: midLat,
            longitude: midLng,
            latitudeDelta: deltaLat,
            longitudeDelta: deltaLng,
          });
          setLoading(false);
        } else {
          // Se não houver relatórios, obter a localização do agente
          getAgentLocation();
        }
      });

      return () => unsubscribe();
    };

    const getAgentLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permissão para acessar a localização foi negada');
          setLoading(false);
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({});
        setMapRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        setLoading(false);
      } catch (error) {
        console.error('Erro ao obter a localização do agente:', error);
        setErrorMsg('Não foi possível obter a localização');
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Função para voltar à tela anterior
  const handleBack = () => {
    navigation.goBack();
  };

  if (loading || !mapRegion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Carregando mapa...</Text>
        {errorMsg ? <Text>{errorMsg}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Botão de voltar */}
      <View style={styles.backButtonContainer}>
        <Ionicons name="arrow-back" size={32} onPress={handleBack} />
      </View>

      <MapView
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation={true}
        customMapStyle={customMapStyle} // Aplicando o estilo personalizado
      >
        {reports.map((report) => (
          <Marker
            key={report.id}
            coordinate={{ latitude: report.latitude, longitude: report.longitude }}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.description}>{report.description}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Seus estilos
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  callout: {
    width: 200,
  },
  description: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Estilo para o botão de voltar
  backButtonContainer: {
    position: 'absolute',
    top: 40,
    left: 10,
    zIndex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
  },
});
