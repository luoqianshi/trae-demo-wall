/* ============================================
   Stress Relief Lab
   app.js
============================================ */

document.addEventListener("DOMContentLoaded", () => {

    initHero();

    initMood();

    initScroll();

    initDarkMode();

    initToolCard();

    initNavbar();

});

/* ============================================
   Hero
============================================ */

function initHero(){

    const btn=document.querySelector(".start-btn");

    if(!btn) return;

    btn.addEventListener("click",()=>{

        document
        .querySelector("#mood")
        .scrollIntoView({

            behavior:"smooth"

        });

    });

}

/* ============================================
   Mood
============================================ */

function initMood(){

    const cards=document.querySelectorAll(".mood-card");

    cards.forEach(card=>{

        card.onclick=()=>{

            cards.forEach(item=>{

                item.classList.remove("active");

            });

            card.classList.add("active");

            recommend(card.innerText);

        };

    });

}

/* 推荐小游戏 */

function recommend(type){

    const toolCards=document.querySelectorAll(".tool-card");

    toolCards.forEach(item=>{

        item.classList.remove("recommend");

    });

    switch(type){

        case "😡":

            toolCards[1].classList.add("recommend");

            toolCards[3].classList.add("recommend");

            break;

        case "😭":

            toolCards[4].classList.add("recommend");

            toolCards[6].classList.add("recommend");

            break;

        case "😣":

            toolCards[0].classList.add("recommend");

            toolCards[4].classList.add("recommend");

            break;

        case "😊":

            toolCards[5].classList.add("recommend");

            break;

        default:

            toolCards[0].classList.add("recommend");

    }

}

const mood=document.getElementById("quoteMood");

const map={

"😊":"今天继续保持好心情 🌸",

"😐":"放慢一点，也很好 ☁",

"😣":"先深呼吸，再继续前进 🌱",

"😭":"今天请善待自己 ❤️",

"😡":"把情绪交给风，把自己留给快乐 🍃"

};

if(mood){

mood.innerHTML="今天值得被温柔对待";

}

/* ============================================
   Scroll
============================================ */

function initScroll(){

    let topBtn=document.getElementById("scrollTop");

    if(!topBtn){

        topBtn=document.createElement("div");

        topBtn.id="scrollTop";

        topBtn.innerHTML="↑";

        document.body.appendChild(topBtn);

    }

    topBtn.onclick=()=>{

        window.scrollTo({

            top:0,

            behavior:"smooth"

        });

    };

    window.addEventListener("scroll",()=>{

        if(window.scrollY>400){

            topBtn.classList.add("show");

        }else{

            topBtn.classList.remove("show");

        }

        reveal();

        navActive();

    });

}

/* ============================================
   Reveal Animation
============================================ */

function reveal(){

    const sections=document.querySelectorAll("section");

    sections.forEach(item=>{

        const top=item.getBoundingClientRect().top;

        if(top<window.innerHeight-120){

            item.classList.add("show");

        }

    });

}

/* ============================================
   Navbar Active
============================================ */

function initNavbar(){

    navActive();

}

function navActive(){

    const sections=document.querySelectorAll("section");

    const nav=document.querySelectorAll("nav a");

    let current=0;

    sections.forEach((section,index)=>{

        if(window.scrollY>=section.offsetTop-180){

            current=index;

        }

    });

    nav.forEach(item=>{

        item.classList.remove("active");

    });

    if(nav[current]){

        nav[current].classList.add("active");

    }

}

/* ============================================
   Dark Mode
============================================ */

function initDarkMode(){

    const btn = document.getElementById("darkBtn");
    if(!btn) return;

    const storage = localStorage.getItem("theme");

    if(storage){

        document.body.classList.toggle(
            "dark",
            storage === "dark"
        );

    }else{

        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        document.body.classList.toggle("dark", prefersDark);

    }

    btn.onclick = ()=>{

        const isDark = document.body.classList.toggle("dark");

        localStorage.setItem(
            "theme",
            isDark ? "dark" : "light"
        );

        btn.innerHTML = isDark ? "☀️" : "🌙";

    };

    window.matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change",(e)=>{

            if(localStorage.getItem("theme")) return;

            document.body.classList.toggle("dark",e.matches);

        });

}

/* ============================================
   Tool Card
============================================ */

function initToolCard(){

    const cards=document.querySelectorAll(".tool-card");

    cards.forEach(card=>{

        card.addEventListener("mousemove",(e)=>{

            const rect=card.getBoundingClientRect();

            const x=e.clientX-rect.left;

            const y=e.clientY-rect.top;

            card.style.setProperty("--x",`${x}px`);

            card.style.setProperty("--y",`${y}px`);

        });

        card.onclick=()=>{

            const type=card.dataset.tool;

            switch(type){

                case "bubble":

                    GameManager.open("bubble");

                    break;

                case "burn":

                    GameManager.open("burn");

                    break;
				case "breathe":

					GameManager.open("breathe");

					break;
				case "sand":
					GameManager.open("sand");
					break;
				case "star":

					GameManager.open("star");

					break;
				case "spray":

					GameManager.open("spray");

					break;
				case "audio":
					toggleAudioPanel();
					break;
				case "shredder":
					GameManager.open("shredder");
					break;
				case "ai":
					GameManager.open("ai");
					break;

            }

        };

    });

}

/* ============================================
   Utils
============================================ */

function toast(msg){

    const div=document.createElement("div");

    div.className="toast";

    div.innerHTML=msg;

    document.body.appendChild(div);

    setTimeout(()=>{

        div.classList.add("show");

    },10);

    setTimeout(()=>{

        div.remove();

    },2500);

}

document.addEventListener("keydown",(e)=>{

    if(e.key==="Escape"){

        GameManager.close();

    }

});


const musicBtn = document.getElementById("musicBtn");
const audioPanel = document.getElementById("audioPanel");

if (musicBtn && audioPanel) {

    audioPanel.style.display = "none";

    musicBtn.onclick = () => {

        audioPanel.style.display =
            audioPanel.style.display === "none"
                ? "block"
                : "none";

    };

}
