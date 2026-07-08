import requests
import re
import json
import time

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

def extract_note_id(url):
    patterns = [
        r'xiaohongshu\.com/explore/(\d+)',
        r'xiaohongshu\.com/notes/(\d+)',
        r'xiaohongshu\.com/discovery/item/(\d+)',
        r'noteId=(\d+)',
        r'xhslink\.com/[^/]+/([\w-]+)',
        r'share\.xiaohongshu\.com/s/([\w-]+)',
        r'(\d{10,20})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def parse_xhs_url(url):
    note_id = extract_note_id(url)
    if not note_id:
        return {"success": False, "error": "无法从链接中提取笔记ID"}
    
    try:
        api_url = f"https://www.xiaohongshu.com/api/sns/web/v1/feed/detail?note_id={note_id}"
        
        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
            "Referer": url,
            "X-Requested-With": "XMLHttpRequest"
        }
        
        response = requests.get(api_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('code') != 0:
            return {"success": False, "error": f"API错误: {data.get('msg', '未知错误')}"}
        
        note = data.get('data', {}).get('note', {})
        
        title = note.get('title', '')
        desc = note.get('desc', '')
        
        images = []
        image_list = note.get('image_list', [])
        for img in image_list:
            url = img.get('url', '')
            if url:
                images.append(url)
        
        user = note.get('user', {})
        username = user.get('nickname', '')
        avatar = user.get('avatar', '')
        
        return {
            "success": True,
            "note_id": note_id,
            "title": title,
            "desc": desc,
            "images": images,
            "user": {
                "username": username,
                "avatar": avatar
            },
            "source": "xhs_api"
        }
        
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"网络请求失败: {str(e)}"}
    except json.JSONDecodeError:
        return {"success": False, "error": "解析JSON失败"}
    except Exception as e:
        return {"success": False, "error": f"解析失败: {str(e)}"}

def parse_xhs_html(url):
    note_id = extract_note_id(url)
    if not note_id:
        return {"success": False, "error": "无法从链接中提取笔记ID"}
    
    try:
        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        html = response.text
        
        title_match = re.search(r'<title>(.*?)</title>', html)
        title = title_match.group(1).strip() if title_match else ''
        
        desc_match = re.search(r'<meta name="description" content="(.*?)"', html)
        desc = desc_match.group(1).strip() if desc_match else ''
        
        image_matches = re.findall(r'https?://sns-img-hw\.xiaohongshu\.com/[^"\s]+', html)
        images = list(set(image_matches))[:20]
        
        data_note_match = re.search(r'window.__INITIAL_STATE__\s*=\s*(.*?);', html, re.DOTALL)
        if data_note_match:
            try:
                state = json.loads(data_note_match.group(1))
                note_data = state.get('note', {}).get('detailMap', {}).get(note_id, {})
                if note_data:
                    title = note_data.get('title', title)
                    desc = note_data.get('desc', desc)
                    image_list = note_data.get('imageList', [])
                    images = [img.get('url', '') for img in image_list if img.get('url')]
            except:
                pass
        
        if not desc:
            desc_match = re.search(r'<div class="note-desc">(.*?)</div>', html, re.DOTALL)
            if desc_match:
                desc = re.sub(r'<[^>]+>', '', desc_match.group(1)).strip()
        
        return {
            "success": True,
            "note_id": note_id,
            "title": title,
            "desc": desc,
            "images": images,
            "source": "xhs_html"
        }
        
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"网络请求失败: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"解析失败: {str(e)}"}

def parse_xhs(url):
    result = parse_xhs_url(url)
    if result["success"]:
        return result
    
    time.sleep(1)
    
    result = parse_xhs_html(url)
    return result

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python xhs_parser.py <url>")
        sys.exit(1)
    
    url = sys.argv[1]
    result = parse_xhs(url)
    print(json.dumps(result, ensure_ascii=False, indent=2))
