const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.setHeaderColor('#1C1C1E'); // Цвет подложки хедера

// --- State Management ---
// Загружаем задачи из LocalStorage или создаем пустой массив
let tasks = JSON.parse(localStorage.getItem('tasks')) || [
    { id: 1, title: 'Добро пожаловать в TaskOS', desc: 'Это демо задача', date: '2025-12-31', priority: 'high', category: 'personal', completed: false },
    { id: 2, title: 'Свайпни чтобы удалить', desc: '', date: '', priority: 'low', category: 'work', completed: false }
];

let currentFilter = 'all';

// --- DOM Elements ---
const taskListEl = document.getElementById('taskList');
const fabBtn = document.getElementById('fabAdd');
const modalOverlay = document.getElementById('modalOverlay');
const closeModalBtn = document.getElementById('closeModal');
const saveTaskBtn = document.getElementById('saveTask');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.cat-pill');

// --- Functions ---

function saveToLocal() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
    taskListEl.innerHTML = '';
    
    // Фильтрация
    let filteredTasks = tasks.filter(task => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'urgent') return task.priority === 'high';
        return task.category === currentFilter;
    });

    // Сортировка: Сначала невыполненные, затем по приоритету
    filteredTasks.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    });

    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        filteredTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = `task-card ${task.completed ? 'completed' : ''}`;
            taskEl.onclick = (e) => toggleTask(task.id, e);

            // Форматирование даты
            const dateStr = task.date ? new Date(task.date).toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'}) : '';
            
            // HTML Карточки
            taskEl.innerHTML = `
                <div class="checkbox-circle"></div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        ${task.priority !== 'low' ? `<span class="badge priority-${task.priority}">${task.priority === 'high' ? 'High' : 'Med'}</span>` : ''}
                        ${dateStr ? `<span>📅 ${dateStr}</span>` : ''}
                        <span>${task.category === 'work' ? '💼' : '🏠'}</span>
                        ${task.desc ? `<span style="opacity:0.7">📝</span>` : ''}
                    </div>
                </div>
            `;
            
            // Долгое нажатие для удаления (симуляция)
            taskEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if(confirm('Удалить задачу?')) {
                    deleteTask(task.id);
                }
            });

            taskListEl.appendChild(taskEl);
        });
    }
}

function toggleTask(id, event) {
    // Находим задачу
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveToLocal();
        // Анимация обновления без полной перерисовки (опционально)
        renderTasks();
        
        // Вибрация (Haptic Feedback) от Telegram
        if (task.completed) {
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            tg.HapticFeedback.selectionChanged();
        }
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveToLocal();
    renderTasks();
    tg.HapticFeedback.notificationOccurred('warning');
}

function addNewTask() {
    const title = document.getElementById('modalTitle').value;
    const desc = document.getElementById('modalDesc').value;
    const date = document.getElementById('modalDate').value;
    const priority = document.getElementById('modalPriority').value;
    const category = document.getElementById('modalCategory').value;

    if (!title) {
        tg.showAlert('Введите название задачи');
        return;
    }

    const newTask = {
        id: Date.now(),
        title,
        desc,
        date,
        priority,
        category,
        completed: false
    };

    tasks.unshift(newTask); // Добавляем в начало
    saveToLocal();
    renderTasks();
    closeModal();
    
    // Сброс формы
    document.getElementById('modalTitle').value = '';
    document.getElementById('modalDesc').value = '';
}

// --- Modal Logic ---
function openModal() {
    modalOverlay.classList.add('open');
    document.getElementById('modalTitle').focus();
    tg.BackButton.show();
    tg.BackButton.onClick(closeModal);
}

function closeModal() {
    modalOverlay.classList.remove('open');
    tg.BackButton.hide();
    tg.BackButton.offClick(closeModal);
}

// --- Event Listeners ---
fabBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
saveTaskBtn.addEventListener('click', addNewTask);

// Фильтры
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Убираем активный класс у всех
        filterBtns.forEach(b => b.classList.remove('active'));
        // Ставим текущему
        btn.classList.add('active');
        // Обновляем фильтр
        currentFilter = btn.dataset.filter;
        renderTasks();
        tg.HapticFeedback.selectionChanged();
    });
});

// Initial Render
renderTasks();