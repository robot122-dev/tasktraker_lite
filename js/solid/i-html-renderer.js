// ISP: узкий интерфейс для рендеринга
class IHtmlRenderer {
    renderTask(task) { throw new Error('Not implemented'); }
    renderList(tasks) { throw new Error('Not implemented'); }
    renderEmpty() { throw new Error('Not implemented'); }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = IHtmlRenderer;
}
