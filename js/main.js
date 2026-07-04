/**
 * ============================================
 * Print & Mod Hub — Основная логика
 * ============================================
 */

// ============================================
// 1. ДАННЫЕ (МАССИВЫ С ТОВАРАМИ)
// ============================================

// Товары для 3D-печати
const threeDItems = [
    {
        name: 'Фигурка Minecraft',
        desc: 'Стив 15 см, цветной PLA',
        price: 'от 1200 ₽'
    },
    {
        name: 'Корпус для ПК',
        desc: 'Индивидуальный дизайн, прочный ABS',
        price: 'от 3400 ₽'
    },
    {
        name: 'Прототип детали',
        desc: 'Точность 0.1 мм, инженерный пластик',
        price: 'от 2000 ₽'
    },
    {
        name: 'Ваза с узором',
        desc: 'Дизайнерская ваза, фотополимер',
        price: 'от 2500 ₽'
    },
    {
        name: 'Держатель для телефона',
        desc: 'Эргономичный дизайн, нейлон',
        price: 'от 800 ₽'
    },
    {
        name: 'Макет здания',
        desc: 'Архитектурный макет, масштаб 1:200',
        price: 'от 5000 ₽'
    }
];

// Товары для Minecraft
const minecraftItems = [
    {
        name: '🔥 MegaPlugin Suite',
        desc: '20+ плагинов для выживания и мини-игр',
        tag: 'Хит',
        price: '1490 ₽'
    },
    {
        name: 'Волшебная сборка модов',
        desc: '90+ магических модов для Forge 1.19',
        tag: 'Обновлено',
        price: '990 ₽'
    },
    {
        name: 'Скины + Маски',
        desc: 'Набор из 50 премиум скинов и масок',
        tag: 'Сезонное',
        price: '390 ₽'
    },
    {
        name: '🌍 Карта приключений',
        desc: 'Готовая RPG-карта с квестами',
        tag: 'Новинка',
        price: '750 ₽'
    },
    {
        name: 'Ресурспак 512x',
        desc: 'Реалистичные текстуры для шейдеров',
        tag: 'Премиум',
        price: '590 ₽'
    },
    {
        name: 'Команды для сервера',
        desc: 'Набор из 50+ кастомных команд',
        tag: 'Для админов',
        price: '1200 ₽'
    }
];

// ============================================
// 2. КОРЗИНА (СОСТОЯНИЕ)
// ============================================

let cart = [];

// ============================================
// 3. ФУНКЦИИ РЕНДЕРИНГА
// ============================================

/**
 * Отрисовывает карточки 3D-печати
 */
function render3D() {
    const grid = document.getElementById('threeDGrid');

    if (!grid) {
        console.error('Элемент #threeDGrid не найден');
        return;
    }

    let html = '';

    threeDItems.forEach(function(item) {
        html += `
            <div class="card">
                <h4>${item.name}</h4>
                <p>${item.desc}</p>
                <div class="price">${item.price}</div>
                <button class="btn-card" data-type="3d" data-name="${item.name}">
                    Заказать печать
                </button>
            </div>
        `;
    });

    grid.innerHTML = html;
}

/**
 * Отрисовывает карточки Minecraft-маркета
 */
function renderMinecraft() {
    const grid = document.getElementById('minecraftGrid');

    if (!grid) {
        console.error('Элемент #minecraftGrid не найден');
        return;
    }

    let html = '';

    minecraftItems.forEach(function(item) {
        html += `
            <div class="mc-card">
                <span class="tag">${item.tag}</span>
                <h4>${item.name}</h4>
                <p>${item.desc}</p>
                <div class="meta">${item.price}</div>
                <button class="btn-card" data-type="mc" data-name="${item.name}" data-price="${item.price}">
                    Купить сейчас
                </button>
            </div>
        `;
    });

    grid.innerHTML = html;
}

/**
 * Обновляет счётчик корзины в навигации
 */
function updateCartCounter() {
    const counter = document.querySelector('.cart-counter');

    if (counter) {
        counter.textContent = cart.length;
    }
}

/**
 * Показывает уведомление о добавлении в корзину
 */
function showNotification(message, type) {
    // Удаляем старое уведомление, если есть
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'notification notification-' + type;
    notification.textContent = message;

    // Стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#1e1e1e' : '#ff6b00'};
        color: #fff;
        border-radius: 8px;
        font-weight: 500;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 320px;
    `;

    document.body.appendChild(notification);

    // Удаляем через 3 секунды
    setTimeout(function() {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';

        setTimeout(function() {
            notification.remove();
        }, 300);
    }, 3000);
}

// ============================================
// 4. ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================

/**
 * Настраивает обработчики событий
 */
function setupEventListeners() {
    // Обработка кликов по всему документу
    document.addEventListener('click', function(e) {
        const target = e.target;
        const button = target.closest('button');

        if (!button) return;

        // ----- Кнопки в карточках -----
        if (button.classList.contains('btn-card')) {
            const type = button.dataset.type;
            const name = button.dataset.name;
            const price = button.dataset.price;

            if (type === '3d') {
                // Заказ 3D-печати
                showNotification(
                    '🔧 Заказ на 3D-печать "' + name + '" оформлен! Мы свяжемся с вами.',
                    'success'
                );
            } else if (type === 'mc') {
                // Добавление в корзину Minecraft
                const item = {
                    name: name,
                    price: price
                };
                cart.push(item);
                updateCartCounter();

                showNotification(
                    '🎮 "' + name + '" добавлен в корзину! Всего товаров: ' + cart.length,
                    'success'
                );
            }
            return;
        }

        // ----- Кнопки в герое (скролл) -----
        if (button.id === 'startOrder') {
            const section = document.querySelector('.section-3d');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        }

        if (button.id === 'exploreMarket') {
            const section = document.querySelector('.section-minecraft');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // ----- Кнопка корзины (можно добавить позже) -----
        if (button.id === 'cartButton') {
            if (cart.length === 0) {
                showNotification('🛒 Корзина пуста', 'info');
            } else {
                let message = '🛒 В корзине:\n';
                cart.forEach(function(item, index) {
                    message += (index + 1) + '. ' + item.name + ' — ' + item.price + '\n';
                });
                alert(message);
            }
        }
    });
}

// ============================================
// 5. ДОПОЛНИТЕЛЬНЫЕ УЛУЧШЕНИЯ
// ============================================

/**
 * Добавляет иконку корзины в навигацию
 */
function addCartIcon() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const cartButton = document.createElement('button');
    cartButton.className = 'btn-outline-light';
    cartButton.id = 'cartButton';
    cartButton.innerHTML = '<i class="fas fa-shopping-cart"></i> <span class="cart-counter">0</span>';
    cartButton.style.position = 'relative';

    // Добавляем счётчик
    const counter = document.createElement('span');
    counter.className = 'cart-counter';
    counter.textContent = '0';
    counter.style.cssText = `
        background: #ff6b00;
        color: #fff;
        border-radius: 50%;
        padding: 1px 6px;
        font-size: 11px;
        margin-left: 4px;
    `;

    // Находим существующий счётчик или создаём
    const existingCounter = cartButton.querySelector('.cart-counter');
    if (existingCounter) {
        existingCounter.textContent = '0';
    } else {
        cartButton.appendChild(counter);
    }

    // Вставляем перед кнопкой "Заказать"
    const orderButton = navActions.querySelector('.btn-primary');
    if (orderButton) {
        navActions.insertBefore(cartButton, orderButton);
    } else {
        navActions.appendChild(cartButton);
    }
}

/**
 * Добавляет анимацию для уведомлений
 */
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .notification {
            animation: slideIn 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// 6. ИНИЦИАЛИЗАЦИЯ
// ============================================

/**
 * Главная функция запуска
 */
function init() {
    console.log('🖨️ Print&Mod — Интегральная платформа для творчества.');
    console.log('📦 Товаров для 3D-печати:', threeDItems.length);
    console.log('🎮 Товаров для Minecraft:', minecraftItems.length);

    // Добавляем анимации
    addAnimationStyles();

    // Добавляем иконку корзины
    addCartIcon();

    // Отрисовываем карточки
    render3D();
    renderMinecraft();

    // Настраиваем события
    setupEventListeners();
}

// Запускаем после загрузки DOM
document.addEventListener('DOMContentLoaded', init);