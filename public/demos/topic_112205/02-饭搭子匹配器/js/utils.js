function checkLogin(){
  const token=localStorage.getItem('fandazi_token');
  if(!token){
    window.location.href='../pages/login.html';
    return false;
  }
  return true;
}

/* 注册：将用户信息存入 localStorage */
function register(nickname,account,password){
  const users=JSON.parse(localStorage.getItem('fandazi_users')||'{}');
  users[account]={nickname:nickname,password:password};
  localStorage.setItem('fandazi_users',JSON.stringify(users));
  /* 注册成功后自动登录 */
  localStorage.setItem('fandazi_token','valid_token');
  localStorage.setItem('fandazi_user',nickname);
  localStorage.setItem('fandazi_account',account);
  window.location.href='../pages/discover.html';
}

/* 登录：校验账号密码是否匹配（支持手机号和邮箱） */
function login(account,password){
  const users=JSON.parse(localStorage.getItem('fandazi_users')||'{}');
  if(!users[account]){
    return{ok:false,msg:'该账号未注册，请先注册'};
  }
  if(users[account].password!==password){
    return{ok:false,msg:'密码错误，请重新输入'};
  }
  localStorage.setItem('fandazi_token','valid_token');
  localStorage.setItem('fandazi_user',users[account].nickname);
  localStorage.setItem('fandazi_account',account);
  return{ok:true};
}

function logout(){
  localStorage.removeItem('fandazi_token');
  localStorage.removeItem('fandazi_user');
  window.location.href='../pages/login.html';
}

function getUser(){
  return localStorage.getItem('fandazi_user')||'用户';
}

function goPage(page){
  const pages={'discover':'discover.html','filters':'filters.html','matches':'matches.html','profile':'profile.html'};
  if(pages[page]){
    window.location.href=pages[page];
  }
}

function toggleChip(el){
  el.classList.toggle('active');
  saveFilters();
}

function saveFilters(){
  const activeChips=document.querySelectorAll('.filter-chip.active');
  const filters=[];
  activeChips.forEach(chip=>filters.push(chip.textContent.trim()));
  localStorage.setItem('fandazi_filters',JSON.stringify(filters));
}

function loadFilters(){
  const saved=localStorage.getItem('fandazi_filters');
  if(saved){
    const filters=JSON.parse(saved);
    document.querySelectorAll('.filter-chip').forEach(chip=>{
      if(filters.includes(chip.textContent.trim())){
        chip.classList.add('active');
      }
    });
  }
}

function saveProfile(data){
  localStorage.setItem('fandazi_profile',JSON.stringify(data));
}

function loadProfile(){
  const saved=localStorage.getItem('fandazi_profile');
  return saved?JSON.parse(saved):{
    nickname:'你的昵称',
    avatar:'😎',
    tags:['🌶️ 无辣不欢','🍰 甜品控','📸 饭前拍照'],
    stats:{meals:5,friends:8,restaurants:12}
  };
}

function saveMatches(data){
  localStorage.setItem('fandazi_matches',JSON.stringify(data));
}

function loadMatches(){
  const saved=localStorage.getItem('fandazi_matches');
  return saved?JSON.parse(saved):[
    {name:'小林',avatar:'👩‍💻',preview:'你也喜欢那家川菜馆吗？',time:'2分钟前',unread:1},
    {name:'美食家老王',avatar:'👨‍🍳',preview:'周末一起去探新店？',time:'1小时前',unread:0},
    {name:'爱吃甜品的猫',avatar:'🧑‍🎨',preview:'推荐一家新开的提拉米苏',time:'昨天',unread:2}
  ];
}

function showEditDialog(title,fields,callback){
  const dialog=document.createElement('div');
  dialog.className='edit-dialog';
  let html='<div class="edit-dialog-overlay" onclick="this.parentElement.remove()"></div>';
  html+='<div class="edit-dialog-content">';
  html+='<div class="edit-dialog-header"><h3>'+title+'</h3><span class="edit-dialog-close" onclick="this.parentElement.parentElement.parentElement.remove()">✕</span></div>';
  html+='<div class="edit-dialog-body">';
  fields.forEach((field,i)=>{
    html+='<div class="edit-field"><label>'+field.label+'</label>';
    if(field.type==='textarea'){
      html+='<textarea class="edit-input" data-field="'+field.key+'" placeholder="'+(field.placeholder||'')+'">'+(field.value||'')+'</textarea>';
    }else if(field.type==='select'){
      html+='<select class="edit-input" data-field="'+field.key+'">';
      field.options.forEach(opt=>html+='<option value="'+opt+'"'+(field.value===opt?' selected':'')+'>'+opt+'</option>');
      html+='</select>';
    }else if(field.type==='image'){
      html+='<div class="edit-image-upload">';
      if(field.value&&field.value.startsWith('data:')){
        html+='<img src="'+field.value+'" class="edit-image-preview" />';
      }else if(field.value){
        html+='<img src="'+field.value+'" class="edit-image-preview" />';
      }else{
        html+='<div class="edit-image-placeholder"><span>📷</span><span>点击上传图片</span></div>';
      }
      html+='<input type="file" class="edit-input edit-image-input" data-field="'+field.key+'" accept="image/*" onchange="handleImageUpload(this)">';
      html+='<input type="hidden" class="edit-input" data-field="'+field.key+'" value="'+(field.value||'')+'">';
      html+='</div>';
    }else{
      html+='<input type="'+(field.type||'text')+'" class="edit-input" data-field="'+field.key+'" value="'+(field.value||'')+'" placeholder="'+(field.placeholder||'')+'">';
    }
    html+='</div>';
  });
  html+='</div>';
  html+='<div class="edit-dialog-footer">';
  html+='<button class="btn-secondary edit-btn-cancel" onclick="this.parentElement.parentElement.parentElement.remove()">取消</button>';
  html+='<button class="btn-primary edit-btn-save" onclick="saveEditDialog(this)">保存</button>';
  html+='</div></div>';
  dialog.innerHTML=html;
  dialog._callback=callback;
  const appFrame=document.querySelector('.app-frame');
  (appFrame||document.body).appendChild(dialog);
  
  const style=document.createElement('style');
  style.textContent=`
    .edit-dialog{position:absolute;top:0;left:0;right:0;bottom:0;z-index:300;display:flex;align-items:center;justify-content:center}
    .edit-dialog-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.8)}
    .edit-dialog-content{position:relative;background:var(--bg2);border:1px solid var(--rule);border-radius:20px;width:90%;max-width:360px;max-height:80vh;overflow-y:auto}
    .edit-dialog-header{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.2rem;border-bottom:1px solid var(--rule)}
    .edit-dialog-header h3{font-size:1.1rem;margin:0}
    .edit-dialog-close{font-size:1.2rem;color:var(--muted);cursor:pointer}
    .edit-dialog-body{padding:1rem 1.2rem}
    .edit-field{margin-bottom:1rem}
    .edit-field label{display:block;font-size:0.85rem;color:var(--muted);margin-bottom:0.4rem}
    .edit-input{width:100%;padding:10px 12px;border:1px solid var(--rule);border-radius:10px;background:var(--card);color:var(--ink);font-size:0.95rem;outline:none}
    .edit-input:focus{border-color:var(--accent)}
    .edit-input textarea{resize:vertical;min-height:80px}
    .edit-image-upload{position:relative;border:2px dashed var(--rule);border-radius:12px;overflow:hidden;cursor:pointer}
    .edit-image-upload:hover{border-color:var(--accent)}
    .edit-image-preview{width:100%;height:120px;object-fit:cover;display:block}
    .edit-image-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;height:120px;color:var(--muted);gap:0.3rem}
    .edit-image-placeholder span:first-child{font-size:2rem}
    .edit-image-input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
    .edit-dialog-footer{display:flex;gap:0.8rem;padding:1rem 1.2rem;border-top:1px solid var(--rule)}
    .edit-dialog-footer .btn-primary,.edit-dialog-footer .btn-secondary{width:auto;margin:0;padding:10px 24px;font-size:0.9rem}
  `;
  document.head.appendChild(style);
}

function compressImage(file,maxWidth=400,maxHeight=400,quality=0.7){
  return new Promise((resolve)=>{
    const reader=new FileReader();
    reader.onload=function(e){
      const img=new Image();
      img.onload=function(){
        let width=img.width;
        let height=img.height;
        if(width>height&&width>maxWidth){
          height=(height*maxWidth)/width;
          width=maxWidth;
        }else if(height>width&&height>maxHeight){
          width=(width*maxHeight)/height;
          height=maxHeight;
        }
        const canvas=document.createElement('canvas');
        canvas.width=width;
        canvas.height=height;
        const ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0,width,height);
        resolve(canvas.toDataURL('image/jpeg',quality));
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleImageUpload(input){
  const file=input.files[0];
  if(!file)return;
  try{
    const compressedData=await compressImage(file);
    const preview=input.previousElementSibling;
    if(preview.tagName==='IMG'){
      preview.src=compressedData;
    }else{
      preview.innerHTML='<img src="'+compressedData+'" class="edit-image-preview" />';
    }
    const hiddenInput=input.nextElementSibling;
    if(hiddenInput&&hiddenInput.type==='hidden'){
      hiddenInput.value=compressedData;
    }
  }catch(e){
    console.error('图片上传失败:',e);
  }
}

function saveEditDialog(btn){
  const dialog=btn.parentElement.parentElement.parentElement;
  const inputs=dialog.querySelectorAll('.edit-input');
  const data={};
  inputs.forEach(input=>{
    if(input.type==='file')return;
    data[input.dataset.field]=input.value;
  });
  if(dialog._callback){
    dialog._callback(data);
  }
  dialog.remove();
}