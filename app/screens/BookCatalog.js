import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert, Image, TouchableOpacity, Modal } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { getDatabase } from '../database/Database';

// Configuración para seleccionar imagen
const imagePickerOptions = {
  mediaType: 'photo',
  quality: 1,
  includeBase64: true,
};

const BookCatalog = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]); // Para manejar el filtro de búsqueda
  const [searchText, setSearchText] = useState(''); // Texto de búsqueda
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [portada, setPortada] = useState(null); // Imagen en base64
  const [cantidad, setCantidad] = useState(''); // Inicializamos como cadena vacía
  const [selectedBook, setSelectedBook] = useState(null); // Para editar
  const [isModalVisible, setIsModalVisible] = useState(false); // Control del modal

  useEffect(() => {
    fetchBooks(); // Cargar los libros al inicio
  }, []);

  const fetchBooks = () => {
    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Libros;`,
        [],
        (tx, results) => {
          let fetchedBooks = [];
          for (let i = 0; i < results.rows.length; i++) {
            fetchedBooks.push(results.rows.item(i));
          }
          setBooks(fetchedBooks);
          setFilteredBooks(fetchedBooks); // Inicialmente mostramos todos los libros
        },
        error => {
          console.log("Error al obtener libros: ", error);
        }
      );
    });
  };

  // Función para manejar el texto de búsqueda
  const handleSearch = (text) => {
    setSearchText(text);
    const filtered = books.filter(book => book.titulo.toLowerCase().includes(text.toLowerCase()));
    setFilteredBooks(filtered);
  };

  const handleSaveBook = () => {
    if (titulo === '' || autor === '' || isbn === '' || portada === null || cantidad === '') {
      Alert.alert('Error', 'Por favor, completa todos los campos correctamente, incluyendo la cantidad.');
      return;
    }

    const db = getDatabase();
    const cantidadNumber = parseInt(cantidad); // Convertimos a número
    const disponibilidad = cantidadNumber > 0 ? 1 : 0; // Disponibilidad basada en la cantidad

    if (selectedBook) {
      // Actualizar libro
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE Libros SET titulo = ?, autor = ?, isbn = ?, portada = ?, cantidad = ?, disponibilidad = ? WHERE idLibro = ?;`,
          [titulo, autor, isbn, portada, cantidadNumber, disponibilidad, selectedBook.idLibro],
          (tx, results) => {
            if (results.rowsAffected > 0) {
              Alert.alert('Éxito', 'Libro actualizado correctamente');
              fetchBooks();
              resetForm();
            } else {
              Alert.alert('Error', 'No se pudo actualizar el libro');
            }
          },
          error => {
            console.log("Error al actualizar libro: ", error);
          }
        );
      });
    } else {
      // Agregar nuevo libro
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO Libros (titulo, autor, isbn, portada, cantidad, disponibilidad) VALUES (?, ?, ?, ?, ?, ?);`,
          [titulo, autor, isbn, portada, cantidadNumber, disponibilidad],
          (tx, results) => {
            if (results.rowsAffected > 0) {
              Alert.alert('Éxito', 'Libro agregado correctamente');
              fetchBooks();
              resetForm();
            } else {
              Alert.alert('Error', 'No se pudo agregar el libro');
            }
          },
          error => {
            console.log("Error al agregar libro: ", error);
          }
        );
      });
    }
  };

  const resetForm = () => {
    setTitulo('');
    setAutor('');
    setIsbn('');
    setPortada(null);
    setCantidad(''); // Reiniciar cantidad a cadena vacía
    setSelectedBook(null);
    setIsModalVisible(false);
  };

  const handleDeleteBook = (idLibro) => {
    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `DELETE FROM Libros WHERE idLibro = ?;`,
        [idLibro],
        (tx, results) => {
          if (results.rowsAffected > 0) {
            Alert.alert('Éxito', 'Libro eliminado correctamente');
            fetchBooks();
          } else {
            Alert.alert('Error', 'No se pudo eliminar el libro');
          }
        },
        error => {
          console.log("Error al eliminar libro: ", error);
        }
      );
    });
  };

  const handleEditBook = (book) => {
    setSelectedBook(book);
    setTitulo(book.titulo);
    setAutor(book.autor);
    setIsbn(book.isbn);
    setPortada(book.portada);
    setCantidad(book.cantidad.toString()); // Aseguramos que el valor de cantidad sea string para el TextInput
    setIsModalVisible(true); // Abrir modal para editar
  };

  const selectImage = () => {
    launchImageLibrary(imagePickerOptions, response => {
      if (response.didCancel) {
        console.log('Selección de imagen cancelada');
      } else if (response.errorCode) {
        console.log('Error en la selección de imagen: ', response.errorMessage);
      } else {
        const { base64 } = response.assets[0];
        setPortada(base64);
      }
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.itemDetails}>
        <Text style={styles.itemText}>{item.titulo}</Text>
        <Text style={styles.itemSubtext}>Autor: {item.autor}</Text>
        <Text style={styles.itemSubtext}>ISBN: {item.isbn}</Text>
        <Text style={styles.itemSubtext}>Cantidad: {item.cantidad}</Text>
        <Text style={styles.itemSubtext}>Disponibilidad: {item.disponibilidad ? 'Disponible' : 'No Disponible'}</Text>
        {item.portada ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${item.portada}` }}
            style={styles.image}
          />
        ) : (
          <Text style={styles.noImageText}>Sin portada</Text>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleEditBook(item)}>
          <Image
            source={require('../src/image/libro.png')}  
            style={styles.actionImage}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteBook(item.idLibro)}>
          <Image
            source={require('../src/image/eliminar.png')}  
            style={styles.actionImage}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catálogo de Libros</Text>

      {/* Barra de búsqueda */}
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar libro por título"
        value={searchText}
        onChangeText={handleSearch} // Filtrar los libros en tiempo real
      />

      <FlatList
        data={filteredBooks} // Mostramos los libros filtrados
        keyExtractor={item => item.idLibro.toString()}
        renderItem={renderItem}
        style={styles.list}
      />

      {/* Botón flotante para agregar libro */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      >
        <Image
          source={require('../src/image/agregar.png')}  
          style={styles.fabImage}
        />
      </TouchableOpacity>

      {/* Modal para agregar/editar libros */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Título"
              value={titulo}
              onChangeText={text => setTitulo(text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Autor"
              value={autor}
              onChangeText={text => setAutor(text)}
            />
            <TextInput
              style={styles.input}
              placeholder="ISBN"
              value={isbn}
              onChangeText={text => setIsbn(text)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Cantidad"
              value={cantidad}
              onChangeText={text => setCantidad(text)} // Manejamos la cantidad como texto
              keyboardType="numeric"
            />
            <Button title="Seleccionar Portada" onPress={selectImage} />
            {portada ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${portada}` }}
                style={styles.imagePreview}
              />
            ) : (
              <Text>Portada no seleccionada</Text>
            )}
            <View style={styles.modalButtons}>
              <Button title={selectedBook ? "Guardar Cambios" : "Agregar Libro"} onPress={handleSaveBook} />
              <Button title="Cancelar" color="red" onPress={resetForm} />
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
  list: {
    marginTop: 20,
  },
  item: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  itemDetails: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1,
  },
  itemText: {
    fontSize: 18,
    color: '#0d47a1',
    fontWeight: 'bold',
  },
  itemSubtext: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  image: {
    width: 50,
    height: 75,
    marginTop: 10,
  },
  noImageText: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: 80,
  },
  actionImage: {
    width: 30,
    height: 30,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#0d47a1',
    borderRadius: 50,
    padding: 15,
    elevation: 5,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabImage: {
    width: 30,
    height: 30,
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
    elevation: 5,
  },
  input: {
    height: 50,
    borderColor: '#0d47a1',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  imagePreview: {
    width: 100,
    height: 150,
    marginVertical: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
});

export default BookCatalog;
