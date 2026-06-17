describe('TaskTracker Lite — UI-тесты (ЛР8)', () => {

    beforeEach(() => {
        cy.request('POST', '/api/tasks/reset');
        cy.visit('/');
    });

    it('открытие приложения', () => {
        cy.get('h1').should('contain', 'TaskTracker Lite');
        cy.get('#taskForm').should('exist');
        cy.get('#taskContainer').should('exist');
        cy.get('#searchInput').should('exist');
        cy.get('.filter-btn').should('have.length', 4);
    });

    it('создание задачи через интерфейс', () => {
        cy.get('#taskTitle').type('Тестовая задача');
        cy.get('#taskDescription').type('Описание задачи');
        cy.get('#taskPriority').select('high');
        cy.get('#addTaskBtn').click();

        cy.get('.task-item').should('have.length', 1);
        cy.get('.task-title').should('contain', 'Тестовая задача');
        cy.get('.task-description').should('contain', 'Описание задачи');
        cy.get('.priority-high').should('exist');
    });

    it('отображение задачи в списке', () => {
        cy.get('#taskTitle').type('Задача для отображения');
        cy.get('#addTaskBtn').click();

        cy.get('.task-item').should('have.length', 1);
        cy.get('.task-item .task-title').should('contain', 'Задача для отображения');
        cy.get('.task-status').should('contain', 'К выполнению');
    });

    it('поиск задачи', () => {
        cy.get('#taskTitle').type('Купить продукты');
        cy.get('#addTaskBtn').click();
        cy.get('#taskTitle').type('Написать код');
        cy.get('#addTaskBtn').click();

        cy.get('.task-item').should('have.length', 2);

        cy.get('#searchInput').type('продукты');
        cy.get('.task-item').should('have.length', 1);
        cy.get('.task-title').should('contain', 'Купить продукты');
    });

    it('фильтрация задач', () => {
        cy.get('#taskTitle').type('Задача 1');
        cy.get('#addTaskBtn').click();
        cy.get('#taskTitle').type('Задача 2');
        cy.get('#addTaskBtn').click();

        cy.get('.task-item').should('have.length', 2);

        // Фильтр "К выполнению"
        cy.get('.filter-btn').contains('К выполнению').click();
        cy.get('.task-item').should('have.length', 2);
    });

    it('изменение статуса задачи', () => {
        cy.get('#taskTitle').type('Задача со сменой статуса');
        cy.get('#addTaskBtn').click();

        cy.get('.task-status').should('contain', 'К выполнению');
        cy.get('.btn-status').first().click();
        cy.get('.task-status').should('contain', 'В работе');
        cy.get('.btn-status').first().click();
        cy.get('.task-status').should('contain', 'Выполнено');
    });

    it('удаление задачи', () => {
        cy.get('#taskTitle').type('Задача для удаления');
        cy.get('#addTaskBtn').click();
        cy.get('.task-item').should('have.length', 1);

        cy.get('.btn-delete').first().click();
        cy.get('.task-item').should('have.length', 0);
        cy.get('.empty-message').should('exist');
    });

    it('создание нескольких задач', () => {
        cy.get('#taskTitle').type('Задача A');
        cy.get('#addTaskBtn').click();
        cy.get('#taskTitle').type('Задача B');
        cy.get('#addTaskBtn').click();
        cy.get('#taskTitle').type('Задача C');
        cy.get('#addTaskBtn').click();

        cy.get('.task-item').should('have.length', 3);
    });
});
