import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, StatusBar, Dimensions } from 'react-native';
import PushNotification from 'react-native-push-notification'; // Importar notificaciones
import { getDatabase } from '../database/Database'; // Importar tu función de base de datos

const HomeScreen = ({ route, navigation }) => {
  const { userId } = route.params; // Recuperar el userId
  const [reservedBooks, setReservedBooks] = useState([]);

  useEffect(() => {
    fetchReservedBooks(); // Verificar libros reservados disponibles al cargar la pantalla

    // Configuración para PushNotification (asegúrate de tener un canal configurado)
    PushNotification.createChannel(
      {
        channelId: "library-channel", // Identificador único para el canal
        channelName: "Library Notifications", // Nombre del canal visible para el usuario
      },
      (created) => console.log(`createChannel returned '${created}'`)
    );
  }, []);

  // Función para verificar si hay libros reservados que ya estén disponibles
  const fetchReservedBooks = () => {
    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `SELECT L.titulo, L.idLibro
         FROM Libros L
         JOIN Reservas R ON L.idLibro = R.idLibro
         WHERE L.disponibilidad = 1 AND R.estadoReserva = 'Pendiente' AND R.idUsuario = ?;`, // Buscar libros reservados con disponibilidad 1
        [userId], // Solo para el usuario actual
        (tx, results) => {
          let books = [];
          for (let i = 0; i < results.rows.length; i++) {
            books.push(results.rows.item(i));
          }

          if (books.length > 0) {
            setReservedBooks(books);
            books.forEach(book => {
              sendNotification(book.titulo);
              updateReservationStatus(book.idLibro); // Actualizar el estado de la reserva a "Notificado"
            });
          }
        },
        error => {
          console.log('Error al verificar libros reservados disponibles:', error);
        }
      );
    });
  };

  // Función para enviar la notificación
  const sendNotification = (bookTitle) => {
    PushNotification.localNotification({
      channelId: "library-channel", // Canal configurado para notificaciones
      title: "Libro Disponible",
      message: `El libro "${bookTitle}" que reservaste ya está disponible.`,
    });
  };

  // Función para actualizar el estado de la reserva
  const updateReservationStatus = (idLibro) => {
    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE Reservas SET estadoReserva = 'Notificado' WHERE idLibro = ? AND idUsuario = ?;`,
        [idLibro, userId], // Asegurarse de actualizar solo para el usuario actual
        (tx, results) => {
          if (results.rowsAffected > 0) {
            console.log('Reserva actualizada a "Notificado".');
          }
        },
        error => {
          console.log('Error al actualizar el estado de la reserva:', error);
        }
      );
    });
  };

  // Función para cerrar sesión y volver a la pantalla de Login
  const handleLogout = () => {
    navigation.replace('Login'); // Redirigir a la pantalla de Login
  };

  return (
    <View style={styles.container}>
      {/* Cambiar el color de la barra de estado */}
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Encabezado con el logo */}
      <View style={styles.header}>
        <Image
          source={require('../src/image/logo.png')}  // Asegúrate de tener tu archivo logo.png en la carpeta 'assets'
          style={styles.logo}
        />
        <Text style={styles.headerText}>Borcelle Bookstore</Text>
      </View>

      {/* Título de la sección */}
      <Text style={styles.sectionTitle}>Menú Principal</Text>

      {/* Opciones del menú */}
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('UserManagement', { userId })}
        >
          <Image source={require('../src/image/gestion-de-equipos.png')} style={styles.menuIcon} />
          <Text style={styles.menuText}>Gestión de Usuarios</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('BookCatalog', { userId })}
        >
          <Image source={require('../src/image/blogger-de-libros.png')} style={styles.menuIcon} />
          <Text style={styles.menuText}>Catálogo de Libros</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('LoansManagement', { userId })}
        >
          <Image source={require('../src/image/pedir-prestado.png')} style={styles.menuIcon} />
          <Text style={styles.menuText}>Préstamos y Devoluciones</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Reservations', { userId })}
        >
          <Image source={require('../src/image/reserva.png')} style={styles.menuIcon} />
          <Text style={styles.menuText}>Reservas de Libros</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('FinesManagement', { userId })}
        >
          <Image source={require('../src/image/billete.png')} style={styles.menuIcon} />
          <Text style={styles.menuText}>Multas y Pagos</Text>
        </TouchableOpacity>
      </View>

      {/* Botón de salir */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Salir</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    
  },
  header: {
    backgroundColor: '#0d47a1',  // Azul oscuro
    width: '100%',  // Para que ocupe todo el ancho
    paddingVertical: 10,  // Reducir la altura
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logo: {
    width: 40,  // Reducir tamaño del logo
    height: 40,
    marginRight: 10,
  },
  headerText: {
    color: '#fff',
    fontSize: 22,  // Un poco más pequeño para adaptarse
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0d47a1',  // Azul oscuro
    marginVertical: 20,
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuButton: {
    backgroundColor: '#ffffff',
    width: '45%',
    marginBottom: 20,
    paddingVertical: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  menuIcon: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  menuText: {
    color: '#0d47a1',  // Azul oscuro
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#d32f2f',  // Rojo para el botón de salir
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
