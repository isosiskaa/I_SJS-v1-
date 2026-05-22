// 1. ИНИЦИАЛИЗАЦИЯ ХРАНИЛИЩА (Исправлено: пользователи больше не стираются при перезагрузке)
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([]));
}
if (!localStorage.getItem('messages')) {
    localStorage.setItem('messages', JSON.stringify([]));
}

let currentUser = null;
let activeChatTarget = null; // Логин того, с кем открыт чат

// 1. ПЕРЕКЛЮЧЕНИЕ ОКНО АВТОРИЗАЦИИ (Вход / Регистрация)
function switchAuth(toRegister) {
    document.getElementById('registerWindow').style.display = toRegister ? 'block' : 'none';
    document.getElementById('loginWindow').style.display = toRegister ? 'none' : 'block';
}

// 2. РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ
function register() {
    const loginInput = document.getElementById('regLogin').value.trim();
    const passwordInput = document.getElementById('regPassword').value.trim();

    if (!loginInput || !passwordInput) {
        alert('Пожалуйста, заполните все поля!');
        return;
    }

    let users = JSON.parse(localStorage.getItem('users'));
    
    // Проверяем, не занят ли логин
    const userExists = users.some(u => u.login.toLowerCase() === loginInput.toLowerCase());
    if (userExists) {
        alert('Этот логин уже занят другим пользователем!');
        return;
    }

    // Сохраняем нового пользователя в массив
    users.push({ login: loginInput, password: passwordInput });
    localStorage.setItem('users', JSON.stringify(users));

    alert('Registration успешна! Теперь войдите в аккаунт.');
    switchAuth(false); // Переводим на форму входа
    document.getElementById('loginUser').value = loginInput;
}

// 3. ВХОД В АККАУНТ
function login() {
    const loginInput = document.getElementById('loginUser').value.trim();
    const passwordInput = document.getElementById('loginPassword').value.trim();

    let users = JSON.parse(localStorage.getItem('users'));
    // Ищем пользователя с правильным паролем
    const user = users.find(u => u.login.toLowerCase() === loginInput.toLowerCase() && u.password === passwordInput);

    if (!user) {
        alert('Неверный логин или пароль!');
        return;
    }

    currentUser = user.login;
    startMessenger();
}

// 4. ВЫХОД ИЗ ПРОФИЛЯ
function logout() {
    currentUser = null;
    activeChatTarget = null;
    document.getElementById('appWindow').style.display = 'none';
    document.getElementById('loginWindow').style.display = 'block';
}

// 5. ЗАПУСК ИНТЕРФЕЙСА МЕССЕНДЖЕРА
function startMessenger() {
    document.getElementById('registerWindow').style.display = 'none';
    document.getElementById('loginWindow').style.display = 'none';
    document.getElementById('appWindow').style.display = 'flex';
    // Исправлено: заменено на шаблонную строку с косыми кавычками
    document.getElementById('currentUserName').innerText = `Вы: ${currentUser}`;
    
    loadUsersList();
    
    // Запускаем цикл обновления (каждую секунду), чтобы видеть новые сообщения и пользователей
    setInterval(() => {
        if (currentUser) {
            loadUsersList();
            if (activeChatTarget) {
                loadMessages();
            }
        }
    }, 1000);
}

// 6. ОТОБРАЖЕНИЕ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ И ИЗБРАННОГО
function loadUsersList() {
    const usersListDiv = document.getElementById('usersList');
    let users = JSON.parse(localStorage.getItem('users'));
    
    // Исправлено: заменено на шаблонную строку с косыми кавычками
    let listHtml = `
        <div class="user-item ${activeChatTarget === currentUser ? 'active' : ''}" onclick="selectChat('${currentUser}')">
            <div class="avatar">⭐</div>
            <div class="user-info">
                <span class="user-name">Избранное (Мои устройства)</span>
            </div>
        </div>
    `;

    // Добавляем всех остальных зарегистрированных на сайте пользователей
    users.forEach(user => {
        if (user.login.toLowerCase() !== currentUser.toLowerCase()) {
            const firstLetter = user.login.substring(0, 2).toUpperCase();
            // Исправлено: заменено на шаблонную строку с косыми кавычками
            listHtml += `
                <div class="user-item ${activeChatTarget === user.login ? 'active' : ''}" onclick="selectChat('${user.login}')">
                    <div class="avatar">${firstLetter}</div>
                    <div class="user-info">
                        <span class="user-name">${user.login}</span>
                    </div>
                </div>
            `;
        }
    });

    usersListDiv.innerHTML = listHtml;
}

// 7. ВЫБОР КОНКРЕТНОГО ЧАТА
function selectChat(targetUser) {
    activeChatTarget = targetUser;
    document.getElementById('inputArea').style.display = 'flex';
    
    if (targetUser === currentUser) {
        document.getElementById('chatTitle').innerText = '⭐ Избранное (Заметки и память)';
    } else {
        // Исправлено: заменено на шаблонную строку с косыми кавычками
        document.getElementById('chatTitle').innerText = `Переписка с: ${targetUser}`;
    }
    
    loadMessages();
}

// 8. ОТПРАВКА СООБЩЕНИЯ
function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text) return;

    let messages = JSON.parse(localStorage.getItem('messages'));
    
    const newMessage = {
        sender: currentUser,
        receiver: activeChatTarget,
        text: text,
        timestamp: new Date().getTime()
    };

    messages.push(newMessage);
    localStorage.setItem('messages', JSON.stringify(messages));
    
    input.value = '';
    loadMessages();
}

// 9. ЗАГРУЗКА И СОРТИРОВКА СООБЩЕНИЙ ДЛЯ АКТИВНОГО ЧАТА
function loadMessages() {
    const messagesBox = document.getElementById('messagesBox');
    let messages = JSON.parse(localStorage.getItem('messages'));
    
    // Фильтруем сообщения только для текущего открытого диалога
    let filtered = messages.filter(m => {
        if (activeChatTarget === currentUser) {
            return m.sender === currentUser && m.receiver === currentUser;
        } else {
            return (m.sender === currentUser && m.receiver === activeChatTarget) || 
                   (m.sender === activeChatTarget && m.receiver === currentUser);
        }
    });

    let messagesHtml = '';
    filtered.forEach(m => {
        const isMyMessage = m.sender === currentUser;
        // В Избранном (чат с собой) все сообщения визуально отправленные
        const msgClass = (isMyMessage && activeChatTarget !== currentUser) || (activeChatTarget === currentUser) ? 'sent' : 'received';
        
        // Исправлено: заменено на шаблонную строку с косыми кавычками
        messagesHtml += `<div class="message ${msgClass}">${escapeHtml(m.text)}</div>`;
    });

    messagesBox.innerHTML = messagesHtml;
    messagesBox.scrollTop = messagesBox.scrollHeight; // Скролл вниз к последним сообщениям
}

// Слушатель нажатия кнопки Enter для удобной отправки
function handleKeyPress(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
}

// Экранирование текста (защита от взлома и поломки верстки через сообщения)
function escapeHtml(text) {
    return text
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;"); // Исправлено: теперь корректно экранирует одиночную кавычку
}
