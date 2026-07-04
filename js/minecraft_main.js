/**
 * ============================================
 * MINECRAFT — ДИНАМИЧЕСКАЯ ЗАГРУЗКА С СЕРВЕРА
 * ============================================
 */

// ====== НАСТРОЙКИ ======
const API_URL = "../api/minecraft/minecraft_products.php";

// ====== ОСНОВНЫЕ ФУНКЦИИ ======

/**
 * Загружает товары с сервера
 */
function loadProducts() {
    console.log('🔄 Загрузка товаров с сервера...');

    fetch(API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка сервера: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log('✅ Загружено товаров:', data.count);
                renderMinecraftCards('minecraftGridFull', data.products);
                renderCategories(data.products);
            } else {
                throw new Error(data.error || 'Неизвестная ошибка');
            }
        })
        .catch(error => {
            console.error('❌ Ошибка загрузки:', error);
            showNotification('Не удалось загрузить товары. Проверьте сервер.', 'error');
        });
}

/**
 * Создаёт карточки товаров
 */
function renderMinecraftCards(containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Контейнер #' + containerId + ' не найден');
        return;
    }

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 0; color: #888;">
                <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 16px;"></i>
                <h3>Товаров пока нет</h3>
                <p>Добавьте первый товар через API или админ-панель.</p>
            </div>
        `;
        return;
    }

    let html = '';
    products.forEach(function(product) {
        html += `
            <div class="mc-card" data-id="${product.id}">
                <span class="tag">${product.tag || 'Новинка'}</span>
                <h4>${product.name}</h4>
                <p>${product.desc || 'Описание отсутствует'}</p>
                <div class="meta">${product.price || 'Цена не указана'}</div>
                <button class="btn-card" data-id="${product.id}">
                    Купить сейчас
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Создаёт категории с подсчётом товаров
 */
function renderCategories(products) {
    const container = document.querySelector('.section-3d .features-grid');
    if (!container) return;

    // Собираем категории из товаров
    const categories = {};
    products.forEach(function(product) {
        const cat = product.category || 'Другое';
        if (!categories[cat]) {
            categories[cat] = { count: 0, products: [] };
        }
        categories[cat].count++;
        categories[cat].products.push(product);
    });

    // Иконки для категорий
    const icons = {
        'Плагины': 'fa-cog',
        'Моды': 'fa-cubes',
        'Скины': 'fa-user',
        'Карты': 'fa-map',
        'Ресурспаки': 'fa-paint-roller',
        'Датапаки': 'fa-microphone',
        'Другое': 'fa-folder'
    };

    let html = '';
    for (const [name, data] of Object.entries(categories)) {
        const icon = icons[name] || 'fa-folder';
        html += `
            <div class="feature-item category-item" 
                 style="border: 1px solid #eee; border-radius: 12px; padding: 24px; text-align: center; cursor: pointer;" 
                 data-category="${name}">
                <i class="fas ${icon}" style="font-size: 32px;"></i>
                <h3>${name}</h3>
                <p>${data.count} товаров</p>
                <span style="display: inline-block; margin-top: 8px; background: #ff6b00; color: #fff; padding: 2px 12px; border-radius: 30px; font-size: 12px;">
                    ${data.count} доступно
                </span>
            </div>
        `;
    }

    container.innerHTML = html;

    // Добавляем фильтрацию по клику
    document.querySelectorAll('.category-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const category = this.dataset.category;
            if (category) {
                filterByCategory(category);
            }
        });
    });
}

// ============================================
// ====== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ======

/**
 * Добавляет новый товар (через API)
 */
function addProduct(productData) {
    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('✅ Товар "' + productData.name + '" добавлен!', 'success');
                loadProducts(); // Перезагружаем список
            } else {
                showNotification('❌ Ошибка: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка добавления:', error);
            showNotification('❌ Ошибка сервера', 'error');
        });
}

/**
 * Удаляет товар (через API)
 */
function deleteProduct(id) {
    fetch(API_URL + '?id=' + id, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('🗑️ Товар удалён', 'info');
                loadProducts(); // Перезагружаем список
            } else {
                showNotification('❌ Ошибка: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка удаления:', error);
            showNotification('❌ Ошибка сервера', 'error');
        });
}

/**
 * Фильтрует товары по категории
 */
function filterByCategory(category) {
    loadProducts(); // Просто перезагружаем, а можно сделать фильтрацию на клиенте
    showNotification('🔍 Фильтр: ' + category, 'info');
}

// ============================================
// ====== УВЕДОМЛЕНИЯ ======

function showNotification(message, type) {
    const old = document.querySelector('.notification');
    if (old) old.remove();

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    const colors = {
        success: '#1e1e1e',
        error: '#d32f2f',
        info: '#1e1e1e'
    };

    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 16px 24px;
        background: ${colors[type] || '#1e1e1e'};
        color: #fff;
        border-radius: 8px;
        font-weight: 500;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 320px;
        border-left: 4px solid #ff6b00;
    `;

    document.body.appendChild(notification);

    setTimeout(function() {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(function() {
            notification.remove();
        }, 300);
    }, 3000);
}

// ============================================
// ====== АДМИН-ФУНКЦИИ (для консоли) ======

// Делаем функции доступными в консоли для администрирования
window.admin = {
    add: function(name, desc, price, category, tag) {
        addProduct({
            name: name,
            desc: desc || 'Описание отсутствует',
            price: price || 'Цена не указана',
            category: category || 'Другое',
            tag: tag || 'Новинка'
        });
    },
    delete: function(id) {
        if (confirm('Удалить товар #' + id + '?')) {
            deleteProduct(id);
        }
    },
    reload: function() {
        loadProducts();
    }
};

// ============================================
// ====== ИНИЦИАЛИЗАЦИЯ ======

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Minecraft Маркет загружен');
    console.log('📡 API:', API_URL);
    console.log('💡 Для администрирования используйте admin.add() или admin.delete()');

    // Добавляем стили для анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .mc-card { transition: all 0.3s; }
        .mc-card:hover { transform: translateX(4px); }
        .category-item { transition: all 0.3s; }
        .category-item:hover { 
            border-color: #ff6b00 !important; 
            transform: translateY(-4px);
        }
    `;
    document.head.appendChild(style);

    // Загружаем товары
    loadProducts();
});