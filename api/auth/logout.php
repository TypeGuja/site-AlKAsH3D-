<?php
/**
 * ============================================
 * API ВЫХОДА
 * ============================================
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

session_start();
session_destroy();

echo json_encode(array(
    'success' => true,
    'message' => 'Выход выполнен успешно'
));
?>