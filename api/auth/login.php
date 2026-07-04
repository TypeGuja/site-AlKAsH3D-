<?php
/**
 * ============================================
 * API ВХОДА
 * ============================================
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

$usersFile = __DIR__ . '/../../data_site/user/users.json';

// ============================================
// ФУНКЦИИ
// ============================================

function getUsers($file) {
    if (!file_exists($file)) {
        return array();
    }
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    return is_array($data) ? $data : array();
}

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function sendError($message, $statusCode = 400) {
    sendResponse(array(
        'success' => false,
        'error' => $message
    ), $statusCode);
}

// ============================================
// ОБРАБОТКА
// ============================================

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Метод не поддерживается', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['username'])) {
    sendError('Имя пользователя обязательно');
}

if (empty($input['password'])) {
    sendError('Пароль обязателен');
}

$username = trim($input['username']);
$password = $input['password'];

$users = getUsers($usersFile);

// Ищем пользователя
$foundUser = null;
foreach ($users as $user) {
    if ($user['username'] === $username) {
        $foundUser = $user;
        break;
    }
}

if (!$foundUser) {
    sendError('Неверное имя пользователя или пароль', 401);
}

// Проверяем пароль
if (!password_verify($password, $foundUser['password'])) {
    sendError('Неверное имя пользователя или пароль', 401);
}

// Сохраняем в сессию
$_SESSION['user_id'] = $foundUser['id'];
$_SESSION['username'] = $foundUser['username'];
$_SESSION['role'] = $foundUser['role'];

// Убираем пароль из ответа
unset($foundUser['password']);

sendResponse(array(
    'success' => true,
    'message' => 'Вход выполнен успешно!',
    'user' => $foundUser
));
?>