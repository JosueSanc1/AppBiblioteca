import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Image, TouchableOpacity, Button, Alert, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker'; // Para seleccionar fechas
import { getDatabase } from '../database/Database';

const StudentLoanScreen = ({ route }) => {
  const { userId } = route.params; // Recibir el id del usuario (estudiante)
  const [books, setBooks] = useState([]); // Libros disponibles
  const [filteredBooks, setFilteredBooks] = useState([]); // Libros filtrados para la búsqueda
  const [searchText, setSearchText] = useState(''); // Texto de búsqueda
  const [selectedBook, setSelectedBook] = useState(null); // Libro seleccionado para el préstamo
  const [selectedDate, setSelectedDate] = useState(new Date()); // Fecha de devolución esperada
  const [showDatePicker, setShowDatePicker] = useState(false); // Mostrar el selector de fecha

  useEffect(() => {
    fetchBooks(); // Cargar los libros disponibles al iniciar la vista
  }, []);

  // Función para obtener los libros disponibles
  const fetchBooks = () => {
    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Libros WHERE cantidad > 0;', // Solo obtener libros disponibles
        [],
        (tx, results) => {
          let fetchedBooks = [];
          for (let i = 0; i < results.rows.length; i++) {
            fetchedBooks.push(results.rows.item(i));
          }
          setBooks(fetchedBooks);
          setFilteredBooks(fetchedBooks); // Mostrar inicialmente todos los libros disponibles
        },
        error => {
          console.log('Error al obtener libros: ', error);
        }
      );
    });
  };

  // Función para buscar libros por título
  const searchBooks = (text) => {
    setSearchText(text);
    const filtered = books.filter(book => book.titulo.toLowerCase().includes(text.toLowerCase()));
    setFilteredBooks(filtered); // Actualizar la lista filtrada
  };

  // Función para registrar un préstamo
  const handleLoan = () => {
    if (!selectedBook) {
      Alert.alert('Error', 'Por favor, selecciona un libro para el préstamo.');
      return;
    }

    const db = getDatabase();
    const fechaPrestamo = new Date().toISOString().split('T')[0]; // Fecha actual
    const fechaDevolucionEsperada = selectedDate.toISOString().split('T')[0]; // Fecha seleccionada

    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO Prestamos (idUsuario, idLibro, fechaPrestamo, fechaDevolucionEsperada, estadoPrestamo)
         VALUES (?, ?, ?, ?, 'Pendiente');`,
        [userId, selectedBook.idLibro, fechaPrestamo, fechaDevolucionEsperada],
        (tx, results) => {
          if (results.rowsAffected > 0) {
            // Actualizar la cantidad de libros después de realizar el préstamo
            tx.executeSql(
              `UPDATE Libros SET cantidad = cantidad - 1, disponibilidad = CASE WHEN cantidad - 1 = 0 THEN 0 ELSE 1 END WHERE idLibro = ?;`,
              [selectedBook.idLibro],
              (tx, results) => {
                if (results.rowsAffected > 0) {
                  Alert.alert('Éxito', 'Préstamo registrado correctamente.');
                  fetchBooks(); // Refrescar la lista de libros
                  setSelectedBook(null); // Limpiar selección
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

  // Función para mostrar el selector de fecha
  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  // Manejo del cambio de fecha
  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(false);
    setSelectedDate(currentDate);
  };

  // Renderizar cada libro en la lista
  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.bookItem,
        selectedBook && selectedBook.idLibro === item.idLibro ? styles.selectedBook : null,
      ]}
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
      <Text style={styles.title}>Préstamo de Libros</Text>

      {/* Barra de búsqueda */}
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar libro por título"
        value={searchText}
        onChangeText={searchBooks}
      />

      {/* Lista de libros */}
      <FlatList
        data={filteredBooks}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.idLibro.toString()}
        style={styles.bookList}
      />

      {/* Botón para seleccionar fecha de devolución */}
      <TouchableOpacity onPress={showDatepicker} style={styles.dateButton}>
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

      <Text> </Text>
      <Button title="Realizar Préstamo" onPress={handleLoan} />
    </View>
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
  bookList: {
    flexGrow: 0,
    marginBottom: 15,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#e0f7fa',
    borderRadius: 5,
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
    fontSize: 16,
    fontWeight: 'bold',
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
});

export default StudentLoanScreen;
