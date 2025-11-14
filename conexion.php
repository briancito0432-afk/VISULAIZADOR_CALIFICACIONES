<?php
/*
 * ====================================
 * CONFIGURACIÓN DE LA BASE DE DATOS
 * (Basado en tus imágenes)
 * ====================================
*/

// 1. Tu Server Name es "BRYAN"
$serverName = "BRYAN"; 

// 2. Tu base de datos se llama "alumnos"
$databaseName = "alumnos"; 

/*
 * 3. y 4. Usuario y Contraseña
 * ¡No se necesitan! Estás usando Autenticación de Windows.
 * Dejaremos las variables vacías por si acaso, pero no se usarán.
*/
$username = ""; // No es necesario
$password = ""; // No es necesario


/*
 * ====================================
 * CÓDIGO DE CONEXIÓN (Modificado para Autenticación de Windows)
 * ====================================
*/

try {
    // Intenta crear la conexión.
    // Fíjate que NO le pasamos $username ni $password.
    $conn = new PDO("sqlsrv:server=$serverName;Database=$databaseName");
    
    // Configura PDO para que muestre errores claros
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch(PDOException $e) {
    // Si la conexión falla, el script se detendrá y mostrará el error.
    http_response_code(500); 
    die(json_encode(['error' => "Error de conexión: " . $e->getMessage()]));
}

// ¡Listo! Si el script llega aquí, $conn está conectado.
?>