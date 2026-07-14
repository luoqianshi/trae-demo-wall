"""
Smart Second Brain - Douyin Video Parser Backend
Uses browser automation to fetch real Douyin video content
"""
import json
import re
import time
import requests
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Cache for parsed results (avoid re-fetching same URL)
cache = {}

def extract_video_id(url):
    """Extract video ID from various Douyin URL formats"""
    patterns = [
        r'/video/(\d+)',
        r'/note/(\d+)',
        r'modal_id=(\d+)',
        r'item_ids=(\d+)',
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    # For short links like https://v.douyin.com/xxxxx/, 
    # we'll return a hash as identifier
    return str(hash(url) % 100000000)

def parse_douyin_realtime(url):
    """Parse Douyin video page using browser automation"""
    video_id = extract_video_id(url)
    
    # Try to resolve short URL first
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.douyin.com/',
        'Accept-Language': 'zh-CN,zh;q=0.9',
    }
    
    result = {
        'title': '',
        'author': '',
        'likes': '',
        'comments': '',
        'duration': '',
        'tags': [],
        'summary': '',
        'noteTags': [],
        'success': False,
        'message': ''
    }
    
    try:
        # Resolve short URL to get real URL
        session = requests.Session()
        session.headers.update(headers)
        
        if 'v.douyin.com' in url:
            resp = session.get(url, allow_redirects=True, timeout=10)
            resolved_url = resp.url
        else:
            resolved_url = url
        
        # Extract video ID from resolved URL
        real_id = extract_video_id(resolved_url)
        if real_id:
            video_id = real_id
        
        # Build mobile page URL (easier to scrape)
        # Mobile pages have simpler structure
        mobile_url = f'https://www.douyin.com/video/{video_id}'
        
        resp = session.get(mobile_url, headers=headers, timeout=10)
        html = resp.text
        
        # Extract data from SSR JSON in page source
        # Douyin embeds data in RENDER_DATA or __NEXT_DATA__
        title = ''
        author = ''
        description = ''
        
        # Try RENDER_DATA
        render_match = re.search(r'<script id="RENDER_DATA" type="application/json">(.+?)</script>', html, re.DOTALL)
        if render_match:
            import urllib.parse
            try:
                raw_json = urllib.parse.unquote(render_match.group(1))
                data = json.loads(raw_json)
                # Navigate the data structure
                if 'aweme' in str(data):
                    # Try common paths
                    def find_in_dict(d, keys):
                        for k in keys:
                            if isinstance(d, dict):
                                d = d.get(k, {})
                            else:
                                return ''
                        return d
                    
                    aweme = find_in_dict(data, ['aweme', 'detail'])
                    if aweme:
                        title = aweme.get('desc', '')
                        author_info = aweme.get('author', {})
                        author = author_info.get('nickname', '')
                        stats = aweme.get('statistics', {})
                        likes = stats.get('digg_count', 0)
                        comments = stats.get('comment_count', 0)
                        
                        result['likes'] = format_count(likes)
                        result['comments'] = format_count(comments)
                        result['duration'] = format_duration(aweme.get('video', {}).get('duration', 0))
                        
                        # Extract tags from text
                        hashtags = aweme.get('text_extra', [])
                        tags = []
                        for tag in hashtags:
                            if isinstance(tag, dict) and tag.get('hashtag_name'):
                                tags.append(tag['hashtag_name'])
                        result['tags'] = tags
                        
                        if title:
                            result['title'] = title
                        if author:
                            result['author'] = '@' + author
                        result['summary'] = title
                        result['success'] = True
            except:
                pass
        
        # Try __NEXT_DATA__ as fallback
        if not result['success']:
            next_match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.+?)</script>', html, re.DOTALL)
            if next_match:
                try:
                    data = json.loads(next_match.group(1))
                    # Navigate props.pageProps
                    props = data.get('props', {}).get('pageProps', {})
                    # Different pages have different structures
                    detail = (props.get('detail') or 
                             props.get('awemeDetail') or
                             {})
                    if isinstance(detail, dict):
                        title = detail.get('desc', '')
                        author_info = detail.get('author', {})
                        author = author_info.get('nickname', '')
                        stats = detail.get('statistics', {})
                        tags_data = detail.get('text_extra', [])
                        
                        if title:
                            result['title'] = title
                        if author:
                            result['author'] = '@' + author
                        result['likes'] = format_count(stats.get('digg_count', 0))
                        result['comments'] = format_count(stats.get('comment_count', 0))
                        result['duration'] = format_duration(detail.get('video', {}).get('duration', 0))
                        result['tags'] = [t.get('hashtag_name', '') for t in tags_data if isinstance(t, dict) and t.get('hashtag_name')]
                        result['summary'] = title
                        result['success'] = True
                except:
                    pass
        
        # Fallback: extract from meta tags
        if not result['success']:
            og_title = re.search(r'<meta property="og:title" content="([^"]+)"', html)
            og_desc = re.search(r'<meta property="og:description" content="([^"]+)"', html)
            title_tag = re.search(r'<title>(.+?)</title>', html)
            
            if og_title:
                result['title'] = og_title.group(1)
                result['summary'] = og_title.group(1)
            elif title_tag:
                result['title'] = title_tag.group(1).split(' - ')[0].strip()
                result['summary'] = result['title']
            
            if og_desc:
                result['summary'] = og_desc.group(1)
            
            # Extract author from meta
            author_meta = re.search(r'"nickname":"([^"]+)"', html)
            if author_meta:
                result['author'] = '@' + author_meta.group(1)
            
            # Extract tags from page
            all_tags = re.findall(r'"hashtag_name":"([^"]+)"', html)
            result['tags'] = all_tags[:5]
            
            if result['title']:
                result['success'] = True
        
        if not result['success']:
            result['message'] = '无法解析该抖音链接，请确认链接格式正确'
        
    except Exception as e:
        result['message'] = f'解析失败: {str(e)}'
        result['success'] = False
    
    # Generate note tags from content if successful
    if result['success'] and result['title']:
        note_tags = ['#抖音笔记', '#知识采集']
        for t in result['tags']:
            note_tags.append('#' + t)
        result['noteTags'] = note_tags
    elif not result['success']:
        result['noteTags'] = ['#抖音笔记', '#知识采集']
    
    return result

def format_count(count):
    """Format large numbers to readable format"""
    if isinstance(count, str):
        return count
    if count >= 10000:
        return f'{count/10000:.1f}万'
    elif count >= 1000:
        return f'{count/1000:.1f}k'
    return str(count)

def format_duration(ms):
    """Format duration from milliseconds to mm:ss"""
    if isinstance(ms, str):
        return ms
    try:
        total_sec = int(ms) // 1000
        mins = total_sec // 60
        secs = total_sec % 60
        return f'{mins}:{secs:02d}'
    except:
        return '--:--'

@app.route('/api/parse', methods=['POST'])
def parse():
    """Parse a Douyin URL and return structured data"""
    data = request.get_json()
    url = data.get('url', '').strip()
    
    if not url:
        return jsonify({'success': False, 'message': '请提供抖音链接'})
    
    if 'douyin' not in url.lower():
        return jsonify({'success': False, 'message': '请输入有效的抖音链接'})
    
    # Check cache
    video_id = extract_video_id(url)
    if video_id in cache:
        return jsonify(cache[video_id])
    
    # Parse
    result = parse_douyin_realtime(url)
    
    # Cache
    cache[video_id] = result
    
    return jsonify(result)

if __name__ == '__main__':
    print("=" * 50)
    print("Smart Second Brain - Douyin Parser Backend")
    print("Running on http://localhost:5001")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5001, debug=False)
