<?php
/**
 * ============================================
 * API УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ
 * ============================================
 *
 * ТОЛЬКО ДЛЯ АДМИНИСТРАТОРОВ
 *
 * GET    → Получить всех пользователей
 * PUT    → Изменить роль пользователя
 * DELETE → Удалить пользователя
 * ============================================
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

// ============================================
// ПУТИ К ФАЙЛАМ
// ============================================

$usersFile = __DIR__ . '/../../data_site/user/users.json';

// ============================================
// ПРОВЕРКА ПРАВ ДОСТУПА
// ============================================

function checkAdmin() {
    global $usersFile;

    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Не авторизован']);
        exit;
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
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Пользователь не найден']);
        exit;
    }

    $role = $userData['role'] ?? 'user';

    if ($role !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Недостаточно прав (требуется admin)']);
        exit;
    }

    return $userData;
}

// ============================================
// ФУНКЦИИ РАБОТЫ С ДАННЫМИ
// ============================================

function getUsers($file) {
    if (!file_exists($file)) {
        file_put_contents($file, json_encode(array()));
        return array();
    }
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    return is_array($data) ? $data : array();
}

function saveUsers($file, $users) {
    return file_put_contents($file, json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function sendError($message, $statusCode = 400) {
    sendResponse(['success' => false, 'error' => $message], $statusCode);
}

// ============================================
// ПРОВЕРЯЕМ ПРАВА
// ============================================

$adminUser = checkAdmin();

// ============================================
// ОБРАБОТКА ЗАПРОСОВ
// ============================================

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {

    // ====== GET — ПОЛУЧИТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ ======
    case 'GET':
        $users = getUsers($usersFile);

        // Убираем пароли из ответа
        foreach ($users as &$user) {
            unset($user['password']);
        }

        sendResponse([
            'success' => true,
            'count' => count($users),
            'users' => $users
        ]);
        break;

    // ====== PUT — ИЗМЕНИТЬ РОЛЬ ======
    case 'PUT':
        $id = isset($input['id']) ? (int)$input['id'] : null;
        $newRole = isset($input['role']) ? trim($input['role']) : null;

        if (!$id) {
            sendError('ID пользователя обязателен');
        }

        if (!$newRole) {
            sendError('Роль обязательна');
        }

        // Разрешённые роли
        $allowedRoles = ['user', 'admin', 'moderator'];
        if (!in_array($newRole, $allowedRoles)) {
            sendError('Недопустимая роль. Разрешённые: ' . implode(', ', $allowedRoles));
        }

        $users = getUsers($usersFile);
        $found = false;
        $targetUser = null;

        foreach ($users as &$user) {
            if ($user['id'] == $id) {
                // Нельзя менять роль самому себе
                if ($user['id'] === $_SESSION['user_id']) {
                    sendError('Нельзя изменить свою собственную роль');
                }

                // Нельзя менять роль последнего админа
                if ($user['role'] === 'admin' && $newRole !== 'admin') {
                    $adminCount = 0;
                    foreach ($users as $u) {
                        if (($u['role'] ?? 'user') === 'admin') {
                            $adminCount++;
                        }
                    }
                    if ($adminCount <= 1) {
                        sendError('Нельзя удалить последнего администратора');
                    }
                }

                $user['role'] = $newRole;
                $found = true;
                $targetUser = $user;
                break;
            }
        }

        if (!$found) {
            sendError('Пользователь с ID ' . $id . ' не найден', 404);
        }

        saveUsers($usersFile, $users);

        // Убираем пароль из ответа
        unset($targetUser['password']);

        sendResponse([
            'success' => true,
            'message' => 'Роль пользователя обновлена успешно',
            'user' => $targetUser
        ]);
        break;

    // ====== DELETE — УДАЛИТЬ ПОЛЬЗОВАТЕЛЯ ======
    case 'DELETE':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

        if (!$id) {
            sendError('ID пользователя обязателен');
        }

        $users = getUsers($usersFile);
        $found = false;
        $targetUser = null;

        foreach ($users as $key => $user) {
            if ($user['id'] == $id) {
                // Нельзя удалить самого себя
                if ($user['id'] === $_SESSION['user_id']) {
                    sendError('Нельзя удалить самого себя');
                }

                // Нельзя удалить последнего админа
                if (($user['role'] ?? 'user') === 'admin') {
                    $adminCount = 0;
                    foreach ($users as $u) {
                        if (($u['role'] ?? 'user') === 'admin') {
                            $adminCount++;
                        }
                    }
                    if ($adminCount <= 1) {
                        sendError('Нельзя удалить последнего администратора');
                    }
                }

                $targetUser = $user;
                unset($users[$key]);
                $found = true;
                break;
            }
        }

        if (!$found) {
            sendError('Пользователь с ID ' . $id . ' не найден', 404);
        }

        $users = array_values($users);
        saveUsers($usersFile, $users);

        // Убираем пароль из ответа
        unset($targetUser['password']);

        sendResponse([
            'success' => true,
            'message' => 'Пользователь удалён успешно',
            'user' => $targetUser
        ]);
        break;

    // ====== НЕИЗВЕСТНЫЙ МЕТОД ======
    default:
        sendError('Метод ' . $method . ' не поддерживается', 405);
        break;
}
?>