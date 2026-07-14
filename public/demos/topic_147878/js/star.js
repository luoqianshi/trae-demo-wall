class Star{

    constructor(w,h){
        this.reset(w,h);
        this.lit=false;
        this.trail=[];
    }

    reset(w,h){
        this.x=Math.random()*w;
        this.y=Math.random()*h;
        this.r=Math.random()*2+1;
        this.alpha=Math.random()*0.4+0.1;
        this.speed=Math.random()*0.02+0.01;
        this.lit=false;
        this.litAlpha=0;
    }

    update(){
        if(!this.lit){
            this.alpha+=this.speed;
            if(this.alpha>=0.5){
                this.speed*=-1;
            }
            if(this.alpha<=0.1){
                this.speed*=-1;
            }
        }else{
            this.litAlpha+=0.05;
            if(this.litAlpha>1)this.litAlpha=1;
        }
    }

    draw(ctx){
        ctx.beginPath();
        
        const alpha=this.lit ? this.litAlpha : this.alpha;
        ctx.fillStyle=`rgba(255,255,255,${alpha})`;
        
        ctx.arc(this.x, this.y, this.r + (this.lit ? 2 : 0), 0, Math.PI*2);
        ctx.fill();

        if(this.lit && Math.random()<0.3){
            ctx.beginPath();
            ctx.fillStyle=`rgba(255,255,200,${Math.random()*0.5})`;
            ctx.arc(this.x + (Math.random()-0.5)*15, this.y + (Math.random()-0.5)*15, Math.random()*1.5, 0, Math.PI*2);
            ctx.fill();
        }
    }

    isClicked(x,y){
        const dx=x-this.x;
        const dy=y-this.y;
        return Math.sqrt(dx*dx+dy*dy)<30;
    }

    lightUp(){
        this.lit=true;
    }
}

class StarRoom{

    constructor(){
        this.canvas=document.getElementById("starCanvas");
        this.ctx=this.canvas.getContext("2d");
        this.stars=[];
        this.running=false;
        this.litCount=0;

        this.bind();
    }

    resize(){
        this.canvas.width=this.canvas.clientWidth;
        this.canvas.height=this.canvas.clientHeight;
    }

    init(){
        this.stars=[];
        this.litCount=0;
        
        for(let i=0;i<300;i++){
            this.stars.push(new Star(this.canvas.width, this.canvas.height));
        }
        
        this.updateCount();
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

        this.canvas.addEventListener("click",(e)=>{
            const p=getPos(e);
            
            this.stars.forEach(s=>{
                if(!s.lit && s.isClicked(p.x,p.y)){
                    s.lightUp();
                    this.litCount++;
                    this.updateCount();
                }
            });
            
            for(let i=0;i<5;i++){
                const newStar=new Star(this.canvas.width, this.canvas.height);
                newStar.x=p.x + (Math.random()-0.5)*40;
                newStar.y=p.y + (Math.random()-0.5)*40;
                newStar.lightUp();
                this.stars.push(newStar);
                this.litCount++;
            }
            this.updateCount();
        });

        this.canvas.addEventListener("touchstart",(e)=>{
            const p=getPos(e);
            this.stars.forEach(s=>{
                if(!s.lit && s.isClicked(p.x,p.y)){
                    s.lightUp();
                    this.litCount++;
                    this.updateCount();
                }
            });
        });
    }

    updateCount(){
        const countEl=document.getElementById("starCount");
        if(countEl){
            countEl.textContent=`${this.litCount}/${this.stars.length}`;
        }
    }

    open(){
        const modal=document.getElementById("starModal");
        modal.classList.add("show");

        setTimeout(()=>{
            this.resize();
            this.init();
            this.running=true;
            this.animate();
        },100);
    }

    close(){
        this.running=false;
        document.getElementById("starModal").classList.remove("show");
    }

    animate(){
        if(!this.running)return;

        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        
        const gradient=this.ctx.createRadialGradient(
            this.canvas.width/2, this.canvas.height/3, 0,
            this.canvas.width/2, this.canvas.height/2, this.canvas.width
        );
        gradient.addColorStop(0,"#142850");
        gradient.addColorStop(1,"#050816");
        this.ctx.fillStyle=gradient;
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);

        this.stars.forEach(s=>{
            s.update();
            s.draw(this.ctx);
        });

        requestAnimationFrame(()=>this.animate());
    }

}

const starRoom=new StarRoom();

GameManager.register("star",{
    open(){starRoom.open();},
    close(){starRoom.close();}
});

document.getElementById("closeStar").onclick=()=>{
    GameManager.close();
};