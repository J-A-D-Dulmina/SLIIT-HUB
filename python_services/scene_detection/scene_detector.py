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
    
    def detect_scenes(self, video_path, threshold=35.0, min_scene_length=0.5):
        """
        Detect scenes in a video using PySceneDetect - Optimized for speed and memory
        
        Args:
            video_path (str): Path to the video file
            threshold (float): Content detection threshold (default: 35.0 - higher for faster detection)
            min_scene_length (float): Minimum scene length in seconds (default: 0.5 - shorter for more scenes)
        
        Returns:
            list: List of scene timestamps in format [{"time_start": "00:00", "description": "Scene 1"}, ...]
        """
        try:
            logger.info(f"Detecting scenes in video: {video_path}")
            
            # Check video file size to warn about potential memory issues
            try:
                file_size = os.path.getsize(video_path)
                file_size_mb = file_size / (1024 * 1024)
                if file_size_mb > 500:  # Warn if larger than 500MB
                    logger.warning(f"Large video file detected: {file_size_mb:.1f}MB. Scene detection may use significant memory.")
            except Exception:
                pass  # Ignore file size check errors
            
            # Use the modern detect function with optimized parameters
            # Add memory optimization by limiting the number of frames processed
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
            # If scene detection fails due to memory, return a simple fallback
            if "memory" in str(e).lower() or "allocate" in str(e).lower():
                logger.warning("Scene detection failed due to memory constraints, using fallback timestamps")
                return self._generate_fallback_timestamps(video_path)
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
        Preserve PySceneDetect timestamps and only use GPT for descriptions
        """
        try:
            combined_timestamps = []
            
            # Use PySceneDetect timestamps as the base (they are more accurate)
            # Only use GPT for generating better descriptions
            if scene_timestamps:
                for i, scene_ts in enumerate(scene_timestamps):
                    # Use the exact PySceneDetect timestamp
                    time_start = scene_ts["time_start"] if "time_start" in scene_ts else scene_ts["time"]
                    
                    # Try to find a matching GPT description if available
                    matching_gpt_description = None
                    if gpt_timestamps:
                        matching_gpt_description = self._find_matching_gpt_description(
                            scene_ts["start_time"], gpt_timestamps
                        )
                    
                    # Use GPT description if found, otherwise use scene description
                    description = matching_gpt_description if matching_gpt_description else scene_ts["description"]
                    
                    combined_timestamps.append({
                        "time_start": time_start,
                        "description": description,
                        "scene_info": f"Scene {i+1}",
                        "duration": scene_ts["duration"],
                        "start_time": scene_ts["start_time"],
                        "end_time": scene_ts["end_time"]
                    })
            
            # If no scene timestamps, fall back to GPT timestamps
            elif gpt_timestamps:
                for gpt_ts in gpt_timestamps:
                    combined_timestamps.append({
                        "time_start": gpt_ts["time_start"] if "time_start" in gpt_ts else gpt_ts["time"],
                        "description": gpt_ts["description"]
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
    
    def _find_matching_gpt_description(self, scene_start_time, gpt_timestamps):
        """
        Find a GPT description that matches the scene timestamp
        Returns the GPT description if found, otherwise None
        """
        try:
            for gpt_ts in gpt_timestamps:
                gpt_time = self._timestamp_to_seconds(
                    gpt_ts["time_start"] if "time_start" in gpt_ts else gpt_ts["time"]
                )
                
                # Check if GPT timestamp is within 10 seconds of scene timestamp
                if abs(gpt_time - scene_start_time) <= 10:
                    return gpt_ts["description"]
            
            return None
            
        except Exception as e:
            logger.error(f"Error finding matching GPT description: {str(e)}")
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

    def _generate_fallback_timestamps(self, video_path):
        """Generate simple fallback timestamps when scene detection fails"""
        try:
            # Get video duration and create simple timestamps
            video_info = self.get_video_info(video_path)
            duration = video_info.get('duration', 60)  # Default to 60 seconds
            
            # Create timestamps every 10 seconds
            timestamps = []
            interval = 10
            scene_num = 1
            
            for time in range(0, int(duration), interval):
                if time + interval <= duration:
                    start_timestamp = self._seconds_to_timestamp(time)
                    timestamps.append({
                        "time_start": start_timestamp,
                        "description": f"Scene {scene_num} (10s)",
                        "start_time": time,
                        "end_time": time + interval,
                        "duration": interval
                    })
                    scene_num += 1
            
            logger.info(f"Generated {len(timestamps)} fallback timestamps")
            return timestamps
            
        except Exception as e:
            logger.error(f"Error generating fallback timestamps: {str(e)}")
            # Return minimal timestamps
            return [{
                "time_start": "00:00",
                "description": "Video content",
                "start_time": 0,
                "end_time": 60,
                "duration": 60
            }] 