import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import PushNotification from 'react-native-push-notification';
import { openDatabase } from './app/database/Database';

// Tus pantallas aquí
import HomeScreen from './app/screens/HomeScreen';
import UserManagement from './app/screens/UserManagement';
import BookCatalog from './app/screens/BookCatalog';
import LoansManagement from './app/screens/LoansManagement';
import Reservations from './app/screens/Reservations';
import FinesManagement from './app/screens/FinesManagement';
import Login from './app/screens/Login';
import Register from './app/screens/Register';
import PrestamoEstudiante from './app/screens/PrestamoEstudiante'
import MenuEstudiante from './app/screens/MenuEstudiante'

const Stack = createStackNavigator();

const App = () => {

  useEffect(() => {
    // Inicialización de la base de datos
    openDatabase()
      .then(DB => {
        console.log("Base de datos inicializada");
      })
      .catch(error => {
        console.log("Error al abrir la base de datos:", error);
      });

  })
 


  // Solicitar permiso para notificaciones en Android 13 o superior
  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Permiso para notificaciones',
            message: 'Esta aplicación necesita acceso para mostrar notificaciones.',
            buttonNeutral: 'Preguntar después',
            buttonNegative: 'Cancelar',
            buttonPositive: 'Aceptar',
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Permiso para notificaciones concedido');
        } else {
          console.log('Permiso para notificaciones denegado');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // Crear un canal de notificaciones (necesario en Android)
  const createNotificationChannel = () => {
    PushNotification.createChannel(
      {
        channelId: "library-channel", // El ID único del canal
        channelName: "Library Notifications", // Nombre del canal visible para el usuario
        importance: 4, // Importancia de las notificaciones (alta)
      },
      (created) => console.log(`¿Canal creado? ${created}`) // Verificación de creación del canal
    );
  };

  // Ejecutar al iniciar la aplicación
  useEffect(() => {
    requestNotificationPermission(); // Solicitar permisos para notificaciones
    createNotificationChannel(); // Crear el canal de notificaciones
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen 
            name="Login" 
            component={Login} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Register" 
            component={Register} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="UserManagement" 
            component={UserManagement} 
            options={{ headerShown: false }}  
          />
          <Stack.Screen 
            name="BookCatalog" 
            component={BookCatalog} 
            options={{ headerShown: false }}  
          />
          <Stack.Screen 
            name="LoansManagement" 
            component={LoansManagement} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Reservations" 
            component={Reservations} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="FinesManagement" 
            component={FinesManagement} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="PrestamoEstudiante" 
            component={PrestamoEstudiante} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="MenuEstudiante" 
            component={MenuEstudiante} 
            options={{ headerShown: false }} 
          />

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
