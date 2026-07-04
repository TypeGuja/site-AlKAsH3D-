<?php
/**
 * ============================================
 * API УПРАВЛЕНИЯ ТОВАРАМИ (ТОЛЬКО ДЛЯ ADMIN)
 * ============================================
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

$usersFile = __DIR__ . '/../../data_site/user/users.json';
$productsFile = __DIR__ . '/../../data_site/minecraft/minecraft-products.json';

// ============================================
// ПРОВЕРКА РОЛИ
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
        return array();
    }
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    return is_array($data) ? $data : array();
}

function getProducts($file) {
    if (!file_exists($file)) {
        file_put_contents($file, json_encode(array()));
        return array();
    }
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    return is_array($data) ? $data : array();
}

function saveProducts($file, $products) {
    return file_put_contents($file, json_encode($products, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function generateId($products) {
    if (empty($products)) return 1;
    $maxId = 0;
    foreach ($products as $product) {
        if (isset($product['id']) && $product['id'] > $maxId) {
            $maxId = $product['id'];
        }
    }
    return $maxId + 1;
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

    // ====== GET — ПОЛУЧИТЬ ВСЕ ТОВАРЫ ======
    case 'GET':
        $products = getProducts($productsFile);
        sendResponse([
            'success' => true,
            'count' => count($products),
            'products' => $products
        ]);
        break;

    // ====== POST — ДОБАВИТЬ ТОВАР ======
    case 'POST':
        if (empty($input['name'])) {
            sendError('Поле "name" обязательно');
        }

        $products = getProducts($productsFile);

        $newProduct = [
            'id' => generateId($products),
            'name' => trim($input['name']),
            'desc' => isset($input['desc']) ? trim($input['desc']) : 'Описание отсутствует',
            'tag' => isset($input['tag']) ? trim($input['tag']) : 'Новинка',
            'price' => isset($input['price']) ? trim($input['price']) : 'Цена не указана',
            'category' => isset($input['category']) ? trim($input['category']) : 'Другое',
            'date_added' => date('Y-m-d H:i:s'),
            'added_by' => $adminUser['username']
        ];

        $products[] = $newProduct;
        saveProducts($productsFile, $products);

        sendResponse([
            'success' => true,
            'product' => $newProduct,
            'message' => 'Товар добавлен успешно'
        ], 201);
        break;

    // ====== PUT — ОБНОВИТЬ ТОВАР ======
    case 'PUT':
        $id = isset($input['id']) ? (int)$input['id'] : null;
        if (!$id) {
            sendError('ID товара обязателен');
        }

        $products = getProducts($productsFile);
        $found = false;

        foreach ($products as &$product) {
            if ($product['id'] == $id) {
                if (isset($input['name'])) $product['name'] = trim($input['name']);
                if (isset($input['desc'])) $product['desc'] = trim($input['desc']);
                if (isset($input['tag'])) $product['tag'] = trim($input['tag']);
                if (isset($input['price'])) $product['price'] = trim($input['price']);
                if (isset($input['category'])) $product['category'] = trim($input['category']);
                $product['updated_by'] = $adminUser['username'];
                $found = true;
                break;
            }
        }

        if (!$found) {
            sendError('Товар с ID ' . $id . ' не найден', 404);
        }

        saveProducts($productsFile, $products);
        sendResponse(['success' => true, 'message' => 'Товар обновлён успешно']);
        break;

    // ====== DELETE — УДАЛИТЬ ТОВАР ======
    case 'DELETE':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : null;
        if (!$id) {
            sendError('ID товара обязателен');
        }

        $products = getProducts($productsFile);
        $found = false;

        foreach ($products as $key => $product) {
            if ($product['id'] == $id) {
                unset($products[$key]);
                $found = true;
                break;
            }
        }

        if (!$found) {
            sendError('Товар с ID ' . $id . ' не найден', 404);
        }

        $products = array_values($products);
        saveProducts($productsFile, $products);
        sendResponse(['success' => true, 'message' => 'Товар удалён успешно']);
        break;

    default:
        sendError('Метод ' . $method . ' не поддерживается', 405);
        break;
}
?>