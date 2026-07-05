import os
import shutil
from typing import Dict, Optional
from app.utils.ffmpeg_wrapper import analyze_video, is_h264_codec, transcode_to_h264, repair_video
from app.utils.file_utils import generate_file_id, get_file_extension, get_timestamp


class VideoTranscoder:
    def __init__(self, upload_dir: str, output_dir: str):
        self.upload_dir = upload_dir
        self.output_dir = output_dir
    
    def analyze(self, file_path: str) -> Dict:
        metadata = analyze_video(file_path)
        
        if "error" in metadata:
            return {
                "success": False,
                "error": metadata["error"],
                "metadata": {}
            }
        
        strategy = self._determine_strategy(metadata)
        
        return {
            "success": True,
            "metadata": metadata,
            "strategy": strategy
        }
    
    def _determine_strategy(self, metadata: Dict) -> str:
        video_codec = metadata.get("video_codec", "").lower()
        
        if is_h264_codec(video_codec):
            return "copy"
        else:
            return "transcode"
    
    def transcode(self, input_path: str, output_filename: Optional[str] = None) -> Dict:
        file_id = generate_file_id()
        timestamp = get_timestamp()
        
        if output_filename:
            name_without_ext = os.path.splitext(output_filename)[0]
            output_path = os.path.join(self.output_dir, f"{name_without_ext}_{timestamp}.mp4")
        else:
            output_path = os.path.join(self.output_dir, f"output_{file_id}_{timestamp}.mp4")
        
        metadata = analyze_video(input_path)
        
        if "error" in metadata:
            return {
                "success": False,
                "error": "Failed to analyze video",
                "output_path": ""
            }
        
        strategy = self._determine_strategy(metadata)
        
        if strategy == "copy":
            try:
                shutil.copy2(input_path, output_path)
                return {
                    "success": True,
                    "output_path": output_path,
                    "strategy": "copy",
                    "message": "Video already in H.264 format, copied directly"
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e),
                    "output_path": ""
                }
        else:
            result = transcode_to_h264(input_path, output_path)
            
            if result["success"]:
                return {
                    "success": True,
                    "output_path": result["output_path"],
                    "strategy": "transcode",
                    "message": "Successfully transcoded to H.264 format"
                }
            else:
                repair_result = repair_video(input_path, output_path)
                if repair_result["success"]:
                    return {
                        "success": True,
                        "output_path": repair_result["output_path"],
                        "strategy": "repair",
                        "message": "Repaired and transcoded to H.264 format"
                    }
                else:
                    return {
                        "success": False,
                        "error": "Failed to transcode video",
                        "output_path": ""
                    }
    
    def batch_transcode(self, input_files: list) -> Dict:
        results = []
        
        for input_file in input_files:
            if not os.path.exists(input_file):
                results.append({
                    "input": input_file,
                    "success": False,
                    "error": "File not found"
                })
                continue
            
            result = self.transcode(input_file)
            results.append({
                "input": input_file,
                "success": result["success"],
                "output_path": result.get("output_path", ""),
                "strategy": result.get("strategy", ""),
                "error": result.get("error", "")
            })
        
        total = len(results)
        success_count = sum(1 for r in results if r["success"])
        
        return {
            "total": total,
            "success": success_count,
            "failed": total - success_count,
            "results": results
        }
    
    def get_video_info(self, file_path: str) -> Dict:
        metadata = analyze_video(file_path)
        
        if "error" in metadata:
            return {
                "success": False,
                "error": metadata["error"]
            }
        
        duration = metadata.get("duration", 0)
        minutes = int(duration // 60)
        seconds = int(duration % 60)
        
        return {
            "success": True,
            "filename": os.path.basename(file_path),
            "video_codec": metadata.get("video_codec", ""),
            "audio_codec": metadata.get("audio_codec", ""),
            "resolution": metadata.get("resolution", ""),
            "width": metadata.get("width", 0),
            "height": metadata.get("height", 0),
            "frame_rate": round(metadata.get("frame_rate", 0), 2),
            "duration": f"{minutes}:{seconds:02d}",
            "duration_seconds": round(duration, 2),
            "bit_rate": metadata.get("bit_rate", 0)
        }