import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { getDatabase } from '../database/Database';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState('');
  const [editingUser, setEditingUser] = useState(null); // Para controlar el usuario que se está editando

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Usuarios;`,
        [],
        (tx, results) => {
          let fetchedUsers = [];
          for (let i = 0; i < results.rows.length; i++) {
            fetchedUsers.push(results.rows.item(i));
          }
          setUsers(fetchedUsers);
        },
        error => {
          console.log("Error al obtener usuarios: ", error);
        }
      );
    });
  };

  const addUser = () => {
    if (nombre === '' || email === '' || tipoUsuario === '') {
      Alert.alert('Error', 'Por favor, completa todos los campos');
      return;
    }

    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO Usuarios (nombre, email, contraseña, tipoUsuario) VALUES (?, ?, ?, ?);`,
        [nombre, email, contraseña, tipoUsuario],
        (tx, results) => {
          if (results.rowsAffected > 0) {
            Alert.alert('Éxito', 'Usuario agregado correctamente');
            fetchUsers();
            resetForm();
          } else {
            Alert.alert('Error', 'No se pudo agregar el usuario');
          }
        },
        error => {
          console.log("Error al agregar usuario: ", error);
        }
      );
    });
  };

  const updateUser = () => {
    if (!editingUser) return;
    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE Usuarios SET nombre = ?, email = ?, contraseña = ?, tipoUsuario = ? WHERE idUsuario = ?;`,
        [nombre, email, contraseña, tipoUsuario, editingUser.idUsuario],
        (tx, results) => {
          if (results.rowsAffected > 0) {
            Alert.alert('Éxito', 'Usuario actualizado correctamente');
            fetchUsers();
            resetForm();
          } else {
            Alert.alert('Error', 'No se pudo actualizar el usuario');
          }
        },
        error => {
          console.log("Error al actualizar usuario: ", error);
        }
      );
    });
  };

  const deleteUser = (idUsuario) => {
    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `DELETE FROM Usuarios WHERE idUsuario = ?;`,
        [idUsuario],
        (tx, results) => {
          if (results.rowsAffected > 0) {
            Alert.alert('Éxito', 'Usuario eliminado correctamente');
            fetchUsers();
          } else {
            Alert.alert('Error', 'No se pudo eliminar el usuario');
          }
        },
        error => {
          console.log("Error al eliminar usuario: ", error);
        }
      );
    });
  };

  const resetForm = () => {
    setNombre('');
    setEmail('');
    setContraseña('');
    setTipoUsuario('');
    setEditingUser(null); // Limpiar el estado de edición
  };

  const editUser = (user) => {
    setNombre(user.nombre);
    setEmail(user.email);
    setContraseña(user.contraseña);
    setTipoUsuario(user.tipoUsuario);
    setEditingUser(user);
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item.nombre} - {item.email} - {item.tipoUsuario}</Text>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={() => editUser(item)}>
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteUser(item.idUsuario)}>
          <Text style={styles.buttonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Usuarios</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={text => setNombre(text)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={text => setEmail(text)}
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={contraseña}
        onChangeText={text => setContraseña(text)}
        secureTextEntry={true} // Para ocultar la contraseña
      />
      
      <TextInput
        style={styles.input}
        placeholder="Tipo de Usuario (Estudiante, Profesor, Personal)"
        value={tipoUsuario}
        onChangeText={text => setTipoUsuario(text)}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={editingUser ? updateUser : addUser} // Si está editando, actualiza; si no, agrega
      >
        <Text style={styles.addButtonText}>{editingUser ? 'Actualizar Usuario' : 'Agregar Usuario'}</Text>
      </TouchableOpacity>
      
      <FlatList
        data={users}
        keyExtractor={item => item.idUsuario.toString()}
        renderItem={renderItem}
        style={styles.list}
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#0d47a1',
  },
  input: {
    height: 50,
    borderColor: '#0d47a1',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  list: {
    marginTop: 20,
  },
  item: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
  },
  itemText: {
    fontSize: 16,
    color: '#0d47a1',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#0d47a1',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UserManagement;
