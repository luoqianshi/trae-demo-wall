import os
import json
import uuid
import time
from datetime import datetime

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', '')
DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'
MAX_TRIAL_COUNT = 100
MEMORY_DIR = 'memory'

os.makedirs(MEMORY_DIR, exist_ok=True)

def get_user_data(session_id):
    """获取用户数据，如果不存在则创建"""
    filepath = os.path.join(MEMORY_DIR, f'{session_id}.json')
    
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    
    return {
        'user_profile': {
            'name': '',
            'nickname': '',
            'likes': [],
            'dislikes': []
        },
        'pet_memory': {
            'important_events': [],
            'conversation_summary': ''
        },
        'chat_history': [],
        'trial_count': 0,
        'last_reset': datetime.now().strftime('%Y-%m-%d')
    }

def save_user_data(session_id, data):
    """保存用户数据"""
    filepath = os.path.join(MEMORY_DIR, f'{session_id}.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def check_daily_reset(user_data):
    """检查是否需要重置每日次数"""
    today = datetime.now().strftime('%Y-%m-%d')
    if user_data['last_reset'] != today:
        user_data['trial_count'] = 0
        user_data['last_reset'] = today
    return user_data

def extract_memory_from_message(message):
    """从消息中提取记忆信息"""
    memory_info = {}
    msg_lower = message.lower()
    
    name_patterns = ['我叫', '我的名字是', '名字叫', '我是']
    for pattern in name_patterns:
        if pattern in msg_lower:
            start_idx = msg_lower.index(pattern) + len(pattern)
            name = message[start_idx:start_idx+20].strip()
            name = name.replace('。', '').replace('，', '').replace(',', '').replace('.', '')
            name = name.split()[0]
            if len(name) > 0:
                memory_info['name'] = name
            break
    
    nickname_patterns = ['小名', '昵称叫', '叫我', '你可以叫我']
    for pattern in nickname_patterns:
        if pattern in msg_lower:
            start_idx = msg_lower.index(pattern) + len(pattern)
            nickname = message[start_idx:start_idx+20].strip()
            nickname = nickname.replace('。', '').replace('，', '').replace(',', '').replace('.', '')
            nickname = nickname.split()[0]
            if len(nickname) > 0:
                memory_info['nickname'] = nickname
            break
    
    if '喜欢' in msg_lower or '爱' in msg_lower:
        memory_info['likes'] = True
    
    if '讨厌' in msg_lower or '不喜欢' in msg_lower:
        memory_info['dislikes'] = True
    
    return memory_info

def build_system_prompt(user_data):
    """构建系统提示词"""
    profile = user_data['user_profile']
    memory = user_data['pet_memory']
    
    prompt = "你是 PetPilot，一只可爱的 AI 猫咪宠物！🐱\n\n"
    prompt += "你的性格：活泼可爱、聪明伶俐、喜欢撒娇\n\n"
    
    if profile['name']:
        prompt += f"主人的名字：{profile['name']}\n"
    if profile['nickname']:
        prompt += f"主人的昵称：{profile['nickname']}\n"
    if profile['likes']:
        prompt += f"主人喜欢：{', '.join(profile['likes'])}\n"
    if profile['dislikes']:
        prompt += f"主人讨厌：{', '.join(profile['dislikes'])}\n"
    
    if memory['conversation_summary']:
        prompt += f"\n之前的对话摘要：{memory['conversation_summary']}\n"
    
    prompt += "\n请用可爱的语气回复主人，使用喵~开头，适当使用emoji！\n"
    prompt += "记住主人告诉你的所有信息，并在后续对话中使用！\n"
    
    return prompt

def call_deepseek_api(messages):
    """调用 DeepSeek API"""
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {DEEPSEEK_API_KEY}'
    }
    
    payload = {
        'model': 'deepseek-chat',
        'messages': messages,
        'temperature': 0.8,
        'max_tokens': 500
    }
    
    try:
        response = requests.post(DEEPSEEK_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        return result['choices'][0]['message']['content']
    except Exception as e:
        print(f"API Error: {e}")
        return None

def get_fallback_response(user_data, message):
    """备用回复"""
    fallbacks = [
        "喵~我现在有点困啦，但是我还在陪你哦~ 🐱",
        "喵~主人说的话我记住啦！下次再聊~ 😸",
        "喵~好可爱的主人！我喜欢你！💕",
        "喵~今天天气真好呀！和我一起玩吧！🌞",
        "喵~咕噜咕噜~ 主人你在忙什么呀？🐾"
    ]
    
    profile = user_data['user_profile']
    msg_lower = message.lower()
    
    if '你好' in msg_lower or 'hi' in msg_lower or 'hello' in msg_lower:
        name = profile['nickname'] or profile['name'] or '主人'
        return f"喵~你好呀{name}！我是你的AI宠物PetPilot！🐱"
    
    if '名字' in msg_lower or '叫什么' in msg_lower:
        return "喵~我是PetPilot，你可以给我起名字哦！😸"
    
    if profile['name'] and ('我叫' in msg_lower or '名字叫' in msg_lower):
        return f"喵~记住啦！以后叫你{profile['name']}！🐱"
    
    return fallbacks[hash(message) % len(fallbacks)]

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        session_id = data.get('session_id', '')
        message = data.get('message', '')
        
        if not session_id:
            return jsonify({'success': False, 'reply': '喵~请先获取session！🐱'})
        
        if not message.strip():
            return jsonify({'success': False, 'reply': '喵~主人请说点什么吧！🐱'})
        
        user_data = get_user_data(session_id)
        user_data = check_daily_reset(user_data)
        
        if user_data['trial_count'] >= MAX_TRIAL_COUNT:
            return jsonify({'success': True, 'reply': '喵~今天体验次数用完啦，明天再来陪我玩吧！🐱', 'trial_used': MAX_TRIAL_COUNT, 'trial_total': MAX_TRIAL_COUNT})
        
        memory_info = extract_memory_from_message(message)
        if memory_info.get('name'):
            user_data['user_profile']['name'] = memory_info['name']
        if memory_info.get('nickname'):
            user_data['user_profile']['nickname'] = memory_info['nickname']
        if memory_info.get('likes'):
            user_data['user_profile']['likes'].append(message[:50])
            user_data['user_profile']['likes'] = list(set(user_data['user_profile']['likes']))
        if memory_info.get('dislikes'):
            user_data['user_profile']['dislikes'].append(message[:50])
            user_data['user_profile']['dislikes'] = list(set(user_data['user_profile']['dislikes']))
        
        system_prompt = build_system_prompt(user_data)
        
        messages = []
        messages.append({'role': 'system', 'content': system_prompt})
        
        for chat in user_data['chat_history'][-10:]:
            messages.append({'role': chat['role'], 'content': chat['content']})
        
        messages.append({'role': 'user', 'content': message})
        
        ai_reply = call_deepseek_api(messages)
        
        if not ai_reply:
            ai_reply = get_fallback_response(user_data, message)
        
        user_data['chat_history'].append({'role': 'user', 'content': message})
        user_data['chat_history'].append({'role': 'assistant', 'content': ai_reply})
        
        if len(user_data['chat_history']) > 50:
            user_data['chat_history'] = user_data['chat_history'][-50:]
        
        user_data['trial_count'] += 1
        save_user_data(session_id, user_data)
        
        return jsonify({
            'success': True,
            'reply': ai_reply,
            'trial_used': user_data['trial_count'],
            'trial_total': MAX_TRIAL_COUNT
        })
    
    except Exception as e:
        print(f"Chat Error: {e}")
        return jsonify({'success': True, 'reply': '喵~我现在有点不舒服，休息一下再来陪你吧~ 🐱'})

@app.route('/api/session', methods=['GET'])
def get_session():
    session_id = request.args.get('session_id', '')
    
    if not session_id:
        session_id = str(uuid.uuid4())[:8]
    
    user_data = get_user_data(session_id)
    user_data = check_daily_reset(user_data)
    save_user_data(session_id, user_data)
    
    return jsonify({
        'success': True,
        'session_id': session_id,
        'trial_used': user_data['trial_count'],
        'trial_total': MAX_TRIAL_COUNT
    })

@app.route('/api/user_data', methods=['GET'])
def get_user_data_api():
    session_id = request.args.get('session_id', '')
    
    if not session_id:
        return jsonify({'success': False, 'message': '缺少session_id'})
    
    user_data = get_user_data(session_id)
    user_data = check_daily_reset(user_data)
    
    return jsonify({
        'success': True,
        'trial_used': user_data['trial_count'],
        'trial_total': MAX_TRIAL_COUNT
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)