/* ======================================
    Emotion Spray
====================================== */

class SprayParticle{

    constructor(x,y,size=5){
        this.x=x;
        this.y=y;
        this.size=Math.random()*size+2;
        this.life=1;
        this.vx=(Math.random()-0.5)*8;
        this.vy=(Math.random()-0.5)*8;
        this.gravity=.08;
        this.color=this.randomColor();
    }

    randomColor(){
        const colors=[
            "#5B8FF9",
            "#61DDAA",
            "#65789B",
            "#F6BD16",
            "#7262FD",
            "#78D3F8",
            "#9661BC",
            "#F6903D",
            "#008685",
            "#F08BB4",
            "#FF6B6B",
            "#4ECDC4",
            "#FFE66D",
            "#95E1D3"
        ];
        return colors[Math.floor(Math.random()*colors.length)];
    }

    update(){
        this.x+=this.vx;
        this.y+=this.vy;
        this.vy+=this.gravity;
        this.life-=0.015;
    }

    draw(ctx){
        ctx.globalAlpha=this.life;
        ctx.beginPath();
        ctx.fillStyle=this.color;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
    }

}

class SprayGame{

    constructor(){
        this.canvas=document.getElementById("sprayCanvas");
        this.ctx=this.canvas.getContext("2d");
        this.running=false;
        this.painting=false;
        this.particles=[];
        this.spraySize=5;

        this.bind();
    }

    resize(){
        this.canvas.width=this.canvas.clientWidth;
        this.canvas.height=this.canvas.clientHeight;
        this.drawBackground();
    }

    drawBackground(){
        const gradient=this.ctx.createLinearGradient(0,0,this.canvas.width,this.canvas.height);
        gradient.addColorStop(0,"#fafafa");
        gradient.addColorStop(1,"#f0f0f0");
        this.ctx.fillStyle=gradient;
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    }

    bind(){
        const pos=(e)=>{
            const rect=this.canvas.getBoundingClientRect();
            if(e.touches){
                return{
                    x:e.touches[0].clientX-rect.left,
                    y:e.touches[0].clientY-rect.top
                }
            }
            return{
                x:e.offsetX,
                y:e.offsetY
            }
        }

        this.canvas.addEventListener("mousedown",()=>{
            this.painting=true;
        });

        window.addEventListener("mouseup",()=>{
            this.painting=false;
        });

        this.canvas.addEventListener("mousemove",(e)=>{
            if(!this.painting)return;
            const p=pos(e);
            this.spray(p.x,p.y);
        });

        this.canvas.addEventListener("touchstart",()=>{
            this.painting=true;
        });

        this.canvas.addEventListener("touchend",()=>{
            this.painting=false;
        });

        this.canvas.addEventListener("touchmove",(e)=>{
            if(!this.painting)return;
            const p=pos(e);
            this.spray(p.x,p.y);
        });

        document.querySelectorAll(".spray-size").forEach(btn=>{
            btn.addEventListener("click",(e)=>{
                document.querySelectorAll(".spray-size").forEach(b=>b.classList.remove("active"));
                e.target.classList.add("active");
                this.spraySize=parseInt(e.target.getAttribute("data-size"));
            });
        });

        document.getElementById("clearSpray")?.addEventListener("click",()=>{
            this.drawBackground();
            this.particles=[];
        });
    }

    spray(x,y){
        const count=this.spraySize;
        for(let i=0;i<count;i++){
            this.particles.push(new SprayParticle(x,y,this.spraySize));
        }
    }

    open(){
        const modal=document.getElementById("sprayModal");
        modal.classList.add("show");

        setTimeout(()=>{
            this.resize();
            this.particles=[];
            this.running=true;
            this.animate();
        },100);
    }

    close(){
        this.running=false;
        document.getElementById("sprayModal").classList.remove("show");
    }

    animate(){
        if(!this.running)return;

        this.particles=this.particles.filter(p=>p.life>0);

        this.particles.forEach(p=>{
            p.update();
            p.draw(this.ctx);
        });

        requestAnimationFrame(()=>this.animate());
    }

}

const sprayGame=new SprayGame();

GameManager.register("spray",{
    open(){sprayGame.open();},
    close(){sprayGame.close();}
});

document.getElementById("closeSpray").onclick=()=>GameManager.close();