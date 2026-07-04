<?php
/**
 * ============================================
 * API РЕГИСТРАЦИИ
 * ============================================
 *
 * POST /api/auth/register.php
 *
 * Параметры: username, email, password
 *
 * - Если это первый пользователь → роль 'admin'
 * - Все остальные → роль 'user'
 * ============================================
 */

// Настройки
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// ============================================
// ПУТИ К ФАЙЛАМ
// ============================================

$usersFile = __DIR__ . '/../../data_site/users.json';

// ============================================
// ФУНКЦИИ
// ============================================

/**
 * Получить всех пользователей
 */
function getUsers($file) {
    if (!file_exists($file)) {
        // Если файла нет — создаём пустой массив
        file_put_contents($file, json_encode(array()));
        return array();
    }

    $content = file_get_contents($file);
    $data = json_decode($content, true);

    if (is_array($data)) {
        return $data;
    }

    return array();
}

/**
 * Сохранить пользователей
 */
function saveUsers($file, $users) {
    $json = json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return file_put_contents($file, $json);
}

/**
 * Ответ в JSON
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

/**
 * Ошибка
 */
function sendError($message, $statusCode = 400) {
    sendResponse(array(
        'success' => false,
        'error' => $message
    ), $statusCode);
}

// ============================================
// ПРОВЕРКА МЕТОДА
// ============================================

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Метод не поддерживается', 405);
}

// ============================================
// ПОЛУЧАЕМ ДАННЫЕ
// ============================================

$input = json_decode(file_get_contents('php://input'), true);

// Проверяем обязательные поля
if (empty($input['username'])) {
    sendError('Имя пользователя обязательно');
}

if (empty($input['email'])) {
    sendError('Email обязателен');
}

if (empty($input['password'])) {
    sendError('Пароль обязателен');
}

// Очищаем данные
$username = trim($input['username']);
$email = trim($input['email']);
$password = $input['password'];

// ============================================
// ВАЛИДАЦИЯ
// ============================================

// Проверка длины имени
if (strlen($username) < 3) {
    sendError('Имя пользователя должно быть минимум 3 символа');
}

// Проверка формата email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Некорректный email');
}

// Проверка длины пароля
if (strlen($password) < 6) {
    sendError('Пароль должен быть минимум 6 символов');
}

// ============================================
// ПРОВЕРКА НА СУЩЕСТВОВАНИЕ
// ============================================

$users = getUsers($usersFile);

// Проверяем имя
foreach ($users as $user) {
    if ($user['username'] === $username) {
        sendError('Пользователь с таким именем уже существует');
    }
    if ($user['email'] === $email) {
        sendError('Пользователь с таким email уже существует');
    }
}

// ============================================
// СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ
// ============================================

// Хешируем пароль
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Генерируем ID
$newId = count($users) + 1;

// ============================================
// ⭐ ГЛАВНОЕ: ПЕРВЫЙ ПОЛЬЗОВАТЕЛЬ — АДМИН
// ============================================

// Если это первый пользователь — даём роль admin
$role = (count($users) === 0) ? 'admin' : 'user';

// Создаём пользователя
$newUser = array(
    'id' => $newId,
    'username' => $username,
    'email' => $email,
    'password' => $hashedPassword,
    'role' => $role,
    'created_at' => date('Y-m-d H:i:s')
);

// Добавляем в массив
$users[] = $newUser;

// Сохраняем в файл
saveUsers($usersFile, $users);

// ============================================
// ОТВЕТ (без пароля)
// ============================================

// Убираем пароль из ответа
$userResponse = $newUser;
unset($userResponse['password']);

sendResponse(array(
    'success' => true,
    'message' => ($role === 'admin')
        ? 'Вы зарегистрированы как АДМИНИСТРАТОР! (первый пользователь)'
        : 'Регистрация успешна!',
    'user' => $userResponse,
    'role' => $role
), 201);
?>