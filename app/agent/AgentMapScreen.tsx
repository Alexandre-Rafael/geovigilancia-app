// app/agent/AgentMapScreen.tsx

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Button,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import MapView, { Marker, Callout, Region, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { db } from '../config/firebaseConfig';
import {
  collection,
  query,
  onSnapshot,
  updateDoc,
  doc,
  DocumentData,
} from 'firebase/firestore';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

interface Report {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  imageUrls: string[];
  status: string;
  // Outros campos...
}

export default function AgentMapScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const { user: agent } = useContext(AuthContext);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [comment, setComment] = useState('');
  const [region, setRegion] = useState<Region | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigation = useNavigation();

  // Obter a localização atual do agente
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permissão para acessar a localização foi negada');
          setLoadingLocation(false);
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (error) {
        console.error('Erro ao obter a localização:', error);
        setErrorMsg('Não foi possível obter a localização');
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  // Obter as denúncias do Firestore
  useEffect(() => {
    const fetchReports = () => {
      // Buscar todas as denúncias
      const q = query(collection(db, 'reports'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const reportsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as DocumentData),
          })) as Report[];

          setReports(reportsData);
          setLoadingReports(false);
        },
        (error) => {
          console.error('Erro ao obter as denúncias:', error);
          Alert.alert('Erro', 'Não foi possível carregar as denúncias.');
          setLoadingReports(false);
        }
      );

      return () => unsubscribe();
    };

    fetchReports();
  }, []);

  const handleVerify = async () => {
    if (!selectedReport) return;
    try {
      const reportRef = doc(db, 'reports', selectedReport.id);
      await updateDoc(reportRef, {
        status: 'verificada',
        verifiedBy: agent?.uid,
        timestampVerified: new Date(),
        agentComment: comment,
      });
      Alert.alert('Sucesso', 'Denúncia verificada com sucesso.');
      setModalVisible(false);
      setSelectedReport(null);
      setComment('');
    } catch (error) {
      console.error('Erro ao verificar a denúncia:', error);
      Alert.alert('Erro', 'Não foi possível verificar a denúncia.');
    }
  };

  const handleResolve = async () => {
    if (!selectedReport) return;
    try {
      const reportRef = doc(db, 'reports', selectedReport.id);
      await updateDoc(reportRef, {
        status: 'resolvida',
        resolvedBy: agent?.uid,
        timestampResolved: new Date(),
        agentComment: comment,
      });
      Alert.alert('Sucesso', 'Denúncia resolvida com sucesso.');
      setModalVisible(false);
      setSelectedReport(null);
      setComment('');
    } catch (error) {
      console.error('Erro ao resolver a denúncia:', error);
      Alert.alert('Erro', 'Não foi possível resolver a denúncia.');
    }
  };

  // Função para voltar à tela anterior
  const handleBack = () => {
    navigation.goBack();
  };

  // Função para abrir o modal ao clicar no marcador
  const handleMarkerPress = (report: Report) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  if (loadingReports || loadingLocation || !region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Carregando denúncias e localização...</Text>
        {errorMsg ? <Text>{errorMsg}</Text> : null}
      </View>
    );
  }

  if (!agent) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando informações do agente...</Text>
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
        region={region}
        showsUserLocation={true}
        onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
      >
        {reports.map((report) => (
          <React.Fragment key={report.id}>
            <Marker
              coordinate={{ latitude: report.latitude, longitude: report.longitude }}
              pinColor={
                report.status === 'pendente'
                  ? 'orange'
                  : report.status === 'verificada'
                  ? 'red'
                  : report.status === 'resolvida'
                  ? 'gray' // Denúncias resolvidas em cinza
                  : 'blue' // Caso tenha outros status
              }
              onPress={() => handleMarkerPress(report)}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.description}>{report.description}</Text>
                </View>
              </Callout>
            </Marker>

            {/* Exibir um círculo ao redor das denúncias verificadas */}
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
      </MapView>

      {/* Modal para verificar ou resolver a denúncia */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedReport(null);
          setComment('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedReport && (
              <>
                <Text style={styles.modalTitle}>Denúncia</Text>
                <Text style={styles.description}>{selectedReport.description}</Text>
                {/* Exibir imagens da denúncia, se houver */}
                {selectedReport.imageUrls && selectedReport.imageUrls.length > 0 && (
                  <ScrollView horizontal>
                    {selectedReport.imageUrls.map((url, index) => (
                      <Image
                        key={index}
                        source={{ uri: url }}
                        style={{ width: 100, height: 100, margin: 5 }}
                      />
                    ))}
                  </ScrollView>
                )}
                <TextInput
                  style={styles.input}
                  placeholder="Adicione um comentário (opcional)"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                />
                <View style={styles.buttonContainer}>
                  {selectedReport.status === 'pendente' && (
                    <Button title="Verificar" onPress={handleVerify} />
                  )}
                  {selectedReport.status === 'verificada' && (
                    <Button title="Resolver" onPress={handleResolve} />
                  )}
                </View>
                <Button
                  title="Cancelar"
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedReport(null);
                    setComment('');
                  }}
                />
              </>
            )}
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
  callout: {
    width: 150,
  },
  description: {
    fontSize: 16,
    marginBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    height: 80,
    borderColor: 'gray',
    borderWidth: 1,
    marginVertical: 10,
    paddingHorizontal: 10,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginVertical: 10,
  },
});
