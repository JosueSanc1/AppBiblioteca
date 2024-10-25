import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Modal, TextInput, Button, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getDatabase } from '../database/Database';
import { Picker } from '@react-native-picker/picker';
import { openDatabase } from 'react-native-sqlite-storage';

let db = openDatabase({ name: 'SistemaLibreria.db' });
const Tab = createBottomTabNavigator();

// Multas Pendientes - Todas las multas de los usuarios
const PendingFinesScreen = () => {
  const [fines, setFines] = useState([]);
  const [filteredFines, setFilteredFines] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedFine, setSelectedFine] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('01');
  const [expiryYear, setExpiryYear] = useState('2024');
  const [cvv, setCvv] = useState('');
  const [showCardForm, setShowCardForm] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  
       // useEffect

  useEffect(() => {
    verDatosGuardados();
    fetchFines();
  }, []);

  const fetchFines = () => {
    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `SELECT M.*, U.nombre, P.fechaPrestamo, L.titulo 
         FROM Multas M 
         JOIN Prestamos P ON M.idPrestamo = P.idPrestamo
         JOIN Usuarios U ON P.idUsuario = U.idUsuario
         JOIN Libros L ON P.idLibro = L.idLibro
         WHERE M.estadoMulta = 'Pendiente';`,
        [],
        (tx, results) => {
          let fetchedFines = [];
          for (let i = 0; i < results.rows.length; i++) {
            fetchedFines.push(results.rows.item(i));
          }
          setFines(fetchedFines);
          setFilteredFines(fetchedFines); // Inicialmente, todos los datos en la lista filtrada
        },
        error => {
          console.log('Error al obtener multas: ', error);
        }
      );
    });
  };

  const verDatosGuardados = () => {
    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Pagos`,
        [],
        (tx, results) => {
          const rows = results.rows;
          let data = [];

          for (let i = 0; i < rows.length; i++) {
            data.push(rows.item(i));
          }

          console.log("Datos guardados en ReporteDesechos:", data);
        },
        (tx, error) => {
          console.log("Error al consultar la tabla ReporteDesechos:", error);
        }
      );
    });
  };

  // Función para filtrar las multas por búsqueda
  const searchFines = (text) => {
    setSearchText(text);
    const filtered = fines.filter(fine =>
      fine.nombre.toLowerCase().includes(text.toLowerCase()) ||
      fine.titulo.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredFines(filtered);
  };

  const validateCardDetails = () => {
    if (cardNumber.length !== 16) {
      Alert.alert('Error', 'El número de tarjeta debe tener 16 dígitos.');
      return false;
    }
    const expiry = new Date(`${expiryYear}-${expiryMonth}-01`);
    const currentDate = new Date();
    if (expiry <= currentDate) {
      Alert.alert('Error', 'La tarjeta está vencida.');
      return false;
    }
    if (cvv.length !== 3) {
      Alert.alert('Error', 'El código de seguridad (CVV) debe tener 3 dígitos.');
      return false;
    }
    return true;
  };

  const handlePayFine = () => {
    if (!selectedFine) {
      Alert.alert('Error', 'Por favor, selecciona una multa para pagar.');
      return;
    }

    if (paymentMethod === 'Tarjeta' && !validateCardDetails()) {
      return;
    }

    const db = getDatabase();
    const fechaPago = new Date().toISOString().split('T')[0];

    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO Pagos ( monto, metodoPago, fechaPago, numeroTarjeta) 
         VALUES (?, ?, ?, ?);`,
        [selectedFine.monto, paymentMethod, fechaPago, paymentMethod === 'Tarjeta' ? cardNumber : null],
        (tx, results) => {
          if (results.rowsAffected > 0) {
            tx.executeSql(
              `UPDATE Multas SET estadoMulta = 'Pagada' WHERE idMulta = ?;`,
              [selectedFine.idMulta],
              (tx, results) => {
                if (results.rowsAffected > 0) {
                  Alert.alert('Éxito', 'Pago realizado correctamente');
                  fetchFines(); // Actualizar la lista de multas pendientes
                  resetForm();
                }
              }
            );
          }
        },
        error => {
          console.log('Error al procesar el pago: ', error);
        }
      );
    });
  };

  const resetForm = () => {
    setPaymentMethod(null);
    setCardNumber('');
    setExpiryMonth('01');
    setExpiryYear('2024');
    setCvv('');
    setShowCardForm(false);
    setIsModalVisible(false);
  };

  const renderFineItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.fineItem, selectedFine && selectedFine.idMulta === item.idMulta ? styles.selectedFine : null]}
      onPress={() => setSelectedFine(item)}
    >
      <Text style={styles.fineTitle}>{item.nombre} - {item.titulo}</Text>
      <Text style={styles.fineDetail}>Monto: Q{item.monto.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Multas Pendientes</Text>

      {/* Barra de búsqueda */}
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nombre o título"
        value={searchText}
        onChangeText={searchFines}
      />

      <FlatList
        data={filteredFines}
        keyExtractor={(item) => item.idMulta.toString()}
        renderItem={renderFineItem}
        style={styles.fineList}
      />

      {/* Botón para pagar multa */}
      <TouchableOpacity
        style={styles.payButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.payButtonText}>Pagar Multa</Text>
      </TouchableOpacity>

      {/* Modal para seleccionar método de pago */}
      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Método de Pago</Text>

            <TouchableOpacity
              style={styles.paymentButton}
              onPress={() => {
                setPaymentMethod('Efectivo');
                handlePayFine();
              }}
            >
              <Text style={styles.paymentButtonText}>Efectivo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.paymentButton}
              onPress={() => {
                setPaymentMethod('Tarjeta');
                setShowCardForm(true);
              }}
            >
              <Text style={styles.paymentButtonText}>Tarjeta</Text>
            </TouchableOpacity>

            {showCardForm && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Número de Tarjeta"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="numeric"
                  maxLength={16}
                />

                <View style={styles.pickerRow}>
                  <Picker
                    selectedValue={expiryMonth}
                    style={styles.picker}
                    onValueChange={(itemValue) => setExpiryMonth(itemValue)}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <Picker.Item key={i} label={`0${i + 1}`.slice(-2)} value={`0${i + 1}`.slice(-2)} />
                    ))}
                  </Picker>

                  <Picker
                    selectedValue={expiryYear}
                    style={styles.picker}
                    onValueChange={(itemValue) => setExpiryYear(itemValue)}
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <Picker.Item key={i} label={(new Date().getFullYear() + i).toString()} value={(new Date().getFullYear() + i).toString()} />
                    ))}
                  </Picker>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="CVV"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="numeric"
                  maxLength={3}
                />

                <Button title="Confirmar Pago" onPress={handlePayFine} />
              </>
            )}

            <Button title="Cancelar" color="red" onPress={resetForm} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Historial de Pagos - Todos los pagos realizados
const PaymentHistoryScreen = () => {

  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = () => {
    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Pagos`,
        [],
        (tx, results) => {
          let fetchedPayments = [];
          for (let i = 0; i < results.rows.length; i++) {
            fetchedPayments.push(results.rows.item(i));
          }
          setPayments(fetchedPayments);
        },
        error => {
          console.log('Error al obtener historial de pagos: ', error);
        }
      );
    });
  };

  const renderPaymentItem = ({ item }) => (
    <View style={styles.paymentItem}>
      <Text style={styles.paymentTitle}>Encargado{item.nombre}</Text>
      <Text style={styles.paymentDetail}>Monto: Q{item.monto.toFixed(2)}</Text>
      <Text style={styles.paymentDetail}>Método: {item.metodoPago}</Text>
      <Text style={styles.paymentDetail}>Fecha: {item.fechaPago}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de Pagos</Text>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.idPago.toString()}
        renderItem={renderPaymentItem}
        style={styles.paymentList}
      />
    </View>
  );
};

// Navegación entre Multas Pendientes y Historial de Pagos

const FinesManagement = ({route}) => {
  const { userId } = route.params;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let iconName;

          if (route.name === 'Multas Pendientes') {
            iconName = focused
              ? require('../src/image/multa.png')  // Imagen para el estado activo
              : require('../src/image/multa.png');  // Imagen para el estado inactivo
          } else if (route.name === 'Historial de Pagos') {
            iconName = focused
              ? require('../src/image/metodo-de-pago.png')  // Imagen para el estado activo
              : require('../src/image/metodo-de-pago.png');  // Imagen para el estado inactivo
          }

          return (
            <Image
              source={iconName}
              style={{ width: 25, height: 25 }}  // Tamaño de la imagen
            />
          );
        },
        tabBarActiveTintColor: 'tomato', // Color cuando el tab está activo
        tabBarInactiveTintColor: 'gray', // Color cuando el tab no está activo
      })}
    >
      <Tab.Screen name="Multas Pendientes" component={PendingFinesScreen} initialParams={{ userId }} />
      <Tab.Screen name="Historial de Pagos" component={PaymentHistoryScreen} initialParams={{ userId }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#0d47a1',
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  fineList: {
    flexGrow: 0,
    marginBottom: 15,
  },
  fineItem: {
    padding: 15,
    backgroundColor: '#ffffff',
    marginVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  selectedFine: {
    backgroundColor: '#e3f2fd',
  },
  fineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0d47a1',
    marginBottom: 10,
  },
  fineDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  paymentItem: {
    padding: 15,
    backgroundColor: '#ffffff',
    marginVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0d47a1',
    marginBottom: 10,
  },
  paymentDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  payButton: {
    backgroundColor: '#0d47a1',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#0d47a1',
  },
  paymentButton: {
    backgroundColor: '#0d47a1',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  picker: {
    flex: 1,
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
  },
});

export default FinesManagement;
