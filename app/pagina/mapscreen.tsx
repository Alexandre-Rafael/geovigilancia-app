// app/pagina/mapscreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Button } from 'react-native';
import MapView, { MapPressEvent, Marker } from 'react-native-maps';
import * as Location from 'expo-location';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function MapScreen() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Novo estado para o marcador e descrição
  const [markerCoords, setMarkerCoords] = useState<LocationCoords | null>(null);
  const [description, setDescription] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
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
  const handleSubmit = () => {
    if (markerCoords && description) {
      // Aqui você pode enviar os dados para um servidor ou armazená-los
      console.log('Coordenadas:', markerCoords);
      console.log('Descrição:', description);

      // Fechar o modal e limpar a descrição
      setModalVisible(false);
      setDescription('');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.00922,
          longitudeDelta: 0.00421,
        }}
        showsUserLocation={true}
        onPress={handleMapPress} // Adicionar o listener de toque no mapa
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
});
