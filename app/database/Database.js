// database/Database.js

import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = "SistemaLibreria.db";
const database_version = "1.0";
const database_displayname = "Library Database";
const database_size = 200000;

let db;

export const openDatabase = () => {
  return new Promise((resolve, reject) => {
    SQLite.openDatabase(
      database_name,
      database_version,
      database_displayname,
      database_size
    ).then(DB => {
      db = DB;
      console.log("Base de datos abierta");
      // Crear las tablas si no existen
      db.transaction(tx => {
        // Tabla Usuarios
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS Usuarios (
            idUsuario INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT,
            email TEXT,
            contraseña TEXT,
            tipoUsuario TEXT
          );`
        );
        // Tabla Libros
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS Libros (
            idLibro INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT,
            autor TEXT,
            portada TEXT,
            isbn TEXT,
            cantidad INTEGER,
            disponibilidad INTEGER
          );`
        );
        // Tabla Préstamos
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS Prestamos (
            idPrestamo INTEGER PRIMARY KEY AUTOINCREMENT,
            idUsuario INTEGER,
            idLibro INTEGER,
            fechaPrestamo TEXT,
            fechaDevolucionEsperada TEXT,
            fechaDevolucionReal TEXT,
            estadoPrestamo TEXT,
            FOREIGN KEY(idUsuario) REFERENCES Usuarios(idUsuario),
            FOREIGN KEY(idLibro) REFERENCES Libros(idLibro)
          );`
        );
        // Tabla Reservas
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS Reservas (
            idReserva INTEGER PRIMARY KEY AUTOINCREMENT,
            idUsuario INTEGER,
            idLibro INTEGER,
            fechaReserva TEXT,
            estadoReserva TEXT,
            FOREIGN KEY(idUsuario) REFERENCES Usuarios(idUsuario),
            FOREIGN KEY(idLibro) REFERENCES Libros(idLibro)
          );`
        );
        // Tabla Multas
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS Multas (
            idMulta INTEGER PRIMARY KEY AUTOINCREMENT,
            idPrestamo INTEGER,
            monto REAL,
            estadoMulta TEXT,
            FOREIGN KEY(idPrestamo) REFERENCES Prestamos(idPrestamo)
          );`
        );
        // Tabla Pagos
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS Pagos (
            idPago INTEGER PRIMARY KEY AUTOINCREMENT,
            idUsuario INTEGER,
            monto REAL,
            metodoPago TEXT,
            fechaPago TEXT,
            numeroTarjeta TEXT, 
            FOREIGN KEY(idUsuario) REFERENCES Usuarios(idUsuario)
          );`
        );
      }).then(() => {
        console.log("Tablas creadas o ya existentes");
        resolve(db);
      }).catch(error => {
        console.log(error);
        reject(error);
      });
    }).catch(error => {
      console.log(error);
      reject(error);
    });
  });
};

export const getDatabase = () => {
  if (db) {
    return db;
  } else {
    throw new Error("Base de datos no abierta");
  }
};
