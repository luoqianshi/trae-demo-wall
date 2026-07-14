/* ==========================================
   Sand Game
========================================== */

class SandGame{

    constructor(){

        this.canvas=document.getElementById("sandCanvas");
        this.ctx=this.canvas.getContext("2d");

        this.running=false;

        this.pointer={
            x:0,
            y:0,
            down:false
        };

        this.colors=["#d7b56d", "#c9a06b", "#e8d5a3", "#8b6914"];
        this.currentColor="#d7b56d";
        this.brushSize=30;

        this.bind();

    }

    resize(){

        this.canvas.width=this.canvas.clientWidth;
        this.canvas.height=this.canvas.clientHeight;

        this.drawBackground();

    }

    drawBackground(){
        const gradient=this.ctx.createLinearGradient(0,0,0,this.canvas.height);
        gradient.addColorStop(0,"#F5E7B2");
        gradient.addColorStop(1,"#E6CF8C");
        this.ctx.fillStyle=gradient;
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    }

    bind(){

        const getPos=(e)=>{
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

        this.canvas.addEventListener("mousedown",(e)=>{
            this.pointer.down=true;
            const p=getPos(e);
            this.pointer.x=p.x;
            this.pointer.y=p.y;
        });

        window.addEventListener("mouseup",()=>{
            this.pointer.down=false;
        });

        this.canvas.addEventListener("mousemove",(e)=>{
            const p=getPos(e);
            this.pointer.x=p.x;
            this.pointer.y=p.y;
        });

        this.canvas.addEventListener("touchstart",(e)=>{
            this.pointer.down=true;
            const p=getPos(e);
            this.pointer.x=p.x;
            this.pointer.y=p.y;
        });

        this.canvas.addEventListener("touchend",()=>{
            this.pointer.down=false;
        });

        this.canvas.addEventListener("touchmove",(e)=>{
            const p=getPos(e);
            this.pointer.x=p.x;
            this.pointer.y=p.y;
        });

        document.querySelectorAll(".sand-color").forEach(btn=>{
            btn.addEventListener("click",(e)=>{
                document.querySelectorAll(".sand-color").forEach(b=>b.classList.remove("active"));
                e.target.classList.add("active");
                this.currentColor=e.target.getAttribute("data-color");
            });
        });

        document.getElementById("clearSand")?.addEventListener("click",()=>{
            this.drawBackground();
        });

        document.getElementById("resetSand")?.addEventListener("click",()=>{
            this.drawBackground();
        });

    }

    open(){

        const modal=document.getElementById("sandModal");
        modal.classList.add("show");

        setTimeout(()=>{
            this.resize();
            this.running=true;
            this.draw();
        },100);

    }

    close(){

        this.running=false;

        document
            .getElementById("sandModal")
            .classList
            .remove("show");

    }

    draw(){

        if(!this.running) return;

        if(this.pointer.down){

            this.ctx.beginPath();
            this.ctx.arc(this.pointer.x, this.pointer.y, this.brushSize, 0, Math.PI*2);
            this.ctx.fillStyle=this.currentColor;
            this.ctx.fill();

        }

        requestAnimationFrame(()=>this.draw());

    }

}

const sandGame=new SandGame();

GameManager.register("sand",{

    open(){
        sandGame.open();
    },

    close(){
        sandGame.close();
    }

});

document
.getElementById("closeSand")
.onclick=()=>{
    GameManager.close();
}