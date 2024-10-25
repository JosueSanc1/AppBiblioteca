import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Image, StyleSheet } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { getDatabase } from '../database/Database';



const Reservations = ({ route }) => {
  const { userId } = route.params; // Recibimos el userId del usuario logueado
  const [books, setBooks] = useState([]); // Lista de libros ocupados

  useEffect(() => {
    fetchUnavailableBooks(); // Cargar solo los libros ocupados al iniciar

    // Configuración de PushNotification para notificaciones locales
    PushNotification.configure({
      onNotification: function (notification) {
        console.log("Notificación recibida:", notification);
      },
      requestPermissions: Platform.OS === 'ios',
    });
  }, []);

  // Función para obtener los libros no disponibles (ocupados) desde la base de datos
  const fetchUnavailableBooks = () => {
    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Libros WHERE disponibilidad = 0;`, // Obtener solo libros ocupados
        [],
        (tx, results) => {
          let fetchedBooks = [];
          for (let i = 0; i < results.rows.length; i++) {
            fetchedBooks.push(results.rows.item(i));
          }
          setBooks(fetchedBooks); // Actualizar la lista de libros ocupados
        },
        error => {
          console.log('Error al obtener los libros ocupados:', error);
        }
      );
    });
  };

  const fetchBooks = () => {
    const db = getDatabase();
  
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Libros WHERE disponibilidad = 0;`, // Consulta todos los libros
        [],
        (tx, results) => {
          let books = [];
          for (let i = 0; i < results.rows.length; i++) {
            books.push(results.rows.item(i));
          }
  
          // Logueamos los datos de la tabla Libros en la consola
          console.log("Datos de la tabla Libros:", books);
        },
        (tx, error) => {
          console.log('Error al obtener los libros:', error);
        }
      );
    });
  };
  
  // Llamar a la función fetchBooks donde sea necesario en tu código, por ejemplo, dentro de useEffect()
  useEffect(() => {
    fetchBooks(); // Llama a la función cuando cargue la pantalla
  }, []);

  // Función para realizar una reserva cuando el libro no está disponible
  const handleReserve = (idLibro) => {
    const db = getDatabase();
    const fechaReserva = new Date().toISOString().split('T')[0]; // Fecha actual

    // Insertar la reserva en la base de datos
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO Reservas (idUsuario, idLibro, fechaReserva, estadoReserva) 
         VALUES (?, ?, ?, 'Pendiente');`,
        [userId, idLibro, fechaReserva],
        (tx, results) => {
          if (results.rowsAffected > 0) {
            Alert.alert('Reserva realizada', 'Se ha reservado el libro. Te notificaremos cuando esté disponible.');
          } else {
            Alert.alert('Error', 'No se pudo realizar la reserva.');
          }
        },
        error => {
          console.log('Error al registrar la reserva:', error);
        }
      );
    });
  };

  // Renderizar cada libro
  const renderBookItem = ({ item }) => (
    <View style={styles.bookItem}>
      <Image
        source={{ uri: `data:image/png;base64,${item.portada}` }}
        style={styles.bookImage}
      />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.titulo}</Text>
        <Text>{item.autor}</Text>
        <Text>Disponibilidad: Ocupado</Text>
        <TouchableOpacity
          style={styles.reserveButton}
          onPress={() => handleReserve(item.idLibro)}
        >
          <Text style={styles.buttonText}>Reservar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reservar Libros Ocupados</Text>
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item, index) => `${item.idLibro}-${index}`}
        style={styles.bookList}
      />
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
  },
  bookList: {
    marginTop: 10,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e0f7fa',
    marginVertical: 10,
    borderRadius: 8,
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
  reserveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default Reservations;
