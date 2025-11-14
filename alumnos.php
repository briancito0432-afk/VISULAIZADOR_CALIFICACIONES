<?php
header('Content-Type: application/json');
require_once 'conexion.php'; 

// --- 1. OBTENER PARÁMETROS ---
$sort = $_GET['sort'] ?? 'id_desc'; 
$pagina = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
if ($pagina < 1) $pagina = 1;

$limite_por_pagina = 15;
$offset = ($pagina - 1) * $limite_por_pagina;

// --- 2. LÓGICA DE ORDENAMIENTO ---
$orderByClause = '';
switch ($sort) {
    case 'id_asc': $orderByClause = 'ORDER BY a.id ASC'; break;
    case 'nombre_asc': $orderByClause = 'ORDER BY a.nombre ASC'; break;
    case 'apellido_asc': $orderByClause = 'ORDER BY a.apellido ASC'; break;
    default: $orderByClause = 'ORDER BY a.id DESC'; break;
}

try {
    // --- 3. PRIMERA CONSULTA: OBTENER TOTAL DE REGISTROS ---
    $countQuery = "SELECT COUNT(*) FROM dbo.alumnos";
    $stmt_count = $conn->prepare($countQuery);
    $stmt_count->execute();
    $total_registros = (int)$stmt_count->fetchColumn();
    $total_paginas = (int)ceil($total_registros / $limite_por_pagina);

    // --- 4. SEGUNDA CONSULTA: OBTENER DATOS PAGINADOS ---
    $query = "
        SELECT 
            a.id AS ID_Alumno, 
            a.nombre,
            a.apellido,
            a.nombre_completo,
            a.fecha_creacion AS Fecha_Creacion
        FROM 
            dbo.alumnos AS a
        $orderByClause
        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
    ";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(1, $offset, PDO::PARAM_INT);
    $stmt->bindParam(2, $limite_por_pagina, PDO::PARAM_INT);
    $stmt->execute();
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // --- 5. DEVOLVER JSON COMPLETO ---
    echo json_encode([
        'data' => $resultados,
        'total' => $total_registros,
        'pagina' => $pagina,
        'total_paginas' => $total_paginas
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al consultar los alumnos: ' . $e->getMessage()]);
}
?>