// app/user/MapScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Button, Alert } from 'react-native';
import MapView, { MapPressEvent, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { db } from '../config/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function MapScreen() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado para o marcador e descrição
  const [markerCoords, setMarkerCoords] = useState<LocationCoords | null>(null);
  const [description, setDescription] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);

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
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permissão para acessar a localização foi negada');
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      } catch (error) {
        console.error('Erro ao obter a localização:', error);
        setErrorMsg('Não foi possível obter a localização');
      }
    })();
  }, []);

  if (!location) {
    return (
      <View style={styles.container}>
        <Text>Obtendo localização...</Text>
        {errorMsg ? <Text>{errorMsg}</Text> : null}
      </View>
    );
  }

  // Função para lidar com o toque no mapa
  const handleMapPress = (event: MapPressEvent) => {
    const coords = event.nativeEvent.coordinate;
    setMarkerCoords(coords);
    setModalVisible(true); // Abrir o modal para inserir a descrição
  };

  // Função para enviar os dados
  const handleSubmit = async () => {
    if (markerCoords && description) {
      try {
        // Salvar no Firestore
        await addDoc(collection(db, 'reports'), {
          latitude: markerCoords.latitude,
          longitude: markerCoords.longitude,
          description: description,
          timestamp: new Date(),
        });

        Alert.alert('Sucesso', 'Sua denúncia foi enviada com sucesso!');

        // Fechar o modal e limpar os campos
        setModalVisible(false);
        setMarkerCoords(null);
        setDescription('');

        // Navegar de volta para a tela inicial
        navigation.goBack();
      } catch (error) {
        console.error('Erro ao enviar a denúncia:', error);
        Alert.alert('Erro', 'Não foi possível enviar sua denúncia. Tente novamente.');
      }
    } else {
      Alert.alert('Erro', 'Por favor, selecione um local e insira uma descrição.');
    }
  };

  // Função para voltar à tela anterior
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Botão de voltar */}
      <View style={styles.backButtonContainer}>
        <Ionicons name="arrow-back" size={32} onPress={handleBack} />
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.00922,
          longitudeDelta: 0.00421,
        }}
        showsUserLocation={true}
        onPress={handleMapPress}
        customMapStyle={customMapStyle} // Aplicando o estilo personalizado
      >
        {markerCoords && (
          <Marker
            coordinate={markerCoords}
            title="Local Selecionado"
            description={description}
          />
        )}
      </MapView>

      {/* Modal para inserir a descrição */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Insira uma descrição para o local:</Text>
            <TextInput
              style={styles.input}
              placeholder="Descrição"
              value={description}
              onChangeText={setDescription}
            />
            <Button title="Enviar" onPress={handleSubmit} />
            <Button
              title="Cancelar"
              onPress={() => {
                setModalVisible(false);
                setMarkerCoords(null);
                setDescription('');
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  // Estilos para o modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Fundo semi-transparente
  },
  modalContent: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 35,
    elevation: 5,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginVertical: 10,
    paddingHorizontal: 10,
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
