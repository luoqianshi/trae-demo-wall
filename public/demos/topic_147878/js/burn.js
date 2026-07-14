/* ===========================
    Burn Worry
=========================== */

let burnTimer=null;

function openBurn(){

    document
        .getElementById("burnModal")
        .classList
        .add("show");

}

document
.getElementById("closeBurn")
.onclick=function(){

    document
    .getElementById("burnModal")
    .classList
    .remove("show");

}

document
.getElementById("burnBtn")
.onclick=function(){

    let value=
    document
    .getElementById("burnText")
    .value.trim();

    if(value===""){

        toast("请输入烦恼");

        return;

    }

    burnAnimation(value);

}

function burnAnimation(text){

    let result=
    document.getElementById("burnResult");

    result.innerHTML=text;

    result.style.opacity=1;

    result.style.color="#333";

    let opacity=1;

    let blur=0;

    let gray=0;

    clearInterval(burnTimer);

    burnTimer=setInterval(()=>{

        opacity-=0.03;

        blur+=0.3;

        gray+=4;

        result.style.opacity=opacity;

        result.style.filter=

        `blur(${blur}px)
        grayscale(${gray}%)`;

        if(opacity<=0){

            clearInterval(burnTimer);

            result.innerHTML=

            "✨ 愿它随风而去";

            result.style.opacity=1;

            result.style.filter="";

            result.style.color="#5B8FF9";

        }

    },40);

}

GameManager.register("burn",{

    open(){

        document
            .getElementById("burnModal")
            .classList
            .add("show");

    },

    close(){

        document
            .getElementById("burnModal")
            .classList
            .remove("show");

    }

});