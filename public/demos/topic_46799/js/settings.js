function initSettingsPage() {
    renderModelsContainer();
    updateCurrentModelDisplay();
}

document.addEventListener('DOMContentLoaded', () => {
    const settingsTab = document.querySelector('.settings-nav-item');
    if (settingsTab) {
        settingsTab.click();
    }
});
