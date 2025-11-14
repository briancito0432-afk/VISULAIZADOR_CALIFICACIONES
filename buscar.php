<?php
header('Content-Type: application/json');
require_once 'conexion.php'; 

// --- 1. OBTENER PARÁMETROS ---
$termino = $_GET['termino'] ?? '';
$sort = $_GET['sort'] ?? 'id_desc';
$filter = $_GET['filter'] ?? 'todos';
$pagina = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
if ($pagina < 1) $pagina = 1;

$limite_por_pagina = 15;
$offset = ($pagina - 1) * $limite_por_pagina; // Esto ya es un integer

if (empty($termino)) {
    echo json_encode(['data' => [], 'total' => 0, 'pagina' => 1, 'total_paginas' => 0]);
    exit;
}
$termino_like = '%' . $termino . '%';

// --- 2. LÓGICA DE ORDENAMIENTO ---
$orderBySql = '';
switch ($sort) {
    case 'id_asc': $orderBySql = 'ORDER BY ID_Alumno ASC'; break;
    case 'nombre_asc': $orderBySql = 'ORDER BY nombre ASC'; break;
    case 'apellido_asc': $orderBySql = 'ORDER BY apellido ASC'; break;
    default: $orderBySql = 'ORDER BY ID_Alumno DESC'; break;
}

// --- 3. LÓGICA DE FILTRO ---
$filterSql = '';
if ($filter == 'aprobados') {
    $filterSql = "AND Promedio_Final >= 70.0";
} elseif ($filter == 'reprobados') {
    $filterSql = "AND Promedio_Final < 70.0";
}

// --- 4. CONSULTA CTE (COMÚN) ---
$cteQuery = "
    ;WITH CalificacionesCalculadas AS (
        SELECT 
            a.id AS ID_Alumno, 
            a.nombre, a.apellido, a.nombre_completo,
            c.tarea_a, CAST( (c.tarea_a / 10.0) * 17.0 AS decimal(4, 2) ) AS 'Valor_T_A_(17%)',
            c.tarea_b, CAST( (c.tarea_b / 10.0) * 18.0 AS decimal(4, 2) ) AS 'Valor_T_B_(18%)',
            c.tarea_c, CAST( (c.tarea_c / 10.0) * 25.0 AS decimal(4, 2) ) AS 'Valor_T_C_(25%)',
            c.proyecto1, CAST( (c.proyecto1 * 10.0) AS decimal(4, 2) ) AS 'Valor_P1_(10%)',
            c.proyecto2, CAST( (c.proyecto2 * 18.0) AS decimal(4, 2) ) AS 'Valor_P2_(18%)',
            c.proyecto3, CAST( (c.proyecto3 * 12.0) AS decimal(4, 2) ) AS 'Valor_P3_(12%)',
            
            CAST( 
                ( (c.tarea_a / 10.0) * 17.0 ) + ( (c.tarea_b / 10.0) * 18.0 ) + ( (c.tarea_c / 10.0) * 25.0 ) + 
                ( c.proyecto1 * 10.0 ) + ( c.proyecto2 * 18.0 ) + ( c.proyecto3 * 12.0 )
            AS decimal(5, 2) ) AS Promedio_Final
        FROM 
            dbo.alumnos AS a
        LEFT JOIN 
            dbo.calificaciones AS c ON a.id = c.idAlum
    )
";

// --- 5. LÓGICA DE BÚSQUEDA (WHERE) ---
$searchSql = "
    WHERE 
        (nombre LIKE ? OR 
        apellido LIKE ? OR
        nombre_completo LIKE ?
";
$parametros = [$termino_like, $termino_like, $termino_like];

if (is_numeric($termino)) {
    $searchSql .= " OR ID_Alumno = ?";
    $parametros[] = $termino;
}
$searchSql .= ") $filterSql";


try {
    // --- 6. PRIMERA CONSULTA: OBTENER TOTAL DE REGISTROS ---
    $countQuery = $cteQuery . "SELECT COUNT(*) FROM CalificacionesCalculadas $searchSql";
    $stmt_count = $conn->prepare($countQuery);
    $stmt_count->execute($parametros);
    $total_registros = (int)$stmt_count->fetchColumn();
    $total_paginas = (int)ceil($total_registros / $limite_por_pagina);

    // --- 7. SEGUNDA CONSULTA: OBTENER DATOS PAGINADOS ---
    $dataQuery = $cteQuery . "
        SELECT 
            *, 
            CASE 
                WHEN Promedio_Final >= 70.0 THEN 'Aprobado'
                ELSE 'Reprobado'
            END AS Estatus
        FROM 
            CalificacionesCalculadas
        $searchSql
        $orderBySql
        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
    ";

    $stmt_data = $conn->prepare($dataQuery);

    // ======================================================
    // ¡AQUÍ ESTÁ LA CORRECCIÓN!
    // ======================================================
    // 1. Vincula todos los parámetros de búsqueda (3 o 4)
    $param_index = 1;
    foreach ($parametros as $valor) {
        // Usamos bindValue para vincular el valor directamente
        $stmt_data->bindValue($param_index, $valor);
        $param_index++;
    }
    
    // 2. Vincula los parámetros de paginación (OFFSET y FETCH) como ENTEROS
    $stmt_data->bindParam($param_index, $offset, PDO::PARAM_INT);
    $param_index++;
    $stmt_data->bindParam($param_index, $limite_por_pagina, PDO::PARAM_INT);
    
    // 3. Ejecuta la consulta
    $stmt_data->execute();
    // ======================================================
    
    $resultados = $stmt_data->fetchAll(PDO::FETCH_ASSOC);

    // --- 8. DEVOLVER JSON COMPLETO ---
    echo json_encode([
        'data' => $resultados,
        'total' => $total_registros,
        'pagina' => $pagina,
        'total_paginas' => $total_paginas
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en la búsqueda: ' . $e->getMessage()]);
}
?>