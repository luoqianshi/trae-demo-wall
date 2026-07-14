/* ===========================================
   Stress Relief Lab
   particle.js
=========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("particleCanvas");
    const ctx = canvas.getContext("2d");

    let particles = [];
    const mouse = {
        x: null,
        y: null,
        radius: 120
    };

    class Particle {

        constructor() {

            this.reset();

            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;

        }

        reset() {

            this.radius = Math.random() * 3 + 1;

            this.speedX = (Math.random() - 0.5) * 0.6;
            this.speedY = (Math.random() - 0.5) * 0.6;

            const colors = [
                "#7AAEFF",
                "#6FE8D5",
                "#FFD8A8",
                "#F8A5C2",
                "#A29BFE"
            ];

            this.color = colors[Math.floor(Math.random() * colors.length)];

        }

        update() {

            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0 || this.x > canvas.width)
                this.speedX *= -1;

            if (this.y < 0 || this.y > canvas.height)
                this.speedY *= -1;

            if (mouse.x !== null) {

                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;

                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {

                    this.x -= dx / 45;
                    this.y -= dy / 45;

                }

            }

        }

        draw() {

            ctx.beginPath();

            ctx.fillStyle = this.color;

            ctx.globalAlpha = 0.7;

            ctx.arc(
                this.x,
                this.y,
                this.radius,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }

    }

    function createParticles() {

        particles = [];

        let count = Math.floor(
            window.innerWidth / 12
        );

        if (count < 60) count = 60;

        if (count > 180) count = 180;

        for (let i = 0; i < count; i++) {

            particles.push(new Particle());

        }

    }

    function drawLines() {

        for (let i = 0; i < particles.length; i++) {

            for (let j = i + 1; j < particles.length; j++) {

                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;

                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {

                    ctx.beginPath();

                    ctx.strokeStyle =
                        "rgba(130,170,255," +
                        (1 - distance / 120) * 0.25 +
                        ")";

                    ctx.lineWidth = 1;

                    ctx.moveTo(
                        particles[i].x,
                        particles[i].y
                    );

                    ctx.lineTo(
                        particles[j].x,
                        particles[j].y
                    );

                    ctx.stroke();

                }

            }

        }

    }

    function resizeCanvas() {

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        createParticles();

    }

    function animateParticles() {

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        particles.forEach(item => {

            item.update();

            item.draw();

        });

        drawLines();

        requestAnimationFrame(
            animateParticles
        );

    }

    window.addEventListener("resize", resizeCanvas);

    window.addEventListener("mousemove", e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener("mouseleave", () => {
        mouse.x = null;
        mouse.y = null;
    });

    resizeCanvas();
    animateParticles();

});