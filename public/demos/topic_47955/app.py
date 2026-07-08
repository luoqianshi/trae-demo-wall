# -*- coding: utf-8 -*-
from flask import Flask, render_template_string, request, jsonify
import json, os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "fridge.json")
os.makedirs(DATA_DIR, exist_ok=True)

DEFAULTS = {
    "items": [
        {"id": 1, "name": "牛奶",   "category": "乳制品",  "expiryDate": "2026-06-24", "quantity": 500, "unit": "克", "subscribed": True},
        {"id": 2, "name": "鸡蛋",   "category": "蛋类",    "expiryDate": "2026-06-27", "quantity": 1,   "unit": "件", "subscribed": True},
        {"id": 3, "name": "吐司",   "category": "主食",    "expiryDate": "2026-06-25", "quantity": 2,   "unit": "件", "subscribed": True},
        {"id": 4, "name": "草莓",   "category": "水果",    "expiryDate": "2026-06-23", "quantity": 500, "unit": "克", "subscribed": False},
        {"id": 5, "name": "酸奶",   "category": "乳制品",  "expiryDate": "2026-06-30", "quantity": 2,   "unit": "件", "subscribed": False},
        {"id": 6, "name": "胡萝卜", "category": "蔬菜",    "expiryDate": "2026-07-05", "quantity": 800, "unit": "克", "subscribed": False},
        {"id": 7, "name": "猪肉",   "category": "肉类",    "expiryDate": "2026-06-28", "quantity": 300, "unit": "克", "subscribed": True},
        {"id": 8, "name": "芒果",   "category": "水果",    "expiryDate": "2026-06-29", "quantity": 4,   "unit": "件", "subscribed": False}
    ],
    "subscriptions": ["牛奶", "鸡蛋", "吐司"],
    "history": []
}

def load_db():
    if not os.path.exists(DB_PATH):
        save_db(json.loads(json.dumps(DEFAULTS)))
        return json.loads(json.dumps(DEFAULTS))
    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        for k, v in DEFAULTS.items():
            data.setdefault(k, v if k != "items" else [])
        return data
    except Exception:
        return json.loads(json.dumps(DEFAULTS))

def save_db(data):
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def next_id(items):
    return max([it["id"] for it in items], default=0) + 1

def add_history_entry(db, action, item_name, quantity_change):
    db["history"].insert(0, {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "action": action,
        "itemName": item_name,
        "quantityChange": quantity_change
    })
    if len(db["history"]) > 500:
        db["history"] = db["history"][:500]

app = Flask(__name__)

INDEX_HTML = r'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>我的冰箱 · Dashboard</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
    background: linear-gradient(135deg, #e0f0ff 0%, #f5faff 50%, #ffffff 100%);
    min-height: 100vh;
    color: #2c3e50;
    padding-bottom: 96px;
  }
  .header {
    background: linear-gradient(135deg, #4da6ff 0%, #66b3ff 100%);
    color: #fff;
    padding: 14px 14px 28px;
    border-radius: 0 0 20px 20px;
    box-shadow: 0 4px 12px rgba(77, 166, 255, 0.3);
    position: relative;
    z-index: 10;
  }
  .header .bell {
    position: absolute; right: 12px; top: 12px;
    background: rgba(255,255,255,0.25); width: 34px; height: 34px; border-radius: 50%;
    border: none; color: #fff; font-size: 16px; cursor: pointer;
    display:flex; align-items:center; justify-content:center;
    transition: background 0.15s, transform 0.15s;
    z-index: 11;
  }
  .header .bell:hover { background: rgba(255,255,255,0.4); }
  .header .bell:active { transform: scale(0.92); }
  .header h1 { font-size: 18px; font-weight: 700; text-align: center; margin-top: 2px; letter-spacing: 0.5px; }
  .header .sub { text-align: center; font-size: 11px; opacity: 0.85; margin-top: 2px; }

  .stats {
    max-width: 640px; margin: -14px auto 14px; padding: 0 14px;
    display: flex; gap: 10px; flex-wrap: nowrap;
    position: relative; z-index: 2;
  }
  .stat-card {
    flex: 1 1 0; min-width: 0; background: #fff;
    border-radius: 12px; padding: 12px 10px; text-align: center;
    box-shadow: 0 4px 14px rgba(0,0,0,0.07);
    display: flex; flex-direction: column; justify-content: center;
    overflow: visible;
  }
  .stat-card strong { display: block; font-size: 20px; color: #1890ff; line-height: 1.25; }
  .stat-card span { font-size: 12px; color: #8c9bab; margin-top: 3px; display: block; line-height: 1.3; }
  .stat-card.alert strong { color: #fa8c16; }
  .stat-card.alert span { color: #c56a0c; }
  @media (max-width: 420px) {
    .stats { gap: 6px; padding: 0 10px; }
    .stat-card { padding: 10px 6px; border-radius: 10px; }
    .stat-card strong { font-size: 17px; }
    .stat-card span { font-size: 11px; }
  }

  .container { max-width: 640px; margin: 0 auto; padding: 0 12px; }

  .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .card {
    background: #fff; border-radius: 14px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.06); overflow: hidden;
    display: flex; flex-direction: column; min-height: 140px;
  }
  .card-title { display: flex; align-items: center; justify-content: space-between; padding: 10px 10px; }
  .card-title h3 { font-size: 12.5px; font-weight: 700; color: #2c3e50; display: flex; align-items: center; gap: 5px; }
  .badge { background: #ff4d4f; color: #fff; font-size: 10px; font-weight: 700;
    padding: 1px 6px; border-radius: 8px; min-width: 18px; text-align: center; }
  .badge.blue { background: #1890ff; }
  .card-body { flex: 1; padding: 2px 6px 8px; overflow-y: auto; }
  .empty { padding: 20px 6px; text-align: center; color: #b6c2d0; font-size: 12px; }

  .item-list { list-style: none; }
  .item-list li {
    padding: 6px 6px; border-radius: 6px; margin-bottom: 2px;
    display: flex; align-items: center; gap: 6px;
    background: linear-gradient(135deg, #f5faff 0%, #ffffff 100%);
  }
  .item-list li .ic {
    width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 11px;
    background: #ffe7cc;
  }
  .item-list li.expired .ic { background: #fff1f0; }
  .item-list li.due-today .ic { background: #ffe7cc; }
  .item-list li .info { flex: 1; min-width: 0; }
  .item-list li .info .name { font-size: 12.5px; font-weight: 600; color: #2c3e50; }
  .item-list li .info .meta { font-size: 10px; color: #8c9bab; margin-top: 1px; }

  .due-tag { font-size: 10px; padding: 2px 5px; border-radius: 5px; font-weight: 600; flex-shrink: 0; }
  .due-tag.ok { background: #e6fffb; color: #08979c; }
  .due-tag.warn { background: #fff7e6; color: #d46b08; }
  .due-tag.crit { background: #fff1f0; color: #cf1322; }

  .low-stock .info .name span.item-sub { font-size: 10px; font-weight: 400; color: #8c9bab; margin-left: 4px; }
  .stock-info { font-size: 10px; font-weight: 600; color: #d46b08; background: #fff7e6; padding: 2px 5px; border-radius: 5px; }

  .footer {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 100;
    background: #fff; padding: 8px 10px;
    border-top: 1px solid #eef2f7;
    display: flex; gap: 6px; max-width: 680px; margin: 0 auto;
  }
  .ft-btn {
    flex: 1; border: none; border-radius: 10px;
    padding: 10px 4px; font-size: 12px; font-weight: 600; font-family: inherit;
    cursor: pointer; transition: transform 0.12s, box-shadow 0.12s;
    display: flex; flex-direction: column; align-items: center; gap: 1px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    color: #fff;
  }
  .ft-btn.green { background: linear-gradient(135deg,#52c41a,#73d13d); box-shadow: 0 3px 8px rgba(82,196,26,0.3); }
  .ft-btn.orange { background: linear-gradient(135deg,#fa8c16,#ffa940); box-shadow: 0 3px 8px rgba(250,140,22,0.3); }
  .ft-btn.blue  { background: linear-gradient(135deg,#4da6ff,#66b3ff); box-shadow: 0 3px 8px rgba(77,166,255,0.3); }
  .ft-btn:active { transform: scale(0.96); }
  .ft-btn small { font-size: 9px; opacity: 0.9; font-weight: 500; }

  @media (max-width: 480px) {
    .cards { grid-template-columns: 1fr; }
    .header h1 { font-size: 16px; }
    .footer { padding: 7px 8px; gap: 6px; }
    .ft-btn { font-size: 11px; padding: 9px 2px; }
    .ft-btn small { font-size: 8px; }
  }
</style>
</head>
<body>

<div class="header">
  <button class="bell" title="提醒设置" onclick="location.href='/subscriptions'">🔔</button>
  <h1>🧊 我的冰箱</h1>
  <div class="sub">干净 · 新鲜 · 不浪费</div>
</div>

<div class="stats">
  <div class="stat-card"><strong id="statTotal">-</strong><span>冰箱物品</span></div>
  <div class="stat-card alert"><strong id="statSub">-</strong><span>订阅提醒</span></div>
  <div class="stat-card alert"><strong id="statSoon">-</strong><span>临期预警</span></div>
</div>

<div class="container">
  <div class="cards">
    <div class="card">
      <div class="card-title"><h3>⏰ 临保提醒</h3><span class="badge" id="dueBadge">0</span></div>
      <div class="card-body"><ul class="item-list" id="dueList"></ul></div>
    </div>
    <div class="card">
      <div class="card-title"><h3>🔔 存量预警</h3><span class="badge blue" id="stockBadge">0</span></div>
      <div class="card-body"><ul class="item-list" id="stockList"></ul></div>
    </div>
  </div>
</div>

<div class="footer">
  <button class="ft-btn green" onclick="location.href='/put-in'">➕ 存入<small>添加</small></button>
  <button class="ft-btn orange" onclick="location.href='/take-out'">➖ 取出<small>拿走</small></button>
  <button class="ft-btn blue" onclick="location.href='/history'">📜 历史<small>记录</small></button>
</div>

<script>
var LOW_STOCK_QTY = 3, LOW_STOCK_GRAM = 200, DUE_THRESHOLD = 3;
var DUE_ICON = { "乳制品":"🥛","水果":"🍎","蔬菜":"🥬","肉类":"🍖","饮料":"🥤","主食":"🍞","蛋类":"🥚","其他":"🍱" };
function escape(s){ return String(s||"").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function daysUntil(d){ var t=new Date(d); t.setHours(0,0,0,0); var today=new Date(); today.setHours(0,0,0,0); return Math.round((t-today)/86400000); }
function qtyLabel(it){ var u=it.unit||"件"; if(u==="克") return "剩余 "+it.quantity+" 克"; if(it.quantity===1) return "仅剩 1 件"; return "剩余 "+it.quantity+" 件"; }
function stockMatched(it){ if(!it.subscribed) return false; var u=it.unit||"件"; if(u==="件") return it.quantity<=LOW_STOCK_QTY; if(u==="克") return it.quantity<=LOW_STOCK_GRAM; return false; }
function iconOf(c){ return DUE_ICON[c]||"🍱"; }

function dueListHTML(items){
  var soon = items.filter(it => daysUntil(it.expiryDate) <= DUE_THRESHOLD && daysUntil(it.expiryDate) >= 0);
  soon.sort((a,b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate));
  document.getElementById("dueBadge").textContent = soon.length;
  if(!soon.length) return '<div class="empty">🥳 暂无临保物品</div>';
  var html = "";
  soon.forEach(function(it){
    var d = daysUntil(it.expiryDate), tag, clsT;
    if(d<=0){ tag="已过期"; clsT="crit"; }
    else if(d===0){ tag="今天到期"; clsT="crit"; }
    else if(d<=1){ tag="还剩 "+d+" 天"; clsT="crit"; }
    else{ tag="还剩 "+d+" 天"; clsT="warn"; }
    html += '<li>'
      + '<div class="ic">'+iconOf(it.category)+'</div>'
      + '<div class="info"><div class="name">'+escape(it.name)+'</div><div class="meta">'+escape(it.category)+' · '+qtyLabel(it)+'</div></div>'
      + '<span class="due-tag '+clsT+'">'+tag+'</span></li>';
  });
  return html;
}

function stockListHTML(items){
  var low = items.filter(stockMatched);
  low.sort((a,b)=> (a.unit||"件")==="件" ? a.quantity-b.quantity : a.quantity-b.quantity);
  document.getElementById("stockBadge").textContent = low.length;
  if(!low.length) return '<div class="empty">✅ 所有订阅物品存量充足</div>';
  var html="";
  low.forEach(function(it){
    var u=it.unit||"件";
    var info = (u==="件") ? (it.quantity<=1?"仅剩 "+it.quantity+" 件":"剩余 "+it.quantity+" 件") : (it.quantity<=LOW_STOCK_GRAM?"仅剩 "+it.quantity+" 克":"剩余 "+it.quantity+" 克");
    html += '<li class="low-stock">'
      + '<div class="ic">'+iconOf(it.category)+'</div>'
      + '<div class="info"><div class="name">'+escape(it.name)+'<span class="item-sub">订阅 · '+escape(it.category)+'</span></div></div>'
      + '<span class="stock-info">'+info+'</span></li>';
  });
  return html;
}

function render(data){
  var items = data.items||[];
  document.getElementById("statTotal").textContent = items.length;
  document.getElementById("statSub").textContent = (data.subscriptions||[]).length;
  document.getElementById("statSoon").textContent = items.filter(it=>daysUntil(it.expiryDate)<=DUE_THRESHOLD).length;
  document.getElementById("dueList").innerHTML = dueListHTML(items);
  document.getElementById("stockList").innerHTML = stockListHTML(items);
}

fetch("/api/fridge").then(r=>r.json()).then(render).catch(e=>{
  document.getElementById("dueList").innerHTML = '<div class="empty">⚠️ 后端未启动</div>';
});
</script>
</body>
</html>'''

PUTIN_HTML = r'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>存入物品 · 我的冰箱</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
    background: linear-gradient(135deg, #e0f0ff 0%, #f5faff 50%, #ffffff 100%); min-height: 100vh; color: #2c3e50; }
  .header { background: linear-gradient(135deg, #4da6ff 0%, #66b3ff 100%); color: #fff; padding: 24px 20px 64px; border-radius: 0 0 28px 28px; box-shadow: 0 4px 12px rgba(77, 166, 255, 0.3); position: relative; z-index: 5; }
  .header .back { position: absolute; left: 16px; top: 16px; background: rgba(255, 255, 255, 0.25); border: none; width: 38px; height: 38px; border-radius: 50%; color: #fff; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .header h1 { font-size: 22px; font-weight: 700; text-align: center; margin-top: 4px; }
  .container { max-width: 640px; margin: -40px auto 32px; padding: 0 16px; }
  .form-card { background: #fff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04); padding: 24px; }
  .form-group { margin-bottom: 18px; }
  .form-label { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; font-size: 14px; font-weight: 600; color: #34495e; }
  .form-label .req { color: #ff4d4f; margin-right: 2px; }
  .form-label .hint { font-size: 11.5px; font-weight: 400; color: #9aa9b8; text-align: right; }
  .form-input, .form-select { width: 100%; padding: 12px 14px; font-size: 15px; border: 1.5px solid #dfe5ed; border-radius: 12px; background: #f8fbff; color: #2c3e50; outline: none; font-family: inherit; -webkit-appearance: none; appearance: none; transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease; }
  .form-input:focus, .form-select:focus { border-color: #4da6ff; background: #fff; box-shadow: 0 0 0 3px rgba(77,166,255,0.15); }
  .form-input.error, .form-select.error { border-color: #ff4d4f; background: #fff5f5; box-shadow: 0 0 0 3px rgba(255,77,79,0.12); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-actions { display: flex; gap: 12px; margin-top: 26px; }
  .btn { flex: 1; padding: 14px 18px; border: none; border-radius: 14px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; transition: transform 0.15s, box-shadow 0.15s; }
  .btn-cancel { background: #eef2f7; color: #4a6785; }
  .btn-save { background: linear-gradient(135deg, #4da6ff 0%, #66b3ff 100%); color: #fff; box-shadow: 0 4px 12px rgba(77,166,255,0.35); }
  .btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(77,166,255,0.45); }
  .btn-save:active { transform: scale(0.98); }
  .divider { display: flex; align-items: center; gap: 10px; color: #b6c2d0; font-size: 12px; margin: 6px 0 14px; }
  .divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #e4ebf4; }
  .unit-row { display: flex; background: #f8fbff; border: 1.5px solid #dfe5ed; border-radius: 12px; padding: 4px; margin-top: 6px; }
  .unit-row .seg { flex: 1; padding: 10px 0; text-align: center; border-radius: 10px; font-size: 14px; font-weight: 500; color: #4a6785; cursor: pointer; transition: all 0.18s; user-select: none; }
  .unit-row .seg.active { background: linear-gradient(135deg, #4da6ff, #66b3ff); color: #fff; font-weight: 700; box-shadow: 0 3px 10px rgba(77,166,255,0.35); }
  .sub-check { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1.5px solid #e6edf5; border-radius: 12px; background: #fafbfe; cursor: pointer; user-select: none; transition: border-color 0.18s, background 0.18s; }
  .sub-check.on { border-color: #4da6ff; background: rgba(77,166,255,0.06); }
  .sub-check .sw { width: 44px; height: 24px; background: #cfd8e3; border-radius: 12px; position: relative; transition: background 0.18s; flex-shrink: 0; }
  .sub-check.on .sw { background: linear-gradient(135deg, #4da6ff, #66b3ff); }
  .sub-check .sw::after { content: ""; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: #fff; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.18s; }
  .sub-check.on .sw::after { transform: translateX(20px); }
  .sub-check .txt { font-size: 14px; font-weight: 500; color: #34495e; }
  .sub-check.on .txt { color: #1890ff; }
  .toast { position: fixed; top: 24px; left: 50%; transform: translateX(-50%) translateY(-20px); background: #fff; color: #2c3e50; padding: 14px 24px; border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 10px; opacity: 0; pointer-events: none; transition: all 0.25s ease; z-index: 1000; }
  .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  .toast.error { border-left: 4px solid #ff4d4f; }
  .toast.ok { border-left: 4px solid #52c41a; }
  @media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } .form-card { padding: 20px 18px; } .header h1 { font-size: 20px; } }
</style>
</head>
<body>

<div class="header">
  <button class="back" onclick="location.href='/'">‹</button>
  <h1>➕ 存入物品</h1>
</div>

<div class="container">
  <div class="form-card">
    <div class="form-group">
      <div class="form-label"><span><span class="req">*</span> 品名</span></div>
      <input type="text" class="form-input" id="fName" placeholder="例如：牛奶 / 番茄 / 苹果">
    </div>
    <div class="form-group">
      <div class="form-label"><span><span class="req">*</span> 类别</span></div>
      <select class="form-select" id="fCategory">
        <option value="" disabled selected>请选择类别</option>
        <option value="蔬菜">蔬菜</option>
        <option value="水果">水果</option>
        <option value="肉类">肉类</option>
        <option value="乳制品">乳制品</option>
        <option value="饮料">饮料</option>
        <option value="主食">主食</option>
        <option value="蛋类">蛋类</option>
        <option value="其他">其他</option>
      </select>
    </div>
    <div class="form-group">
      <div class="form-label"><span><span class="req">*</span> 计量单位</span></div>
      <div class="unit-row" id="unitRow">
        <div class="seg active" data-unit="件">📦 件 · 适合成盒成包</div>
        <div class="seg" data-unit="克">⚖️ 克 · 适合生鲜散装</div>
      </div>
    </div>
    <div class="divider">保质期设置（二选一）</div>
    <div class="form-group">
      <div class="form-label"><span>到期时间</span><span class="hint">若填写，则忽略下方生产日期/保质期</span></div>
      <input type="date" class="form-input" id="fExpiry">
    </div>
    <div class="form-row">
      <div class="form-group">
        <div class="form-label"><span>生产日期</span></div>
        <input type="date" class="form-input" id="fProduce">
      </div>
      <div class="form-group">
        <div class="form-label"><span>保质期</span><span class="hint">单位：天</span></div>
        <input type="number" class="form-input" id="fShelf" min="1" max="3650" placeholder="如 7">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <div class="form-label"><span id="qtyLabel"><span class="req">*</span> 数量</span><span class="hint" id="qtyHint">果蔬肉类可保持默认</span></div>
        <input type="number" class="form-input" id="fQty" min="1" max="999" value="1" placeholder="数量">
      </div>
      <div class="form-group">
        <div class="form-label"><span>订阅提醒</span></div>
        <label class="sub-check" id="subCheck"><span class="txt">🔔 低存量预警</span><span class="sw"></span></label>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-cancel" onclick="location.href='/'">返回</button>
      <button class="btn btn-save" id="saveBtn">保存 · 存入冰箱</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
var currentUnit = "件";
function showToast(msg, isError){ var t=document.getElementById("toast"); t.textContent=(isError?"⚠️ ":"✅ ")+msg; t.className="toast show "+(isError?"error":"ok"); clearTimeout(showToast._t); showToast._t=setTimeout(function(){ t.className="toast"; }, 2200); }

function applyUnitUI(unit){
  currentUnit=unit;
  var qtyEl=document.getElementById("fQty"), qtyLabel=document.getElementById("qtyLabel"), qtyHint=document.getElementById("qtyHint");
  if(unit==="克"){
    qtyLabel.innerHTML='<span class="req">*</span> 重量'; qtyHint.textContent="如 500 克 / 300 克";
    qtyEl.placeholder="重量（克），如 500"; qtyEl.value=""; qtyEl.min="1"; qtyEl.removeAttribute("max");
  } else {
    qtyLabel.innerHTML='<span class="req">*</span> 数量'; qtyHint.textContent="果蔬肉类可保持默认";
    qtyEl.placeholder="数量（件）"; qtyEl.value="1"; qtyEl.min="1"; qtyEl.max="999";
  }
  document.querySelectorAll("#unitRow .seg").forEach(function(s){
    if(s.getAttribute("data-unit")===unit) s.classList.add("active"); else s.classList.remove("active");
  });
}
document.getElementById("unitRow").addEventListener("click", function(e){ var seg=e.target.closest(".seg"); if(seg) applyUnitUI(seg.getAttribute("data-unit")); });

function validate(){
  var ok=true;
  var eln=document.getElementById("fName"), elc=document.getElementById("fCategory"), ele=document.getElementById("fExpiry"), elp=document.getElementById("fProduce"), els=document.getElementById("fShelf"), elq=document.getElementById("fQty");
  [eln,elc,ele,elp,els,elq].forEach(function(el){ if(el) el.classList.remove("error"); });
  if(!eln.value.trim()){ eln.classList.add("error"); showToast("请填写品名",true); ok=false; }
  if(!elc.value){ elc.classList.add("error"); showToast("请选择类别",true); ok=false; }
  var expiryFilled=!!ele.value;
  if(!expiryFilled){
    if(elp.value && !els.value){ els.classList.add("error"); showToast("填了生产日期，保质期必填",true); ok=false; }
    if(!elp.value && els.value){ elp.classList.add("error"); showToast("请同时填生产日期或直接填到期时间",true); ok=false; }
    if(!elp.value && !els.value){ ele.classList.add("error"); showToast("请填到期时间或生产日期+保质期",true); ok=false; }
  }
  var qtyNum=parseInt(elq.value,10);
  if(!qtyNum||qtyNum<1){ elq.classList.add("error"); showToast(currentUnit==="克"?"请输入重量":"请输入数量",true); ok=false; }
  return ok;
}

function computeExpiry(){
  var ele=document.getElementById("fExpiry"), elp=document.getElementById("fProduce"), els=document.getElementById("fShelf");
  if(ele.value) return ele.value;
  if(elp.value && els.value){
    var d=new Date(elp.value); d.setDate(d.getDate()+parseInt(els.value,10));
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  }
  return null;
}

var subEl=document.getElementById("subCheck"); subEl.addEventListener("click", function(){ subEl.classList.toggle("on"); });
applyUnitUI("件");

document.getElementById("saveBtn").addEventListener("click", function(){
  if(!validate()) return;
  var expiryDate=computeExpiry();
  if(!expiryDate){ showToast("请填到期时间或生产日期+保质期",true); return; }
  var payload={
    name: document.getElementById("fName").value.trim(),
    category: document.getElementById("fCategory").value,
    expiryDate: expiryDate,
    quantity: parseInt(document.getElementById("fQty").value,10)||1,
    unit: currentUnit,
    subscribed: subEl.classList.contains("on")
  };
  fetch("/api/fridge",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
    .then(r=>r.json()).then(res=>{
      if(res.ok){ showToast("存入成功！即将返回..."); setTimeout(function(){ location.href="/"; }, 1100); }
      else showToast(res.error||"保存失败",true);
    }).catch(err=>showToast("网络错误："+err.message,true));
});
</script>
</body>
</html>'''

TAKE_HTML = r'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>取出物品 · 我的冰箱</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
    background: linear-gradient(135deg, #fff4e6 0%, #fff8f0 50%, #ffffff 100%); min-height: 100vh; color: #2c3e50; padding-bottom: 20px; }
  .header { background: linear-gradient(135deg, #fa8c16 0%, #ffa940 100%); color: #fff; padding: 24px 20px 20px; border-radius: 0 0 28px 28px; box-shadow: 0 4px 12px rgba(250,140,22,0.3); position: relative; z-index: 5; }
  .header .back { position: absolute; left: 16px; top: 16px; background: rgba(255,255,255,0.25); border: none; width: 38px; height: 38px; border-radius: 50%; color: #fff; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .header h1 { font-size: 22px; font-weight: 700; text-align: center; margin-top: 4px; }
  .header .sub { text-align: center; font-size: 12.5px; opacity: 0.88; margin-top: 6px; }
  .container { max-width: 640px; margin: 20px auto; padding: 0 16px; }
  .summary { display: flex; justify-content: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
  .summary-chip { background: #fff; padding: 6px 14px; border-radius: 16px; font-size: 13px; font-weight: 500; color: #5a7a9a; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  .summary-chip strong { color: #fa8c16; margin-right: 2px; }
  .category { margin-bottom: 18px; }
  .cat-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; margin-bottom: 10px; background: rgba(250,140,22,0.1); border-radius: 12px; }
  .cat-head .cat-label { font-size: 14px; font-weight: 700; color: #d46b08; display: flex; align-items: center; gap: 8px; }
  .cat-head .cat-count { font-size: 12px; color: #d46b08; font-weight: 600; padding: 2px 10px; background: rgba(255,255,255,0.7); border-radius: 10px; }
  .cat-list { background: #fff; border-radius: 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.06); overflow: hidden; }
  .cat-list .item { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid rgba(0,0,0,0.04); cursor: pointer; transition: background 0.12s; }
  .cat-list .item:last-child { border-bottom: none; }
  .cat-list .item:hover { background: #fff8ef; }
  .cat-list .item:active { background: #ffe7cc; }
  .cat-list .item .info { flex: 1; min-width: 0; }
  .cat-list .item .name { font-size: 15.5px; font-weight: 600; color: #2c3e50; }
  .cat-list .item .meta { font-size: 12px; color: #9aa9b8; margin-top: 3px; }
  .cat-list .item .meta .sep { margin: 0 6px; color: #c5d0da; }
  .cat-list .item .meta .exp-soon { color: #ff4d4f; font-weight: 600; }
  .cat-list .item .qty { background: linear-gradient(135deg,#fa8c16,#ffa940); color: #fff; font-size: 14px; font-weight: 700; padding: 6px 12px; border-radius: 18px; margin-right: 10px; box-shadow: 0 2px 8px rgba(250,140,22,0.35); }
  .cat-list .item .unit-tag { background: rgba(255,255,255,0.8); color: #d46b08; font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 8px; margin-right: 10px; }
  .cat-list .item .arrow { color: #c5d0da; font-size: 16px; flex-shrink: 0; }
  .empty { padding: 60px 20px; text-align: center; color: #9aa9b8; font-size: 14px; }
  .empty .ico { font-size: 56px; display: block; margin-bottom: 10px; opacity: 0.7; }
  .mask { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 999; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.18s; padding: 0 24px; }
  .mask.show { opacity: 1; pointer-events: auto; }
  .modal { background: #fff; border-radius: 20px; padding: 24px 24px 20px; width: 100%; max-width: 360px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); transform: translateY(20px) scale(0.96); transition: transform 0.2s; }
  .mask.show .modal { transform: translateY(0) scale(1); }
  .modal .title { font-size: 17px; font-weight: 700; color: #2c3e50; text-align: center; margin-bottom: 14px; line-height: 1.5; }
  .modal .name-chip { display: inline-block; background: rgba(250,140,22,0.12); color: #d46b08; padding: 2px 10px; border-radius: 10px; font-weight: 700; margin: 0 3px; }
  .modal .preview { background: #fafbfe; border-radius: 12px; padding: 12px 14px; margin-bottom: 18px; font-size: 13px; color: #5a7a9a; display: flex; justify-content: space-between; align-items: center; }
  .modal .qty-input-wrap { margin-bottom: 18px; }
  .modal .qty-input-wrap label { display: block; font-size: 13px; font-weight: 600; color: #34495e; margin-bottom: 8px; }
  .modal .qty-input { width: 100%; padding: 12px 14px; font-size: 16px; font-weight: 600; border: 1.5px solid #dfe5ed; border-radius: 12px; background: #f8fbff; outline: none; font-family: inherit; transition: border-color 0.18s, box-shadow 0.18s; }
  .modal .qty-input:focus { border-color: #fa8c16; box-shadow: 0 0 0 3px rgba(250,140,22,0.15); }
  .modal .qty-input.error { border-color: #ff4d4f; background: #fff5f5; }
  .modal .qty-hint { font-size: 11.5px; color: #8c9bab; margin-top: 6px; text-align: center; }
  .modal .btns { display: flex; gap: 10px; margin-bottom: 8px; }
  .modal .btn { flex: 1; padding: 13px 10px; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: transform 0.12s ease, box-shadow 0.12s ease; }
  .modal .btn.primary { background: linear-gradient(135deg,#fa8c16,#ffa940); color: #fff; box-shadow: 0 3px 10px rgba(250,140,22,0.35); }
  .modal .btn.primary:active { transform: scale(0.96); }
  .modal .btn.danger { background: #fff1f0; color: #ff4d4f; box-shadow: inset 0 0 0 1px #ffccc7; }
  .modal .btn.danger:active { transform: scale(0.96); background: #ffe6e6; }
  .modal .cancel { width: 100%; padding: 11px 10px; border: none; background: #eef2f7; border-radius: 12px; color: #4a6785; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: background 0.12s; }
  .modal .cancel:hover { background: #e1e7f0; }
  .toast { position: fixed; top: 24px; left: 50%; transform: translateX(-50%) translateY(-20px); background: #fff; color: #2c3e50; padding: 12px 20px; border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px; opacity: 0; pointer-events: none; transition: all 0.25s ease; z-index: 1001; border-left: 4px solid #fa8c16; }
  .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  @media (max-width: 480px) { .header h1 { font-size: 20px; } .modal { padding: 20px 18px 16px; } }
</style>
</head>
<body>

<div class="header">
  <button class="back" onclick="location.href='/'">‹</button>
  <h1>➖ 取出物品</h1>
  <div class="sub">点击物品即可取出或整份拿走</div>
</div>

<div class="container">
  <div class="summary">
    <div class="summary-chip">共 <strong id="totalCount">0</strong> 件物品</div>
    <div class="summary-chip"><strong id="catCount">0</strong> 个类别</div>
  </div>
  <div id="groupWrap"></div>
</div>

<div class="mask" id="mask">
  <div class="modal">
    <div class="title" id="modalTitle">取出 <span id="mName"></span>？</div>
    <div class="preview" id="modalPreview"></div>
    <div id="modalDynamicArea"></div>
    <div class="btns" id="modalBtns"></div>
    <button class="cancel" id="btnCancel">取消</button>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
var CATEGORY_ORDER = ["蔬菜","水果","肉类","乳制品","饮料","主食","蛋类","其他"];
var CATEGORY_ICON = {"蔬菜":"🥬","水果":"🍎","肉类":"🍖","乳制品":"🥛","饮料":"🥤","主食":"🍞","蛋类":"🥚","其他":"🍱"};
var currentItemId = null, allItems = [];
function showToast(msg){ var t=document.getElementById("toast"); t.textContent="✅ "+msg; t.classList.add("show"); clearTimeout(showToast._t); showToast._t=setTimeout(function(){ t.classList.remove("show"); }, 1600); }
function escape(s){ return String(s||"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function daysUntil(s){ var t=new Date(s); t.setHours(0,0,0,0); var today=new Date(); today.setHours(0,0,0,0); return Math.round((t-today)/86400000); }

function render(){
  var wrap = document.getElementById("groupWrap");
  if(!allItems||!allItems.length){ wrap.innerHTML='<div class="empty"><span class="ico">🧊</span>冰箱空空如也</div>';
    document.getElementById("totalCount").textContent="0"; document.getElementById("catCount").textContent="0"; return; }
  var groups={}; allItems.forEach(function(it){ var c=it.category||"其他"; if(!groups[c]) groups[c]=[]; groups[c].push(it); });
  var cats=Object.keys(groups);
  document.getElementById("totalCount").textContent=allItems.length;
  document.getElementById("catCount").textContent=cats.length;
  var html="";
  CATEGORY_ORDER.forEach(function(cat){
    if(!groups[cat]) return;
    var list=groups[cat], icon=CATEGORY_ICON[cat]||"🍱";
    html += '<div class="category"><div class="cat-head"><div class="cat-label">'+icon+' '+escape(cat)+'</div><div class="cat-count">'+list.length+'</div></div><div class="cat-list">';
    list.forEach(function(it){
      var d=daysUntil(it.expiryDate), soon=d<=3?'exp-soon':'';
      var u=it.unit||"件"; var uIcon=u==="克"?"⚖️":"📦";
      html += '<div class="item" data-id="'+it.id+'">'
        + '<div class="info"><div class="name">'+escape(it.name)+'</div>'
        + '<div class="meta"><span class="'+soon+'">到期 '+escape(it.expiryDate)+'</span><span class="sep">·</span><span>剩余 '+it.quantity+' '+escape(u)+'</span></div></div>'
        + '<div class="unit-tag">'+uIcon+' '+escape(u)+'</div>'
        + '<div class="qty">'+it.quantity+'</div><div class="arrow">›</div></div>';
    });
    html += '</div></div>';
  });
  cats.filter(function(c){ return CATEGORY_ORDER.indexOf(c) === -1; }).forEach(function(cat){
    var list=groups[cat], icon="🍱";
    html += '<div class="category"><div class="cat-head"><div class="cat-label">'+icon+' '+escape(cat)+'</div><div class="cat-count">'+list.length+'</div></div><div class="cat-list">';
    list.forEach(function(it){ var d=daysUntil(it.expiryDate), soon=d<=3?'exp-soon':''; var u=it.unit||"件"; var uIcon=u==="克"?"⚖️":"📦";
      html += '<div class="item" data-id="'+it.id+'"><div class="info"><div class="name">'+escape(it.name)+'</div><div class="meta"><span class="'+soon+'">到期 '+escape(it.expiryDate)+'</span><span class="sep">·</span><span>剩余 '+it.quantity+' '+escape(u)+'</span></div></div><div class="unit-tag">'+uIcon+' '+escape(u)+'</div><div class="qty">'+it.quantity+'</div><div class="arrow">›</div></div>'; });
    html += '</div></div>';
  });
  wrap.innerHTML = html;
  wrap.querySelectorAll(".item").forEach(function(el){
    el.addEventListener("click", function(){ openModal(parseInt(el.getAttribute("data-id"),10)); });
  });
}

function getItem(id){ for(var i=0;i<allItems.length;i++) if(allItems[i].id===id) return allItems[i]; return null; }

function openModal(id){
  var it=getItem(id); if(!it) return;
  currentItemId=id;
  var unit=it.unit||"件";
  document.getElementById("modalTitle").innerHTML='取出 <span class="name-chip">'+escape(it.name)+'</span>？';
  document.getElementById("modalPreview").innerHTML='<span>当前剩余</span><span style="font-weight:700;color:#d46b08;">'+it.quantity+' '+escape(unit)+'</span>';
  var dynamicArea=document.getElementById("modalDynamicArea"), btns=document.getElementById("modalBtns");
  if(unit==="件"){
    dynamicArea.innerHTML="";
    if(it.quantity<=1) btns.innerHTML='<button class="btn primary" data-action="take-one">取出最后 1 件</button><button class="btn danger" data-action="take-all">全部取出</button>';
    else btns.innerHTML='<button class="btn primary" data-action="take-one">取出 1 件</button><button class="btn danger" data-action="take-all">全部取出（'+it.quantity+' 件）</button>';
  } else {
    dynamicArea.innerHTML='<div class="qty-input-wrap"><label>请输入要取出的克数</label>'
      +'<input type="number" class="qty-input" id="gramsInput" min="1" max="'+it.quantity+'" placeholder="如 200">'
      +'<div class="qty-hint">最小 1 克，最大 '+it.quantity+' 克</div></div>';
    btns.innerHTML='<button class="btn primary" data-action="take-grams">确认取出</button><button class="btn danger" data-action="take-all">全部取出（'+it.quantity+' 克）</button>';
    setTimeout(function(){ var inp=document.getElementById("gramsInput"); if(inp) inp.focus(); }, 60);
  }
  btns.querySelectorAll("[data-action]").forEach(function(b){
    b.addEventListener("click", function(){
      var action=b.getAttribute("data-action");
      if(action==="take-one") runTake("one",null);
      else if(action==="take-all") runTake("all",null);
      else if(action==="take-grams"){
        var inp=document.getElementById("gramsInput");
        var v=inp?parseInt(inp.value,10):0;
        if(!v||v<=0){ if(inp) inp.classList.add("error"); showToast("请输入要取出的克数",true); clearTimeout(runTake._t); runTake._t=setTimeout(function(){ if(inp) inp.classList.remove("error"); },1500); return; }
        runTake("grams",v);
      }
    });
  });
  document.getElementById("mask").classList.add("show");
}

function closeModal(){ document.getElementById("mask").classList.remove("show"); currentItemId=null; }
function runTake(mode, amount){
  fetch("/api/fridge/"+currentItemId+"/take",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:mode,amount:amount})})
    .then(r=>r.json()).then(res=>{
      if(res.ok){ showToast(res.message||"已取出"); closeModal(); refresh(); }
      else showToast(res.error||"操作失败",true);
    }).catch(err=>showToast("网络错误："+err.message,true));
}
function refresh(){ fetch("/api/fridge").then(r=>r.json()).then(d=>{ allItems=d.items||[]; render(); }); }
document.getElementById("btnCancel").addEventListener("click", closeModal);
document.getElementById("mask").addEventListener("click", function(e){ if(e.target===document.getElementById("mask")) closeModal(); });
document.addEventListener("keydown", function(e){ if(e.key==="Escape" && currentItemId!=null) closeModal(); if(e.key==="Enter" && currentItemId!=null){ var c=document.getElementById("gramsInput"); if(c && c.value){ var b=document.querySelector('[data-action="take-grams"]'); if(b) b.click(); } } });

fetch("/api/fridge").then(r=>r.json()).then(data=>{ allItems=data.items||[]; render(); })
  .catch(err=>{ document.getElementById("groupWrap").innerHTML='<div class="empty"><span class="ico">⚠️</span>后端未启动</div>'; });
</script>
</body>
</html>'''

SUBS_HTML = r'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>提醒物品 · 我的冰箱</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
    background: linear-gradient(135deg, #e0f0ff 0%, #f5faff 50%, #ffffff 100%); min-height: 100vh; color: #2c3e50; }
  .header { background: linear-gradient(135deg,#4da6ff,#66b3ff); color:#fff; padding:24px 20px 60px; border-radius:0 0 28px 28px; box-shadow:0 4px 12px rgba(77,166,255,0.3); position: relative; z-index: 5; }
  .header .back { position:absolute; left:16px; top:16px; background:rgba(255,255,255,0.25); border:none; width:38px; height:38px; border-radius:50%; color:#fff; font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .header h1 { font-size:22px; font-weight:700; text-align:center; margin-top:4px; }
  .header .tip { text-align:center; margin-top:14px; font-size:12.5px; opacity:0.9; line-height:1.6; padding: 8px 14px; background:rgba(255,255,255,0.2); border-radius: 10px; display:inline-block; }
  .header .tip-wrap { text-align: center; margin-top: 8px; }
  .container { max-width: 640px; margin: -44px auto 32px; padding: 0 16px; }
  .hint { background:#e6f7ff; border-left:3px solid #1890ff; border-radius:12px; padding:14px 16px; margin-bottom:16px; font-size:13px; color:#1a4c7a; line-height:1.7; }
  .hint strong { color:#1890ff; }
  .badge-bar { text-align:center; margin-bottom:12px; font-size:13px; color:#5a7a9a; }
  .badge-bar .num { color:#1890ff; font-weight:700; }
  .empty { padding: 60px 20px; text-align: center; color: #9aa9b8; font-size: 14px; }
  .empty .ico { font-size: 56px; display: block; margin-bottom: 10px; opacity: 0.7; }
  .list { background:#fff; border-radius:16px; box-shadow:0 8px 24px rgba(0,0,0,0.07); overflow:hidden; }
  .list .row { display:flex; align-items:center; padding:14px 16px; border-bottom: 1px solid rgba(0,0,0,0.04); }
  .list .row:last-child { border-bottom: none; }
  .list .row .info { flex:1; min-width:0; }
  .list .row .name { font-size:15px; font-weight:600; color:#2c3e50; }
  .list .row .meta { font-size:11.5px; color:#8c9bab; margin-top:3px; }
  .list .row .meta .tag { display:inline-block; padding:1px 6px; border-radius:6px; margin-right:5px; font-size:10.5px; font-weight:600; }
  .list .row .tag-on { background:#e6f7ff; color:#1890ff; }
  .list .row .tag-off { background:#f5f5f5; color:#999; }
  .list .row .tag-soon { background:#fff7e6; color:#d46b08; }
  .list .row .tag-exp { background:#fff1f0; color:#cf1322; }
  .sw-wrap { flex-shrink:0; margin-left:10px; }
  .sw { width:50px; height:28px; background:#cfd8e3; border-radius:14px; position:relative; cursor:pointer; transition: background 0.2s; }
  .sw::after { content:""; position:absolute; top:2px; left:2px; width:24px; height:24px; background:#fff; border-radius:50%; box-shadow:0 1px 3px rgba(0,0,0,0.2); transition: transform 0.2s; }
  .sw.on { background: linear-gradient(135deg,#4da6ff,#66b3ff); box-shadow: 0 2px 8px rgba(77,166,255,0.4); }
  .sw.on::after { transform: translateX(22px); }
  @media (max-width: 480px) { .header h1 { font-size:20px; } }
</style>
</head>
<body>

<div class="header">
  <button class="back" onclick="location.href='/'">‹</button>
  <h1>🔔 选择提醒物品</h1>
  <div class="tip-wrap"><span class="tip">存量低于 3 件（或 200 克）时，会在首页「存量预警」中显示。</span></div>
</div>

<div class="container">
  <div class="hint">💡 把你常吃常喝的食物都<strong>打开提醒</strong>，低存量时 Dashboard 会自动提醒你～</div>
  <div class="badge-bar">已开启 <span class="num" id="onCount">0</span> / <span id="totalCount">0</span></div>
  <div id="emptyBox" class="empty" style="display:none"><span class="ico">🧊</span>冰箱空空如也</div>
  <div class="list" id="listBox"></div>
</div>

<script>
function escape(s){ return String(s||"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function daysUntil(s){ var t=new Date(s); t.setHours(0,0,0,0); var today=new Date(); today.setHours(0,0,0,0); return Math.round((t-today)/86400000); }
var items=[];
function render(){
  var box=document.getElementById("listBox"), empty=document.getElementById("emptyBox");
  if(!items.length){ box.innerHTML=""; empty.style.display="block"; return; }
  empty.style.display="none";
  items.sort((a,b)=> (a.subscribed?1:0)-(b.subscribed?1:0));
  var html="";
  items.forEach(function(it){
    var d=daysUntil(it.expiryDate), expCls="";
    if(d<0) expCls="tag-exp"; else if(d<=3) expCls="tag-soon";
    var expTag = d<0?"已过期":(d===0?"今天到期":(d<=3?"临期":""));
    var u=it.unit||"件";
    var stockTag = it.subscribed ? '<span class="tag tag-on">已订阅</span>' : '<span class="tag tag-off">未订阅</span>';
    var dueTag = expTag ? '<span class="tag '+expCls+'">'+expTag+'</span>' : "";
    html += '<div class="row">'
      + '<div class="info">'
        + '<div class="name">'+escape(it.name)+'</div>'
        + '<div class="meta">'+stockTag+dueTag+escape(it.category)+' · 剩余 '+it.quantity+' '+escape(u)+' · 到期 '+escape(it.expiryDate)+'</div>'
      + '</div>'
      + '<div class="sw-wrap"><div class="sw '+(it.subscribed?"on":"")+'" data-id="'+it.id+'"></div></div>'
    + '</div>';
  });
  box.innerHTML=html;
  document.getElementById("totalCount").textContent=items.length;
  document.getElementById("onCount").textContent=items.filter(i=>i.subscribed).length;
  box.querySelectorAll(".sw").forEach(function(el){
    el.addEventListener("click", function(){
      var id=parseInt(el.getAttribute("data-id"),10);
      var item=items.find(i=>i.id===id);
      if(!item) return;
      var newVal=!item.subscribed;
      fetch("/api/fridge/"+id+"/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subscribed:newVal})})
        .then(r=>r.json()).then(res=>{
          if(res.ok){ item.subscribed=newVal; el.classList.toggle("on",newVal); document.getElementById("onCount").textContent=items.filter(i=>i.subscribed).length; }
        });
    });
  });
}
fetch("/api/fridge").then(r=>r.json()).then(data=>{ items=data.items||[]; render(); });
</script>
</body>
</html>'''

HIST_HTML = r'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>历史记录 · 我的冰箱</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
    background: linear-gradient(135deg, #e0f0ff 0%, #f5faff 50%, #ffffff 100%); min-height: 100vh; color: #2c3e50; }
  .header { background: linear-gradient(135deg,#4da6ff,#66b3ff); color:#fff; padding:24px 20px 20px; border-radius:0 0 28px 28px; box-shadow:0 4px 12px rgba(77,166,255,0.3); position: relative; z-index: 5; }
  .header .back { position:absolute; left:16px; top:16px; background:rgba(255,255,255,0.25); border:none; width:38px; height:38px; border-radius:50%; color:#fff; font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .header h1 { font-size:22px; font-weight:700; text-align:center; margin-top:4px; }
  .container { max-width: 640px; margin: 24px auto 40px; padding: 0 16px; }
  .toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
  .tb-left { font-size:13px; color:#5a7a9a; }
  .tb-left strong { color:#1890ff; }
  .tb-right button { background:#fff; border:1px solid #ffccc7; color:#ff4d4f; padding:6px 12px; border-radius:10px; font-size:12.5px; font-weight:600; cursor:pointer; font-family:inherit; }
  .tb-right button:hover { background:#fff1f0; }
  .empty { padding: 80px 20px; text-align: center; color: #9aa9b8; font-size: 14px; }
  .empty .ico { font-size: 64px; display: block; margin-bottom: 12px; opacity: 0.7; }
  .list { background:#fff; border-radius:16px; box-shadow:0 8px 24px rgba(0,0,0,0.07); overflow:hidden; }
  .list .row { display:flex; align-items:center; padding:12px 14px; border-bottom: 1px solid rgba(0,0,0,0.04); }
  .list .row:last-child { border-bottom: none; }
  .action-tag { display:flex; align-items:center; gap:5px; padding:3px 10px; border-radius:10px; font-size:12px; font-weight:700; color:#fff; flex-shrink:0; }
  .action-tag.take-in  { background: linear-gradient(135deg,#52c41a,#73d13d); box-shadow: 0 2px 6px rgba(82,196,26,0.35); }
  .action-tag.take-out { background: linear-gradient(135deg,#fa8c16,#ffa940); box-shadow: 0 2px 6px rgba(250,140,22,0.35); }
  .action-tag.delete   { background: linear-gradient(135deg,#ff4d4f,#ff7875); box-shadow: 0 2px 6px rgba(255,77,79,0.35); }
  .info { flex:1; min-width:0; margin-left:12px; }
  .name { font-size:14.5px; font-weight:600; color:#2c3e50; }
  .time { font-size:11.5px; color:#9aa9b8; margin-top:2px; font-variant-numeric:tabular-nums; }
  .qty-pill { padding:4px 10px; border-radius:10px; font-size:12.5px; font-weight:700; flex-shrink:0; }
  .qty-pill.pos { background:#f6ffed; color:#389e0d; border:1px solid #b7eb8f; }
  .qty-pill.neg { background:#fff7e6; color:#d46b08; border:1px solid #ffd591; }
  .qty-pill.del { background:#fff1f0; color:#cf1322; border:1px solid #ffa39e; }
  @media (max-width: 480px) { .header h1 { font-size:20px; } .action-tag { padding:3px 8px; font-size:11.5px; } .qty-pill { padding:4px 8px; font-size:11.5px; } }
</style>
</head>
<body>

<div class="header">
  <button class="back" onclick="location.href='/'">‹</button>
  <h1>📜 历史记录</h1>
</div>

<div class="container">
  <div class="toolbar">
    <div class="tb-left">共 <strong id="cnt">0</strong> 条记录（显示最近 64 条）</div>
    <div class="tb-right"><button id="clearBtn">🗑️ 清空记录</button></div>
  </div>
  <div id="emptyBox" class="empty" style="display:none"><span class="ico">🫥</span>还没有任何操作记录</div>
  <div class="list" id="listBox"></div>
</div>

<script>
function escape(s){ return String(s||"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function humanTime(iso){
  try {
    var d=new Date(iso);
    if(isNaN(d.getTime())) return iso||"";
    var now=new Date(); var today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    var dayDiff=Math.floor((today-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/86400000);
    var hm=String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
    if(dayDiff===0) return "今天 "+hm;
    if(dayDiff===1) return "昨天 "+hm;
    if(dayDiff===2) return "前天 "+hm;
    return (d.getMonth()+1)+"月"+d.getDate()+"日 "+hm;
  } catch(e) { return iso||""; }
}
function render(){
  fetch("/api/history").then(r=>r.json()).then(data=>{
    var logs=data.history||[];
    document.getElementById("cnt").textContent=logs.length;
    var empty=document.getElementById("emptyBox"); var box=document.getElementById("listBox");
    if(!logs.length){ empty.style.display="block"; box.innerHTML=""; return; }
    empty.style.display="none";
    var html="";
    logs.forEach(function(l){
      var tagClass, tagIcon, pillClass;
      if(l.action==="存入"){ tagClass="take-in"; tagIcon="➕"; pillClass="pos"; }
      else if(l.action==="取出"){ tagClass="take-out"; tagIcon="➖"; pillClass="neg"; }
      else { tagClass="delete"; tagIcon="🗑️"; pillClass="del"; }
      html += '<div class="row">'
        + '<div class="action-tag '+tagClass+'">'+tagIcon+' '+escape(l.action)+'</div>'
        + '<div class="info">'
          + '<div class="name">'+escape(l.itemName)+'</div>'
          + '<div class="time">'+humanTime(l.timestamp)+'</div>'
        + '</div>'
        + '<div class="qty-pill '+pillClass+'">'+escape(l.quantityChange)+'</div>'
      + '</div>';
    });
    box.innerHTML=html;
  });
}
document.getElementById("clearBtn").addEventListener("click", function(){
  if(!confirm("确定清空所有历史记录？此操作不可恢复。")) return;
  fetch("/api/history",{method:"DELETE"}).then(r=>r.json()).then(res=>{ if(res.ok) render(); });
});
render();
</script>
</body>
</html>'''

@app.route("/")
def index():
    return render_template_string(INDEX_HTML)

@app.route("/put-in")
def putin():
    return render_template_string(PUTIN_HTML)

@app.route("/take-out")
def takeout():
    return render_template_string(TAKE_HTML)

@app.route("/subscriptions")
def subs():
    return render_template_string(SUBS_HTML)

@app.route("/history")
def history():
    return render_template_string(HIST_HTML)

@app.route("/api/fridge", methods=["GET"])
def api_list():
    db = load_db()
    return jsonify({
        "items": db["items"],
        "subscriptions": db.get("subscriptions", [])
    })

@app.route("/api/fridge", methods=["POST"])
def api_put():
    data = request.get_json()
    db = load_db()
    new_item = {
        "id": next_id(db["items"]),
        "name": data["name"],
        "category": data.get("category", "其他"),
        "expiryDate": data["expiryDate"],
        "quantity": int(data.get("quantity", 1)),
        "unit": data.get("unit", "件"),
        "subscribed": bool(data.get("subscribed", False))
    }
    db["items"].append(new_item)
    add_history_entry(db, "存入", new_item["name"], "+" + str(new_item["quantity"]) + (" " + new_item["unit"] if new_item["unit"] == "克" else " 件"))
    save_db(db)
    return jsonify({"ok": True, "id": new_item["id"]})

@app.route("/api/fridge/<int:item_id>/take", methods=["POST"])
def api_take(item_id):
    data = request.get_json()
    mode = data.get("mode", "take-one")
    amount = data.get("amount")
    db = load_db()
    item = next((it for it in db["items"] if it["id"] == item_id), None)
    if not item:
        return jsonify({"ok": False, "error": "物品不存在"}), 404

    unit = item.get("unit", "件")
    qty_str = ""

    if mode == "all":
        taken_qty = item["quantity"]
        taken_str = str(item["quantity"]) + (" " + unit if unit == "克" else " 件")
        item["quantity"] = 0
        qty_str = "-" + taken_str
    elif mode == "one":
        if item["quantity"] <= 0:
            return jsonify({"ok": False, "error": "库存不足"}), 400
        if unit == "件":
            item["quantity"] -= 1
            qty_str = "-1 件"
        else:
            return jsonify({"ok": False, "error": "克单位请使用确认取出"}), 400
    elif mode == "grams":
        g = int(amount or 0)
        if g <= 0:
            return jsonify({"ok": False, "error": "请输入有效克数"}), 400
        if g >= item["quantity"]:
            g = item["quantity"]
            item["quantity"] = 0
        else:
            item["quantity"] -= g
        qty_str = "-" + str(g) + " 克"
    else:
        return jsonify({"ok": False, "error": "未知模式"}), 400

    if item["quantity"] <= 0:
        db["items"] = [it for it in db["items"] if it["quantity"] > 0]
        action = "取出" if mode != "all" else "取出"
    else:
        action = "取出"

    add_history_entry(db, action, item["name"], qty_str)
    save_db(db)
    return jsonify({"ok": True, "message": "已取出 " + item["name"] + " " + qty_str})

@app.route("/api/fridge/<int:item_id>/subscribe", methods=["POST"])
def api_subscribe(item_id):
    data = request.get_json()
    db = load_db()
    item = next((it for it in db["items"] if it["id"] == item_id), None)
    if not item:
        return jsonify({"ok": False, "error": "物品不存在"}), 404
    item["subscribed"] = bool(data.get("subscribed", False))
    save_db(db)
    return jsonify({"ok": True})

@app.route("/api/history", methods=["GET"])
def api_history():
    db = load_db()
    return jsonify({"history": db["history"][:64]})

@app.route("/api/history", methods=["DELETE"])
def api_history_clear():
    db = load_db()
    db["history"] = []
    save_db(db)
    return jsonify({"ok": True})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)