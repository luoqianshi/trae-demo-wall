/* =====================================
    Healing Quotes
===================================== */

const QuoteCenter={

quotes:[

{
text:"慢一点没有关系，真正重要的是你没有停下。",
author:"Healing"
},

{
text:"允许自己休息，不代表放弃。",
author:"Healing"
},

{
text:"今天已经很努力了。",
author:"Healing"
},

{
text:"你不是机器，也需要充电。",
author:"Healing"
},

{
text:"把今天交给今天，把明天交给明天。",
author:"Healing"
},

{
text:"风会停，雨会晴。",
author:"Healing"
},

{
text:"你已经比昨天更勇敢。",
author:"Healing"
},

{
text:"焦虑不会解决问题，行动会。",
author:"Healing"
},

{
text:"每一次呼吸，都在重新开始。",
author:"Healing"
},

{
text:"世界没有催你，是你太想快一点。",
author:"Healing"
}

],

index:0,

init(){

this.show();

document

.getElementById(

"changeQuote"

)

.onclick=()=>{

this.next();

};

document

.getElementById(

"prevQuote"

)

.onclick=()=>{

this.prev();

};

document

.getElementById(

"copyQuote"

)

.onclick=()=>{

navigator.clipboard.writeText(

this.quotes[this.index].text

);

toast("已复制");

};

document

.getElementById(

"favoriteQuote"

)

.onclick=()=>{

localStorage.setItem(

"favoriteQuote",

JSON.stringify(

this.quotes[this.index]

)

);

toast("已收藏");

};

},

show(){

const q=this.quotes[this.index];

document

.getElementById(

"todayQuote"

)

.innerHTML=

`"${q.text}"`;

document

.getElementById(

"quoteAuthor"

)

.innerHTML=

"—— "+q.author;

},

next(){

this.index++;

if(this.index>=this.quotes.length){

this.index=0;

}

this.show();

},

prev(){

this.index--;

if(this.index<0){

this.index=

this.quotes.length-1;

}

this.show();

}

};

document.addEventListener(

"DOMContentLoaded",

()=>{

QuoteCenter.init();

});