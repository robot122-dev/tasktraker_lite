function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function createTask(title, description, priority) {
    if (!title || typeof title !== 'string' || title.trim() === '') {
        throw new Error('Название задачи обязательно');
    }

    return {
        id: generateId(),
        title: title.trim(),
        description: (description || '').trim(),
        status: 'todo',
        priority: priority || 'medium',
        createdAt: new Date().toISOString()
    };
}

function addTask(tasks, title, description, priority) {
    const task = createTask(title, description, priority);
    tasks.push(task);
    return task;
}

function deleteTask(tasks, taskId) {
    const index = tasks.findIndex(function (t) {
        return t.id === taskId;
    });
    if (index === -1) {
        throw new Error('Задача не найдена');
    }
    const removed = tasks.splice(index, 1);
    return removed[0];
}

function getNextStatus(currentStatus) {
    var order = ['todo', 'in_progress', 'done'];
    var currentIndex = order.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === order.length - 1) {
        return 'todo';
    }
    return order[currentIndex + 1];
}

function changeStatus(tasks, taskId) {
    var task = tasks.find(function (t) {
        return t.id === taskId;
    });
    if (!task) {
        throw new Error('Задача не найдена');
    }
    task.status = getNextStatus(task.status);
    return task;
}

function setStatus(tasks, taskId, newStatus) {
    var validStatuses = ['todo', 'in_progress', 'done'];
    if (validStatuses.indexOf(newStatus) === -1) {
        throw new Error('Неверный статус: ' + newStatus);
    }
    var task = tasks.find(function (t) {
        return t.id === taskId;
    });
    if (!task) {
        throw new Error('Задача не найдена');
    }
    task.status = newStatus;
    return task;
}

function getTaskById(tasks, taskId) {
    var task = tasks.find(function (t) {
        return t.id === taskId;
    });
    if (!task) {
        throw new Error('Задача не найдена');
    }
    return task;
}

function filterTasks(tasks, filter) {
    if (filter === 'all' || !filter) {
        return tasks;
    }
    return tasks.filter(function (t) {
        return t.status === filter;
    });
}

function searchTasks(tasks, query) {
    if (!query || typeof query !== 'string' || query.trim() === '') {
        return tasks;
    }
    var lowerQuery = query.toLowerCase().trim();
    return tasks.filter(function (t) {
        return (
            t.title.toLowerCase().indexOf(lowerQuery) !== -1 ||
            t.description.toLowerCase().indexOf(lowerQuery) !== -1
        );
    });
}

function getStatusLabel(status) {
    var labels = {
        todo: 'К выполнению',
        in_progress: 'В работе',
        done: 'Выполнено'
    };
    return labels[status] || status;
}

function getPriorityLabel(priority) {
    var labels = {
        low: 'Низкий',
        medium: 'Средний',
        high: 'Высокий'
    };
    return labels[priority] || priority;
}

function saveTasks(tasks) {
    try {
        localStorage.setItem('tasktracker_tasks', JSON.stringify(tasks));
    } catch (e) {
        // silently fail
    }
}

function loadTasks() {
    try {
        var data = localStorage.getItem('tasktracker_tasks');
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        // silently fail
    }
    return [];
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateId: generateId,
        createTask: createTask,
        addTask: addTask,
        deleteTask: deleteTask,
        getNextStatus: getNextStatus,
        changeStatus: changeStatus,
        setStatus: setStatus,
        getTaskById: getTaskById,
        filterTasks: filterTasks,
        searchTasks: searchTasks,
        getStatusLabel: getStatusLabel,
        getPriorityLabel: getPriorityLabel
    };
}
