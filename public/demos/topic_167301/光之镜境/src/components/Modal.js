export class Modal {
    constructor(options = {}) {
        this.options = {
            title: '',
            content: '',
            buttons: [],
            width: '500px',
            closeOnOverlay: true,
            ...options
        };
        this.modal = null;
        this.overlay = null;
        this.onClose = null;
    }

    render() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in';
        
        if (this.options.closeOnOverlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }

        this.modal = document.createElement('div');
        this.modal.className = 'glass rounded-2xl p-6 w-full max-w-md shadow-2xl transform animate-slide-up';
        this.modal.style.maxWidth = this.options.width;

        if (this.options.title) {
            const title = document.createElement('h3');
            title.className = 'text-xl font-bold text-white mb-4 text-center';
            title.textContent = this.options.title;
            this.modal.appendChild(title);
        }

        const content = document.createElement('div');
        content.className = 'text-gray-300 mb-6 text-sm leading-relaxed';
        content.innerHTML = this.options.content.replace(/\n/g, '<br>');
        this.modal.appendChild(content);

        if (this.options.buttons.length > 0) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex justify-center gap-4';
            
            this.options.buttons.forEach(btn => {
                const button = document.createElement('button');
                button.className = `px-6 py-2 rounded-lg font-medium transition-all ${btn.primary ? 'bg-cyan-500 hover:bg-cyan-400 text-white glow-cyan' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`;
                button.textContent = btn.text;
                button.addEventListener('click', () => {
                    if (btn.onClick) btn.onClick();
                    if (btn.close !== false) this.close();
                });
                buttonContainer.appendChild(button);
            });
            
            this.modal.appendChild(buttonContainer);
        }

        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);

        return this;
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('animate-slide-up');
            this.modal.classList.add('animate-slide-down');
        }
        if (this.overlay) {
            this.overlay.classList.remove('animate-fade-in');
            this.overlay.classList.add('animate-fade-out');
        }

        setTimeout(() => {
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
            if (this.onClose) this.onClose();
        }, 300);
    }

    setOnClose(callback) {
        this.onClose = callback;
        return this;
    }

    static alert(message, title = '提示') {
        return new Modal({
            title,
            content: message,
            buttons: [{ text: '确定', primary: true }]
        }).render();
    }

    static confirm(message, title = '确认') {
        return new Promise((resolve) => {
            new Modal({
                title,
                content: message,
                buttons: [
                    { text: '取消', onClick: () => resolve(false) },
                    { text: '确定', primary: true, onClick: () => resolve(true) }
                ]
            }).render().setOnClose(() => resolve(false));
        });
    }

    static prompt(message, title = '输入', defaultValue = '') {
        return new Promise((resolve) => {
            const modal = new Modal({
                title,
                content: '',
                buttons: [
                    { text: '取消', onClick: () => resolve(null) },
                    { text: '确定', primary: true, onClick: () => {
                        const input = modal.modal.querySelector('input');
                        resolve(input.value);
                    }}
                ]
            });
            
            modal.render();
            
            const inputContainer = document.createElement('div');
            inputContainer.className = 'mb-6';
            
            const label = document.createElement('p');
            label.className = 'text-gray-300 mb-2';
            label.textContent = message;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:border-cyan-500';
            input.value = defaultValue;
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    resolve(input.value);
                    modal.close();
                }
            });
            
            inputContainer.appendChild(label);
            inputContainer.appendChild(input);
            modal.modal.insertBefore(inputContainer, modal.modal.querySelector('.flex'));
            
            input.focus();
            
            modal.setOnClose(() => resolve(null));
        });
    }
}
