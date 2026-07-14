const l="sk-YOUR_API_KEY_HERE",h="https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",u="qwen-vl-plus";function g(s,t=1024){return new Promise((o,e)=>{const n=new FileReader;n.onerror=()=>e(new Error("文件读取失败")),n.onload=d=>{const c=new Image;c.onerror=()=>e(new Error("图片解码失败")),c.onload=()=>{const i=document.createElement("canvas");let{width:r,height:a}=c;(r>t||a>t)&&(r>a?(a=Math.round(a*t/r),r=t):(r=Math.round(r*t/a),a=t)),i.width=r,i.height=a,i.getContext("2d").drawImage(c,0,0,r,a),o(i.toDataURL("image/jpeg",.8))},c.src=d.target.result},n.readAsDataURL(s)})}function m(s,t,o=3e4){const e=new AbortController,n=setTimeout(()=>e.abort(),o);return fetch(s,{...t,signal:e.signal}).finally(()=>clearTimeout(n))}async function f(s){const t=await g(s),o=await m(h,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${l}`},body:JSON.stringify({model:u,messages:[{role:"user",content:[{type:"image_url",image_url:{url:t}},{type:"text",text:'请仔细识别这张图片中的所有文字内容，保持原始的段落格式和换行。只输出你识别到的文字，不要添加任何解释、总结或额外内容。如果图片中没有文字，请回复"图片中未检测到文字"。'}]}]})});if(!o.ok){const n=await o.text();throw new Error(`识别请求失败 (${o.status}): ${n}`)}const e=await o.json();if(e.choices&&e.choices[0]&&e.choices[0].message){const n=e.choices[0].message.content;if(n&&n!=="图片中未检测到文字")return n.trim()}return""}async function p(s){const t=await m(h,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${l}`},body:JSON.stringify({model:u,messages:[{role:"user",content:[{type:"text",text:`请对以下日记内容做轻度润色，规则如下：
1. 只修正明显的错别字
2. 删除语音输入导致的重复语句（同一句话说了两遍的情况）
3. 删除过多且无意义的语气助词（如连续的"啊""呢""嘛""那个""就是""然后"）
4. 保持原文的整体风格、语气和段落结构不变
5. 不要添加任何新内容，不要改写句子
6. 直接输出润色后的文本，不要加任何解释

原文：
${s}`}]}]})});if(!t.ok){const e=await t.text();throw new Error(`润色请求失败 (${t.status}): ${e}`)}const o=await t.json();if(o.choices&&o.choices[0]&&o.choices[0].message){const e=o.choices[0].message.content;if(e)return e.trim()}return s}export{p as polishContent,f as recognizeText};
