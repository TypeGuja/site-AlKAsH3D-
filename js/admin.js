/**
 * ============================================
 * АДМИН-ПАНЕЛЬ — ПОЛНАЯ ЛОГИКА
 * ============================================
 *
 * Управление товарами + управление пользователями
 * ============================================
 */

// ====== НАСТРОЙКИ ======
const API = {
    products: '../api/admin/products.php',
    users: '../api/admin/users.php',
    check: '../api/auth/check.php',
    logout: '../api/auth/logout.php'
};

let products = [];
let currentUser = null;
let editingId = null;
let currentTab = 'products';

// ============================================
// ====== ПРОВЕРКА АВТОРИЗАЦИИ ======
// ============================================

function checkAdminAuth() {
    fetch(API.check)
        .then(response => response.json())
        .then(data => {
            if (!data.authenticated) {
                window.location.href = 'index.html';
                return;
            }
            if (data.role !== 'admin') {
                alert('Доступ запрещён. Требуются права администратора.');
                window.location.href = 'index.html';
                return;
            }
            currentUser = data.user;
            document.getElementById('adminUser').textContent = currentUser.username;
            loadProducts();
            loadUsers();
        })
        .catch(() => {
            window.location.href = 'index.html';
        });
}

// ============================================
// ====== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ======
// ============================================

function switchTab(tab) {
    currentTab = tab;

    // Скрываем все
    document.querySelectorAll('.admin-tab-content').forEach(el => {
        el.style.display = 'none';
    });

    // Показываем нужную
    document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).style.display = 'block';

    // Обновляем кнопки
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.style.background = '#333';
    });
    document.querySelector(`.admin-tab-btn[data-tab="${tab}"]`).style.background = '#ff6b00';
}

// ============================================
// ====== ТОВАРЫ — ЗАГРУЗКА ======
// ============================================

function loadProducts() {
    fetch(API.products)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                products = data.products || [];
                renderProductsTable(products);
                updateStats(products);
            } else {
                showNotification('❌ ' + data.error, 'error');
            }
        })
        .catch(() => {
            showNotification('❌ Ошибка загрузки товаров', 'error');
        });
}

// ============================================
// ====== ТОВАРЫ — ОТРИСОВКА ТАБЛИЦЫ ======
// ============================================

function renderProductsTable(items) {
    const tbody = document.getElementById('productsTableBody');

    if (!items || items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-box-open" style="font-size: 32px; display: block; margin-bottom: 12px;"></i>
                    Товаров пока нет
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    items.forEach(product => {
        html += `
            <tr>
                <td>#${product.id}</td>
                <td><strong>${product.name}</strong></td>
                <td>${product.desc || '-'}</td>
                <td><span class="tag-badge">${product.tag || 'Новинка'}</span></td>
                <td>${product.price || '—'}</td>
                <td><span class="category-badge">${product.category || 'Другое'}</span></td>
                <td>
                    <div class="actions">
                        <button class="btn-icon edit" onclick="openEditModal(${product.id})" title="Редактировать">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn-icon delete" onclick="deleteProduct(${product.id})" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// ============================================
// ====== ТОВАРЫ — СТАТИСТИКА ======
// ============================================

function updateStats(items) {
    const total = items.length;
    const categories = {};
    items.forEach(p => {
        const cat = p.category || 'Другое';
        categories[cat] = (categories[cat] || 0) + 1;
    });

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCategories').textContent = Object.keys(categories).length;
    document.getElementById('statLatest').textContent = items.length > 0 ? items[items.length - 1].name : '—';

    const hits = items.filter(p => p.tag === 'Хит').length;
    document.getElementById('statHits').textContent = hits;
}

// ============================================
// ====== ТОВАРЫ — ПОИСК И ФИЛЬТРАЦИЯ ======
// ============================================

function filterTable() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;

    let filtered = products;

    if (search) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(search) ||
            (p.desc && p.desc.toLowerCase().includes(search)) ||
            (p.tag && p.tag.toLowerCase().includes(search))
        );
    }

    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }

    renderProductsTable(filtered);
}

// ============================================
// ====== ТОВАРЫ — ДОБАВЛЕНИЕ / РЕДАКТИРОВАНИЕ ======
// ============================================

function openAddModal() {
    editingId = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> Добавить товар';
    document.getElementById('productName').value = '';
    document.getElementById('productDesc').value = '';
    document.getElementById('productTag').value = 'Новинка';
    document.getElementById('productPrice').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('adminProductModal').classList.add('active');
}

function openEditModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    editingId = id;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-pen"></i> Редактировать товар';
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productDesc').value = product.desc || '';
    document.getElementById('productTag').value = product.tag || 'Новинка';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('adminProductModal').classList.add('active');
}

function closeAdminModal() {
    document.getElementById('adminProductModal').classList.remove('active');
}

function saveProduct() {
    const name = document.getElementById('productName').value.trim();
    const desc = document.getElementById('productDesc').value.trim();
    const tag = document.getElementById('productTag').value.trim();
    const price = document.getElementById('productPrice').value.trim();
    const category = document.getElementById('productCategory').value.trim();

    if (!name) {
        showNotification('❌ Введите название товара', 'error');
        return;
    }

    const data = { name, desc, tag, price, category };
    const method = editingId ? 'PUT' : 'POST';
    if (editingId) data.id = editingId;

    fetch(API.products, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showNotification('✅ ' + result.message, 'success');
                closeAdminModal();
                loadProducts();
            } else {
                showNotification('❌ ' + result.error, 'error');
            }
        })
        .catch(() => {
            showNotification('❌ Ошибка сервера', 'error');
        });
}

// ============================================
// ====== ТОВАРЫ — УДАЛЕНИЕ ======
// ============================================

function deleteProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    if (!confirm('Удалить товар "' + product.name + '"?')) return;

    fetch(API.products + '?id=' + id, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showNotification('✅ ' + result.message, 'success');
                loadProducts();
            } else {
                showNotification('❌ ' + result.error, 'error');
            }
        })
        .catch(() => {
            showNotification('❌ Ошибка сервера', 'error');
        });
}

// ============================================
// ====== ПОЛЬЗОВАТЕЛИ — ЗАГРУЗКА ======
// ============================================

function loadUsers() {
    fetch(API.users)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderUsersTable(data.users);
                document.getElementById('usersCount').textContent = data.count + ' пользователей';
            } else {
                showNotification('❌ ' + data.error, 'error');
            }
        })
        .catch(() => {
            showNotification('❌ Ошибка загрузки пользователей', 'error');
        });
}

// ============================================
// ====== ПОЛЬЗОВАТЕЛИ — ОТРИСОВКА ТАБЛИЦЫ ======
// ============================================

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');

    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-user-slash" style="font-size: 32px; display: block; margin-bottom: 12px;"></i>
                    Пользователей нет
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    users.forEach(user => {
        const isCurrentUser = user.id === currentUser?.id;
        const roleColor = user.role === 'admin' ? '#ff6b00' : user.role === 'moderator' ? '#4caf50' : '#888';

        html += `
            <tr>
                <td>#${user.id}</td>
                <td><strong>${user.username}</strong> ${isCurrentUser ? '👑' : ''}</td>
                <td>${user.email}</td>
                <td>
                    <select class="role-select" data-id="${user.id}" style="
                        padding: 4px 8px;
                        border-radius: 4px;
                        border: 1px solid #333;
                        background: #2a2a2a;
                        color: #fff;
                        font-size: 13px;
                    " ${isCurrentUser ? 'disabled' : ''}>
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>Пользователь</option>
                        <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Модератор</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
                    </select>
                </td>
                <td>${user.created_at || '—'}</td>
                <td>
                    ${!isCurrentUser ? `
                        <button class="btn-icon edit" onclick="changeUserRole(${user.id})" title="Изменить роль">
                            <i class="fas fa-user-cog"></i>
                        </button>
                        <button class="btn-icon delete" onclick="deleteUser(${user.id})" title="Удалить">
                            <i class="fas fa-user-minus"></i>
                        </button>
                    ` : `
                        <span style="color: #888; font-size: 12px;">Вы</span>
                    `}
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// ============================================
// ====== ПОЛЬЗОВАТЕЛИ — ИЗМЕНЕНИЕ РОЛИ ======
// ============================================

function changeUserRole(id) {
    const select = document.querySelector(`.role-select[data-id="${id}"]`);
    if (!select) return;

    const newRole = select.value;

    fetch(API.users, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, role: newRole })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('✅ Роль пользователя обновлена', 'success');
                loadUsers();
            } else {
                showNotification('❌ ' + data.error, 'error');
                loadUsers();
            }
        })
        .catch(() => {
            showNotification('❌ Ошибка сервера', 'error');
        });
}

// ============================================
// ====== ПОЛЬЗОВАТЕЛИ — УДАЛЕНИЕ ======
// ============================================

function deleteUser(id) {
    if (!confirm('Удалить пользователя #' + id + '?')) return;

    fetch(API.users + '?id=' + id, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('✅ ' + data.message, 'success');
                loadUsers();
                loadProducts();
            } else {
                showNotification('❌ ' + data.error, 'error');
            }
        })
        .catch(() => {
            showNotification('❌ Ошибка сервера', 'error');
        });
}

// ============================================
// ====== ВЫХОД ======
// ============================================

function logoutUser() {
    fetch(API.logout, {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = 'index.html';
            }
        })
        .catch(() => {
            window.location.href = 'index.html';
        });
}

// ============================================
// ====== УВЕДОМЛЕНИЯ ======
// ============================================

function showNotification(message, type) {
    const old = document.querySelector('.notification');
    if (old) {
        old.classList.remove('show');
        old.classList.add('hide');
        setTimeout(() => old.remove(), 500);
    }

    const notification = document.createElement('div');
    notification.className = 'notification ' + (type || 'info');
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 50);
    setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// ============================================
// ====== ЗАПУСК ======
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Проверка админа
    checkAdminAuth();

    // Вкладки
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Поиск и фильтрация
    document.getElementById('searchInput')?.addEventListener('input', filterTable);
    document.getElementById('categoryFilter')?.addEventListener('change', filterTable);

    // Модалка
    document.getElementById('adminProductModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeAdminModal();
    });

    // ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeAdminModal();
    });

    // Выход
    document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);
});

// Делаем функции глобальными
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closeAdminModal = closeAdminModal;
window.saveProduct = saveProduct;
window.deleteProduct = deleteProduct;
window.filterTable = filterTable;
window.changeUserRole = changeUserRole;
window.deleteUser = deleteUser;
window.switchTab = switchTab;
window.loadProducts = loadProducts;
window.loadUsers = loadUsers;