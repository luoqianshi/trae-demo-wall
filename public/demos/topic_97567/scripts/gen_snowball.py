#!/usr/bin/env python3
"""Generate snowball stage images using Seedream API via urllib"""
import urllib.request
import urllib.error
import json
import base64
import os
import sys

API_BASE = "https://ark.cn-beijing.volces.com/api/v3"
MODEL = "doubao-seedream-5-0-260128"

def get_api_key():
    key = os.getenv("ARK_API_KEY") or os.getenv("MODEL_IMAGE_API_KEY") or os.getenv("MODEL_AGENT_API_KEY")
    if not key:
        print("ERROR: No API key found. Set ARK_API_KEY or MODEL_IMAGE_API_KEY or MODEL_AGENT_API_KEY")
        sys.exit(1)
    return key

def image_to_base64_url(image_path):
    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    return f"data:image/webp;base64,{b64}"

def generate_image(prompt, ref_image_path=None, output_path="output.png"):
    api_key = get_api_key()
    url = f"{API_BASE}/images/generations"

    body = {
        "model": MODEL,
        "prompt": prompt,
        "size": "1024x1024",
        "response_format": "url",
        "watermark": False,
        "output_format": "png"
    }

    if ref_image_path and os.path.exists(ref_image_path):
        body["image"] = image_to_base64_url(ref_image_path)
        print(f"Using reference image: {ref_image_path}")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")

    print(f"Calling Seedream API: {MODEL}")
    print(f"Prompt: {prompt[:100]}...")

    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP Error {e.code}: {err_body}")
        return None

    if "error" in result:
        print(f"API Error: {result['error']}")
        return None

    data_list = result.get("data", [])
    if not data_list:
        print("No images returned")
        return None

    image_data = data_list[0]
    image_url = image_data.get("url")

    if not image_url:
        b64 = image_data.get("b64_json")
        if b64:
            with open(output_path, "wb") as f:
                f.write(base64.b64decode(b64))
            print(f"Saved (b64): {output_path}")
            return output_path
        else:
            print("No image URL or base64 in response")
            return None

    print(f"Image URL: {image_url}")

    urllib.request.urlretrieve(image_url, output_path)
    print(f"Saved: {output_path}")
    return output_path

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--prompt", "-p", required=True)
    parser.add_argument("--ref-image", "-i", default=None)
    parser.add_argument("--output", "-o", required=True)
    args = parser.parse_args()

    generate_image(args.prompt, args.ref_image, args.output)
