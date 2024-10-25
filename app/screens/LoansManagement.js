import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Image, TouchableOpacity, Button, Alert, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native'; // Importar useFocusEffect
import { getDatabase } from '../database/Database';
import DateTimePicker from '@react-native-community/datetimepicker'; // Para seleccionar fechas

const Tab = createBottomTabNavigator();

// Pantalla para realizar un préstamo
const MakeLoanScreen = ({ route }) => {
  const { userId } = route.params;
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Se actualizan los libros disponibles cada vez que la pantalla está en foco
  useFocusEffect(
    React.useCallback(() => {
      fetchBooks();
    }, [])
  );

  // Función para obtener los libros disponibles
  const fetchBooks = () => {
    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Libros WHERE cantidad > 0;',
        [],
        (tx, results) => {
          let fetchedBooks = [];
          for (let i = 0; i < results.rows.length; i++) {
            fetchedBooks.push(results.rows.item(i));
          }
          setBooks(fetchedBooks);
          setFilteredBooks(fetchedBooks);
        },
        error => {
          console.log('Error al obtener libros: ', error);
        }
      );
    });
  };

  // Función para filtrar los libros por búsqueda
  const searchBooks = (text) => {
    setSearchText(text);
    const filtered = books.filter(book => book.titulo.toLowerCase().includes(text.toLowerCase()));
    setFilteredBooks(filtered);
  };

  // Función para registrar un préstamo
  const handleLoan = () => {
    if (!selectedBook) {
      Alert.alert('Error', 'Por favor, selecciona un libro.');
      return;
    }

    const db = getDatabase();
    const fechaPrestamo = new Date().toISOString().split('T')[0];
    const fechaDevolucionEsperada = selectedDate.toISOString().split('T')[0];

    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO Prestamos (idUsuario, idLibro, fechaPrestamo, fechaDevolucionEsperada, estadoPrestamo)
         VALUES (?, ?, ?, ?, 'Pendiente');`,
        [userId, selectedBook.idLibro, fechaPrestamo, fechaDevolucionEsperada],
        (tx, results) => {
          if (results.rowsAffected > 0) {
            // Actualizar la cantidad y disponibilidad de libros
            tx.executeSql(
              `UPDATE Libros SET cantidad = cantidad - 1, disponibilidad = CASE WHEN cantidad - 1 = 0 THEN 0 ELSE 1 END WHERE idLibro = ?;`,
              [selectedBook.idLibro],
              (tx, results) => {
                if (results.rowsAffected > 0) {
                  Alert.alert('Éxito', 'Préstamo registrado y cantidad de libros actualizada.');
                  fetchBooks();  // Aseguramos actualizar los libros en la vista
                  setSelectedBook(null);
                } else {
                  Alert.alert('Error', 'No se pudo actualizar la cantidad del libro.');
                }
              }
            );
          } else {
            Alert.alert('Error', 'No se pudo registrar el préstamo.');
          }
        },
        error => {
          console.log('Error al registrar préstamo: ', error);
        }
      );
    });
  };

  // Función para mostrar el datepicker
  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(false);
    setSelectedDate(currentDate);
  };

  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.bookItem, selectedBook && selectedBook.idLibro === item.idLibro ? styles.selectedBook : null]}
      onPress={() => setSelectedBook(item)}
    >
      <Image source={{ uri: `data:image/png;base64,${item.portada}` }} style={styles.bookImage} />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.titulo}</Text>
        <Text style={styles.bookQuantity}>Cantidad disponible: {item.cantidad}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Realizar Préstamo</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar libro por título"
        value={searchText}
        onChangeText={searchBooks}
      />

      <FlatList
        data={filteredBooks}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.idLibro.toString()}
        style={styles.bookList}
      />

      <TouchableOpacity onPress={showDatepicker} style={[styles.dateButton, { marginBottom: 20 }]}>
        <Text style={styles.dateText}>Seleccionar Fecha de Devolución</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      <Button title="Realizar Préstamo" onPress={handleLoan} style={{ marginTop: 20 }} />
    </View>
  );
};

// Pantalla para listar préstamos activos y registrar devoluciones
const LoanListScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [loans, setLoans] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchLoans();
    }, [])
  );

  const fetchLoans = () => {
    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `SELECT P.*, L.titulo, L.idLibro, P.fechaDevolucionEsperada
         FROM Prestamos P 
         JOIN Libros L ON P.idLibro = L.idLibro
         WHERE P.idUsuario = ? AND P.estadoPrestamo = 'Pendiente';`,
        [userId],
        (tx, results) => {
          let fetchedLoans = [];
          for (let i = 0; i < results.rows.length; i++) {
            fetchedLoans.push(results.rows.item(i));
          }
          setLoans(fetchedLoans);
        },
        error => {
          console.log('Error al obtener préstamos: ', error);
        }
      );
    });
  };

  const showDatepicker = (idPrestamo) => {
    setSelectedLoanId(idPrestamo);
    setShowDatePicker(true);
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(false);
    setSelectedDate(currentDate);
    
    if (selectedLoanId) {
      const selectedLoan = loans.find(loan => loan.idPrestamo === selectedLoanId);
      handleReturn(selectedLoanId, selectedLoan.fechaDevolucionEsperada);
    }
  };

  const handleReturn = (idPrestamo, fechaDevolucionEsperada) => {
    const fechaDevolucionReal = selectedDate.toISOString().split('T')[0];
    const db = getDatabase();

    const devolucionEsperada = new Date(fechaDevolucionEsperada);
    const devolucionReal = new Date(fechaDevolucionReal);
    const diferenciaEnDias = Math.floor((devolucionReal - devolucionEsperada) / (1000 * 60 * 60 * 24));

    let multa = 0;
    const multaPorDia = 5;

    if (diferenciaEnDias > 0) {
      multa = diferenciaEnDias * multaPorDia;
    }

    db.transaction(tx => {
      tx.executeSql(
        `UPDATE Prestamos 
         SET fechaDevolucionReal = ?, estadoPrestamo = 'Devuelto' 
         WHERE idPrestamo = ?;`,
        [fechaDevolucionReal, idPrestamo],
        (tx, results) => {
          if (results.rowsAffected > 0) {
            tx.executeSql(
              `UPDATE Libros 
               SET cantidad = cantidad + 1, disponibilidad = CASE WHEN cantidad + 1 > 0 THEN 1 ELSE 0 END
               WHERE idLibro = (SELECT idLibro FROM Prestamos WHERE idPrestamo = ?);`,
              [idPrestamo],
              (tx, results) => {
                if (results.rowsAffected > 0) {
                  if (multa > 0) {
                    tx.executeSql(
                      `INSERT INTO Multas (idPrestamo, monto, estadoMulta)
                       VALUES (?, ?, 'Pendiente');`,
                      [idPrestamo, multa],
                      (tx, results) => {
                        Alert.alert('Devolución registrada', `Devolución registrada con éxito. Multa aplicada: ${multa} unidades.`);
                        navigation.navigate('Realizar Préstamo');
                      },
                      error => {
                        console.log('Error al registrar la multa: ', error);
                      }
                    );
                  } else {
                    Alert.alert('Devolución registrada', 'Devolución registrada sin multa.');
                    navigation.navigate('Realizar Préstamo');
                  }
                } else {
                  Alert.alert('Error', 'No se pudo actualizar la cantidad del libro.');
                }
              }
            );
          } else {
            Alert.alert('Error', 'No se pudo registrar la devolución.');
          }
        },
        error => {
          console.log('Error al registrar devolución: ', error);
        }
      );
    });
  };

  const renderLoanItem = ({ item }) => (
    <View style={styles.loanItem}>
      <Text style={styles.itemText}>Libro: {item.titulo}</Text>
      <Text style={styles.itemSubtext}>Fecha de Préstamo: {item.fechaPrestamo}</Text>
      <Text style={styles.itemSubtext}>Fecha Esperada de Devolución: {item.fechaDevolucionEsperada}</Text>
      <Text style={styles.itemSubtext}>Estado: {item.estadoPrestamo}</Text>

      <Button
        title="Seleccionar Fecha de Devolución"
        onPress={() => showDatepicker(item.idPrestamo)}
      />

      {showDatePicker && selectedLoanId === item.idPrestamo && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Préstamos Activos</Text>
      <FlatList
        data={loans}
        renderItem={renderLoanItem}
        keyExtractor={(item) => item.idPrestamo.toString()}
        style={styles.loanList}
      />
    </View>
  );
};

// Pantalla principal con navegación entre pestañas
const LoansManagement = ({ route }) => {
  const { userId } = route.params;

  return (
    <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused }) => {
        let imageSource;
  
        if (route.name === 'Realizar Préstamo') {
          imageSource = focused
            ? require('../src/image/dar.png')
            : require('../src/image/dar.png');
        } else if (route.name === 'Préstamos Activos') {
          imageSource = focused
            ? require('../src/image/recibir.png')
            : require('../src/image/recibir.png');
        }
  
        return <Image source={imageSource} style={{ width: 24, height: 24 }} />;
      },
    })}
  >
    <Tab.Screen
      name="Realizar Préstamo"
      component={MakeLoanScreen}
      initialParams={{ userId }}
    />
    <Tab.Screen
      name="Préstamos Activos"
      component={LoanListScreen}
      initialParams={{ userId }}
    />
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#0d47a1',
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  bookList: {
    flexGrow: 0,
    marginBottom: 15,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  selectedBook: {
    backgroundColor: '#b2dfdb',
  },
  bookImage: {
    width: 50,
    height: 75,
    marginRight: 15,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d47a1',
  },
  bookQuantity: {
    fontSize: 14,
    color: '#555',
  },
  dateButton: {
    backgroundColor: '#0d47a1',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
  },
  loanItem: {
    padding: 15,
    backgroundColor: '#ffffff',
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  loanList: {
    marginTop: 20,
  },
  itemText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d47a1',
  },
  itemSubtext: {
    fontSize: 14,
    color: '#555',
  },
});

export default LoansManagement;
