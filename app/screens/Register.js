import React, { useState } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';  // Asegúrate de tener esta librería instalada
import { getDatabase } from '../database/Database';

const Register = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('Estudiante'); // Estudiante como valor predeterminado

  const handleRegister = () => {
    if (name === '' || email === '' || password === '') {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }

    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO Usuarios (nombre, email, contraseña, tipoUsuario) VALUES (?, ?, ?, ?)`,
        [name, email, password, userType],
        (tx, results) => {
          if (results.rowsAffected > 0) {
            Alert.alert('Registro exitoso', 'Cuenta creada con éxito');
            navigation.navigate('Login'); // Volver a la pantalla de login
          } else {
            Alert.alert('Error', 'No se pudo crear la cuenta');
          }
        },
        error => {
          console.log('Error al registrar usuario:', error);
        }
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Logo en la parte superior */}
      <Image 
        source={require('../src/image/logo.png')}  // Asegúrate de tener tu archivo logo.png en la carpeta 'assets'
        style={styles.logo}
      />
      
      <Text style={styles.title}>Crear Cuenta</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#aaa"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#aaa"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>Tipo de Usuario:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={userType}
          style={styles.picker}
          onValueChange={(itemValue) => setUserType(itemValue)}
        >
          <Picker.Item label="Estudiante" value="Estudiante" />
          <Picker.Item label="Profesor" value="Profesor" />
        </Picker>
      </View>
      
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>Registrarse</Text>
      </TouchableOpacity>
      
      <Text style={styles.loginText}>¿Ya tienes cuenta?</Text>
      
      <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0d47a1',  // Fondo azul oscuro
  },
  logo: {
    width: 120,   // Tamaño del logo
    height: 120,
    alignSelf: 'center',
    marginBottom: 30,  // Espacio debajo del logo
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF',  // Texto en blanco
    marginBottom: 20,
  },
  input: {
    height: 45,
    borderColor: '#1a73e8',  // Azul eléctrico para el borde
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    color: '#FFFFFF',  // Texto en blanco
  },
  label: {
    color: '#FFFFFF',
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#1a73e8',  // Azul eléctrico para el borde del picker
    borderRadius: 8,
    marginBottom: 20,
  },
  picker: {
    height: 50,
    color: '#FFFFFF',  // Texto blanco para el picker
  },
  registerButton: {
    backgroundColor: '#1a73e8',  // Azul eléctrico para el botón
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginText: {
    textAlign: 'center',
    color: '#FFFFFF',  // Texto en blanco
    marginBottom: 10,
  },
  loginButton: {
    alignItems: 'center',
    padding: 10,
  },
  loginButtonText: {
    color: '#1a73e8',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Register;
