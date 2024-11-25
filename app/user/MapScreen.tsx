// app/user/MapScreen.tsx

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Button,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import MapView, { MapPressEvent, Marker, Callout, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { db, storage } from '../config/firebaseConfig';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AuthContext } from '../context/AuthContext';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface Report {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  imageUrls: string[];
  status: string;
}

export default function MapScreen() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado para o marcador e descrição
  const [markerCoords, setMarkerCoords] = useState<LocationCoords | null>(null);
  const [description, setDescription] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Estados para as imagens
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);

  const [reports, setReports] = useState<Report[]>([]);

  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  // Estilo de mapa personalizado (ajuste conforme necessário)
  const customMapStyle = [
    {
      elementType: 'geometry',
      stylers: [{ visibility: 'on' }],
    },
    {
      elementType: 'labels',
      stylers: [{ visibility: 'on' }],
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

  // Função para selecionar imagens da galeria
  const pickImagesFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Desculpe, precisamos da permissão para acessar a galeria!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      allowsMultipleSelection: true, // Suporta seleção múltipla
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map((asset) => asset.uri);
      setImages((prevImages) => [...prevImages, ...selectedImages]);
    }
  };

  // Função para tirar foto com a câmera
  const takePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Desculpe, precisamos da permissão para acessar a câmera!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const photoUri = result.assets[0].uri;
      setImages((prevImages) => [...prevImages, photoUri]);
    }
  };

  // Função para lidar com o toque no mapa
  const handleMapPress = (event: MapPressEvent) => {
    console.log('Mapa clicado:', event.nativeEvent.coordinate); // Log para depuração
    const coords = event.nativeEvent.coordinate;
    setMarkerCoords(coords);
    setModalVisible(true); // Abrir o modal para inserir a descrição
  };

  // Função para enviar os dados
  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado. Por favor, faça login novamente.');
      return;
    }

    if (markerCoords && description) {
      setUploading(true);
      let imageUrls: string[] = [];
      try {
        if (images.length > 0) {
          for (let i = 0; i < images.length; i++) {
            const imgUri = images[i];
            const response = await fetch(imgUri);
            const blob = await response.blob();
            const filename = `${Date.now()}-${user.uid}-${i}`;
            const storageRef = ref(storage, `reports/${filename}`);
            await uploadBytes(storageRef, blob);

            // Obter a URL de download
            const imageUrl = await getDownloadURL(storageRef);
            imageUrls.push(imageUrl);
          }
        }

        // Preparar os dados da denúncia
        const reportData = {
          latitude: markerCoords.latitude,
          longitude: markerCoords.longitude,
          description: description,
          imageUrls: imageUrls,
          timestamp: new Date(),
          userId: user.uid,
          status: 'pendente', // Status inicial é 'pendente'
          verifiedBy: null,
          resolvedBy: null,
          timestampVerified: null,
          timestampResolved: null,
        };

        // Salvar no Firestore
        await addDoc(collection(db, 'reports'), reportData);

        Alert.alert('Sucesso', 'Sua denúncia foi enviada com sucesso!');

        // Fechar o modal e limpar os campos
        setModalVisible(false);
        setMarkerCoords(null);
        setDescription('');
        setImages([]);
      } catch (error: any) {
        console.error('Erro ao enviar a denúncia:', error.code, error.message, error);
        Alert.alert('Erro', 'Não foi possível enviar sua denúncia. Tente novamente.');
      } finally {
        setUploading(false);
      }
    } else {
      Alert.alert('Erro', 'Por favor, selecione um local e insira uma descrição.');
    }
  };

  // Função para voltar à tela anterior
  const handleBack = () => {
    navigation.goBack();
  };

  // Função para calcular a distância entre dois pontos
  function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (lat1 * Math.PI) / 180; // φ, λ em radianos
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // Distância em metros
    return d;
  }

  // Estado para armazenar os IDs das denúncias já notificadas
  const [notifiedReports, setNotifiedReports] = useState<Set<string>>(new Set());

  // Obter as denúncias (apenas 'pendente' e 'verificada')
  useEffect(() => {
    const fetchReports = () => {
      const q = query(
        collection(db, 'reports'),
        where('status', 'in', ['pendente', 'verificada'])
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reportsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          latitude: doc.data().latitude,
          longitude: doc.data().longitude,
          description: doc.data().description,
          imageUrls: doc.data().imageUrls || [],
          status: doc.data().status,
        })) as Report[];

        setReports(reportsData);
      });

      return () => unsubscribe();
    };

    fetchReports();
  }, []);

  // Alertar o usuário se estiver próximo a uma denúncia verificada
  useEffect(() => {
    if (location && reports.length > 0) {
      reports.forEach((report) => {
        if (!notifiedReports.has(report.id) && report.status === 'verificada') {
          const distance = getDistanceFromLatLonInMeters(
            location.latitude,
            location.longitude,
            report.latitude,
            report.longitude
          );

          if (distance <= 300) {
            // Alertar o usuário
            Alert.alert(
              'Alerta de Foco Próximo',
              'Há uma denúncia verificada de foco de dengue a menos de 300 metros de você.'
            );

            // Adicionar o ID da denúncia ao conjunto de notificações
            setNotifiedReports((prev) => new Set(prev).add(report.id));
          }
        }
      });
    }
  }, [location, reports]);

  if (!location) {
    return (
      <View style={styles.container}>
        <Text>Obtendo localização...</Text>
        {errorMsg ? <Text>{errorMsg}</Text> : null}
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Carregando informações do usuário...</Text>
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
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.00922,
          longitudeDelta: 0.00421,
        }}
        showsUserLocation={true}
        onPress={handleMapPress}
        customMapStyle={customMapStyle} // Aplicando o estilo personalizado (ajuste conforme necessário)
      >
        {/* Exibir as denúncias */}
        {reports.map((report) => (
          <React.Fragment key={report.id}>
            <Marker
              coordinate={{ latitude: report.latitude, longitude: report.longitude }}
              title="Foco de Dengue"
              description={report.description}
              pinColor={
                report.status === 'pendente'
                  ? 'orange'
                  : report.status === 'verificada'
                  ? 'red'
                  : 'gray'
              }
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.description}>{report.description}</Text>
                  {report.imageUrls && report.imageUrls.length > 0 ? (
                    <ScrollView horizontal>
                      {report.imageUrls.map((imgUrl, index) => (
                        <Image
                          key={index}
                          source={{ uri: imgUrl }}
                          style={{ width: 100, height: 100, margin: 5 }}
                        />
                      ))}
                    </ScrollView>
                  ) : (
                    <Text>Sem imagens</Text>
                  )}
                </View>
              </Callout>
            </Marker>

            {/* Exibir um círculo vermelho ao redor das denúncias verificadas */}
            {report.status === 'verificada' && (
              <Circle
                center={{ latitude: report.latitude, longitude: report.longitude }}
                radius={300} // Raio em metros (ajuste conforme necessário)
                strokeColor="rgba(255, 0, 0, 0.5)" // Cor da borda do círculo (vermelho)
                fillColor="rgba(255, 0, 0, 0.2)" // Cor de preenchimento do círculo (vermelho)
                zIndex={-1}
              />
            )}
          </React.Fragment>
        ))}

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
            <Button title="Tirar Foto" onPress={takePhotoWithCamera} />
            <Button title="Selecionar da Galeria" onPress={pickImagesFromLibrary} />
            {images.length > 0 && (
              <ScrollView horizontal>
                {images.map((imgUri, index) => (
                  <Image
                    key={index}
                    source={{ uri: imgUri }}
                    style={{ width: 100, height: 100, margin: 5 }}
                  />
                ))}
              </ScrollView>
            )}
            {uploading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : (
              <Button title="Enviar" onPress={handleSubmit} />
            )}
            <Button
              title="Cancelar"
              onPress={() => {
                setModalVisible(false);
                setMarkerCoords(null);
                setDescription('');
                setImages([]);
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
    height: 80,
    borderColor: 'gray',
    borderWidth: 1,
    marginVertical: 10,
    paddingHorizontal: 10,
    textAlignVertical: 'top',
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
  // Estilos para o callout
  callout: {
    width: 250,
    padding: 5,
  },
  description: {
    fontSize: 16,
    marginBottom: 5,
  },
});
