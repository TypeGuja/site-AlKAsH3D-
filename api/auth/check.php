<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

session_start();

$usersFile = __DIR__ . '/../../data_site/user/users.json';

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

if (!isset($_SESSION['user_id'])) {
    sendResponse(array(
        'authenticated' => false,
        'message' => 'Не авторизован'
    ));
}

$users = getUsers($usersFile);
$userData = null;

foreach ($users as $user) {
    if ($user['id'] === $_SESSION['user_id']) {
        $userData = $user;
        break;
    }
}

if (!$userData) {
    session_destroy();
    sendResponse(array(
        'authenticated' => false,
        'message' => 'Пользователь не найден'
    ));
}

// Добавляем роль в ответ
unset($userData['password']);

sendResponse(array(
    'authenticated' => true,
    'user' => $userData,
    'role' => $userData['role'] ?? 'user'
));
?>