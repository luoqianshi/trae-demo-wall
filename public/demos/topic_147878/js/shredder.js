/* ==========================================
   Shredder Game - 烦恼粉碎机
========================================== */

class ShredderGame {

    constructor() {
        this.modal = document.getElementById("shredderModal");
        this.textarea = document.getElementById("shredderText");
        this.shredBtn = document.getElementById("shredBtn");
        this.animationDiv = document.getElementById("shredAnimation");
        this.resultDiv = document.getElementById("shredResult");
        
        this.bindEvents();
    }

    bindEvents() {
        if (this.shredBtn) {
            this.shredBtn.addEventListener("click", () => this.shred());
        }
    }

    open() {
        if (this.modal) {
            this.modal.classList.add("show");
            this.textarea.value = "";
            this.resultDiv.innerHTML = "";
            this.resultDiv.style.display = "none";
            this.animationDiv.innerHTML = "";
            this.animationDiv.style.display = "none";
        }
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove("show");
        }
    }

    shred() {
        const text = this.textarea.value.trim();
        
        if (!text) {
            toast("请输入烦恼");
            return;
        }

        this.resultDiv.style.display = "none";
        this.animationDiv.style.display = "block";
        this.animationDiv.innerHTML = "";

        const stripCount = Math.min(Math.ceil(text.length / 8), 8);
        const charsPerStrip = Math.ceil(text.length / stripCount);

        for (let i = 0; i < stripCount; i++) {
            const stripText = text.substring(i * charsPerStrip, (i + 1) * charsPerStrip);
            const strip = document.createElement("div");
            strip.className = "shred-strip";
            strip.textContent = stripText;
            strip.style.left = `${(i / stripCount) * 100}%`;
            strip.style.animationDelay = `${i * 0.1}s`;
            this.animationDiv.appendChild(strip);
        }

        for (let i = 0; i < 30; i++) {
            const particle = document.createElement("div");
            particle.className = "shred-particle";
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 50}%`;
            particle.style.animationDelay = `${Math.random() * 0.5}s`;
            this.animationDiv.appendChild(particle);
        }

        setTimeout(() => {
            this.animationDiv.innerHTML = "";
            this.animationDiv.style.display = "none";
            
            this.resultDiv.style.display = "block";
            this.resultDiv.innerHTML = `✨ 烦恼已粉碎！<br><span class="shred-subtitle">"${text.length > 30 ? text.substring(0, 30) + '...' : text}" 已化为灰烬</span>`;
            this.textarea.value = "";

            this.createConfetti();
        }, 2000);
    }

    createConfetti() {
        for (let i = 0; i < 20; i++) {
            const confetti = document.createElement("div");
            confetti.className = "confetti";
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 80%, 60%)`;
            confetti.style.animationDelay = `${Math.random() * 0.5}s`;
            this.resultDiv.appendChild(confetti);
        }

        setTimeout(() => {
            const confettiElements = this.resultDiv.querySelectorAll(".confetti");
            confettiElements.forEach(el => el.remove());
        }, 3000);
    }
}

const shredderGame = new ShredderGame();

GameManager.register("shredder", {
    open() {
        shredderGame.open();
    },
    close() {
        shredderGame.close();
    }
});

document.getElementById("closeShredder")?.addEventListener("click", () => {
    GameManager.close();
});