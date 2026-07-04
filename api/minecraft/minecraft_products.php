<?php
/**
 * ============================================
 * API ДЛЯ РАБОТЫ С ТОВАРАМИ MINECRAFT
 * ============================================
 * PHP 7.0+ СОВМЕСТИМЫЙ
 * ============================================
 */

// ============================================
// НАСТРОЙКИ
// ============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// preflight-запрос
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// ============================================
// ПУТЬ К ФАЙЛУ (правильный)
// ============================================

// Из папки api/minecraft/ → data_site/minecraft/minecraft-products.json
$dataFile = __DIR__ . '/../../data_site/minecraft/minecraft-products.json';

// ============================================
// ФУНКЦИИ
// ============================================

/**
 * Получить все товары
 */
function getProducts($dataFile) {
    // Если файла нет — создаём пустой
    if (!file_exists($dataFile)) {
        $dir = dirname($dataFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        file_put_contents($dataFile, json_encode(array()));
        return array();
    }

    $content = file_get_contents($dataFile);
    $data = json_decode($content, true);

    if (is_array($data)) {
        return $data;
    }

    return array();
}

/**
 * Сохранить товары
 */
function saveProducts($dataFile, $products) {
    $json = json_encode($products, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return file_put_contents($dataFile, $json);
}

/**
 * Сгенерировать новый ID
 */
function generateId($products) {
    if (empty($products)) {
        return 1;
    }

    $maxId = 0;
    foreach ($products as $product) {
        if (isset($product['id']) && $product['id'] > $maxId) {
            $maxId = $product['id'];
        }
    }

    return $maxId + 1;
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
// ПОЛУЧАЕМ ДАННЫЕ
// ============================================

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// ============================================
// ОБРАБОТЧИКИ
// ============================================

switch ($method) {

    // ====== GET — ПОЛУЧИТЬ ВСЕ ======
    case 'GET':
        $products = getProducts($dataFile);
        sendResponse(array(
            'success' => true,
            'count' => count($products),
            'products' => $products
        ));
        break;

    // ====== POST — ДОБАВИТЬ ======
    case 'POST':
        // Проверяем данные
        if (!$input) {
            sendError('Неверный формат данных');
        }

        if (empty($input['name'])) {
            sendError('Поле "name" обязательно');
        }

        $products = getProducts($dataFile);

        $newProduct = array(
            'id' => generateId($products),
            'name' => trim($input['name']),
            'desc' => isset($input['desc']) ? trim($input['desc']) : 'Описание отсутствует',
            'tag' => isset($input['tag']) ? trim($input['tag']) : 'Новинка',
            'price' => isset($input['price']) ? trim($input['price']) : 'Цена не указана',
            'category' => isset($input['category']) ? trim($input['category']) : 'Другое',
            'date_added' => date('Y-m-d H:i:s')
        );

        $products[] = $newProduct;
        saveProducts($dataFile, $products);

        sendResponse(array(
            'success' => true,
            'product' => $newProduct,
            'message' => 'Товар добавлен успешно'
        ), 201);
        break;

    // ====== PUT — ОБНОВИТЬ ======
    case 'PUT':
        if (!$input) {
            sendError('Неверный формат данных');
        }

        $id = isset($input['id']) ? (int)$input['id'] : null;

        if (!$id) {
            sendError('ID товара обязателен');
        }

        $products = getProducts($dataFile);
        $found = false;

        foreach ($products as $key => &$product) {
            if ($product['id'] == $id) {
                if (isset($input['name'])) $product['name'] = trim($input['name']);
                if (isset($input['desc'])) $product['desc'] = trim($input['desc']);
                if (isset($input['tag'])) $product['tag'] = trim($input['tag']);
                if (isset($input['price'])) $product['price'] = trim($input['price']);
                if (isset($input['category'])) $product['category'] = trim($input['category']);
                $found = true;
                break;
            }
        }

        if (!$found) {
            sendError('Товар с ID ' . $id . ' не найден', 404);
        }

        saveProducts($dataFile, $products);

        sendResponse(array(
            'success' => true,
            'message' => 'Товар обновлён успешно'
        ));
        break;

    // ====== DELETE — УДАЛИТЬ ======
    case 'DELETE':
        $id = null;

        // ID из URL: ?id=5
        if (isset($_GET['id'])) {
            $id = (int)$_GET['id'];
        }
        // ID из body
        elseif ($input && isset($input['id'])) {
            $id = (int)$input['id'];
        }

        if (!$id) {
            sendError('ID товара обязателен');
        }

        $products = getProducts($dataFile);
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

        // Переиндексация массива
        $products = array_values($products);
        saveProducts($dataFile, $products);

        sendResponse(array(
            'success' => true,
            'message' => 'Товар удалён успешно'
        ));
        break;

    // ====== НЕИЗВЕСТНЫЙ МЕТОД ======
    default:
        sendError('Метод ' . $method . ' не поддерживается', 405);
        break;
}
?>