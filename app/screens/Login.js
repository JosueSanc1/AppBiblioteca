import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { getDatabase } from '../database/Database';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    const db = getDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Usuarios WHERE email = ? AND contraseña = ?`,
        [email, password],
        (tx, results) => {
          if (results.rows.length > 0) {
            const user = results.rows.item(0);
            Alert.alert('Bienvenido', `Hola ${user.nombre}`);
            
            // Verificar si el usuario es Estudiante o Profesor
            if (user.tipoUsuario === 'Estudiante') {
              navigation.navigate('MenuEstudiante', { userId: user.idUsuario }); // Llevar al menú de Estudiante
            } else if (user.tipoUsuario === 'Profesor') {
              navigation.navigate('Home', { userId: user.idUsuario }); // Llevar al menú de Profesor
            } else {
              Alert.alert('Error', 'Tipo de usuario no válido');
            }
          } else {
            Alert.alert('Error', 'Correo o contraseña incorrectos');
          }
        },
        error => {
          console.log('Error al verificar usuario:', error);
        }
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Logo de la aplicación */}
      <Image 
        source={require('../src/image/logo.png')}  // Asegúrate de que tengas un archivo logo.png en la carpeta 'assets'
        style={styles.logo}
      />
      
      <Text style={styles.title}>Iniciar Sesión</Text>
      
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
      
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
      </TouchableOpacity>
      
      <Text style={styles.registerText}>¿No tienes cuenta?</Text>
      
      <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.registerButtonText}>Registrarse</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0d47a1',  // Azul oscuro profundo
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
    color: '#FFFFFF',  // Texto en blanco para contrastar
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
  loginButton: {
    backgroundColor: '#1a73e8',  // Azul eléctrico
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerText: {
    textAlign: 'center',
    color: '#FFFFFF',  // Texto en blanco
    marginBottom: 10,
  },
  registerButton: {
    alignItems: 'center',
    padding: 10,
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Login;
