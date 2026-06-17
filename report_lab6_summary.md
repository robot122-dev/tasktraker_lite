# Сводка для отчёта — ЛР6

## Созданные классы

| Класс / Интерфейс | Файл | Назначение |
|-------------------|------|------------|
| `Task` | `js/solid/task.js` | Модель задачи с валидацией |
| `ITaskRepository` | `js/solid/i-task-repository.js` | Интерфейс хранилища (ISP) |
| `LocalStorageRepository` | `js/solid/local-storage-repository.js` | Реализация хранилища (DIP) |
| `INotificationService` | `js/solid/i-notification-service.js` | Интерфейс уведомлений (ISP) |
| `NotificationService` | `js/solid/notification-service.js` | Реализация уведомлений (DIP) |
| `IHtmlRenderer` | `js/solid/i-html-renderer.js` | Интерфейс рендеринга (ISP) |
| `HtmlRenderer` | `js/solid/html-renderer.js` | Реализация рендеринга (DIP) |
| `TaskService` | `js/solid/task-service.js` | Бизнес-логика (SRP, DIP) |
| `TaskManager` | `js/solid/task-manager.js` | Оркестратор (OCP) |

## Тесты

| Метрика | До | После |
|---------|-----|-------|
| Тестов (ЛР5) | 44 | 44 |
| Тестов (плохой класс) | — | 6 |
| Тестов (SOLID) | — | 31 |
| **Итого** | **44** | **81** |

## Преимущества

1. Изоляция компонентов — тесты независимы
2. Переиспользование — `NotificationService`, `HtmlRenderer` применимы в других проектах
3. Расширяемость — REST-хранилище добавляется новым классом
4. Читаемость — файлы по 20–80 строк
5. Поддерживаемость — исправление бага не ломает другие части
6. Тестируемость — моки через интерфейсы
