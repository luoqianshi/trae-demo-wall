/* ==========================================
   Bubble Game
========================================== */

let bubbleCanvas;
let bubbleCtx;

let bubbles=[];

let bubbleScore=0;

class Bubble{

    constructor(){

        this.reset();

    }

    reset(){

        this.r=20+Math.random()*40;

        this.x=Math.random()*800+50;

        this.y=700+Math.random()*500;

        this.speed=1+Math.random()*2;

        this.color=randomColor();

    }

    update(){

        this.y-=this.speed;

        if(this.y<-this.r){

            this.reset();

            this.y=700;

        }

    }

    draw(){

        bubbleCtx.beginPath();

        bubbleCtx.arc(
            this.x,
            this.y,
            this.r,
            0,
            Math.PI*2
        );

        bubbleCtx.fillStyle=this.color;

        bubbleCtx.globalAlpha=.55;

        bubbleCtx.fill();

        bubbleCtx.strokeStyle="white";

        bubbleCtx.lineWidth=2;

        bubbleCtx.stroke();

    }

}

function openBubble(){

    const modal=document.getElementById("bubbleModal");

    modal.classList.add("show");

    initBubble();

}

function initBubble(){

    bubbleCanvas=document.getElementById("bubbleCanvas");

    bubbleCtx=bubbleCanvas.getContext("2d");

    bubbleCanvas.width=900;

    bubbleCanvas.height=560;

    if(bubbles.length===0){

        for(let i=0;i<30;i++){

            bubbles.push(new Bubble());

        }

    }

    bubbleCanvas.onclick=clickBubble;

    animateBubble();

}

function animateBubble(){

    bubbleCtx.clearRect(0,0,900,560);

    bubbles.forEach(item=>{

        item.update();

        item.draw();

    });

    requestAnimationFrame(animateBubble);

}

function clickBubble(e){

    const rect=bubbleCanvas.getBoundingClientRect();

    const x=e.clientX-rect.left;

    const y=e.clientY-rect.top;

    bubbles.forEach(item=>{

        const dx=x-item.x;

        const dy=y-item.y;

        const dis=Math.sqrt(dx*dx+dy*dy);

        if(dis<item.r){

            explode(item.x,item.y);

            item.reset();

            item.y=700;

            bubbleScore++;

            document.getElementById("bubbleScore").innerHTML=bubbleScore;

        }

    });

}

function explode(x,y){

    for(let i=0;i<12;i++){

        bubbleCtx.beginPath();

        bubbleCtx.arc(

            x+(Math.random()-0.5)*20,

            y+(Math.random()-0.5)*20,

            3,

            0,

            Math.PI*2

        );

        bubbleCtx.fillStyle=randomColor();

        bubbleCtx.fill();

    }

}

function randomColor(){

    const colors=[

        "#7AAEFF",

        "#6FE8D5",

        "#FFD166",

        "#FF9EC4",

        "#A78BFA"

    ];

    return colors[
        Math.floor(Math.random()*colors.length)
    ];

}

document.addEventListener("DOMContentLoaded",()=>{

    const close=document.getElementById("closeBubble");

    if(close){

        close.onclick=()=>{

            document
            .getElementById("bubbleModal")
            .classList.remove("show");

        }

    }

});

GameManager.register("bubble",{

    open(){

        document
            .getElementById("bubbleModal")
            .classList
            .add("show");

        initBubble();

    },

    close(){

        document
            .getElementById("bubbleModal")
            .classList
            .remove("show");

    }

});