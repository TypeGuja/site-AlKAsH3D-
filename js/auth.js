/**
 * ============================================
 * АВТОРИЗАЦИЯ — С ВЫПАДАЮЩИМ МЕНЮ
 * ============================================
 */

// ====== НАСТРОЙКИ ======
const API = {
    register: '../api/auth/register.php',
    login: '../api/auth/login.php',
    check: '../api/auth/check.php',
    logout: '../api/auth/logout.php'
};

let currentUser = null;

// ============================================
// ====== ФУНКЦИИ АВТОРИЗАЦИИ ======
// ============================================

function registerUser(username, email, password) {
    const submitBtn = document.getElementById('registerSubmit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Загрузка...';
    submitBtn.disabled = true;

    return fetch(API.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    })
        .then(response => response.json())
        .then(data => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            if (data.success) {
                currentUser = data.user;
                updateUI();
                closeAuthModal();
                showNotification('✅ ' + data.message, 'success');
                return data;
            } else {
                showNotification('❌ ' + data.error, 'error');
                throw new Error(data.error);
            }
        })
        .catch(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

function loginUser(username, password) {
    const submitBtn = document.getElementById('loginSubmit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Загрузка...';
    submitBtn.disabled = true;

    return fetch(API.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
        .then(response => response.json())
        .then(data => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            if (data.success) {
                currentUser = data.user;
                updateUI();
                closeAuthModal();
                showNotification('✅ ' + data.message, 'success');
                return data;
            } else {
                showNotification('❌ ' + data.error, 'error');
                throw new Error(data.error);
            }
        })
        .catch(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

function logoutUser() {
    return fetch(API.logout, {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentUser = null;
                updateUI();
                closeUserMenu();
                showNotification('👋 ' + data.message, 'info');
            }
        });
}

function checkAuth() {
    return fetch(API.check)
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                currentUser = data.user;
            } else {
                currentUser = null;
            }
            updateUI();
            return data;
        })
        .catch(() => {
            currentUser = null;
            updateUI();
        });
}

// ============================================
// ====== ВЫПАДАЮЩЕЕ МЕНЮ ======
// ============================================

function toggleUserMenu() {
    const menu = document.getElementById('userDropdownMenu');
    const chevron = document.querySelector('.user-dropdown-trigger .chevron');

    if (menu) {
        menu.classList.toggle('open');
        if (chevron) {
            chevron.classList.toggle('open');
        }
    }
}

function closeUserMenu() {
    const menu = document.getElementById('userDropdownMenu');
    const chevron = document.querySelector('.user-dropdown-trigger .chevron');

    if (menu) {
        menu.classList.remove('open');
        if (chevron) {
            chevron.classList.remove('open');
        }
    }
}

// Закрываем меню при клике вне его
document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        closeUserMenu();
    }
});

// Закрываем по ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeUserMenu();
    }
});

// ============================================
// ====== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ======
// ============================================

function updateUI() {
    const authButtons = document.querySelector('.auth-buttons');
    const userInfo = document.querySelector('.user-info');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userRoleDisplay = document.getElementById('userRoleDisplay');

    if (currentUser) {
        // Скрываем кнопки входа
        if (authButtons) {
            authButtons.style.display = 'none';
        }

        // Показываем информацию о пользователе
        if (userInfo) {
            userInfo.style.display = 'flex';
            if (userNameDisplay) {
                userNameDisplay.textContent = currentUser.username;
            }
            if (userRoleDisplay) {
                const role = currentUser.role || 'user';
                userRoleDisplay.textContent = role;
                userRoleDisplay.className = 'role-badge ' + role;
            }
        }
    } else {
        // Показываем кнопки входа
        if (authButtons) {
            authButtons.style.display = 'flex';
        }

        // Скрываем информацию о пользователе
        if (userInfo) {
            userInfo.style.display = 'none';
        }
    }
}

// ============================================
// ====== ПОКАЗ ФОРМ ======
// ============================================

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authModal').style.display = 'flex';
    closeUserMenu();
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('authModal').style.display = 'flex';
    closeUserMenu();
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
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
// ====== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ======
// ============================================

function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.getElementById('showLoginTab');
    const registerTab = document.getElementById('showRegisterTab');

    if (tab === 'login') {
        loginTab.className = 'auth-tab active';
        registerTab.className = 'auth-tab inactive';

        if (registerForm.classList.contains('visible')) {
            registerForm.classList.remove('visible');
            registerForm.classList.add('hidden');
        }

        setTimeout(() => {
            loginForm.classList.remove('hidden');
            setTimeout(() => {
                loginForm.classList.add('visible');
            }, 50);
        }, 150);
    } else {
        registerTab.className = 'auth-tab active';
        loginTab.className = 'auth-tab inactive';

        if (loginForm.classList.contains('visible')) {
            loginForm.classList.remove('visible');
            loginForm.classList.add('hidden');
        }

        setTimeout(() => {
            registerForm.classList.remove('hidden');
            setTimeout(() => {
                registerForm.classList.add('visible');
            }, 50);
        }, 150);
    }
}

// ============================================
// ====== НАВЕШИВАЕМ СОБЫТИЯ ======
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Регистрация
    document.getElementById('registerSubmit')?.addEventListener('click', function() {
        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirm').value;

        if (!username || !email || !password || !confirm) {
            showNotification('❌ Заполните все поля', 'error');
            return;
        }
        if (password !== confirm) {
            showNotification('❌ Пароли не совпадают', 'error');
            return;
        }
        if (password.length < 6) {
            showNotification('❌ Пароль должен быть минимум 6 символов', 'error');
            return;
        }
        registerUser(username, email, password);
    });

    // Вход
    document.getElementById('loginSubmit')?.addEventListener('click', function() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        if (!username || !password) {
            showNotification('❌ Заполните все поля', 'error');
            return;
        }
        loginUser(username, password);
    });

    // Выход (через меню)
    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        logoutUser();
    });

    // Переключение вкладок
    document.getElementById('showLoginTab')?.addEventListener('click', function() {
        switchTab('login');
    });
    document.getElementById('showRegisterTab')?.addEventListener('click', function() {
        switchTab('register');
    });

    // Закрытие модалки
    document.getElementById('authModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeAuthModal();
    });

    // ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeAuthModal();
    });

    // Enter в полях
    document.getElementById('regPassword')?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('registerSubmit').click();
    });
    document.getElementById('regConfirm')?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('registerSubmit').click();
    });
    document.getElementById('loginPassword')?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('loginSubmit').click();
    });

    // Проверяем авторизацию
    checkAuth();
});

// Делаем функции глобальными
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.closeAuthModal = closeAuthModal;
window.switchTab = switchTab;
window.toggleUserMenu = toggleUserMenu;
window.closeUserMenu = closeUserMenu;
window.logoutUser = logoutUser;