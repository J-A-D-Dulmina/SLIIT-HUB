import os
import logging
from scenedetect import detect, ContentDetector, AdaptiveDetector, ThresholdDetector
from scenedetect.scene_manager import save_images
from scenedetect.stats_manager import StatsManager
from scenedetect.detectors import ContentDetector
from scenedetect.scene_manager import SceneManager
from scenedetect.frame_timecode import FrameTimecode
from scenedetect.video_splitter import split_video_ffmpeg

logger = logging.getLogger(__name__)

class SceneDetector:
    def __init__(self):
        self.supported_formats = {'mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'}
    
    def detect_scenes(self, video_path, threshold=27.0, min_scene_length=1.0):
        """
        Detect scenes in a video using PySceneDetect
        
        Args:
            video_path (str): Path to the video file
            threshold (float): Content detection threshold (default: 27.0)
            min_scene_length (float): Minimum scene length in seconds (default: 1.0)
        
        Returns:
            list: List of scene timestamps in format [{"time_start": "00:00", "description": "Scene 1"}, ...]
        """
        try:
            logger.info(f"Detecting scenes in video: {video_path}")
            
            # Use the modern detect function
            scene_list = detect(video_path, ContentDetector(threshold=threshold))
            
            # Convert to timestamp format
            timestamps = []
            for i, scene in enumerate(scene_list):
                start_time = scene[0].get_seconds()
                end_time = scene[1].get_seconds()
                
                # Skip scenes that are too short
                if (end_time - start_time) < min_scene_length:
                    continue
                
                # Convert seconds to MM:SS format
                start_timestamp = self._seconds_to_timestamp(start_time)
                
                # Create description based on scene number and duration
                duration = end_time - start_time
                description = f"Scene {i+1} ({duration:.1f}s)"
                
                timestamps.append({
                    "time_start": start_timestamp,
                    "description": description,
                    "start_time": start_time,
                    "end_time": end_time,
                    "duration": duration
                })
            
            logger.info(f"Detected {len(timestamps)} scenes")
            return timestamps
            
        except Exception as e:
            logger.error(f"Error detecting scenes: {str(e)}")
            raise
    
    def detect_scenes_adaptive(self, video_path, min_scene_length=1.0):
        """
        Detect scenes using adaptive threshold detection
        """
        try:
            logger.info(f"Detecting scenes with adaptive threshold: {video_path}")
            
            # Use the modern detect function with AdaptiveDetector
            scene_list = detect(video_path, AdaptiveDetector())
            
            timestamps = []
            for i, scene in enumerate(scene_list):
                start_time = scene[0].get_seconds()
                end_time = scene[1].get_seconds()
                
                if (end_time - start_time) < min_scene_length:
                    continue
                
                start_timestamp = self._seconds_to_timestamp(start_time)
                duration = end_time - start_time
                description = f"Scene {i+1} ({duration:.1f}s)"
                
                timestamps.append({
                    "time_start": start_timestamp,
                    "description": description,
                    "start_time": start_time,
                    "end_time": end_time,
                    "duration": duration
                })
            
            logger.info(f"Detected {len(timestamps)} scenes with adaptive threshold")
            return timestamps
            
        except Exception as e:
            logger.error(f"Error detecting scenes with adaptive threshold: {str(e)}")
            raise
    
    def detect_scenes_threshold(self, video_path, threshold=12, min_scene_length=1.0):
        """
        Detect scenes using threshold-based detection
        """
        try:
            logger.info(f"Detecting scenes with threshold {threshold}: {video_path}")
            
            # Use the modern detect function with ThresholdDetector
            scene_list = detect(video_path, ThresholdDetector(threshold=threshold))
            
            timestamps = []
            for i, scene in enumerate(scene_list):
                start_time = scene[0].get_seconds()
                end_time = scene[1].get_seconds()
                
                if (end_time - start_time) < min_scene_length:
                    continue
                
                start_timestamp = self._seconds_to_timestamp(start_time)
                duration = end_time - start_time
                description = f"Scene {i+1} ({duration:.1f}s)"
                
                timestamps.append({
                    "time_start": start_timestamp,
                    "description": description,
                    "start_time": start_time,
                    "end_time": end_time,
                    "duration": duration
                })
            
            logger.info(f"Detected {len(timestamps)} scenes with threshold detection")
            return timestamps
            
        except Exception as e:
            logger.error(f"Error detecting scenes with threshold: {str(e)}")
            raise
    
    def _seconds_to_timestamp(self, seconds):
        """Convert seconds to MM:SS format"""
        minutes = int(seconds // 60)
        remaining_seconds = int(seconds % 60)
        return f"{minutes:02d}:{remaining_seconds:02d}"
    
    def get_video_info(self, video_path):
        """Get basic video information using ffprobe"""
        try:
            import subprocess
            import json
            
            # Use ffprobe to get video information
            cmd = [
                'ffprobe', 
                '-v', 'quiet', 
                '-print_format', 'json', 
                '-show_format', 
                '-show_streams', 
                video_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"ffprobe failed: {result.stderr}")
            
            data = json.loads(result.stdout)
            
            # Extract duration and fps
            duration = float(data['format']['duration'])
            
            # Find video stream and get fps
            fps = 30.0  # default
            for stream in data['streams']:
                if stream['codec_type'] == 'video':
                    if 'r_frame_rate' in stream:
                        fps_parts = stream['r_frame_rate'].split('/')
                        if len(fps_parts) == 2:
                            fps = float(fps_parts[0]) / float(fps_parts[1])
                    break
            
            return {
                "duration": duration,
                "fps": fps,
                "duration_formatted": self._seconds_to_timestamp(duration)
            }
            
        except Exception as e:
            logger.error(f"Error getting video info: {str(e)}")
            # Return default values if video info cannot be retrieved
            return {
                "duration": 0,
                "fps": 30.0,
                "duration_formatted": "00:00"
            }
    
    def combine_with_gpt_timestamps(self, scene_timestamps, gpt_timestamps, video_title=""):
        """
        Combine scene detection timestamps with GPT-generated descriptions
        """
        try:
            combined_timestamps = []
            
            # If we have GPT timestamps, use them as base and add scene info
            if gpt_timestamps:
                for gpt_ts in gpt_timestamps:
                    # Find the closest scene timestamp
                    closest_scene = self._find_closest_scene(gpt_ts, scene_timestamps)
                    
                    if closest_scene:
                        combined_timestamps.append({
                            "time_start": gpt_ts["time_start"] if "time_start" in gpt_ts else gpt_ts["time"],
                            "description": gpt_ts["description"],
                            "scene_info": f"Scene {closest_scene['scene_number']}",
                            "duration": closest_scene["duration"]
                        })
                    else:
                        combined_timestamps.append({
                            "time_start": gpt_ts["time_start"] if "time_start" in gpt_ts else gpt_ts["time"],
                            "description": gpt_ts["description"]
                        })
            
            # If no GPT timestamps, use scene timestamps with generic descriptions
            else:
                for i, scene_ts in enumerate(scene_timestamps):
                    combined_timestamps.append({
                        "time_start": scene_ts["time_start"] if "time_start" in scene_ts else scene_ts["time"],
                        "description": f"Scene {i+1} - {video_title}",
                        "scene_info": f"Scene {i+1}",
                        "duration": scene_ts["duration"]
                    })
            
            return combined_timestamps
            
        except Exception as e:
            logger.error(f"Error combining timestamps: {str(e)}")
            raise
    
    def _find_closest_scene(self, gpt_timestamp, scene_timestamps):
        """Find the closest scene timestamp to a GPT timestamp"""
        try:
            gpt_time = self._timestamp_to_seconds(gpt_timestamp["time_start"])
            closest_scene = None
            min_distance = float('inf')
            
            for i, scene_ts in enumerate(scene_timestamps):
                scene_time = scene_ts["start_time"]
                distance = abs(gpt_time - scene_time)
                
                if distance < min_distance:
                    min_distance = distance
                    closest_scene = {
                        "scene_number": i + 1,
                        "duration": scene_ts["duration"],
                        "distance": distance
                    }
            
            # Only return if the distance is reasonable (within 30 seconds)
            if closest_scene and closest_scene["distance"] <= 30:
                return closest_scene
            
            return None
            
        except Exception as e:
            logger.error(f"Error finding closest scene: {str(e)}")
            return None
    
    def _timestamp_to_seconds(self, timestamp):
        """Convert MM:SS format to seconds"""
        try:
            parts = timestamp.split(':')
            if len(parts) == 2:
                minutes = int(parts[0])
                seconds = int(parts[1])
                return minutes * 60 + seconds
            return 0
        except:
            return 0 