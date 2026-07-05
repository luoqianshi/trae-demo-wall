from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import requests
import json
import time

app = Flask(__name__, static_folder=None)
CORS(app, supports_credentials=True)

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

API_KEY = '63d7e15e85d9464ba657c245632a9ea1.uRHadv0XqGjF9jYs'
API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/index.html')
def serve_index_html():
    return send_from_directory(FRONTEND_DIR, 'index.html')

def call_glm_api(prompt):
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    data = {
        'model': 'glm-4.7-flash',
        'stream': False,
        'temperature': 1,
        'thinking': {
            'type': 'enabled',
            'clear_thinking': True
        },
        'messages': [
            {
                'role': 'user',
                'content': prompt
            }
        ]
    }
    max_attempts = 5
    for attempt in range(max_attempts):
        try:
            response = requests.post(API_URL, headers=headers, json=data, timeout=180)
            if response.status_code == 429:
                if attempt < max_attempts - 1:
                    wait = 5 * (2 ** attempt)
                    print(f'429 rate limit, retry after {wait}s (attempt {attempt+1}/{max_attempts})')
                    time.sleep(wait)
                    continue
                raise Exception('API rate limit (429), retried 5 times, please try later')
            if response.status_code in (401, 403):
                raise Exception('API Key invalid or expired')
            response.raise_for_status()
            result = response.json()
            if result.get('choices') and len(result['choices']) > 0:
                return result['choices'][0]['message']['content']
            raise Exception('API returned empty')
        except requests.exceptions.Timeout:
            if attempt < max_attempts - 1:
                time.sleep(5)
                continue
            raise Exception('API request timeout')
        except requests.exceptions.ConnectionError:
            if attempt < max_attempts - 1:
                time.sleep(5)
                continue
            raise Exception('Cannot connect to API server')
    raise Exception('API request failed after 5 retries')

@app.route('/api/generate-plan', methods=['POST'])
def generate_plan():
    try:
        data = request.get_json()
        learning_goal = data.get('learning_goal', '')
        purpose = data.get('purpose', '')
        daily_hours = data.get('daily_hours', '')
        level = data.get('level', '')
        
        if not all([learning_goal, purpose, daily_hours, level]):
            return jsonify({'error': 'missing required params'}), 400
        
        # Single combined prompt: analyze + generate plan in one call
        prompt = (
            f'You are a senior education planning expert.\n\n'
            f'Student: wants to learn {learning_goal}, goal is {purpose}, '
            f'studying {daily_hours} per day, current level is {level}.\n\n'
            f'First, briefly analyze what this student needs to learn and the learning path.\n'
            f'Then, generate a complete daily learning plan. Use this EXACT format for each day:\n\n'
            f'【Day 1】\n'
            f'学习内容：\n(describe what to learn today in detail)\n\n'
            f'学习要求：\n(what the student should achieve or master today)\n\n'
            f'学习资源：\n(specific books, videos, articles, courses with names)\n\n'
            f'作业：\n(specific assignments and tasks for today)\n\n'
            f'【Day 2】\n'
            f'...same format for all days...\n\n'
            f'CRITICAL: You MUST use the exact format markers 【Day N】, 学习内容：, 学习要求：, 学习资源：, 作业：. '
            f'Make the plan actionable with specific, concrete content. '
            f'Include enough days to cover the full learning path. Output in Chinese.'
        )
        plan = call_glm_api(prompt)
        
        return jsonify({'success': True, 'content': plan})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/evaluate-homework', methods=['POST'])
def evaluate_homework():
    try:
        data = request.get_json()
        learning_goal = data.get('learning_goal', '')
        level = data.get('level', '')
        day_number = data.get('day_number', '')
        homework_requirement = data.get('homework_requirement', '')
        homework_content = data.get('homework_content', '')
        plan_content = data.get('plan_content', '')
        
        if not all([learning_goal, level, day_number, homework_requirement, homework_content, plan_content]):
            return jsonify({'error': 'missing required params'}), 400
        
        prompt = (
            f'{plan_content}\n\n'
            f'You are an education planning expert and {learning_goal} industry expert. '
            f'I am learning {learning_goal}, my level is {level}. '
            f'This is my homework for day {day_number}. '
            f'The homework requirement is: {homework_requirement}. '
            f'My homework submission is: {homework_content}. '
            f'Please evaluate my homework from three dimensions: '
            f'completeness, correctness, and improvement suggestions. '
            f'Point out issues and provide guidance. Output in Chinese.'
        )
        
        result = call_glm_api(prompt)
        return jsonify({'success': True, 'content': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
