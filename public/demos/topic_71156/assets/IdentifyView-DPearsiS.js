var Lg=Object.defineProperty;var Wg=(e,t,r)=>t in e?Lg(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;var dt=(e,t,r)=>Wg(e,typeof t!="symbol"?t+"":t,r);import{d as qa,o as Oe,c as Re,a as L,v as ki,n as xa,m as Rt,_ as La,t as Te,y as co,F as Vg,r as Gg,h as st,e as Ii,f as ho,z as Hg,l as Fg}from"./index-BM0PzdZ1.js";import{F as jg}from"./FooterSection-Fd8m7OgR.js";const Kg={class:"upload-section",id:"uploadSection"},Zg=qa({__name:"UploadSection",emits:["scrollToKnowledge","startQuiz","file-selected"],setup(e,{emit:t}){const r=t,i=Rt(null),a=Rt(!1);function n(){var p;(p=i.value)==null||p.click()}function s(p){var f;const c=p.target;(f=c.files)!=null&&f.length&&l(c.files[0])}function u(p){var c;a.value=!1,(c=p.dataTransfer)!=null&&c.files.length&&l(p.dataTransfer.files[0])}function l(p){if(!p.type.startsWith("image/")){alert("请上传图片文件！");return}r("file-selected",p)}return(p,c)=>(Oe(),Re("section",Kg,[L("div",{class:xa(["upload-area",{dragover:a.value}]),onClick:n,onDragover:c[0]||(c[0]=ki(f=>a.value=!0,["prevent"])),onDragleave:c[1]||(c[1]=f=>a.value=!1),onDrop:ki(u,["prevent"])},[c[2]||(c[2]=L("span",{class:"upload-icon"},"🖼️",-1)),c[3]||(c[3]=L("div",{class:"upload-text"},"将云朵照片拖到这里",-1)),c[4]||(c[4]=L("div",{class:"upload-hint"},"支持 JPG / PNG 格式",-1)),L("button",{class:"upload-btn",onClick:ki(n,["stop"])},"选择图片"),L("input",{ref_key:"fileInput",ref:i,type:"file",accept:"image/*",style:{display:"none"},onChange:s},null,544)],34)]))}}),Xg=La(Zg,[["__scopeId","data-v-d50810f4"]]),Qg={class:"recognition-result"},Yg={class:"result-content"},Jg={class:"result-details"},e0={class:"result-card cloud-form"},t0={class:"card-header"},r0={class:"confidence"},i0={class:"card-content"},a0={class:"cloud-type"},n0={class:"type-icon"},s0={class:"type-info"},o0={class:"type-name"},u0={class:"type-genus"},l0={class:"confidence-bar"},d0={key:0,class:"result-card other-species"},p0={class:"card-header"},c0={class:"species-count"},h0={class:"card-content"},f0={class:"species-list"},m0={class:"species-rank"},g0={class:"species-icon"},y0={class:"species-info"},_0={class:"species-name"},b0={class:"species-family"},$0={class:"species-prob"},w0={key:0,class:"species-more"},v0={class:"result-card cloud-cover"},x0={class:"card-header"},S0={class:"confidence"},k0={class:"card-content"},I0={class:"cover-display"},T0={class:"cover-visual"},C0={class:"cover-circle"},E0={viewBox:"0 0 100 100"},z0=["stroke-dasharray"],A0={class:"cover-text"},O0={class:"cover-info"},R0={class:"cover-description"},B0={class:"cover-oktas"},N0={class:"confidence-bar"},M0={class:"result-actions"},D0=qa({__name:"RecognitionResult",props:{result:{},imageUrl:{}},emits:["view-detail","re-identify"],setup(e){const t=r=>({高云:"🌤️",中云:"⛅",低云:"☁️",无云:"☀️"})[r]||"☁️";return(r,i)=>(Oe(),Re("div",Qg,[i[6]||(i[6]=L("div",{class:"result-header"},[L("div",{class:"result-icon"},"☁️"),L("h3",null,"AI识云结果")],-1)),L("div",Yg,[L("div",Jg,[L("div",e0,[L("div",t0,[i[2]||(i[2]=L("span",{class:"label"},"主要云种",-1)),L("span",r0,Te((e.result.primarySpecies.probability*100).toFixed(1))+"%",1)]),L("div",i0,[L("div",a0,[L("span",n0,Te(t(e.result.primarySpecies.family)),1),L("div",s0,[L("div",o0,Te(e.result.primarySpecies.name),1),L("div",u0,Te(e.result.primarySpecies.genus)+" ("+Te(e.result.primarySpecies.abbr||e.result.primarySpecies.code)+")",1)])]),L("div",l0,[L("div",{class:"confidence-fill",style:co({width:e.result.primarySpecies.probability*100+"%"})},null,4)])])]),e.result.detectedSpecies.length>1?(Oe(),Re("div",d0,[L("div",p0,[i[3]||(i[3]=L("span",{class:"label"},"其他检测到的云种",-1)),L("span",c0,Te(e.result.detectedSpecies.length-1)+" 种",1)]),L("div",h0,[L("div",f0,[(Oe(!0),Re(Vg,null,Gg(e.result.detectedSpecies.slice(1,5),(a,n)=>(Oe(),Re("div",{class:"species-item",key:a.index},[L("span",m0,Te(n+2),1),L("span",g0,Te(t(a.family)),1),L("div",y0,[L("div",_0,Te(a.name),1),L("div",b0,Te(a.genus)+" ("+Te(a.abbr||a.code)+")",1)]),L("span",$0,Te((a.probability*100).toFixed(1))+"%",1)]))),128)),e.result.detectedSpecies.length>5?(Oe(),Re("div",w0," 还有 "+Te(e.result.detectedSpecies.length-5)+" 种... ",1)):st("",!0)])])])):st("",!0),L("div",v0,[L("div",x0,[i[4]||(i[4]=L("span",{class:"label"},"总云量",-1)),L("span",S0,Te((e.result.cloudCover.confidence*100).toFixed(1))+"%",1)]),L("div",k0,[L("div",I0,[L("div",T0,[L("div",C0,[(Oe(),Re("svg",E0,[i[5]||(i[5]=L("circle",{cx:"50",cy:"50",r:"45",fill:"none",stroke:"#e0e0e0","stroke-width":"8"},null,-1)),L("circle",{cx:"50",cy:"50",r:"45",fill:"none",stroke:"#4CAF50","stroke-width":"8","stroke-linecap":"round","stroke-dasharray":`${e.result.cloudCover.index/10*283} 283`,transform:"rotate(-90 50 50)"},null,8,z0)])),L("div",A0,Te(e.result.cloudCover.level),1)])]),L("div",O0,[L("div",R0,Te(e.result.cloudCover.description),1),L("div",B0,Te(e.result.cloudCover.index)+"/10 成云",1)])]),L("div",N0,[L("div",{class:"confidence-fill",style:co({width:e.result.cloudCover.confidence*100+"%"})},null,4)])])])])]),L("div",M0,[e.result.primarySpecies.genusId?(Oe(),Re("button",{key:0,class:"btn btn-primary",onClick:i[0]||(i[0]=a=>r.$emit("view-detail",e.result.primarySpecies.genusId))}," 查看云种详情 ")):st("",!0),L("button",{class:"btn btn-secondary",onClick:i[1]||(i[1]=a=>r.$emit("re-identify"))}," 重新识别 ")])]))}}),P0=La(D0,[["__scopeId","data-v-f1107dfe"]]);/*!
 * ONNX Runtime Web v1.27.0
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */var Wa=Object.defineProperty,U0=Object.getOwnPropertyDescriptor,q0=Object.getOwnPropertyNames,L0=Object.prototype.hasOwnProperty,W0=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof require<"u"?require:t)[r]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),P=(e,t)=>()=>(e&&(t=e(e=0)),t),Qt=(e,t)=>{for(var r in t)Wa(e,r,{get:t[r],enumerable:!0})},V0=(e,t,r,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of q0(t))!L0.call(e,a)&&a!==r&&Wa(e,a,{get:()=>t[a],enumerable:!(i=U0(t,a))||i.enumerable});return e},_r=e=>V0(Wa({},"__esModule",{value:!0}),e),ir,$t,jt,fo,Xd,Qd=P(()=>{ir=new Map,$t=[],jt=(e,t,r)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let i=ir.get(e);if(i===void 0)ir.set(e,{backend:t,priority:r});else{if(i.priority>r)return;if(i.priority===r&&i.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let a=$t.indexOf(e);a!==-1&&$t.splice(a,1);for(let n=0;n<$t.length;n++)if(ir.get($t[n]).priority<=r){$t.splice(n,0,e);return}$t.push(e)}return}throw new TypeError("not a valid backend")},fo=async e=>{let t=ir.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{return r||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(i){return r||(t.error=`${i}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},Xd=async e=>{let t=e.executionProviders||[],r=t.map(l=>typeof l=="string"?l:l.name),i=r.length===0?$t:r,a,n=[],s=new Set;for(let l of i){let p=await fo(l);typeof p=="string"?n.push({name:l,err:p}):(a||(a=p),a===p&&s.add(l))}if(!a)throw new Error(`no available backend found. ERR: ${n.map(l=>`[${l.name}] ${l.err}`).join(", ")}`);for(let{name:l,err:p}of n)r.includes(l)&&console.warn(`removing requested execution provider "${l}" from session options because it is not available: ${p}`);let u=t.filter(l=>s.has(typeof l=="string"?l:l.name));return[a,new Proxy(e,{get:(l,p)=>p==="executionProviders"?u:Reflect.get(l,p)})]}}),G0=P(()=>{Qd()}),Yd,H0=P(()=>{Yd="1.27.0"}),Ti,Ee,Jd=P(()=>{H0(),Ti="warning",Ee={wasm:{},webgl:{},webgpu:{},versions:{common:Yd},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);Ti=e}},get logLevel(){return Ti}},Object.defineProperty(Ee,"logLevel",{enumerable:!0})}),be,F0=P(()=>{Jd(),be=Ee}),ep,tp,j0=P(()=>{ep=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let i=r.getContext("2d");if(i!=null){let a,n;(t==null?void 0:t.tensorLayout)!==void 0&&t.tensorLayout==="NHWC"?(a=e.dims[2],n=e.dims[3]):(a=e.dims[3],n=e.dims[2]);let s=(t==null?void 0:t.format)!==void 0?t.format:"RGB",u=t==null?void 0:t.norm,l,p;u===void 0||u.mean===void 0?l=[255,255,255,255]:typeof u.mean=="number"?l=[u.mean,u.mean,u.mean,u.mean]:(l=[u.mean[0],u.mean[1],u.mean[2],0],u.mean[3]!==void 0&&(l[3]=u.mean[3])),u===void 0||u.bias===void 0?p=[0,0,0,0]:typeof u.bias=="number"?p=[u.bias,u.bias,u.bias,u.bias]:(p=[u.bias[0],u.bias[1],u.bias[2],0],u.bias[3]!==void 0&&(p[3]=u.bias[3]));let c=n*a,f=0,g=c,y=c*2,_=-1;s==="RGBA"?(f=0,g=c,y=c*2,_=c*3):s==="RGB"?(f=0,g=c,y=c*2):s==="RBG"&&(f=0,y=c,g=c*2);for(let b=0;b<n;b++)for(let S=0;S<a;S++){let x=(e.data[f++]-p[0])*l[0],$=(e.data[g++]-p[1])*l[1],T=(e.data[y++]-p[2])*l[2],k=_===-1?255:(e.data[_++]-p[3])*l[3];i.fillStyle="rgba("+x+","+$+","+T+","+k+")",i.fillRect(S,b,1,1)}if("toDataURL"in r)return r.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},tp=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),i;if(r!=null){let a,n,s;(t==null?void 0:t.tensorLayout)!==void 0&&t.tensorLayout==="NHWC"?(a=e.dims[2],n=e.dims[1],s=e.dims[3]):(a=e.dims[3],n=e.dims[2],s=e.dims[1]);let u=t!==void 0&&t.format!==void 0?t.format:"RGB",l=t==null?void 0:t.norm,p,c;l===void 0||l.mean===void 0?p=[255,255,255,255]:typeof l.mean=="number"?p=[l.mean,l.mean,l.mean,l.mean]:(p=[l.mean[0],l.mean[1],l.mean[2],255],l.mean[3]!==void 0&&(p[3]=l.mean[3])),l===void 0||l.bias===void 0?c=[0,0,0,0]:typeof l.bias=="number"?c=[l.bias,l.bias,l.bias,l.bias]:(c=[l.bias[0],l.bias[1],l.bias[2],0],l.bias[3]!==void 0&&(c[3]=l.bias[3]));let f=n*a;if(t!==void 0&&(t.format!==void 0&&s===4&&t.format!=="RGBA"||s===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let g=4,y=0,_=1,b=2,S=3,x=0,$=f,T=f*2,k=-1;u==="RGBA"?(x=0,$=f,T=f*2,k=f*3):u==="RGB"?(x=0,$=f,T=f*2):u==="RBG"&&(x=0,T=f,$=f*2),i=r.createImageData(a,n);for(let C=0;C<n*a;y+=g,_+=g,b+=g,S+=g,C++)i.data[y]=(e.data[x++]-c[0])*p[0],i.data[_]=(e.data[$++]-c[1])*p[1],i.data[b]=(e.data[T++]-c[2])*p[2],i.data[S]=k===-1?255:(e.data[k++]-c[3])*p[3]}else throw new Error("Can not access image data");return i}}),Rr,rp,ip,ap,np,sp,K0=P(()=>{Va(),Rr=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:r,width:i}=t,a=t.norm??{mean:255,bias:0},n,s;typeof a.mean=="number"?n=[a.mean,a.mean,a.mean,a.mean]:n=[a.mean[0],a.mean[1],a.mean[2],a.mean[3]??255],typeof a.bias=="number"?s=[a.bias,a.bias,a.bias,a.bias]:s=[a.bias[0],a.bias[1],a.bias[2],a.bias[3]??0];let u=t.format!==void 0?t.format:"RGBA",l=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",p=r*i,c=l==="RGBA"?new Float32Array(p*4):new Float32Array(p*3),f=4,g=0,y=1,_=2,b=3,S=0,x=p,$=p*2,T=-1;u==="RGB"&&(f=3,g=0,y=1,_=2,b=-1),l==="RGBA"?T=p*3:l==="RBG"?(S=0,$=p,x=p*2):l==="BGR"&&($=0,x=p,S=p*2);for(let k=0;k<p;k++,g+=f,_+=f,y+=f,b+=f)c[S++]=(e[g]+s[0])/n[0],c[x++]=(e[y]+s[1])/n[1],c[$++]=(e[_]+s[2])/n[2],T!==-1&&b!==-1&&(c[T++]=(e[b]+s[3])/n[3]);return l==="RGBA"?new We("float32",c,[1,4,r,i]):new We("float32",c,[1,3,r,i])},rp=async(e,t)=>{let r=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,i=typeof ImageData<"u"&&e instanceof ImageData,a=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,n=typeof e=="string",s,u=t??{},l=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},p=c=>typeof HTMLCanvasElement<"u"&&c instanceof HTMLCanvasElement||c instanceof OffscreenCanvas?c.getContext("2d"):null;if(r){let c=l();c.width=e.width,c.height=e.height;let f=p(c);if(f!=null){let g=e.height,y=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(g=t.resizedHeight,y=t.resizedWidth),t!==void 0){if(u=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");u.tensorFormat="RGBA",u.height=g,u.width=y}else u.tensorFormat="RGBA",u.height=g,u.width=y;f.drawImage(e,0,0),s=f.getImageData(0,0,y,g).data}else throw new Error("Can not access image data")}else if(i){let c,f;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(c=t.resizedHeight,f=t.resizedWidth):(c=e.height,f=e.width),t!==void 0&&(u=t),u.format="RGBA",u.height=c,u.width=f,t!==void 0){let g=l();g.width=f,g.height=c;let y=p(g);if(y!=null)y.putImageData(e,0,0),s=y.getImageData(0,0,f,c).data;else throw new Error("Can not access image data")}else s=e.data}else if(a){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let c=l();c.width=e.width,c.height=e.height;let f=p(c);if(f!=null){let g=e.height,y=e.width;return f.drawImage(e,0,0,y,g),s=f.getImageData(0,0,y,g).data,u.height=g,u.width=y,Rr(s,u)}else throw new Error("Can not access image data")}else{if(n)return new Promise((c,f)=>{let g=l(),y=p(g);if(!e||!y)return f();let _=new Image;_.crossOrigin="Anonymous",_.src=e,_.onload=()=>{g.width=_.width,g.height=_.height,y.drawImage(_,0,0,g.width,g.height);let b=y.getImageData(0,0,g.width,g.height);u.height=g.height,u.width=g.width,c(Rr(b.data,u))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(s!==void 0)return Rr(s,u);throw new Error("Input data provided is not supported - aborted tensor creation")},ip=(e,t)=>{let{width:r,height:i,download:a,dispose:n}=t,s=[1,i,r,4];return new We({location:"texture",type:"float32",texture:e,dims:s,download:a,dispose:n})},ap=(e,t)=>{let{dataType:r,dims:i,download:a,dispose:n}=t;return new We({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:i,download:a,dispose:n})},np=(e,t)=>{let{dataType:r,dims:i,download:a,dispose:n}=t;return new We({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:i,download:a,dispose:n})},sp=(e,t,r)=>new We({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),Bt,hr,Ci,op,Z0=P(()=>{Bt=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),hr=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),Ci=!1,op=()=>{if(!Ci){Ci=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,r=globalThis.Float16Array,i=typeof r<"u"&&r.from;e&&(Bt.set("int64",BigInt64Array),hr.set(BigInt64Array,"int64")),t&&(Bt.set("uint64",BigUint64Array),hr.set(BigUint64Array,"uint64")),i?(Bt.set("float16",r),hr.set(r,"float16")):Bt.set("float16",Uint16Array)}}}),up,lp,X0=P(()=>{Va(),up=e=>{let t=1;for(let r=0;r<e.length;r++){let i=e[r];if(typeof i!="number"||!Number.isSafeInteger(i))throw new TypeError(`dims[${r}] must be an integer, got: ${i}`);if(i<0)throw new RangeError(`dims[${r}] must be a non-negative integer, got: ${i}`);t*=i}return t},lp=(e,t)=>{switch(e.location){case"cpu":return new We(e.type,e.data,t);case"cpu-pinned":return new We({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new We({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new We({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new We({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),We,Va=P(()=>{j0(),K0(),Z0(),X0(),We=class{constructor(e,t,r){op();let i,a;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,i=e.type,a=e.dims,e.location){case"cpu-pinned":{let s=Bt.get(i);if(!s)throw new TypeError(`unsupported type "${i}" to create tensor from pinned buffer`);if(!(e.data instanceof s))throw new TypeError(`buffer should be of type ${s.name}`);this.cpuData=e.data;break}case"texture":{if(i!=="float32")throw new TypeError(`unsupported type "${i}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint64"&&i!=="int8"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let s,u;if(typeof e=="string")if(i=e,u=r,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");s=t}else{let l=Bt.get(e);if(l===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&l===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${l.name} as data.`);e==="uint64"||e==="int64"?s=l.from(t,BigInt):s=l.from(t)}else if(t instanceof l)s=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")s=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&l!==Uint16Array)s=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${i} tensor's data must be type of ${l}`)}else if(u=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let l=typeof e[0];if(l==="string")i="string",s=e;else if(l==="boolean")i="bool",s=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${l}.`)}else if(e instanceof Uint8ClampedArray)i="uint8",s=Uint8Array.from(e);else{let l=hr.get(e.constructor);if(l===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);i=l,s=e}if(u===void 0)u=[s.length];else if(!Array.isArray(u))throw new TypeError("A tensor's dims must be a number array");a=u,this.cpuData=s,this.dataLocation="cpu"}let n=up(a);if(this.cpuData&&n!==this.cpuData.length&&!((i==="uint4"||i==="int4")&&Math.ceil(n/2)===this.cpuData.length))throw new Error(`Tensor's size(${n}) does not match data length(${this.cpuData.length}).`);this.type=i,this.dims=a,this.size=n}static async fromImage(e,t){return rp(e,t)}static fromTexture(e,t){return ip(e,t)}static fromGpuBuffer(e,t){return ap(e,t)}static fromMLTensor(e,t){return np(e,t)}static fromPinnedBuffer(e,t,r){return sp(e,t,r)}toDataURL(e){return ep(this,e)}toImageData(e){return tp(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return lp(this,e)}}}),et,dp=P(()=>{Va(),et=We}),Kr,Ei,ot,tt,Dt,Pt,pp=P(()=>{Jd(),Kr=(e,t)=>{(typeof Ee.trace>"u"?!Ee.wasm.trace:!Ee.trace)||console.timeStamp(`${e}::ORT::${t}`)},Ei=(e,t)=>{var a;let r=((a=new Error().stack)==null?void 0:a.split(/\r\n|\r|\n/g))||[],i=!1;for(let n=0;n<r.length;n++){if(i&&!r[n].includes("TRACE_FUNC")){let s=`FUNC_${e}::${r[n].trim().split(" ")[1]}`;t&&(s+=`::${t}`),Kr("CPU",s);return}r[n].includes("TRACE_FUNC")&&(i=!0)}},ot=e=>{(typeof Ee.trace>"u"?!Ee.wasm.trace:!Ee.trace)||Ei("BEGIN",e)},tt=e=>{(typeof Ee.trace>"u"?!Ee.wasm.trace:!Ee.trace)||Ei("END",e)},Dt=e=>{(typeof Ee.trace>"u"?!Ee.wasm.trace:!Ee.trace)||console.time(`ORT::${e}`)},Pt=e=>{(typeof Ee.trace>"u"?!Ee.wasm.trace:!Ee.trace)||console.timeEnd(`ORT::${e}`)}}),cp,Q0=P(()=>{Qd(),dp(),pp(),cp=class hp{constructor(t){this.handler=t}async run(t,r,i){ot(),Dt("InferenceSession.run");let a={},n={};if(typeof t!="object"||t===null||t instanceof et||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let s=!0;if(typeof r=="object"){if(r===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(r instanceof et)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(r)){if(r.length===0)throw new TypeError("'fetches' cannot be an empty array.");s=!1;for(let p of r){if(typeof p!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(p)===-1)throw new RangeError(`'fetches' contains invalid output name: ${p}.`);a[p]=null}if(typeof i=="object"&&i!==null)n=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else{let p=!1,c=Object.getOwnPropertyNames(r);for(let f of this.outputNames)if(c.indexOf(f)!==-1){let g=r[f];(g===null||g instanceof et)&&(p=!0,s=!1,a[f]=g)}if(p){if(typeof i=="object"&&i!==null)n=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else n=r}}else if(typeof r<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let p of this.inputNames)if(typeof t[p]>"u")throw new Error(`input '${p}' is missing in 'feeds'.`);if(s)for(let p of this.outputNames)a[p]=null;let u=await this.handler.run(t,a,n),l={};for(let p in u)if(Object.hasOwnProperty.call(u,p)){let c=u[p];c instanceof et?l[p]=c:l[p]=new et(c.type,c.data,c.dims)}return Pt("InferenceSession.run"),tt(),l}async release(){return this.handler.dispose()}static async create(t,r,i,a){ot(),Dt("InferenceSession.create");let n,s={};if(typeof t=="string"){if(n=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(n=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let c=t,f=0,g=t.byteLength;if(typeof r=="object"&&r!==null)s=r;else if(typeof r=="number"){if(f=r,!Number.isSafeInteger(f))throw new RangeError("'byteOffset' must be an integer.");if(f<0||f>=c.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${c.byteLength}).`);if(g=t.byteLength-f,typeof i=="number"){if(g=i,!Number.isSafeInteger(g))throw new RangeError("'byteLength' must be an integer.");if(g<=0||f+g>c.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${c.byteLength-f}].`);if(typeof a=="object"&&a!==null)s=a;else if(typeof a<"u")throw new TypeError("'options' must be an object.")}else if(typeof i<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof r<"u")throw new TypeError("'options' must be an object.");n=new Uint8Array(c,f,g)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[u,l]=await Xd(s),p=await u.createInferenceSessionHandler(n,l);return Pt("InferenceSession.create"),tt(),new hp(p)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),Ga,Y0=P(()=>{Q0(),Ga=cp}),J0=P(()=>{}),ey=P(()=>{}),ty=P(()=>{}),ry=P(()=>{}),iy={};Qt(iy,{InferenceSession:()=>Ga,TRACE:()=>Kr,TRACE_EVENT_BEGIN:()=>Dt,TRACE_EVENT_END:()=>Pt,TRACE_FUNC_BEGIN:()=>ot,TRACE_FUNC_END:()=>tt,Tensor:()=>et,env:()=>be,registerBackend:()=>jt});var Fe=P(()=>{G0(),F0(),Y0(),dp(),J0(),ey(),pp(),ty(),ry()}),Ha=P(()=>{}),fp={};Qt(fp,{default:()=>mp});var zi,Ai,mp,ay=P(()=>{var e;wf(),Wt(),Fa(),zi="ort-wasm-proxy-worker",Ai=((e=globalThis.self)==null?void 0:e.name)===zi,Ai&&(self.onmessage=t=>{let{type:r,in:i}=t.data;try{switch(r){case"init-wasm":ja(i.wasm).then(()=>{pn(i).then(()=>{postMessage({type:r})},a=>{postMessage({type:r,err:a})})},a=>{postMessage({type:r,err:a})});break;case"init-ep":{let{epName:a,env:n}=i;cn(n,a).then(()=>{postMessage({type:r})},s=>{postMessage({type:r,err:s})});break}case"copy-from":{let{buffer:a}=i,n=ti(a);postMessage({type:r,out:n});break}case"create":{let{model:a,options:n}=i;hn(a,n).then(s=>{postMessage({type:r,out:s})},s=>{postMessage({type:r,err:s})});break}case"release":fn(i),postMessage({type:r});break;case"run":{let{sessionId:a,inputIndices:n,inputs:s,outputIndices:u,options:l}=i;mn(a,n,s,u,new Array(u.length).fill(null),l).then(p=>{p.some(c=>c[3]!=="cpu")?postMessage({type:r,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:r,out:p},yn([...s,...p]))},p=>{postMessage({type:r,err:p})});break}case"end-profiling":gn(i),postMessage({type:r});break;default:}}catch(a){postMessage({type:r,err:a})}}),mp=Ai?null:t=>new Worker(t??Le,{type:"module",name:zi})}),gp={};Qt(gp,{default:()=>yp});async function mo(e={}){var lo,po;var t=e,r=!!globalThis.window,i=!!globalThis.WorkerGlobalScope,a=i&&((lo=self.name)==null?void 0:lo.startsWith("em-pthread"));t.mountExternalData=(o,d)=>{o.startsWith("./")&&(o=o.substring(2)),(t.Xc||(t.Xc=new Map)).set(o,d)},t.unmountExternalData=()=>{delete t.Xc},globalThis.SharedArrayBuffer??new WebAssembly.Memory({initial:0,maximum:0,shared:!0}).buffer.constructor;let n=o=>async(...d)=>{var m;try{if(t.Yc)throw Error("Session already started");let h=t.Yc={Kd:d[0],errors:[]},w=await o(...d);if(t.Yc!==h)throw Error("Session mismatch");(m=t.dd)==null||m.flush();let I=h.errors;if(0<I.length){let E=await Promise.all(I);if(E=E.filter(B=>B),0<E.length)throw Error(E.join(`
`))}return w}finally{t.Yc=null}};t.jsepInit=(o,d)=>{if(o==="webgpu"){[t.dd,t.Ad,t.Ed,t.ed,t.Dd,t.$b,t.Fd,t.Hd,t.Bd,t.Cd,t.Gd]=d;let m=t.dd;t.jsepRegisterBuffer=(h,w,I,E)=>m.registerBuffer(h,w,I,E),t.jsepGetBuffer=h=>m.getBuffer(h),t.jsepCreateDownloader=(h,w,I)=>m.createDownloader(h,w,I),t.jsepOnCreateSession=h=>{m.onCreateSession(h)},t.jsepOnReleaseSession=h=>{m.onReleaseSession(h)},t.jsepOnRunStart=h=>m.onRunStart(h),t.Id=(h,w)=>{m.upload(h,w)}}else if(o==="webnn"){let m=d[0];[t.Sd,t.sd,t.webnnEnsureTensor,t.td,t.webnnDownloadTensor,t.Rd,t.webnnEnableTraceEvent]=d.slice(1),t.webnnReleaseTensorId=t.sd,t.webnnUploadTensor=t.td,t.webnnRegisterMLContext=t.Rd,t.webnnOnRunStart=h=>m.onRunStart(h),t.webnnOnRunEnd=m.onRunEnd.bind(m),t.webnnOnReleaseSession=h=>{m.onReleaseSession(h)},t.webnnCreateMLTensorDownloader=(h,w)=>m.createMLTensorDownloader(h,w),t.webnnRegisterMLTensor=(h,w,I,E)=>m.registerMLTensor(h,w,I,E),t.webnnCreateMLContext=h=>m.createMLContext(h),t.webnnRegisterMLConstant=(h,w,I,E,B,W)=>m.registerMLConstant(h,w,I,E,B,t.Xc,W),t.webnnRegisterGraphInput=m.registerGraphInput.bind(m),t.webnnIsGraphInput=m.isGraphInput.bind(m),t.webnnRegisterGraphOutput=m.registerGraphOutput.bind(m),t.webnnIsGraphOutput=m.isGraphOutput.bind(m),t.webnnCreateTemporaryTensor=m.createTemporaryTensor.bind(m),t.webnnIsGraphInputOutputTypeSupported=m.isGraphInputOutputTypeSupported.bind(m)}};let s=()=>{let o=d=>(...m)=>{let h=it;return m=d(...m),it!=h?new Promise((w,I)=>{ci={resolve:w,reject:I}}):m};(()=>{for(let d of["_OrtAppendExecutionProvider","_OrtCreateSession","_OrtRun","_OrtRunWithBinding","_OrtBindInput"])t[d]=o(t[d])})(),n!==void 0&&(t._OrtRun=n(t._OrtRun),t._OrtRunWithBinding=n(t._OrtRunWithBinding)),s=void 0};t.asyncInit=()=>{s==null||s()};var u,l,p=(o,d)=>{throw d},c=import.meta.url,f="";if(r||i){try{f=new URL(".",c).href}catch{}i&&(l=o=>{var d=new XMLHttpRequest;return d.open("GET",o,!1),d.responseType="arraybuffer",d.send(null),new Uint8Array(d.response)}),u=async o=>{if(A(o))return new Promise((m,h)=>{var w=new XMLHttpRequest;w.open("GET",o,!0),w.responseType="arraybuffer",w.onload=()=>{w.status==200||w.status==0&&w.response?m(w.response):h(w.status)},w.onerror=h,w.send(null)});var d=await fetch(o,{credentials:"same-origin"});if(d.ok)return d.arrayBuffer();throw Error(d.status+" : "+d.url)}}var g,y,_,b,S,x,$=console.log.bind(console),T=console.error.bind(console),k=$,C=T,z=!1,A=o=>o.startsWith("file://");function v(){gt.buffer!=D.buffer&&G()}if(a){let o=function(d){try{var m=d.data,h=m.Sc;if(h==="load"){let w=[];self.onmessage=I=>w.push(I),x=()=>{postMessage({Sc:"loaded"});for(let I of w)o(I);self.onmessage=o};for(let I of m.xd)t[I]&&!t[I].proxy||(t[I]=(...E)=>{postMessage({Sc:"callHandler",wd:I,args:E})},I=="print"&&(k=t[I]),I=="printErr"&&(C=t[I]));gt=m.Od,G(),y=m.Pd,Ge(),Or()}else if(h==="run"){(function(w){var I=(v(),Z)[w+52>>>2>>>0];w=(v(),Z)[w+56>>>2>>>0],bs(I,I-w),oe(I)})(m.Rc),yi(m.Rc,0,0,1,0,0),$n(),li(m.Rc),M||(hs(),M=!0);try{Rf(m.Md,m.bd)}catch(w){if(w!="unwind")throw w}}else m.target!=="setimmediate"&&(h==="checkMailbox"?M&&kr():h&&(C(`worker: received unknown command ${h}`),C(m)))}catch(w){throw fs(),w}};var M=!1;self.onunhandledrejection=d=>{throw d.reason||d},self.onmessage=o}var D,F,j,K,R,Z,X,te,fe,V,le,U=!1;function G(){var o=gt.buffer;t.HEAP8=D=new Int8Array(o),j=new Int16Array(o),t.HEAPU8=F=new Uint8Array(o),K=new Uint16Array(o),t.HEAP32=R=new Int32Array(o),t.HEAPU32=Z=new Uint32Array(o),X=new Float32Array(o),te=new Float64Array(o),fe=new BigInt64Array(o),V=new BigUint64Array(o)}function Q(){U=!0,a?x():lt.sb()}function q(o){throw C(o="Aborted("+o+")"),z=!0,o=new WebAssembly.RuntimeError(o+". Build with -sASSERTIONS for more info."),S==null||S(o),o}function ge(){return{a:{ma:rg,gb:tg,g:Bf,J:Nf,f:Mf,o:Df,h:Pf,ha:Uf,b:qf,T:Lf,Ha:In,n:Wf,$:zn,Xa:An,Da:On,Fa:Rn,Ya:Bn,Va:Nn,Oa:Mn,Ua:Dn,ka:Pn,Ea:Un,Ba:qn,Wa:Ln,Ca:Wn,bb:Vf,ea:Gf,wa:Hf,ua:jf,da:Zf,O:Xf,H:Qf,va:Yf,_:nm,xa:sm,Ra:om,za:lm,Ia:dm,sa:pm,fa:cm,Qa:li,_a:hm,R:ym,r:vm,c:oi,hb:xm,y:Sm,M:km,D:Im,l:Tm,s:Xn,ib:Cm,I:Em,S:zm,j:Am,u:Om,q:Rm,k:Bm,La:Nm,Ma:Mm,Na:Dm,Ja:es,Ka:ts,ta:rs,db:Um,ab:Lm,v:Wm,aa:Vm,ga:Gm,$a:qm,W:Hm,Za:Fm,Aa:jm,F:Pm,U:Km,la:zr,ya:Xm,fb:Zm,eb:Qm,Sa:ss,Ta:os,Ga:Yt,V:us,ja:ls,Pa:ds,ia:ps,kb:Pg,na:Rg,lb:Dg,oa:Og,G:xg,e:sg,t:ag,w:ig,B:gg,mb:Eg,K:$g,x:lg,pa:zg,Y:Bg,ba:Cg,nb:Tg,ob:Ig,P:yg,qa:kg,pb:Sg,N:wg,Z:Ag,d:ng,A:ug,m:og,jb:Ug,p:pg,z:cg,C:dg,E:hg,L:_g,qb:vg,Q:Ng,ca:bg,X:Mg,rb:mg,ra:fg,i:Jm,a:gt,cb:qe}}}async function Ge(){function o(h,w){var I=lt=h.exports;h={};for(let[E,B]of Object.entries(I))typeof B=="function"?(I=fm(B),h[E]=I):h[E]=B;return lt=h,lt=(function(){var E=lt,B=H=>se=>H(se)>>>0,W=H=>()=>H()>>>0;return(E=Object.assign({},E)).tb=B(E.tb),E.Xb=W(E.Xb),E.Zb=B(E.Zb),E.lc=B(E.lc),E.mc=W(E.mc),E.qc=B(E.qc),E})(),_n.push(lt._b),cs=(h=lt).tb,hs=h.ub,t._OrtInit=h.vb,t._OrtGetLastError=h.wb,t._OrtCreateSessionOptions=h.xb,t._OrtAppendExecutionProvider=h.yb,t._OrtAddFreeDimensionOverride=h.zb,t._OrtAddSessionConfigEntry=h.Ab,t._OrtReleaseSessionOptions=h.Bb,t._OrtCreateSession=h.Cb,t._OrtReleaseSession=h.Db,t._OrtGetInputOutputCount=h.Eb,t._OrtGetInputOutputMetadata=h.Fb,t._OrtFree=h.Gb,t._OrtCreateTensor=h.Hb,t._OrtGetTensorData=h.Ib,t._OrtReleaseTensor=h.Jb,t._OrtCreateRunOptions=h.Kb,t._OrtAddRunConfigEntry=h.Lb,t._OrtReleaseRunOptions=h.Mb,t._OrtCreateBinding=h.Nb,t._OrtBindInput=h.Ob,t._OrtBindOutput=h.Pb,t._OrtClearBoundOutputs=h.Qb,t._OrtReleaseBinding=h.Rb,t._OrtRunWithBinding=h.Sb,t._OrtRun=h.Tb,t._OrtEndProfiling=h.Ub,t._JsepOutput=h.Vb,t._JsepGetNodeName=h.Wb,Ar=h.Xb,at=t._free=h.Yb,tr=t._malloc=h.Zb,yi=h.ac,fs=h.bc,ms=h.cc,gs=h.dc,_i=h.ec,ys=h.fc,_s=h.gc,de=h.hc,rr=h.ic,bs=h.jc,oe=h.kc,bi=h.lc,ue=h.mc,$s=h.nc,$i=h.oc,ws=h.pc,vs=h.qc,xs=h.rc,wi=h.sc,Ss=h.tc,ks=h.uc,Is=h.vc,Ts=h.wc,Cs=h.xc,Es=h.yc,zs=h.zc,As=h.Ac,Os=h.Bc,Rs=h.Cc,Bs=h.Dc,Ns=h.Ec,Ms=h.Fc,Ds=h.Gc,Ps=h.Hc,Us=h.Ic,qs=h.Jc,Ls=h.Kc,Ws=h.Lc,Vs=h.Mc,Gs=h.Nc,Hs=h.Pc,Fs=h.Qc,js=h.$c,Ks=h.ad,Zs=h.fd,Xs=h.jd,Qs=h.kd,Ys=h.ld,Js=h.md,eo=h.nd,to=h.od,ro=h.pd,io=h.qd,ao=h.vd,no=h.Td,so=h.Ud,oo=h.Vd,uo=h.Wd,y=w,lt}var d,m=ge();return t.instantiateWasm?new Promise(h=>{t.instantiateWasm(m,(w,I)=>{h(o(w,I))})}):a?o(new WebAssembly.Instance(y,ge()),y):(le??(le=t.locateFile?t.locateFile?t.locateFile("ort-wasm-simd-threaded.jsep.wasm",f):f+"ort-wasm-simd-threaded.jsep.wasm":new URL("/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href),d=await(async function(h){var w=le;if(!g&&!A(w))try{var I=fetch(w,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(I,h)}catch(E){C(`wasm streaming compile failed: ${E}`),C("falling back to ArrayBuffer instantiation")}return(async function(E,B){try{var W=await(async function(H){if(!g)try{var se=await u(H);return new Uint8Array(se)}catch{}if(H==le&&g)H=new Uint8Array(g);else{if(!l)throw"both async and sync fetching of the wasm failed";H=l(H)}return H})(E);return await WebAssembly.instantiate(W,B)}catch(H){C(`failed to asynchronously prepare wasm: ${H}`),q(H)}})(w,h)})(m),o(d.instance,d.module))}class ke{constructor(d){dt(this,"name","ExitStatus");this.message=`Program terminated with exit(${d})`,this.status=d}}var Ne=o=>{o.terminate(),o.onmessage=()=>{}},Me=[],Ue=0,De=null,ft=o=>{mt.length==0&&(vn(),wn(mt[0]));var d=mt.pop();if(!d)return 6;Jt.push(d),kt[o.Rc]=d,d.Rc=o.Rc;var m={Sc:"run",Md:o.Ld,bd:o.bd,Rc:o.Rc};return d.postMessage(m,o.rd),0},we=0,ie=(o,d,...m)=>{var h,w=16*m.length,I=ue(),E=bi(w),B=E>>>3;for(h of m)typeof h=="bigint"?((v(),fe)[B++>>>0]=1n,(v(),fe)[B++>>>0]=h):((v(),fe)[B++>>>0]=0n,(v(),te)[B++>>>0]=h);return o=ms(o,0,w,E,d),oe(I),o};function qe(o){if(a)return ie(0,1,o);if(_=o,!(0<we)){for(var d of Jt)Ne(d);for(d of mt)Ne(d);mt=[],Jt=[],kt={},z=!0}p(0,new ke(o))}function $r(o){if(a)return ie(1,0,o);Yt(o)}var Yt=o=>{if(_=o,a)throw $r(o),"unwind";qe(o)},mt=[],Jt=[],_n=[],kt={},bn=o=>{var d=o.Rc;delete kt[d],mt.push(o),Jt.splice(Jt.indexOf(o),1),o.Rc=0,gs(d)};function $n(){_n.forEach(o=>o())}var wn=o=>new Promise(d=>{o.onmessage=w=>{var I=w.data;if(w=I.Sc,I.Zc&&I.Zc!=Ar()){var E=kt[I.Zc];E?E.postMessage(I,I.rd):C(`Internal error! Worker sent a message "${w}" to target pthread ${I.Zc}, but that thread no longer exists!`)}else w==="checkMailbox"?kr():w==="spawnThread"?ft(I):w==="cleanupThread"?Sr(()=>{bn(kt[I.Nd])}):w==="loaded"?(o.loaded=!0,d(o)):I.target==="setimmediate"?o.postMessage(I):w==="uncaughtException"?o.onerror(I.error):w==="callHandler"?t[I.wd](...I.args):w&&C(`worker sent an unknown command ${w}`)},o.onerror=w=>{throw C(`worker sent an error! ${w.filename}:${w.lineno}: ${w.message}`),w};var m,h=[];for(m of[])t.propertyIsEnumerable(m)&&h.push(m);o.postMessage({Sc:"load",xd:h,Od:gt,Pd:y})});function vn(){var o=new Worker((()=>{let d=URL;return import.meta.url>"file:"&&import.meta.url<"file;"?new d("ort.bundle.min.mjs",import.meta.url):new URL(import.meta.url)})(),{type:"module",workerData:"em-pthread",name:"em-pthread"});mt.push(o)}var gt,Rf=(o,d)=>{we=0,o=wi(o,d),0<we?_=o:_i(o)},wr=[],vr=0;function Bf(o){var d=new ii(o>>>=0);return(v(),D)[d.Tc+12>>>0]==0&&(xn(d,!0),vr--),Sn(d,!1),wr.push(d),vs(o)}var Gt=0,Nf=()=>{de(0,0);var o=wr.pop();$s(o.cd),Gt=0};function xn(o,d){d=d?1:0,(v(),D)[o.Tc+12>>>0]=d}function Sn(o,d){d=d?1:0,(v(),D)[o.Tc+13>>>0]=d}class ii{constructor(d){this.cd=d,this.Tc=d-24}}var ai=o=>{var d=Gt;if(!d)return rr(0),0;var m=new ii(d);(v(),Z)[m.Tc+16>>>2>>>0]=d;var h=(v(),Z)[m.Tc+4>>>2>>>0];if(!h)return rr(0),d;for(var w of o){if(w===0||w===h)break;if(ws(w,h,m.Tc+16))return rr(w),d}return rr(h),d};function Mf(){return ai([])}function Df(o){return ai([o>>>0])}function Pf(o,d,m,h){return ai([o>>>0,d>>>0,m>>>0,h>>>0])}var Uf=()=>{var o=wr.pop();o||q("no exception to throw");var d=o.cd;throw(v(),D)[o.Tc+13>>>0]==0&&(wr.push(o),Sn(o,!0),xn(o,!1),vr++),$i(d),Gt=d};function qf(o,d,m){var h=new ii(o>>>=0);throw d>>>=0,m>>>=0,(v(),Z)[h.Tc+16>>>2>>>0]=0,(v(),Z)[h.Tc+4>>>2>>>0]=d,(v(),Z)[h.Tc+8>>>2>>>0]=m,$i(o),vr++,Gt=o}var Lf=()=>vr;function kn(o,d,m,h){return a?ie(2,1,o,d,m,h):In(o,d,m,h)}function In(o,d,m,h){if(o>>>=0,d>>>=0,m>>>=0,h>>>=0,!globalThis.SharedArrayBuffer)return 6;var w=[];return a&&w.length===0?kn(o,d,m,h):(o={Ld:m,Rc:o,bd:h,rd:w},a?(o.Sc="spawnThread",postMessage(o,w),0):ft(o))}function Wf(o){throw Gt||(Gt=o>>>0),Gt}var Tn=globalThis.TextDecoder&&new TextDecoder,Cn=(o,d,m,h)=>{if(m=d+m,h)return m;for(;o[d]&&!(d>=m);)++d;return d},En=(o,d=0,m,h)=>{if(16<(m=Cn(o,d>>>=0,m,h))-d&&o.buffer&&Tn)return Tn.decode(o.buffer instanceof ArrayBuffer?o.subarray(d,m):o.slice(d,m));for(h="";d<m;){var w=o[d++];if(128&w){var I=63&o[d++];if((224&w)==192)h+=String.fromCharCode((31&w)<<6|I);else{var E=63&o[d++];65536>(w=(240&w)==224?(15&w)<<12|I<<6|E:(7&w)<<18|I<<12|E<<6|63&o[d++])?h+=String.fromCharCode(w):(w-=65536,h+=String.fromCharCode(55296|w>>10,56320|1023&w))}}else h+=String.fromCharCode(w)}return h},Ie=(o,d,m)=>(o>>>=0)?En((v(),F),o,d,m):"";function zn(o,d,m){return a?ie(3,1,o,d,m):0}function An(o,d){if(a)return ie(4,1,o,d)}function On(o,d){if(a)return ie(5,1,o,d)}function Rn(o,d,m){if(a)return ie(6,1,o,d,m)}function Bn(o,d,m){return a?ie(7,1,o,d,m):0}function Nn(o,d){if(a)return ie(8,1,o,d)}function Mn(o,d,m){if(a)return ie(9,1,o,d,m)}function Dn(o,d,m,h){if(a)return ie(10,1,o,d,m,h)}function Pn(o,d,m,h){if(a)return ie(11,1,o,d,m,h)}function Un(o,d,m,h){if(a)return ie(12,1,o,d,m,h)}function qn(o){if(a)return ie(13,1,o)}function Ln(o,d){if(a)return ie(14,1,o,d)}function Wn(o,d,m){if(a)return ie(15,1,o,d,m)}var Vf=()=>q(""),rt=o=>{o>>>=0;for(var d="";;){var m=(v(),F)[o++>>>0];if(!m)return d;d+=String.fromCharCode(m)}},ni={},si={},Ht=class extends Error{constructor(o){super(o),this.name="BindingError"}};function ut(o,d,m={}){return(function(h,w,I={}){var E=w.name;if(!h)throw new Ht(`type "${E}" must have a positive integer typeid pointer`);if(si.hasOwnProperty(h)){if(I.yd)return;throw new Ht(`Cannot register type '${E}' twice`)}si[h]=w,ni.hasOwnProperty(h)&&(w=ni[h],delete ni[h],w.forEach(B=>B()))})(o,d,m)}var Vn=(o,d,m)=>{switch(d){case 1:return m?h=>(v(),D)[h>>>0]:h=>(v(),F)[h>>>0];case 2:return m?h=>(v(),j)[h>>>1>>>0]:h=>(v(),K)[h>>>1>>>0];case 4:return m?h=>(v(),R)[h>>>2>>>0]:h=>(v(),Z)[h>>>2>>>0];case 8:return m?h=>(v(),fe)[h>>>3>>>0]:h=>(v(),V)[h>>>3>>>0];default:throw new TypeError(`invalid integer width (${d}): ${o}`)}};function Gf(o,d,m,h,w){o>>>=0,m>>>=0,d=rt(d>>>0);let I=E=>E;if(h=h===0n){let E=8*m;I=B=>BigInt.asUintN(E,B),w=I(w)}ut(o,{name:d,Oc:I,Vc:(E,B)=>(typeof B=="number"&&(B=BigInt(B)),B),Uc:Vn(d,m,!h),Wc:null})}function Hf(o,d,m,h){ut(o>>>=0,{name:d=rt(d>>>0),Oc:function(w){return!!w},Vc:function(w,I){return I?m:h},Uc:function(w){return this.Oc((v(),F)[w>>>0])},Wc:null})}var Gn=[],It=[0,1,,1,null,1,!0,1,!1,1];function oi(o){9<(o>>>=0)&&--It[o+1]===0&&(It[o]=void 0,Gn.push(o))}var He=o=>{if(!o)throw new Ht(`Cannot use deleted val. handle = ${o}`);return It[o]},je=o=>{switch(o){case void 0:return 2;case null:return 4;case!0:return 6;case!1:return 8;default:let d=Gn.pop()||It.length;return It[d]=o,It[d+1]=1,d}};function ui(o){return this.Oc((v(),Z)[o>>>2>>>0])}var Ff={name:"emscripten::val",Oc:o=>{var d=He(o);return oi(o),d},Vc:(o,d)=>je(d),Uc:ui,Wc:null};function jf(o){return ut(o>>>0,Ff)}var Kf=(o,d)=>{switch(d){case 4:return function(m){return this.Oc((v(),X)[m>>>2>>>0])};case 8:return function(m){return this.Oc((v(),te)[m>>>3>>>0])};default:throw new TypeError(`invalid float width (${d}): ${o}`)}};function Zf(o,d,m){m>>>=0,ut(o>>>=0,{name:d=rt(d>>>0),Oc:h=>h,Vc:(h,w)=>w,Uc:Kf(d,m),Wc:null})}function Xf(o,d,m,h,w){o>>>=0,m>>>=0,d=rt(d>>>0);let I=B=>B;if(h===0){var E=32-8*m;I=B=>B<<E>>>E,w=I(w)}ut(o,{name:d,Oc:I,Vc:(B,W)=>W,Uc:Vn(d,m,h!==0),Wc:null})}function Qf(o,d,m){function h(I){var E=(v(),Z)[I>>>2>>>0];return I=(v(),Z)[I+4>>>2>>>0],new w((v(),D).buffer,I,E)}var w=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array][d];ut(o>>>=0,{name:m=rt(m>>>0),Oc:h,Uc:h},{yd:!0})}var yt=(o,d,m)=>{var h=(v(),F);if(d>>>=0,0<m){var w=d;m=d+m-1;for(var I=0;I<o.length;++I){var E=o.codePointAt(I);if(127>=E){if(d>=m)break;h[d++>>>0]=E}else if(2047>=E){if(d+1>=m)break;h[d++>>>0]=192|E>>6,h[d++>>>0]=128|63&E}else if(65535>=E){if(d+2>=m)break;h[d++>>>0]=224|E>>12,h[d++>>>0]=128|E>>6&63,h[d++>>>0]=128|63&E}else{if(d+3>=m)break;h[d++>>>0]=240|E>>18,h[d++>>>0]=128|E>>12&63,h[d++>>>0]=128|E>>6&63,h[d++>>>0]=128|63&E,I++}}h[d>>>0]=0,o=d-w}else o=0;return o},xr=o=>{for(var d=0,m=0;m<o.length;++m){var h=o.charCodeAt(m);127>=h?d++:2047>=h?d+=2:55296<=h&&57343>=h?(d+=4,++m):d+=3}return d};function Yf(o,d){ut(o>>>=0,{name:d=rt(d>>>0),Oc(m){var h=(v(),Z)[m>>>2>>>0];return h=Ie(m+4,h,!0),at(m),h},Vc(m,h){h instanceof ArrayBuffer&&(h=new Uint8Array(h));var w=typeof h=="string";if(!(w||ArrayBuffer.isView(h)&&h.BYTES_PER_ELEMENT==1))throw new Ht("Cannot pass non-string to std::string");var I=w?xr(h):h.length,E=tr(4+I+1),B=E+4;return(v(),Z)[E>>>2>>>0]=I,w?yt(h,B,I+1):(v(),F).set(h,B>>>0),m!==null&&m.push(at,E),E},Uc:ui,Wc(m){at(m)}})}var Hn=globalThis.TextDecoder?new TextDecoder("utf-16le"):void 0,Jf=(o,d,m)=>{if(o>>>=1,16<(d=Cn((v(),K),o,d/2,m))-o&&Hn)return Hn.decode((v(),K).slice(o,d));for(m="";o<d;++o){var h=(v(),K)[o>>>0];m+=String.fromCharCode(h)}return m},em=(o,d,m)=>{if(m??(m=2147483647),2>m)return 0;var h=d;m=(m-=2)<2*o.length?m/2:o.length;for(var w=0;w<m;++w){var I=o.charCodeAt(w);(v(),j)[d>>>1>>>0]=I,d+=2}return(v(),j)[d>>>1>>>0]=0,d-h},tm=o=>2*o.length,rm=(o,d,m)=>{var h="";o>>>=2;for(var w=0;!(w>=d/4);w++){var I=(v(),Z)[o+w>>>0];if(!I&&!m)break;h+=String.fromCodePoint(I)}return h},im=(o,d,m)=>{if(d>>>=0,m??(m=2147483647),4>m)return 0;var h=d;m=h+m-4;for(var w=0;w<o.length;++w){var I=o.codePointAt(w);if(65535<I&&w++,(v(),R)[d>>>2>>>0]=I,(d+=4)+4>m)break}return(v(),R)[d>>>2>>>0]=0,d-h},am=o=>{for(var d=0,m=0;m<o.length;++m)65535<o.codePointAt(m)&&m++,d+=4;return d};function nm(o,d,m){if(o>>>=0,d>>>=0,m=rt(m>>>=0),d===2)var h=Jf,w=em,I=tm;else h=rm,w=im,I=am;ut(o,{name:m,Oc:E=>{var B=(v(),Z)[E>>>2>>>0];return B=h(E+4,B*d,!0),at(E),B},Vc:(E,B)=>{if(typeof B!="string")throw new Ht(`Cannot pass non-string to C++ string type ${m}`);var W=I(B),H=tr(4+W+d);return(v(),Z)[H>>>2>>>0]=W/d,w(B,H+4,W+d),E!==null&&E.push(at,H),H},Uc:ui,Wc(E){at(E)}})}function sm(o,d){ut(o>>>=0,{zd:!0,name:d=rt(d>>>0),Oc:()=>{},Vc:()=>{}})}function om(o){yi(o>>>0,!i,1,!r,131072,!1),$n()}var Sr=o=>{if(!z)try{if(o(),!(0<we))try{a?Ar()&&_i(_):Yt(_)}catch(d){d instanceof ke||d=="unwind"||p(0,d)}}catch(d){d instanceof ke||d=="unwind"||p(0,d)}},um=!Atomics.waitAsync||((po=globalThis.navigator)==null?void 0:po.userAgent)&&91>Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)||[])[2]);function li(o){o>>>=0,um||(Atomics.waitAsync((v(),R),o>>>2,o).value.then(kr),o+=128,Atomics.store((v(),R),o>>>2,1))}var kr=()=>Sr(()=>{var o=Ar();o&&(li(o),_s())});function lm(o,d){(o>>>=0)==d>>>0?setTimeout(kr):a?postMessage({Zc:o,Sc:"checkMailbox"}):(o=kt[o])&&o.postMessage({Sc:"checkMailbox"})}var di=[];function dm(o,d,m,h,w){for(d>>>=0,w>>>=0,di.length=0,m=w>>>3,h=w+h>>>3;m<h;){var I;I=(v(),fe)[m++>>>0]?(v(),fe)[m++>>>0]:(v(),te)[m++>>>0],di.push(I)}return(d?vi[d]:eg[o])(...di)}var pm=()=>{we=0};function cm(o){o>>>=0,a?postMessage({Sc:"cleanupThread",Nd:o}):bn(kt[o])}function hm(o){}var Ir=o=>{try{o()}catch(d){q(d)}};function fm(o){var d=(...m)=>{Tr.push(o);try{return o(...m)}finally{z||(Tr.pop(),it&&_t===1&&Tr.length===0&&(_t=0,we+=1,Ir(so),typeof Fibers<"u"&&Fibers.Zd()))}};return Kn.set(o,d),d}var _t=0,it=null,Fn=0,Tr=[],pi=new Map,jn=new Map,Kn=new Map,mm=0,ci=null,gm=[],Zn=o=>(function(d){if(!z){if(_t===0){var m=!1,h=!1;d((w=0)=>{if(!z&&(Fn=w,m=!0,h)){_t=2,Ir(()=>oo(it)),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.resume(),w=!1;try{var I=(function(){var W=(v(),R)[it+8>>>2>>>0];return W=jn.get(W),W=Kn.get(W),--we,W()})()}catch(W){I=W,w=!0}var E=!1;if(!it){var B=ci;B&&(ci=null,(w?B.reject:B.resolve)(I),E=!0)}if(w&&!E)throw I}}),h=!0,m||(_t=1,it=(function(){var w=tr(65548),I=w+12;if((v(),Z)[w>>>2>>>0]=I,(v(),Z)[w+4>>>2>>>0]=I+65536,I=Tr[0],!pi.has(I)){var E=mm++;pi.set(I,E),jn.set(E,I)}return I=pi.get(I),(v(),R)[w+8>>>2>>>0]=I,w})(),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.pause(),Ir(()=>no(it)))}else _t===2?(_t=0,Ir(uo),at(it),it=null,gm.forEach(Sr)):q(`invalid state: ${_t}`);return Fn}})(d=>{o().then(d)});function ym(o){return o>>>=0,Zn(async()=>{var d=await He(o);return je(d)})}var hi=[],_m=o=>{var d=hi.length;return hi.push(o),d},bm=(o,d)=>{for(var m=Array(o),h=0;h<o;++h){var w=h,I=(v(),Z)[d+4*h>>>2>>>0],E=si[I];if(E===void 0)throw o=`parameter ${h}`,I=cs(I),d=rt(I),at(I),new Ht(`${o} has unknown type ${d}`);m[w]=E}return m},$m=(o,d,m)=>{var h=[];return o=o(h,m),h.length&&((v(),Z)[d>>>2>>>0]=je(h)),o},wm={},Cr=o=>{var d=wm[o];return d===void 0?rt(o):d};function vm(o,d,m){var[h,...w]=bm(o,d>>>0);d=h.Vc.bind(h);var I=w.map(W=>W.Uc.bind(W));o--;var E={toValue:He};switch(o=I.map((W,H)=>{var se=`argFromPtr${H}`;return E[se]=W,`${se}(args${H?"+"+8*H:""})`}),m){case 0:var B="toValue(handle)";break;case 2:B="new (toValue(handle))";break;case 3:B="";break;case 1:E.getStringOrSymbol=Cr,B="toValue(handle)[getStringOrSymbol(methodName)]"}return B+=`(${o})`,h.zd||(E.toReturnWire=d,E.emval_returnValue=$m,B=`return emval_returnValue(toReturnWire, destructorsRef, ${B})`),B=`return function (handle, methodName, destructorsRef, args) {
  ${B}
  }`,m=new Function(Object.keys(E),B)(...Object.values(E)),B=`methodCaller<(${w.map(W=>W.name)}) => ${h.name}>`,_m(Object.defineProperty(m,"name",{value:B}))}function xm(o,d){return d>>>=0,(o=He(o>>>0))==He(d)}function Sm(o){return(o>>>=0)?(o=Cr(o),je(globalThis[o])):je(globalThis)}function km(o){return o=Cr(o>>>0),je(t[o])}function Im(o,d){return d>>>=0,o=He(o>>>0),d=He(d),je(o[d])}function Tm(o){9<(o>>>=0)&&(It[o+1]+=1)}function Xn(o,d,m,h,w){return hi[o>>>0](d>>>0,m>>>0,h>>>0,w>>>0)}function Cm(o,d,m,h,w){return Xn(o>>>0,d>>>0,m>>>0,h>>>0,w>>>0)}function Em(){return je([])}function zm(o){o=He(o>>>0);for(var d=Array(o.length),m=0;m<o.length;m++)d[m]=o[m];return je(d)}function Am(o){return je(Cr(o>>>0))}function Om(){return je({})}function Rm(o){for(var d=He(o>>>=0);d.length;){var m=d.pop();d.pop()(m)}oi(o)}function Bm(o,d,m){d>>>=0,m>>>=0,o=He(o>>>0),d=He(d),m=He(m),o[d]=m}function Nm(o,d){o=-9007199254740992>o||9007199254740992<o?NaN:Number(o),d>>>=0,o=new Date(1e3*o),(v(),R)[d>>>2>>>0]=o.getUTCSeconds(),(v(),R)[d+4>>>2>>>0]=o.getUTCMinutes(),(v(),R)[d+8>>>2>>>0]=o.getUTCHours(),(v(),R)[d+12>>>2>>>0]=o.getUTCDate(),(v(),R)[d+16>>>2>>>0]=o.getUTCMonth(),(v(),R)[d+20>>>2>>>0]=o.getUTCFullYear()-1900,(v(),R)[d+24>>>2>>>0]=o.getUTCDay(),o=(o.getTime()-Date.UTC(o.getUTCFullYear(),0,1,0,0,0,0))/864e5|0,(v(),R)[d+28>>>2>>>0]=o}var Qn=o=>o%4==0&&(o%100!=0||o%400==0),Yn=[0,31,60,91,121,152,182,213,244,274,305,335],Jn=[0,31,59,90,120,151,181,212,243,273,304,334];function Mm(o,d){o=-9007199254740992>o||9007199254740992<o?NaN:Number(o),d>>>=0,o=new Date(1e3*o),(v(),R)[d>>>2>>>0]=o.getSeconds(),(v(),R)[d+4>>>2>>>0]=o.getMinutes(),(v(),R)[d+8>>>2>>>0]=o.getHours(),(v(),R)[d+12>>>2>>>0]=o.getDate(),(v(),R)[d+16>>>2>>>0]=o.getMonth(),(v(),R)[d+20>>>2>>>0]=o.getFullYear()-1900,(v(),R)[d+24>>>2>>>0]=o.getDay();var m=(Qn(o.getFullYear())?Yn:Jn)[o.getMonth()]+o.getDate()-1|0;(v(),R)[d+28>>>2>>>0]=m,(v(),R)[d+36>>>2>>>0]=-60*o.getTimezoneOffset(),m=new Date(o.getFullYear(),6,1).getTimezoneOffset();var h=new Date(o.getFullYear(),0,1).getTimezoneOffset();o=0|(m!=h&&o.getTimezoneOffset()==Math.min(h,m)),(v(),R)[d+32>>>2>>>0]=o}function Dm(o){o>>>=0;var d=new Date((v(),R)[o+20>>>2>>>0]+1900,(v(),R)[o+16>>>2>>>0],(v(),R)[o+12>>>2>>>0],(v(),R)[o+8>>>2>>>0],(v(),R)[o+4>>>2>>>0],(v(),R)[o>>>2>>>0],0),m=(v(),R)[o+32>>>2>>>0],h=d.getTimezoneOffset(),w=new Date(d.getFullYear(),6,1).getTimezoneOffset(),I=new Date(d.getFullYear(),0,1).getTimezoneOffset(),E=Math.min(I,w);return 0>m?(v(),R)[o+32>>>2>>>0]=+(w!=I&&E==h):0<m!=(E==h)&&(w=Math.max(I,w),d.setTime(d.getTime()+6e4*((0<m?E:w)-h))),(v(),R)[o+24>>>2>>>0]=d.getDay(),m=(Qn(d.getFullYear())?Yn:Jn)[d.getMonth()]+d.getDate()-1|0,(v(),R)[o+28>>>2>>>0]=m,(v(),R)[o>>>2>>>0]=d.getSeconds(),(v(),R)[o+4>>>2>>>0]=d.getMinutes(),(v(),R)[o+8>>>2>>>0]=d.getHours(),(v(),R)[o+12>>>2>>>0]=d.getDate(),(v(),R)[o+16>>>2>>>0]=d.getMonth(),(v(),R)[o+20>>>2>>>0]=d.getYear(),o=d.getTime(),BigInt(isNaN(o)?-1:o/1e3)}function es(o,d,m,h,w,I,E){return a?ie(16,1,o,d,m,h,w,I,E):-52}function ts(o,d,m,h,w,I){if(a)return ie(17,1,o,d,m,h,w,I)}var er={},Pm=()=>performance.timeOrigin+performance.now();function rs(o,d){if(a)return ie(18,1,o,d);if(er[o]&&(clearTimeout(er[o].id),delete er[o]),!d)return 0;var m=setTimeout(()=>{delete er[o],Sr(()=>ys(o,performance.timeOrigin+performance.now()))},d);return er[o]={id:m,Yd:d},0}function Um(o,d,m,h){o>>>=0,d>>>=0,m>>>=0,h>>>=0;var w=new Date().getFullYear(),I=new Date(w,0,1).getTimezoneOffset();w=new Date(w,6,1).getTimezoneOffset();var E=Math.max(I,w);(v(),Z)[o>>>2>>>0]=60*E,(v(),R)[d>>>2>>>0]=+(I!=w),o=(d=B=>{var W=Math.abs(B);return`UTC${0<=B?"-":"+"}${String(Math.floor(W/60)).padStart(2,"0")}${String(W%60).padStart(2,"0")}`})(I),d=d(w),w<I?(yt(o,m,17),yt(d,h,17)):(yt(o,h,17),yt(d,m,17))}var qm=()=>Date.now();function Lm(o,d,m){return m>>>=0,0<=o&&3>=o?(o===0?o=Date.now():o=performance.timeOrigin+performance.now(),o=Math.round(1e6*o),(v(),fe)[m>>>3>>>0]=BigInt(o),0):28}var fi=[],is=(o,d)=>{fi.length=0;for(var m;m=(v(),F)[o++>>>0];){var h=m!=105;d+=(h&=m!=112)&&d%8?4:0,fi.push(m==112?(v(),Z)[d>>>2>>>0]:m==106?(v(),fe)[d>>>3>>>0]:m==105?(v(),R)[d>>>2>>>0]:(v(),te)[d>>>3>>>0]),d+=h?8:4}return fi};function Wm(o,d,m){return o>>>=0,d=is(d>>>0,m>>>0),vi[o](...d)}function Vm(o,d,m){return o>>>=0,d=is(d>>>0,m>>>0),vi[o](...d)}var Gm=()=>{};function Hm(o,d){return C(Ie(o>>>0,d>>>0))}var Fm=()=>{throw we+=1,"unwind"};function jm(){return 4294901760}var Km=()=>navigator.hardwareConcurrency,Tt={},Er=o=>{var d;return(d=/\bwasm-function\[\d+\]:(0x[0-9a-f]+)/.exec(o))?+d[1]:(d=/:(\d+):\d+(?:\)|$)/.exec(o))?2147483648|+d[1]:0},as=o=>{for(var d of o)(o=Er(d))&&(Tt[o]=d)};function Zm(){var o=Error().stack.toString().split(`
`);return o[0]=="Error"&&o.shift(),as(o),Tt.gd=Er(o[3]),Tt.Jd=o,Tt.gd}function zr(o){if(!(o=Tt[o>>>0]))return 0;var d;if(d=/^\s+at .*\.wasm\.(.*) \(.*\)$/.exec(o))o=d[1];else if(d=/^\s+at (.*) \(.*\)$/.exec(o))o=d[1];else{if(!(d=/^(.+?)@/.exec(o)))return 0;o=d[1]}at(zr.hd??0),d=xr(o)+1;var m=tr(d);return m&&yt(o,m,d),zr.hd=m,zr.hd}function Xm(o){o>>>=0;var d=(v(),F).length;if(o<=d||4294901760<o)return!1;for(var m=1;4>=m;m*=2){var h=d*(1+.2/m);h=Math.min(h,o+100663296);e:{h=(Math.min(4294901760,65536*Math.ceil(Math.max(o,h)/65536))-gt.buffer.byteLength+65535)/65536|0;try{gt.grow(h),G();var w=1;break e}catch{}w=void 0}if(w)return!0}return!1}function Qm(o,d,m){if(o>>>=0,d>>>=0,Tt.gd==o)var h=Tt.Jd;else(h=Error().stack.toString().split(`
`))[0]=="Error"&&h.shift(),as(h);for(var w=3;h[w]&&Er(h[w])!=o;)++w;for(o=0;o<m&&h[o+w];++o)(v(),R)[d+4*o>>>2>>>0]=Er(h[o+w]);return o}var mi,gi={},ns=()=>{var h;if(!mi){var o,d={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(((h=globalThis.navigator)==null?void 0:h.language)??"C").replace("-","_")+".UTF-8",_:"./this.program"};for(o in gi)gi[o]===void 0?delete d[o]:d[o]=gi[o];var m=[];for(o in d)m.push(`${o}=${d[o]}`);mi=m}return mi};function ss(o,d){if(a)return ie(19,1,o,d);o>>>=0,d>>>=0;var m,h=0,w=0;for(m of ns()){var I=d+h;(v(),Z)[o+w>>>2>>>0]=I,h+=yt(m,I,1/0)+1,w+=4}return 0}function os(o,d){if(a)return ie(20,1,o,d);o>>>=0,d>>>=0;var m=ns();for(var h of((v(),Z)[o>>>2>>>0]=m.length,o=0,m))o+=xr(h)+1;return(v(),Z)[d>>>2>>>0]=o,0}function us(o){return a?ie(21,1,o):52}function ls(o,d,m,h){return a?ie(22,1,o,d,m,h):52}function ds(o,d,m,h){return a?ie(23,1,o,d,m,h):70}var Ym=[null,[],[]];function ps(o,d,m,h){if(a)return ie(24,1,o,d,m,h);d>>>=0,m>>>=0,h>>>=0;for(var w=0,I=0;I<m;I++){var E=(v(),Z)[d>>>2>>>0],B=(v(),Z)[d+4>>>2>>>0];d+=8;for(var W=0;W<B;W++){var H=o,se=(v(),F)[E+W>>>0],ce=Ym[H];se===0||se===10?((H===1?k:C)(En(ce)),ce.length=0):ce.push(se)}w+=B}return(v(),Z)[h>>>2>>>0]=w,0}function Jm(o){return o>>>0}a||(function(){for(var o=t.numThreads-1;o--;)vn();Me.push(async()=>{var d=(async function(){if(!a)return Promise.all(mt.map(wn))})();Ue++,await d,--Ue==0&&De&&(d=De,De=null,d())})})(),a||(gt=new WebAssembly.Memory({initial:256,maximum:65536,shared:!0}),G()),t.wasmBinary&&(g=t.wasmBinary),t.stackSave=()=>ue(),t.stackRestore=o=>oe(o),t.stackAlloc=o=>bi(o),t.setValue=function(o,d,m="i8"){switch(m.endsWith("*")&&(m="*"),m){case"i1":case"i8":(v(),D)[o>>>0]=d;break;case"i16":(v(),j)[o>>>1>>>0]=d;break;case"i32":(v(),R)[o>>>2>>>0]=d;break;case"i64":(v(),fe)[o>>>3>>>0]=BigInt(d);break;case"float":(v(),X)[o>>>2>>>0]=d;break;case"double":(v(),te)[o>>>3>>>0]=d;break;case"*":(v(),Z)[o>>>2>>>0]=d;break;default:q(`invalid type for setValue: ${m}`)}},t.getValue=function(o,d="i8"){switch(d.endsWith("*")&&(d="*"),d){case"i1":case"i8":return(v(),D)[o>>>0];case"i16":return(v(),j)[o>>>1>>>0];case"i32":return(v(),R)[o>>>2>>>0];case"i64":return(v(),fe)[o>>>3>>>0];case"float":return(v(),X)[o>>>2>>>0];case"double":return(v(),te)[o>>>3>>>0];case"*":return(v(),Z)[o>>>2>>>0];default:q(`invalid type for getValue: ${d}`)}},t.UTF8ToString=Ie,t.stringToUTF8=yt,t.lengthBytesUTF8=xr;var cs,hs,Ar,at,tr,yi,fs,ms,gs,_i,ys,_s,de,rr,bs,oe,bi,ue,$s,$i,ws,vs,xs,wi,Ss,ks,Is,Ts,Cs,Es,zs,As,Os,Rs,Bs,Ns,Ms,Ds,Ps,Us,qs,Ls,Ws,Vs,Gs,Hs,Fs,js,Ks,Zs,Xs,Qs,Ys,Js,eo,to,ro,io,ao,no,so,oo,uo,lt,eg=[qe,$r,kn,zn,An,On,Rn,Bn,Nn,Mn,Dn,Pn,Un,qn,Ln,Wn,es,ts,rs,ss,os,us,ls,ds,ps],vi={1003524:(o,d,m,h,w)=>{if(t===void 0||!t.Xc)return 1;if((o=Ie(Number(o>>>0))).startsWith("./")&&(o=o.substring(2)),!(o=t.Xc.get(o)))return 2;if(d=Number(d>>>0),m=Number(m>>>0),h=Number(h>>>0),d+m>o.byteLength)return 3;try{let I=o.subarray(d,d+m);switch(w){case 0:(v(),F).set(I,h>>>0);break;case 1:t.Qd?t.Qd(h,I):t.Id(h,I);break;default:return 4}return 0}catch{return 4}},1004348:(o,d,m)=>{t.td(o,(v(),F).subarray(d>>>0,d+m>>>0))},1004412:()=>t.Sd(),1004454:o=>{t.sd(o)},1004491:()=>{t.Bd()},1004522:()=>{t.Cd()},1004551:()=>{t.Gd()},1004576:o=>t.Ad(o),1004609:o=>t.Ed(o),1004641:(o,d,m)=>{t.ed(Number(o),Number(d),Number(m),!0)},1004704:(o,d,m)=>{t.ed(Number(o),Number(d),Number(m))},1004761:()=>typeof wasmOffsetConverter<"u",1004818:o=>{t.$b("Abs",o,void 0)},1004869:o=>{t.$b("Neg",o,void 0)},1004920:o=>{t.$b("Floor",o,void 0)},1004973:o=>{t.$b("Ceil",o,void 0)},1005025:o=>{t.$b("Reciprocal",o,void 0)},1005083:o=>{t.$b("Sqrt",o,void 0)},1005135:o=>{t.$b("Exp",o,void 0)},1005186:o=>{t.$b("Erf",o,void 0)},1005237:o=>{t.$b("Sigmoid",o,void 0)},1005292:(o,d,m)=>{t.$b("HardSigmoid",o,{alpha:d,beta:m})},1005371:o=>{t.$b("Log",o,void 0)},1005422:o=>{t.$b("Sin",o,void 0)},1005473:o=>{t.$b("Cos",o,void 0)},1005524:o=>{t.$b("Tan",o,void 0)},1005575:o=>{t.$b("Asin",o,void 0)},1005627:o=>{t.$b("Acos",o,void 0)},1005679:o=>{t.$b("Atan",o,void 0)},1005731:o=>{t.$b("Sinh",o,void 0)},1005783:o=>{t.$b("Cosh",o,void 0)},1005835:o=>{t.$b("Asinh",o,void 0)},1005888:o=>{t.$b("Acosh",o,void 0)},1005941:o=>{t.$b("Atanh",o,void 0)},1005994:o=>{t.$b("Tanh",o,void 0)},1006046:o=>{t.$b("Not",o,void 0)},1006097:(o,d,m)=>{t.$b("Clip",o,{min:d,max:m})},1006166:o=>{t.$b("Clip",o,void 0)},1006218:(o,d)=>{t.$b("Elu",o,{alpha:d})},1006276:o=>{t.$b("Gelu",o,void 0)},1006328:o=>{t.$b("Relu",o,void 0)},1006380:(o,d)=>{t.$b("LeakyRelu",o,{alpha:d})},1006444:(o,d)=>{t.$b("ThresholdedRelu",o,{alpha:d})},1006514:(o,d)=>{t.$b("Cast",o,{to:d})},1006572:o=>{t.$b("Add",o,void 0)},1006623:o=>{t.$b("Sub",o,void 0)},1006674:o=>{t.$b("Mul",o,void 0)},1006725:o=>{t.$b("Div",o,void 0)},1006776:o=>{t.$b("Pow",o,void 0)},1006827:o=>{t.$b("Equal",o,void 0)},1006880:o=>{t.$b("Greater",o,void 0)},1006935:o=>{t.$b("GreaterOrEqual",o,void 0)},1006997:o=>{t.$b("Less",o,void 0)},1007049:o=>{t.$b("LessOrEqual",o,void 0)},1007108:(o,d,m,h,w)=>{t.$b("ReduceMean",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((v(),R).subarray(Number(h)>>>0,Number(w)>>>0)):[]})},1007283:(o,d,m,h,w)=>{t.$b("ReduceMax",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((v(),R).subarray(Number(h)>>>0,Number(w)>>>0)):[]})},1007457:(o,d,m,h,w)=>{t.$b("ReduceMin",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((v(),R).subarray(Number(h)>>>0,Number(w)>>>0)):[]})},1007631:(o,d,m,h,w)=>{t.$b("ReduceProd",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((v(),R).subarray(Number(h)>>>0,Number(w)>>>0)):[]})},1007806:(o,d,m,h,w)=>{t.$b("ReduceSum",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((v(),R).subarray(Number(h)>>>0,Number(w)>>>0)):[]})},1007980:(o,d,m,h,w)=>{t.$b("ReduceL1",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((v(),R).subarray(Number(h)>>>0,Number(w)>>>0)):[]})},1008153:(o,d,m,h,w)=>{t.$b("ReduceL2",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((v(),R).subarray(Number(h)>>>0,Number(w)>>>0)):[]})},1008326:(o,d,m,h,w)=>{t.$b("ReduceLogSum",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((v(),R).subarray(Number(h)>>>0,Number(w)>>>0)):[]})},1008503:(o,d,m,h,w)=>{t.$b("ReduceSumSquare",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((v(),R).subarray(Number(h)>>>0,Number(w)>>>0)):[]})},1008683:(o,d,m,h,w)=>{t.$b("ReduceLogSumExp",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((v(),R).subarray(Number(h)>>>0,Number(w)>>>0)):[]})},1008863:o=>{t.$b("Where",o,void 0)},1008916:(o,d,m)=>{t.$b("Transpose",o,{perm:d?Array.from((v(),R).subarray(Number(d)>>>0,Number(m)>>>0)):[]})},1009040:(o,d,m,h)=>{t.$b("DepthToSpace",o,{blocksize:d,mode:Ie(m),format:h?"NHWC":"NCHW"})},1009173:(o,d,m,h)=>{t.$b("DepthToSpace",o,{blocksize:d,mode:Ie(m),format:h?"NHWC":"NCHW"})},1009306:(o,d,m,h,w,I,E,B,W,H,se,ce,_e,ve,bt)=>{t.$b("ConvTranspose",o,{format:W?"NHWC":"NCHW",autoPad:d,dilations:[m],group:h,kernelShape:[w],pads:[I,E],strides:[B],wIsConst:()=>!!(v(),D)[H>>>0],outputPadding:se?Array.from((v(),R).subarray(Number(se)>>>0,Number(ce)>>>0)):[],outputShape:_e?Array.from((v(),R).subarray(Number(_e)>>>0,Number(ve)>>>0)):[],activation:Ie(bt)})},1009739:(o,d,m,h,w,I,E,B,W,H,se,ce,_e,ve)=>{t.$b("ConvTranspose",o,{format:B?"NHWC":"NCHW",autoPad:d,dilations:Array.from((v(),R).subarray(Number(m)>>>0,(Number(m)>>>0)+2>>>0)),group:h,kernelShape:Array.from((v(),R).subarray(Number(w)>>>0,(Number(w)>>>0)+2>>>0)),pads:Array.from((v(),R).subarray(Number(I)>>>0,(Number(I)>>>0)+4>>>0)),strides:Array.from((v(),R).subarray(Number(E)>>>0,(Number(E)>>>0)+2>>>0)),wIsConst:()=>!!(v(),D)[W>>>0],outputPadding:H?Array.from((v(),R).subarray(Number(H)>>>0,Number(se)>>>0)):[],outputShape:ce?Array.from((v(),R).subarray(Number(ce)>>>0,Number(_e)>>>0)):[],activation:Ie(ve)})},1010400:(o,d,m,h,w,I,E,B,W,H,se,ce,_e,ve,bt)=>{t.$b("ConvTranspose",o,{format:W?"NHWC":"NCHW",autoPad:d,dilations:[m],group:h,kernelShape:[w],pads:[I,E],strides:[B],wIsConst:()=>!!(v(),D)[H>>>0],outputPadding:se?Array.from((v(),R).subarray(Number(se)>>>0,Number(ce)>>>0)):[],outputShape:_e?Array.from((v(),R).subarray(Number(_e)>>>0,Number(ve)>>>0)):[],activation:Ie(bt)})},1010833:(o,d,m,h,w,I,E,B,W,H,se,ce,_e,ve)=>{t.$b("ConvTranspose",o,{format:B?"NHWC":"NCHW",autoPad:d,dilations:Array.from((v(),R).subarray(Number(m)>>>0,(Number(m)>>>0)+2>>>0)),group:h,kernelShape:Array.from((v(),R).subarray(Number(w)>>>0,(Number(w)>>>0)+2>>>0)),pads:Array.from((v(),R).subarray(Number(I)>>>0,(Number(I)>>>0)+4>>>0)),strides:Array.from((v(),R).subarray(Number(E)>>>0,(Number(E)>>>0)+2>>>0)),wIsConst:()=>!!(v(),D)[W>>>0],outputPadding:H?Array.from((v(),R).subarray(Number(H)>>>0,Number(se)>>>0)):[],outputShape:ce?Array.from((v(),R).subarray(Number(ce)>>>0,Number(_e)>>>0)):[],activation:Ie(ve)})},1011494:(o,d)=>{t.$b("GlobalAveragePool",o,{format:d?"NHWC":"NCHW"})},1011585:(o,d,m,h,w,I,E,B,W,H,se,ce,_e,ve)=>{t.$b("AveragePool",o,{format:ve?"NHWC":"NCHW",auto_pad:d,ceil_mode:m,count_include_pad:h,storage_order:w,dilations:I?Array.from((v(),R).subarray(Number(I)>>>0,Number(E)>>>0)):[],kernel_shape:B?Array.from((v(),R).subarray(Number(B)>>>0,Number(W)>>>0)):[],pads:H?Array.from((v(),R).subarray(Number(H)>>>0,Number(se)>>>0)):[],strides:ce?Array.from((v(),R).subarray(Number(ce)>>>0,Number(_e)>>>0)):[]})},1012064:(o,d)=>{t.$b("GlobalAveragePool",o,{format:d?"NHWC":"NCHW"})},1012155:(o,d,m,h,w,I,E,B,W,H,se,ce,_e,ve)=>{t.$b("AveragePool",o,{format:ve?"NHWC":"NCHW",auto_pad:d,ceil_mode:m,count_include_pad:h,storage_order:w,dilations:I?Array.from((v(),R).subarray(Number(I)>>>0,Number(E)>>>0)):[],kernel_shape:B?Array.from((v(),R).subarray(Number(B)>>>0,Number(W)>>>0)):[],pads:H?Array.from((v(),R).subarray(Number(H)>>>0,Number(se)>>>0)):[],strides:ce?Array.from((v(),R).subarray(Number(ce)>>>0,Number(_e)>>>0)):[]})},1012634:(o,d)=>{t.$b("GlobalMaxPool",o,{format:d?"NHWC":"NCHW"})},1012721:(o,d,m,h,w,I,E,B,W,H,se,ce,_e,ve)=>{t.$b("MaxPool",o,{format:ve?"NHWC":"NCHW",auto_pad:d,ceil_mode:m,count_include_pad:h,storage_order:w,dilations:I?Array.from((v(),R).subarray(Number(I)>>>0,Number(E)>>>0)):[],kernel_shape:B?Array.from((v(),R).subarray(Number(B)>>>0,Number(W)>>>0)):[],pads:H?Array.from((v(),R).subarray(Number(H)>>>0,Number(se)>>>0)):[],strides:ce?Array.from((v(),R).subarray(Number(ce)>>>0,Number(_e)>>>0)):[]})},1013196:(o,d)=>{t.$b("GlobalMaxPool",o,{format:d?"NHWC":"NCHW"})},1013283:(o,d,m,h,w,I,E,B,W,H,se,ce,_e,ve)=>{t.$b("MaxPool",o,{format:ve?"NHWC":"NCHW",auto_pad:d,ceil_mode:m,count_include_pad:h,storage_order:w,dilations:I?Array.from((v(),R).subarray(Number(I)>>>0,Number(E)>>>0)):[],kernel_shape:B?Array.from((v(),R).subarray(Number(B)>>>0,Number(W)>>>0)):[],pads:H?Array.from((v(),R).subarray(Number(H)>>>0,Number(se)>>>0)):[],strides:ce?Array.from((v(),R).subarray(Number(ce)>>>0,Number(_e)>>>0)):[]})},1013758:(o,d,m,h,w)=>{t.$b("Gemm",o,{alpha:d,beta:m,transA:h,transB:w})},1013862:o=>{t.$b("MatMul",o,void 0)},1013916:(o,d,m,h)=>{t.$b("ArgMax",o,{keepDims:!!d,selectLastIndex:!!m,axis:h})},1014024:(o,d,m,h)=>{t.$b("ArgMin",o,{keepDims:!!d,selectLastIndex:!!m,axis:h})},1014132:(o,d)=>{t.$b("Softmax",o,{axis:d})},1014195:(o,d)=>{t.$b("Concat",o,{axis:d})},1014255:(o,d,m,h,w)=>{t.$b("Split",o,{axis:d,numOutputs:m,splitSizes:h?Array.from((v(),R).subarray(Number(h)>>>0,Number(w)>>>0)):[]})},1014411:o=>{t.$b("Expand",o,void 0)},1014465:(o,d)=>{t.$b("Gather",o,{axis:Number(d)})},1014536:(o,d)=>{t.$b("GatherElements",o,{axis:Number(d)})},1014615:(o,d)=>{t.$b("GatherND",o,{batch_dims:Number(d)})},1014694:(o,d,m,h,w,I,E,B,W,H,se)=>{t.$b("Resize",o,{antialias:d,axes:m?Array.from((v(),R).subarray(Number(m)>>>0,Number(h)>>>0)):[],coordinateTransformMode:Ie(w),cubicCoeffA:I,excludeOutside:E,extrapolationValue:B,keepAspectRatioPolicy:Ie(W),mode:Ie(H),nearestMode:Ie(se)})},1015056:(o,d,m,h,w,I,E)=>{t.$b("Slice",o,{starts:d?Array.from((v(),R).subarray(Number(d)>>>0,Number(m)>>>0)):[],ends:h?Array.from((v(),R).subarray(Number(h)>>>0,Number(w)>>>0)):[],axes:I?Array.from((v(),R).subarray(Number(I)>>>0,Number(E)>>>0)):[]})},1015320:o=>{t.$b("Tile",o,void 0)},1015372:(o,d,m)=>{t.$b("InstanceNormalization",o,{epsilon:d,format:m?"NHWC":"NCHW"})},1015486:(o,d,m)=>{t.$b("InstanceNormalization",o,{epsilon:d,format:m?"NHWC":"NCHW"})},1015600:o=>{t.$b("Range",o,void 0)},1015653:(o,d)=>{t.$b("Einsum",o,{equation:Ie(d)})},1015734:(o,d,m,h,w)=>{t.$b("Pad",o,{mode:d,value:m,pads:h?Array.from((v(),R).subarray(Number(h)>>>0,Number(w)>>>0)):[]})},1015877:(o,d,m,h,w,I)=>{t.$b("BatchNormalization",o,{epsilon:d,momentum:m,spatial:!!w,trainingMode:!!h,format:I?"NHWC":"NCHW"})},1016046:(o,d,m,h,w,I)=>{t.$b("BatchNormalization",o,{epsilon:d,momentum:m,spatial:!!w,trainingMode:!!h,format:I?"NHWC":"NCHW"})},1016215:(o,d,m)=>{t.$b("CumSum",o,{exclusive:Number(d),reverse:Number(m)})},1016312:(o,d,m)=>{t.$b("DequantizeLinear",o,{axis:d,blockSize:m})},1016402:(o,d,m,h,w)=>{t.$b("GridSample",o,{align_corners:d,mode:Ie(m),padding_mode:Ie(h),format:w?"NHWC":"NCHW"})},1016572:(o,d,m,h,w)=>{t.$b("GridSample",o,{align_corners:d,mode:Ie(m),padding_mode:Ie(h),format:w?"NHWC":"NCHW"})},1016742:(o,d)=>{t.$b("ScatterND",o,{reduction:Ie(d)})},1016827:(o,d,m,h,w,I,E,B,W)=>{t.$b("Attention",o,{numHeads:d,isUnidirectional:m,maskFilterValue:h,scale:w,doRotary:I,qkvHiddenSizes:E?Array.from((v(),R).subarray(Number(B)>>>0,Number(B)+E>>>0)):[],pastPresentShareBuffer:!!W})},1017099:o=>{t.$b("BiasAdd",o,void 0)},1017154:o=>{t.$b("BiasSplitGelu",o,void 0)},1017215:o=>{t.$b("FastGelu",o,void 0)},1017271:(o,d,m,h,w,I,E,B,W,H,se,ce,_e,ve,bt,xi)=>{t.$b("Conv",o,{format:ce?"NHWC":"NCHW",auto_pad:d,dilations:m?Array.from((v(),R).subarray(Number(m)>>>0,Number(h)>>>0)):[],group:w,kernel_shape:I?Array.from((v(),R).subarray(Number(I)>>>0,Number(E)>>>0)):[],pads:B?Array.from((v(),R).subarray(Number(B)>>>0,Number(W)>>>0)):[],strides:H?Array.from((v(),R).subarray(Number(H)>>>0,Number(se)>>>0)):[],w_is_const:()=>!!(v(),D)[Number(_e)>>>0],activation:Ie(ve),activation_params:bt?Array.from((v(),X).subarray(Number(bt)>>>0,Number(xi)>>>0)):[]})},1017855:o=>{t.$b("Gelu",o,void 0)},1017907:(o,d,m,h,w,I,E,B,W)=>{t.$b("GroupQueryAttention",o,{numHeads:d,kvNumHeads:m,scale:h,softcap:w,doRotary:I,rotaryInterleaved:E,smoothSoftmax:B,localWindowSize:W})},1018124:(o,d,m,h)=>{t.$b("LayerNormalization",o,{axis:d,epsilon:m,simplified:!!h})},1018235:(o,d,m,h)=>{t.$b("LayerNormalization",o,{axis:d,epsilon:m,simplified:!!h})},1018346:(o,d,m,h,w,I)=>{t.$b("MatMulNBits",o,{k:d,n:m,accuracyLevel:h,bits:w,blockSize:I})},1018473:(o,d,m,h,w,I)=>{t.$b("MultiHeadAttention",o,{numHeads:d,isUnidirectional:m,maskFilterValue:h,scale:w,doRotary:I})},1018632:(o,d)=>{t.$b("QuickGelu",o,{alpha:d})},1018696:(o,d,m,h,w)=>{t.$b("RotaryEmbedding",o,{interleaved:!!d,numHeads:m,rotaryEmbeddingDim:h,scale:w})},1018835:(o,d,m)=>{t.$b("SkipLayerNormalization",o,{epsilon:d,simplified:!!m})},1018937:(o,d,m)=>{t.$b("SkipLayerNormalization",o,{epsilon:d,simplified:!!m})},1019039:(o,d,m,h)=>{t.$b("GatherBlockQuantized",o,{gatherAxis:d,quantizeAxis:m,blockSize:h})},1019160:o=>{t.Fd(o)},1019194:(o,d)=>t.Hd(Number(o),Number(d),t.Yc.Kd,t.Yc.errors)};function tg(o,d,m){return Zn(async()=>{await t.Dd(Number(o),Number(d),Number(m))})}function rg(){return typeof wasmOffsetConverter<"u"}function ig(o,d,m,h){var w=ue();try{return As(o,d,m,h)}catch(I){if(oe(w),I!==I+0)throw I;de(1,0)}}function ag(o,d,m){var h=ue();try{return Ts(o,d,m)}catch(w){if(oe(h),w!==w+0)throw w;de(1,0)}}function ng(o){var d=ue();try{Ss(o)}catch(m){if(oe(d),m!==m+0)throw m;de(1,0)}}function sg(o,d){var m=ue();try{return wi(o,d)}catch(h){if(oe(m),h!==h+0)throw h;de(1,0)}}function og(o,d,m){var h=ue();try{xs(o,d,m)}catch(w){if(oe(h),w!==w+0)throw w;de(1,0)}}function ug(o,d){var m=ue();try{Os(o,d)}catch(h){if(oe(m),h!==h+0)throw h;de(1,0)}}function lg(o,d,m,h,w,I,E){var B=ue();try{return Es(o,d,m,h,w,I,E)}catch(W){if(oe(B),W!==W+0)throw W;de(1,0)}}function dg(o,d,m,h,w,I){var E=ue();try{ks(o,d,m,h,w,I)}catch(B){if(oe(E),B!==B+0)throw B;de(1,0)}}function pg(o,d,m,h){var w=ue();try{zs(o,d,m,h)}catch(I){if(oe(w),I!==I+0)throw I;de(1,0)}}function cg(o,d,m,h,w){var I=ue();try{Is(o,d,m,h,w)}catch(E){if(oe(I),E!==E+0)throw E;de(1,0)}}function hg(o,d,m,h,w,I,E){var B=ue();try{Bs(o,d,m,h,w,I,E)}catch(W){if(oe(B),W!==W+0)throw W;de(1,0)}}function fg(o,d,m,h,w,I,E){var B=ue();try{Ns(o,d,m,h,w,I,E)}catch(W){if(oe(B),W!==W+0)throw W;de(1,0)}}function mg(o,d,m,h,w,I,E,B){var W=ue();try{Us(o,d,m,h,w,I,E,B)}catch(H){if(oe(W),H!==H+0)throw H;de(1,0)}}function gg(o,d,m,h,w){var I=ue();try{return Rs(o,d,m,h,w)}catch(E){if(oe(I),E!==E+0)throw E;de(1,0)}}function yg(o,d,m){var h=ue();try{return qs(o,d,m)}catch(w){if(oe(h),w!==w+0)throw w;de(1,0)}}function _g(o,d,m,h,w,I,E,B){var W=ue();try{Ls(o,d,m,h,w,I,E,B)}catch(H){if(oe(W),H!==H+0)throw H;de(1,0)}}function bg(o,d,m,h,w,I,E,B,W,H,se,ce){var _e=ue();try{Ms(o,d,m,h,w,I,E,B,W,H,se,ce)}catch(ve){if(oe(_e),ve!==ve+0)throw ve;de(1,0)}}function $g(o,d,m,h,w,I){var E=ue();try{return Ds(o,d,m,h,w,I)}catch(B){if(oe(E),B!==B+0)throw B;de(1,0)}}function wg(o,d,m){var h=ue();try{return Ws(o,d,m)}catch(w){if(oe(h),w!==w+0)throw w;return de(1,0),0n}}function vg(o,d,m,h,w,I,E,B,W){var H=ue();try{Cs(o,d,m,h,w,I,E,B,W)}catch(se){if(oe(H),se!==se+0)throw se;de(1,0)}}function xg(o){var d=ue();try{return Vs(o)}catch(m){if(oe(d),m!==m+0)throw m;de(1,0)}}function Sg(o,d){var m=ue();try{return ao(o,d)}catch(h){if(oe(m),h!==h+0)throw h;return de(1,0),0n}}function kg(o){var d=ue();try{return Gs(o)}catch(m){if(oe(d),m!==m+0)throw m;return de(1,0),0n}}function Ig(o,d,m,h){var w=ue();try{return Xs(o,d,m,h)}catch(I){if(oe(w),I!==I+0)throw I;de(1,0)}}function Tg(o,d,m,h,w){var I=ue();try{return Qs(o,d,m,h,w)}catch(E){if(oe(I),E!==E+0)throw E;de(1,0)}}function Cg(o,d,m,h,w,I){var E=ue();try{return Ys(o,d,m,h,w,I)}catch(B){if(oe(E),B!==B+0)throw B;de(1,0)}}function Eg(o,d,m,h,w,I){var E=ue();try{return Js(o,d,m,h,w,I)}catch(B){if(oe(E),B!==B+0)throw B;de(1,0)}}function zg(o,d,m,h,w,I,E,B){var W=ue();try{return Ps(o,d,m,h,w,I,E,B)}catch(H){if(oe(W),H!==H+0)throw H;de(1,0)}}function Ag(o,d,m,h,w){var I=ue();try{return eo(o,d,m,h,w)}catch(E){if(oe(I),E!==E+0)throw E;return de(1,0),0n}}function Og(o,d,m,h){var w=ue();try{return to(o,d,m,h)}catch(I){if(oe(w),I!==I+0)throw I;de(1,0)}}function Rg(o,d,m,h){var w=ue();try{return ro(o,d,m,h)}catch(I){if(oe(w),I!==I+0)throw I;de(1,0)}}function Bg(o,d,m,h,w,I,E,B,W,H,se,ce){var _e=ue();try{return io(o,d,m,h,w,I,E,B,W,H,se,ce)}catch(ve){if(oe(_e),ve!==ve+0)throw ve;de(1,0)}}function Ng(o,d,m,h,w,I,E,B,W,H,se){var ce=ue();try{Ks(o,d,m,h,w,I,E,B,W,H,se)}catch(_e){if(oe(ce),_e!==_e+0)throw _e;de(1,0)}}function Mg(o,d,m,h,w,I,E,B,W,H,se,ce,_e,ve,bt,xi){var qg=ue();try{Zs(o,d,m,h,w,I,E,B,W,H,se,ce,_e,ve,bt,xi)}catch(Si){if(oe(qg),Si!==Si+0)throw Si;de(1,0)}}function Dg(o,d,m){var h=ue();try{return Hs(o,d,m)}catch(w){if(oe(h),w!==w+0)throw w;de(1,0)}}function Pg(o,d,m){var h=ue();try{return Fs(o,d,m)}catch(w){if(oe(h),w!==w+0)throw w;de(1,0)}}function Ug(o,d,m,h){var w=ue();try{js(o,d,m,h)}catch(I){if(oe(w),I!==I+0)throw I;de(1,0)}}function Or(){if(0<Ue)De=Or;else if(a)b==null||b(t),Q();else{for(var o=Me;0<o.length;)o.shift()(t);0<Ue?De=Or:(t.calledRun=!0,z||(Q(),b==null||b(t)))}}return a||(lt=await Ge(),Or()),t.PTR_SIZE=4,U?t:new Promise((o,d)=>{b=o,S=d})}var yp,go,ny=P(()=>{var e,t;yp=mo,go=(t=(e=globalThis.self)==null?void 0:e.name)==null?void 0:t.startsWith("em-pthread"),go&&mo()}),Oi,Sa,yo,Le,_p,Br,_o,bo,Ri,$o,Bi,bp,Ni,$p,Fa=P(()=>{Ha(),Oi=typeof location>"u"?void 0:location.origin,Sa=import.meta.url>"file:"&&import.meta.url<"file;",yo=()=>{{if(Sa){let e=URL;return new URL(new e("ort.bundle.min.mjs",import.meta.url).href,Oi).href}return import.meta.url}},Le=yo(),_p=()=>{if(Le&&!Le.startsWith("blob:"))return Le.substring(0,Le.lastIndexOf("/")+1)},Br=(e,t)=>{try{let r=t??Le;return(r?new URL(e,r):new URL(e)).origin===Oi}catch{return!1}},_o=(e,t)=>{let r=t??Le;try{return(r?new URL(e,r):new URL(e)).href}catch{return}},bo=(e,t)=>`${t??"./"}${e}`,Ri=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},$o=async e=>(await import(e)).default,Bi=(ay(),_r(fp)).default,bp=async()=>{if(!Le)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(Br(Le))return[void 0,Bi()];let e=await Ri(Le);return[e,Bi(e)]},Ni=(ny(),_r(gp)).default,$p=async(e,t,r,i)=>{let a=Ni&&!(e||t);if(a)if(Le)a=Br(Le)||i&&!r;else if(i&&!r)a=!0;else throw new Error("cannot determine the script source URL.");if(a)return[void 0,Ni];{let n="ort-wasm-simd-threaded.jsep.mjs",s=e??_o(n,t),u=r&&s&&!Br(s,t),l=u?await Ri(s):s??bo(n,t);return[u?l:void 0,await $o(l)]}}}),Mi,Nr,ar,Di,wo,vo,xo,ja,$e,Wt=P(()=>{Fa(),Nr=!1,ar=!1,Di=!1,wo=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},vo=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},xo=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},ja=async e=>{if(Nr)return Promise.resolve();if(ar)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(Di)throw new Error("previous call to 'initializeWebAssembly()' failed.");ar=!0;let t=e.initTimeout,r=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!xo())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!vo())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let i=wo();r>1&&!i&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let a=e.wasmPaths,n=typeof a=="string"?a:void 0,s=a==null?void 0:a.mjs,u=(s==null?void 0:s.href)??s,l=a==null?void 0:a.wasm,p=(l==null?void 0:l.href)??l,c=e.wasmBinary,[f,g]=await $p(u,n,r>1,!!c||!!p),y=!1,_=[];if(t>0&&_.push(new Promise(b=>{setTimeout(()=>{y=!0,b()},t)})),_.push(new Promise((b,S)=>{let x={numThreads:r};if(c)x.wasmBinary=c,x.locateFile=$=>$;else if(p||n)x.locateFile=$=>p??n+$;else if(u&&u.indexOf("blob:")!==0)x.locateFile=$=>new URL($,u).href;else if(f){let $=_p();$&&(x.locateFile=T=>$+T)}g(x).then($=>{ar=!1,Nr=!0,Mi=$,b(),f&&URL.revokeObjectURL(f)},$=>{ar=!1,Di=!0,S($)})})),await Promise.race(_),y)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},$e=()=>{if(Nr&&Mi)return Mi;throw new Error("WebAssembly is not initialized yet.")}}),Je,Zr,ye,Ka=P(()=>{Wt(),Je=(e,t)=>{let r=$e(),i=r.lengthBytesUTF8(e)+1,a=r._malloc(i);return r.stringToUTF8(e,a,i),t.push(a),a},Zr=(e,t,r,i)=>{if(typeof e=="object"&&e!==null){if(r.has(e))throw new Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([a,n])=>{let s=t?t+a:a;if(typeof n=="object")Zr(n,s+".",r,i);else if(typeof n=="string"||typeof n=="number")i(s,n.toString());else if(typeof n=="boolean")i(s,n?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof n}`)})},ye=e=>{let t=$e(),r=t.stackSave();try{let i=t.PTR_SIZE,a=t.stackAlloc(2*i);t._OrtGetLastError(a,a+i);let n=Number(t.getValue(a,i===4?"i32":"i64")),s=t.getValue(a+i,"*"),u=s?t.UTF8ToString(s):"";throw new Error(`${e} ERROR_CODE: ${n}, ERROR_MESSAGE: ${u}`)}finally{t.stackRestore(r)}}}),wp,sy=P(()=>{Wt(),Ka(),wp=e=>{let t=$e(),r=0,i=[],a=e||{};try{if((e==null?void 0:e.logSeverityLevel)===void 0)a.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${e.logSeverityLevel}`);if((e==null?void 0:e.logVerbosityLevel)===void 0)a.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);(e==null?void 0:e.terminate)===void 0&&(a.terminate=!1);let n=0;return(e==null?void 0:e.tag)!==void 0&&(n=Je(e.tag,i)),r=t._OrtCreateRunOptions(a.logSeverityLevel,a.logVerbosityLevel,!!a.terminate,n),r===0&&ye("Can't create run options."),(e==null?void 0:e.extra)!==void 0&&Zr(e.extra,"",new WeakSet,(s,u)=>{let l=Je(s,i),p=Je(u,i);t._OrtAddRunConfigEntry(r,l,p)!==0&&ye(`Can't set a run config entry: ${s} - ${u}.`)}),[r,i]}catch(n){throw r!==0&&t._OrtReleaseRunOptions(r),i.forEach(s=>t._free(s)),n}}}),So,ko,Io,Ct,To,vp,oy=P(()=>{Wt(),Ka(),So=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},ko=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},Io=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(r=>(typeof r=="string"?r:r.name)==="webgpu")&&(e.enableMemPattern=!1)},Ct=(e,t,r,i)=>{let a=Je(t,i),n=Je(r,i);$e()._OrtAddSessionConfigEntry(e,a,n)!==0&&ye(`Can't set a session config entry: ${t} - ${r}.`)},To=async(e,t,r)=>{let i=t.executionProviders;for(let a of i){let n=typeof a=="string"?a:a.name,s=[];switch(n){case"webnn":if(n="WEBNN",Ct(e,"session.disable_quant_qdq","1",r),Ct(e,"session.disable_qdq_constant_folding","1",r),typeof a!="string"){let f=a==null?void 0:a.deviceType;f&&Ct(e,"deviceType",f,r)}break;case"webgpu":if(n="JS",typeof a!="string"){let f=a;if(f!=null&&f.preferredLayout){if(f.preferredLayout!=="NCHW"&&f.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${f.preferredLayout}`);Ct(e,"preferredLayout",f.preferredLayout,r)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${n}`)}let u=Je(n,r),l=s.length,p=0,c=0;if(l>0){p=$e()._malloc(l*$e().PTR_SIZE),r.push(p),c=$e()._malloc(l*$e().PTR_SIZE),r.push(c);for(let f=0;f<l;f++)$e().setValue(p+f*$e().PTR_SIZE,s[f][0],"*"),$e().setValue(c+f*$e().PTR_SIZE,s[f][1],"*")}await $e()._OrtAppendExecutionProvider(e,u,p,c,l)!==0&&ye(`Can't append execution provider: ${n}.`)}},vp=async e=>{let t=$e(),r=0,i=[],a=e||{};Io(a);try{let n=So(a.graphOptimizationLevel??"all"),s=ko(a.executionMode??"sequential"),u=typeof a.logId=="string"?Je(a.logId,i):0,l=a.logSeverityLevel??2;if(!Number.isInteger(l)||l<0||l>4)throw new Error(`log severity level is not valid: ${l}`);let p=a.logVerbosityLevel??0;if(!Number.isInteger(p)||p<0||p>4)throw new Error(`log verbosity level is not valid: ${p}`);let c=typeof a.optimizedModelFilePath=="string"?Je(a.optimizedModelFilePath,i):0;if(r=t._OrtCreateSessionOptions(n,!!a.enableCpuMemArena,!!a.enableMemPattern,s,!!a.enableProfiling,0,u,l,p,c),r===0&&ye("Can't create session options."),a.executionProviders&&await To(r,a,i),a.enableGraphCapture!==void 0){if(typeof a.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${a.enableGraphCapture}`);Ct(r,"enableGraphCapture",a.enableGraphCapture.toString(),i)}if(a.freeDimensionOverrides)for(let[f,g]of Object.entries(a.freeDimensionOverrides)){if(typeof f!="string")throw new Error(`free dimension override name must be a string: ${f}`);if(typeof g!="number"||!Number.isInteger(g)||g<0)throw new Error(`free dimension override value must be a non-negative integer: ${g}`);let y=Je(f,i);t._OrtAddFreeDimensionOverride(r,y,g)!==0&&ye(`Can't set a free dimension override: ${f} - ${g}.`)}return a.extra!==void 0&&Zr(a.extra,"",new WeakSet,(f,g)=>{Ct(r,f,g,i)}),[r,i]}catch(n){throw r!==0&&t._OrtReleaseSessionOptions(r)!==0&&ye("Can't release session options."),i.forEach(s=>t._free(s)),n}}}),Nt,ct,Mt,ri,Xr,Za,Xa,ka,re=P(()=>{Nt=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},ct=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},Mt=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],i=typeof t=="number"?t:t.reduce((a,n)=>a*n,1);return r>0?Math.ceil(i*r):void 0},ri=e=>{switch(e){case"float16":return typeof Float16Array<"u"?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},Xr=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},Za=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Xa=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",ka=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),Qa,xp=P(()=>{Ha(),Qa=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),i=r?parseInt(r,10):0;if(i<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let a=t.body.getReader(),n;try{n=new ArrayBuffer(i)}catch(u){if(u instanceof RangeError){let l=Math.ceil(i/65536);n=new WebAssembly.Memory({initial:l,maximum:l}).buffer}else throw u}let s=0;for(;;){let{done:u,value:l}=await a.read();if(u)break;let p=l.byteLength;new Uint8Array(n,s,p).set(l),s+=p}return new Uint8Array(n,0,i)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),Co,Eo,zo,Ao,Ya,Oo,pe,ht=P(()=>{re(),Co=["V","I","W","E","F"],Eo=(e,t)=>{console.log(`[${Co[e]},${new Date().toISOString()}]${t}`)},Ya=(e,t)=>{zo=e,Ao=t},Oo=(e,t)=>{let r=Xr(e),i=Xr(zo);r>=i&&Eo(r,typeof t=="function"?t():t)},pe=(...e)=>{Ao&&Oo(...e)}}),Ro,Zt,O,Qr,Sp,kp,Ip,ae=P(()=>{Ro=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},Zt=class{static calcShape(e,t,r=!1){let i=e.length,a=t.length;if(i===0)return t;if(a===0)return e;let n=Math.max(e.length,t.length),s=new Array(n);if(r){if(i<2||a<2)return;let u=Ro.calcMatMulShape([e[i-2],e[i-1]],[t[a-2],t[a-1]]);if(u===void 0)return;[s[n-2],s[n-1]]=u}for(let u=r?3:1;u<=n;u++){let l=i-u<0?1:e[i-u],p=a-u<0?1:t[a-u];if(l!==p&&l>1&&p>1)return;let c=Math.max(l,p);if(l&&p)s[n-u]=Math.max(l,p);else{if(c>1)return;s[n-u]=0}}return s}static isValidBroadcast(e,t){let r=e.length,i=t.length;if(r>i)return!1;for(let a=1;a<=r;a++)if(e[r-a]!==1&&e[r-a]!==t[i-a])return!1;return!0}},O=class Fr{static size(t){return Fr.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,r=4){let i=t.length;if(i===0)return[];let a=new Array(i),n=i-1;for(;n>=0;){if(t[n]%r===0){a[n]=t[n]/r;break}if(r%t[n]!==0)throw new Error("cannot convert shape");a[n]=1,r/=t[n],n--}for(n--;n>=0;n--)a[n]=t[n];return a}static sizeFromDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return Fr.getSizeFromDimensionRange(t,r,t.length)}static sizeToDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeToDimension as Tensor has ${t.length} dimensions.`);return Fr.getSizeFromDimensionRange(t,0,r)}static getSizeFromDimensionRange(t,r,i){let a=1;for(let n=r;n<i;n++){if(t[n]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");a*=Number(t[n])}return a}static computeStrides(t){let r=t.length;if(r===0)return[];if(r===1)return[1];let i=new Array(r);i[r-1]=1,i[r-2]=t[r-1];for(let a=r-3;a>=0;--a)i[a]=i[a+1]*t[a+1];return i}static normalizeAxis(t,r){if(t<-r&&t>=r)throw new Error("unsupported axis for this operation.");return t<0?t+r:t}static normalizeAxes(t,r){return t.map(i=>this.normalizeAxis(i,r??t.length))}static sortBasedOnPerm(t,r){return r?r.map(i=>t[i]):t.slice().reverse()}static padShape(t,r){let i=t.length;return t.map((a,n)=>a+r[n]+r[n+i])}static areEqual(t,r){return t.length!==r.length?!1:t.every((i,a)=>i===r[a])}},Qr=class fr{static adjustPoolAttributes(t,r,i,a,n,s){if(!t&&i.length!==r.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let u=0;u<r.length-2;u++)u>=i.length?i.push(r[u+2]):i[u]=r[u+2];for(let u=0;u<i.length;u++)if(u<a.length){if(a[u]<0)throw new Error("strides should be greater than or equal to 1")}else a.push(1);for(let u=0;u<i.length;u++)if(u<n.length){if(n[u]<0)throw new Error("dilations should be greater than or equal to 1")}else n.push(1);for(let u=0;u<i.length*2;u++)if(u<s.length){if(s[u]<0)throw new Error("pad should be greater than or equal to 1")}else s.push(0);for(let u=0;u<i.length;u++){if(i[u]<=0)throw new Error("kernel shapes need to be greater than 0");if(s[u]>=i[u]||s[u+i.length]>=i[u])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,r,i,a,n,s,u){if(u){if(n.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(r.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(a.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let l=0;l<t.length-2;l++)fr.adjustPadAndReturnShape(t[l+(s?1:2)],r[l],i[l],a[l],n,l,l+t.length-2,u)}}static computePoolOutputShape(t,r,i,a,n,s,u){if(r.length<=0)throw new Error("input shape must be of size greater than 0");let l=[r[0],r[1]];return fr.computeShapeHelper(t,r,l,i,a,n,s,u),l}static computeConvOutputShape(t,r,i,a,n,s,u){if(t.length<=0||r.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let l=[t[0],r[0]];return fr.computeShapeHelper(!1,t,l,i,a,n,s,u),l}static computeShapeHelper(t,r,i,a,n,s,u,l){if(t)for(let p=0;p<r.length-2;p++)i.push(1);else for(let p=0;p<r.length-2;p++)i.push(fr.adjustPadAndReturnShape(r[p+2],a[p],n[p],s[p],u,p,p+r.length-2,l))}static adjustPadAndReturnShape(t,r,i,a,n,s,u,l){let p=i*(a-1)+1;if(l&&l!=="NOTSET")switch(l){case"VALID":return n[s]=0,n[u]=0,Math.floor((t-p)/r+1);case"SAME_LOWER":case"SAME_UPPER":if(i!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let c=((t+r-1)/r-1)*r+a-t;return n[s]=Math.floor(l==="SAME_LOWER"?(c+1)/2:c/2),n[u]=c-n[s],Math.floor((t+c-a)/r+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+n[s]+n[u]-p)/r+1)}},Sp=class{static getShapeOfGemmResult(e,t,r,i,a){if(e.length!==2||r.length!==2)throw new Error("shape need to be of size 2");let n,s,u;t?(n=e[1],s=e[0]):(n=e[0],s=e[1]);let l=-1;if(i?(u=r[0],l=1):(u=r[1],l=0),r[l]!==s)throw new Error("dimension mismatch");if(n<=0||u<=0||s<=0)throw new Error("invalid shape specified");if(a&&!Zt.isValidBroadcast(a,[n,u]))throw new Error("gemm: invalid bias shape for broadcast");return[n,u,s]}},kp=-34028234663852886e22,Ip=34028234663852886e22}),Ja,Tp=P(()=>{re(),Ja=(e,t)=>new(ri(t))(e)}),Pi,Ia,Ui,Bo,qi,No,Li,Wi,Vi,Mo,Cp,uy=P(()=>{re(),ht(),Pi=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),Ia=(e,t)=>{if(t==="int32")return e;let r=Pi.get(t);if(!r)throw new Error(`WebNN backend does not support data type: ${t}`);let i=r/8;if(e.byteLength%i!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${i}.`);let a=e.byteLength/i,n=new(ri(t))(e.buffer,e.byteOffset,a);switch(t){case"int64":case"uint64":{let s=new Int32Array(a);for(let u=0;u<a;u++){let l=n[u];if(l>2147483647n||l<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");s[u]=Number(l)}return new Uint8Array(s.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&n.some(u=>u>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let s=Int32Array.from(n,Number);return new Uint8Array(s.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},Ui=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let r=e.byteLength/4,i=new Int32Array(e.buffer,e.byteOffset,r);switch(t){case"int64":{let a=BigInt64Array.from(i,BigInt);return new Uint8Array(a.buffer)}case"uint64":{if(i.some(n=>n<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let a=BigUint64Array.from(i,BigInt);return new Uint8Array(a.buffer)}case"int8":{if(i.some(n=>n<-128||n>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let a=Int8Array.from(i,Number);return new Uint8Array(a.buffer)}case"uint8":{if(i.some(a=>a<0||a>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(i,Number)}case"uint32":{if(i.some(n=>n<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let a=Uint32Array.from(i,Number);return new Uint8Array(a.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},Bo=1,qi=()=>Bo++,No=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),Li=(e,t)=>{let r=Pi.get(e);if(!r)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((i,a)=>i*a)*r/8):0},Wi=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:r,tensor:i,dataType:a,shape:n,fallbackDataType:s}=e;this.sessionId=t,this.mlContext=r,this.mlTensor=i,this.dataType=a,this.tensorShape=n,this.fallbackDataType=s}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return Li(this.dataType,this.tensorShape)}destroy(){pe("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),r=Ui(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(r);return}else return new Uint8Array(r).buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,r){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===r.length&&this.tensorShape.every((i,a)=>i===r[a])}setIsDataConverted(e){this.isDataConverted=e}},Vi=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,r,i){let a=this.tensorManager.getMLContext(e),n=this.tensorManager.getMLOpSupportLimits(e),s;if(!(n!=null&&n.input.dataTypes.includes(t))){if(s=No.get(t),!s||(n==null?void 0:n.input.dataTypes.includes(s)))throw new Error(`WebNN backend does not support data type: ${t}`);pe("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${s}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(a,t,r))return this.wrapper.tensor;if(i){if(this.wrapper.byteLength!==Li(t,r))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let u=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,r,u,!0,!0,s),i&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=Ia(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else pe("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){var t,r;if(this.activeUpload){let i=(t=this.wrapper)!=null&&t.isDataConverted?Ui(this.activeUpload,(r=this.wrapper)==null?void 0:r.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(i):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(i);return}else return i.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},Mo=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}getMLOpSupportLimits(e){return this.backend.getMLOpSupportLimits(e)}reserveTensorId(){let e=qi();return this.tensorTrackersById.set(e,new Vi(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,r,i,a){pe("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${r}, shape: ${i}, copyOld: ${a}}`);let n=this.tensorTrackersById.get(t);if(!n)throw new Error("Tensor not found.");return n.ensureTensor(e,r,i,a)}upload(e,t){let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");r.upload(t)}async download(e,t){pe("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t==null?void 0:t.byteLength}}`);let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");return r.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,r,i){let a=this.getMLContext(e),n=qi(),s=new Wi({sessionId:e,context:a,tensor:t,dataType:r,shape:i});return this.tensorTrackersById.set(n,new Vi(this,s)),this.externalTensors.add(s),n}async getCachedTensor(e,t,r,i,a,n,s){let u=this.getMLContext(e);for(let[p,c]of this.freeTensors.entries())if(c.canReuseTensor(u,t,r)){pe("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}`);let f=this.freeTensors.splice(p,1)[0];return f.sessionId=e,f}pe("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}}`);let l=await u.createTensor({dataType:s??t,shape:r,dimensions:r,usage:i,writable:a,readable:n});return new Wi({sessionId:e,context:u,tensor:l,dataType:t,shape:r,fallbackDataType:s})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},Cp=(...e)=>new Mo(...e)}),nr,Do,Ep,ly=P(()=>{re(),Wt(),Tp(),uy(),ht(),nr=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),Do=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let r=Object.keys(e).sort(),i=Object.keys(t).sort();return r.length===i.length&&r.every((a,n)=>a===i[n]&&e[a]===t[a])},Ep=class{constructor(e){this.tensorManager=Cp(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,this.mlOpSupportLimitsBySessionId=new Map,Ya(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){pe("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){pe("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let r of t)pe("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${r}}`),this.tensorManager.releaseTensorId(r);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let r=this.mlContextCache.findIndex(i=>i.gpuDevice===e);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:i}),i}}else if(e===void 0){let r=this.mlContextCache.findIndex(i=>i.options===void 0&&i.gpuDevice===void 0);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:i}),i}}let t=this.mlContextCache.findIndex(r=>Do(r.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:r}),r}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let r=this.sessionIdsByMLContext.get(t);r||(r=new Set,this.sessionIdsByMLContext.set(t,r)),r.add(e),this.mlOpSupportLimitsBySessionId.has(e)||this.mlOpSupportLimitsBySessionId.set(e,t.opSupportLimits()),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e),this.mlOpSupportLimitsBySessionId.delete(e);let r=this.sessionIdsByMLContext.get(t);if(r.delete(e),r.size===0){this.sessionIdsByMLContext.delete(t);let i=this.mlContextCache.findIndex(a=>a.mlContext===t);i!==-1&&this.mlContextCache.splice(i,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}getMLOpSupportLimits(e){return this.mlOpSupportLimitsBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){pe("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,r,i,a){let n=nr.get(r);if(!n)throw new Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,n,i,a)}async createTemporaryTensor(e,t,r){pe("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${r}}`);let i=nr.get(t);if(!i)throw new Error(`Unsupported ONNX data type: ${t}`);let a=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,a,i,r,!1);let n=this.temporarySessionTensorIds.get(e);return n?n.push(a):this.temporarySessionTensorIds.set(e,[a]),a}uploadTensor(e,t){if(!$e().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");pe("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let r=await this.tensorManager.download(e);return Ja(r,t)}}registerMLTensor(e,t,r,i){let a=nr.get(r);if(!a)throw new Error(`Unsupported ONNX data type: ${r}`);let n=this.tensorManager.registerTensor(e,t,a,i);return pe("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${a}, dimensions: ${i}} -> {tensorId: ${n}}`),n}registerMLConstant(e,t,r,i,a,n,s=!1){if(!n)throw new Error("External mounted files are not available.");let u=e;e.startsWith("./")&&(u=e.substring(2));let l=n.get(u);if(!l)throw new Error(`File with name ${u} not found in preloaded files.`);if(t+r>l.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let p=l.slice(t,t+r).buffer,c;switch(a.dataType){case"float32":c=new Float32Array(p);break;case"float16":c=typeof Float16Array<"u"?new Float16Array(p):new Uint16Array(p);break;case"int32":c=new Int32Array(p);break;case"uint32":c=new Uint32Array(p);break;case"int64":if(s){let f=Ia(new Uint8Array(p),"int64");c=new Int32Array(f.buffer),a.dataType="int32"}else c=new BigInt64Array(p);break;case"uint64":c=new BigUint64Array(p);break;case"int8":c=new Int8Array(p);break;case"int4":case"uint4":case"uint8":c=new Uint8Array(p);break;default:throw new Error(`Unsupported data type: ${a.dataType} in creating WebNN Constant from external data.`)}return pe("verbose",()=>`[WebNN] registerMLConstant {dataType: ${a.dataType}, shape: ${a.shape}}} ${s?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),i.constant(a,c)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let r=this.sessionGraphInputs.get(e);return r?r.includes(t):!1}isGraphOutput(e,t){let r=this.sessionGraphOutputs.get(e);return r?r.includes(t):!1}isGraphInputOutputTypeSupported(e,t,r=!0){let i=nr.get(Nt(t)),a=this.mlOpSupportLimitsBySessionId.get(e);return typeof i>"u"?!1:r?!!(a!=null&&a.input.dataTypes.includes(i)):!!(a!=null&&a.output.dataTypes.includes(i))}flush(){}}}),en=P(()=>{}),Gi,Mr,Dr,Po,Uo,Hi,Ta,qo,zp,dy=P(()=>{ht(),en(),Gi=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),Mr=[],Dr=e=>Math.ceil(Number(e)/16)*16,Po=e=>{for(let t=0;t<Mr.length;t++){let r=Mr[t];if(e<=r)return r}return Math.ceil(e/16)*16},Uo=1,Hi=()=>Uo++,Ta=async(e,t,r,i)=>{let a=Dr(r),n=e.device.createBuffer({size:a,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let s=e.getCommandEncoder();e.endComputePass(),s.copyBufferToBuffer(t,0,n,0,a),e.flush(),await n.mapAsync(GPUMapMode.READ);let u=n.getMappedRange();if(i){let l=i();return l.set(new Uint8Array(u,0,r)),l}else return new Uint8Array(u.slice(0,r))}finally{n.destroy()}},qo=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of Gi)Mr.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let r=t.buffer,i=t.byteOffset,a=t.byteLength,n=Dr(a),s=this.storageCache.get(e);if(!s)throw new Error("gpu data for uploading does not exist");if(Number(s.originalSize)!==a)throw new Error(`inconsistent data size. gpu data size=${s.originalSize}, data size=${a}`);let u=this.backend.device.createBuffer({mappedAtCreation:!0,size:n,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),l=u.getMappedRange();new Uint8Array(l).set(new Uint8Array(r,i,a)),u.unmap();let p=this.backend.device.createCommandEncoder();p.copyBufferToBuffer(u,0,s.gpuData.buffer,0,n),this.backend.device.queue.submit([p.finish()]),u.destroy(),pe("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let r=this.storageCache.get(e);if(!r)throw new Error("source gpu data for memcpy does not exist");let i=this.storageCache.get(t);if(!i)throw new Error("destination gpu data for memcpy does not exist");if(r.originalSize!==i.originalSize)throw new Error("inconsistent source and destination gpu data size");let a=Dr(r.originalSize),n=this.backend.getCommandEncoder();this.backend.endComputePass(),n.copyBufferToBuffer(r.gpuData.buffer,0,i.gpuData.buffer,0,a)}registerExternalBuffer(e,t,r){let i;if(r){if(i=r[0],e===r[1])return pe("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, buffer is the same, skip.`),i;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else i=Hi();return this.storageCache.set(i,{gpuData:{id:i,type:0,buffer:e},originalSize:t}),pe("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, registered.`),i}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),pe("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=Po(e),i,a=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,n=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(a||n){let u=(a?this.freeBuffers:this.freeUniformBuffers).get(r);u?u.length>0?i=u.pop():i=this.backend.device.createBuffer({size:r,usage:t}):i=this.backend.device.createBuffer({size:r,usage:t})}else i=this.backend.device.createBuffer({size:r,usage:t});let s={id:Hi(),type:0,buffer:i};return this.storageCache.set(s.id,{gpuData:s,originalSize:Number(e)}),pe("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${s.id}`),s}get(e){var t;return(t=this.storageCache.get(e))==null?void 0:t.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,r=this.storageCache.get(t);if(!r){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return pe("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(e,t){let r=this.storageCache.get(Number(e));if(!r)throw new Error("data does not exist");await Ta(this.backend,r.gpuData.buffer,r.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=Gi.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(r=>{r.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(pe("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(r=>{r.gpuData.buffer.destroy()}),this.storageCache=new Map)}},zp=(...e)=>new qo(...e)}),Lo,me,Se=P(()=>{Lo=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},me=e=>new Lo(e)}),Xt,Pr,Ce,Ae,ee,xe,Ca,Kt,xt,J,sr,N,Y,Ap,tn,Wo,Op,ne=P(()=>{re(),ae(),Xt=64,Pr=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},Ce=(e,t=1)=>{let r=Pr(e,t);return typeof r=="string"?r:r[0]},Ae=(e,t=1)=>{let r=Pr(e,t);return typeof r=="string"?r:r[1]},ee=(...e)=>{let t=[];return e.forEach(r=>{r.length!==0&&t.push({type:12,data:r},{type:12,data:O.computeStrides(r)})}),t},xe=e=>e%4===0?4:e%2===0?2:1,Ca=(e="f32",t,r="0")=>!t||t===1?`${e}(${r})`:`vec${t}<${e}>(${r})`,Kt=(e,t,r)=>e==="f32"?r:t===1?`f32(${r})`:`vec${t}<f32>(${r})`,xt=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,J=(e,t,r,i)=>e.startsWith("uniforms.")&&r>4?typeof t=="string"?i==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:i==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:r>1?`${e}[${t}]`:e,sr=(e,t,r,i,a)=>{let n=typeof r=="number",s=n?r:r.length,u=[...new Array(s).keys()],l=s<2?"u32":s<=4?`vec${s}<u32>`:`array<u32, ${s}>`,p=Pr(t,a),c=typeof p=="string"?p:p[1],f=typeof p=="string"?p:p[0],g={indices:l,value:c,storage:f,tensor:t},y=U=>typeof U=="string"?U:`${U}u`,_={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},b=n?"uniforms.":"",S=`${b}${e}_shape`,x=`${b}${e}_strides`,$="";for(let U=0;U<s-1;U++)$+=`
    let dim${U} = current / ${J(x,U,s)};
    let rest${U} = current % ${J(x,U,s)};
    indices[${U}] = dim${U};
    current = rest${U};
    `;$+=`indices[${s-1}] = current;`;let T=s<2?"":`
  fn o2i_${e}(offset: u32) -> ${g.indices} {
    var indices: ${g.indices};
    var current = offset;
    ${$}
    return indices;
  }`,k=U=>(_.offsetToIndices=!0,s<2?U:`o2i_${e}(${U})`),C=[];if(s>=2)for(let U=s-1;U>=0;U--)C.push(`${J(x,U,s)} * (indices[${U}])`);let z=s<2?"":`
  fn i2o_${e}(indices: ${g.indices}) -> u32 {
    return ${C.join("+")};
  }`,A=U=>(_.indicesToOffset=!0,s<2?U:`i2o_${e}(${U})`),v=(...U)=>s===0?"0u":`${g.indices}(${U.map(y).join(",")})`,M=(U,G)=>s<2?`${U}`:`${J(U,G,s)}`,D=(U,G,Q)=>s<2?`${U}=${Q};`:`${J(U,G,s)}=${Q};`,F={},j=(U,G)=>{_.broadcastedIndicesToOffset=!0;let Q=`${G.name}broadcastedIndicesTo${e}Offset`;if(Q in F)return`${Q}(${U})`;let q=[];for(let ge=s-1;ge>=0;ge--){let Ge=G.indicesGet("outputIndices",ge+G.rank-s);q.push(`${M(x,ge)} * (${Ge} % ${M(S,ge)})`)}return F[Q]=`fn ${Q}(outputIndices: ${G.type.indices}) -> u32 {
             return ${q.length>0?q.join("+"):"0u"};
           }`,`${Q}(${U})`},K=(U,G)=>(()=>{if(g.storage===g.value)return`${e}[${U}]=${G};`;if(g.storage==="vec2<u32>"&&g.value==="i32")return`${e}[${U}]=vec2<u32>(u32(${G}), select(0u, 0xFFFFFFFFu, ${G} < 0));`;if(g.storage==="vec2<u32>"&&g.value==="u32")return`${e}[${U}]=vec2<u32>(u32(${G}), 0u);`;if(g.storage==="u32"&&g.value==="vec4<bool>")return`${e}[${U}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${G}));`;throw new Error(`not supported combination of storage type ${g.storage} and value type ${g.value} yet`)})(),R=U=>(()=>{if(g.storage===g.value)return`${e}[${U}]`;if(g.storage==="vec2<u32>"&&g.value==="i32")return`i32(${e}[${U}].x)`;if(g.storage==="vec2<u32>"&&g.value==="u32")return`u32(${e}[${U}].x)`;if(g.storage==="u32"&&g.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${U}] & 0xFFu), bool(${e}[${U}] & 0xFF00u), bool(${e}[${U}] & 0xFF0000u), bool(${e}[${U}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${g.storage} and value type ${g.value} yet`)})(),Z=s<2?"":`
  fn get_${e}ByIndices(indices: ${g.indices}) -> ${c} {
    return ${R(`i2o_${e}(indices)`)};
  }`,X=s<2?"":(()=>{let U=u.map(Q=>`d${Q}: u32`).join(", "),G=u.map(Q=>`d${Q}`).join(", ");return`
  fn get_${e}(${U}) -> ${c} {
    return get_${e}ByIndices(${v(G)});
  }`})(),te=(...U)=>{if(U.length!==s)throw new Error(`indices length must be ${s}`);let G=U.map(y).join(",");return s===0?R("0u"):s===1?R(G[0]):(_.get=!0,_.getByIndices=!0,_.indicesToOffset=!0,`get_${e}(${G})`)},fe=U=>s<2?R(U):(_.getByIndices=!0,_.indicesToOffset=!0,`get_${e}ByIndices(${U})`),V=s<2?"":`
  fn set_${e}ByIndices(indices: ${g.indices}, value: ${c}) {
    ${K(`i2o_${e}(indices)`,"value")}
  }`,le=s<2?"":(()=>{let U=u.map(Q=>`d${Q}: u32`).join(", "),G=u.map(Q=>`d${Q}`).join(", ");return`
  fn set_${e}(${U}, value: ${c}) {
    set_${e}ByIndices(${v(G)}, value);
  }`})();return{impl:()=>{let U=[],G=!1;return _.offsetToIndices&&(U.push(T),G=!0),_.indicesToOffset&&(U.push(z),G=!0),_.broadcastedIndicesToOffset&&(Object.values(F).forEach(Q=>U.push(Q)),G=!0),_.set&&(U.push(le),G=!0),_.setByIndices&&(U.push(V),G=!0),_.get&&(U.push(X),G=!0),_.getByIndices&&(U.push(Z),G=!0),!n&&G&&U.unshift(`const ${S} = ${g.indices}(${r.join(",")});`,`const ${x} = ${g.indices}(${O.computeStrides(r).join(",")});`),U.join(`
`)},type:g,offsetToIndices:k,indicesToOffset:A,broadcastedIndicesToOffset:j,indices:v,indicesGet:M,indicesSet:D,set:(...U)=>{if(U.length!==s+1)throw new Error(`indices length must be ${s}`);let G=U[s];if(typeof G!="string")throw new Error("value must be string");let Q=U.slice(0,s).map(y).join(",");return s===0?K("0u",G):s===1?K(Q[0],G):(_.set=!0,_.setByIndices=!0,_.indicesToOffset=!0,`set_${e}(${Q}, ${G})`)},setByOffset:K,setByIndices:(U,G)=>s<2?K(U,G):(_.setByIndices=!0,_.indicesToOffset=!0,`set_${e}ByIndices(${U}, ${G});`),get:te,getByOffset:R,getByIndices:fe,usage:i,name:e,strides:x,shape:S,rank:s}},N=(e,t,r,i=1)=>sr(e,t,r,"input",i),Y=(e,t,r,i=1)=>sr(e,t,r,"output",i),Ap=(e,t,r)=>sr(e,t,r,"atomicOutput",1),tn=(e,t,r,i=1)=>sr(e,t,r,"internal",i),Wo=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=Xt){let t=typeof e=="number"?e:e[0],r=typeof e=="number"?1:e[1],i=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||i>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*r*i>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let a=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,n=a?`@builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(local_invocation_id) local_id : vec3<u32>`:`@builtin(global_invocation_id) global_id : vec3<u32>,
                                             @builtin(local_invocation_id) local_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(num_workgroups) num_workgroups : vec3<u32>`,s=a?`let global_idx = global_id.x;
         let workgroup_index = workgroup_id.x;`:`let workgroup_index = workgroup_id.z * num_workgroups[0] * num_workgroups[1] +
             workgroup_id.y * num_workgroups[0] + workgroup_id.x;
         let global_idx = workgroup_index * ${t*r*i}u + local_idx;`;return`@compute @workgroup_size(${t}, ${r}, ${i})
  fn main(${n}) {
    ${s}
  `}appendVariableUniforms(e){e.rank!==0&&(e.shape.startsWith("uniforms.")&&this.uniforms.push({name:e.shape.replace("uniforms.",""),type:"u32",length:e.rank}),e.strides.startsWith("uniforms.")&&this.uniforms.push({name:e.strides.replace("uniforms.",""),type:"u32",length:e.rank}))}declareVariable(e,t){if(e.usage==="internal")throw new Error("cannot use internal variable with declareVariable(). use registerInternalVariables() instead.");this.variables.push(e),this.appendVariableUniforms(e);let r=e.usage==="input"?"read":"read_write",i=e.usage==="atomicOutput"?"atomic<i32>":e.type.storage;return`@group(0) @binding(${t}) var<storage, ${r}> ${e.name}: array<${i}>;`}declareVariables(...e){return e.map(t=>this.declareVariable(t,this.variableIndex++)).join(`
`)}registerInternalVariable(e){if(e.usage!=="internal")throw new Error("cannot use input or output variable with registerInternalVariable(). use declareVariables() instead.");this.internalVariables.push(e),this.appendVariableUniforms(e)}registerInternalVariables(...e){return e.forEach(t=>this.registerInternalVariable(t)),this}registerUniform(e,t,r=1){return this.uniforms.push({name:e,type:t,length:r}),this}registerUniforms(e){return this.uniforms=this.uniforms.concat(e),this}uniformDeclaration(){if(this.uniforms.length===0)return"";let e=[];for(let{name:t,type:r,length:i}of this.uniforms)if(i&&i>4)r==="f16"?e.push(`@align(16) ${t}:array<mat2x4<${r}>, ${Math.ceil(i/8)}>`):e.push(`${t}:array<vec4<${r}>, ${Math.ceil(i/4)}>`);else{let a=i==null||i===1?r:`vec${i}<${r}>`;e.push(`${t}:${a}`)}return`
      struct Uniforms { ${e.join(", ")} };
      @group(0) @binding(${this.variableIndex}) var<uniform> uniforms: Uniforms;`}get additionalImplementations(){return this.uniformDeclaration()+this.variables.map(e=>e.impl()).join(`
`)+this.internalVariables.map(e=>e.impl()).join(`
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},Op=(e,t)=>new Wo(e,t)}),Vo,Fi,Go,Ho,Fo,jo,Ve,Rp,Bp,St=P(()=>{re(),ae(),Se(),ne(),Vo=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},Fi=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),Go=(e,t)=>O.sortBasedOnPerm(e,Fi(e.length,t)),Ho=(e,t,r,i)=>{let a=`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`;for(let n=0;n<t;++n)a+=`a[${e[n]}]=i[${n}];`;return a+="return a;}"},Fo=(e,t)=>{let r=[],i=[];for(let a=0;a<e.length;++a)e[a]!==1&&r.push(e[a]),e[t[a]]!==1&&i.push(t[a]);return{newShape:r,newPerm:i}},jo=(e,t)=>{let r=0;for(let i=0;i<e.length;++i)if(t[e[i]]!==1){if(e[i]<r)return!1;r=e[i]}return!0},Ve=(e,t)=>{let r=e.dataType,i=e.dims.length,a=Fi(i,t),n=Go(e.dims,a),s=e.dims,u=n,l=i<2||jo(a,e.dims),p;if(l)return p=_=>{let b=N("input",r,s,4),S=Y("output",r,u,4);return`
  ${_.registerUniform("output_size","u32").declareVariables(b,S)}
  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let _=O.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(_/64/4)},programUniforms:[{type:12,data:Math.ceil(_/4)}]}},getShaderSource:p};let{newShape:c,newPerm:f}=Fo(e.dims,a),g=O.areEqual(f,[2,3,1]),y=O.areEqual(f,[3,1,2]);if(c.length===2||g||y){s=g?[c[0],c[1]*c[2]]:y?[c[0]*c[1],c[2]]:c,u=[s[1],s[0]];let _=16;return p=b=>{let S=N("a",r,s.length),x=Y("output",r,u.length);return`
  ${b.registerUniform("output_size","u32").declareVariables(S,x)}
  var<workgroup> tile : array<array<${x.type.value}, ${_+1}>, ${_}>;
  ${b.mainStart([_,_,1])}
    let stride = (uniforms.output_shape[1] - 1) / ${_} + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * ${_}u + local_id.x;
    let input_row = workgroup_id_x * ${_}u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${S.getByIndices(`${S.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * ${_}u + local_id.x;
    let output_row = workgroup_id_y * ${_}u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${x.setByIndices(`${x.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let b=O.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(u[1]/_),y:Math.ceil(u[0]/_)},programUniforms:[{type:12,data:b},...ee(s,u)]}},getShaderSource:p}}return p=_=>{let b=N("a",r,s.length),S=Y("output",r,u.length);return`
  ${_.registerUniform("output_size","u32").declareVariables(b,S)}

  ${Ho(a,i,b,S)}

  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${S.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${S.setByOffset("global_idx",b.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let _=O.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(_/64)},programUniforms:[{type:12,data:_},...ee(s,u)]}},getShaderSource:p}},Rp=(e,t)=>{Vo(e.inputs,t.perm),e.compute(Ve(e.inputs[0],t.perm))},Bp=e=>me({perm:e.perm})}),Ko,Zo,Xo,Qo,Yo,Jo,eu,tu,ru,iu,Ke,Np,Mp,Dp,Pp,Up,qp,Lp,Wp,Vp,Gp,py=P(()=>{re(),ae(),ne(),rn(),St(),Ko={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},Zo={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},Xo={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},Qo={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},Yo=(e,t)=>{let r=[];for(let i=t-e;i<t;++i)r.push(i);return r},Jo=(e,t)=>{let r=[],i=e.length;for(let n=0;n<i;n++)t.indexOf(n)===-1&&r.push(e[n]);let a=t.map(n=>e[n]);return[r,a]},eu=(e,t)=>{let r=e.length+t.length,i=[],a=0;for(let n=0;n<r;n++)t.indexOf(n)===-1?i.push(e[a++]):i.push(1);return i},tu=(e,t)=>{for(let r=0;r<e.length;++r)if(e[e.length-r-1]!==t-1-r)return!1;return!0},ru=(e,t)=>{let r=[];if(!tu(e,t)){for(let i=0;i<t;++i)e.indexOf(i)===-1&&r.push(i);e.forEach(i=>r.push(i))}return r},iu=(e,t,r,i,a,n,s)=>{let u=r[0].dims,l=O.size(n),p=O.size(s),c=N("_A",r[0].dataType,u),f=Y("output",a,n),g=64;l===1&&(g=256);let y=`
          var<workgroup> aBestValues : array<f32, ${g}>;
       `,_=b=>`
        ${b.registerUniform("reduceSize","u32").declareVariables(c,f)}
        ${y}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${b.mainStart(g)}

          let outputIndex = global_idx / ${g};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${Xo[i]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${g}) {
           let candidate = f32(${c.getByOffset("offset + k")});
           bestValue = ${Ko[i]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${g}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${Zo[i]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${f.setByOffset("outputIndex",`${i==="mean"?`${f.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${f.type.storage}(${Qo[i]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${g}`,inputDependencies:["type"]},getShaderSource:_,getRunData:()=>({outputs:[{dims:n,dataType:a}],dispatchGroup:{x:l},programUniforms:[{type:12,data:p}]})}},Ke=(e,t,r,i)=>{let a=e.inputs.length===1?r:Ea(e.inputs,r),n=a.axes;n.length===0&&!a.noopWithEmptyAxes&&(n=e.inputs[0].dims.map((y,_)=>_));let s=O.normalizeAxes(n,e.inputs[0].dims.length),u=s,l=e.inputs[0],p=ru(u,e.inputs[0].dims.length);p.length>0&&(l=e.compute(Ve(e.inputs[0],p),{inputs:[0],outputs:[-1]})[0],u=Yo(u.length,l.dims.length));let[c,f]=Jo(l.dims,u),g=c;a.keepDims&&(g=eu(c,s)),e.compute(iu(t,a.cacheKey,[l],i,e.inputs[0].dataType,g,f),{inputs:[l]})},Np=(e,t)=>{Ke(e,"ReduceMeanShared",t,"mean")},Mp=(e,t)=>{Ke(e,"ReduceL1Shared",t,"l1")},Dp=(e,t)=>{Ke(e,"ReduceL2Shared",t,"l2")},Pp=(e,t)=>{Ke(e,"ReduceLogSumExpShared",t,"logSumExp")},Up=(e,t)=>{Ke(e,"ReduceMaxShared",t,"max")},qp=(e,t)=>{Ke(e,"ReduceMinShared",t,"min")},Lp=(e,t)=>{Ke(e,"ReduceProdShared",t,"prod")},Wp=(e,t)=>{Ke(e,"ReduceSumShared",t,"sum")},Vp=(e,t)=>{Ke(e,"ReduceSumSquareShared",t,"sumSquare")},Gp=(e,t)=>{Ke(e,"ReduceLogSumShared",t,"logSum")}}),Ze,au,Yr,Ea,Xe,nu,su,ou,uu,lu,du,pu,cu,hu,fu,Qe,Hp,Fp,jp,Kp,Zp,Xp,Qp,Yp,Jp,ec,rn=P(()=>{re(),ae(),Se(),ne(),py(),Ze=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},au=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],Yr=(e,t,r,i,a,n,s=!1,u=!1)=>{let l=[],p=r[0].dims,c=p.length,f=O.normalizeAxes(a,c),g=!u&&f.length===0;p.forEach((b,S)=>{g||f.indexOf(S)>=0?s&&l.push(1):l.push(b)});let y=l.length,_=O.size(l);return{name:e,shaderCache:t,getShaderSource:b=>{let S=[],x=N("_A",r[0].dataType,c),$=Y("output",n,y),T=i(x,$,f),k=T[2];for(let C=0,z=0;C<c;C++)g||f.indexOf(C)>=0?(s&&z++,k=`for(var j${C}: u32 = 0; j${C} < ${p[C]}; j${C}++) {
                  ${T[2].includes("last_index")?`let last_index = j${C};`:""}
                  ${x.indicesSet("input_indices",C,`j${C}`)}
                  ${k}
                }`):(S.push(`${x.indicesSet("input_indices",C,$.indicesGet("output_indices",z))};`),z++);return`

        ${b.registerUniform("output_size","u32").declareVariables(x,$)}

        ${b.mainStart()}
          ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${x.type.indices};
          let output_indices = ${$.offsetToIndices("global_idx")};

          ${S.join(`
`)}
          ${T[0]}       // init ops for reduce max/min
          ${T[1]}
          ${k}
          ${T[3]}
          ${T.length===4?$.setByOffset("global_idx","value"):T.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:l,dataType:n}],dispatchGroup:{x:Math.ceil(_/64)},programUniforms:[{type:12,data:_},...ee(p,l)]})}},Ea=(e,t)=>{let r=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(i=>r.push(Number(i))),me({axes:r,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},Xe=(e,t,r,i)=>{let a=e.inputs,n=a.length===1?r:Ea(a,r);e.compute(Yr(t,{hint:n.cacheKey,inputDependencies:["rank"]},[a[0]],n.noopWithEmptyAxes&&n.axes.length===0?au:i,n.axes,a[0].dataType,n.keepDims,n.noopWithEmptyAxes),{inputs:[0]})},nu=(e,t)=>{Ze(e.inputs),Xe(e,"ReduceLogSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,"value = log(value);"])},su=(e,t)=>{Ze(e.inputs),Xe(e,"ReduceL1",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += abs(${r.getByIndices("input_indices")});`,""])},ou=(e,t)=>{Ze(e.inputs),Xe(e,"ReduceL2",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},uu=(e,t)=>{Ze(e.inputs),Xe(e,"ReduceLogSumExp",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += exp(${r.getByIndices("input_indices")});`,"value = log(value);"])},lu=(e,t)=>{Ze(e.inputs),Xe(e,"ReduceMax",t,(r,i,a)=>{let n=[];for(let s=0;s<r.rank;s++)(a.indexOf(s)>=0||a.length===0)&&n.push(r.indicesSet("input_indices",s,0));return[`${n.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = max(value, ${r.getByIndices("input_indices")});`,""]})},du=(e,t)=>{Ze(e.inputs),Xe(e,"ReduceMean",t,(r,i,a)=>{let n=1;for(let s=0;s<r.rank;s++)(a.indexOf(s)>=0||a.length===0)&&(n*=e.inputs[0].dims[s]);return["var sum = f32(0);","",`sum += f32(${r.getByIndices("input_indices")});`,`let value = ${i.type.value}(sum / ${n});`]})},pu=(e,t)=>{Ze(e.inputs),Xe(e,"ReduceMin",t,(r,i,a)=>{let n=[];for(let s=0;s<r.rank;s++)(a.indexOf(s)>=0||a.length===0)&&n.push(`input_indices[${s}] = 0;`);return[`${n.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = min(value, ${r.getByIndices("input_indices")});`,""]})},cu=(e,t)=>{Ze(e.inputs),Xe(e,"ReduceProd",t,(r,i)=>[`var value = ${i.type.storage}(1);`,"",`value *= ${r.getByIndices("input_indices")};`,""])},hu=(e,t)=>{Ze(e.inputs),Xe(e,"ReduceSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,""])},fu=(e,t)=>{Ze(e.inputs),Xe(e,"ReduceSumSquare",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += t * t;`,""])},Qe=(e,t,r)=>{if(t.length===0)return r;let i=1,a=1;for(let n=0;n<t.length;n++)t.indexOf(n)===-1?i*=e[n]:a*=e[n];return a<32&&i>1024},Hp=(e,t)=>{Qe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?du(e,t):Np(e,t)},Fp=(e,t)=>{Qe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?su(e,t):Mp(e,t)},jp=(e,t)=>{Qe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?ou(e,t):Dp(e,t)},Kp=(e,t)=>{Qe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?uu(e,t):Pp(e,t)},Zp=(e,t)=>{Qe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?lu(e,t):Up(e,t)},Xp=(e,t)=>{Qe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?pu(e,t):qp(e,t)},Qp=(e,t)=>{Qe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?cu(e,t):Lp(e,t)},Yp=(e,t)=>{Qe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?hu(e,t):Wp(e,t)},Jp=(e,t)=>{Qe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?fu(e,t):Vp(e,t)},ec=(e,t)=>{Qe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?nu(e,t):Gp(e,t)}}),ji,tc,rc,za,cy=P(()=>{re(),Se(),rn(),ji=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},tc=(e,t)=>{ji(e.inputs);let r=(i,a,n)=>{let s=[];for(let u=0;u<i.rank;u++)(n.indexOf(u)>=0||n.length===0)&&s.push(`input_indices[${u}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",a.setByOffset("global_idx","best_index")]};e.compute(Yr("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},rc=(e,t)=>{ji(e.inputs);let r=(i,a,n)=>{let s=[];for(let u=0;u<i.rank;u++)(n.indexOf(u)>=0||n.length===0)&&s.push(`input_indices[${u}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",a.setByOffset("global_idx","best_index")]};e.compute(Yr("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},za=e=>me(e)}),mu,Ur,gu,yu,_u,br,bu,ic,an=P(()=>{re(),ae(),en(),ne(),mu=(e,t)=>{let r=e[0],i=e[1],a=e[2],n=e[3],s=e[4],u=e[5];if(s&&u)throw new Error("Attention cannot have both past and attention_bias");if(r.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let l=r.dims[0],p=r.dims[1],c=r.dims[2];if(a.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(i.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(i.dims[0]!==c)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(a.dims[0]!==i.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let f=a.dims[0]/3,g=f,y=g;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let T of t.qkvHiddenSizes)if(T%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");f=t.qkvHiddenSizes[0],g=t.qkvHiddenSizes[1],y=t.qkvHiddenSizes[2]}let _=p;if(f!==g)throw new Error("qkv_hidden_sizes first element should be same as the second");if(a.dims[0]!==f+g+y)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let b=0;if(s){if(g!==y)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(s.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(s.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(s.dims[1]!==l)throw new Error('Input "past" second dimension must be batch_size');if(s.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(s.dims[4]!==g/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(b=s.dims[3])}let S=_+b,x=-1,$=0;if(n)throw new Error("Mask not supported");if(s)throw new Error("past is not supported");if(u){if(u.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(u.dims[0]!==l||u.dims[1]!==t.numHeads||u.dims[2]!==p||u.dims[3]!==S)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:l,sequenceLength:p,pastSequenceLength:b,kvSequenceLength:_,totalSequenceLength:S,maxSequenceLength:x,inputHiddenSize:c,hiddenSize:f,vHiddenSize:y,headSize:Math.floor(f/t.numHeads),vHeadSize:Math.floor(y/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:$,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},Ur=(e,t,r)=>t&&e?`
      let total_sequence_length_input = u32(${t.getByOffset("0")});
      let present_sequence_length = max(total_sequence_length_input, uniforms.past_sequence_length);
      let is_subsequent_prompt: bool = sequence_length > 1 && sequence_length != total_sequence_length_input;
      let is_first_prompt: bool = is_subsequent_prompt == false && sequence_length == total_sequence_length_input;
      total_sequence_length = u32(${e==null?void 0:e.getByOffset("batchIdx")}) + 1;
      var past_sequence_length: u32 = 0;
      if (is_first_prompt == false) {
        past_sequence_length = total_sequence_length - sequence_length;
      }
       `:`
    ${r?"let past_sequence_length = uniforms.past_sequence_length":""};
    let present_sequence_length = total_sequence_length;
    `,gu=(e,t,r,i,a,n,s,u)=>{let l=xe(s?1:n),p=64,c=n/l;c<p&&(p=32);let f=Math.ceil(n/l/p),g=[{type:12,data:t},{type:12,data:r},{type:12,data:i},{type:12,data:a},{type:12,data:c},{type:12,data:f}],y=Ce(e.dataType,l),_=Ae(1,l),b=["type"];s&&b.push("type"),u&&b.push("type");let S=x=>{let $=Y("x",e.dataType,e.dims,l),T=[$],k=s?N("seq_lens",s.dataType,s.dims):void 0;k&&T.push(k);let C=u?N("total_sequence_length_input",u.dataType,u.dims):void 0;C&&T.push(C);let z=Ae(e.dataType),A=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${p}>;
  var<workgroup> thread_sum: array<f32, ${p}>;
  ${x.registerUniforms(A).declareVariables(...T)}
  ${x.mainStart([p,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${Ur(k,C,!1)}
    let local_offset = local_idx * uniforms.elements_per_thread;
    let offset = (global_idx / ${p}) * uniforms.total_sequence_length + local_offset;
    let seq_causal_length = ${s?"u32(past_sequence_length + workgroup_id.y + 1)":"total_sequence_length"};
    var thread_max_vector = ${_}(-3.4028234663852886e+38f);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      thread_max_vector = max(${_}(x[offset + i]), thread_max_vector);
    }
    thread_max[local_idx] = ${(()=>{switch(l){case 1:return"thread_max_vector";case 2:return"max(thread_max_vector.x, thread_max_vector.y)";case 4:return"max(max(thread_max_vector.x, thread_max_vector.y), max(thread_max_vector.z, thread_max_vector.w))";default:throw new Error(`Unsupported components: ${l}`)}})()};
    workgroupBarrier();

    var max_value =  f32(-3.4028234663852886e+38f);
    for (var i = 0u; i < ${p}; i++) {
      max_value = max(thread_max[i], max_value);
    }

    var sum_vector = ${_}(0);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      sum_vector += exp(${_}(x[offset + i]) - max_value);
    }
    thread_sum[local_idx] = ${(()=>{switch(l){case 1:return"sum_vector";case 2:return"sum_vector.x + sum_vector.y";case 4:return"sum_vector.x + sum_vector.y + sum_vector.z + sum_vector.w";default:throw new Error(`Unsupported components: ${l}`)}})()};
    workgroupBarrier();

    var sum: f32 = 0;
    for (var i = 0u; i < ${p}; i++) {
      sum += thread_sum[i];
    }

    if (sum == 0) {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        x[offset + i] = ${$.type.value}(${z}(1.0) / ${z}(seq_causal_length));
      }
    } else {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        var f32input = ${_}(x[offset + i]);
        x[offset + i] = ${$.type.value}(exp(f32input - max_value) / sum);
      }
    }
      ${s?`
        for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
          x[offset + total_seq_id] = ${$.type.value}(${z}(0));
        }`:""};
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${p};${y};${l}`,inputDependencies:b},getShaderSource:S,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:a,z:t*r},programUniforms:g})}},yu=(e,t,r,i,a,n,s,u,l)=>{let p=s+n.kvSequenceLength,c=[n.batchSize,n.numHeads,n.sequenceLength,p],f=e>1&&i,g=n.kvNumHeads?n.kvNumHeads:n.numHeads,y=f?[n.batchSize,g,p,n.headSize]:void 0,_=n.nReps?n.nReps:1,b=n.scale===0?1/Math.sqrt(n.headSize):n.scale,S=xe(n.headSize),x=n.headSize/S,$=12,T={x:Math.ceil(p/$),y:Math.ceil(n.sequenceLength/$),z:n.batchSize*n.numHeads},k=[{type:12,data:n.sequenceLength},{type:12,data:x},{type:12,data:p},{type:12,data:n.numHeads},{type:12,data:n.headSize},{type:1,data:b},{type:12,data:s},{type:12,data:n.kvSequenceLength},{type:12,data:_}],C=f&&i&&O.size(i.dims)>0,z=["type","type"];C&&z.push("type"),a&&z.push("type"),u&&z.push("type"),l&&z.push("type");let A=[{dims:c,dataType:t.dataType,gpuDataType:0}];f&&A.push({dims:y,dataType:t.dataType,gpuDataType:0});let v=M=>{let D=N("q",t.dataType,t.dims,S),F=N("key",r.dataType,r.dims,S),j=[D,F];if(C){let V=N("past_key",i.dataType,i.dims,S);j.push(V)}a&&j.push(N("attention_bias",a.dataType,a.dims));let K=u?N("seq_lens",u.dataType,u.dims):void 0;K&&j.push(K);let R=l?N("total_sequence_length_input",l.dataType,l.dims):void 0;R&&j.push(R);let Z=Y("output",t.dataType,c),X=[Z];f&&X.push(Y("present_key",t.dataType,y,S));let te=Ae(1,S),fe=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${$}u;

  var<workgroup> tileQ: array<${D.type.storage}, ${$*$}>;
  var<workgroup> tileK: array<${D.type.storage}, ${$*$}>;
  ${M.registerUniforms(fe).declareVariables(...j,...X)}
  ${M.mainStart([$,$,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${_===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${_===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${Ur(K,R,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${C&&f?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${f?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${te}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${C&&f?`
              if (n + local_id.y < past_sequence_length) {
                tileK[idx] = past_key[pastKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
              } else if (n + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
                tileK[idx] = key[kOffset + (n + local_id.y - past_sequence_length) * uniforms.K + w + local_id.x];
              }`:`
          if (n + local_id.y < uniforms.kv_sequence_length) {
            tileK[idx] = key[kOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
          }`}
      ${f?`if (n + local_id.y < present_sequence_length) {
        present_key[presentKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x] = tileK[idx];
      }`:""}
      }
      workgroupBarrier();

      for (var k: u32 = 0u; k < TILE_SIZE && w+k < uniforms.K; k++) {
          value += ${te}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch(S){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${S}`)}})()};
        output[outputIdx] = ${Z.type.value} (sum * uniforms.alpha) + ${a?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${S};${a!==void 0};${i!==void 0};${e}`,inputDependencies:z},getRunData:()=>({outputs:A,dispatchGroup:T,programUniforms:k}),getShaderSource:v}},_u=(e,t,r,i,a,n,s=void 0,u=void 0)=>{let l=n+a.kvSequenceLength,p=a.nReps?a.nReps:1,c=a.vHiddenSize*p,f=e>1&&i,g=a.kvNumHeads?a.kvNumHeads:a.numHeads,y=f?[a.batchSize,g,l,a.headSize]:void 0,_=[a.batchSize,a.sequenceLength,c],b=12,S={x:Math.ceil(a.vHeadSize/b),y:Math.ceil(a.sequenceLength/b),z:a.batchSize*a.numHeads},x=[{type:12,data:a.sequenceLength},{type:12,data:l},{type:12,data:a.vHeadSize},{type:12,data:a.numHeads},{type:12,data:a.headSize},{type:12,data:c},{type:12,data:n},{type:12,data:a.kvSequenceLength},{type:12,data:p}],$=f&&i&&O.size(i.dims)>0,T=["type","type"];$&&T.push("type"),s&&T.push("type"),u&&T.push("type");let k=[{dims:_,dataType:t.dataType,gpuDataType:0}];f&&k.push({dims:y,dataType:t.dataType,gpuDataType:0});let C=z=>{let A=N("probs",t.dataType,t.dims),v=N("v",r.dataType,r.dims),M=[A,v];$&&M.push(N("past_value",i.dataType,i.dims));let D=s?N("seq_lens",s.dataType,s.dims):void 0;s&&M.push(D);let F=u?N("total_sequence_length_input",u.dataType,u.dims):void 0;u&&M.push(F);let j=[Y("output",t.dataType,_)];f&&j.push(Y("present_value",t.dataType,y));let K=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${b}u;
  var<workgroup> tileQ: array<${A.type.value}, ${b*b}>;
  var<workgroup> tileV: array<${A.type.value}, ${b*b}>;
  ${z.registerUniforms(K).declareVariables(...M,...j)}
  ${z.mainStart([b,b,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${p===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${p===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${Ur(D,F,!0)}
   let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
   let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
   ${$&&f?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${f?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${A.type.storage}(0);
   for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
        ${$&&f?`
        if (w + local_id.y < past_sequence_length) {
          tileV[idx] = past_value[pastValueOffset + (w + local_id.y) * uniforms.N];
        } else if (w + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
          tileV[idx] = v[vOffset + (w + local_id.y - past_sequence_length) * uniforms.N];
        }
      `:`
            if (w + local_id.y < uniforms.kv_sequence_length) {
              tileV[idx] = v[vOffset + (w + local_id.y) * uniforms.N];
            }`}
        ${f?`
            if (w + local_id.y < present_sequence_length) {
          present_value[presentValueOffset + (w + local_id.y) * uniforms.N] = tileV[idx];
        }`:""}
      }
     workgroupBarrier();
     for (var k: u32 = 0u; k < TILE_SIZE && w+k < total_sequence_length; k++) {
       value += tileQ[TILE_SIZE * local_id.y + k] * tileV[TILE_SIZE * k + local_id.x];
     }
     workgroupBarrier();
   }

   // we need to transpose output from BNSH_v to BSND_v
   if (m < uniforms.M && n < uniforms.N) {
     let outputIdx = batchIdx * uniforms.M * uniforms.v_hidden_size + m * uniforms.v_hidden_size
       + headIdx * uniforms.N + n;
     output[outputIdx] = value;
   }
  }`};return{name:"AttentionScore",shaderCache:{hint:`${i!==void 0};${e}`,inputDependencies:T},getRunData:()=>({outputs:k,dispatchGroup:S,programUniforms:x}),getShaderSource:C}},br=(e,t,r,i,a,n,s,u,l,p,c=void 0,f=void 0)=>{let g=Math.min(e.outputCount,1+(s?1:0)+(u?1:0)),y=g>1?s:void 0,_=g>1?u:void 0,b=g>1?p.pastSequenceLength:0,S=b+p.kvSequenceLength,x=l&&O.size(l.dims)>0?l:void 0,$=[t,r];y&&O.size(y.dims)>0&&$.push(y),x&&$.push(x),c&&$.push(c),f&&$.push(f);let T=e.compute(yu(g,t,r,y,x,p,b,c,f),{inputs:$,outputs:g>1?[-1,1]:[-1]})[0];e.compute(gu(T,p.batchSize,p.numHeads,b,p.sequenceLength,S,c,f),{inputs:c&&f?[T,c,f]:[T],outputs:[]});let k=[T,i];_&&O.size(_.dims)>0&&k.push(_),c&&k.push(c),f&&k.push(f),e.compute(_u(g,T,i,_,p,b,c,f),{inputs:k,outputs:g>1?[0,2]:[0]})},bu=(e,t)=>{let r=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],i=t.sequenceLength,a=t.inputHiddenSize,n=t.headSize,s=12,u={x:Math.ceil(t.headSize/s),y:Math.ceil(t.sequenceLength/s),z:t.batchSize*t.numHeads},l=[e.inputs[0],e.inputs[1],e.inputs[2]],p=[{type:12,data:i},{type:12,data:a},{type:12,data:n},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],c=f=>{let g=Y("output_q",l[0].dataType,r),y=Y("output_k",l[0].dataType,r),_=Y("output_v",l[0].dataType,r),b=N("input",l[0].dataType,l[0].dims),S=N("weight",l[1].dataType,l[1].dims),x=N("bias",l[2].dataType,l[2].dims),$=b.type.storage,T=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${s}u;
  var<workgroup> tileInput: array<${$}, ${s*s}>;
  var<workgroup> tileWeightQ: array<${$}, ${s*s}>;
  var<workgroup> tileWeightK: array<${$}, ${s*s}>;
  var<workgroup> tileWeightV: array<${$}, ${s*s}>;
  ${f.registerUniforms(T).declareVariables(b,S,x,g,y,_)}
  ${f.mainStart([s,s,1])}
    let batchIndex = workgroup_id.z / uniforms.num_heads;
    let headNumber = workgroup_id.z % uniforms.num_heads;
    let m = global_id.y;
    let n = global_id.x;

    let inputOffset = batchIndex * (uniforms.M * uniforms.K) + m * uniforms.K;
    let biasOffsetQ = headNumber * uniforms.head_size;
    let biasOffsetK = uniforms.hidden_size + biasOffsetQ;
    let biasOffsetV = uniforms.hidden_size + biasOffsetK;

    var valueQ = ${$}(0);
    var valueK = ${$}(0);
    var valueV = ${$}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileInput[TILE_SIZE * local_id.y + local_id.x] = input[inputOffset + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        let offset = n + (w + local_id.y) * uniforms.ldb;
        tileWeightQ[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetQ + offset];
        tileWeightK[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetK + offset];
        tileWeightV[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetV + offset];
      }
      workgroupBarrier();
      for (var k: u32 = 0u; k<TILE_SIZE && w+k < uniforms.K; k++) {
        let inputTileOffset = TILE_SIZE * local_id.y + k;
        let weightTileOffset = TILE_SIZE * k + local_id.x;
        valueQ += tileInput[inputTileOffset] * tileWeightQ[weightTileOffset];
        valueK += tileInput[inputTileOffset] * tileWeightK[weightTileOffset];
        valueV += tileInput[inputTileOffset] * tileWeightV[weightTileOffset];
      }

      workgroupBarrier();
    }

    let headOffset = (m * uniforms.N + n) % uniforms.head_size;
    valueQ += bias[headOffset + biasOffsetQ];
    valueK += bias[headOffset + biasOffsetK];
    valueV += bias[headOffset + biasOffsetV];

    let offset = workgroup_id.z * uniforms.M * uniforms.N;
    if (m < uniforms.M && n < uniforms.N) {
      let outputIdx = offset + m * uniforms.N + n;
      output_q[outputIdx] = valueQ;
      output_k[outputIdx] = valueK;
      output_v[outputIdx] = valueV;
    }
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:u,programUniforms:p}),getShaderSource:c},{inputs:l,outputs:[-1,-1,-1]})},ic=(e,t)=>{let r=mu(e.inputs,t),[i,a,n]=bu(e,r);return br(e,i,a,n,e.inputs[4],void 0,void 0,void 0,e.inputs[5],r)}}),$u,wu,vu,ac,hy=P(()=>{Fe(),re(),ae(),Se(),ne(),$u=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let r=(i,a,n)=>{let s=a.length;if(s!==i.length)throw new Error(`${n}: num dimensions != ${s}`);a.forEach((u,l)=>{if(u!==i[l])throw new Error(`${n}: dim[${l}] do not match`)})};if(e[0].dims.length>1){let i=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);r(e[1].dims,i,"Invalid input scale"),r(e[2].dims,i,"Invalid input B"),r(e[3].dims,i,"Invalid input mean"),r(e[4].dims,i,"Invalid input var")}else r(e[1].dims,[1],"Invalid input scale"),r(e[2].dims,[1],"Invalid input B"),r(e[3].dims,[1],"Invalid input mean"),r(e[4].dims,[1],"Invalid input var")},wu=(e,t)=>{let{epsilon:r,spatial:i,format:a}=t,n=e[0].dims,s=i?xe(n[n.length-1]):1,u=a==="NHWC"&&n.length>1?s:1,l=O.size(n)/s,p=i,c=p?n.length:n,f=N("x",e[0].dataType,e[0].dims,s),g=N("scale",e[1].dataType,e[1].dims,u),y=N("bias",e[2].dataType,e[2].dims,u),_=N("inputMean",e[3].dataType,e[3].dims,u),b=N("inputVar",e[4].dataType,e[4].dims,u),S=Y("y",e[0].dataType,c,s),x=()=>{let T="";if(i)T=`let cOffset = ${n.length===1?"0u":a==="NHWC"?`outputIndices[${n.length-1}] / ${s}`:"outputIndices[1]"};`;else if(a==="NCHW")T=`
            ${S.indicesSet("outputIndices","0","0")}
            let cOffset = ${S.indicesToOffset("outputIndices")};`;else{T=`var cIndices = ${g.type.indices}(0);
                       cIndices[0] = outputIndices[${n.length-1}];`;for(let k=1;k<g.rank;k++)T+=`cIndices[${k}] = outputIndices[${k}];`;T+=`let cOffset = ${g.indicesToOffset("cIndices")};`}return T},$=T=>`
  const epsilon = ${r};
  ${T.registerUniform("outputSize","u32").declareVariables(f,g,y,_,b,S)}
  ${T.mainStart()}
  ${T.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${S.offsetToIndices(`global_idx * ${s}`)};
    ${x()}
    let scale = ${g.getByOffset("cOffset")};
    let bias = ${y.getByOffset("cOffset")};
    let inputMean = ${_.getByOffset("cOffset")};
    let inputVar = ${b.getByOffset("cOffset")};
    let x = ${f.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${S.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${i}_${s}`,inputDependencies:p?["rank","type","type","type","type"]:void 0},getShaderSource:$,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:p?[{type:12,data:l},...ee(n)]:[{type:12,data:l}]})}},vu=e=>me(e),ac=(e,t)=>{let{inputs:r,outputCount:i}=e,a=vu({...t,outputCount:i});if(be.webgpu.validateInputContent&&$u(r,a),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(wu(r,a))}}),xu,Su,nc,fy=P(()=>{ae(),ne(),xu=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Su=e=>{let t=e[0].dims,r=e[0].dims[2],i=O.size(t)/4,a=e[0].dataType,n=N("input",a,t,4),s=N("bias",a,[r],4),u=N("residual",a,t,4),l=Y("output",a,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)}}),getShaderSource:p=>`
  const channels = ${r}u / 4;
  ${p.declareVariables(n,s,u,l)}

  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes(i)}
    let value = ${n.getByOffset("global_idx")}
      + ${s.getByOffset("global_idx % channels")} + ${u.getByOffset("global_idx")};
    ${l.setByOffset("global_idx","value")}
  }`}},nc=e=>{xu(e.inputs),e.compute(Su(e.inputs))}}),ku,he,sc,oc,uc,lc,dc,pc,cc,hc,fc,Iu,mc,gc,yc,_c,mr,bc,jr,$c,wc,vc,xc,Sc,kc,Ic,Tc,Cc,Ec,zc,Ac,Oc,Rc,Bc,Nc,Ki,Mc,Aa,Oa,Dc,Pc,Uc,Tu,Cu,qc,nn=P(()=>{re(),ae(),Se(),ne(),ku=(e,t,r,i,a,n,s)=>{let u=Math.ceil(t/4),l="";typeof a=="string"?l=`${a}(a)`:l=a("a");let p=N("inputData",r,[u],4),c=Y("outputData",i,[u],4),f=[{name:"vec_size",type:"u32"}];return s&&f.push(...s),`
      ${e.registerUniforms(f).declareVariables(p,c)}

  ${n??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${p.getByOffset("global_idx")};
    ${c.setByOffset("global_idx",l)}
  }`},he=(e,t,r,i,a,n=e.dataType,s,u)=>{let l=[{type:12,data:Math.ceil(O.size(e.dims)/4)}];return s&&l.push(...s),{name:t,shaderCache:{hint:a,inputDependencies:["type"]},getShaderSource:p=>ku(p,O.size(e.dims),e.dataType,n,r,i,u),getRunData:p=>({outputs:[{dims:e.dims,dataType:n}],dispatchGroup:{x:Math.ceil(O.size(p[0].dims)/64/4)},programUniforms:l})}},sc=e=>{e.compute(he(e.inputs[0],"Abs","abs"))},oc=e=>{e.compute(he(e.inputs[0],"Acos","acos"))},uc=e=>{e.compute(he(e.inputs[0],"Acosh","acosh"))},lc=e=>{e.compute(he(e.inputs[0],"Asin","asin"))},dc=e=>{e.compute(he(e.inputs[0],"Asinh","asinh"))},pc=e=>{e.compute(he(e.inputs[0],"Atan","atan"))},cc=e=>{e.compute(he(e.inputs[0],"Atanh","atanh"))},hc=e=>me(e),fc=(e,t)=>{let r;switch(t.to){case 10:r="vec4<f16>";break;case 1:r="vec4<f32>";break;case 12:r="vec4<u32>";break;case 6:r="vec4<i32>";break;case 9:r="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(he(e.inputs[0],"Cast",r,void 0,t.cacheKey,t.to))},Iu=e=>{let t,r,i=e.length>=2&&e[1].data!==0,a=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=i?e[1].getFloat32Array()[0]:-34028234663852886e22,r=a?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=i?e[1].getUint16Array()[0]:64511,r=a?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return me({min:t,max:r})},mc=(e,t)=>{let r=t||Iu(e.inputs),i=Ae(e.inputs[0].dataType);e.compute(he(e.inputs[0],"Clip",a=>`clamp(${a}, vec4<${i}>(uniforms.min), vec4<${i}>(uniforms.max))`,void 0,r.cacheKey,void 0,[{type:e.inputs[0].dataType,data:r.min},{type:e.inputs[0].dataType,data:r.max}],[{name:"min",type:i},{name:"max",type:i}]),{inputs:[0]})},gc=e=>{e.compute(he(e.inputs[0],"Ceil","ceil"))},yc=e=>{e.compute(he(e.inputs[0],"Cos","cos"))},_c=e=>{e.compute(he(e.inputs[0],"Cosh","cosh"))},mr=e=>me(e),bc=(e,t)=>{let r=Ae(e.inputs[0].dataType);e.compute(he(e.inputs[0],"Elu",i=>`elu_vf32(${i})`,`
  const elu_alpha_ = ${r}(${t.alpha});

  fn elu_f32(a: ${r}) -> ${r} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${r}>) -> vec4<${r}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},jr=(e="f32")=>`
const r0: ${e} = 0.3275911;
const r1: ${e} = 0.254829592;
const r2: ${e} = -0.284496736;
const r3: ${e} = 1.421413741;
const r4: ${e} = -1.453152027;
const r5: ${e} = 1.061405429;

fn erf_vf32(v: vec4<${e}>) -> vec4<${e}> {
  let absv = abs(v);
  let x = 1.0 / (1.0 + r0 * absv);
  return sign(v) * (1.0 - ((((r5 * x + r4) * x + r3) * x + r2) * x + r1) * x * exp(-absv * absv));
}`,$c=e=>{let t=Ae(e.inputs[0].dataType);e.compute(he(e.inputs[0],"Erf",r=>`erf_vf32(${r})`,jr(t)))},wc=e=>{e.compute(he(e.inputs[0],"Exp","exp"))},vc=e=>{e.compute(he(e.inputs[0],"Floor","floor"))},xc=e=>{let t=Ae(e.inputs[0].dataType);e.compute(he(e.inputs[0],"Gelu",r=>`0.5 * ${r} * (1.0 + erf_vf32(${r} * 0.7071067811865475))`,jr(t)))},Sc=(e,t)=>{let r=Ae(e.inputs[0].dataType);e.compute(he(e.inputs[0],"LeakyRelu",i=>`select(leaky_relu_alpha_ * ${i}, ${i}, ${i} >= vec4<${r}>(0.0))`,`const leaky_relu_alpha_ = ${r}(${t.alpha});`,t.cacheKey))},kc=e=>{e.compute(he(e.inputs[0],"Not",t=>`!${t}`))},Ic=e=>{e.compute(he(e.inputs[0],"Neg",t=>`-${t}`))},Tc=e=>{e.compute(he(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},Cc=e=>{let t=Ae(e.inputs[0].dataType);e.compute(he(e.inputs[0],"Relu",r=>`select(vec4<${t}>(0.0), ${r}, ${r} > vec4<${t}>(0.0))`))},Ec=e=>{e.compute(he(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},zc=e=>me(e),Ac=(e,t)=>{let r=Ae(e.inputs[0].dataType);e.compute(he(e.inputs[0],"HardSigmoid",i=>`max(vec4<${r}>(0.0), min(vec4<${r}>(1.0), ${t.alpha} * ${i} + vec4<${r}>(${t.beta})))`,void 0,t.cacheKey))},Oc=e=>{e.compute(he(e.inputs[0],"Sin","sin"))},Rc=e=>{e.compute(he(e.inputs[0],"Sinh","sinh"))},Bc=e=>{e.compute(he(e.inputs[0],"Sqrt","sqrt"))},Nc=e=>{e.compute(he(e.inputs[0],"Tan","tan"))},Ki=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,Mc=e=>{e.compute(he(e.inputs[0],"Tanh",Ki))},Aa=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${Ki("v")};
}
`,Oa=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,Dc=e=>{let t=Ae(e.inputs[0].dataType);e.compute(he(e.inputs[0],"FastGelu",Oa,Aa(t),void 0,e.inputs[0].dataType))},Pc=(e,t)=>{let r=Ae(e.inputs[0].dataType);return e.compute(he(e.inputs[0],"ThresholdedRelu",i=>`select(vec4<${r}>(0.0), ${i}, ${i} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${r}>(${t.alpha});`,t.cacheKey)),0},Uc=e=>{e.compute(he(e.inputs[0],"Log","log"))},Tu=(e,t)=>`
const alpha = vec4<${e}>(${t});
const one = ${e}(1.0);
const zero = ${e}(0.0);

fn quick_gelu_impl(x: vec4<${e}>) -> vec4<${e}> {
  let v = x *alpha;
  var x1 : vec4<${e}>;
  for (var i = 0; i < 4; i = i + 1) {
    if (v[i] >= zero) {
      x1[i] = one / (one + exp(-v[i]));
    } else {
      x1[i] = one - one / (one + exp(v[i]));
    }
  }
  return x * x1;
}
`,Cu=e=>`quick_gelu_impl(${e})`,qc=(e,t)=>{let r=Ae(e.inputs[0].dataType);e.compute(he(e.inputs[0],"QuickGelu",Cu,Tu(r,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),Eu,zu,Lc,my=P(()=>{ae(),ne(),nn(),Eu=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},zu=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let r=N("input",e[0].dataType,e[0].dims,4),i=N("bias",e[0].dataType,[e[0].dims[2]],4),a=Y("output",e[0].dataType,t,4),n=O.size(t)/4,s=Ce(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)}}),getShaderSource:u=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${u.declareVariables(r,i,a)}

  ${jr(s)}

  ${u.mainStart()}
    ${u.guardAgainstOutOfBoundsWorkgroupSizes(n)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${a.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},Lc=e=>{Eu(e.inputs),e.compute(zu(e.inputs))}}),Au,Ou,Ye,Wc,Vc,Gc,Hc,Fc,jc,Kc,Zc,Xc,Qc,gy=P(()=>{re(),ae(),ne(),Au=(e,t,r,i,a,n,s,u,l,p,c,f)=>{let g,y;typeof u=="string"?g=y=($,T)=>`${u}((${$}),(${T}))`:typeof u=="function"?g=y=u:(g=u.scalar,y=u.vector);let _=Y("outputData",c,i.length,4),b=N("aData",l,t.length,4),S=N("bData",p,r.length,4),x;if(a)if(n){let $=O.size(t)===1,T=O.size(r)===1,k=t.length>0&&t[t.length-1]%4===0,C=r.length>0&&r[r.length-1]%4===0;$||T?x=_.setByOffset("global_idx",y($?`${b.type.value}(${b.getByOffset("0")}.x)`:b.getByOffset("global_idx"),T?`${S.type.value}(${S.getByOffset("0")}.x)`:S.getByOffset("global_idx"))):x=`
            let outputIndices = ${_.offsetToIndices("global_idx * 4u")};
            let offsetA = ${b.broadcastedIndicesToOffset("outputIndices",_)};
            let offsetB = ${S.broadcastedIndicesToOffset("outputIndices",_)};
            ${_.setByOffset("global_idx",y(s||k?b.getByOffset("offsetA / 4u"):`${b.type.value}(${b.getByOffset("offsetA / 4u")}[offsetA % 4u])`,s||C?S.getByOffset("offsetB / 4u"):`${S.type.value}(${S.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else x=_.setByOffset("global_idx",y(b.getByOffset("global_idx"),S.getByOffset("global_idx")));else{if(!n)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let $=(T,k,C="")=>{let z=`aData[indexA${k}][componentA${k}]`,A=`bData[indexB${k}][componentB${k}]`;return`
            let outputIndices${k} = ${_.offsetToIndices(`global_idx * 4u + ${k}u`)};
            let offsetA${k} = ${b.broadcastedIndicesToOffset(`outputIndices${k}`,_)};
            let offsetB${k} = ${S.broadcastedIndicesToOffset(`outputIndices${k}`,_)};
            let indexA${k} = offsetA${k} / 4u;
            let indexB${k} = offsetB${k} / 4u;
            let componentA${k} = offsetA${k} % 4u;
            let componentB${k} = offsetB${k} % 4u;
            ${T}[${k}] = ${C}(${g(z,A)});
          `};c===9?x=`
            var data = vec4<u32>(0);
            ${$("data",0,"u32")}
            ${$("data",1,"u32")}
            ${$("data",2,"u32")}
            ${$("data",3,"u32")}
            outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:x=`
            ${$("outputData[global_idx]",0)}
            ${$("outputData[global_idx]",1)}
            ${$("outputData[global_idx]",2)}
            ${$("outputData[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(b,S,_)}

        ${f??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${x}
      }`},Ou=(e,t,r,i,a,n,s=r.dataType)=>{let u=r.dims.map(Number),l=i.dims.map(Number),p=!O.areEqual(u,l),c=u,f=O.size(u),g=!1,y=!1,_=[p];if(p){let b=Zt.calcShape(u,l,!1);if(!b)throw new Error("Can't perform binary op on the given tensors");c=b.slice(),f=O.size(c);let S=O.size(u)===1,x=O.size(l)===1,$=u.length>0&&u[u.length-1]%4===0,T=l.length>0&&l[l.length-1]%4===0;_.push(S),_.push(x),_.push($),_.push(T);let k=1;for(let C=1;C<c.length;C++){let z=u[u.length-C],A=l[l.length-C];if(z===A)k*=z;else break}k%4===0?(y=!0,g=!0):(S||x||$||T)&&(g=!0)}else g=!0;return _.push(g),{name:e,shaderCache:{hint:t+_.map(b=>b.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:b=>Au(b,u,l,c,g,p,y,a,r.dataType,i.dataType,s,n),getRunData:()=>({outputs:[{dims:c,dataType:s}],dispatchGroup:{x:Math.ceil(f/64/4)},programUniforms:[{type:12,data:Math.ceil(O.size(c)/4)},...ee(u,l,c)]})}},Ye=(e,t,r,i,a,n)=>{e.compute(Ou(t,a??"",e.inputs[0],e.inputs[1],r,i,n))},Wc=e=>{Ye(e,"Add",(t,r)=>`${t}+${r}`)},Vc=e=>{Ye(e,"Div",(t,r)=>`${t}/${r}`)},Gc=e=>{Ye(e,"Equal",{scalar:(t,r)=>`u32(${t}==${r})`,vector:(t,r)=>`vec4<u32>(${t}==${r})`},void 0,void 0,9)},Hc=e=>{Ye(e,"Mul",(t,r)=>`${t}*${r}`)},Fc=e=>{let t=N("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;Ye(e,"Pow",{scalar:(r,i)=>`pow_custom(${r},${i})`,vector:(r,i)=>`pow_vector_custom(${r},${i})`},`
    fn pow_custom(a : ${t}, b : ${t}) -> ${t} {
      if (b == ${t}(0.0)) {
        return ${t}(1.0);
      } else if (a < ${t}(0.0) && f32(b) != floor(f32(b))) {
        return ${t}(pow(f32(a), f32(b))); // NaN
      }
      return select(sign(a), ${t}(1.0), round(f32(abs(b) % ${t}(2.0))) != 1.0) * ${t}(${t==="i32"?"round":""}(pow(f32(abs(a)), f32(b))));
    }
    fn pow_vector_custom(a : vec4<${t}>, b : vec4<${t}>) -> vec4<${t}> {
      // TODO: implement vectorized pow
      return vec4<${t}>(pow_custom(a.x, b.x), pow_custom(a.y, b.y), pow_custom(a.z, b.z), pow_custom(a.w, b.w));
    }
      `)},jc=e=>{Ye(e,"Sub",(t,r)=>`${t}-${r}`)},Kc=e=>{Ye(e,"Greater",{scalar:(t,r)=>`u32(${t}>${r})`,vector:(t,r)=>`vec4<u32>(${t}>${r})`},void 0,void 0,9)},Zc=e=>{Ye(e,"Less",{scalar:(t,r)=>`u32(${t}<${r})`,vector:(t,r)=>`vec4<u32>(${t}<${r})`},void 0,void 0,9)},Xc=e=>{Ye(e,"GreaterOrEqual",{scalar:(t,r)=>`u32(${t}>=${r})`,vector:(t,r)=>`vec4<u32>(${t}>=${r})`},void 0,void 0,9)},Qc=e=>{Ye(e,"LessOrEqual",{scalar:(t,r)=>`u32(${t}<=${r})`,vector:(t,r)=>`vec4<u32>(${t}<=${r})`},void 0,void 0,9)}}),Ru,Bu,Nu,Mu,Yc,Jc,yy=P(()=>{re(),ae(),Se(),ne(),Ru=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let r=0,i=e[r],a=i.dataType,n=i.dims.length;e.forEach((s,u)=>{if(u!==r){if(s.dataType!==a)throw new Error("input tensors should be one type");if(s.dims.length!==n)throw new Error("input tensors should have the same shape");s.dims.forEach((l,p)=>{if(p!==t&&l!==i.dims[p])throw new Error("non concat dimensions must match")})}})},Bu=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,Nu=(e,t)=>{let r=e.length,i=[];for(let a=0;a<r;++a){let n=t.setByOffset("global_idx",e[a].getByIndices("indices"));r===1?i.push(n):a===0?i.push(`if (inputIndex == ${a}u) { ${n} }`):a===r-1?i.push(`else { ${n} }`):i.push(`else if (inputIndex == ${a}) { ${n} }`)}return i.join(`
`)},Mu=(e,t,r,i)=>{let a=O.size(r),n=new Array(e.length),s=new Array(e.length),u=0,l=[],p=[],c=[{type:12,data:a}];for(let b=0;b<e.length;++b)u+=e[b].dims[t],n[b]=u,p.push(e[b].dims.length),s[b]=N(`input${b}`,i,p[b]),l.push("rank"),c.push({type:12,data:n[b]});for(let b=0;b<e.length;++b)c.push(...ee(e[b].dims));c.push(...ee(r));let f=Y("output",i,r.length),g=f.indicesGet("indices",t),y=Array.from(Array(n.length).keys()).map(b=>`uniforms.sizeInConcatAxis${b}`).join(","),_=b=>`

  ${(()=>{b.registerUniform("outputSize","u32");for(let S=0;S<e.length;S++)b.registerUniform(`sizeInConcatAxis${S}`,"u32");return b.declareVariables(...s,f)})()}

  ${Bu(n.length,y)}

  ${b.mainStart()}
    ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${f.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${g});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${n.length}u>(${y});
      ${g} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${Nu(s,f)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:l},getRunData:()=>({outputs:[{dims:r,dataType:i}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:c}),getShaderSource:_}},Yc=(e,t)=>{let r=e.inputs,i=r[0].dims,a=O.normalizeAxis(t.axis,i.length);Ru(r,a);let n=i.slice();n[a]=r.reduce((u,l)=>u+(l.dims.length>a?l.dims[a]:0),0);let s=r.filter(u=>O.size(u.dims)>0);e.compute(Mu(s,a,n,r[0].dataType),{inputs:s})},Jc=e=>me({axis:e.axis})}),Ut,qt,Lt,sn,Vt=P(()=>{re(),ae(),Ut=(e,t,r="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${r}(uniforms.clip_min)), ${t}(${r}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${r}(uniforms.alpha) * value + ${r}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${r}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},qt=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},Lt=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},sn=e=>{let t=(e==null?void 0:e.activation)||"";if(t==="HardSigmoid"){let[r,i]=(e==null?void 0:e.activation_params)||[.2,.5];return{activation:t,alpha:r,beta:i}}else if(t==="Clip"){let[r,i]=(e==null?void 0:e.activation_params)||[kp,Ip];return{activation:t,clipMax:i,clipMin:r}}else if(t==="LeakyRelu"){let[r]=(e==null?void 0:e.activation_params)||[.01];return{activation:t,alpha:r}}return{activation:t}}}),ze,eh,on=P(()=>{ze=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},eh=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),th,_y=P(()=>{th=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),yr,un,ln=P(()=>{re(),ae(),ne(),Vt(),yr=(e,t,r,i,a)=>{let n=i-r;return`
      ${Array.from({length:r}).map((s,u)=>`
      if (${J(t.shape,u,t.rank)} != 1) {
        ${t.indicesSet(e,u,J(a,u+n,i))}
      } else {
        ${t.indicesSet(e,u,0)}
      }`).join("")}
`},un=(e,t,r,i,a=!1,n)=>{let s=e[0].dims,u=e[1].dims,l=s[s.length-2],p=u[u.length-1],c=s[s.length-1],f=xe(p),g=xe(c),y=xe(l),_=O.size(r)/f/y,b=e.length>2,S=i?i.slice(0,-2):r.slice(0,-2),x=[O.size(S),l,p],$=[{type:12,data:_},{type:12,data:l},{type:12,data:p},{type:12,data:c}];qt(t,$),$.push(...ee(S,s,u)),b&&$.push(...ee(e[2].dims)),$.push(...ee(x));let T=k=>{let C=tn("batch_dims",e[0].dataType,S.length),z=N("a",e[0].dataType,s.length,g),A=N("b",e[1].dataType,u.length,f),v=Y("output",e[0].dataType,x.length,f),M=Ce(v.type.tensor),D=Ut(t,v.type.value,M),F=[z,A],j="";if(b){let Z=a?f:1;F.push(N("bias",e[2].dataType,e[2].dims.length,Z)),j=`${a?`value += bias[col / ${Z}];`:`value += ${v.type.value}(bias[row + i]);`}`}let K=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];Lt(t,K);let R=()=>{let Z=`var a_data: ${z.type.value};`;for(let X=0;X<g;X++)Z+=`
              let b_data${X} = b[(b_offset + (k + ${X}) * uniforms.N + col) / ${f}];`;for(let X=0;X<y;X++){Z+=`a_data = a[(a_offset + (row + ${X}) * uniforms.K + k) / ${g}];`;for(let te=0;te<g;te++)Z+=`
            values[${X}] = fma(${A.type.value}(a_data${g===1?"":`[${te}]`}), b_data${te}, values[${X}]);
`}return Z};return`
  ${k.registerUniforms(K).registerInternalVariables(C).declareVariables(...F,v)}
  ${k.mainStart()}
    ${k.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${f})) * ${f};
    var index1 = global_idx / (uniforms.N / ${f});
    let stride1 = uniforms.M / ${y};
    let row = (index1 % stride1) * ${y};
    let batch = index1 / stride1;

    ${r.length===2?"":`let batch_indices = ${C.offsetToIndices("batch")};`}

    var a_indices: ${z.type.indices};
    ${yr("a_indices",z,z.rank-2,C.rank,"batch_indices")}
    ${z.indicesSet("a_indices",z.rank-2,0)}
    ${z.indicesSet("a_indices",z.rank-1,0)}
    let a_offset = ${z.indicesToOffset("a_indices")};

    var b_indices: ${A.type.indices};
    ${yr("b_indices",A,A.rank-2,C.rank,"batch_indices")}
    ${A.indicesSet("b_indices",A.rank-2,0)}
    ${A.indicesSet("b_indices",A.rank-1,0)}
    let b_offset = ${A.indicesToOffset("b_indices")};
    var values: array<${v.type.value}, ${y}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${g}) {
      ${R()}
    }
    for (var i = 0u; i < ${y}u; i++) {
      var value = values[i];
      ${j}
      ${D}
      let cur_indices = ${v.type.indices}(batch, row + i, col);
      let offset = ${v.indicesToOffset("cur_indices")};
      ${v.setByOffset(`offset / ${f}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${f};${g};${y};${a}`,inputDependencies:b?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(_/64)},programUniforms:$}),getShaderSource:T}}}),Du,Pu,Ra,Zi,Uu,Ba,qu,Jr,dn=P(()=>{re(),ae(),ne(),Vt(),ln(),on(),Du=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,Pu=(e,t)=>e?`
        let ACached0 = mm_Asub[k * innerElementSize][localRow];
        let ACached1 = mm_Asub[k * innerElementSize + 1][localRow];
        let ACached2 = mm_Asub[k * innerElementSize + 2][localRow];
        ${t===3?"":"let ACached3 = mm_Asub[k * innerElementSize + 3][localRow];"}
        for (var i = 0; i < rowPerThread; i = i + 1) {
          acc[i] = BCached0 * ACached0[i] + acc[i];
          acc[i] = BCached1 * ACached1[i] + acc[i];
          acc[i] = BCached2 * ACached2[i] + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached3[i] + acc[i];"}
        }`:`
        for (var i = 0; i < rowPerThread; i = i + 1) {
          let ACached = mm_Asub[tileRow + i][k];
          acc[i] = BCached0 * ACached.x + acc[i];
          acc[i] = BCached1 * ACached.y + acc[i];
          acc[i] = BCached2 * ACached.z + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached.w + acc[i];"}
        }`,Ra=(e,t,r="f32",i,a=!1,n=32,s=!1,u=32)=>{let l=t[1]*e[1],p=t[0]*e[0],c=a?l:n,f=a?n:l,g=c/t[0],y=n/t[1];if(!((a&&g===4&&e[1]===4||!a&&(g===3||g===4))&&c%t[0]===0&&n%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${a} is true, innerElementSize ${g} and workPerThread[1] ${e[1]} must be 4.
      Otherwise, innerElementSize ${g} must be 3 or 4.
  tileAWidth ${c} must be divisible by workgroupSize[0]${t[0]}. tileInner ${n} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${e[0]} must be 4.`);return`
var<workgroup> mm_Asub: array<array<vec${g}<${r}>, ${c/g}>, ${f}>;
var<workgroup> mm_Bsub: array<array<vec4<${r}>, ${p/e[0]}>, ${n}>;

const rowPerThread = ${e[1]};
const colPerThread = ${e[0]};
const innerElementSize = ${g};
const tileInner = ${n};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
  let localRow = i32(localId.y);
  let tileRow = localRow * rowPerThread;
  let tileCol = i32(localId.x);

  let globalRow =i32(globalId.y) * rowPerThread;
  let globalCol = i32(globalId.x);
  let batch = ${s?"0":"i32(globalId.z)"};
  ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
  let globalRowStart = i32(workgroupId.y) * ${l};

  let num_tiles = ${s?`${Math.ceil(u/n)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
  var kStart = ${s?`i32(globalId.z) * ${u}`:"0"};

  var acc: array<vec4<${r}>, rowPerThread>;

  // Loop over shared dimension.
  let tileRowB = localRow * ${y};
  for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let inputRow = tileRow + innerRow;
          let inputCol = tileCol;
          ${Du(a,i)}
      }

      // Load one tile of B into local memory.
      for (var innerRow = 0; innerRow < ${y}; innerRow = innerRow + 1) {
          let inputRow = tileRowB + innerRow;
          let inputCol = tileCol;
          mm_Bsub[inputRow][inputCol] = mm_readB(batch, kStart + inputRow, globalCol${i?", batchIndices":""});
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      for (var k = 0; k < tileInner / innerElementSize; k = k + 1) {
          let BCached0 = mm_Bsub[k * innerElementSize][tileCol];
          let BCached1 = mm_Bsub[k * innerElementSize + 1][tileCol];
          let BCached2 = mm_Bsub[k * innerElementSize + 2][tileCol];
          ${g===3?"":"let BCached3 = mm_Bsub[k * innerElementSize + 3][tileCol];"}

          ${Pu(a,g)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},Zi=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,Uu=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",Ba=(e,t,r="f32",i,a=!1,n=32,s=!1,u=32,l=!1)=>{let p=e[1]*t[1],c=e[0]*t[0],f=a?p:n,g=a?n:p;if(!(g%t[1]===0&&f%t[0]===0&&n%t[1]===0))throw new Error(`tileAHight ${g} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${f} must be divisible by workgroupSize[0]${t[0]}, tileInner ${n} must be divisible by workgroupSize[1]${t[1]}`);let y=g/t[1],_=f/t[0],b=n/t[1],S=l?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${p};
    let globalColStart = i32(workgroupId.x) * ${c};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${g}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${f}; inputCol = inputCol + ${t[0]}) {
          ${Zi(a,i)}
        }
      }
      // Load one tile of B into local memory.
      for (var inputRow = localRow; inputRow < ${n}; inputRow = inputRow + ${t[1]}) {
            for (var inputCol = localCol; inputCol < ${c}; inputCol = inputCol + ${t[0]}) {
          mm_Bsub[inputRow][inputCol] = mm_readB(batch,
            kStart + inputRow,
            globalColStart + inputCol${i?", batchIndices":""});
        }
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      var BCached : array<${r}, colPerThread>;
      for (var k = 0; k < tileInner; k = k + 1) {
        for (var inner = 0; inner < colPerThread; inner = inner + 1) {
          BCached[inner] = mm_Bsub[k][localCol + inner * ${t[0]}];
        }
        for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let ACached = ${a?`mm_Asub[k][localRow + innerRow * ${t[1]}];`:`mm_Asub[localRow + innerRow * ${t[1]}][k];`}
          for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
            acc[innerRow][innerCol] = acc[innerRow][innerCol] +
                ACached * BCached[innerCol];
          }
        }
      }
      workgroupBarrier();
    }
    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      let gRow = globalRowStart + localRow + innerRow * ${t[1]};
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        let gCol = globalColStart + localCol + innerCol * ${t[0]};
        mm_write(batch, gRow, gCol, acc[innerRow][innerCol]);
      }
    }
    `:`
let tileRow = i32(localId.y) * rowPerThread;
let tileCol = i32(localId.x) * colPerThread;

let globalRow = i32(globalId.y) * rowPerThread;
let globalCol = i32(globalId.x) * colPerThread;
let globalRowStart = i32(workgroupId.y) * ${p};

let tileRowA = i32(localId.y) * ${y};
let tileColA = i32(localId.x) * ${_};
let tileRowB = i32(localId.y) * ${b};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${y}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${_}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${Zi(a,i)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${b}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
      let inputRow = tileRowB + innerRow;
      let inputCol = tileCol + innerCol;
      mm_Bsub[inputRow][inputCol] = mm_readB(batch,
        kStart + inputRow,
        globalCol + innerCol${i?", batchIndices":""});
    }
  }
  kStart = kStart + tileInner;
  workgroupBarrier();

  // Compute acc values for a single thread.
  var BCached : array<${r}, colPerThread>;
  for (var k = 0; k < tileInner; k = k + 1) {
    for (var inner = 0; inner < colPerThread; inner = inner + 1) {
      BCached[inner] = mm_Bsub[k][tileCol + inner];
    }

    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      ${Uu(a)}
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        acc[innerRow][innerCol] = acc[innerRow][innerCol] + ACached * BCached[innerCol];
      }
    }
  }

  workgroupBarrier();
}

for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
  for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
    mm_write(batch, globalRow + innerRow, globalCol + innerCol,
        acc[innerRow][innerCol]);
  }
}
`;return`
  var<workgroup> mm_Asub : array<array<${r}, ${f}>, ${g}>;
  var<workgroup> mm_Bsub : array<array<${r}, ${c}>, ${n}>;
  const rowPerThread = ${e[1]};
  const colPerThread = ${e[0]};
  const tileInner = ${n};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
    let batch = ${s?"0":"i32(globalId.z)"};
    ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
    let num_tiles = ${s?`${Math.ceil(u/n)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
    var kStart = ${s?`i32(globalId.z) * ${u}`:"0"};

    var acc : array<array<${r}, colPerThread>, rowPerThread>;
    ${S}
  }
`},qu=(e,t,r,i,a=!1)=>{let[n,s,u,l]=i,p=Ce(i[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${n.type.indices}) -> ${ze(e,p)} {
      var value = ${ze(e,p)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${s.type.indices};
        ${yr("aIndices",s,s.rank-2,n.rank,"batchIndices")}
        ${s.indicesSet("aIndices",s.rank-2,"u32(row)")}
        ${s.indicesSet("aIndices",s.rank-1,"u32(colIn)")}
        value = ${s.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${n.type.indices}) -> ${ze(e,p)} {
      var value = ${ze(e,p)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${u.type.indices};
        ${yr("bIndices",u,u.rank-2,n.rank,"batchIndices")}
        ${u.indicesSet("bIndices",u.rank-2,"u32(row)")}
        ${u.indicesSet("bIndices",u.rank-1,"u32(colIn)")}
        value = ${u.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${ze(e,p)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${a?"bias[colIn]":`${ze(e,p)}(bias[row])`};`:""}
        ${r}
        ${l.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},Jr=(e,t,r,i,a=!1,n)=>{let s=e[0].dims,u=e[1].dims,l=s.slice(0,-2),p=u.slice(0,-2),c=i?i.slice(0,-2):r.slice(0,-2),f=O.size(c),g=s[s.length-2],y=s[s.length-1],_=u[u.length-1],b=y%4===0&&_%4===0,S=g<=8?[4,1,1]:[4,4,1],x=[8,8,1],$=[Math.ceil(_/x[0]/S[0]),Math.ceil(g/x[1]/S[1]),Math.ceil(f/x[2]/S[2])],T=b?4:1,k=[...l,g,y/T],C=k.length,z=[...p,y,_/T],A=z.length,v=[f,g,_/T],M=[{type:6,data:g},{type:6,data:_},{type:6,data:y}];qt(t,M),M.push(...ee(c,k,z));let D=["rank","rank"],F=e.length>2;F&&(M.push(...ee(e[2].dims)),D.push("rank")),M.push(...ee(v));let j=K=>{let R=c.length,Z=tn("batchDims",e[0].dataType,R,1),X=Ce(e[0].dataType),te=N("a",e[0].dataType,C,T),fe=N("b",e[1].dataType,A,T),V=Y("result",e[0].dataType,v.length,T),le=[te,fe];if(F){let ge=a?T:1;le.push(N("bias",e[2].dataType,e[2].dims.length,ge))}let U=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];Lt(t,U);let G=Ce(V.type.tensor),Q=Ut(t,V.type.value,G),q=qu(T,F,Q,[Z,te,fe,V],a);return`
  ${K.registerUniforms(U).registerInternalVariables(Z).declareVariables(...le,V)}
  ${q}
  ${b?Ra(S,x,X,Z):Ba(S,x,X,Z)}
                   `};return{name:"MatMul",shaderCache:{hint:`${S};${t.activation};${b};${a}`,inputDependencies:D},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:$[0],y:$[1],z:$[2]},programUniforms:M}),getShaderSource:j}}}),Lu,rh,by=P(()=>{re(),ht(),ne(),Vt(),on(),_y(),dn(),Lu=(e,t,r,i,a=!1,n,s=4,u=4,l=4,p="f32")=>{let c=M=>{switch(M){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${p}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${M} is not supported.`)}},f=M=>{switch(M){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${M} is not supported.`)}},g=e?`
    let coord = vec4<i32>(batch, xRow, xCol, xCh);
    `:`
    let coord = vec4<i32>(batch, xCh, xRow, xCol);
    `,y=e?`
    let coords = vec4<i32>(
      batch,
      row / outWidth,
      row % outWidth,
      col);
    `:`
    let coords = vec4<i32>(
      batch,
      row,
      col / outWidth,
      col % outWidth);
    `,_=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",b=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",S=e?"row":"col",x=e?"col":"row",$=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${S} / outWidth;
    let outCol = ${S} % outWidth;

    let WRow = ${x} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${x} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${x} % inChannels;
    var resData = ${ze(s,p)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${_} && xCol >= 0 && xCol < ${b}) {
      ${g}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${c(s)}
    }
    return resData;`,T=e?t&&i?`
    let col = colIn * ${s};
    ${$}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${$}
    }
    return ${ze(s,p)}(0.0);`:i&&r?`
    let col = colIn * ${s};
    ${$}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${$}
    }
    return ${ze(s,p)}(0.0);`,k=e?i&&r?f(u):`
    let col = colIn * ${u};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${f(u)}
    }
    return ${ze(u,p)}(0.0);`:`
    let col = colIn * ${u};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${f(u)}
    }
    return ${ze(u,p)}(0.0);`,C=ze(l,p),z=ze(e?s:u,p),A=ze(e?u:s,p),v=Ut(n,C,p);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${z} {
      ${e?T:k}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${A} {
      ${e?k:T}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${C}) {
      let col = colIn * ${l};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${y}
      ${eh(a)}
      ${v}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},rh=(e,t,r,i,a,n,s,u,l)=>{let p=t.format==="NHWC",c=p?e[0].dims[3]:e[0].dims[1],f=r[0],g=p?r[2]:r[3],y=p?r[1]:r[2],_=p?r[3]:r[1],b=p&&(c%4===0||c%3===0)&&_%4===0,S=p?_:g*y,x=p?g*y:_,$=[8,8,1],T=i<=8?[4,1,1]:[4,4,1],k=[Math.ceil(S/$[0]/T[0]),Math.ceil(x/$[1]/T[1]),Math.ceil(f/$[2]/T[2])];pe("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${k}`);let C=b?p&&c%4!==0?3:4:1,z=$[1]*T[1],A=$[0]*T[0],v=Math.max($[0]*C,$[1]),M=i%z===0,D=a%A===0,F=n%v===0,j=b?[C,4,4]:[1,1,1],K=[{type:6,data:i},{type:6,data:a},{type:6,data:n},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];qt(t,K),K.push(...ee(e[0].dims,e[1].dims));let R=["rank","rank"];s&&(K.push(...ee(e[2].dims)),R.push("rank")),K.push(...ee(r));let Z=X=>{let te=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];Lt(t,te);let fe=b?4:1,V=Ce(e[0].dataType),le=`
      fn setOutputAtIndex(flatIndex : i32, value : ${b?`vec4<${V}>`:V}) {
        result[flatIndex] = ${b?`vec4<${V}>`:V}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${b?`vec4<${V}>`:V}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${b?"/ 4":""}, value);
      }`,U=N("x",e[0].dataType,e[0].dims.length,C===3?1:C),G=N("w",e[1].dataType,e[1].dims.length,fe),Q=[U,G],q=Y("result",e[0].dataType,r.length,fe);if(s){let ge=N("bias",e[2].dataType,e[2].dims.length,fe);Q.push(ge),le+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${b?`vec4<${V}>`:V} {
          return bias[coords.${p?"w":"y"}${b?"/ 4":""}];
        }`}return`
        ${th("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${X.registerUniforms(te).declareVariables(...Q,q)}
        ${le}
        ${Lu(p,M,D,F,s,t,j[0],j[1],j[2],V)}
        ${b?Ra(T,$,V,void 0,!p,v):Ba(T,$,V,void 0,!p,v,!1,void 0,u)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${C};${b};${M};${D};${F};${z};${A};${v}`,inputDependencies:R},getRunData:()=>({outputs:[{dims:l?l(r):r,dataType:e[0].dataType}],dispatchGroup:{x:k[0],y:k[1],z:k[2]},programUniforms:K}),getShaderSource:Z}}}),Wu,Xi,or,Vu,Qi,Gu,ih,ah,$y=P(()=>{re(),ht(),ae(),ne(),Vt(),on(),Wu=e=>{let t=1;for(let r=0;r<e.length;r++)t*=e[r];return t},Xi=e=>typeof e=="number"?[e,e,e]:e,or=(e,t)=>t<=1?e:e+(e-1)*(t-1),Vu=(e,t,r,i=1)=>{let a=or(t,i);return Math.floor((e[0]*(r-1)-r+a)/2)},Qi=(e,t,r,i,a)=>{a==null&&(a=Vu(e,t[0],i[0]));let n=[0,0,0,r];for(let s=0;s<3;s++)e[s]+2*a>=t[s]&&(n[s]=Math.trunc((e[s]-t[s]+2*a)/i[s]+1));return n},Gu=(e,t,r,i,a,n,s,u,l,p)=>{let c,f,g,y;if(e==="VALID"&&(e=0),typeof e=="number"){c={top:e,bottom:e,left:e,right:e,front:e,back:e};let _=Qi([t,r,i,1],[u,l,p],1,[a,n,s],e);f=_[0],g=_[1],y=_[2]}else if(Array.isArray(e)){if(!e.every((b,S,x)=>b===x[0]))throw Error(`Unsupported padding parameter: ${e}`);c={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let _=Qi([t,r,i,1],[u,l,p],1,[a,n,s],e[0]);f=_[0],g=_[1],y=_[2]}else if(e==="SAME_UPPER"){f=Math.ceil(t/a),g=Math.ceil(r/n),y=Math.ceil(i/s);let _=(f-1)*a+u-t,b=(g-1)*n+l-r,S=(y-1)*s+p-i,x=Math.floor(_/2),$=_-x,T=Math.floor(b/2),k=b-T,C=Math.floor(S/2),z=S-C;c={top:T,bottom:k,left:C,right:z,front:x,back:$}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:c,outDepth:f,outHeight:g,outWidth:y}},ih=(e,t,r,i,a,n=!1,s="channelsLast")=>{let u,l,p,c,f;if(s==="channelsLast")[u,l,p,c,f]=e;else if(s==="channelsFirst")[u,f,l,p,c]=e;else throw new Error(`Unknown dataFormat ${s}`);let[g,,y,_,b]=t,[S,x,$]=Xi(r),[T,k,C]=Xi(i),z=or(y,T),A=or(_,k),v=or(b,C),{padInfo:M,outDepth:D,outHeight:F,outWidth:j}=Gu(a,l,p,c,S,x,$,z,A,v),K=n?g*f:g,R=[0,0,0,0,0];return s==="channelsFirst"?R=[u,K,D,F,j]:s==="channelsLast"&&(R=[u,D,F,j,K]),{batchSize:u,dataFormat:s,inDepth:l,inHeight:p,inWidth:c,inChannels:f,outDepth:D,outHeight:F,outWidth:j,outChannels:K,padInfo:M,strideDepth:S,strideHeight:x,strideWidth:$,filterDepth:y,filterHeight:_,filterWidth:b,effectiveFilterDepth:z,effectiveFilterHeight:A,effectiveFilterWidth:v,dilationDepth:T,dilationHeight:k,dilationWidth:C,inShape:e,outShape:R,filterShape:t}},ah=(e,t,r,i,a,n)=>{let s=n==="channelsLast";s?e[0].dims[3]:e[0].dims[1];let u=[64,1,1],l={x:r.map((S,x)=>x)},p=[Math.ceil(Wu(l.x.map(S=>r[S]))/u[0]),1,1];pe("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${p}`);let c=1,f=O.size(r),g=[{type:12,data:f},{type:12,data:i},{type:12,data:a},{type:12,data:t.strides},{type:12,data:t.dilations}];qt(t,g),g.push(...ee(e[0].dims,e[1].dims));let y=["rank","rank"],_=e.length===3;_&&(g.push(...ee(e[2].dims)),y.push("rank")),g.push(...ee(r));let b=S=>{let x=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:i.length},{name:"pads",type:"u32",length:a.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];Lt(t,x);let $=1,T=Ce(e[0].dataType),k=N("x",e[0].dataType,e[0].dims.length,c),C=N("W",e[1].dataType,e[1].dims.length,$),z=[k,C],A=Y("result",e[0].dataType,r.length,$),v="";if(_){let F=N("bias",e[2].dataType,e[2].dims.length,$);z.push(F),v+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${T} {
          return bias[${s?J("coords",4,5):J("coords",1,5)}];
        }`}let M=ze(c,T),D=Ut(t,M,T);return`
            ${v}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${k.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${C.getByIndices("aIndices")};
            }
          ${S.registerUniforms(x).declareVariables(...z,A)}
          ${S.mainStart()}
          ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
              let coords = ${A.offsetToIndices("global_idx")};
              let batch = ${J("coords",0,k.rank)};
              let d2 = ${s?J("coords",k.rank-1,k.rank):J("coords",1,k.rank)};
              let xFRCCorner = vec3<u32>(${s?J("coords",1,k.rank):J("coords",2,k.rank)},
              ${s?J("coords",2,k.rank):J("coords",3,k.rank)},
              ${s?J("coords",3,k.rank):J("coords",4,k.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${s?J("uniforms.x_shape",1,k.rank):J("uniforms.x_shape",2,k.rank)};
              let xShapeZ = ${s?J("uniforms.x_shape",2,k.rank):J("uniforms.x_shape",3,k.rank)};
              let xShapeW = ${s?J("uniforms.x_shape",3,k.rank):J("uniforms.x_shape",4,k.rank)};
              let xShapeU = ${s?J("uniforms.x_shape",4,k.rank):J("uniforms.x_shape",1,k.rank)};
              let inputDepthNearestVec4 = (xShapeU / 4) * 4;
              let inputDepthVec4Remainder = xShapeU % 4;

              var value = 0.0;
              for (var wF = 0u; wF < uniforms.filter_dims[0]; wF++) {
                let xF = xFCorner + wF * uniforms.dilations[0];
                if (xF < 0 || xF >= xShapeY) {
                  continue;
                }

                for (var wR = 0u; wR < uniforms.filter_dims[1]; wR++) {
                  let xR = xRCorner + wR * uniforms.dilations[1];
                  if (xR < 0 || xR >= xShapeZ) {
                    continue;
                  }

                  for (var wC = 0u; wC < uniforms.filter_dims[2]; wC++) {
                    let xC = xCCorner + wC * uniforms.dilations[2];
                    if (xC < 0 || xC >= xShapeW) {
                      continue;
                    }

                    for (var d1 = 0u; d1 < inputDepthNearestVec4; d1 += 4) {
                      ${s?`let xValues = vec4<f32>(
                               getX(batch, xF, xR, xC, d1),
                               getX(batch, xF, xR, xC, d1 + 1),
                               getX(batch, xF, xR, xC, d1 + 2),
                               getX(batch, xF, xR, xC, d1 + 3));
                            `:`let xValues = vec4<f32>(
                               getX(batch, d1, xF, xR, xC),
                               getX(batch, d1 + 1, xF, xR, xC),
                               getX(batch, d1 + 2, xF, xR, xC),
                               getX(batch, d1 + 3, xF, xR, xC));
                            `}
                            let wValues = vec4<f32>(
                              getW(d2, d1, wF, wR, wC),
                              getW(d2, d1 + 1, wF, wR, wC),
                              getW(d2, d1 + 2, wF, wR, wC),
                              getW(d2, d1 + 3, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                    if (inputDepthVec4Remainder == 1) {
                        ${s?`value += getX(batch, xF, xR, xC, inputDepthNearestVec4)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`:`value += getX(batch, inputDepthNearestVec4, xF, xR, xC)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`}
                    } else if (inputDepthVec4Remainder == 2) {
                      ${s?`let xValues = vec2<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1));
                      `:`let xValues = vec2<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC));
                    `}
                    let wValues = vec2<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC));
                      value += dot(xValues, wValues);
                    } else if (inputDepthVec4Remainder == 3) {
                      ${s?`let xValues = vec3<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 2));
                      `:`let xValues = vec3<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 2, xF, xR, xC));
                    `}
                    let wValues = vec3<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 2, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                  }
                }
              }
              ${_?"value = value + getBiasByOutputCoords(coords)":""};
              ${D}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${s};${c};${_}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:p[0],y:p[1],z:p[2]},programUniforms:g}),getShaderSource:b}}}),nh,sh,wy=P(()=>{re(),ae(),ne(),Vt(),nh=(e,t,r,i)=>{let a=e.length>2,n=a?"value += b[output_channel];":"",s=e[0].dims,u=e[1].dims,l=t.format==="NHWC",p=l?r[3]:r[1],c=p/t.group,f=l&&c>=4?xe(p):1,g=O.size(r)/f,y=[{type:12,data:g},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:c}];qt(t,y),y.push(...ee(s,[u[0],u[1],u[2],u[3]/f]));let _=a?["rank","rank","rank"]:["rank","rank"];y.push(...ee([r[0],r[1],r[2],r[3]/f]));let b=S=>{let x=Y("output",e[0].dataType,r.length,f),$=Ce(x.type.tensor),T=Ut(t,x.type.value,$),k=N("x",e[0].dataType,s.length),C=N("w",e[1].dataType,u.length,f),z=[k,C];a&&z.push(N("b",e[2].dataType,e[2].dims,f));let A=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];Lt(t,A);let v=l?`
      for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[0]; wHeight++) {
        let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

        if (xHeight < 0u || xHeight >= uniforms.x_shape[1]) {
          continue;
        }

        for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[1]; wWidth++) {
          let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
          if (xWidth < 0u || xWidth >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[2]; wInChannel++) {
            let input_channel = in_channel_offset + wInChannel;
            let xVal = ${k.get("batch","xHeight","xWidth","input_channel")};
            let wVal = ${C.get("wHeight","wWidth","wInChannel","output_channel")};
            value += xVal * wVal;
          }
        }
      }
      `:`
      for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[1]; wInChannel++) {
        let input_channel = in_channel_offset + wInChannel;
        for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[2]; wHeight++) {
          let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

          if (xHeight < 0u || xHeight >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[3]; wWidth++) {
            let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
            if (xWidth < 0u || xWidth >= uniforms.x_shape[3]) {
              continue;
            }

            let xVal = ${k.get("batch","input_channel","xHeight","xWidth")};
            let wVal = ${C.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${S.registerUniforms(A).declareVariables(...z,x)}

  ${S.mainStart()}
    ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let outputIndices = ${x.offsetToIndices("global_idx")};
    let batch: u32 = outputIndices[0];
    let output_channel: u32 = outputIndices[${l?3:1}];
    let xRCCorner: vec2<u32> = vec2<u32>(outputIndices[${l?1:2}], outputIndices[${l?2:3}]) * uniforms.strides - uniforms.pads;
    let group_id: u32 = output_channel * ${f} / uniforms.output_channels_per_group;
    var in_channel_offset = group_id * uniforms.w_shape[${l?2:1}];

    var value: ${x.type.value} = ${x.type.value}(0);
    ${v}
    ${n}
    ${T}
    ${x.setByOffset("global_idx","value")}
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${f}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:y}),getShaderSource:b}},sh=(e,t,r,i)=>{let a=e.length>2,n=xe(r[3]),s=xe(r[2]),u=O.size(r)/n/s,l=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/n],p=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/n],c=[r[0],r[1],r[2],r[3]/n],f=[{type:12,data:u},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];qt(t,f),f.push(...ee(l,p,c));let g=(s-1)*t.strides[1]+p[1],y=_=>{let b=Y("output",e[0].dataType,c.length,n),S=Ce(b.type.tensor),x=Ut(t,b.type.value,S),$=N("x",e[0].dataType,l.length,n),T=N("w",e[1].dataType,p.length,n),k=[$,T];a&&k.push(N("b",e[2].dataType,e[2].dims,n));let C=a?"value += b[output_channel];":"",z=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return Lt(t,z),`
  ${_.registerUniforms(z).declareVariables(...k,b)}
  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let width0 = uniforms.output_shape[3];
    let output_channel = global_idx % width0;
    var index1 = global_idx / width0;
    let width1 = uniforms.output_shape[2] / ${s}u;
    let col = (index1 % width1) * ${s}u;
    index1 = index1 / width1;
    let row = index1 % uniforms.output_shape[1];
    let batch = index1 / uniforms.output_shape[1];

    let x_corner = vec2<i32>(i32(row), i32(col)) * uniforms.strides - uniforms.pads;

    var x_vals: array<${$.type.value}, ${g}>;
    var values: array<${b.type.value}, ${s}>;
    let input_channel = output_channel;
    // Use constant instead of uniform can give better performance for w's height/width.
    for (var w_height: u32 = 0u; w_height < ${p[0]}; w_height++) {
      let x_height = x_corner.x + i32(w_height);
      if (x_height >= 0 && u32(x_height) < uniforms.x_shape[1]) {
        for (var i = 0; i < ${g}; i++) {
          let x_width = x_corner.y + i;
          if (x_width >= 0 && u32(x_width) < uniforms.x_shape[2]) {
            x_vals[i] = ${$.get("batch","u32(x_height)","u32(x_width)","input_channel")};
          } else {
            x_vals[i] = ${$.type.value}(0);
          }
        }
        for (var w_width: u32 = 0u; w_width < ${p[1]}; w_width++) {
          let w_val = ${T.get("w_height","w_width","0","output_channel")};
          for (var i = 0u; i < ${s}u; i++) {
            values[i] = fma(x_vals[i * u32(uniforms.strides[1]) + w_width], w_val, values[i]);
          }
        }
      }
    }

    for (var i = 0u; i < ${s}u; i++) {
      var value = values[i];
      ${C}
      ${x}
      ${b.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${n};${s};${g};${p[0]};${p[1]}`,inputDependencies:a?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:f}),getShaderSource:y}}}),Hu,qr,Fu,Lr,Na,Yi,ju,Ku,Ma,vy=P(()=>{ae(),by(),$y(),dn(),wy(),Vt(),ln(),St(),Hu=(e,t,r,i,a,n)=>{let s=e[0],u=e.slice(n?1:2,n?3:4),l=u.length,p=t[0],c=t.slice(2).map((g,y)=>g+(g-1)*(r[y]-1)),f=u.map((g,y)=>g+i[y]+i[y+l]).map((g,y)=>Math.floor((g-c[y]+a[y])/a[y]));return f.splice(0,0,s),f.splice(n?3:1,0,p),f},qr=[2,3,1,0],Fu=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[1]*t.group;if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let a=e[0].dims.length-2;if(t.dilations.length!==a)throw new Error(`dilations should be ${a}D`);if(t.strides.length!==a)throw new Error(`strides should be ${a}D`);if(t.pads.length!==a*2)throw new Error(`pads should be ${a*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},Lr=(e,t)=>{let r=e.kernelShape.slice();r.length<t[1].dims.length-2&&r.push(...Array(t[1].dims.length-2-r.length).fill(0));for(let n=2;n<t[1].dims.length;++n)r[n-2]===0&&(r[n-2]=t[1].dims[n]);let i=e.pads.slice();Qr.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,r,i,e.format==="NHWC",e.autoPad);let a=Object.assign({},e);return Object.assign(a,{kernelShape:r,pads:i}),a},Na=e=>{let t=sn(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],a=e.dilations,n=e.group,s=e.kernel_shape,u=e.pads,l=e.strides,p=e.w_is_const();return{autoPad:i,format:r,dilations:a,group:n,kernelShape:s,pads:u,strides:l,wIsConst:p,...t,cacheKey:`${e.format};${t.activation};`}},Yi=(e,t,r,i)=>{let a=r.format==="NHWC",n=Hu(t[0].dims,t[1].dims,r.dilations,r.pads,r.strides,a);if(r.group!==1){let z=[t[0]];if(a){let A=e.kernelCustomData.wT??e.compute(Ve(t[1],qr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=A),z.push(A)}else z.push(t[1]);t.length===3&&z.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&a&&t[1].dims[0]===r.group&&t[1].dims[1]===1&&r.dilations[0]===1&&r.dilations[1]===1?e.compute(sh(z,r,n,i),{inputs:z}):e.compute(nh(z,r,n,i),{inputs:z});return}let s=t.length===3,u=t[0].dims[a?1:2],l=t[0].dims[a?2:3],p=t[0].dims[a?3:1],c=t[1].dims[2],f=t[1].dims[3],g=n[a?1:2],y=n[a?2:3],_=n[a?3:1],b=a&&c===u&&f===l&&r.pads[0]===0&&r.pads[1]===0;if(b||c===1&&f===1&&r.dilations[0]===1&&r.dilations[1]===1&&r.strides[0]===1&&r.strides[1]===1&&r.pads[0]===0&&r.pads[1]===0){let z=n[0],A,v,M,D=[];if(a){let K=e.kernelCustomData.wT??e.compute(Ve(t[1],qr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];if(r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=K),b){let R=u*l*p;A=t[0].reshape([1,z,R]),v=K.reshape([1,R,_]),M=[1,z,_]}else A=t[0].reshape([z,u*l,p]),v=K.reshape([1,p,_]),M=[z,g*y,_];D.push(A),D.push(v)}else A=t[0].reshape([z,p,u*l]),v=t[1].reshape([1,_,p]),M=[z,_,g*y],D.push(v),D.push(A);s&&D.push(t[2]);let F=M[2],j=D[0].dims[D[0].dims.length-1];F<8&&j<8?e.compute(un(D,r,n,M,a,i),{inputs:D}):e.compute(Jr(D,r,n,M,a,i),{inputs:D});return}let S=!0,x=e.kernelCustomData.wT??e.compute(Ve(t[1],qr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=x);let $=[t[0],x];s&&$.push(t[2]);let T=a?g*y:_,k=a?_:g*y,C=c*f*p;e.compute(rh($,r,n,T,k,C,s,S,i),{inputs:$})},ju=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let a=[0,t.pads[0],0,t.pads[1]],n=[1].concat(t.strides),s=[1].concat(t.dilations),u=[1].concat(t.kernelShape),l=Lr({...t,pads:a,strides:n,dilations:s,kernelShape:u},i);Yi(e,i,l,p=>r?[p[0],p[2],p[3]]:[p[0],p[1],p[3]])},Ku=(e,t,r)=>{let i=r.format==="NHWC"?"channelsLast":"channelsFirst",a=Lr(r,t),n=r.autoPad==="NOTSET"?r.pads:r.autoPad,s=ih(t[0].dims,t[1].dims,r.strides,r.dilations,n,!1,i);e.compute(ah(t,a,s.outShape,[s.filterDepth,s.filterHeight,s.filterWidth],[s.padInfo.front,s.padInfo.top,s.padInfo.left],i))},Ma=(e,t)=>{if(Fu(e.inputs,t),e.inputs[0].dims.length===3)ju(e,t);else if(e.inputs[0].dims.length===5)Ku(e,e.inputs,t);else{let r=Lr(t,e.inputs);Yi(e,e.inputs,r)}}}),oh,xy=P(()=>{re(),ht(),ae(),ne(),oh=(e,t,r)=>{let i=e.length>2,a=t.outputShape,n=t.format==="NHWC",s=t.group,u=e[1].dims,l=u[2]/s,p=u[3],c=n?xe(l):1,f=n&&p===1&&l>=4,g=f?Math.floor(l/4)*4:Math.floor(l/c)*c,y=l-g,_=n?xe(p):1,b=n?p===1?c:_:1,S=O.size(a)/_,x=[Math.ceil(S/64),1,1];pe("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${x}`);let $=["rank","rank"],T=[t.strides[0],t.strides[1]],k=[t.kernelShape[n?1:2],t.kernelShape[n?2:3]],C=[t.dilations[0],t.dilations[1]],z=[k[0]+(t.dilations[0]<=1?0:(t.kernelShape[n?1:2]-1)*(t.dilations[0]-1)),k[1]+(t.dilations[1]<=1?0:(t.kernelShape[n?2:3]-1)*(t.dilations[1]-1))],A=[z[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),z[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],v=[{type:12,data:S},{type:12,data:T},{type:12,data:k},{type:12,data:C},{type:12,data:z},{type:6,data:A},{type:12,data:g},{type:12,data:l},{type:12,data:p},...ee(e[0].dims,e[1].dims)];i&&(v.push(...ee(e[2].dims)),$.push("rank")),v.push(...ee(a));let M=D=>{let F=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:T.length},{name:"filter_dims",type:"u32",length:k.length},{name:"dilations",type:"u32",length:k.length},{name:"effective_filter_dims",type:"u32",length:z.length},{name:"pads",type:"i32",length:A.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],j=Ce(e[0].dataType),K=n?1:2,R=n?2:3,Z=n?3:1,X=N("W",e[1].dataType,e[1].dims.length,b),te=N("Dy",e[0].dataType,e[0].dims.length,c),fe=[te,X];i&&fe.push(N("bias",e[2].dataType,[a[Z]].length,_));let V=Y("result",e[0].dataType,a.length,_),le=()=>{let Q="";if(f)c===4?Q+=`
        let xValue = ${te.getByOffset("x_offset")};
        let wValue = ${X.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:c===2?Q+=`
          dotProd = dotProd + dot(vec4<${j}>(${te.getByOffset("x_offset")}, ${te.getByOffset("x_offset + 1u")}), vec4<${j}>(${X.getByOffset("w_offset")}, ${X.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:c===1&&(Q+=`
          dotProd = dotProd + dot(vec4<${j}>(${te.getByOffset("x_offset")}, ${te.getByOffset("x_offset + 1u")}, ${te.getByOffset("x_offset + 2u")}, ${te.getByOffset("x_offset + 3u")}), vec4<${j}>(${X.getByOffset("w_offset")}, ${X.getByOffset("w_offset + 1u")}, ${X.getByOffset("w_offset + 2u")}, ${X.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(Q+=`
                  let xValue = ${n?te.getByOffset(`${te.indicesToOffset(`${te.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${c}`):te.get("batch","inputChannel","idyR","idyC")};
        `,c===1)Q+=`
          let w_offset = ${X.indicesToOffset(`${X.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${X.getByOffset(`w_offset / ${b}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let q=0;q<c;q++)Q+=`
            let wValue${q} = ${X.getByOffset(`${X.indicesToOffset(`${X.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${q}, wOutChannel)`)} / ${b}`)};
            dotProd = dotProd + xValue[${q}] * wValue${q};`;return Q},U=()=>{if(y===0)return"";if(!f)throw new Error(`packInputAs4 ${f} is not true.`);let Q="";if(c===1){Q+="dotProd = dotProd";for(let q=0;q<y;q++)Q+=`
            + ${te.getByOffset(`x_offset + ${q}`)} * ${X.getByOffset(`w_offset + ${q}`)}`;Q+=";"}else if(c===2){if(y!==2)throw new Error(`Invalid inputChannelsRemainder ${y}.`);Q+=`
          let xValue = ${te.getByOffset("x_offset")};
          let wValue = ${X.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return Q},G=`
            let outputIndices = ${V.offsetToIndices(`global_idx * ${_}`)};
            let batch = ${V.indicesGet("outputIndices",0)};
            let d1 = ${V.indicesGet("outputIndices",Z)};
            let r = ${V.indicesGet("outputIndices",K)};
            let c = ${V.indicesGet("outputIndices",R)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${V.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${j}(dyRCorner) + ${j}(wR)) / ${j}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${j}(uniforms.Dy_shape[${K}]) || fract(dyR) > 0.0 ||
                  wRPerm < 0) {
                continue;
              }
              let idyR: u32 = u32(dyR);
              var wC: u32 = 0;
              if (uniforms.dilations.y == 1) {
                // Minimum wC >= 0 that satisfies (dyCCorner + wC) % (uniforms.strides.y) == 0
                wC = u32(((dyCCorner + i32(uniforms.strides.y) - 1) / i32(uniforms.strides.y)) * i32(uniforms.strides.y) - dyCCorner);
              }
              for (; wC < uniforms.effective_filter_dims.y; wC = wC + 1) {
                if (wC % uniforms.dilations.y != 0) {
                  continue;
                }
                let dyC = (${j}(dyCCorner) + ${j}(wC)) / ${j}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${j}(uniforms.Dy_shape[${R}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${f?`
                var x_offset = ${te.indicesToOffset(`${te.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${c};
                var w_offset = ${X.indicesToOffset(`${X.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${b};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${f?4:c}) {
                  ${le()}
                  inputChannel = inputChannel + ${f?4:c};
                }
                ${U()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${i?` + bias[d1 / ${_}]`:""};
            ${V.setByOffset("global_idx","value")};
          `;return`
    ${D.registerUniforms(F).declareVariables(...fe,V)}
      ${D.mainStart()}
      ${D.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${G}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${c}${b}${_}${f}${y}`,inputDependencies:$},getRunData:()=>({dispatchGroup:{x:x[0],y:x[1],z:x[2]},outputs:[{dims:r?r(a):a,dataType:e[0].dataType}],programUniforms:v}),getShaderSource:M}}}),Zu,Xu,Qu,Ji,uh,Yu,ea,Ju,lh,Sy=P(()=>{xy(),Vt(),St(),Zu=(e,t,r,i,a,n)=>(e-1)*t+r+(i-1)*a+1-n,Xu=(e,t,r,i,a)=>{let n=Math.floor(e/2);t==="SAME_UPPER"?(r[i]=n,r[a]=e-n):t==="SAME_LOWER"&&(r[i]=e-n,r[a]=n)},Qu=(e,t,r,i,a,n,s,u,l,p)=>{let c=e.length-2,f=p.length===0;l.length<c&&l.push(...Array(c-l.length).fill(0));let g=e[0],y=t[u?3:1]*a;for(let _=0,b=e.length-c-(u?1:0);_<c;++_,++b){let S=e[b],x=f?S*s[_]:p[_],$=Zu(S,s[_],n[_],t[b],r[_],x);Xu($,i,n,_,_+c),f&&p.push(s[_]*(S-1)+l[_]+(t[b]-1)*r[_]+1-n[_]-n[_+c])}p.splice(0,0,g),p.splice(u?3:1,0,y)},Ji=(e,t)=>{let r=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((f,g)=>f*g,1)===0){r.length=0;for(let f=2;f<t[1].dims.length;++f)r.push(t[1].dims[f])}let i=e.format==="NHWC";r.splice(0,0,t[1].dims[0]),r.splice(i?3:1,0,t[1].dims[1]);let a=e.pads.slice(),n=e.outputShape.slice(),s=e.outputPadding.slice(),u=t[0].dims,l=e.dilations.slice();if(l.reduce((f,g)=>f+g,0)===0){let f=t[0].dims.length-2;l=new Array(f).fill(1)}let p=e.strides.slice();if(p.reduce((f,g)=>f+g,0)===0){let f=t[0].dims.length-2;p=new Array(f).fill(1)}Qu(u,r,l,e.autoPad,e.group,a,p,i,s,n);let c=Object.assign({},e);return Object.assign(c,{kernelShape:r,pads:a,outputPadding:s,outputShape:n,dilations:l,strides:p}),c},uh=e=>{let t=sn(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],a=e.dilations,n=e.group??1,s=e.kernelShape,u=e.pads,l=e.strides,p=e.wIsConst(),c=e.outputPadding,f=e.outputShape;return{autoPad:i,format:r,dilations:a,group:n,kernelShape:s,outputPadding:c,outputShape:f,pads:u,strides:l,wIsConst:p,...t,cacheKey:`${e.format};${t.activation};`}},Yu=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[0];if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let a=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==a))throw new Error("invalid bias");let n=e[0].dims.length-2;if(t.dilations.reduce((s,u)=>s+u,0)>0&&t.dilations.length!==n)throw new Error(`dilations should be ${n}D`);if(t.strides.reduce((s,u)=>s+u,0)>0&&t.strides.length!==n)throw new Error(`strides should be ${n}D`);if(t.pads.reduce((s,u)=>s+u,0)>0&&t.pads.length!==n*2)throw new Error(`pads should be ${n*2}D`);if(t.outputPadding.length!==n&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${n}D`);if(t.kernelShape.reduce((s,u)=>s+u,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},ea=(e,t,r,i)=>{let a=e.kernelCustomData.wT??e.compute(Ve(t[1],[2,3,0,1]),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=a);let n=[t[0],a];t.length===3&&n.push(t[2]),e.compute(oh(n,r,i),{inputs:n})},Ju=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let a=t.kernelShape;(a.length===0||a[0]===0)&&(a=[e.inputs[1].dims[2]]);let n=t.dilations;(n.length===0||n[0]===0)&&(n=[1]);let s=t.strides;(s.length===0||s[0]===0)&&(s=[1]);let u=t.pads;u.length===0&&(u=[0,0]),u=[0,u[0],0,u[1]],s=[1].concat(s),n=[1].concat(n),a=[1].concat(a);let l=t.outputPadding;l=[0].concat(l);let p=Ji({...t,pads:u,strides:s,dilations:n,kernelShape:a,outputPadding:l},i);ea(e,i,p,c=>r?[c[0],c[2],c[3]]:[c[0],c[1],c[3]])},lh=(e,t)=>{if(Yu(e.inputs,t),e.inputs[0].dims.length===3)Ju(e,t);else{let r=Ji(t,e.inputs);ea(e,e.inputs,r)}}}),el,dh,ph,ky=P(()=>{re(),ae(),Se(),ne(),el=(e,t,r,i)=>{let a=O.size(t),n=t.length,s=N("input",e,n),u=Y("output",e,n),l=r.dataType===6?r.getInt32Array()[0]:Number(r.getBigInt64Array()[0]),p=O.normalizeAxis(l,n),c=f=>{let g=` i32(${s.indicesGet("inputIndices","uniforms.axis")}) `,y=J("uniforms.input_shape","uniforms.axis",n),_=i.reverse?g+(i.exclusive?" + 1":""):"0",b=i.reverse?y:g+(i.exclusive?"":" + 1");return`
                ${f.registerUniform("outputSize","u32").registerUniform("axis","u32").declareVariables(s,u)}
                ${f.mainStart()}
                  ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
                  var inputIndices = ${u.offsetToIndices("global_idx")};
                  var sum = ${u.type.value}(0);
                  let first : i32 = ${_};
                  let last : i32 = ${b};
                  for (var i : i32 = first; i < last; i++) {
                    ${s.indicesSet("inputIndices","uniforms.axis","u32(i)")};
                    sum = sum + ${s.getByIndices("inputIndices")};
                  }
                  ${u.setByOffset("global_idx","sum")};
                }`};return{name:"CumSum",shaderCache:{hint:i.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:[{type:12,data:a},{type:12,data:p},...ee(t,t)]}),getShaderSource:c}},dh=(e,t)=>{let r=e.inputs[0].dims,i=e.inputs[0].dataType,a=e.inputs[1];e.compute(el(i,r,a,t),{inputs:[0]})},ph=e=>{let t=e.exclusive===1,r=e.reverse===1;return me({exclusive:t,reverse:r})}}),tl,rl,il,ch,hh,Iy=P(()=>{re(),ae(),Se(),ne(),tl=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},rl=(e,t,r,i)=>{let a=[];a.push(`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`);for(let n=0;n<t;++n)a.push(r.indicesSet("a",e[n],`i[${n}]`));return a.push("return a;}"),a.join(`
`)},il=(e,t)=>{let r,i,a,n,s,u,l=t.format==="NHWC",p=t.blocksize,c=t.mode==="DCR";l?([r,i,a,n]=e.dims,s=c?[r,i,a,p,p,n/p**2]:[r,i,a,n/p**2,p,p],u=c?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([r,i,a,n]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],s=c?[r,p,p,n/p**2,i,a]:[r,n/p**2,p,p,i,a],u=c?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let f=e.reshape(s),g=f.dims.length,y=e.dataType,_=N("a",y,g),b=Y("output",y,g),S=x=>`
  ${x.registerUniform("output_size","u32").declareVariables(_,b)}

  ${rl(u,g,_,b)}

  ${x.mainStart()}
    ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${b.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${b.setByOffset("global_idx",_.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:x=>{let $=l?[r,i*p,a*p,n/p**2]:[r,n/p**2,i*p,a*p],T=O.size($),k=f.dims,C=O.sortBasedOnPerm(k,u);return{outputs:[{dims:$,dataType:x[0].dataType}],dispatchGroup:{x:Math.ceil(T/64)},programUniforms:[{type:12,data:T},...ee(k,C)]}},getShaderSource:S}},ch=(e,t)=>{tl(e.inputs),e.compute(il(e.inputs[0],t))},hh=e=>me({blocksize:e.blocksize,mode:e.mode,format:e.format})}),Wr,ur,ta,al,nl,sl,ol,ra,ul,fh,mh,Ty=P(()=>{re(),ae(),Se(),ne(),Wr="[a-zA-Z]|\\.\\.\\.",ur="("+Wr+")+",ta="^"+ur+"$",al="("+ur+",)*"+ur,nl="^"+al+"$",sl=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let r=this.symbolToIndices.get(e);r===void 0?r=[t]:r.push(t),this.symbolToIndices.set(e,r)}},ol=class{constructor(e,t){var a;this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[r,i]=t.includes("->")?t.split("->",2):[t,""];if(!r.match(RegExp(nl)))throw new Error("Invalid LHS term");if(r.split(",").forEach((n,s)=>{let u=e[s].dims.slice();if(!n.match(RegExp(ta)))throw new Error("Invalid LHS term");let l=this.processTerm(n,!0,u,s);this.lhs.push(l)}),i==="")i+=[...this.symbolToInfo.entries()].filter(([n,s])=>s.count===1||n==="...").map(([n])=>n).join("");else if(!i.match(RegExp(ur)))throw new Error("Invalid RHS");(a=i.match(RegExp(Wr,"g")))==null||a.forEach(n=>{if(n==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let s=this.symbolToInfo.get(n);if(s===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(s.dimValue)}}),this.rhs=this.processTerm(i,!1,this.outputDims)}addSymbol(e,t,r){let i=this.symbolToInfo.get(e);if(i!==void 0){if(i.dimValue!==t&&i.count!==1)throw new Error("Dimension mismatch");i.count++,i.inputIndices.push(r)}else i={count:1,dimValue:t,inputIndices:[r]};this.symbolToInfo.set(e,i)}processTerm(e,t,r,i=-1){let a=r.length,n=!1,s=[],u=0;if(!e.match(RegExp(ta))&&!t&&e!=="")throw new Error("Invalid LHS term");let l=e.match(RegExp(Wr,"g")),p=new sl(i);return l==null||l.forEach((c,f)=>{if(c==="..."){if(n)throw new Error("Only one ellipsis is allowed per input term");n=!0;let g=a-l.length+1;if(g<0)throw new Error("Ellipsis out of bounds");if(s=r.slice(u,u+g),this.hasEllipsis){if(this.ellipsisDims.length!==s.length||this.ellipsisDims.toString()!==s.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=s;else throw new Error("Ellipsis must be specified in the LHS");for(let y=0;y<s.length;y++){let _=String.fromCharCode(48+y);p.addSymbol(_,f+y),this.addSymbol(_,r[u++],i)}}else p.addSymbol(c,f+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(c,r[u++],i)}),p}},ra=e=>e+"_max",ul=(e,t,r,i)=>{let a=e.map(p=>p.length).map((p,c)=>N(`input${c}`,t,p)),n=O.size(i),s=Y("output",t,i.length),u=[...r.symbolToInfo.keys()].filter(p=>!r.rhs.symbolToIndices.has(p)),l=p=>{let c=[],f="var prod = 1.0;",g="var sum = 0.0;",y="sum += prod;",_=[],b=[],S=[],x=[],$=r.symbolToInfo.size===r.rhs.symbolToIndices.size;r.symbolToInfo.forEach((k,C)=>{var z;if(r.rhs.symbolToIndices.has(C)){let A=(z=r.rhs.symbolToIndices.get(C))==null?void 0:z[0];A!==void 0&&r.lhs.forEach((v,M)=>{if(k.inputIndices.includes(M)){let D=v.symbolToIndices.get(C);if(D===void 0)throw new Error("Invalid symbol error");D.forEach(F=>{c.push(`${a[M].indicesSet(`input${M}Indices`,F,s.indicesGet("outputIndices",A))}`)})}})}else r.lhs.forEach((A,v)=>{if(k.inputIndices.includes(v)){let M=A.symbolToIndices.get(C);if(M===void 0)throw new Error("Invalid symbol error");M.forEach(D=>{_.push(`${a[v].indicesSet(`input${v}Indices`,D,`${C}`)}`)}),x.push(`prod *= ${a[v].getByIndices(`input${v}Indices`)};`)}}),b.push(`for(var ${C}: u32 = 0; ${C} < uniforms.${ra(C)}; ${C}++) {`),S.push("}")});let T=$?[...c,`let sum = ${a.map((k,C)=>k.getByIndices(`input${C}Indices`)).join(" * ")};`]:[...c,g,...b,..._,f,...x,y,...S];return`
            ${p.registerUniforms(u.map(k=>({name:`${ra(k)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...a,s)}

            ${p.mainStart()}
            ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${s.offsetToIndices("global_idx")};
            ${a.map((k,C)=>`var input${C}Indices: ${a[C].type.indices};`).join(`
`)}
            ${T.join(`
`)};
            ${s.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:r.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let p=u.filter(f=>r.symbolToInfo.has(f)).map(f=>{var g;return{type:12,data:((g=r.symbolToInfo.get(f))==null?void 0:g.dimValue)||0}});p.push({type:12,data:n});let c=e.map((f,g)=>[...ee(f)]).reduce((f,g)=>f.concat(g),p);return c.push(...ee(i)),{outputs:[{dims:i,dataType:t}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:c}},getShaderSource:l}},fh=(e,t)=>{let r=new ol(e.inputs,t.equation),i=r.outputDims,a=e.inputs.map((n,s)=>n.dims);e.compute(ul(a,e.inputs[0].dataType,r,i))},mh=e=>{let t=e.equation.replace(/\s+/g,"");return me({equation:t})}}),ll,ia,dl,pl,gh,Cy=P(()=>{re(),ae(),ne(),ll=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=r.length<t.length?0:r.length-t.length,a=t.length<r.length?0:t.length-r.length;for(;i<r.length&&a<t.length;++i,++a)if(r[i]!==t[a]&&r[i]!==1&&t[a]!==1)throw new Error("Expand requires shape to be broadcastable to input")},ia=(e,t)=>{let r=e.length-t.length,i=[];for(let a=0;a<r;++a)i.push(e[a]);for(let a=0;a<t.length;++a)i.push(t[a]===1?e[a+r]:t[a]);return i},dl=(e,t)=>e.length>t.length?ia(e,t):ia(t,e),pl=e=>{let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=dl(t,r),a=e[0].dataType,n=a===9||O.size(t)===1,s=a===9||t.length>0&&t[t.length-1]%4===0?4:1,u=n||i.length>0&&i[i.length-1]%4===0?4:1,l=Math.ceil(O.size(i)/u),p=f=>{let g=N("input",a,t.length,s),y=Y("output",a,i.length,u),_;if(a===9){let b=(S,x,$="")=>`
          let outputIndices${x} = ${y.offsetToIndices(`outputOffset + ${x}u`)};
          let offset${x} = ${g.broadcastedIndicesToOffset(`outputIndices${x}`,y)};
          let index${x} = offset${x} / 4u;
          let component${x} = offset${x} % 4u;
          ${S}[${x}] = ${$}(${g.getByOffset(`index${x}`)}[component${x}]);
        `;_=`
        let outputOffset = global_idx * ${u};
        var data = vec4<u32>(0);
        ${b("data",0,"u32")}
        ${b("data",1,"u32")}
        ${b("data",2,"u32")}
        ${b("data",3,"u32")}
        ${y.setByOffset("global_idx","data")}
      }`}else _=`
        let outputIndices = ${y.offsetToIndices(`global_idx * ${u}`)};
        let inputOffset = ${g.broadcastedIndicesToOffset("outputIndices",y)};
        let data = ${y.type.value}(${g.getByOffset(`inputOffset / ${s}`)});
        ${y.setByOffset("global_idx","data")}
      }`;return`
    ${f.registerUniform("vec_size","u32").declareVariables(g,y)}
    ${f.mainStart()}
    ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
    ${_}`},c=[{type:12,data:l},...ee(t,i)];return{name:"Expand",shaderCache:{hint:`${i.length};${s}${u}`,inputDependencies:["rank"]},getShaderSource:p,getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:c})}},gh=e=>{ll(e.inputs),e.compute(pl(e.inputs),{inputs:[0]})}}),cl,yh,Ey=P(()=>{re(),ae(),ne(),nn(),cl=e=>{let t=e[0].dataType,r=O.size(e[0].dims),i=O.size(e[1].dims),a=i%4===0,n=s=>{let u=N("x",t,[1],4),l=N("bias",t,[1],4),p=Y("y",t,[1],4),c=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],f=y=>`
      let bias${y}_offset: u32 = (global_idx * 4 + ${y}) % uniforms.bias_size;
      let bias${y} = ${l.getByOffset(`bias${y}_offset / 4`)}[bias${y}_offset % 4];`,g=a?`
      let bias = ${l.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${f(0)}${f(1)}${f(2)}${f(3)}
      let bias = ${u.type.value}(bias0, bias1, bias2, bias3);`;return`${s.registerUniforms(c).declareVariables(u,l,p)}

    ${Aa(Ae(t))}

    ${s.mainStart(Xt)}
      ${s.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${u.getByOffset("global_idx")};
      ${g}
      let x_in = x + bias;
      ${p.setByOffset("global_idx",Oa("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${a}`,inputDependencies:["type","type"]},getShaderSource:n,getRunData:s=>({outputs:[{dims:s[0].dims,dataType:s[0].dataType}],programUniforms:[{type:12,data:Math.ceil(r/4)},{type:12,data:i}],dispatchGroup:{x:Math.ceil(r/Xt/4)}})}},yh=e=>{e.inputs.length<2||O.size(e.inputs[1].dims)===0?Dc(e):e.compute(cl(e.inputs))}}),hl,fl,_h,bh,zy=P(()=>{re(),ae(),Se(),ne(),hl=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},fl=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r.length,n=O.normalizeAxis(t.axis,a),s=r.slice(0);s.splice(n,1,...i);let u=r[n],l=e[0].dataType===9?4:1,p=Math.ceil(O.size(s)/l),c=[{type:12,data:p},{type:6,data:u},{type:12,data:n},...ee(e[0].dims,e[1].dims,s)],f=g=>{let y=N("data",e[0].dataType,e[0].dims.length,l),_=N("inputIndices",e[1].dataType,e[1].dims.length),b=Y("output",e[0].dataType,s.length,l),S=$=>{let T=i.length,k=`var indicesIndices${$}  = ${_.type.indices}(0);`;for(let C=0;C<T;C++)k+=`${T>1?`indicesIndices${$}[${C}]`:`indicesIndices${$}`} = ${s.length>1?`outputIndices${$}[uniforms.axis + ${C}]`:`outputIndices${$}`};`;k+=`
          var idx${$} = ${_.getByIndices(`indicesIndices${$}`)};
          if (idx${$} < 0) {
            idx${$} = idx${$} + uniforms.axisDimLimit;
          }
          var dataIndices${$} : ${y.type.indices};
        `;for(let C=0,z=0;C<a;C++)C===n?(k+=`${a>1?`dataIndices${$}[${C}]`:`dataIndices${$}`} = u32(idx${$});`,z+=T):(k+=`${a>1?`dataIndices${$}[${C}]`:`dataIndices${$}`} = ${s.length>1?`outputIndices${$}[${z}]`:`outputIndices${$}`};`,z++);return k},x;if(e[0].dataType===9){let $=(T,k,C="")=>`
          let outputIndices${k} = ${b.offsetToIndices(`outputOffset + ${k}u`)};
          ${S(k)};
          let offset${k} = ${y.indicesToOffset(`dataIndices${k}`)};
          let index${k} = offset${k} / 4u;
          let component${k} = offset${k} % 4u;
          ${T}[${k}] = ${C}(${y.getByOffset(`index${k}`)}[component${k}]);
        `;x=`
        let outputOffset = global_idx * ${l};
        var value = vec4<u32>(0);
        ${$("value",0,"u32")}
        ${$("value",1,"u32")}
        ${$("value",2,"u32")}
        ${$("value",3,"u32")}
        ${b.setByOffset("global_idx","value")}
      `}else x=`
      let outputIndices = ${b.offsetToIndices("global_idx")};
      ${S("")};
      let value = ${y.getByIndices("dataIndices")};
      ${b.setByOffset("global_idx","value")};
      `;return`
      ${g.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(y,_,b)}
      ${g.mainStart()}
        ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${x}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:c}),getShaderSource:f}},_h=e=>me({axis:e.axis}),bh=(e,t)=>{let r=e.inputs;hl(r),e.compute(fl(e.inputs,t))}}),ml,$h,wh,Ay=P(()=>{re(),ae(),ne(),ml=(e,t,r,i,a,n,s,u,l)=>{let p=[{type:12,data:n},{type:12,data:i},{type:12,data:a},{type:12,data:r},{type:12,data:s},{type:12,data:u},{type:12,data:l}],c=[n];p.push(...ee(t.dims,c));let f=g=>{let y=N("indices_data",t.dataType,t.dims.length),_=Y("input_slice_offsets_data",12,1,1),b=[y,_],S=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:a.length},{name:"sizes_from_slice_dims_data",type:"u32",length:r.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${g.registerUniforms(S).declareVariables(...b)}
  ${g.mainStart()}
    ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let batch_idx = global_idx / uniforms.num_slices_per_batch;
    let base_offset = batch_idx * uniforms.input_batch_stride;

    let slice_indices_base_offset = global_idx * uniforms.num_slice_dims;
    var relative_slice_offset = 0;
    for (var dim_idx = 0u; dim_idx < uniforms.num_slice_dims; dim_idx ++) {
      var index = i32(indices_data[dim_idx + slice_indices_base_offset].x);
      let input_dim_idx = uniforms.batch_dims + dim_idx;
      if (index < 0) {
        ${a.length===1?"index += i32(uniforms.input_dims);":"index += i32(uniforms.input_dims[input_dim_idx]);"}
      }
      ${r.length===1?"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data);":"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data[dim_idx]);"}
    }

    input_slice_offsets_data[global_idx] =  base_offset + u32(relative_slice_offset);
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${a.length}_${r.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:c,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:p}),getShaderSource:f},{inputs:[t],outputs:[-1]})[0]},$h=(e,t)=>{let r=e.inputs,i=r[0].dims,a=r[0].dataType,n=r[1].dims,s=n[n.length-1],u=O.sizeToDimension(n,n.length-1),l=O.sizeFromDimension(i,t.batchDims+s),p=O.sizeToDimension(i,t.batchDims),c=O.sizeFromDimension(i,t.batchDims),f=u/p,g=new Array(s),y=l;for(let k=0;k<s;++k)g[s-1-k]=y,y*=i[t.batchDims+s-1-k];let _=ml(e,r[1],g,t.batchDims,i,u,f,c,s),b=t.batchDims+s;if(b>i.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let S=n.slice(0,-1).concat(i.slice(b)),x=O.size(S),$=[{type:12,data:x},{type:12,data:l},...ee(r[0].dims,_.dims,S)],T=k=>{let C=N("data",r[0].dataType,r[0].dims.length),z=N("slice_offsets",12,_.dims.length),A=Y("output",r[0].dataType,S.length);return`
          ${k.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(C,z,A)}
            ${k.mainStart()}
            ${k.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:S,dataType:a}],dispatchGroup:{x:Math.ceil(x/64)},programUniforms:$}),getShaderSource:T},{inputs:[r[0],_]})},wh=e=>({batchDims:e.batch_dims,cacheKey:""})}),gl,yl,vh,xh,Oy=P(()=>{re(),ae(),Se(),ne(),gl=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let r=O.normalizeAxis(t.quantizeAxis,e[0].dims.length),i=t.blockSize,a=e[0],n=e[2],s=e.length===4?e[3]:void 0;if(n.dims.length!==a.dims.length||!a.dims.map((u,l)=>l===r?Math.ceil(u/i)===n.dims[l]:u===n.dims[l]).reduce((u,l)=>u&&l,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(s){if(s.dataType!==a.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(s.dims.length!==n.dims.length||!s.dims.map((u,l)=>u===n.dims[l]).reduce((u,l)=>u&&l,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},yl=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r.length,n=O.normalizeAxis(t.gatherAxis,a),s=O.normalizeAxis(t.quantizeAxis,a),u=r.slice(0);u.splice(n,1,...i);let l=O.size(u),p=e[2].dataType,c=e[0].dataType===22,f=[{type:12,data:l},{type:12,data:s},{type:12,data:n},{type:12,data:t.blockSize},...ee(...e.map((y,_)=>y.dims),u)],g=y=>{let _=N("data",e[0].dataType,e[0].dims.length),b=N("inputIndices",e[1].dataType,e[1].dims.length),S=N("scales",e[2].dataType,e[2].dims.length),x=e.length>3?N("zeroPoint",e[3].dataType,e[3].dims.length):void 0,$=Y("output",p,u.length),T=[_,b,S];x&&T.push(x);let k=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${y.registerUniforms(k).declareVariables(...T,$)}
        ${y.mainStart()}
        let output_indices = ${$.offsetToIndices("global_idx")};
        var indices_indices = ${b.type.indices}(0);
        ${i.length>1?`
          for (var i: u32 = 0; i < ${i.length}; i++) {
            let index = ${$.indicesGet("output_indices","uniforms.gather_axis + i")};
            ${b.indicesSet("indices_indices","i","index")};
          }`:`indices_indices = ${$.indicesGet("output_indices","uniforms.gather_axis")};`};
        var data_indices = ${_.type.indices}(0);
        for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
          let index = ${$.indicesGet("output_indices","i")};
          ${_.indicesSet("data_indices","i","index")};
        }
        var index_from_indices = ${b.getByIndices("indices_indices")};
        if (index_from_indices < 0) {
          index_from_indices += ${r[n]};
        }
        ${_.indicesSet("data_indices","uniforms.gather_axis","u32(index_from_indices)")};
        for (var i = uniforms.gather_axis + 1; i < ${u.length}; i++) {
          let index = ${$.indicesGet("output_indices",`i + ${i.length} - 1`)};
          ${_.indicesSet("data_indices","i","index")};
        }
        let data_offset = ${_.indicesToOffset("data_indices")};
        let data_index = data_offset % 8;
        // Convert 4-bit packed data to 8-bit packed data.
        let packed_4bit_quantized_data = ${_.getByOffset("data_offset / 8")};
        let packed_8bit_quantized_data = (packed_4bit_quantized_data >> (4 * (data_index % 2))) & 0x0f0f0f0f;
        let quantized_data_vec = ${c?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_quantized_data));
        let quantized_data = quantized_data_vec[data_index / 2];
        var scale_indices = data_indices;
        let quantize_axis_index = ${S.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
        ${S.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
        var scale = ${S.getByIndices("scale_indices")};
        ${x?`
              let zero_point_indices = scale_indices;
              let zero_point_offset = ${x.indicesToOffset("zero_point_indices")};
              let zero_point_index = zero_point_offset % 8;
              let packed_4bit_zero_points = ${x.getByOffset("zero_point_offset / 8")};
              let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
              let zero_point_vec = ${c?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${Ae(p)}(quantized_data - zero_point) * scale;
        ${$.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((y,_)=>_!==1).map(y=>y.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(y,_)=>"rank")},getRunData:()=>({outputs:[{dims:u,dataType:p}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:f}),getShaderSource:g}},vh=(e,t)=>{let r=e.inputs;gl(r,t),e.compute(yl(e.inputs,t))},xh=e=>me({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),_l,bl,Sh,kh,Ry=P(()=>{re(),ae(),Se(),ne(),_l=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},bl=(e,t)=>{let r=e[0].dims,i=e[0].dataType,a=r.length,n=e[1].dims,s=e[1].dataType,u=O.normalizeAxis(t.axis,a),l=r[u],p=n.slice(0),c=O.size(p),f=N("input",i,a),g=N("indicesInput",s,n.length),y=Y("output",i,p.length),_=[{type:12,data:c},{type:6,data:l},{type:12,data:u}];return _.push(...ee(r,n,p)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:p,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:_}),getShaderSource:b=>`
      ${b.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(f,g,y)}
      ${b.mainStart()}
      ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

      let outputIndices = ${y.offsetToIndices("global_idx")};

      var idx = ${g.getByOffset("global_idx")};
      if (idx < 0) {
        idx = idx + uniforms.axisDimLimit;
      }
      var inputIndices = ${f.type.indices}(outputIndices);
      ${f.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
      let value = ${f.getByIndices("inputIndices")};

      ${y.setByOffset("global_idx","value")};
  }`}},Sh=e=>me({axis:e.axis}),kh=(e,t)=>{let r=e.inputs;_l(r),e.compute(bl(e.inputs,t))}}),$l,wl,Ih,Th,By=P(()=>{re(),ae(),ne(),$l=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},wl=(e,t)=>{let r=e[0].dims.slice(),i=e[1].dims.slice(),[a,n,s]=Sp.getShapeOfGemmResult(r,t.transA,i,t.transB,e.length===3?e[2].dims:void 0),u=[a,n];if(!u)throw new Error("Can't use gemm on the given tensors");let l=16,p=Math.ceil(n/l),c=Math.ceil(a/l),f=!0,g=O.size(u),y=[{type:12,data:f?p:g},{type:12,data:a},{type:12,data:n},{type:12,data:s},{type:1,data:t.alpha},{type:1,data:t.beta}],_=["type","type"];e.length===3&&(y.push(...ee(e[2].dims)),_.push("rank")),y.push(...ee(u));let b=x=>{let $="";t.transA&&t.transB?$="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?$="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?$="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&($="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let T=t.alpha===1?"":"value *= uniforms.alpha;",k=N("a",e[0].dataType,e[0].dims),C=N("b",e[1].dataType,e[1].dims),z=k.type.value,A=null,v=[k,C];e.length===3&&(A=N("c",e[2].dataType,e[2].dims.length),v.push(A));let M=Y("output",e[0].dataType,u.length);v.push(M);let D=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${x.registerUniforms(D).declareVariables(...v)}

  ${x.mainStart()}
    ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${z}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${$}
    }

    ${T}
    ${A!=null?`let cOffset = ${A.broadcastedIndicesToOffset("vec2(m, n)",M)}; value += ${z}(uniforms.beta) * ${A.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},S=x=>{let $=N("a",e[0].dataType,e[0].dims),T=N("b",e[1].dataType,e[1].dims),k=null,C=[$,T];e.length===3&&(k=N("c",e[2].dataType,e[2].dims.length),C.push(k));let z=Y("output",e[0].dataType,u.length);C.push(z);let A=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],v="",M="";t.transA&&t.transB?(M=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${$.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${T.type.value}(0);
      }
      `,v="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(M=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${$.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${T.type.value}(0);
      }
      `,v="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(M=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${$.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${T.type.value}(0);
      }
      `,v="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(M=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${$.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${T.type.value}(0);
      }
      `,v="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let D=t.alpha===1?"":"value *= uniforms.alpha;";return`
  ${x.registerUniforms(A).declareVariables(...C)}
  var<workgroup> tile_a: array<array<${$.type.storage}, ${l}>, ${l}>;
  var<workgroup> tile_b: array<array<${T.type.storage}, ${l}>, ${l}>;
  ${x.mainStart([l,l,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${l};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${l};
    let num_tiles = (uniforms.K - 1) / ${l} + 1;
    var k_start = 0u;
    var value = ${z.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${M}
      k_start = k_start + ${l};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${l}; k++) {
        ${v}
      }
      workgroupBarrier();
    }

    ${D}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${k!=null?`let cOffset = ${k.broadcastedIndicesToOffset("vec2(m, n)",z)}; value += ${z.type.value}(uniforms.beta) * ${k.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return f?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:u,dataType:e[0].dataType}],dispatchGroup:{x:p*c},programUniforms:y}),getShaderSource:S}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:u,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:y}),getShaderSource:b}},Ih=e=>{let t=e.transA,r=e.transB,i=e.alpha,a=e.beta;return{transA:t,transB:r,alpha:i,beta:a,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},Th=(e,t)=>{$l(e.inputs),e.compute(wl(e.inputs,t))}}),nt,pt,Et,zt,vl,xl,Sl,kl,Il,Tl,Cl,El,Ch,Eh,Ny=P(()=>{re(),ae(),Se(),ne(),[nt,pt,Et,zt]=[0,1,2,3],vl=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},xl=`
  fn gs_get_cubic_coeffs(x: f32) -> vec4<f32> {
    let cubic_alpha = -0.75f;
    let x_abs = abs(x);
    var coeffs: vec4<f32>;
    coeffs[0] = (((cubic_alpha * (x_abs + 1) - 5 * cubic_alpha) * (x_abs + 1) + 8 * cubic_alpha) * (x_abs + 1) - 4 * cubic_alpha);
    coeffs[1] = (((cubic_alpha + 2) * x_abs - (cubic_alpha + 3)) * x_abs * x_abs + 1);
    coeffs[2] = (((cubic_alpha + 2) * (1 - x_abs) - (cubic_alpha + 3)) * (1 - x_abs) * (1 - x_abs) + 1);
    coeffs[3] = (((cubic_alpha * (2 - x_abs) - 5 * cubic_alpha) * (2 - x_abs) + 8 * cubic_alpha) * (2 - x_abs) - 4 * cubic_alpha);
    return coeffs;
  }
`,Sl=e=>`
  fn gs_bicubic_interpolate(p: mat4x4<${e}>, x: f32, y: f32) -> ${e} {
    var v: vec4<f32>;
    var coeffs = gs_get_cubic_coeffs(x);
    for (var i = 0; i < 4; i++) {
      v[i] = coeffs[0] * p[i][0] + coeffs[1] * p[i][1] + coeffs[2] * p[i][2] + coeffs[3] * p[i][3];
    }
    coeffs = gs_get_cubic_coeffs(y);
    let pixel = ${e}(coeffs[0] * v[0] + coeffs[1] * v[1] + coeffs[2] * v[2] + coeffs[3] * v[3]);
    return pixel;
  }
`,kl=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,Il=e=>`
  ${e.paddingMode==="reflection"?`
      fn gs_reflect(x: i32, x_min: f32, x_max: f32) -> u32 {
        var dx = 0.0;
        var fx = f32(x);
        let range = x_max - x_min;
        if (fx < x_min) {
          dx = x_min - fx;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_min + r;
          } else {
            fx = x_max - r;
          }
        } else if (fx > x_max) {
          dx = fx - x_max;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_max - r;
          } else {
            fx = x_min + r;
          }
        }
        return u32(fx);
      }`:""}
`,Tl=(e,t,r)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${nt}] = batch;
     indices[${pt}] = channel;`+(()=>{switch(r.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${Et}] = u32(r);
            indices[${zt}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${Et}] = u32(clamp(r, 0, H - 1));
          indices[${zt}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${Et}] = gs_reflect(r, border[1], border[3]);
          indices[${zt}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${r.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,Cl=(e,t,r)=>(()=>{switch(r.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${nt}], indices[${pt}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${nt}], indices[${pt}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${nt}], indices[${pt}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${nt}], indices[${pt}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${nt}], indices[${pt}], border);

          let dx2 = ${t}(f32(x2) - x);
          let dx1 = ${t}(x - f32(x1));
          let dy2 = ${t}(f32(y2) - y);
          let dy1 = ${t}(y - f32(y1));
          let result = dy2 * (dx2 * p11 + dx1 * p12) + dy1 * (dx2 * p21 + dx1 * p22);
        `;case"bicubic":return`
          let x0 = i32(floor(x)) - 1;
          let y0 = i32(floor(y)) - 1;
          var p: mat4x4<${t}>;
          for (var h = 0; h < 4; h++) {
            for (var w = 0; w < 4; w++) {
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${nt}], indices[${pt}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${r.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,El=(e,t)=>{let r=N("x",e[0].dataType,e[0].dims.length),i=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],a=N("grid",e[1].dataType,i.length,2),n=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(n=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[nt,pt,Et,zt]=[0,3,1,2]);let s=Y("output",e[0].dataType,n.length),u=r.type.value,l=O.size(n),p=[{type:12,data:l},...ee(e[0].dims,i,n)],c=f=>`
  ${f.registerUniform("output_size","u32").declareVariables(r,a,s)}
  ${xl}
  ${Sl(u)}
  ${kl(t)}
  ${Il(t)}
  ${Tl(r,u,t)}

  ${f.mainStart()}
    ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${Et}]);
      let W_in = i32(uniforms.x_shape[${zt}]);

      ${t.alignCorners===0?`
      let x_min = -0.5;
      let x_max = f32(W_in) - 0.5;
      let y_min = -0.5;
      let y_max = f32(H_in) - 0.5;
      `:`
      let x_min = 0.0;
      let x_max = f32(W_in) - 1.0;
      let y_min = 0.0;
      let y_max = f32(H_in) - 1.0;
      `};
      let border = vec4<f32>(x_min, y_min, x_max, y_max);

      let indices = ${s.offsetToIndices("global_idx")};
      var grid_indices = vec3<u32>(indices[${nt}], indices[${Et}], indices[${zt}]);
      let nxy = ${a.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${Cl(s,u,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:f=>{let g=O.size(n);return{outputs:[{dims:n,dataType:f[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:p}},getShaderSource:c}},Ch=(e,t)=>{vl(e.inputs),e.compute(El(e.inputs,t))},Eh=e=>me({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),Be,zl,zh,aa,Al,gr,Ah,Oh=P(()=>{re(),ae(),Se(),en(),an(),ne(),St(),Be=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,zl=(e,t)=>{let r=e[0],i=Be(e,1),a=Be(e,2),n=Be(e,3),s=Be(e,4),u=Be(e,5),l=Be(e,6),p=Be(e,7);if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let c=r.dims[0],f=r.dims[1],g=r.dims.length===3?r.dims[2]:t.numHeads*r.dims[4],y=f,_=0,b=0,S=Math.floor(g/t.numHeads);if(l&&p&&O.size(l.dims)&&O.size(p.dims)){if(l.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(l.dims[0]!==c||l.dims[1]!==t.numHeads||l.dims[3]!==S)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(p.dims[0]!==c||p.dims[1]!==t.numHeads||p.dims[3]!==S)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(l.dims[2]!==p.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(p.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');_=l.dims[2],b=l.dims[2]}else if(l&&O.size(l.dims)||p&&O.size(p.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let x;if(i&&O.size(i.dims)>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(i.dims[2]!==r.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');x=2,y=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==S)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw new Error('Expect "value" be none when "key" has packed kv format.');x=5,y=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==S)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');x=0,y=i.dims[2]}}else{if(r.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(r.dims[2]!==t.numHeads||r.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');x=3}if(n&&O.size(n.dims)>0){if(n.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(i&&i.dims.length===5&&i.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let $=_+y,T=0;if(s&&O.size(s.dims)>0){T=8;let A=s.dims;throw A.length===1?A[0]===c?T=1:A[0]===3*c+2&&(T=3):A.length===2&&A[0]===c&&A[1]===$&&(T=5),T===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let k=!1,C=g;if(a&&O.size(a.dims)>0){if(a.dims.length!==3&&a.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==a.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(a.dims.length===3){if(y!==a.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');C=a.dims[2]}else{if(y!==a.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');C=a.dims[1]*a.dims[3],k=!0}}let z=!1;if(s&&O.size(s.dims)>0)throw new Error("Key padding mask is not supported");if(u&&O.size(u.dims)>0){if(u.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(u.dims[0]!==c||u.dims[1]!==t.numHeads||u.dims[2]!==f||u.dims[3]!==$)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:c,sequenceLength:f,pastSequenceLength:_,kvSequenceLength:y,totalSequenceLength:$,maxSequenceLength:b,inputHiddenSize:0,hiddenSize:g,vHiddenSize:C,headSize:S,vHeadSize:Math.floor(C/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:T,scale:t.scale,broadcastResPosBias:z,passPastInKv:k,qkvFormat:x}},zh=e=>me({...e}),aa=me({perm:[0,2,1,3]}),Al=(e,t,r,i,a,n,s)=>{let u=[i,a,n],l=O.size(u),p=[{type:12,data:l},{type:12,data:s},{type:12,data:n}],c=f=>{let g=Y("qkv_with_bias",t.dataType,u),y=N("qkv",t.dataType,u),_=N("bias",r.dataType,u),b=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${f.registerUniforms(b).declareVariables(y,_,g)}
  ${f.mainStart()}
    ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:u,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:p}),getShaderSource:c},{inputs:[t,r],outputs:[-1]})[0]},gr=(e,t,r,i,a,n,s,u)=>{let l=n;if(s&&O.size(s.dims)>0){if(i===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return l=Al(e,n,s,t,i,r*a,u),l=l.reshape([t,i,r,a]),r===1||i===1?l:e.compute(Ve(l,aa.perm),{inputs:[l],outputs:[-1]})[0]}else return n.dims.length===3&&(l=n.reshape([t,i,r,a])),r===1||i===1?l:e.compute(Ve(l,aa.perm),{inputs:[l],outputs:[-1]})[0]},Ah=(e,t)=>{let r=zl(e.inputs,t),i=e.inputs[0],a=Be(e.inputs,1),n=Be(e.inputs,2),s=Be(e.inputs,3),u=Be(e.inputs,4),l=Be(e.inputs,5),p=Be(e.inputs,6),c=Be(e.inputs,7);if(i.dims.length===5)throw new Error("Packed QKV is not implemented");if((a==null?void 0:a.dims.length)===5)throw new Error("Packed KV is not implemented");let f=a&&n&&a.dims.length===4&&n.dims.length===4,g=gr(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,i,s,0);if(f)return br(e,g,a,n,u,void 0,p,c,l,r);if(!a||!n)throw new Error("key and value must be provided");let y=gr(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.headSize,a,s,r.hiddenSize),_=gr(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.vHeadSize,n,s,2*r.hiddenSize);br(e,g,y,_,u,void 0,p,c,l,r)}}),Ol,Rl,Bl,Nl,Da,Rh,Bh,Nh=P(()=>{re(),ae(),Se(),ne(),Ol=e=>{if(!e||e.length<1)throw new Error("too few inputs")},Rl=(e,t)=>{let r=[],i=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(a=>r.push(Number(a))),i=r.length),me({numOutputs:i,axis:t.axis,splitSizes:r})},Bl=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${J("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,Nl=e=>{let t=e.length,r=[];for(let i=0;i<t;++i){let a=e[i].setByIndices("indices","input[global_idx]");t===1?r.push(a):i===0?r.push(`if (output_number == ${i}u) { ${a} }`):i===t-1?r.push(`else { ${a} }`):r.push(`else if (output_number == ${i}) { ${a} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${r.join(`
`)}
      }`},Da=(e,t)=>{let r=e[0].dims,i=O.size(r),a=e[0].dataType,n=O.normalizeAxis(t.axis,r.length),s=new Array(t.numOutputs),u=N("input",a,r.length),l=new Array(t.numOutputs),p=[],c=[],f=0,g=[{type:12,data:i}];for(let _=0;_<t.numOutputs;_++){f+=t.splitSizes[_],l[_]=f;let b=r.slice();b[n]=t.splitSizes[_],c.push(b),s[_]=Y(`output${_}`,a,b.length),p.push({dims:c[_],dataType:e[0].dataType})}g.push({type:12,data:l},...ee(r,...c));let y=_=>`
  ${_.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",l.length).declareVariables(u,...s)}
  ${Bl(l.length)}
  ${Nl(s)}

  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${u.offsetToIndices("global_idx")};
    var index = ${u.indicesGet("indices",n)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${J("uniforms.size_in_split_axis","output_number - 1u",l.length)};
      ${u.indicesSet("indices",n,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:y,getRunData:()=>({outputs:p,dispatchGroup:{x:Math.ceil(i/64)},programUniforms:g})}},Rh=(e,t)=>{Ol(e.inputs);let r=e.inputs.length===1?t:Rl(e.inputs,t);e.compute(Da(e.inputs,r),{inputs:[0]})},Bh=e=>{let t=e.axis,r=e.splitSizes,i=e.numOutputs<0?r.length:e.numOutputs;if(i!==r.length)throw new Error("numOutputs and splitSizes length must be equal");return me({axis:t,numOutputs:i,splitSizes:r})}}),Ml,ei,Mh,Dh=P(()=>{re(),ae(),Se(),ne(),Ml=(e,t)=>{let[r,i,a,n]=e,{numHeads:s,rotaryEmbeddingDim:u}=t;if(r.dims.length!==3&&r.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${r.dims.length}`);if(!O.areEqual(i.dims,[])&&!O.areEqual(i.dims,[1])&&i.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${i.dims.length}`);if(a.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${a.dims.length}`);if(n.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${n.dims.length}`);if(!O.areEqual(a.dims,n.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(u>0&&s===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let l=r.dims[0],p=r.dims[r.dims.length-2],c=a.dims[0],f=O.sizeFromDimension(r.dims,1)/p,g=u===0?a.dims[1]*2:f/s;if(u>g)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(i.dims.length===2){if(l!==i.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${i.dims[0]}`);if(p!==i.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${i.dims[1]}`)}if(p>c)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported");if(g/2!==a.dims[1]&&u/2!==a.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${a.dims[1]}`)},ei=(e,t)=>{let{interleaved:r,numHeads:i,rotaryEmbeddingDim:a,scale:n}=t,s=e[0].dims[0],u=O.sizeFromDimension(e[0].dims,1),l=e[0].dims[e[0].dims.length-2],p=u/l,c=e[2].dims[1],f=a===0?c*2:p/i,g=new Array(s,l,p/f,f-c),y=O.computeStrides(g),_=[{type:1,data:n},{type:12,data:g},{type:12,data:y},...e[0].dims.length===3?new Array({type:12,data:[u,p,f,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[u,f,l*f,1]}):[],...ee(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],b=S=>{let x=N("input",e[0].dataType,e[0].dims.length),$=N("position_ids",e[1].dataType,e[1].dims.length),T=N("cos_cache",e[2].dataType,e[2].dims.length),k=N("sin_cache",e[3].dataType,e[3].dims.length),C=Y("output",e[0].dataType,e[0].dims.length);return S.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:g.length},{name:"global_strides",type:"u32",length:y.length},{name:"input_output_strides",type:"u32",length:y.length}]),`
        ${S.declareVariables(x,$,T,k,C)}

        ${S.mainStart(Xt)}
          let half_rotary_emb_dim = uniforms.${T.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${S.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${$.broadcastedIndicesToOffset("bsnh.xy",Y("",$.type.tensor,2))};
            let position_id =
                u32(${$.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${r});
            let j = i + select(half_rotary_emb_dim, 1, ${r});
            let re = ${x.getByOffset("i")} * ${T.get("position_id","bsnh[3]")} -
                ${x.getByOffset("j")} * ${k.get("position_id","bsnh[3]")};
            ${C.setByOffset("i","re")}
            let im = ${x.getByOffset("i")} * ${k.get("position_id","bsnh[3]")} +
                ${x.getByOffset("j")} * ${T.get("position_id","bsnh[3]")};
            ${C.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${C.setByOffset("k",x.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:me({interleaved:r}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:b,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(O.size(g)/Xt)},programUniforms:_})}},Mh=(e,t)=>{Ml(e.inputs,t),e.compute(ei(e.inputs,t))}}),Dl,Pl,na,Ul,Ph,My=P(()=>{Se(),re(),an(),Oh(),Nh(),St(),Dh(),ne(),Dl=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let r=e[0],i=e[1],a=e[2],n=e[3],s=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let u=!1,l=r.dims[0],p=r.dims[1],c=r.dims.length===3?u?r.dims[2]/3:r.dims[2]:t.numHeads*r.dims[4],f=p,g=0,y=!i||i.dims.length===0,_=Math.floor(y?c/(t.numHeads+2*t.kvNumHeads):c/t.numHeads);y&&(c=_*t.numHeads);let b=n&&n.dims.length!==0,S=s&&s.dims.length!==0;if(b&&n.dims.length===4&&n.dims[0]===l&&n.dims[1]!==t.kvNumHeads&&n.dims[2]===t.kvNumHeads&&n.dims[3]===_)throw new Error("BSNH pastKey/pastValue is not supported");if(b&&S){if(n.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');g=n.dims[2]}else if(b||S)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let x=1;if(i&&i.dims.length>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(r.dims[2]%i.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');f=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==_)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw new Error('Expect "value" be none when "key" has packed kv format.');f=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==_)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');f=i.dims[2]}}else{if(r.dims.length!==3&&r.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(r.dims.length===5&&(r.dims[2]!==t.numHeads||r.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');x=3}let $=0,T=!1,k=t.kvNumHeads?_*t.kvNumHeads:c;if(a&&a.dims.length>0){if(a.dims.length!==3&&a.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==a.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(a.dims.length===3){if(f!==a.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');k=a.dims[2]}else{if(f!==a.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');k=a.dims[1]*a.dims[3],T=!0}}let C=e.length>4?e[5]:void 0;if(C){if(C.dims.length===0)throw new Error("seqlens_k must be at least 1D, got scalar.");let z=C.dims.reduce((A,v)=>A*v,1);if(z!==l)throw new Error(`seqlens_k must have batch_size (${l}) elements, got ${z}.`);for(let A=0;A<C.dims.length;A++)if(C.dims[A]!==1&&C.dims[A]!==l)throw new Error(`seqlens_k has unexpected shape. Each dimension must be 1 or batch_size (${l}), got dims[${A}] = ${C.dims[A]}.`)}return{batchSize:l,sequenceLength:p,pastSequenceLength:g,kvSequenceLength:f,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:c,vHiddenSize:k,headSize:_,vHeadSize:Math.floor(k/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:$,scale:t.scale,broadcastResPosBias:!1,passPastInKv:T,qkvFormat:x}},Pl=me({perm:[0,2,1,3]}),na=(e,t,r)=>{let i=t,a=r.kvNumHeads;return t.dims.length===3&&r.kvSequenceLength!==0&&(i=t.reshape([r.batchSize,r.kvSequenceLength,a,r.headSize]),i=e.compute(Ve(i,Pl.perm),{inputs:[i],outputs:[-1]})[0]),i},Ul=(e,t,r,i)=>{let a=7,n=["type","type"],s=[e*t],u=e*t,l=[{type:12,data:u},{type:12,data:t},{type:12,data:e}],p=c=>{let f=N("seq_lens",r.dataType,r.dims),g=N("total_seq_lens",i.dataType,i.dims),y=Y("pos_ids",a,s),_=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
  ${c.registerUniforms(_).declareVariables(f,g,y)}
  ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let total_sequence_length = u32(${g.getByOffset("0")});
    let is_subsequent_prompt = uniforms.sequence_length > 1 && uniforms.sequence_length != total_sequence_length;
    let is_first_prompt = !is_subsequent_prompt && uniforms.sequence_length == total_sequence_length;
    let batch_idx = global_idx / uniforms.sequence_length;
    let sequence_idx = i32(global_idx % uniforms.sequence_length);
    var pos_id: i32 = 0;
    let seqlen = ${f.getByOffset("batch_idx")};
    let total_seqlen = seqlen + 1;
    if (is_first_prompt) {
      if (sequence_idx < total_seqlen) {
        pos_id = sequence_idx;
      } else {
        pos_id = 1;
      }
      ${y.setByOffset("global_idx","pos_id")}
    } else if (is_subsequent_prompt) {
      let past_seqlen = total_seqlen - i32(uniforms.sequence_length);
      if (past_seqlen + sequence_idx < total_seqlen) {
        pos_id = past_seqlen + sequence_idx;
      } else {
        pos_id = 1;
      }
      ${y.setByOffset("global_idx","pos_id")}
    } else if (global_idx < uniforms.batch_size) {
      ${y.setByOffset("global_idx","seqlen")}
    };
  }
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:n},getRunData:()=>({outputs:[{dims:s,dataType:a}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l}),getShaderSource:p}},Ph=(e,t)=>{var k;let r=Dl(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(((k=e.inputs[1])==null?void 0:k.dims.length)===5)throw new Error("Packed KV is not implemented");let i=e.inputs[0],a=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,n=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,s=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,u=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,l=e.inputs.length>4?e.inputs[5]:void 0,p=e.inputs.length>5?e.inputs[6]:void 0,c=r.kvNumHeads?r.kvNumHeads:r.numHeads,f=me({axis:2,numOutputs:3,splitSizes:[r.numHeads*r.headSize,c*r.headSize,c*r.headSize]}),[g,y,_]=!a&&!n?e.compute(Da([i],f),{inputs:[i],outputs:[-1,-1,-1]}):[i,a,n],b,S;if(t.doRotary){let C=e.compute(Ul(r.batchSize,r.sequenceLength,l,p),{inputs:[l,p],outputs:[-1]})[0],z=e.inputs[7],A=e.inputs[8],v=me({interleaved:t.rotaryInterleaved!==0,numHeads:r.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),M=[g,C,z,A],D=[-1];b=e.compute(ei(M,v),{inputs:M,outputs:D})[0],M.splice(0,1,y);let F=me({interleaved:t.rotaryInterleaved!==0,numHeads:r.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});S=e.compute(ei(M,F),{inputs:M,outputs:D})[0]}let x=gr(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,t.doRotary?b:g,void 0,0),$=na(e,t.doRotary?S:y,r),T=na(e,_,r);br(e,x,$,T,void 0,void 0,s,u,void 0,r,l,p)}}),sa,ql,Ll,Uh,Dy=P(()=>{re(),ae(),St(),ne(),sa=(e,t,r,i,a,n,s,u)=>{let l=xe(n),p=l===1?"f32":`vec${l}f`,c=l===1?"vec2f":`mat2x${l}f`,f=a*s,g=64;f===1&&(g=256);let y=[a,s,n/l],_=[a,s,2],b=["rank","type","type"],S=[];S.push(...ee(y,_));let x=$=>{let T=N("x",t.dataType,3,l),k=N("scale",r.dataType,r.dims),C=N("bias",i.dataType,i.dims),z=Y("output",1,3,2),A=[T,k,C,z];return`
  var<workgroup> workgroup_shared : array<${c}, ${g}>;
  const workgroup_size = ${g}u;
  ${$.declareVariables(...A)}
  ${$.mainStart(g)}
    let batch = workgroup_index / uniforms.x_shape[1];
    let channel = workgroup_index % uniforms.x_shape[1];
    let hight = uniforms.x_shape[2];
    // initialize workgroup memory
    var sum = ${p}(0);
    var squared_sum = ${p}(0);
    for (var h = local_idx; h < hight; h += workgroup_size) {
      let value = ${p}(${T.get("batch","channel","h")});
      sum += value;
      squared_sum += value * value;
    }
    workgroup_shared[local_idx] = ${c}(sum, squared_sum);
    workgroupBarrier();

    for (var currSize = workgroup_size >> 1;  currSize > 0; currSize = currSize >> 1) {
      if (local_idx < currSize) {
        workgroup_shared[local_idx] = workgroup_shared[local_idx] + workgroup_shared[local_idx + currSize];
      }
      workgroupBarrier();
    }
    if (local_idx == 0) {
      let sum_final = ${xt("workgroup_shared[0][0]",l)} / f32(hight * ${l});
      let squared_sum_final = ${xt("workgroup_shared[0][1]",l)} / f32(hight * ${l});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${u}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${l};${u};${g}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:_,dataType:1}],dispatchGroup:{x:f},programUniforms:S}),getShaderSource:x},{inputs:[t,r,i],outputs:[-1]})[0]},ql=(e,t,r)=>{let i=t[0].dims,a=i,n=2,s=i[0],u=i[1],l=O.sizeFromDimension(i,n),p=xe(l),c=O.size(a)/p,f=sa(e,t[0],t[1],t[2],s,l,u,r.epsilon),g=[s,u,l/p],y=[s,u],_=["type","none"],b=S=>{let x=N("x",t[0].dataType,g.length,p),$=N("scale_shift",1,y.length,2),T=Y("output",t[0].dataType,g.length,p),k=[x,$,T];return`
  ${S.registerUniform("output_size","u32").declareVariables(...k)}
  ${S.mainStart()}
  ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${T.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${$.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${x.getByOffset("global_idx")} * ${T.type.value}(scale_shift.x) + ${T.type.value}(scale_shift.y);
      ${T.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${p}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:[{type:12,data:c},...ee(g,y,g)]}),getShaderSource:b},{inputs:[t[0],f]})},Ll=(e,t,r)=>{let i=t[0].dims,a=i,n=i[0],s=i[i.length-1],u=O.sizeFromDimension(i,1)/s,l=xe(s),p=O.size(a)/l,c=[{type:12,data:u},{type:12,data:Math.floor(s/l)}],f=["type","type"],g=!1,y=[0,i.length-1];for(let x=0;x<i.length-2;x++)g=g||i[x+1]!==1,y.push(x+1);g=g&&i[i.length-1]!==1;let _=g?e.compute(Ve(e.inputs[0],y),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:i.length},(x,$)=>i[y[$]])),b=sa(e,_,t[1],t[2],n,u,s,r.epsilon),S=x=>{let $=Ce(t[0].dataType),T=l===1?"vec2f":`mat${l}x2f`,k=A=>{let v=A===0?"x":"y",M=l===1?"f32":`vec${l}f`;switch(l){case 1:return`${$}(${M}(scale.${v}))`;case 2:return`vec2<${$}>(${M}(scale[0].${v}, scale[1].${v}))`;case 4:return`vec4<${$}>(${M}(scale[0].${v}, scale[1].${v}, scale[2].${v}, scale[3].${v}))`;default:throw new Error(`Not supported compoents ${l}`)}},C=N("input",t[0].dataType,t[0].dims,l),z=Y("output",t[0].dataType,a,l);return`
  @group(0) @binding(0) var<storage, read> input : array<${C.type.storage}>;
  @group(0) @binding(1) var<storage, read> scale_input : array<${T}>;
  @group(0) @binding(2) var<storage, read_write> output : array<${z.type.storage}>;
  struct Uniforms {H: u32, C : u32};
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;

  ${x.mainStart()}
    let current_image_number = global_idx / (uniforms.C * uniforms.H);
    let current_channel_number = global_idx % uniforms.C;

    let scale_offset = current_image_number * uniforms.C + current_channel_number;
    let scale = scale_input[scale_offset];
    output[global_idx] = fma(input[global_idx], ${k(0)}, ${k(1)});
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${l}`,inputDependencies:f},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:c}),getShaderSource:S},{inputs:[t[0],b]})},Uh=(e,t)=>{t.format==="NHWC"?Ll(e,e.inputs,t):ql(e,e.inputs,t)}}),Wl,Vl,qh,Py=P(()=>{re(),ae(),ne(),Wl=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},Vl=(e,t,r)=>{let i=t.simplified,a=e[0].dims,n=e[1],s=!i&&e[2],u=a,l=O.normalizeAxis(t.axis,a.length),p=O.sizeToDimension(a,l),c=O.sizeFromDimension(a,l),f=O.size(n.dims),g=s?O.size(s.dims):0;if(f!==c||s&&g!==c)throw new Error(`Size of X.shape()[axis:] == ${c}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${f} and bias size of ${g}`);let y=[];for(let C=0;C<a.length;++C)C<l?y.push(a[C]):y.push(1);let _=xe(c),b=["type","type"],S=[{type:12,data:p},{type:1,data:c},{type:12,data:Math.floor(c/_)},{type:1,data:t.epsilon}];s&&b.push("type");let x=r>1,$=r>2,T=C=>{let z=Ce(e[0].dataType),A=[N("x",e[0].dataType,e[0].dims,_),N("scale",n.dataType,n.dims,_)];s&&A.push(N("bias",s.dataType,s.dims,_)),A.push(Y("output",e[0].dataType,u,_)),x&&A.push(Y("mean_data_output",1,y)),$&&A.push(Y("inv_std_output",1,y));let v=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${C.registerUniforms(v).declareVariables(...A)}
  ${C.mainStart()}
    ${C.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${Ca("f32",_)};
    var mean_square_vector = ${Ca("f32",_)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${Kt(z,_,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${xt("mean_vector",_)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${xt("mean_square_vector",_)} / uniforms.norm_size ${i?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${Kt(z,_,"x[j + offset]")};
      let f32scale = ${Kt(z,_,"scale[j]")};
      output[j + offset] = ${A[0].type.value}((f32input ${i?"":"- mean"}) * inv_std_dev * f32scale
        ${s?`+ ${Kt(z,_,"bias[j]")}`:""}
      );
    }

    ${x?"mean_data_output[global_idx] = mean":""};
    ${$?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},k=[{dims:u,dataType:e[0].dataType}];return x&&k.push({dims:y,dataType:1}),$&&k.push({dims:y,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${_};${r};${i}`,inputDependencies:b},getRunData:()=>({outputs:k,dispatchGroup:{x:Math.ceil(p/64)},programUniforms:S}),getShaderSource:T}},qh=(e,t)=>{Wl(e.inputs),e.compute(Vl(e.inputs,t,e.outputCount))}}),Gl,Lh,Uy=P(()=>{ae(),ln(),dn(),Gl=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},Lh=e=>{Gl(e.inputs);let t=Zt.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let r=t[t.length-1],i=e.inputs[0].dims[e.inputs[0].dims.length-1];if(r<8&&i<8)e.compute(un(e.inputs,{activation:""},t));else{let a=t[t.length-2],n=O.size(e.inputs[0].dims.slice(0,-2)),s=O.size(e.inputs[1].dims.slice(0,-2));if(n!==1&&a===1&&s===1){let u=e.inputs[0].reshape([1,n,i]),l=e.inputs[1].reshape([1,i,r]),p=[1,n,r],c=[u,l];e.compute(Jr(c,{activation:""},t,p),{inputs:c})}else e.compute(Jr(e.inputs,{activation:""},t))}}}),Hl,Fl,jl,Wh,Vh,qy=P(()=>{re(),ae(),Se(),ne(),Hl=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let r=e[0],i=r.dims.length;if(r.dims[i-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let a=Math.floor((t.k+t.blockSize-1)/t.blockSize),n=t.blockSize/8*t.bits,s=e[1];if(!O.areEqual(s.dims,[t.n,a,n]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let u=e[2].dims;if(O.size(u)!==t.n*a)throw new Error("scales input size error.");if(e.length===4){let l=e[3].dims,p=t.n*(t.bits===8?a:Math.floor((a*t.bits+7)/8));if(O.size(l)!==p)throw new Error("zeroPoints input size error.")}},Fl=(e,t)=>{let r=e[0].dims,i=r.length,a=r[i-2],n=t.k,s=t.n,u=r.slice(0,i-2),l=O.size(u),p=e[1].dims[2]/4,c=e[0].dataType,f=xe(t.k),g=xe(p),y=xe(s),_=u.concat([a,s]),b=a>1&&s/y%2===0?2:1,S=O.size(_)/y/b,x=64,$=[],T=[l,a,n/f],k=O.convertShape(e[1].dims).slice();k.splice(-1,1,p/g),$.push(...ee(T)),$.push(...ee(k)),$.push(...ee(e[2].dims)),e.length===4&&$.push(...ee(O.convertShape(e[3].dims)));let C=[l,a,s/y];$.push(...ee(C));let z=A=>{let v=T.length,M=N("a",e[0].dataType,v,f),D=N("b",12,k.length,g),F=N("scales",e[2].dataType,e[2].dims.length),j=[M,D,F],K=e.length===4?N("zero_points",12,e[3].dims.length):void 0;K&&j.push(K);let R=C.length,Z=Y("output",e[0].dataType,R,y),X=Ce(e[0].dataType),te=(()=>{switch(f){case 1:return`array<${X}, 8>`;case 2:return`mat4x2<${X}>`;case 4:return`mat2x4<${X}>`;default:throw new Error(`${f}-component is not supported.`)}})(),fe=Math.floor(32/t.bits),V=Math.floor(fe/8),le=()=>{let Q="";for(let q=0;q<V;q++){let ge=q*t.bits*4,Ge=ge+t.bits;Q+=`
          // reuse a data (pass ${q})
            var input_offset${q>0?q:""} = ${q===0?M.indicesToOffset(`${M.type.indices}(batch, row, word_offset)`):"input_offset"};
            var a_data${q>0?q:""}: ${te};
            for (var j${q>0?q:""}: u32 = 0; j${q>0?q:""} < ${8/f}; j${q>0?q:""}++) {
              a_data${q>0?q:""}[j${q>0?q:""}] = ${M.getByOffset(`input_offset${q>0?q:""}`)};
              input_offset${q>0?q:""}++;
            }
          `;for(let ke=0;ke<y*b;ke++)Q+=`
            b_value = ${g===1?`b${ke}_data`:`b${ke}_data[i]`};
            ${t.bits===2?`{
              let half_word = b_value >> ${q*16}u;
              let byte_lo = half_word & 0xFFu;
              let byte_hi = (half_word >> 8u) & 0xFFu;
              let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
              b_value_lower = unpack4xU8(spread_word & b_mask);
              b_value_upper = unpack4xU8((spread_word >> 2u) & b_mask);
            }`:`b_value_lower = unpack4xU8((b_value >> ${ge}u) & b_mask);
            b_value_upper = unpack4xU8((b_value >> ${Ge}u) & b_mask);`}
            b_quantized_values = ${te}(${Array.from({length:4},(Ne,Me)=>`${X}(b_value_lower[${Me}]), ${X}(b_value_upper[${Me}])`).join(", ")});
            b_dequantized_values = ${f===1?`${te}(${Array.from({length:8},(Ne,Me)=>`(b_quantized_values[${Me}] - ${K?`zero_point${ke}`:"zero_point"}) * scale${ke}`).join(", ")});`:`(b_quantized_values - ${te}(${Array(8).fill(`${K?`zero_point${ke}`:"zero_point"}`).join(",")})) * scale${ke};`};
            workgroup_shared[local_id.x * ${b} + ${Math.floor(ke/y)}]${y>1?`[${ke%y}]`:""} += ${Array.from({length:8/f},(Ne,Me)=>`${f===1?`a_data${q>0?q:""}[${Me}] * b_dequantized_values[${Me}]`:`dot(a_data${q>0?q:""}[${Me}], b_dequantized_values[${Me}])`}`).join(" + ")};
          `}return Q},U=()=>{let Q=`
            var col_index = col * ${y};
            ${K?`
            let zero_point_values_per_byte: u32 = ${Math.floor(8/t.bits)}u;
            let zero_point_bytes_per_col = (nBlocksPerCol + zero_point_values_per_byte - 1u) / zero_point_values_per_byte;
            var zero_point_byte_count: u32;
            var zero_point_word_index: u32;
            var zero_point_byte_offset: u32;
            let zero_point_sub_offset: u32 = block % zero_point_values_per_byte;
            var zero_point_bits_offset: u32;
            var zero_point_word: u32;`:`
            // The default zero point is ${Math.pow(2,t.bits-1)} for unsigned ${t.bits}-bit quantization.
            let zero_point = ${X}(${Math.pow(2,t.bits-1).toFixed(1)});`}
            `;for(let q=0;q<y*b;q++)Q+=`
            let scale${q} = ${F.getByOffset("col_index * nBlocksPerCol + block")};
            ${K?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${t.bits}u);
            zero_point_word = ${K.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${q} = ${X}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:""}
            col_index += 1;`;return Q},G=()=>{let Q=`col_index = col * ${y};`;for(let q=0;q<y*b;q++)Q+=`
            let b${q}_data = ${D.getByIndices(`${D.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return Q+=`
            var b_value: u32;
            let b_mask: u32 = ${t.bits===2?"0x03030303u":"0x0F0F0F0Fu"};
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${te};
            var b_dequantized_values: ${te};`,Q};return`
        var<workgroup> workgroup_shared: array<${Z.type.value}, ${b*x}>;
        ${A.declareVariables(...j,Z)}
        ${A.mainStart([x,1,1])}
          let output_indices = ${Z.offsetToIndices(`(global_idx / ${x}) * ${b}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${x}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/f};
            ${U()}
            for (var word: u32 = 0; word < ${p}; word += ${g}) {
              ${G()}
              for (var i: u32 = 0; i < ${g}; i++) {
                ${le()}
                word_offset += ${fe/f};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${b}) {
            var output_value: ${Z.type.value} = ${Z.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${x}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${b};
            }
            ${Z.setByIndices(`${Z.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${f};${g};${y};${b};${x}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:_,dataType:c}],dispatchGroup:{x:S},programUniforms:$}),getShaderSource:z}},jl=(e,t)=>{let r=e[0].dims,i=r.length,a=r[i-2],n=t.k,s=t.n,u=r.slice(0,i-2),l=O.size(u),p=e[1].dims[2]/4,c=e[0].dataType,f=xe(t.k),g=xe(p),y=u.concat([a,s]),_=128,b=s%8===0?8:s%4===0?4:1,S=_/b,x=Math.floor(32/t.bits),$=S*g*x,T=$/f,k=$/t.blockSize,C=O.size(y)/b,z=[],A=[l,a,n/f],v=O.convertShape(e[1].dims).slice();v.splice(-1,1,p/g),z.push(...ee(A)),z.push(...ee(v)),z.push(...ee(e[2].dims)),e.length===4&&z.push(...ee(O.convertShape(e[3].dims)));let M=[l,a,s];z.push(...ee(M));let D=F=>{let j=A.length,K=N("a",e[0].dataType,j,f),R=N("b",12,v.length,g),Z=N("scales",e[2].dataType,e[2].dims.length),X=[K,R,Z],te=e.length===4?N("zero_points",12,e[3].dims.length):void 0;te&&X.push(te);let fe=M.length,V=Y("output",e[0].dataType,fe),le=Ce(e[0].dataType),U=()=>{switch(f){case 1:return`
          let a_data0 = vec4<${le}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${le}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${le}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${le}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${f}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${K.type.value}, ${T}>;
        var<workgroup> inter_results: array<array<${V.type.value}, ${S}>, ${b}>;
        ${F.declareVariables(...X,V)}
        ${F.mainStart([S,b,1])}
          let output_indices = ${V.offsetToIndices(`workgroup_index * ${b}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let n_blocks_per_col = uniforms.b_shape[1];
          let num_tiles =  (n_blocks_per_col - 1) / ${k} + 1;

          // Loop over shared dimension.
          for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
            let a_col_start = tile * ${T};
            // load one tile A data into shared memory.
            for (var a_offset = local_idx; a_offset < ${T}; a_offset += ${_})
            {
              let a_col = a_col_start + a_offset;
              if (a_col < uniforms.a_shape[2])
              {
                sub_a[a_offset] = ${K.getByIndices(`${K.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${K.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${k} + local_id.x;
            ${te?`
            let zero_point_values_per_byte: u32 = ${Math.floor(8/t.bits)}u;
            let zero_point_bytes_per_col = (n_blocks_per_col + zero_point_values_per_byte - 1u) / zero_point_values_per_byte;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_sub_offset: u32 = block % zero_point_values_per_byte;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${t.bits}u);
            let zero_point_word = ${te.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${le}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:`
            // The default zero point is ${Math.pow(2,t.bits-1)} for unsigned ${t.bits}-bit quantization.
            let zero_point = ${le}(${Math.pow(2,t.bits-1).toFixed(1)});`}
            let scale = ${Z.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${R.getByIndices(`${R.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/f};
            for (var i: u32 = 0; i < ${g}; i++) {
              let b_value = ${g===1?"b_data":"b_data[i]"};
              ${(()=>{let G=Math.floor(x/8),Q="";for(let q=0;q<G;q++){let ge=q*t.bits*4,Ge=ge+t.bits;Q+=`
              ${U()}
              {${t.bits===2?`
                let half_word = b_value >> ${q*16}u;
                let byte_lo = half_word & 0xFFu;
                let byte_hi = (half_word >> 8u) & 0xFFu;
                let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
                let b_value_lower = unpack4xU8(spread_word & 0x03030303u);
                let b_value_upper = unpack4xU8((spread_word >> 2u) & 0x03030303u);`:`
                let b_value_lower = unpack4xU8((b_value >> ${ge}u) & 0x0F0F0F0Fu);
                let b_value_upper = unpack4xU8((b_value >> ${Ge}u) & 0x0F0F0F0Fu);`}
                let b_quantized_values = mat2x4<${le}>(${Array.from({length:4},(ke,Ne)=>`${le}(b_value_lower[${Ne}]), ${le}(b_value_upper[${Ne}])`).join(", ")});
                let b_dequantized_values = (b_quantized_values - mat2x4<${le}>(${Array(8).fill("zero_point").join(",")})) * scale;
                inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(ke,Ne)=>`${`dot(a_data${Ne}, b_dequantized_values[${Ne}])`}`).join(" + ")};
              }
              word_offset += ${8/f};`}return Q})()}
            }
            workgroupBarrier();
          }

          if (local_idx < ${b}) {
            var output_value: ${V.type.value} = ${V.type.value}(0);
            for (var b = 0u; b < ${S}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${V.setByIndices(`${V.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${f};${g};${S};${b}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:y,dataType:c}],dispatchGroup:{x:C},programUniforms:z}),getShaderSource:D}},Wh=(e,t)=>{Hl(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(jl(e.inputs,t)):e.compute(Fl(e.inputs,t))},Vh=e=>me(e)}),Kl,Zl,Xl,Ql,Yl,Jl,ed,td,Gh,Ly=P(()=>{re(),ae(),ne(),Kl=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},Zl=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
            k = i32(${e.indicesGet("indices",a)}) - ${J("uniforms.pads",a,r)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${J("uniforms.x_shape",a,t)})) {
              break;
            }
            offset += k * i32(${J("uniforms.x_strides",a,t)});
        `;return`
          value = ${e.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${i}
            value = x[offset];
          }
      `},Xl=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
                k = i32(${e.indicesGet("indices",a)}) - ${J("uniforms.pads",a,r)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${J("uniforms.x_shape",a,t)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${J("uniforms.x_shape",a,t)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${J("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Ql=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
                k = i32(${e.indicesGet("indices",a)}) - ${J("uniforms.pads",a,r)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${J("uniforms.x_shape",a,t)})) {
                  k = i32(${J("uniforms.x_shape",a,t)}) - 1;
                }
                offset += k * i32(${J("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Yl=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
                k = i32(${e.indicesGet("indices",a)}) - ${J("uniforms.pads",a,r)};
                if (k < 0)  {
                  k += i32(${J("uniforms.x_shape",a,t)}]);
                }
                if (k >= i32(${J("uniforms.x_shape",a,t)})) {
                  k -= i32(${J("uniforms.x_shape",a,t)});
                }
                offset += k * i32(${J("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Jl=(e,t,r)=>{switch(r.mode){case 0:return Zl(e,t,r.pads.length);case 1:return Xl(e,t,r.pads.length);case 2:return Ql(e,t,r.pads.length);case 3:return Yl(e,t,r.pads.length);default:throw new Error("Invalid mode")}},ed=(e,t)=>{let r=O.padShape(e[0].dims.slice(),t.pads),i=e[0].dims,a=O.size(r),n=[{type:12,data:a},{type:6,data:t.pads}],s=e.length>=3&&e[2].data;t.mode===0&&n.push({type:s?e[2].dataType:1,data:t.value}),n.push(...ee(e[0].dims,r));let u=["rank"],l=p=>{let c=Y("output",e[0].dataType,r.length),f=N("x",e[0].dataType,i.length),g=f.type.value,y=Jl(c,i.length,t),_=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&_.push({name:"constant_value",type:s?g:"f32"}),`
            ${p.registerUniforms(_).declareVariables(f,c)}
            ${p.mainStart()}
            ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${c.offsetToIndices("global_idx")};

            var value = ${g}(0);
            ${y}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${s}`,inputDependencies:u},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(O.size(r)/64)},programUniforms:n}),getShaderSource:l}},td=(e,t)=>{if(e.length>1){let r=e[1].getBigInt64Array(),i=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,a=e[0].dims.length,n=new Int32Array(2*a).fill(0);if(e.length>=4){let u=e[3].getBigInt64Array();for(let l=0;l<u.length;l++)n[Number(u[l])]=Number(r[l]),n[Number(u[l])+a]=Number(r[l+u.length])}else r.forEach((u,l)=>n[Number(l)]=Number(u));let s=[];return n.forEach(u=>s.push(u)),{mode:t.mode,value:i,pads:s}}else return t},Gh=(e,t)=>{Kl(e.inputs);let r=td(e.inputs,t);e.compute(ed(e.inputs,r),{inputs:[0]})}}),lr,oa,ua,la,da,rd,id,pa,ca,Hh,Fh,ha,jh,Kh,fa,Zh,Xh,Qh,Yh,Wy=P(()=>{Fe(),re(),ae(),ne(),lr=e=>{if(be.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},oa=(e,t,r)=>{let i=t.format==="NHWC",a=e.dims.slice();i&&a.splice(1,0,a.pop());let n=Object.hasOwnProperty.call(t,"dilations"),s=t.kernelShape.slice(),u=t.strides.slice(),l=n?t.dilations.slice():[],p=t.pads.slice();Qr.adjustPoolAttributes(r,a,s,u,l,p);let c=Qr.computePoolOutputShape(r,a,u,l,s,p,t.autoPad),f=Object.assign({},t);n?Object.assign(f,{kernelShape:s,strides:u,pads:p,dilations:l,cacheKey:t.cacheKey}):Object.assign(f,{kernelShape:s,strides:u,pads:p,cacheKey:t.cacheKey});let g=c.slice();return g.push(g.splice(1,1)[0]),[f,i?g:c]},ua=(e,t)=>{let r=t.format==="NHWC",i=O.size(e),a=O.size(t.kernelShape),n=[{type:12,data:i},{type:12,data:a}],s=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let u=t.kernelShape[t.kernelShape.length-1],l=t.strides[t.strides.length-1],p=t.pads[t.pads.length/2-1],c=t.pads[t.pads.length-1],f=!!(p+c);n.push({type:12,data:u},{type:12,data:l},{type:12,data:p},{type:12,data:c}),s.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let g=!1;if(t.kernelShape.length===2){let y=t.kernelShape[t.kernelShape.length-2],_=t.strides[t.strides.length-2],b=t.pads[t.pads.length/2-2],S=t.pads[t.pads.length-2];g=!!(b+S),n.push({type:12,data:y},{type:12,data:_},{type:12,data:b},{type:12,data:S}),s.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[n,s,!0,f,g]}else{if(r)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let u=O.computeStrides(t.kernelShape);n.push({type:12,data:u},{type:12,data:t.pads},{type:12,data:t.strides}),s.push({name:"kernelStrides",type:"u32",length:u.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let l=t.pads.reduce((p,c)=>p+c);return[n,s,!!l,!1,!1]}},la=(e,t,r,i,a,n,s,u,l,p,c,f)=>{let g=a.format==="NHWC",y=t.type.value,_=Y("output",t.type.tensor,i);if(a.kernelShape.length<=2){let b="",S="",x="",$=r-(g?2:1);if(c?b=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${$}] = indices[${$}] * uniforms.sw - uniforms.pwStart + i;
                  if (xIndices[${$}] < 0 || xIndices[${$}]
                      >= uniforms.x_shape[${$}]) {
                    pad++;
                    continue;
                  }
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${n}
                }`:b=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${$}] = indices[${$}] * uniforms.sw - uniforms.pwStart + i;
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${n}
                }`,a.kernelShape.length===2){let T=r-(g?3:2);f?S=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${T}] = indices[${T}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${T}] < 0 || xIndices[${T}] >= uniforms.x_shape[${T}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:S=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${T}] = indices[${T}] * uniforms.sh - uniforms.phStart + j;
                `,x=`
              }
            `}return`
            ${e.registerUniforms(l).declareVariables(t,_)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

              let indices = ${_.offsetToIndices("global_idx")};
              var xIndices = ${_.offsetToIndices("global_idx")};

              var value = ${y}(${u});
              var pad = 0;
              ${S}
              ${b}
              ${x}
              ${s}

              output[global_idx] = value;
            }`}else{if(g)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let b=a.kernelShape.length,S=a.pads.length,x="";return p?x=`
                if (xIndices[j] >= uniforms.x_shape[j]) {
                  pad++;
                  isPad = true;
                  break;
                }
              }
              if (!isPad) {
                let x_val = x[${t.indicesToOffset("xIndices")}];
                ${n}
              }`:x=`
              }
              let x_val = x[${t.indicesToOffset("xIndices")}];
              ${n}
            `,`
            ${e.registerUniforms(l).declareVariables(t,_)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
              let indices = ${_.offsetToIndices("global_idx")};
              var xIndices = ${_.offsetToIndices("global_idx")};

              var offsets: array<u32, ${b}>;

              var value = ${y}(${u});
              var pad = 0;
              var isPad = false;

              for (var i: u32 = 0u; i < uniforms.kernelSize; i++) {
                var offset = i;
                for (var j = 0u; j < ${b-1}u; j++) {
                  offsets[j] = offset / ${J("uniforms.kernelStrides","j",b)};
                  offset -= offsets[j] * ${J("uniforms.kernelStrides","j",b)};
                }
                offsets[${b-1}] = offset;

                isPad = false;
                for (var j = ${r-b}u; j < ${r}u; j++) {
                  xIndices[j] = indices[j] * ${J("uniforms.strides",`j - ${r-b}u`,b)}
                    + offsets[j - ${r-b}u] - ${J("uniforms.pads","j - 2u",S)};
                  ${x}
              }
              ${s}

              output[global_idx] = value;
            }`}},da=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,rd=e=>`${da(e)};${e.countIncludePad}`,id=e=>`${da(e)};${e.storageOrder};${e.dilations}`,pa=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),ca=(e,t,r,i)=>{let[a,n]=oa(t,i,r),s=N("x",t.dataType,t.dims.length),u=s.type.value,l="value += x_val;",p="";a.countIncludePad?p+=`value /= ${u}(uniforms.kernelSize);`:p+=`value /= ${u}(i32(uniforms.kernelSize) - pad);`;let[c,f,g,y,_]=ua(n,a);c.push(...ee(t.dims,n));let b=["rank"];return{name:e,shaderCache:{hint:`${i.cacheKey};${g};${y};${_}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:n,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(O.size(n)/64)},programUniforms:c}),getShaderSource:S=>la(S,s,t.dims.length,n.length,a,l,p,0,f,g,y,_)}},Hh=e=>{let t=e.count_include_pad!==0,r=pa(e);if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let i={countIncludePad:t,...r,cacheKey:""};return{...i,cacheKey:rd(i)}},Fh=(e,t)=>{lr(e.inputs),e.compute(ca("AveragePool",e.inputs[0],!1,t))},ha={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},jh=e=>{let t=e.format;return{format:t,...ha,cacheKey:t}},Kh=(e,t)=>{lr(e.inputs),e.compute(ca("GlobalAveragePool",e.inputs[0],!0,t))},fa=(e,t,r,i)=>{let[a,n]=oa(t,i,r),s=`
      value = max(x_val, value);
    `,u="",l=N("x",t.dataType,t.dims.length),p=["rank"],[c,f,g,y,_]=ua(n,a);return c.push(...ee(t.dims,n)),{name:e,shaderCache:{hint:`${i.cacheKey};${g};${y};${_}`,inputDependencies:p},getRunData:()=>({outputs:[{dims:n,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(O.size(n)/64)},programUniforms:c}),getShaderSource:b=>la(b,l,t.dims.length,n.length,a,s,u,t.dataType===10?-65504:-1e5,f,g,y,_)}},Zh=(e,t)=>{lr(e.inputs),e.compute(fa("MaxPool",e.inputs[0],!1,t))},Xh=e=>{let t=e.storage_order,r=e.dilations,i=pa(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(i.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let a={storageOrder:t,dilations:r,...i,cacheKey:""};return{...a,cacheKey:id(a)}},Qh=e=>{let t=e.format;return{format:t,...ha,cacheKey:t}},Yh=(e,t)=>{lr(e.inputs),e.compute(fa("GlobalMaxPool",e.inputs[0],!0,t))}}),ad,nd,Jh,ef,Vy=P(()=>{re(),ae(),Se(),ne(),ad=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((r,i)=>r===e[2].dims[i]).reduce((r,i)=>r&&i,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((a,n)=>n===t.axis||a===e[0].dims[n]).reduce((a,n)=>a&&n,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let r=e[0].dims[t.axis],i=e[1].dims[t.axis];if(t.blockSize<Math.ceil(r/i)||t.blockSize>Math.ceil(r/(i-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},nd=(e,t)=>{let r=O.normalizeAxis(t.axis,e[0].dims.length),i=e[0].dataType,a=i===3,n=e[0].dims,s=e[1].dataType,u=O.size(n),l=i===3||i===2,p=l?[Math.ceil(O.size(e[0].dims)/4)]:e[0].dims,c=e[1].dims,f=e.length>2?e[2]:void 0,g=f?l?[Math.ceil(O.size(f.dims)/4)]:f.dims:void 0,y=c.length===0||c.length===1&&c[0]===1,_=y===!1&&c.length===1,b=xe(u),S=y&&(!l||b===4),x=S?b:1,$=S&&!l?b:1,T=N("input",l?12:i,p.length,$),k=N("scale",s,c.length),C=f?N("zero_point",l?12:i,g.length):void 0,z=Y("output",s,n.length,x),A=[T,k];C&&A.push(C);let v=[p,c];f&&v.push(g);let M=[{type:12,data:u/x},{type:12,data:r},{type:12,data:t.blockSize},...ee(...v,n)],D=F=>{let j=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${F.registerUniforms(j).declareVariables(...A,z)}
      ${F.mainStart()}
          ${F.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${z.offsetToIndices("global_idx")};

          // Set input x
          ${l?`
            let input = ${T.getByOffset("global_idx / 4")};
            let x_vec = ${a?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${x===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${T.getByOffset("global_idx")};`};

          // Set scale input
          ${y?`let scale_value= ${k.getByOffset("0")}`:_?`
            let scale_index = ${z.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${k.getByOffset("scale_index")};`:`
            var scale_indices: ${k.type.indices} = output_indices;
            let index = ${k.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${k.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${k.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${C?y?l?`
                let zero_point_input = ${C.getByOffset("0")};
                let zero_point_vec =  ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${C.getByOffset("0")}`:_?l?`
                let zero_point_index = ${z.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${C.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${z.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${C.getByOffset("zero_point_index")};`:l?`
                let zero_point_offset = ${k.indicesToOffset("scale_indices")};
                let zero_point_input = ${C.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${C.getByIndices("scale_indices")};`:`let zero_point_value = ${l?a?"i32":"u32":T.type.value}(0);`};
      // Compute and write output
      ${z.setByOffset("global_idx",`${z.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:C?["rank","rank","rank"]:["rank","rank"]},getShaderSource:D,getRunData:()=>({outputs:[{dims:n,dataType:s}],dispatchGroup:{x:Math.ceil(u/x/64),y:1,z:1},programUniforms:M})}},Jh=(e,t)=>{ad(e.inputs,t),e.compute(nd(e.inputs,t))},ef=e=>me({axis:e.axis,blockSize:e.blockSize})}),sd,od,tf,Gy=P(()=>{Fe(),re(),ne(),sd=(e,t,r)=>{let i=e===t,a=e<t&&r<0,n=e>t&&r>0;if(i||a||n)throw new Error("Range these inputs' contents are invalid.")},od=(e,t,r,i)=>{let a=Math.abs(Math.ceil((t-e)/r)),n=[a],s=a,u=[{type:12,data:s},{type:i,data:e},{type:i,data:r},...ee(n)],l=p=>{let c=Y("output",i,n.length),f=c.type.value,g=[{name:"outputSize",type:"u32"},{name:"start",type:f},{name:"delta",type:f}];return`
        ${p.registerUniforms(g).declareVariables(c)}
        ${p.mainStart()}
        ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${f}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${i}`},getShaderSource:l,getRunData:()=>({outputs:[{dims:n,dataType:i}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:u})}},tf=e=>{let t=0,r=0,i=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],r=e.inputs[1].getInt32Array()[0],i=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],r=e.inputs[1].getFloat32Array()[0],i=e.inputs[2].getFloat32Array()[0]),be.webgpu.validateInputContent&&sd(t,r,i),e.compute(od(t,r,i,e.inputs[0].dataType),{inputs:[]})}}),ud,ld,rf,af,Hy=P(()=>{re(),ae(),Se(),ne(),ud=(e,t,r,i)=>{if(e!=="none"&&i!=="i32"&&i!=="u32"&&i!=="f32")throw new Error(`Input ${i} is not supported with reduction ${e}.`);let a=`{
                var oldValue = 0;
                loop {
                  let newValueF32 =`,n=`;
                  let newValue = bitcast<i32>(newValueF32);
                  let res = atomicCompareExchangeWeak(&${t}, oldValue, newValue);
                  if res.exchanged {
                    break;
                  }
                  oldValue = res.old_value;
                }
              }`;switch(e){case"none":return`${t}=${r};`;case"add":return i==="i32"||i==="u32"?`atomicAdd(&${t}, bitcast<${i}>(${r}));`:`
              ${a}bitcast<${i}>(oldValue) + (${r})${n}`;case"max":return i==="i32"||i==="u32"?`atomicMax(&${t}, bitcast<${i}>(${r}));`:`
                ${a}max(bitcast<f32>(oldValue), (${r}))${n}`;case"min":return i==="i32"||i==="u32"?`atomicMin(&${t}, bitcast<${i}>(${r}));`:`${a}min(bitcast<${i}>(oldValue), (${r}))${n}`;case"mul":return`${a}(bitcast<${i}>(oldValue) * (${r}))${n}`;default:throw new Error(`Reduction ${e} is not supported.`)}},ld=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r,n=1,s=Math.ceil(O.sizeToDimension(i,i.length-1)/n),u=i[i.length-1],l=O.sizeFromDimension(r,u),p=[{type:12,data:s},{type:12,data:u},{type:12,data:l},...ee(e[1].dims,e[2].dims,a)],c=f=>{let g=N("indices",e[1].dataType,e[1].dims.length),y=N("updates",e[2].dataType,e[2].dims.length,n),_=t.reduction!=="none"&&t.reduction!==""?Ap("output",e[0].dataType,a.length):Y("output",e[0].dataType,a.length,n);return`
      ${f.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(g,y,_)}
      ${f.mainStart()}
        ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
  var data_offset = 0u;
  let indices_start = uniforms.last_index_dimension * global_idx;
  let indices_end = indices_start + uniforms.last_index_dimension;
  for (var i = indices_start; i < indices_end; i++) {
    var index = i32(indices[i].x);
    ${e[0].dims.length===1?`
    let element_count_dim = uniforms.output_strides;
    let dim_value = uniforms.output_shape;`:`
    let element_count_dim = uniforms.output_strides[i - indices_start];
    let dim_value = uniforms.output_shape[i - indices_start];`}
    if (index >= 0) {
      if (index >= i32(dim_value)) {
        index = i32(dim_value - 1);
      }
    } else {
      if (index < -i32(dim_value)) {
        index = 0;
      } else {
        index += i32(dim_value);
      }
    }
    data_offset += u32((u32(index) * element_count_dim));
  }

  for (var i = 0u; i < uniforms.num_updates_elements; i++) {
    let value = updates[uniforms.num_updates_elements * global_idx + i];
    ${ud(t.reduction,"output[data_offset + i]","value",_.type.value)}
  }

      }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:p}),getShaderSource:c}},rf=e=>me({reduction:e.reduction}),af=(e,t)=>{e.compute(ld(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),dd,pd,cd,ma,hd,fd,md,gd,yd,_d,bd,$d,ga,wd,vd,xd,Sd,kd,nf,sf,Fy=P(()=>{re(),ae(),Se(),ne(),dd=(e,t)=>{if(e.every(r=>r>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},pd=(e,t,r)=>{t.every(a=>a>=0&&a<r||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let i=new Array(r).fill(1);return t.forEach((a,n)=>i[a]=e[n]),i},cd=(e,t,r,i,a,n)=>{let[s,u,l]=r>10?[1,2,3]:[-1,e.length>1?1:-1,-1],p=e[0].dims.length;if(s>0&&e.length>s&&e[s].dims.length>0)e[s].getFloat32Array().forEach(c=>n.push(c));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(u>0&&e.length>u&&e[u].dims.length===1&&e[u].dims[0]>0){if(e[u].getFloat32Array().forEach(c=>i.push(c)),i.length!==0&&i.length!==p&&r>=18&&i.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");dd(i,t),t.axes.length>0&&pd(i,t.axes,p).forEach((c,f)=>i[f]=c)}if(l>0&&e.length>l&&e[l].dims.length===1&&e[l].dims[0]>0&&(e[l].getBigInt64Array().forEach(c=>a.push(Number(c))),a.length!==0&&a.length!==p&&r>=18&&a.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(i.length!==0&&i.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(a.length!==0&&a.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof i<"u"&&typeof a<"u"&&i.length>0&&a.length>p)throw new Error("Resize requires only of scales or sizes to be specified")},ma=(e,t,r,i)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${i}(big / (${r}));
  let fract = ${i}(big % (${r})) / ${i}(${r});
  return whole + fract;
`,hd=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${ma("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${ma("xResized","lengthOriginal - 1","lengthResized - 1",t)}
                  }`;case"tf_crop_and_resize":return`if (lengthResized > 1) {
                    return ${t}(roiStart) * ${t}(lengthOriginal - 1) +
                        (${t}(xResized) * ${t}(roiEnd - roiStart) * ${t}(lengthOriginal - 1)) /
                        ${t}(lengthResized - 1);
                  } else {
                    return 0.5 * ${t}(roiStart + roiEnd) * ${t}(lengthOriginal - 1);
                  }`;case"half_pixel_symmetric":return`const outputWidth = ${t}xScale * ${t}(lengthResized);
                  const adjustment = ${t}(lengthResized) / outputWidth;
                  const center = ${t}(lengthOriginal) / 2;
                  const offset = center * (1 - adjustment);
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",fd=(e,t,r)=>`fn getNearestPixelFromOriginal(xOriginal: ${r}, isDownSample: bool) -> ${r} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";case"simple":default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",md=(e,t,r)=>{let i=new Array(r).fill(0).concat(new Array(r).fill(1)),a=e.length===0?i:e.slice();return t.length>0?(t.forEach((n,s)=>{i[n]=a[s],i[s+r]=a[t.length+s]}),i):a},gd=(e,t,r,i)=>{let a=[];if(r.length>0)if(i.length>0){if(e.forEach(n=>a.push(n)),Math.max(...i)>e.length)throw new Error("axes is out of bound");i.forEach((n,s)=>a[n]=r[s])}else r.forEach(n=>a.push(n));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");a=e.map((n,s)=>Math.round(n*t[s]))}return a},yd=(e,t,r)=>{let i=(()=>{switch(r.keepAspectRatioPolicy){case"not_larger":return r.axes.length>0?Math.min(...r.axes.map(n=>t[n]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return r.axes.length>0?Math.max(...r.axes.map(n=>t[n]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${r.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let a=e.slice();return r.axes.length>0?(r.axes.forEach(n=>t[n]=i),r.axes.forEach(n=>a[n]=Math.round(e[n]*t[n]))):(t.fill(i,0,t.length),a.forEach((n,s)=>a[s]=Math.round(n*t[s]))),a},_d=(e,t,r,i,a)=>`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${r.length}> {
      var original_indices: array<${e.type.value}, ${r.length}>;
      for (var i:u32 = 0; i < ${r.length}; i++) {
        var output_index = ${e.indicesGet("output_indices","i")};
        var scale = ${J("uniforms.scales","i",i)};
        var roi_low = ${J("uniforms.roi","i",a)};
        var roi_hi = ${J("uniforms.roi",`i + ${t.length}`,a)};
        if (scale == 1.0) {
          original_indices[i] = ${e.type.value}(output_index);
        } else {
          var input_shape_i = ${J("uniforms.input_shape","i",t.length)};
          var output_shape_i = ${J("uniforms.output_shape","i",r.length)};
          original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                           input_shape_i, roi_low, roi_hi);
        }
      }
      return original_indices;
    }`,bd=(e,t,r,i,a,n,s)=>`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
      var input_indices: ${e.type.indices};
      for (var i:u32 = 0; i < ${i.length}; i++) {
        var output_index = ${t.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${J("uniforms.scales","i",a)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${J("uniforms.roi","i",n)};
          var roi_hi = ${J("uniforms.roi",`i + ${r.length}`,n)};
          var input_shape_i = ${J("uniforms.input_shape","i",r.length)};
          var output_shape_i = ${J("uniforms.output_shape","i",i.length)};
          var original_idx = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                        input_shape_i, roi_low, roi_hi);
          if (!${s} || (original_idx >= 0 && original_idx < ${t.type.value}(input_shape_i))) {
            if (original_idx < 0) {
              input_index = 0;
            } else if (original_idx > ${t.type.value}(input_shape_i - 1)) {
              input_index = input_shape_i - 1;
            } else {
              input_index = u32(getNearestPixelFromOriginal(original_idx, scale < 1));
            }
          } else {
            input_index = u32(original_idx);
          }
        }
        ${e.indicesSet("input_indices","i","input_index")}
      }
      return input_indices;
    }`,$d=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${J("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,ga=(e,t,r,i)=>e.rank>i?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",r,"batch")};
`:"",wd=(e,t,r,i,a)=>{let[n,s,u,l]=r.length===2?[-1,0,1,-1]:[0,2,3,1],p=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${p} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(row, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(col, ${r[u]} - 1))`)};
      ${ga(e,l,n,2)}
      return ${e.getByIndices("input_indices")};
    }

    fn bilinearInterpolation(output_indices: ${t.type.indices}) -> ${p} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var row:${p} = originalIndices[${s}];
      var col:${p} = originalIndices[${u}];
      ${i?`if (row < 0 || row > (${r[s]} - 1) || col < 0 || col > (${r[u]} - 1)) {
        return ${a};
      }`:""};
      row = max(0, min(row, ${r[s]} - 1));
      col = max(0, min(col, ${r[u]} - 1));
      var row1: u32 = u32(row);
      var col1: u32 = u32(col);
      var row2: u32 = u32(row + 1);
      var col2: u32 = u32(col + 1);
      var channel: u32 = ${r.length>2?`u32(originalIndices[${l}])`:"0"};
      var batch: u32 =  ${r.length>2?`u32(originalIndices[${n}])`:"0"};
      var x11: ${p} = getInputValue(batch, channel, row1, col1);
      var x12: ${p} = getInputValue(batch, channel, row1, col2);
      var x21: ${p} = getInputValue(batch, channel, row2, col1);
      var x22: ${p} = getInputValue(batch, channel, row2, col2);
      var dx1: ${p} = abs(row - ${p}(row1));
      var dx2: ${p} = abs(${p}(row2) - row);
      var dy1: ${p} = abs(col - ${p}(col1));
      var dy2: ${p} = abs(${p}(col2) - col);
      if (row1 == row2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (col1 == col2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      return (x11 * dx2 * dy2 + x12 * dx2 * dy1 + x21 * dx1 * dy2 + x22 * dx1 * dy1);
    }`},vd=(e,t,r,i,a,n,s,u,l,p)=>{let c=r.length===2,[f,g]=c?[0,1]:[2,3],y=e.type.value,_=b=>{let S=b===f?"row":"col";return`
      fn ${S}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${y} {
        var output_index = ${t.indicesGet("output_indices",b)};
        var originalIdx: ${y} = getOriginalCoordinateFromResizedCoordinate(output_index, ${a[b]},
        ${i[b]}, ${r[b]}, ${n[b]}, ${n[b]} + ${r.length});
        var fractOriginalIdx: ${y} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${u} && (originalIdx < 0 || originalIdx > (${r[b]} - 1))) {
          return ${l};
        }
        var data: array<${y}, 4> = array<${y}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${S}: ${y} = originalIdx + ${y}(i);
          if (${S} < 0 || ${S} >= ${r[b]}) {
            ${p?`coefs[i + 1] = 0.0;
                        continue;`:u?`return ${l};`:`${S} = max(0, min(${S}, ${r[b]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",b,`u32(${S})`)};
          data[i + 1] = ${b===f?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
        }
        return cubicInterpolation1D(data, coefs);
      }`};return`
    ${_(f)};
    ${_(g)};
  fn getCubicInterpolationCoefs(s: ${y}) -> array<${y}, 4> {
    var absS = abs(s);
    var coeffs: array<${y}, 4> = array<${y}, 4>(0.0, 0.0, 0.0, 0.0);
    var oneMinusAbsS: ${y} = 1.0 - absS;
    var twoMinusAbsS: ${y} = 2.0 - absS;
    var onePlusAbsS: ${y} = 1.0 + absS;
    coeffs[0] = ((${s} * onePlusAbsS - 5 * ${s}) * onePlusAbsS + 8 * ${s}) * onePlusAbsS - 4 * ${s};
    coeffs[1] = ((${s} + 2) * absS - (${s} + 3)) * absS * absS + 1;
    coeffs[2] = ((${s} + 2) * oneMinusAbsS - (${s} + 3)) * oneMinusAbsS * oneMinusAbsS + 1;
    coeffs[3] = ((${s} * twoMinusAbsS - 5 * ${s}) * twoMinusAbsS + 8 * ${s}) * twoMinusAbsS - 4 * ${s};
    return coeffs;
  }

  fn cubicInterpolation1D(x: array<${y}, 4>, coefs: array<${y}, 4>) -> ${y} {
    var coefsSum: ${y} = coefs[0] + coefs[1] + coefs[2] + coefs[3];
    return (x[0] * coefs[0] + x[1] * coefs[1]+ x[2] * coefs[2]+ x[3] * coefs[3]) / coefsSum;
  }

  fn bicubicInterpolation(output_indices: ${t.type.indices}) -> ${y} {
    var input_indices: ${e.type.indices} = output_indices;
    return colCubicInterpolation(input_indices, output_indices);
  }
    `},xd=(e,t,r,i,a)=>{let[n,s,u,l,p]=r.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],c=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${c} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(depth, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(height, ${r[u]} - 1))`)};
      ${e.indicesSet("input_indices",l,`max(0, min(width, ${r[l]} - 1))`)};
      ${ga(e,p,n,3)}
      return ${e.getByIndices("input_indices")};
    }

    fn trilinearInterpolation(output_indices: ${t.type.indices}) -> ${c} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var depth:${c} = originalIndices[${s}];
      var height:${c} = originalIndices[${u}];
      var width:${c} = originalIndices[${l}];
      ${i?`if (depth < 0 || depth > (${r[s]} - 1) || height < 0 || height > (${r[u]} - 1) || width < 0 || (width > ${r[l]} - 1)) {
      return ${a};
        }`:""};

    depth = max(0, min(depth, ${r[s]} - 1));
      height = max(0, min(height, ${r[u]} - 1));
      width = max(0, min(width, ${r[l]} - 1));
      var depth1: u32 = u32(depth);
      var height1: u32 = u32(height);
      var width1: u32 = u32(width);
      var depth2: u32 = u32(depth + 1);
      var height2: u32 = u32(height + 1);
      var width2: u32 = u32(width + 1);
      var channel: u32 = ${r.length>3?`u32(originalIndices[${p}])`:"0"};
      var batch: u32 =  ${r.length>3?`u32(originalIndices[${n}])`:"0"};

      var x111: ${c} = getInputValue(batch, channel, depth1, height1, width1);
      var x112: ${c} = getInputValue(batch, channel, depth1, height1, width2);
      var x121: ${c} = getInputValue(batch, channel, depth1, height2, width1);
      var x122: ${c} = getInputValue(batch, channel, depth1, height2, width2);
      var x211: ${c} = getInputValue(batch, channel, depth2, height1, width1);
      var x212: ${c} = getInputValue(batch, channel, depth2, height1, width2);
      var x221: ${c} = getInputValue(batch, channel, depth2, height2, width1);
      var x222: ${c} = getInputValue(batch, channel, depth2, height2, width2);
      var dx1: ${c} = abs(depth - ${c}(depth1));
      var dx2: ${c} = abs(${c}(depth2) - depth);
      var dy1: ${c} = abs(height - ${c}(height1));
      var dy2: ${c} = abs(${c}(height2) - height);
      var dz1: ${c} = abs(width - ${c}(width1));
      var dz2: ${c} = abs(${c}(width2) - width);
      if (depth1 == depth2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (height1 == height2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      if (width1 == width2) {
        dz1 = 0.5;
        dz2 = 0.5;
      }
      return (x111 * dx2 * dy2 * dz2 + x112 * dx2 * dy2 * dz1 + x121 * dx2 * dy1 *dz2 + x122 * dx2 * dy1 * dz1 +
              x211 * dx1 * dy2 * dz2 + x212 * dx1 * dy2 * dz1 + x221 * dx1 * dy1 *dz2 + x222 * dx1 * dy1 * dz1);
    }`},Sd=(e,t,r,i,a,n)=>{let s=e.dims,u=md(n,t.axes,s.length),l=gd(s,i,a,t.axes),p=i.slice();i.length===0&&(p=s.map(($,T)=>$===0?1:l[T]/$),t.keepAspectRatioPolicy!=="stretch"&&(l=yd(s,p,t)));let c=Y("output",e.dataType,l.length),f=N("input",e.dataType,s.length),g=O.size(l),y=s.length===l.length&&s.every(($,T)=>$===l[T]),_=t.coordinateTransformMode==="tf_crop_and_resize",b=t.extrapolationValue,S=f.type.value,x=$=>`
      ${y?"":`
      ${hd(t.coordinateTransformMode,S)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${$d(f,s)};
              ${fd(t.nearestMode,r,S)};
              ${bd(f,c,s,l,p.length,u.length,_)};
              `;case"linear":return`
              ${_d(c,s,l,p.length,u.length)};
              ${(()=>{if(s.length===2||s.length===4)return`${wd(f,c,s,_,b)}`;if(s.length===3||s.length===5)return`${xd(f,c,s,_,b)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(s.length===2||s.length===4)return`${vd(f,c,s,l,p,u,t.cubicCoeffA,_,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${$.registerUniform("output_size","u32").registerUniform("scales","f32",p.length).registerUniform("roi","f32",u.length).declareVariables(f,c)}
      ${$.mainStart()}
        ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
        ${y?"output[global_idx] = input[global_idx];":`
        let output_indices = ${c.offsetToIndices("global_idx")};
        var input_indices: ${f.type.indices};
        ${(()=>{switch(t.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
                if (checkInputIndices(input_indices)) {
                  output[global_idx] = ${f.getByIndices("input_indices")};
                } else {
                  output[global_idx] = ${t.extrapolationValue};
                }`;case"linear":return`output[global_idx] = ${s.length===2||s.length===4?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${t.mode}`)}})()};
`}
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${r}|${p.length>0?t.mode==="cubic"?p:p.length:""}|${a.length>0?a:""}|${u.length>0?u:""}|${y}|${t.mode==="nearest"?s.length:s}`,inputDependencies:["rank"]},getShaderSource:x,getRunData:()=>({outputs:[{dims:l,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:[{type:12,data:g},{type:1,data:p},{type:1,data:u},...ee(s,l)]})}},kd=e=>{let t=e.customDataBuffer;return new Uint32Array(t.buffer,t.byteOffset,1)[0]},nf=(e,t)=>{let r=[],i=[],a=[],n=kd(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");cd(e.inputs,t,n,r,i,a),e.compute(Sd(e.inputs[0],t,n,r,i,a),{inputs:[0]})},sf=e=>{let t=e.antialias,r=e.axes,i=e.coordinateTransformMode,a=e.cubicCoeffA,n=e.excludeOutside!==0,s=e.extrapolationValue,u=e.keepAspectRatioPolicy,l=e.mode,p=e.nearestMode===""?"simple":e.nearestMode;return me({antialias:t,axes:r,coordinateTransformMode:i,cubicCoeffA:a,excludeOutside:n,extrapolationValue:s,keepAspectRatioPolicy:u,mode:l,nearestMode:p})}}),Id,Td,of,jy=P(()=>{re(),ae(),ne(),Id=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],r=e[1],i=e[2];if(t.dataType!==r.dataType||t.dataType!==i.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(r.dims.length!==3&&r.dims.length!==2)throw new Error("Skip must be 2D or 3D");let a=t.dims[t.dims.length-1],n=t.dims[t.dims.length-2];if(r.dims[r.dims.length-1]!==a)throw new Error("Skip must have the same hidden size as input");if(r.dims[r.dims.length-2]!==n)throw new Error("Skip must have the same sequence length as input");if(i.dims.length!==1)throw new Error("Gamma must be 1D");if(i.dims[i.dims.length-1]!==a)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let s=e[3];if(s.dims.length!==1)throw new Error("Beta must be 1D");if(s.dims[s.dims.length-1]!==a)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let s=e[4];if(s.dims.length!==1)throw new Error("Bias must be 1D");if(s.dims[s.dims.length-1]!==a)throw new Error("Bias must have the same hidden size as input")}},Td=(e,t,r,i)=>{let a=t.simplified,n=e[0].dims,s=O.size(n),u=n,l=s,p=n.slice(-1)[0],c=i?n.slice(0,-1).concat(1):[],f=!a&&e.length>3,g=e.length>4,y=i&&r>1,_=i&&r>2,b=r>3,S=64,x=xe(p),$=[{type:12,data:l},{type:12,data:x},{type:12,data:p},{type:1,data:t.epsilon}],T=C=>{let z=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],A=[N("x",e[0].dataType,e[0].dims,x),N("skip",e[1].dataType,e[1].dims,x),N("gamma",e[2].dataType,e[2].dims,x)];f&&A.push(N("beta",e[3].dataType,e[3].dims,x)),g&&A.push(N("bias",e[4].dataType,e[4].dims,x)),A.push(Y("output",e[0].dataType,u,x)),y&&A.push(Y("mean_output",1,c)),_&&A.push(Y("inv_std_output",1,c)),b&&A.push(Y("input_skip_bias_sum",e[0].dataType,u,x));let v=Ce(e[0].dataType),M=Ce(1,x);return`

      ${C.registerUniforms(z).declareVariables(...A)}
      var<workgroup> sum_shared : array<${M}, ${S}>;
      var<workgroup> sum_squared_shared : array<${M}, ${S}>;

      ${C.mainStart([S,1,1])}
        let ix = local_id.x;
        let iy = global_id.x / ${S};

        let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
        var stride = hidden_size_vectorized / ${S};
        let offset = ix * stride + iy * hidden_size_vectorized;
        let offset1d = stride * ix;
        if (ix == ${S-1}) {
          stride = hidden_size_vectorized - stride * ix;
        }
        for (var i: u32 = 0; i < stride; i++) {
          let skip_value = skip[offset + i];
          let bias_value = ${g?"bias[offset1d + i]":v+"(0.0)"};
          let input_value = x[offset + i];
          let value = input_value + skip_value + bias_value;
          ${b?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${Kt(v,x,"value")};
          sum_shared[ix] += f32_value;
          sum_squared_shared[ix] += f32_value * f32_value;
        }
        workgroupBarrier();

        var reduce_size : u32 = ${S};
        for (var curr_size = reduce_size >> 1;  curr_size > 0; curr_size = reduce_size >> 1) {
          reduce_size = curr_size + (reduce_size & 1);
          if (ix < curr_size) {
            sum_shared[ix] += sum_shared[ix + reduce_size];
            sum_squared_shared[ix] += sum_squared_shared[ix + reduce_size];
          }
          workgroupBarrier();
        }

        let sum = sum_shared[0];
        let square_sum = sum_squared_shared[0];
        let mean = ${xt("sum",x)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${xt("square_sum",x)} / f32(uniforms.hidden_size) ${a?"":"- mean * mean"} + uniforms.epsilon);
        ${y?"mean_output[global_idx] = mean;":""}
        ${_?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${a?"":`- ${v}(mean)`}) *
            ${v}(inv_std_dev) * gamma[offset1d + i]
            ${f?"+ beta[offset1d + i]":""};
        }
      }`},k=[{dims:u,dataType:e[0].dataType}];return r>1&&k.push({dims:c,dataType:1}),r>2&&k.push({dims:c,dataType:1}),r>3&&k.push({dims:n,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${x};${y};${_};${b}`,inputDependencies:e.map((C,z)=>"type")},getShaderSource:T,getRunData:()=>({outputs:k,dispatchGroup:{x:Math.ceil(l/p)},programUniforms:$})}},of=(e,t)=>{Id(e.inputs);let r=[0];e.outputCount>1&&r.push(-3),e.outputCount>2&&r.push(-3),e.outputCount>3&&r.push(3),e.compute(Td(e.inputs,t,e.outputCount,!1),{outputs:r})}}),Cd,dr,Ed,ya,zd,Ad,uf,lf,Ky=P(()=>{re(),ae(),Se(),ne(),Cd=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((r,i)=>{if(e[i+1].dataType!==6&&e[i+1].dataType!==7)throw new Error(`Input ${i} must be an array of int32 or int64`)})},dr=(e,t)=>{let r=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(i=>r.push(Number(i)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(i=>r.push(Number(i)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return r},Ed=(e,t)=>{if(e.length>1){let r=dr(e,1),i=dr(e,2),a=dr(e,3);return a.length===0&&(a=[...Array(e[0].dims.length).keys()]),me({starts:r,ends:i,axes:a})}else return t},ya=(e,t,r,i,a)=>{let n=e;return e<0&&(n+=r[i[t]]),a[t]<0?Math.max(0,Math.min(n,r[i[t]]-1)):Math.max(0,Math.min(n,r[i[t]]))},zd=(e,t,r)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
          var input_indices: ${e.type.indices};
          var carry = 0u;
          for (var i = ${r.length-1}; i >= 0; i--) {
            let input_shape_i = ${J("uniforms.input_shape","i",r.length)};
            let steps_i = ${J("uniforms.steps","i",r.length)};
            let signs_i = ${J("uniforms.signs","i",r.length)};
            let starts_i = ${J("uniforms.starts","i",r.length)};
            var output_index = ${t.indicesGet("output_indices","i")};
            var input_index = output_index * steps_i + starts_i + carry;
            carry = input_index / input_shape_i;
            input_index = input_index % input_shape_i;
            if (signs_i < 0) {
              input_index = input_shape_i - input_index - 1u + starts_i;
            }
            ${e.indicesSet("input_indices","i","input_index")};
          }
          return input_indices;
      }`,Ad=(e,t)=>{let r=e[0].dims,i=O.size(r),a=t.axes.length>0?O.normalizeAxes(t.axes,r.length):[...Array(r.length).keys()],n=dr(e,4);n.forEach(x=>x!==0||(()=>{throw new Error("step cannot be 0")})),n.length===0&&(n=Array(a.length).fill(1));let s=t.starts.map((x,$)=>ya(x,$,r,a,n)),u=t.ends.map((x,$)=>ya(x,$,r,a,n));if(a.length!==s.length||a.length!==u.length)throw new Error("start, ends and axes should have the same number of elements");if(a.length!==r.length)for(let x=0;x<r.length;++x)a.includes(x)||(s.splice(x,0,0),u.splice(x,0,r[x]),n.splice(x,0,1));let l=n.map(x=>Math.sign(x));n.forEach((x,$,T)=>{if(x<0){let k=(u[$]-s[$])/x,C=s[$],z=C+k*n[$];s[$]=z,u[$]=C,T[$]=-x}});let p=r.slice(0);a.forEach((x,$)=>{p[x]=Math.ceil((u[x]-s[x])/n[x])});let c={dims:p,dataType:e[0].dataType},f=Y("output",e[0].dataType,p.length),g=N("input",e[0].dataType,e[0].dims.length),y=O.size(p),_=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:s.length},{name:"signs",type:"i32",length:l.length},{name:"steps",type:"u32",length:n.length}],b=[{type:12,data:y},{type:12,data:s},{type:6,data:l},{type:12,data:n},...ee(e[0].dims,p)],S=x=>`
      ${x.registerUniforms(_).declareVariables(g,f)}
        ${zd(g,f,r)}
        ${x.mainStart()}
          ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${f.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${f.setByOffset("global_idx",g.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${l.length}_${s.length}_${n.length}`,inputDependencies:["rank"]},getShaderSource:S,getRunData:()=>({outputs:[c],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:b})}},uf=(e,t)=>{Cd(e.inputs,t);let r=Ed(e.inputs,t);e.compute(Ad(e.inputs,r),{inputs:[0]})},lf=e=>{let t=e.starts,r=e.ends,i=e.axes;return me({starts:t,ends:r,axes:i})}}),Od,Rd,df,pf,Zy=P(()=>{re(),ae(),Se(),St(),ne(),Od=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},Rd=(e,t)=>{let r=e.inputs[0],i=r.dims,a=O.size(i),n=i.length,s=O.normalizeAxis(t.axis,n),u=s<i.length-1,l,p=[];u?(p=Array.from({length:n},(A,v)=>v),p[s]=n-1,p[n-1]=s,l=e.compute(Ve(r,p),{inputs:[r],outputs:[-1]})[0]):l=r;let c=l.dims,f=c[n-1],g=a/f,y=xe(f),_=f/y,b=64;g===1&&(b=256);let S=(A,v)=>v===4?`max(max(${A}.x, ${A}.y), max(${A}.z, ${A}.w))`:v===2?`max(${A}.x, ${A}.y)`:v===3?`max(max(${A}.x, ${A}.y), ${A}.z)`:A,x=N("x",l.dataType,l.dims,y),$=Y("result",l.dataType,l.dims,y),T=x.type.value,k=Ce(l.dataType)==="f32"?`var threadMax = ${T}(-3.4028234663852886e+38f);`:`var threadMax = ${T}(-65504.0h);`,C=A=>`
      var<workgroup> rowMaxShared : ${T};
      var<workgroup> rowSumShared : ${T};
      var<workgroup> threadShared : array<${T}, ${b}>;

      fn getValue(row: i32, col: i32, row_stride: i32) -> ${T} {
        let index = row * row_stride + col;
        return x[index];
      }

      fn setValue(row: i32, col: i32, row_stride: i32, value: ${T}) {
        let index = row * row_stride + col;
        result[index] = value;
      }
      ${A.registerUniform("packedCols","i32").declareVariables(x,$)}
      ${A.mainStart(b)}
        let gindex = i32(global_idx);
        let lindex = i32(local_idx);
        const wg = ${b};
        let row = gindex / wg;
        let cols = uniforms.packedCols;
        let row_stride : i32 = uniforms.packedCols;

        // find the rows max
        ${k}
        for (var col = lindex; col < cols; col += wg) {
          let value = getValue(row, col, row_stride);
          threadMax = max(threadMax, value);
        }
        if (lindex < cols) {
          threadShared[lindex] = threadMax;
        }
        workgroupBarrier();

        var reduceSize = min(cols, wg);
        for (var currSize = reduceSize >> 1;  currSize > 0; currSize = reduceSize >> 1) {
          reduceSize = currSize + (reduceSize & 1);
          if (lindex < currSize) {
            threadShared[lindex] = max(threadShared[lindex], threadShared[lindex + reduceSize]);
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowMaxShared = ${T}(${S("threadShared[0]",y)});
        }
        workgroupBarrier();

        // find the rows sum
        var threadSum = ${T}(0.0);
        for (var col = lindex; col < cols; col += wg) {
          let subExp = exp(getValue(row, col, row_stride) - rowMaxShared);
          threadSum += subExp;
        }
        threadShared[lindex] = threadSum;
        workgroupBarrier();

        for (var currSize = wg >> 1;  currSize > 0; currSize = currSize >> 1) {
          if (lindex < currSize) {
            threadShared[lindex] = threadShared[lindex] + threadShared[lindex + currSize];
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowSumShared = ${T}(${xt("threadShared[0]",y)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          var value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          // max operation protects against NaN since all values should be >=0
          value = max(value, ${T}(0.0));
          setValue(row, col, row_stride, value);
        }
      }`,z=e.compute({name:"Softmax",shaderCache:{hint:`${y};${b}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:c,dataType:l.dataType}],dispatchGroup:{x:g},programUniforms:[{type:6,data:_}]}),getShaderSource:C},{inputs:[l],outputs:[u?-1:0]})[0];u&&e.compute(Ve(z,p),{inputs:[z]})},df=(e,t)=>{Od(e.inputs),Rd(e,t)},pf=e=>me({axis:e.axis})}),_a,Bd,Nd,Md,cf,Xy=P(()=>{re(),ae(),ne(),_a=e=>Array.from(e.getBigInt64Array(),Number),Bd=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(_a(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},Nd=(e,t)=>{let r=[];for(let i=0;i<e.length;++i)r.push(e[i]*t[i]);return r},Md=(e,t)=>{let r=e[0].dims,i=t??_a(e[1]),a=Nd(r,i),n=O.size(a),s=e[0].dataType,u=N("input",s,r.length),l=Y("output",s,a.length),p=c=>`
      const inputShape = ${u.indices(...r)};
      ${c.registerUniform("output_size","u32").declareVariables(u,l)}
      ${c.mainStart()}
      ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let output_indices = ${l.offsetToIndices("global_idx")};
      var input_indices: ${u.type.indices};
      for (var i = 0; i < ${r.length}; i++) {
        let input_dim_i = ${u.indicesGet("uniforms.input_shape","i")};
        let input_dim_value = ${l.indicesGet("output_indices","i")}  % input_dim_i;

        ${u.indicesSet("input_indices","i","input_dim_value")}
      }
      ${l.setByOffset("global_idx",u.getByIndices("input_indices"))}
    }`;return{name:"Tile",shaderCache:{hint:`${i}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:[{type:12,data:n},...ee(e[0].dims,a)]}),getShaderSource:p}},cf=e=>{Bd(e.inputs),e.compute(Md(e.inputs),{inputs:[0]})}}),Dd,Pd,hf,Qy=P(()=>{re(),ae(),ne(),Dd=(e,t,r,i,a)=>{let n=Y("output_data",a,r.length,4),s=N("a_data",t[1].dataType,t[1].dims.length,4),u=N("b_data",t[2].dataType,t[2].dims.length,4),l=N("c_data",t[0].dataType,t[0].dims.length,4),p,c=(f,g,y)=>`select(${g}, ${f}, ${y})`;if(!i)p=n.setByOffset("global_idx",c(s.getByOffset("global_idx"),u.getByOffset("global_idx"),l.getByOffset("global_idx")));else{let f=(g,y,_="")=>{let b=`a_data[index_a${y}][component_a${y}]`,S=`b_data[index_b${y}][component_b${y}]`,x=`bool(c_data[index_c${y}] & (0xffu << (component_c${y} * 8)))`;return`
            let output_indices${y} = ${n.offsetToIndices(`global_idx * 4u + ${y}u`)};
            let offset_a${y} = ${s.broadcastedIndicesToOffset(`output_indices${y}`,n)};
            let offset_b${y} = ${u.broadcastedIndicesToOffset(`output_indices${y}`,n)};
            let offset_c${y} = ${l.broadcastedIndicesToOffset(`output_indices${y}`,n)};
            let index_a${y} = offset_a${y} / 4u;
            let index_b${y} = offset_b${y} / 4u;
            let index_c${y} = offset_c${y} / 4u;
            let component_a${y} = offset_a${y} % 4u;
            let component_b${y} = offset_b${y} % 4u;
            let component_c${y} = offset_c${y} % 4u;
            ${g}[${y}] = ${_}(${c(b,S,x)});
          `};a===9?p=`
            var data = vec4<u32>(0);
            ${f("data",0,"u32")}
            ${f("data",1,"u32")}
            ${f("data",2,"u32")}
            ${f("data",3,"u32")}
            output_data[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:p=`
            ${f("output_data[global_idx]",0)}
            ${f("output_data[global_idx]",1)}
            ${f("output_data[global_idx]",2)}
            ${f("output_data[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(l,s,u,n)}
        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${p}
      }`},Pd=e=>{let t=e[1].dims,r=e[2].dims,i=e[0].dims,a=e[1].dataType,n=!(O.areEqual(t,r)&&O.areEqual(r,i)),s=t,u=O.size(t);if(n){let p=Zt.calcShape(Zt.calcShape(t,r,!1),i,!1);if(!p)throw new Error("Can't perform where op on the given tensors");s=p,u=O.size(s)}let l=Math.ceil(u/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:p=>Dd(p,e,s,n,a),getRunData:()=>({outputs:[{dims:s,dataType:a}],dispatchGroup:{x:Math.ceil(u/64/4)},programUniforms:[{type:12,data:l},...ee(i,t,r,s)]})}},hf=e=>{e.compute(Pd(e.inputs))}}),ff,Yy=P(()=>{cy(),an(),hy(),fy(),my(),gy(),yy(),vy(),Sy(),ky(),Iy(),Ty(),Cy(),Ey(),zy(),Ay(),Oy(),Ry(),By(),Ny(),My(),Dy(),Py(),Uy(),qy(),Oh(),Ly(),Wy(),Vy(),Gy(),Hy(),rn(),Fy(),Dh(),jy(),Ky(),Zy(),Nh(),Xy(),St(),nn(),Qy(),ff=new Map([["Abs",[sc]],["Acos",[oc]],["Acosh",[uc]],["Add",[Wc]],["ArgMax",[rc,za]],["ArgMin",[tc,za]],["Asin",[lc]],["Asinh",[dc]],["Atan",[pc]],["Atanh",[cc]],["Attention",[ic]],["AveragePool",[Fh,Hh]],["BatchNormalization",[ac]],["BiasAdd",[nc]],["BiasSplitGelu",[Lc]],["Cast",[fc,hc]],["Ceil",[gc]],["Clip",[mc]],["Concat",[Yc,Jc]],["Conv",[Ma,Na]],["ConvTranspose",[lh,uh]],["Cos",[yc]],["Cosh",[_c]],["CumSum",[dh,ph]],["DepthToSpace",[ch,hh]],["DequantizeLinear",[Jh,ef]],["Div",[Vc]],["Einsum",[fh,mh]],["Elu",[bc,mr]],["Equal",[Gc]],["Erf",[$c]],["Exp",[wc]],["Expand",[gh]],["FastGelu",[yh]],["Floor",[vc]],["FusedConv",[Ma,Na]],["Gather",[bh,_h]],["GatherElements",[kh,Sh]],["GatherBlockQuantized",[vh,xh]],["GatherND",[$h,wh]],["Gelu",[xc]],["Gemm",[Th,Ih]],["GlobalAveragePool",[Kh,jh]],["GlobalMaxPool",[Yh,Qh]],["Greater",[Kc]],["GreaterOrEqual",[Xc]],["GridSample",[Ch,Eh]],["GroupQueryAttention",[Ph]],["HardSigmoid",[Ac,zc]],["InstanceNormalization",[Uh]],["LayerNormalization",[qh]],["LeakyRelu",[Sc,mr]],["Less",[Zc]],["LessOrEqual",[Qc]],["Log",[Uc]],["MatMul",[Lh]],["MatMulNBits",[Wh,Vh]],["MaxPool",[Zh,Xh]],["Mul",[Hc]],["MultiHeadAttention",[Ah,zh]],["Neg",[Ic]],["Not",[kc]],["Pad",[Gh]],["Pow",[Fc]],["QuickGelu",[qc,mr]],["Range",[tf]],["Reciprocal",[Tc]],["ReduceMin",[Xp]],["ReduceMean",[Hp]],["ReduceMax",[Zp]],["ReduceSum",[Yp]],["ReduceProd",[Qp]],["ReduceL1",[Fp]],["ReduceL2",[jp]],["ReduceLogSum",[ec]],["ReduceLogSumExp",[Kp]],["ReduceSumSquare",[Jp]],["Relu",[Cc]],["Resize",[nf,sf]],["RotaryEmbedding",[Mh]],["ScatterND",[af,rf]],["Sigmoid",[Ec]],["Sin",[Oc]],["Sinh",[Rc]],["Slice",[uf,lf]],["SkipLayerNormalization",[of]],["Split",[Rh,Bh]],["Sqrt",[Bc]],["Softmax",[df,pf]],["Sub",[jc]],["Tan",[Nc]],["Tanh",[Mc]],["ThresholdedRelu",[Pc,mr]],["Tile",[cf]],["Transpose",[Rp,Bp]],["Where",[hf]]])}),mf,Jy=P(()=>{Fe(),ht(),ne(),mf=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,r,i,a){ot(e.programInfo.name);let n=this.backend.device,s=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let u=[];for(let p of t)u.push({binding:u.length,resource:{buffer:p.buffer}});for(let p of r)u.push({binding:u.length,resource:{buffer:p.buffer}});a&&u.push({binding:u.length,resource:a});let l=n.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:u,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let p={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:l,dispatchGroup:i};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(p)}s.setPipeline(e.computePipeline),s.setBindGroup(0,l),s.dispatchWorkgroups(...i),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),tt(e.programInfo.name)}dispose(){}build(e,t){ot(e.name);let r=this.backend.device,i=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(p=>{r.features.has(p.feature)&&i.push(`enable ${p.extension};`)});let a=Op(t,this.backend.device.limits),n=e.getShaderSource(a),s=`${i.join(`
`)}
${a.additionalImplementations}
${n}`,u=r.createShaderModule({code:s,label:e.name});pe("verbose",()=>`[WebGPU] ${e.name} shader code: ${s}`);let l=r.createComputePipeline({compute:{module:u,entryPoint:"main"},layout:"auto",label:e.name});return tt(e.name),{programInfo:e,computePipeline:l,uniformVariablesInfo:a.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,r=typeof e=="number"?1:e.y||1,i=typeof e=="number"?1:e.z||1,a=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=a&&r<=a&&i<=a)return[t,r,i];let n=t*r*i,s=Math.ceil(Math.sqrt(n));if(s>a){if(s=Math.ceil(Math.cbrt(n)),s>a)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[s,s,s]}else return[s,s,1]}}}),gf={};Qt(gf,{WebGpuBackend:()=>yf});var Ud,qd,Ld,yf,e_=P(()=>{Fe(),re(),ht(),Tp(),dy(),Yy(),Jy(),Ud=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let r=[];for(let i=0;i<e.length;++i){let a=e[i].dataType;switch(t[i]){case"none":{r.push("");break}case"type":{r.push(`${a}`);break}case"rank":{let n=e[i].dims.length;r.push(`${a};${n}`);break}case"dims":{let n=e[i].dims.join(",");r.push(`${a};${n}`);break}default:throw new Error(`unsupported input dependency: ${t[i]}`)}}return r.join("|")},qd=(e,t,r)=>{var a,n;let i=e.name;return(a=e.shaderCache)!=null&&a.hint&&(i+="["+e.shaderCache.hint+"]"),i+=":"+r+`:${Ud(t,((n=e.shaderCache)==null?void 0:n.inputDependencies)??new Array(t.length).fill("dims"))}`,i},Ld=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},yf=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let r=[],i={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},a=u=>t.features.has(u)&&r.push(u)&&!0;a("chromium-experimental-timestamp-query-inside-passes")||a("timestamp-query"),a("shader-f16"),a("subgroups"),this.device=await t.requestDevice(i);let n=t,s=t.info??(typeof n.requestAdapterInfo=="function"?await n.requestAdapterInfo():void 0);this.adapterInfo=new Ld(s),this.gpuDataManager=zp(this),this.programManager=new mf(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,Ya(e.logLevel,!!e.debug),this.device.onuncapturederror=u=>{u.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${u.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!0}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){var e;typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose(),this.device&&((e=this.env)!=null&&e.webgpu)&&this.device.lost.then(()=>{delete this.env.webgpu.device})}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;ot(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{var i;let t=new BigUint64Array(e.getMappedRange()),r=this.pendingQueries.get(e);for(let a=0;a<t.length/2;a++){let n=r[a],s=n.kernelId,u=this.kernels.get(s),l=u.kernelType,p=u.kernelName,c=n.programName,f=n.inputTensorViews,g=n.outputTensorViews,y=t[a*2],_=t[a*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=y);let b=Number(y-this.queryTimeBase),S=Number(_-this.queryTimeBase);if(!Number.isSafeInteger(b)||!Number.isSafeInteger(S))throw new RangeError("incorrect timestamp range");if((i=this.env.webgpu.profiling)!=null&&i.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:f.map(x=>({dims:x.dims,dataType:ct(x.dataType)})),outputsMetadata:g.map(x=>({dims:x.dims,dataType:ct(x.dataType)})),kernelId:s,kernelType:l,kernelName:p,programName:c,startTime:b,endTime:S});else{let x="";f.forEach((T,k)=>{x+=`input[${k}]: [${T.dims}] | ${ct(T.dataType)}, `});let $="";g.forEach((T,k)=>{$+=`output[${k}]: [${T.dims}] | ${ct(T.dataType)}, `}),console.log(`[profiling] kernel "${s}|${l}|${p}|${c}" ${x}${$}start time: ${b} ns, execution time: ${S-b} ns`)}Kr("GPU",`${c}::${y}::${_}`)}e.unmap(),this.pendingQueries.delete(e)}),tt()}run(e,t,r,i,a,n){ot(e.name);let s=[];for(let $=0;$<t.length;++$){let T=t[$].data;if(T===0)continue;let k=this.gpuDataManager.get(T);if(!k)throw new Error(`no GPU data for input: ${T}`);s.push(k)}let{outputs:u,dispatchGroup:l,programUniforms:p}=e.getRunData(t),c=r.length===0?u.map(($,T)=>T):r;if(c.length!==u.length)throw new Error(`Output size ${c.length} must be equal to ${u.length}.`);let f=[],g=[];for(let $=0;$<u.length;++$){if(!Number.isInteger(c[$])||c[$]<-3||c[$]>=n)throw new Error(`Invalid output index: ${c[$]}`);if(c[$]===-3)continue;let T=c[$]===-1,k=c[$]===-2,C=T||k?a(u[$].dataType,u[$].dims):i(c[$],u[$].dataType,u[$].dims);if(f.push(C),C.data===0)continue;let z=this.gpuDataManager.get(C.data);if(!z)throw new Error(`no GPU data for output: ${C.data}`);if(T&&this.temporaryData.push(z),k){let A=this.kernelPersistentData.get(this.currentKernelId);A||(A=[],this.kernelPersistentData.set(this.currentKernelId,A)),A.push(z)}g.push(z)}if(s.length!==t.length||g.length!==f.length){if(g.length===0)return tt(e.name),f;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let y;if(p){let $=0,T=[];p.forEach(A=>{let v=typeof A.data=="number"?[A.data]:A.data;if(v.length===0)return;let M=A.type===10?2:4,D,F;A.type===10?(F=v.length>4?16:v.length>2?8:v.length*M,D=v.length>4?16:M*v.length):(F=v.length<=2?v.length*M:16,D=16),$=Math.ceil($/F)*F,T.push($);let j=A.type===10?8:4;$+=v.length>4?Math.ceil(v.length/j)*D:v.length*M});let k=16;$=Math.ceil($/k)*k;let C=new ArrayBuffer($);p.forEach((A,v)=>{let M=T[v],D=typeof A.data=="number"?[A.data]:A.data;if(A.type===6)new Int32Array(C,M,D.length).set(D);else if(A.type===12)new Uint32Array(C,M,D.length).set(D);else if(A.type===10)new Uint16Array(C,M,D.length).set(D);else if(A.type===1)new Float32Array(C,M,D.length).set(D);else throw new Error(`Unsupported uniform type: ${ct(A.type)}`)});let z=this.gpuDataManager.create($,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(z.buffer,0,C,0,$),this.gpuDataManager.release(z.id),y={offset:0,size:$,buffer:z.buffer}}let _=this.programManager.normalizeDispatchGroupSize(l),b=_[1]===1&&_[2]===1,S=qd(e,t,b),x=this.programManager.getArtifact(S);if(x||(x=this.programManager.build(e,_),this.programManager.setArtifact(S,x),pe("info",()=>`[artifact] key: ${S}, programName: ${e.name}`)),p&&x.uniformVariablesInfo){if(p.length!==x.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${x.uniformVariablesInfo.length}, got ${p.length} in program "${x.programInfo.name}".`);for(let $=0;$<p.length;$++){let T=p[$],k=T.type,C=typeof T.data=="number"?1:T.data.length,[z,A]=x.uniformVariablesInfo[$];if(k!==z||C!==A)throw new Error(`Uniform variable ${$} mismatch: expect type ${z} with size ${A}, got type ${k} with size ${C} in program "${x.programInfo.name}".`)}}if(pe("info",()=>`[ProgramManager] run "${e.name}" (key=${S}) with ${_[0]}x${_[1]}x${_[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let $={kernelId:this.currentKernelId,programName:x.programInfo.name,inputTensorViews:t,outputTensorViews:f};this.pendingKernels.push($),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push($)}return this.programManager.run(x,s,g,_,y),tt(e.name),f}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,r,i){let a=ff.get(e);if(!a)throw new Error(`kernel not implemented: ${e}`);let n={kernelType:e,kernelName:i,kernelEntry:a[0],attributes:[a[1],r]};this.kernels.set(t,n)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let r of t)this.gpuDataManager.release(r.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,r){let i=this.kernels.get(e);if(!i)throw new Error(`kernel not created: ${e}`);let a=i.kernelType,n=i.kernelName,s=i.kernelEntry,u=i.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${a}] ${n}" is not allowed to be called recursively`);this.currentKernelId=e,u[0]&&(u[1]=u[0](u[1]),u[0]=void 0),pe("info",()=>`[WebGPU] Start to run kernel "[${a}] ${n}"...`);let l=this.env.debug;this.temporaryData=[];try{return l&&this.device.pushErrorScope("validation"),s(t,u[1]),0}catch(p){return r.push(Promise.resolve(`[WebGPU] Kernel "[${a}] ${n}" failed. ${p}`)),1}finally{l&&r.push(this.device.popErrorScope().then(p=>p?`GPU validation error for kernel "[${a}] ${n}": ${p.message}`:null));for(let p of this.temporaryData)this.gpuDataManager.release(p.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,r,i){let a=this.sessionExternalDataMapping.get(e);a||(a=new Map,this.sessionExternalDataMapping.set(e,a));let n=a.get(t),s=this.gpuDataManager.registerExternalBuffer(r,i,n);return a.set(t,[s,r]),s}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(r=>this.gpuDataManager.unregisterExternalBuffer(r[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,r){return async()=>{let i=await Ta(this,e,t);return Ja(i.buffer,r)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){var e;this.queryType="none",(((e=this.env.webgpu.profiling)==null?void 0:e.mode)==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){pe("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){pe("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){pe("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),r=e.length;this.pendingKernels=[];for(let i=0;i<r;i++){let a=this.getComputePassEncoder(),n=e[i];this.writeTimestamp(this.pendingDispatchNumber*2),a.setPipeline(n.computePipeline),a.setBindGroup(0,n.bindGroup),a.dispatchWorkgroups(...n.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[i]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),_f={};Qt(_f,{init:()=>bf});var Vr,Wd,bf,t_=P(()=>{re(),ht(),ae(),ly(),Vr=class $f{constructor(t,r,i,a){this.module=t,this.dataType=r,this.data=i,this.dims=a}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=O.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=O.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=O.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=O.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(O.size(t)!==O.size(this.dims))throw new Error("Invalid new shape");return new $f(this.module,this.dataType,this.data,t)}},Wd=class{constructor(e,t,r){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let i=e.PTR_SIZE,a=r/e.PTR_SIZE,n=i===4?"i32":"i64";this.opKernelContext=Number(e.getValue(i*a++,n));let s=Number(e.getValue(i*a++,n));this.outputCount=Number(e.getValue(i*a++,n)),this.customDataOffset=Number(e.getValue(i*a++,"*")),this.customDataSize=Number(e.getValue(i*a++,n));let u=[];for(let l=0;l<s;l++){let p=Number(e.getValue(i*a++,n)),c=Number(e.getValue(i*a++,"*")),f=Number(e.getValue(i*a++,n)),g=[];for(let y=0;y<f;y++)g.push(Number(e.getValue(i*a++,n)));u.push(new Vr(e,p,c,g))}this.inputs=u}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){var s;let r=((s=t==null?void 0:t.inputs)==null?void 0:s.map(u=>typeof u=="number"?this.inputs[u]:u))??this.inputs,i=(t==null?void 0:t.outputs)??[],a=(u,l,p)=>new Vr(this.module,l,this.output(u,p),p),n=(u,l)=>{let p=Mt(u,l);if(!p)throw new Error(`Unsupported data type: ${u}`);let c=p>0?this.backend.gpuDataManager.create(p).id:0;return new Vr(this.module,u,c,l)};return this.backend.run(e,r,i,a,n,this.outputCount)}output(e,t){let r=this.module.stackSave();try{let i=this.module.PTR_SIZE,a=i===4?"i32":"i64",n=this.module.stackAlloc((1+t.length)*i);this.module.setValue(n,t.length,a);for(let s=0;s<t.length;s++)this.module.setValue(n+i*(s+1),t[s],a);return this.module._JsepOutput(this.opKernelContext,e,n)}catch(i){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${i}`)}finally{this.module.stackRestore(r)}}},bf=async(e,t,r,i)=>{let a=t.jsepInit;if(!a)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let n=(e_(),_r(gf)).WebGpuBackend,s=new n;await s.initialize(r,i),a("webgpu",[s,u=>s.alloc(Number(u)),u=>s.free(u),(u,l,p,c=!1)=>{if(c)pe("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(u)}, dst=${Number(l)}, size=${Number(p)}`),s.memcpy(Number(u),Number(l));else{pe("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(u)}, gpuDataId=${Number(l)}, size=${Number(p)}`);let f=t.HEAPU8.subarray(Number(u>>>0),Number(u>>>0)+Number(p));s.upload(Number(l),f)}},async(u,l,p)=>{pe("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${u}, dataOffset=${l}, size=${p}`),await s.download(Number(u),()=>t.HEAPU8.subarray(Number(l)>>>0,Number(l+p)>>>0))},(u,l,p)=>s.createKernel(u,Number(l),p,t.UTF8ToString(t._JsepGetNodeName(Number(l)))),u=>s.releaseKernel(u),(u,l,p,c)=>{pe("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${p}, kernel=${u}, contextDataOffset=${l}`);let f=new Wd(t,s,Number(l));return s.computeKernel(Number(u),f,c)},()=>s.captureBegin(),()=>s.captureEnd(),()=>s.replay()])}else{let n=new Ep(r);a("webnn",[n,()=>n.reserveTensorId(),s=>n.releaseTensorId(s),async(s,u,l,p,c)=>n.ensureTensor(s,u,l,p,c),(s,u)=>{n.uploadTensor(s,u)},async(s,u)=>n.downloadTensor(s,u),(s,u)=>n.registerMLContext(s,u),!!r.trace])}}}),Vd,pn,cn,wt,Gd,ba,ti,hn,fn,$a,mn,gn,yn,wf=P(()=>{Fe(),sy(),oy(),re(),Wt(),Ka(),xp(),Vd=(e,t)=>{$e()._OrtInit(e,t)!==0&&ye("Can't initialize onnxruntime.")},pn=async e=>{Vd(e.wasm.numThreads,Xr(e.logLevel))},cn=async(e,t)=>{var i,a;(a=(i=$e()).asyncInit)==null||a.call(i);let r=e.webgpu.adapter;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(r){if(typeof r.limits!="object"||typeof r.features!="object"||typeof r.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let n=e.webgpu.powerPreference;if(n!==void 0&&n!=="low-power"&&n!=="high-performance")throw new Error(`Invalid powerPreference setting: "${n}"`);let s=e.webgpu.forceFallbackAdapter;if(s!==void 0&&typeof s!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${s}"`);if(r=await navigator.gpu.requestAdapter({powerPreference:n,forceFallbackAdapter:s}),!r)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(t==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment");{let n=(t_(),_r(_f)).init;t==="webgpu"&&await n("webgpu",$e(),e,r),t==="webnn"&&await n("webnn",$e(),e)}},wt=new Map,Gd=e=>{let t=$e(),r=t.stackSave();try{let i=t.PTR_SIZE,a=t.stackAlloc(2*i);t._OrtGetInputOutputCount(e,a,a+i)!==0&&ye("Can't get session input/output count.");let n=i===4?"i32":"i64";return[Number(t.getValue(a,n)),Number(t.getValue(a+i,n))]}finally{t.stackRestore(r)}},ba=(e,t)=>{let r=$e(),i=r.stackSave(),a=0;try{let n=r.PTR_SIZE,s=r.stackAlloc(2*n);r._OrtGetInputOutputMetadata(e,t,s,s+n)!==0&&ye("Can't get session input/output metadata.");let u=Number(r.getValue(s,"*"));a=Number(r.getValue(s+n,"*"));let l=r.HEAP32[a/4];if(l===0)return[u,0];let p=r.HEAPU32[a/4+1],c=[];for(let f=0;f<p;f++){let g=Number(r.getValue(a+8+f*n,"*"));c.push(g!==0?r.UTF8ToString(g):Number(r.getValue(a+8+(f+p)*n,"*")))}return[u,l,c]}finally{r.stackRestore(i),a!==0&&r._OrtFree(a)}},ti=e=>{let t=$e(),r=t._malloc(e.byteLength);if(r===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},hn=async(e,t)=>{var f,g,y,_;let r,i,a=$e();Array.isArray(e)?[r,i]=e:e.buffer===a.HEAPU8.buffer?[r,i]=[e.byteOffset,e.byteLength]:[r,i]=ti(e);let n=0,s=0,u=0,l=[],p=[],c=[];try{if([s,l]=await vp(t),(t==null?void 0:t.externalData)&&a.mountExternalData){let v=[];for(let M of t.externalData){let D=typeof M=="string"?M:M.path;v.push(Qa(typeof M=="string"?M:M.data).then(F=>{a.mountExternalData(D,F)}))}await Promise.all(v)}for(let v of(t==null?void 0:t.executionProviders)??[])if((typeof v=="string"?v:v.name)==="webnn"){if(a.shouldTransferToMLTensor=!1,typeof v!="string"){let M=v,D=M==null?void 0:M.context,F=M==null?void 0:M.gpuDevice,j=M==null?void 0:M.deviceType,K=M==null?void 0:M.powerPreference;D?a.currentContext=D:F?a.currentContext=await a.webnnCreateMLContext(F):a.currentContext=await a.webnnCreateMLContext({deviceType:j,powerPreference:K})}else a.currentContext=await a.webnnCreateMLContext();break}n=await a._OrtCreateSession(r,i,s),(f=a.webgpuOnCreateSession)==null||f.call(a,n),n===0&&ye("Can't create a session."),(g=a.jsepOnCreateSession)==null||g.call(a),a.currentContext&&(a.webnnRegisterMLContext(n,a.currentContext),a.currentContext=void 0,a.shouldTransferToMLTensor=!0);let[b,S]=Gd(n),x=!!(t!=null&&t.enableGraphCapture),$=[],T=[],k=[],C=[],z=[];for(let v=0;v<b;v++){let[M,D,F]=ba(n,v);M===0&&ye("Can't get an input name."),p.push(M);let j=a.UTF8ToString(M);$.push(j),k.push(D===0?{name:j,isTensor:!1}:{name:j,isTensor:!0,type:ct(D),shape:F})}for(let v=0;v<S;v++){let[M,D,F]=ba(n,v+b);M===0&&ye("Can't get an output name."),c.push(M);let j=a.UTF8ToString(M);T.push(j),C.push(D===0?{name:j,isTensor:!1}:{name:j,isTensor:!0,type:ct(D),shape:F});{if(x&&(t==null?void 0:t.preferredOutputLocation)===void 0){z.push("gpu-buffer");continue}let K=typeof(t==null?void 0:t.preferredOutputLocation)=="string"?t.preferredOutputLocation:((y=t==null?void 0:t.preferredOutputLocation)==null?void 0:y[j])??"cpu",R=a.webnnIsGraphOutput;if(K==="cpu"&&R&&R(n,j)){z.push("ml-tensor-cpu-output");continue}if(K!=="cpu"&&K!=="cpu-pinned"&&K!=="gpu-buffer"&&K!=="ml-tensor")throw new Error(`Not supported preferred output location: ${K}.`);if(x&&K!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${K}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);z.push(K)}}let A=null;return z.some(v=>v==="gpu-buffer"||v==="ml-tensor"||v==="ml-tensor-cpu-output")&&(u=a._OrtCreateBinding(n),u===0&&ye("Can't create IO binding."),A={handle:u,outputPreferredLocations:z,outputPreferredLocationsEncoded:z.map(v=>v==="ml-tensor-cpu-output"?"ml-tensor":v).map(v=>ka(v))}),wt.set(n,[n,p,c,A,x,!1]),[n,$,T,k,C]}catch(b){throw p.forEach(S=>a._OrtFree(S)),c.forEach(S=>a._OrtFree(S)),u!==0&&a._OrtReleaseBinding(u)!==0&&ye("Can't release IO binding."),n!==0&&a._OrtReleaseSession(n)!==0&&ye("Can't release session."),b}finally{a._free(r),s!==0&&a._OrtReleaseSessionOptions(s)!==0&&ye("Can't release session options."),l.forEach(b=>a._free(b)),(_=a.unmountExternalData)==null||_.call(a)}},fn=e=>{var l,p,c;let t=$e(),r=wt.get(e);if(!r)throw new Error(`cannot release session. invalid session id: ${e}`);let[i,a,n,s,u]=r;s&&(u&&t._OrtClearBoundOutputs(s.handle)!==0&&ye("Can't clear bound outputs."),t._OrtReleaseBinding(s.handle)!==0&&ye("Can't release IO binding.")),(l=t.jsepOnReleaseSession)==null||l.call(t,e),(p=t.webnnOnReleaseSession)==null||p.call(t,e),(c=t.webgpuOnReleaseSession)==null||c.call(t,e),a.forEach(f=>t._OrtFree(f)),n.forEach(f=>t._OrtFree(f)),t._OrtReleaseSession(i)!==0&&ye("Can't release session."),wt.delete(e)},$a=async(e,t,r,i,a,n,s=!1)=>{if(!e){t.push(0);return}let u=$e(),l=u.PTR_SIZE,p=e[0],c=e[1],f=e[3],g=f,y,_;if(p==="string"&&(f==="gpu-buffer"||f==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(s&&f!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${n} when enableGraphCapture is true.`);if(f==="gpu-buffer"){let x=e[2].gpuBuffer;_=Mt(Nt(p),c);{let $=u.jsepRegisterBuffer;if(!$)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');y=$(i,n,x,_)}}else if(f==="ml-tensor"){let x=e[2].mlTensor;_=Mt(Nt(p),c);let $=u.webnnRegisterMLTensor;if(!$)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');y=$(i,x,Nt(p),c)}else{let x=e[2];if(Array.isArray(x)){_=l*x.length,y=u._malloc(_),r.push(y);for(let $=0;$<x.length;$++){if(typeof x[$]!="string")throw new TypeError(`tensor data at index ${$} is not a string`);u.setValue(y+$*l,Je(x[$],r),"*")}}else{let $=u.webnnIsGraphInput,T=u.webnnIsGraphOutput;if(p!=="string"&&$&&T){let k=u.UTF8ToString(a);if($(i,k)||T(i,k)){let C=Nt(p);_=Mt(C,c),g="ml-tensor";let z=u.webnnCreateTemporaryTensor,A=u.webnnUploadTensor;if(!z||!A)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let v=await z(i,C,c);A(v,new Uint8Array(x.buffer,x.byteOffset,x.byteLength)),y=v}else _=x.byteLength,y=u._malloc(_),r.push(y),u.HEAPU8.set(new Uint8Array(x.buffer,x.byteOffset,_),y)}else _=x.byteLength,y=u._malloc(_),r.push(y),u.HEAPU8.set(new Uint8Array(x.buffer,x.byteOffset,_),y)}}let b=u.stackSave(),S=u.stackAlloc(4*c.length);try{c.forEach(($,T)=>u.setValue(S+T*l,$,l===4?"i32":"i64"));let x=u._OrtCreateTensor(Nt(p),y,_,S,c.length,ka(g));x===0&&ye(`Can't create tensor for input/output. session=${i}, index=${n}.`),t.push(x)}finally{u.stackRestore(b)}},mn=async(e,t,r,i,a,n)=>{var j,K,R,Z;let s=$e(),u=s.PTR_SIZE,l=wt.get(e);if(!l)throw new Error(`cannot run inference. invalid session id: ${e}`);let p=l[0],c=l[1],f=l[2],g=l[3],y=l[4],_=l[5],b=t.length,S=i.length,x=0,$=[],T=[],k=[],C=[],z=[],A=s.stackSave(),v=s.stackAlloc(b*u),M=s.stackAlloc(b*u),D=s.stackAlloc(S*u),F=s.stackAlloc(S*u);try{[x,$]=wp(n),Dt("wasm prepareInputOutputTensor");for(let V=0;V<b;V++)await $a(r[V],T,C,e,c[t[V]],t[V],y);for(let V=0;V<S;V++)await $a(a[V],k,C,e,f[i[V]],b+i[V],y);Pt("wasm prepareInputOutputTensor");for(let V=0;V<b;V++)s.setValue(v+V*u,T[V],"*"),s.setValue(M+V*u,c[t[V]],"*");for(let V=0;V<S;V++)s.setValue(D+V*u,k[V],"*"),s.setValue(F+V*u,f[i[V]],"*");if(g&&!_){let{handle:V,outputPreferredLocations:le,outputPreferredLocationsEncoded:U}=g;if(c.length!==b)throw new Error(`input count from feeds (${b}) is expected to be always equal to model's input count (${c.length}).`);Dt("wasm bindInputsOutputs");for(let G=0;G<b;G++){let Q=t[G];await s._OrtBindInput(V,c[Q],T[G])!==0&&ye(`Can't bind input[${G}] for session=${e}.`)}for(let G=0;G<S;G++){let Q=i[G];(j=a[G])!=null&&j[3]?(z.push(k[G]),s._OrtBindOutput(V,f[Q],k[G],0)!==0&&ye(`Can't bind pre-allocated output[${G}] for session=${e}.`)):s._OrtBindOutput(V,f[Q],0,U[Q])!==0&&ye(`Can't bind output[${G}] to ${le[G]} for session=${e}.`)}Pt("wasm bindInputsOutputs"),wt.set(e,[p,c,f,g,y,!0])}(K=s.jsepOnRunStart)==null||K.call(s,p),(R=s.webnnOnRunStart)==null||R.call(s,p);let X;g?X=await s._OrtRunWithBinding(p,g.handle,S,D,x):X=await s._OrtRun(p,M,v,b,F,S,D,x),X!==0&&ye("failed to call OrtRun().");let te=[],fe=[];Dt("wasm ProcessOutputTensor");for(let V=0;V<S;V++){let le=Number(s.getValue(D+V*u,"*"));if(le===k[V]||z.includes(k[V])){te.push(a[V]),le!==k[V]&&s._OrtReleaseTensor(le)!==0&&ye("Can't release tensor.");continue}let U=s.stackSave(),G=s.stackAlloc(4*u),Q=!1,q,ge=0;try{s._OrtGetTensorData(le,G,G+u,G+2*u,G+3*u)!==0&&ye(`Can't access output tensor data on index ${V}.`);let Ge=u===4?"i32":"i64",ke=Number(s.getValue(G,Ge));ge=s.getValue(G+u,"*");let Ne=s.getValue(G+u*2,"*"),Me=Number(s.getValue(G+u*3,Ge)),Ue=[];for(let we=0;we<Me;we++)Ue.push(Number(s.getValue(Ne+we*u,Ge)));s._OrtFree(Ne)!==0&&ye("Can't free memory for tensor dims.");let De=Ue.reduce((we,ie)=>we*ie,1);q=ct(ke);let ft=g==null?void 0:g.outputPreferredLocations[i[V]];if(q==="string"){if(ft==="gpu-buffer"||ft==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let we=[];for(let ie=0;ie<De;ie++){let qe=s.getValue(ge+ie*u,"*"),$r=s.getValue(ge+(ie+1)*u,"*"),Yt=ie===De-1?void 0:$r-qe;we.push(s.UTF8ToString(qe,Yt))}te.push([q,Ue,we,"cpu"])}else if(ft==="gpu-buffer"&&De>0){let we=s.jsepGetBuffer;if(!we)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let ie=we(ge),qe=Mt(ke,De);if(qe===void 0||!Za(q))throw new Error(`Unsupported data type: ${q}`);Q=!0,te.push([q,Ue,{gpuBuffer:ie,download:s.jsepCreateDownloader(ie,qe,q),dispose:()=>{s._OrtReleaseTensor(le)!==0&&ye("Can't release tensor.")}},"gpu-buffer"])}else if(ft==="ml-tensor"&&De>0){let we=s.webnnEnsureTensor,ie=s.webnnIsGraphInputOutputTypeSupported;if(!we||!ie)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(Mt(ke,De)===void 0||!Xa(q))throw new Error(`Unsupported data type: ${q}`);if(!ie(e,q,!1))throw new Error(`preferredLocation "ml-tensor" for ${q} output is not supported by current WebNN Context.`);let qe=await we(e,ge,ke,Ue,!1);Q=!0,te.push([q,Ue,{mlTensor:qe,download:s.webnnCreateMLTensorDownloader(ge,q),dispose:()=>{s.webnnReleaseTensorId(ge),s._OrtReleaseTensor(le)}},"ml-tensor"])}else if(ft==="ml-tensor-cpu-output"&&De>0){let we=s.webnnCreateMLTensorDownloader(ge,q)(),ie=te.length;Q=!0,fe.push((async()=>{let qe=[ie,await we];return s.webnnReleaseTensorId(ge),s._OrtReleaseTensor(le),qe})()),te.push([q,Ue,[],"cpu"])}else{let we=ri(q),ie=new we(De);new Uint8Array(ie.buffer,ie.byteOffset,ie.byteLength).set(s.HEAPU8.subarray(ge,ge+ie.byteLength)),te.push([q,Ue,ie,"cpu"])}}finally{s.stackRestore(U),q==="string"&&ge&&s._free(ge),Q||s._OrtReleaseTensor(le)}}g&&!y&&(s._OrtClearBoundOutputs(g.handle)!==0&&ye("Can't clear bound outputs."),wt.set(e,[p,c,f,g,y,!1]));for(let[V,le]of await Promise.all(fe))te[V][2]=le;return Pt("wasm ProcessOutputTensor"),te}finally{(Z=s.webnnOnRunEnd)==null||Z.call(s,p),s.stackRestore(A),T.forEach(X=>s._OrtReleaseTensor(X)),k.forEach(X=>s._OrtReleaseTensor(X)),C.forEach(X=>s._free(X)),x!==0&&s._OrtReleaseRunOptions(x),$.forEach(X=>s._free(X))}},gn=e=>{let t=$e(),r=wt.get(e);if(!r)throw new Error("invalid session id");let i=r[0],a=t._OrtEndProfiling(i);a===0&&ye("Can't get an profile file name."),t._OrtFree(a)},yn=e=>{let t=[];for(let r of e){let i=r[2];!Array.isArray(i)&&"buffer"in i&&t.push(i.buffer)}return t}}),vt,Pe,Ft,pr,cr,Gr,wa,Hr,At,Ot,Hd,vf,xf,Sf,kf,If,Tf,Cf,Ef=P(()=>{Fe(),wf(),Wt(),Fa(),vt=()=>!!be.wasm.proxy&&typeof document<"u",Ft=!1,pr=!1,cr=!1,Hr=new Map,At=(e,t)=>{let r=Hr.get(e);r?r.push(t):Hr.set(e,[t])},Ot=()=>{if(Ft||!pr||cr||!Pe)throw new Error("worker not ready")},Hd=e=>{switch(e.data.type){case"init-wasm":Ft=!1,e.data.err?(cr=!0,wa[1](e.data.err)):(pr=!0,wa[0]()),Gr&&(URL.revokeObjectURL(Gr),Gr=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=Hr.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}}},vf=async()=>{if(!pr){if(Ft)throw new Error("multiple calls to 'initWasm()' detected.");if(cr)throw new Error("previous call to 'initWasm()' failed.");if(Ft=!0,vt())return new Promise((e,t)=>{Pe==null||Pe.terminate(),bp().then(([r,i])=>{try{Pe=i,Pe.onerror=n=>t(n),Pe.onmessage=Hd,wa=[e,t];let a={type:"init-wasm",in:be};!a.in.wasm.wasmPaths&&(r||Sa)&&(a.in.wasm.wasmPaths={wasm:new URL("/assets/ort-wasm-simd-threaded.jsep-DC5y_g6C.wasm",import.meta.url).href}),Pe.postMessage(a),Gr=r}catch(a){t(a)}},t)});try{await ja(be.wasm),await pn(be),pr=!0}catch(e){throw cr=!0,e}finally{Ft=!1}}},xf=async e=>{if(vt())return Ot(),new Promise((t,r)=>{At("init-ep",[t,r]);let i={type:"init-ep",in:{epName:e,env:be}};Pe.postMessage(i)});await cn(be,e)},Sf=async e=>vt()?(Ot(),new Promise((t,r)=>{At("copy-from",[t,r]);let i={type:"copy-from",in:{buffer:e}};Pe.postMessage(i,[e.buffer])})):ti(e),kf=async(e,t)=>{if(vt()){if(t!=null&&t.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return Ot(),new Promise((r,i)=>{At("create",[r,i]);let a={type:"create",in:{model:e,options:{...t}}},n=[];e instanceof Uint8Array&&n.push(e.buffer),Pe.postMessage(a,n)})}else return hn(e,t)},If=async e=>{if(vt())return Ot(),new Promise((t,r)=>{At("release",[t,r]);let i={type:"release",in:e};Pe.postMessage(i)});fn(e)},Tf=async(e,t,r,i,a,n)=>{if(vt()){if(r.some(s=>s[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(a.some(s=>s))throw new Error("pre-allocated output tensor is not supported for proxy.");return Ot(),new Promise((s,u)=>{At("run",[s,u]);let l=r,p={type:"run",in:{sessionId:e,inputIndices:t,inputs:l,outputIndices:i,options:n}};Pe.postMessage(p,yn(l))})}else return mn(e,t,r,i,a,n)},Cf=async e=>{if(vt())return Ot(),new Promise((t,r)=>{At("end-profiling",[t,r]);let i={type:"end-profiling",in:e};Pe.postMessage(i)});gn(e)}}),va,Fd,zf,r_=P(()=>{Fe(),Ef(),re(),Ha(),xp(),va=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},Fd=e=>{switch(e[3]){case"cpu":return new et(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!Za(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:i,dispose:a}=e[2];return et.fromGpuBuffer(r,{dataType:t,dims:e[1],download:i,dispose:a})}case"ml-tensor":{let t=e[0];if(!Xa(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:i,dispose:a}=e[2];return et.fromMLTensor(r,{dataType:t,dims:e[1],download:i,dispose:a})}default:throw new Error(`invalid data location: ${e[3]}`)}},zf=class{async fetchModelAndCopyToWasmMemory(e){return Sf(await Qa(e))}async loadModel(e,t){ot();let r;typeof e=="string"?r=await this.fetchModelAndCopyToWasmMemory(e):r=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await kf(r,t),tt()}async dispose(){return If(this.sessionId)}async run(e,t,r){ot();let i=[],a=[];Object.entries(e).forEach(f=>{let g=f[0],y=f[1],_=this.inputNames.indexOf(g);if(_===-1)throw new Error(`invalid input '${g}'`);i.push(y),a.push(_)});let n=[],s=[];Object.entries(t).forEach(f=>{let g=f[0],y=f[1],_=this.outputNames.indexOf(g);if(_===-1)throw new Error(`invalid output '${g}'`);n.push(y),s.push(_)});let u=i.map((f,g)=>va(f,()=>`input "${this.inputNames[a[g]]}"`)),l=n.map((f,g)=>f?va(f,()=>`output "${this.outputNames[s[g]]}"`):null),p=await Tf(this.sessionId,a,u,s,l,r),c={};for(let f=0;f<p.length;f++)c[this.outputNames[s[f]]]=n[f]??Fd(p[f]);return tt(),c}startProfiling(){}endProfiling(){Cf(this.sessionId)}}}),Af={};Qt(Af,{OnnxruntimeWebAssemblyBackend:()=>Ua,initializeFlags:()=>Pa,wasmBackend:()=>Of});var Pa,Ua,Of,i_=P(()=>{Fe(),Ef(),r_(),Pa=()=>{(typeof be.wasm.initTimeout!="number"||be.wasm.initTimeout<0)&&(be.wasm.initTimeout=0);let e=be.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),be.wasm.simd=!1),typeof be.wasm.proxy!="boolean"&&(be.wasm.proxy=!1),typeof be.wasm.trace!="boolean"&&(be.wasm.trace=!1),typeof be.wasm.numThreads!="number"||!Number.isInteger(be.wasm.numThreads)||be.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)be.wasm.numThreads=1;else{let t=typeof navigator>"u"?W0("node:os").cpus().length:navigator.hardwareConcurrency;be.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},Ua=class{async init(e){Pa(),await vf(),await xf(e)}async createInferenceSessionHandler(e,t){let r=new zf;return await r.loadModel(e,t),r}},Of=new Ua});Fe();Fe();Fe();var a_="1.27.0";{let e=(i_(),_r(Af)).wasmBackend;jt("webgpu",e,5),jt("webnn",e,5),jt("cpu",e,10),jt("wasm",e,10)}Object.defineProperty(be.versions,"web",{value:a_,enumerable:!0});/**
* @license
* Copyright 2021 Google LLC. All Rights Reserved.
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* =============================================================================
*//**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 *//**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */be.wasm.wasmPaths="/wasm/";be.wasm.numThreads=1;const n_={0:{code:"Clear",name:"无云",abbr:"",family:"无云",genus:"无云",genusId:""},1:{code:"Ci_fib",name:"毛卷云",abbr:"Ci fib",family:"高云",genus:"卷云",genusId:"cirrus"},2:{code:"Ci_unc",name:"钩卷云",abbr:"Ci unc",family:"高云",genus:"卷云",genusId:"cirrus"},3:{code:"Ci_spi",name:"密卷云",abbr:"Ci spi",family:"高云",genus:"卷云",genusId:"cirrus"},4:{code:"Ci_cas",name:"堡状卷云",abbr:"Ci cas",family:"高云",genus:"卷云",genusId:"cirrus"},5:{code:"Ci_flo",name:"絮状卷云",abbr:"Ci flo",family:"高云",genus:"卷云",genusId:"cirrus"},6:{code:"Cc_str",name:"成层状卷积云",abbr:"Cc str",family:"高云",genus:"卷积云",genusId:"cirrocumulus"},7:{code:"Cc_len",name:"荚状卷积云",abbr:"Cc len",family:"高云",genus:"卷积云",genusId:"cirrocumulus"},8:{code:"Cc_cas",name:"堡状卷积云",abbr:"Cc cas",family:"高云",genus:"卷积云",genusId:"cirrocumulus"},9:{code:"Cc_flo",name:"絮状卷积云",abbr:"Cc flo",family:"高云",genus:"卷积云",genusId:"cirrocumulus"},10:{code:"Cs_fib",name:"毛卷层云",abbr:"Cs fib",family:"高云",genus:"卷层云",genusId:"cirrostratus"},11:{code:"Cs_neb",name:"薄幕卷层云",abbr:"Cs neb",family:"高云",genus:"卷层云",genusId:"cirrostratus"},12:{code:"Ac_str",name:"成层状高积云",abbr:"Ac str",family:"中云",genus:"高积云",genusId:"altocumulus"},13:{code:"Ac_len",name:"荚状高积云",abbr:"Ac len",family:"中云",genus:"高积云",genusId:"altocumulus"},14:{code:"Ac_cas",name:"堡状高积云",abbr:"Ac cas",family:"中云",genus:"高积云",genusId:"altocumulus"},15:{code:"Ac_flo",name:"絮状高积云",abbr:"Ac flo",family:"中云",genus:"高积云",genusId:"altocumulus"},16:{code:"Ac_vol",name:"卷滚高积云",abbr:"Ac vol",family:"中云",genus:"高积云",genusId:"altocumulus"},17:{code:"As",name:"高层云",abbr:"As",family:"中云",genus:"高层云",genusId:"altostratus"},18:{code:"Ns",name:"雨层云",abbr:"Ns",family:"中云",genus:"雨层云",genusId:"nimbostratus"},19:{code:"Sc_str",name:"成层状层积云",abbr:"Sc str",family:"低云",genus:"层积云",genusId:"stratocumulus"},20:{code:"Sc_len",name:"荚状层积云",abbr:"Sc len",family:"低云",genus:"层积云",genusId:"stratocumulus"},21:{code:"Sc_cas",name:"堡状层积云",abbr:"Sc cas",family:"低云",genus:"层积云",genusId:"stratocumulus"},22:{code:"Sc_flo",name:"絮状层积云",abbr:"Sc flo",family:"低云",genus:"层积云",genusId:"stratocumulus"},23:{code:"Sc_vol",name:"卷滚层积云",abbr:"Sc vol",family:"低云",genus:"层积云",genusId:"stratocumulus"},24:{code:"St_neb",name:"薄幕层云",abbr:"St neb",family:"低云",genus:"层云",genusId:"stratus"},25:{code:"St_fra",name:"碎层云",abbr:"St fra",family:"低云",genus:"层云",genusId:"stratus"},26:{code:"Cu_hum",name:"淡积云",abbr:"Cu hum",family:"低云",genus:"积云",genusId:"cumulus"},27:{code:"Cu_med",name:"中积云",abbr:"Cu med",family:"低云",genus:"积云",genusId:"cumulus"},28:{code:"Cu_con",name:"浓积云",abbr:"Cu con",family:"低云",genus:"积云",genusId:"cumulus"},29:{code:"Cu_fra",name:"碎积云",abbr:"Cu fra",family:"低云",genus:"积云",genusId:"cumulus"},30:{code:"Cb_cal",name:"秃积雨云",abbr:"Cb cal",family:"低云",genus:"积雨云",genusId:"cumulonimbus"},31:{code:"Cb_cap",name:"鬃积雨云",abbr:"Cb cap",family:"低云",genus:"积雨云",genusId:"cumulonimbus"}},jd={0:{level:"0/10",oktas:0,description:"晴空无云"},1:{level:"1/10",oktas:1,description:"云量极少"},2:{level:"2/10",oktas:1,description:"云量少"},3:{level:"3/10",oktas:2,description:"云量较少"},4:{level:"4/10",oktas:3,description:"云量适中"},5:{level:"5/10",oktas:4,description:"云量中等"},6:{level:"6/10",oktas:5,description:"云量较多"},7:{level:"7/10",oktas:6,description:"云量多"},8:{level:"8/10",oktas:7,description:"云量很多"},9:{level:"9/10",oktas:8,description:"云量极多"},10:{level:"10/10",oktas:8,description:"全天密云"}};class s_{constructor(){dt(this,"session",null);dt(this,"inputName","image");dt(this,"speciesOutputName","species_logits");dt(this,"coverOutputName","cover_logits");dt(this,"loading",!1);dt(this,"IMAGE_SIZE",128);dt(this,"SPECIES_THRESHOLD",.3)}async init(){if(!this.session){if(this.loading)return await new Promise(t=>setTimeout(t,100)),this.init();this.loading=!0;try{this.session=await Ga.create("/models/mc_segnet_cloud.onnx",{executionProviders:["wasm"],graphOptimizationLevel:"all"}),this.inputName=this.session.inputNames[0];const t=this.session.outputNames;this.speciesOutputName=t[0]||"species_logits",this.coverOutputName=t[1]||"cover_logits",console.log("模型加载完成:",{input:this.inputName,outputs:t})}finally{this.loading=!1}}}async recognize(t){if(await this.init(),!this.session)throw new Error("模型未初始化");const r=await this.preprocessImage(t),i=await this.session.run({[this.inputName]:r}),a=i[this.speciesOutputName].data,n=i[this.coverOutputName].data,s=this.sigmoid(a),u=this.softmax(n),l=this.argmax(n),p=u[l],c=[];for(let g=0;g<s.length;g++)if(g!==0&&s[g]>=this.SPECIES_THRESHOLD){const y=n_[g];y&&c.push({index:g,code:y.code,name:y.name,abbr:y.abbr,family:y.family,genus:y.genus,genusId:y.genusId,probability:s[g]})}c.sort((g,y)=>y.probability-g.probability);let f;return c.length===0?f={index:0,code:"Clear",name:"无云",abbr:"",family:"无云",genus:"无云",genusId:"",probability:s[0]}:f=c[0],{detectedSpecies:c,primarySpecies:f,cloudCover:{index:l,...jd[l]||jd[0],confidence:p},coverProbabilities:Array.from(u)}}async preprocessImage(t){let r;typeof t=="string"?(r=new Image,r.crossOrigin="anonymous",await new Promise((_,b)=>{r.onload=_,r.onerror=b,r.src=t})):t instanceof HTMLCanvasElement?(r=new Image,await new Promise(_=>{r.onload=_,r.src=t.toDataURL()})):r=t;const i=document.createElement("canvas"),a=this.IMAGE_SIZE;i.width=a,i.height=a;const n=i.getContext("2d");n.fillStyle="#000000",n.fillRect(0,0,a,a);const s=Math.min(a/r.width,a/r.height),u=r.width*s,l=r.height*s;n.drawImage(r,(a-u)/2,(a-l)/2,u,l);const p=n.getImageData(0,0,a,a),{data:c}=p,f=[.485,.456,.406],g=[.229,.224,.225],y=new Float32Array(3*a*a);for(let _=0;_<a*a;_++)y[_]=(c[_*4]/255-f[0])/g[0],y[_+a*a]=(c[_*4+1]/255-f[1])/g[1],y[_+2*a*a]=(c[_*4+2]/255-f[2])/g[2];return new et("float32",y,[1,3,a,a])}argmax(t){let r=0,i=t[0];for(let a=1;a<t.length;a++)t[a]>i&&(i=t[a],r=a);return r}sigmoid(t){return new Float32Array(t.map(r=>1/(1+Math.exp(-r))))}softmax(t){const r=Math.max(...t),i=t.map(n=>Math.exp(n-r)),a=i.reduce((n,s)=>n+s,0);return new Float32Array(i.map(n=>n/a))}}const o_=new s_,u_={class:"identify-view"},l_={key:0,class:"hero-section"},d_={key:1,class:"upload-section"},p_={class:"upload-container"},c_={key:2,class:"vllm-section"},h_={class:"vllm-container"},f_={class:"vllm-prompts"},m_={class:"prompt-card"},g_={key:0,class:"prompt-body"},y_={class:"prompt-card"},__={key:0,class:"prompt-body"},b_={key:3,class:"recognizing-section"},$_={key:4,class:"result-section"},w_={class:"result-layout"},v_={class:"result-left"},x_={class:"image-container"},S_=["src"],k_={class:"result-right"},Kd=`你是一位资深的气象学家和云观测专家，拥有多年地面气象观测和云天观测经验。你精通世界气象组织（WMO）《国际云图集》和中国国家标准《地面气象观测规范 云》(GB/T 35222—2017) 中关于云的分类体系。

你的核心任务是：根据用户提供的云图片，严格按照气象学标准，系统性地识别图中所有云的类型（云族、云属、云类），并准确估算云量。

你必须遵循以下工作原则：
- 仅识别图片中可见的云，不要凭空臆测图片之外的信息
- 当不确定时，明确说明不确定性，而非强行给出确定判断
- 优先考虑最显著的云属，再分析次要云属
- 所有术语必须同时给出中文名和国际缩写

===== 知识库：云的分类体系 =====

## 一、云的三族十属

### 1.1 云族与云高参考
| 云族 | 中国标准云底高度 | 包含云属 |
|------|----------------|----------|
| 高云 | >4500m | 卷云(Ci)、卷层云(Cs)、卷积云(Cc) |
| 中云 | 2500-4500m | 高层云(As)、高积云(Ac) |
| 低云 | 100-2500m | 层积云(Sc)、层云(St)、雨层云(Ns) |
| 直展云 | 底部100-2500m | 积云(Cu)、积雨云(Cb) |

### 1.2 十大云属特征速查

**卷云(Ci)**：丝缕状，有光泽，高空白色
**卷层云(Cs)**：薄如纱，有晕环，日月清楚
**卷积云(Cc)**：鱼鳞小，波纹状，白色柔光
**高层云(As)**：灰白色，有条纹，日月模糊
**高积云(Ac)**：块小圆，排成行，鱼鳞瓦块
**层积云(Sc)**：块大灰，排成行，波状排列
**层云(St)**：低又匀，灰蒙蒙，像雾不接地
**雨层云(Ns)**：暗灰色，布满天，连续降水
**积云(Cu)**：底部平，顶凸起，像花椰菜
**积雨云(Cb)**：像高山，顶有丝，底部暗

===== 识别推理流程 =====

## 三、链式思考(CoT)推理步骤

对每张图片，请严格按以下步骤进行推理分析：

### 第一步：整体观察
- 确认拍摄视角（仰视/平视/俯视/航拍/卫星）
- 评估图片质量（清晰度、光线条件、视野范围）

### 第二步：云层分层
- 识别图中是否有多层云（高/中/低各层分别有什么）
- 注意不同层云之间的遮挡关系

### 第三步：逐层识别
观察形态 →
├── 垂直发展明显（花椰菜/高塔状）→ 积云(Cu)或积雨云(Cb)
├── 水平铺展（层状/片状）→ 层云/层积云/高积云/高层云
└── 丝缕/纤维状（高空）→ 卷云(Ci)/卷层云(Cs)/卷积云(Cc)

### 第四步：易混淆场景排查
| 场景 | 区分要点 |
|------|----------|
| 高层云(As) vs 卷层云(Cs) | As：日月模糊、无晕；Cs：日月清楚、有晕 |
| 高积云(Ac) vs 层积云(Sc) | Ac：云块小(1°-5°)；Sc：云块大(>5°) |
| 卷积云(Cc) vs 高积云(Ac) | Cc：白色无暗影、有柔丝光泽；Ac：可有暗影 |

### 第五步：综合输出
将以上分析综合为结构化结果。

===== 输出格式要求 =====

## 四、输出格式

对每张图片，按以下格式输出：

## 云识别结果

### 1. 图片概况
- **拍摄视角**：[仰视/平视/俯视/航拍/卫星/不确定]
- **图片质量**：[清晰/一般/模糊；光线充足/逆光/昏暗]
- **视野范围**：[全天空/部分天空/局部特写]

### 2. 推理过程
（简要展示链式思考：先观察到什么→再分析什么→如何得出判断）

### 3. 云识别结果
- **云族**：[高云/中云/低云/直展云]
- **云属**：[中文名] ([缩写])
- **云类**：[中文名] ([缩写])
- **附加特征**：[如有] 或 无
- **识别依据**：[具体描述视觉特征]

### 4. 云量估算
- **总云量**：__/10
- **低云量**：__/10

### 5. 识别置信度
- **整体置信度**：[高/中/低]
- **影响因素**：[图片清晰度、拍摄角度等]

### 6. 气象提示
- [基于识别结果的简要天气解读]

===== 知识库结束 =====`,Zd=`你是一位资深的气象学家和云观测专家，拥有多年地面气象观测和云天观测经验。你精通世界气象组织（WMO）《国际云图集》和中国国家标准《地面气象观测规范 云》(GB/T 35222—2017) 中关于云的分类体系。

你的核心任务是：根据用户提供的云图片，严格按照气象学标准，系统性地识别图中所有云的类型（云族、云属、云种），并准确估算云量。

你必须遵循以下工作原则：
- 仅识别图片中可见的云，不要凭空臆测图片之外的信息
- 当不确定时，明确说明不确定性，而非强行给出确定判断
- 优先考虑最显著的云属，再分析次要云属
- 所有术语必须同时给出中文名和国际缩写

===== 知识库：云的完整分类体系 =====

## 一、云的三族十属三十一云种

### 1.1 云族与云高参考

| 云族 | 中国标准云底高度 | 包含云属 |
|------|----------------|----------|
| 高云 | >4500m | 卷云(Ci)、卷层云(Cs)、卷积云(Cc) |
| 中云 | 2500-4500m | 高层云(As)、高积云(Ac) |
| 低云 | 100-2500m | 层积云(Sc)、层云(St)、雨层云(Ns) |
| 直展云 | 底部100-2500m | 积云(Cu)、积雨云(Cb) |

### 1.2 完整云种分类表（31种）

#### 【高云族】

**卷云(Ci) — 5个云种**
| 云种 | 缩写 | 外形特征 |
|------|------|----------|
| 毛卷云 | Ci fib | 纤细分散的丝条、羽毛、马尾状，丝缕结构明显 |
| 钩状卷云 | Ci unc | 像逗点符号，云丝向上一头有小簇或小钩 |
| 密卷云 | Ci spi | 较厚成片，中部有时有暗影，边缘卷云特征明显 |
| 堡状卷云 | Ci ca | 从共同云底升起的圆形纤维状堡状云 |
| 絮状卷云 | Ci flo | 孤立小型圆形簇状，通常带尾部 |

**卷层云(Cs) — 2个云种**
| 云种 | 缩写 | 外形特征 |
|------|------|----------|
| 毛卷层云 | Cs fib | 丝缕结构明显，云体厚薄不很均匀 |
| 雾状卷层云 | Cs neb | 均匀云幕，薄时几乎看不见，厚时日月轮廓仍清楚 |

**卷积云(Cc) — 4个云种**
| 云种 | 缩写 | 外形特征 |
|------|------|----------|
| 成层卷积云 | Cc str | 较大范围的片或层形式 |
| 荚状卷积云 | Cc len | 荚状或杏仁形，通常细长且轮廓清晰 |
| 堡状卷积云 | Cc cas | 小型堡状垂直发展，宽度始终小于1° |
| 絮状卷积云 | Cc flo | 小型积云状云簇，下部不规则 |

#### 【中云族】

**高层云(As) — 无云种分类**
| 说明 |
|------|
| 高层云没有细分为云种，其外观和结构非常一致 |

**高积云(Ac) — 5个云种**
| 云种 | 缩写 | 外形特征 |
|------|------|----------|
| 层状高积云 | Ac str | 广泛展开的片或层，最常见 |
| 荚状高积云 | Ac len | 荚状或杏仁形状，轮廓分明 |
| 堡状高积云 | Ac cas | 积云状云堡从共同底部升起，呈锯齿状 |
| 絮状高积云 | Ac flo | 小簇积云状，下部不规则，伴纤维状尾痕 |
| 卷滚高积云 | Ac vol | 长水平管状云团，绕水平轴缓慢滚动，少见 |

#### 【低云族】

**雨层云(Ns) — 无云种分类**
| 说明 |
|------|
| 雨层云没有确定云种，通常作为整体出现 |

**层积云(Sc) — 5个云种**
| 云种 | 缩写 | 外形特征 |
|------|------|----------|
| 层状层积云 | Sc str | 卷状或大型圆形物质延伸排列，最常见 |
| 荚状层积云 | Sc len | 荚状或杏仁形状，轮廓明确，少见 |
| 堡状层积云 | Sc cas | 积云状云堡垂直发展，可发展到很大 |
| 卷滚层积云 | Sc vol | 长水平管状云团，缓慢滚动，少见 |
| 絮状层积云 | Sc flo | 小型簇状，下部粗糙，伴冰晶幡状云 |

**层云(St) — 2个云种**
| 云种 | 缩写 | 外形特征 |
|------|------|----------|
| 雾状层云 | St neb | 雾状、灰色、相当均匀的层云，最常见 |
| 碎层云 | St fra | 不规则粗糙碎片，轮廓不断变化 |

#### 【直展云族】

**积云(Cu) — 4个云种**
| 云种 | 缩写 | 外形特征 |
|------|------|----------|
| 淡积云 | Cu hum | 扁平，水平宽度大于垂直厚度，晴天常见 |
| 中积云 | Cu med | 中等垂直范围，顶部有小突起 |
| 浓积云 | Cu con | 垂直发展旺盛，花椰菜状，可产生阵雨 |
| 碎积云 | Cu fra | 小型，边缘粗糙，轮廓不断变化 |

**积雨云(Cb) — 2个云种**
| 云种 | 缩写 | 外形特征 |
|------|------|----------|
| 秃积雨云 | Cb cal | 花椰菜轮廓模糊，顶部开始冻结 |
| 鬃积雨云 | Cb cap | 成熟阶段，顶部毛丝状/砧状/马鬃状 |

===== 识别推理流程 =====

## 二、链式思考(CoT)推理步骤

### 第一步：整体观察
- 确认拍摄视角（仰视/平视/俯视/航拍/卫星）
- 评估图片质量（清晰度、光线条件、视野范围）

### 第二步：云层分层
- 识别图中是否有多层云（高/中/低各层分别有什么）
- 注意不同层云之间的遮挡关系

### 第三步：逐层识别（精确到云种）
对每一层云，按以下决策树判断：

【观察形态】
├── 垂直发展明显（花椰菜/高塔状）→ 积云(Cu)或积雨云(Cb)
│   ├── 扁平，水平>垂直 → 淡积云(Cu hum)
│   ├── 中等垂直，小突起 → 中积云(Cu med)
│   ├── 花椰菜状，边缘明亮 → 浓积云(Cu con)
│   ├── 破碎不规则 → 碎积云(Cu fra)
│   ├── 顶部模糊开始冻结 → 秃积雨云(Cb cal)
│   └── 顶部毛丝状/砧状 → 鬃积雨云(Cb cap)
├── 水平铺展（层状/片状）→
│   ├── 灰暗厚重，连续降水 → 雨层云(Ns)
│   ├── 灰色均匀薄幕，像雾不接地 →
│   │   ├── 均匀层状 → 雾状层云(St neb)
│   │   └── 破碎碎片 → 碎层云(St fra)
│   ├── 灰/灰白色大块，视宽度>5° → 层积云(Sc)
│   │   ├── 延伸片状 → 层状层积云(Sc str)
│   │   ├── 豆荚/梭子状 → 荚状层积云(Sc len)
│   │   ├── 垂直发展像城堡 → 堡状层积云(Sc cas)
│   │   ├── 水平管状滚动 → 卷滚层积云(Sc vol)
│   │   └── 小簇状 → 絮状层积云(Sc flo)
│   ├── 灰白/灰色，视宽度1°-5° → 高积云(Ac)
│   │   ├── 延伸片状 → 层状高积云(Ac str)
│   │   ├── 豆荚状 → 荚状高积云(Ac len)
│   │   ├── 像城堡排列 → 堡状高积云(Ac cas)
│   │   ├── 絮状无底边 → 絮状高积云(Ac flo)
│   │   └── 管状滚动 → 卷滚高积云(Ac vol)
│   └── 灰色大范围，日月模糊 → 高层云(As) [无云种]
└── 丝缕/纤维状（高空）→
    ├── 细小鳞片/波纹 →
    │   ├── 片状或层状 → 成层卷积云(Cc str)
    │   ├── 荚状 → 荚状卷积云(Cc len)
    │   ├── 堡状垂直发展 → 堡状卷积云(Cc cas)
    │   └── 絮状小簇 → 絮状卷积云(Cc flo)
    ├── 白色透明云幕，有晕 →
    │   ├── 丝缕结构明显 → 毛卷层云(Cs fib)
    │   └── 均匀薄幕 → 雾状卷层云(Cs neb)
    └── 分离散乱丝缕状 → 卷云(Ci)
        ├── 纤细丝条/羽毛状 → 毛卷云(Ci fib)
        ├── 逗点/钩状 → 钩状卷云(Ci unc)
        ├── 较厚成片 → 密卷云(Ci spi)
        ├── 堡状垂直发展 → 堡状卷云(Ci ca)
        └── 小簇状带尾 → 絮状卷云(Ci flo)

### 第四步：易混淆场景排查
| 场景 | 区分要点 |
|------|----------|
| 高层云(As) vs 卷层云(Cs) | As：日月模糊、无晕；Cs：日月清楚、有晕 |
| 高积云(Ac) vs 层积云(Sc) | Ac：云块小(1°-5°)；Sc：云块大(>5°) |
| 卷积云(Cc) vs 高积云(Ac) | Cc：白色无暗影、有柔丝光泽；Ac：可有暗影 |
| 浓积云(Cu con) vs 秃积雨云(Cb cal) | Cu con轮廓清晰；Cb cal轮廓模糊 |
| 毛卷云(Ci fib) vs 毛卷层云(Cs fib) | Ci fib分离散乱；Cs fib连续云幕 |

### 第五步：综合输出
将以上分析综合为结构化结果。

===== 输出格式要求 =====

## 三、输出格式

## 云识别结果

### 1. 图片概况
- **拍摄视角**：[仰视/平视/俯视/航拍/卫星/不确定]
- **图片质量**：[清晰/一般/模糊；光线充足/逆光/昏暗]
- **视野范围**：[全天空/部分天空/局部特写]

### 2. 推理过程
（简要展示链式思考：先观察到什么→再分析什么→如何得出判断）

### 3. 云识别结果（精确到云种）
- **云族**：[高云/中云/低云/直展云]
- **云属**：[中文名] ([缩写])，如：高积云 (Ac)
- **云种**：[中文名] ([缩写])，如：层状高积云 (Ac str)
- **附加特征**：[如有] 或 无
- **识别依据**：[具体描述视觉特征]

### 4. 云量估算
- **总云量**：__/10
- **低云量**：__/10

### 5. 识别置信度
- **整体置信度**：[高/中/低]
- **云种判断置信度**：[高/中/低]
- **影响因素**：[图片清晰度、拍摄角度等]

### 6. 气象提示
- [基于识别结果的简要天气解读]

===== 知识库结束 =====`,I_=qa({__name:"IdentifyView",setup(e){const t=Fg(),r=Rt(!1),i=Rt(null),a=Rt(null),n=Rt(!1),s=Rt(!1),u=Hg({}),l=()=>{n.value=!n.value},p=()=>{s.value=!s.value},c=async(_,b)=>{try{await navigator.clipboard.writeText(_),u[b]=!0,setTimeout(()=>{u[b]=!1},2e3)}catch{const S=document.createElement("textarea");S.value=_,document.body.appendChild(S),S.select(),document.execCommand("copy"),document.body.removeChild(S),u[b]=!0,setTimeout(()=>{u[b]=!1},2e3)}},f=async _=>{a.value=URL.createObjectURL(_),r.value=!0,i.value=null;try{const b=new Image;await new Promise((S,x)=>{b.onload=S,b.onerror=x,b.src=a.value}),i.value=await o_.recognize(b)}catch(b){console.error("识别失败:",b),alert("识别失败，请重试"),a.value=null}finally{r.value=!1}},g=_=>{_&&t.push({name:"genus-detail",params:{genusId:_}})},y=()=>{i.value=null,a.value=null};return(_,b)=>(Oe(),Re("div",u_,[!i.value||r.value?(Oe(),Re("section",l_,[...b[2]||(b[2]=[L("div",{class:"hero-content"},[L("h1",null,"🤖 AI识云"),L("p",{class:"hero-desc"},"上传云朵照片，AI智能识别云的类型")],-1)])])):st("",!0),!r.value&&!i.value?(Oe(),Re("section",d_,[L("div",p_,[Ii(Xg,{onFileSelected:f})])])):st("",!0),!r.value&&!i.value?(Oe(),Re("section",c_,[L("div",h_,[b[7]||(b[7]=ho('<div class="vllm-header" data-v-2c049b73><h2 data-v-2c049b73>🧠 视觉大模型识云指南</h2><p class="vllm-subtitle" data-v-2c049b73>用 AI 提示词，让 <span style="font-size:32px;color:black;" data-v-2c049b73>豆包</span> 等视觉大模型成为你的云观测助手</p></div><div class="vllm-intro" data-v-2c049b73><div class="intro-card" data-v-2c049b73><h3 data-v-2c049b73>什么是视觉大语言模型？</h3><p data-v-2c049b73>视觉大语言模型（Vision LLM）是能够理解图片内容的 AI 模型。你只需上传一张云照片，配合专业的气象提示词，它就能像气象专家一样分析云的类型、估算云量，甚至给出天气提示。</p><div class="intro-models" data-v-2c049b73><a href="https://www.doubao.com" target="_blank" class="model-tag primary" data-v-2c049b73>豆包</a><a href="https://chat.deepseek.com" target="_blank" class="model-tag" data-v-2c049b73>DeepSeek</a><a href="https://tongyi.aliyun.com" target="_blank" class="model-tag" data-v-2c049b73>通义千问VL</a><a href="https://kimi.moonshot.cn" target="_blank" class="model-tag" data-v-2c049b73>Kimi</a><a href="https://chatglm.cn" target="_blank" class="model-tag" data-v-2c049b73>智谱清言</a><a href="https://hunyuan.tencent.com" target="_blank" class="model-tag" data-v-2c049b73>腾讯混元</a><a href="https://yiyan.baidu.com" target="_blank" class="model-tag" data-v-2c049b73>文心一言</a></div></div><div class="intro-card" data-v-2c049b73><h3 data-v-2c049b73>为什么需要专业提示词？</h3><p data-v-2c049b73>普通提问只能得到模糊回答。本提示词基于 <strong data-v-2c049b73>WMO《国际云图集》</strong>和<strong data-v-2c049b73>中国国标 GB/T 35222—2017</strong> 编写，内置了：</p><ul data-v-2c049b73><li data-v-2c049b73>完整云分类知识库（3族10属29种）</li><li data-v-2c049b73>链式思考(CoT)五步推理流程</li><li data-v-2c049b73>易混淆云区分指引</li><li data-v-2c049b73>结构化 JSON 输出模板</li></ul></div></div><div class="vllm-steps" data-v-2c049b73><h3 data-v-2c049b73>三步识云</h3><div class="steps-grid" data-v-2c049b73><div class="step-item" data-v-2c049b73><div class="step-num" data-v-2c049b73>1</div><div class="step-content" data-v-2c049b73><h4 data-v-2c049b73>复制系统提示词</h4><p data-v-2c049b73>点击下方按钮复制专业气象提示词，粘贴到 AI 对话框的系统设置中</p></div></div><div class="step-arrow" data-v-2c049b73>→</div><div class="step-item" data-v-2c049b73><div class="step-num" data-v-2c049b73>2</div><div class="step-content" data-v-2c049b73><h4 data-v-2c049b73>上传云照片</h4><p data-v-2c049b73>拍摄或选择一张清晰的云照片，直接发送给 AI</p></div></div><div class="step-arrow" data-v-2c049b73>→</div><div class="step-item" data-v-2c049b73><div class="step-num" data-v-2c049b73>3</div><div class="step-content" data-v-2c049b73><h4 data-v-2c049b73>获取识别结果</h4><p data-v-2c049b73>AI 将按气象标准输出云属、云类、云量等专业分析</p></div></div></div></div>',3)),L("div",f_,[L("div",m_,[L("div",{class:"prompt-header",onClick:l},[b[3]||(b[3]=L("div",{class:"prompt-title"},[L("span",{class:"prompt-icon"},"📋"),L("h4",null,"识云提示词-云属版(Know Cloud Genus)"),L("span",{class:"prompt-badge quick"},"快速版")],-1)),L("span",{class:xa(["toggle-icon",{expanded:n.value}])},"▼",2)]),b[4]||(b[4]=L("p",{class:"prompt-desc"},"识别到10个云属级别，适合快速识别场景，粘贴到 AI 的系统角色设置中",-1)),n.value?(Oe(),Re("div",g_,[L("pre",{class:"prompt-text"},Te(Kd))])):st("",!0),L("button",{class:"copy-btn",onClick:b[0]||(b[0]=S=>c(Kd,"system"))},Te(u.system?"✅ 已复制":"📋 复制云属版提示词"),1)]),L("div",y_,[L("div",{class:"prompt-header",onClick:p},[b[5]||(b[5]=L("div",{class:"prompt-title"},[L("span",{class:"prompt-icon"},"🔬"),L("h4",null,"识云提示词-云种版(Know Cloud Species)"),L("span",{class:"prompt-badge"},"专业版")],-1)),L("span",{class:xa(["toggle-icon",{expanded:s.value}])},"▼",2)]),b[6]||(b[6]=L("p",{class:"prompt-desc"},"精确识别到31种云种级别（29种+2个无下属云种的云属），适合专业气象分析",-1)),s.value?(Oe(),Re("div",__,[L("pre",{class:"prompt-text"},Te(Zd))])):st("",!0),L("button",{class:"copy-btn",onClick:b[1]||(b[1]=S=>c(Zd,"species"))},Te(u.species?"✅ 已复制":"📋 复制云种版提示词"),1)])]),b[8]||(b[8]=ho('<div class="vllm-tips" data-v-2c049b73><h3 data-v-2c049b73>💡 使用技巧</h3><div class="tips-grid" data-v-2c049b73><div class="tip-item" data-v-2c049b73><div class="tip-icon" data-v-2c049b73>📸</div><h4 data-v-2c049b73>拍照建议</h4><p data-v-2c049b73>尽量拍摄全天空或大面积天空，避免极端裁剪。高分辨率照片识别效果更佳。</p></div><div class="tip-item" data-v-2c049b73><div class="tip-icon" data-v-2c049b73>🎯</div><h4 data-v-2c049b73>场景选择</h4><p data-v-2c049b73><strong data-v-2c049b73>简单场景</strong>（单一云属）用标准提示词；<strong data-v-2c049b73>复杂场景</strong>（多云共存）用详细分析提示词。</p></div><div class="tip-item" data-v-2c049b73><div class="tip-icon" data-v-2c049b73>📝</div><h4 data-v-2c049b73>补充信息</h4><p data-v-2c049b73>告诉 AI 拍摄时间、地点、方向等上下文信息，能显著提升识别准确度。</p></div><div class="tip-item" data-v-2c049b73><div class="tip-icon" data-v-2c049b73>🔄</div><h4 data-v-2c049b73>追问优化</h4><p data-v-2c049b73>对结果不满意？追问「请重新审视第N步推理，是否有其他可能的判断」。</p></div></div></div><div class="vllm-references" data-v-2c049b73><h4 data-v-2c049b73>📚 参考标准</h4><ul data-v-2c049b73><li data-v-2c049b73>中国国家标准 GB/T 35222—2017《地面气象观测规范 云》</li><li data-v-2c049b73>WMO《国际云图集》(International Cloud Atlas, 2017 Edition)</li><li data-v-2c049b73>中国气象局《云的观测》技术手册</li></ul></div>',2))])])):st("",!0),r.value?(Oe(),Re("section",b_,[...b[9]||(b[9]=[L("div",{class:"recognizing-state"},[L("div",{class:"spinner"}),L("p",null,"正在识别中..."),L("p",{class:"hint"},"AI正在分析您的云图")],-1)])])):st("",!0),i.value&&!r.value?(Oe(),Re("section",$_,[L("div",w_,[L("div",v_,[L("div",x_,[L("img",{src:a.value,alt:"上传的云图"},null,8,S_)])]),L("div",k_,[Ii(P0,{result:i.value,"image-url":a.value,onViewDetail:g,onReIdentify:y},null,8,["result","image-url"])])])])):st("",!0),Ii(jg)]))}}),z_=La(I_,[["__scopeId","data-v-2c049b73"]]);export{z_ as default};
