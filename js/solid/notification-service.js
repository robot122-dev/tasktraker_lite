// DIP: реализует абстракцию INotificationService
class NotificationService {
    constructor() {
        this._colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
    }

    notify(message, type) {
        type = type || 'info';
        if (typeof document === 'undefined') return;
        var div = document.createElement('div');
        div.style.cssText = 'position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:6px;color:#fff;z-index:9999;background:' + (this._colors[type] || this._colors.info);
        div.textContent = message;
        document.body.appendChild(div);
        setTimeout(function () { div.remove(); }, 3000);
    }

    success(message) {
        this.notify(message, 'success');
    }

    error(message) {
        this.notify(message, 'error');
    }

    warning(message) {
        this.notify(message, 'warning');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationService;
}
