import{a,b as c}from"./index-iC58AxAl.js";function m(o,i){const t=new Blob([i],{type:"text/markdown;charset=utf-8"});l(t,`${o}.md`)}function d(o){const t=c().getManuscriptById(o);if(!t)return;let n=`# ${t.title}

`;t.outline.forEach(e=>{n+=`## ${e.title}

`,e.sections&&e.sections.length>0?e.sections.forEach(r=>{n+=`### ${r.title}

`,r.content&&(n+=r.content+`

`)}):e.content&&(n+=e.content+`

`)}),m(t.title,n)}function p(o){const t=a().getMemoirById(o);if(!t)return;let n=`# ${t.title}

`;t.outline.forEach(e=>{n+=`## ${e.title}

`,e.sections.forEach(r=>{n+=`### ${r.title}

`,r.content&&(n+=r.content+`

`)})}),m(t.title,n)}function f(o,i){const t=window.open("","_blank");t.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${o}</title>
      <style>
        body {
          font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
          max-width: 800px;
          margin: 40px auto;
          padding: 0 20px;
          line-height: 1.8;
          color: #333;
        }
        h1 { font-size: 24px; margin-bottom: 24px; }
        h2 { font-size: 20px; margin-top: 32px; margin-bottom: 16px; }
        h3 { font-size: 16px; margin-top: 24px; margin-bottom: 12px; }
        p { margin-bottom: 12px; text-indent: 2em; }
      </style>
    </head>
    <body>${i.replace(/\n/g,"<br>")}</body>
    </html>
  `),t.document.close(),t.print()}function l(o,i){const t=URL.createObjectURL(o),n=document.createElement("a");n.href=t,n.download=i,document.body.appendChild(n),n.click(),document.body.removeChild(n),URL.revokeObjectURL(t)}export{f as a,d as b,p as e};
