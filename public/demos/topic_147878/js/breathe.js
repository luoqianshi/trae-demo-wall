/* ====================================
   Breathe Game
==================================== */

const breatheSteps = [

    {
        text:"吸气",
        time:4
    },

    {
        text:"保持",
        time:4
    },

    {
        text:"呼气",
        time:6
    }

];

let breatheIndex = 0;

let breatheTimer = null;

function openBreathe(){

    document
        .getElementById("breatheModal")
        .classList
        .add("show");

}

function closeBreathe(){

    clearInterval(breatheTimer);

    document
        .getElementById("breatheModal")
        .classList
        .remove("show");

}

document
.getElementById("closeBreathe")
.onclick = closeBreathe;

document
.getElementById("startBreathe")
.onclick = startBreathe;

function startBreathe(){

    breatheIndex = 0;

    nextStep();

}

function nextStep(){

    const step = breatheSteps[breatheIndex];

    document
    .getElementById("breatheStatus")
    .innerHTML = step.text;

    let t = step.time;

    document
    .getElementById("breatheTime")
    .innerHTML = t;

    const circle =
    document.getElementById("breatheProgress");

    const length = 691;

    circle.style.strokeDashoffset = length;

    clearInterval(breatheTimer);

    breatheTimer = setInterval(()=>{

        t--;

        document
        .getElementById("breatheTime")
        .innerHTML=t;

        circle.style.strokeDashoffset =

        length -
        ((step.time-t)/step.time)*length;

        if(t<=0){

            clearInterval(breatheTimer);

            breatheIndex++;

            if(breatheIndex>=breatheSteps.length){

                breatheIndex=0;

            }

            nextStep();

        }

    },1000);

}

GameManager.register("breathe",{

    open(){

        openBreathe();

    },

    close(){

        closeBreathe();

    }

});