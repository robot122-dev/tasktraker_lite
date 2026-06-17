// ISP: узкий интерфейс для уведомлений
class INotificationService {
    notify(message, type) { throw new Error('Not implemented'); }
    success(message) { throw new Error('Not implemented'); }
    error(message) { throw new Error('Not implemented'); }
    warning(message) { throw new Error('Not implemented'); }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = INotificationService;
}
