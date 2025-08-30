from dotenv import load_dotenv
load_dotenv()

import os
# Now you can safely get environment variables
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable is required")

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
import tempfile
import subprocess
import json
import time
import gc
from datetime import datetime
from common.video_processor import VideoProcessor
from gpt.gpt_service import GPTService
from scene_detection.scene_detector import SceneDetector
from typing import Any, Dict
import whisper
import traceback
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Initialize services
video_processor = VideoProcessor()
gpt_service = GPTService()
scene_detector = SceneDetector()

# Server configuration
NODE_SERVER_URL = "http://localhost:5000"

def get_video_from_database(video_id):
    """Fetch video information from the Node.js server"""
    try:
        # Try to get video from Node.js server
        response = requests.get(f"{NODE_SERVER_URL}/api/tutoring/videos/{video_id}", 
                              headers={'Content-Type': 'application/json'})
        
        if response.status_code == 200:
            return response.json().get('video')
        elif response.status_code == 401 or response.status_code == 403:
            # Authentication failed, try to find video file directly
            logger.warning(f"Authentication failed for video {video_id}, trying direct file access")
            return get_video_directly(video_id)
        else:
            logger.error(f"Failed to fetch video {video_id}: {response.status_code}")
            return get_video_directly(video_id)
    except Exception as e:
        logger.error(f"Error fetching video from database: {str(e)}")
        return get_video_directly(video_id)

def get_video_directly(video_id):
    """Try to find video file directly in the uploads directory"""
    try:
        # Look for video files in the server uploads directory
        uploads_dir = os.path.join(os.path.dirname(__file__), '..', 'server', 'uploads', 'videos')
        
        if not os.path.exists(uploads_dir):
            logger.error(f"Uploads directory not found: {uploads_dir}")
            return None
        
        # List all video files
        video_files = [f for f in os.listdir(uploads_dir) if f.endswith(('.mp4', '.avi', '.mov', '.mkv'))]
        
        if not video_files:
            logger.error("No video files found in uploads directory")
            return None
        
        # If only one video file exists, use it
        if len(video_files) == 1:
            video_file = video_files[0]
            video_path = os.path.join(uploads_dir, video_file)
            logger.info(f"Using single video file: {video_file}")
            return {
                'videoFile': f'uploads/videos/{video_file}',
                'title': f'Video {video_id}',
                'id': video_id
            }
        
        # Try to find a file that might match the video ID
        for video_file in video_files:
            # Check if video ID is in filename or if filename contains 'videoFile'
            if (video_id in video_file or 
                'videoFile' in video_file or 
                video_file.startswith(video_id) or
                video_file.endswith(f'{video_id}.mp4')):
                video_path = os.path.join(uploads_dir, video_file)
                logger.info(f"Found matching video file: {video_file}")
                return {
                    'videoFile': f'uploads/videos/{video_file}',
                    'title': f'Video {video_id}',
                    'id': video_id
                }
        
        # If no match found, log error and return None instead of using wrong file
        logger.error(f"NO MATCHING VIDEO FILE FOUND for video ID: {video_id}")
        logger.error(f"Available files: {video_files}")
        logger.error("This indicates a video file naming or storage issue")
        logger.error("Expected filename format: {video_id}.mp4")
        return None
        
    except Exception as e:
        logger.error(f"Error getting video directly: {str(e)}")
        return None

def get_video_file_path(video_data):
    """Get the full path to the video file"""
    if not video_data or not video_data.get('videoFile'):
        logger.error("No video data or videoFile found")
        return None
    
    video_file = video_data['videoFile']
    
    # Try multiple possible paths
    possible_paths = [
        # Path relative to Python service
        os.path.join(os.path.dirname(__file__), '..', 'server', video_file),
        # Path relative to server root
        os.path.join(os.path.dirname(__file__), '..', 'server', 'uploads', 'videos', os.path.basename(video_file)),
        # Absolute path if video_file is already absolute
        video_file if os.path.isabs(video_file) else None,
        # Path in current directory
        os.path.join(os.getcwd(), video_file)
    ]
    
    for path in possible_paths:
        if path and os.path.exists(path):
            logger.info(f"Found video file at: {path}")
            return path
    
    # If no file found, try to find any video file in uploads directory
    uploads_dir = os.path.join(os.path.dirname(__file__), '..', 'server', 'uploads', 'videos')
    if os.path.exists(uploads_dir):
        video_files = [f for f in os.listdir(uploads_dir) if f.endswith(('.mp4', '.avi', '.mov', '.mkv'))]
        if video_files:
            fallback_path = os.path.join(uploads_dir, video_files[0])
            logger.warning(f"Using fallback video file: {fallback_path}")
            return fallback_path
    
    logger.error(f"Video file not found for: {video_file}")
    logger.error(f"Tried paths: {possible_paths}")
    return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "AI Video Processing"})

@app.route('/transcribe', methods=['POST'])
def transcribe_video():
    """Transcribe video audio using Whisper"""
    video_path = None
    audio_path = None
    
    try:
        # Check if video file is present
        if 'video' not in request.files:
            return jsonify({"error": "No video file provided"}), 400
        
        video_file = request.files['video']
        if video_file.filename == '':
            return jsonify({"error": "No video file selected"}), 400
        
        if not video_processor.allowed_file(video_file.filename):
            return jsonify({"error": "Invalid file type"}), 400
        
        # Save video file temporarily
        video_path = video_processor.save_video_file(video_file, app.config['UPLOAD_FOLDER'])
        
        try:
            # Get video information
            video_info = scene_detector.get_video_info(video_path)
            
            # Extract audio from video
            logger.info("Extracting audio from video...")
            audio_path = video_processor.extract_audio_from_video(video_path)
            
            # Transcribe audio
            logger.info("Transcribing audio with Whisper...")
            model = whisper.load_model('base')
            transcript_result = model.transcribe(audio_path)
            transcript = transcript_result["text"]
            
            return jsonify({
                "transcript": transcript,
                "duration": video_info.get('duration', 0),
                "duration_formatted": video_info.get('duration_formatted', '00:00'),
                "fps": video_info.get('fps', 30.0)
            })
            
        except Exception as e:
            logger.error("Error transcribing video:\n" + traceback.format_exc())
            return jsonify({"error": str(e)}), 500
            
    except Exception as e:
        logger.error("Error transcribing video:\n" + traceback.format_exc())
        return jsonify({"error": str(e)}), 500
    
    finally:
        # Clean up files
        video_processor.cleanup_files(video_path, audio_path)

@app.route('/generate-description', methods=['POST'])
def generate_description():
    """Generate short description for video"""
    video_path = None
    audio_path = None
    
    try:
        # Check if video file is present
        if 'video' not in request.files:
            return jsonify({"error": "No video file provided"}), 400
        
        video_file = request.files['video']
        if video_file.filename == '':
            return jsonify({"error": "No video file selected"}), 400
        
        if not video_processor.allowed_file(video_file.filename):
            return jsonify({"error": "Invalid file type"}), 400
        
        # Get parameters
        video_title = request.form.get('title', '')
        
        # Save video file temporarily
        video_path = video_processor.save_video_file(video_file, app.config['UPLOAD_FOLDER'])
        
        try:
            # Get video information
            video_info = scene_detector.get_video_info(video_path)
            
            # Extract audio from video
            logger.info("Extracting audio from video...")
            audio_path = video_processor.extract_audio_from_video(video_path)
            
            # Transcribe audio
            logger.info("Transcribing audio with Whisper...")
            model = whisper.load_model('base')
            transcript_result = model.transcribe(audio_path)
            transcript = transcript_result["text"]
            
            # Generate description
            logger.info("Generating description with GPT...")
            description = gpt_service.generate_description(transcript, video_title)
            
            return jsonify({
                "description": description,
                "transcript": transcript,
                "duration": video_info.get('duration', 0),
                "duration_formatted": video_info.get('duration_formatted', '00:00'),
                "fps": video_info.get('fps', 30.0)
            })
            
        except Exception as e:
            logger.error("Error generating description:\n" + traceback.format_exc())
            return jsonify({"error": str(e)}), 500
            
    except Exception as e:
        logger.error("Error generating description:\n" + traceback.format_exc())
        return jsonify({"error": str(e)}), 500
    
    finally:
        # Clean up files
        video_processor.cleanup_files(video_path, audio_path)

@app.route('/process-video', methods=['POST'])
def process_video():
    """Process video file and generate AI content"""
    video_path = None
    audio_path = None
    
    try:
        # Check if video file is present
        if 'video' not in request.files:
            return jsonify({"error": "No video file provided"}), 400
        
        video_file = request.files['video']
        if video_file.filename == '':
            return jsonify({"error": "No video file selected"}), 400
        
        if not video_processor.allowed_file(video_file.filename):
            return jsonify({"error": "Invalid file type"}), 400
        
        # Get additional parameters
        video_title = request.form.get('title', '')
        process_type = request.form.get('type', 'summary')  # summary, timestamps, scenes, description, or all
        scene_method = request.form.get('scene_method', 'content')  # content, adaptive, threshold
        
        # Save video file temporarily
        video_path = video_processor.save_video_file(video_file, app.config['UPLOAD_FOLDER'])
        
        try:
            result: Dict[str, Any] = {
                "transcript": None,
                "summary": None,
                "description": None,
                "timestamps": None,
                "scenes": None,
                "video_info": None
            }
            
            # Get video information
            logger.info("Getting video information...")
            result["video_info"] = scene_detector.get_video_info(video_path)
            
            # Extract audio and transcribe if needed for summary/description
            if process_type in ['summary', 'description', 'all']:
                logger.info("Extracting audio from video...")
                audio_path = video_processor.extract_audio_from_video(video_path)
                
                logger.info("Transcribing audio with Whisper...")
                model = whisper.load_model('base')
                transcript_result = model.transcribe(audio_path)
                result["transcript"] = transcript_result["text"]
                
                # Generate summary if requested
                if process_type in ['summary', 'all']:
                    logger.info("Generating summary with GPT...")
                    result["summary"] = gpt_service.generate_summary(result["transcript"], video_title)
                
                # Generate description if requested
                if process_type in ['description', 'all']:
                    logger.info("Generating description with GPT...")
                    result["description"] = gpt_service.generate_description(result["transcript"], video_title)
            
            # Detect scenes for timestamps
            if process_type in ['timestamps', 'scenes', 'all']:
                logger.info("Detecting scenes with PySceneDetect...")
                min_scene_length = 1.0
                if scene_method == 'adaptive':
                    result["scenes"] = scene_detector.detect_scenes_adaptive(video_path, min_scene_length=min_scene_length)
                elif scene_method == 'threshold':
                    threshold = int(float(request.form.get('threshold', 12)))
                    result["scenes"] = scene_detector.detect_scenes_threshold(video_path, threshold=threshold, min_scene_length=min_scene_length)
                else:  # content detection (default)
                    threshold = float(request.form.get('threshold', 27.0))
                    result["scenes"] = scene_detector.detect_scenes(video_path, threshold=threshold, min_scene_length=min_scene_length)
            
            # Generate GPT timestamps if requested
            gpt_timestamps = None
            if process_type in ['timestamps', 'all'] and result["transcript"]:
                logger.info("Generating timestamps with GPT...")
                gpt_timestamps = gpt_service.generate_timestamps(result["transcript"], video_title)
            
            # Combine scene detection with GPT timestamps
            if result["scenes"] and gpt_timestamps:
                logger.info("Combining scene detection with GPT timestamps...")
                result["timestamps"] = scene_detector.combine_with_gpt_timestamps(
                    result["scenes"], gpt_timestamps, video_title
                )
            elif result["scenes"]:
                # Use only scene detection timestamps
                result["timestamps"] = [
                    {
                        "time": scene["time"],
                        "description": scene["description"]
                    }
                    for scene in result["scenes"]
                ]
            elif gpt_timestamps:
                # Use only GPT timestamps
                result["timestamps"] = gpt_timestamps
            
            # After all timestamp generation logic, ensure all timestamps use 'time_start'
            if result["timestamps"]:
                for ts in result["timestamps"]:
                    if 'time' in ts and 'time_start' not in ts:
                        ts['time_start'] = ts.pop('time')
            
            return jsonify(result)
            
        except Exception as e:
            logger.error("Error processing video:\n" + traceback.format_exc())
            return jsonify({"error": str(e)}), 500
            
    except Exception as e:
        logger.error("Error processing video:\n" + traceback.format_exc())
        return jsonify({"error": str(e)}), 500
    
    finally:
        # Clean up files
        video_processor.cleanup_files(video_path, audio_path)

@app.route('/detect-scenes', methods=['POST'])
def detect_scenes():
    """Detect scenes in video using PySceneDetect"""
    video_path = None
    
    try:
        if 'video' not in request.files:
            return jsonify({"error": "No video file provided"}), 400
        
        video_file = request.files['video']
        if video_file.filename == '':
            return jsonify({"error": "No video file selected"}), 400
        
        if not video_processor.allowed_file(video_file.filename):
            return jsonify({"error": "Invalid file type"}), 400
        
        # Get parameters
        scene_method = request.form.get('method', 'content')
        threshold = int(float(request.form.get('threshold', 27.0)))
        min_scene_length = float(request.form.get('min_scene_length', 1.0))
        
        # Save video file temporarily
        video_path = video_processor.save_video_file(video_file, app.config['UPLOAD_FOLDER'])
        
        try:
            # Get video information
            video_info = scene_detector.get_video_info(video_path)
            
            # Detect scenes based on method
            if scene_method == 'adaptive':
                scenes = scene_detector.detect_scenes_adaptive(video_path, min_scene_length)
            elif scene_method == 'threshold':
                scenes = scene_detector.detect_scenes_threshold(video_path, threshold, min_scene_length)
            else:  # content detection
                scenes = scene_detector.detect_scenes(video_path, threshold, min_scene_length)
            
            return jsonify({
                "scenes": scenes,
                "video_info": video_info,
                "method": scene_method,
                "threshold": threshold,
                "min_scene_length": min_scene_length
            })
            
        except Exception as e:
            logger.error("Error detecting scenes:\n" + traceback.format_exc())
            return jsonify({"error": str(e)}), 500
            
    except Exception as e:
        logger.error("Error detecting scenes:\n" + traceback.format_exc())
        return jsonify({"error": str(e)}), 500
    
    finally:
        # Clean up video file
        video_processor.cleanup_files(video_path)

@app.route('/generate-summary', methods=['POST'])
def generate_summary():
    """Generate summary from existing transcript"""
    try:
        data = request.get_json()
        transcript = data.get('transcript', '')
        video_title = data.get('title', '')
        
        if not transcript:
            return jsonify({"error": "No transcript provided"}), 400
        
        summary = gpt_service.generate_summary(transcript, video_title)
        
        return jsonify({"summary": summary})
        
    except Exception as e:
        logger.error("Error generating summary:\n" + traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/generate-timestamps', methods=['POST'])
def generate_timestamps():
    """Generate timestamps from existing transcript"""
    try:
        data = request.get_json()
        transcript = data.get('transcript', '')
        video_title = data.get('title', '')
        
        if not transcript:
            return jsonify({"error": "No transcript provided"}), 400
        
        timestamps = gpt_service.generate_timestamps(transcript, video_title)
        
        return jsonify({"timestamps": timestamps})
        
    except Exception as e:
        logger.error("Error generating timestamps:\n" + traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/combine-timestamps', methods=['POST'])
def combine_timestamps():
    """Combine scene detection with GPT timestamps"""
    try:
        data = request.get_json()
        scene_timestamps = data.get('scenes', [])
        gpt_timestamps = data.get('gpt_timestamps', [])
        video_title = data.get('title', '')
        
        if not scene_timestamps and not gpt_timestamps:
            return jsonify({"error": "No timestamps provided"}), 400
        
        combined_timestamps = scene_detector.combine_with_gpt_timestamps(
            scene_timestamps, gpt_timestamps, video_title
        )
        
        return jsonify({"timestamps": combined_timestamps})
        
    except Exception as e:
        logger.error("Error combining timestamps:\n" + traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai/generate-summary', methods=['POST'])
def generate_summary_from_video_id():
    """Generate summary from video ID (for existing videos)"""
    try:
        data = request.get_json()
        video_id = data.get('videoId')
        video_title = data.get('videoTitle', '')
        
        if not video_id:
            return jsonify({"error": "No video ID provided"}), 400
        
        # Get video from database
        video_data = get_video_from_database(video_id)
        if not video_data:
            return jsonify({"error": "Video not found"}), 404
        
        # Get video file path
        video_path = get_video_file_path(video_data)
        if not video_path:
            return jsonify({"error": "Video file not found"}), 404
        
        # Extract audio and transcribe
        logger.info(f"Processing video {video_id} for summary generation...")
        audio_path = video_processor.extract_audio_from_video(video_path)
        
        # Transcribe with Whisper
        logger.info("Transcribing audio with Whisper...")
        model = whisper.load_model('base')
        transcript_result = model.transcribe(audio_path)
        transcript = transcript_result["text"]
        
        # Generate summary
        logger.info("Generating summary with GPT...")
        summary = gpt_service.generate_summary(transcript, video_title)
        
        # Clean up audio file
        video_processor.cleanup_files(None, audio_path)
        
        return jsonify({"summary": summary})
        
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai/generate-description', methods=['POST'])
def generate_description_from_video_id():
    """Generate description from video ID (for existing videos)"""
    try:
        data = request.get_json()
        video_id = data.get('videoId')
        video_title = data.get('videoTitle', '')
        
        if not video_id:
            return jsonify({"error": "No video ID provided"}), 400
        
        # Get video from database
        video_data = get_video_from_database(video_id)
        if not video_data:
            return jsonify({"error": "Video not found"}), 404
        
        # Get video file path
        video_path = get_video_file_path(video_data)
        if not video_path:
            return jsonify({"error": "Video file not found"}), 404
        
        # Extract audio and transcribe
        logger.info(f"Processing video {video_id} for description generation...")
        audio_path = video_processor.extract_audio_from_video(video_path)
        
        # Transcribe with Whisper
        logger.info("Transcribing audio with Whisper...")
        model = whisper.load_model('base')
        transcript_result = model.transcribe(audio_path)
        transcript = transcript_result["text"]
        
        # Generate description
        logger.info("Generating description with GPT...")
        description = gpt_service.generate_description(transcript, video_title)
        
        # Clean up audio file
        video_processor.cleanup_files(None, audio_path)
        
        return jsonify({"description": description})
        
    except Exception as e:
        logger.error(f"Error generating description: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai/generate-timestamps', methods=['POST'])
def generate_timestamps_from_video_id():
    """Generate timestamps from video ID (for existing videos)"""
    try:
        data = request.get_json()
        video_id = data.get('videoId')
        video_title = data.get('videoTitle', '')
        
        if not video_id:
            return jsonify({"error": "No video ID provided"}), 400
        
        # Get video from database
        video_data = get_video_from_database(video_id)
        if not video_data:
            return jsonify({"error": "Video not found"}), 404
        
        # Get video file path
        video_path = get_video_file_path(video_data)
        if not video_path:
            return jsonify({"error": "Video file not found"}), 404
        
        # Extract audio and transcribe
        logger.info(f"Processing video {video_id} for timestamps generation...")
        audio_path = video_processor.extract_audio_from_video(video_path)
        
        # Transcribe with Whisper
        logger.info("Transcribing audio with Whisper...")
        model = whisper.load_model('base')
        transcript_result = model.transcribe(audio_path)
        transcript = transcript_result["text"]
        
        # Detect scenes with PySceneDetect (more accurate timestamps)
        logger.info("Detecting scenes with PySceneDetect...")
        scene_timestamps = scene_detector.detect_scenes(video_path, threshold=27.0, min_scene_length=1.0)
        
        # Filter to only include main/important scenes using GPT
        logger.info("Filtering to main scenes using GPT...")
        main_scenes = gpt_service.filter_main_scenes(scene_timestamps, transcript, video_title)
        
        # Generate descriptions for main scenes using GPT
        logger.info("Generating descriptions for main scenes with GPT...")
        scene_descriptions = gpt_service.generate_scene_descriptions(main_scenes, transcript, video_title)
        
        # Combine PySceneDetect timestamps with GPT descriptions
        logger.info("Combining main scene timestamps with GPT descriptions...")
        final_timestamps = []
        
        for i, scene_ts in enumerate(main_scenes):
            # Find matching GPT description
            matching_description = None
            for desc in scene_descriptions:
                if desc["scene_index"] == i:
                    matching_description = desc["description"]
                    break
            
            # Use GPT description if available, otherwise use scene description
            description = matching_description if matching_description else scene_ts["description"]
            
            final_timestamps.append({
                "time_start": scene_ts["time_start"],
                "description": description,
                "scene_info": f"Main Scene {i+1}",
                "duration": scene_ts["duration"]
            })
        
        # Clean up audio file
        video_processor.cleanup_files(None, audio_path)
        
        return jsonify({"timestamps": final_timestamps})
        
    except Exception as e:
        logger.error(f"Error generating timestamps: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai/process-video', methods=['POST'])
def process_video_sequential():
    """Process video sequentially - summary, description, timestamps"""
    try:
        data = request.get_json()
        video_id = data.get('videoId')
        video_title = data.get('videoTitle', '')
        features = data.get('features', ['summary', 'description', 'timestamps'])
        
        if not video_id:
            return jsonify({"error": "No video ID provided"}), 400
        
        # Get video from database
        video_data = get_video_from_database(video_id)
        if not video_data:
            return jsonify({"error": "Video not found"}), 404
        
        # Get video file path
        video_path = get_video_file_path(video_data)
        if not video_path:
            return jsonify({"error": "Video file not found"}), 404
        
        result = {
            "summary": None,
            "description": None,
            "timestamps": None
        }
        
        # Extract audio and transcribe once
        logger.info(f"Processing video {video_id} for AI generation...")
        audio_path = video_processor.extract_audio_from_video(video_path)
        
        # Transcribe with Whisper
        logger.info("Transcribing audio with Whisper...")
        model = whisper.load_model('base')
        transcript_result = model.transcribe(audio_path)
        transcript = transcript_result["text"]
        
        # Generate features sequentially
        if 'summary' in features:
            logger.info("Generating summary...")
            result["summary"] = gpt_service.generate_summary(transcript, video_title)
        
        if 'description' in features:
            logger.info("Generating description...")
            result["description"] = gpt_service.generate_description(transcript, video_title)
        
        if 'timestamps' in features:
            logger.info("Generating timestamps...")
            # Detect scenes with PySceneDetect
            scene_timestamps = scene_detector.detect_scenes(video_path, threshold=27.0, min_scene_length=1.0)
            
            # Filter to main scenes
            main_scenes = gpt_service.filter_main_scenes(scene_timestamps, transcript, video_title)
            
            # Generate descriptions for main scenes
            scene_descriptions = gpt_service.generate_scene_descriptions(main_scenes, transcript, video_title)
            
            # Combine timestamps with descriptions
            final_timestamps = []
            for i, scene_ts in enumerate(main_scenes):
                matching_description = None
                for desc in scene_descriptions:
                    if desc["scene_index"] == i:
                        matching_description = desc["description"]
                        break
                
                description = matching_description if matching_description else scene_ts["description"]
                
                final_timestamps.append({
                    "time_start": scene_ts["time_start"],
                    "description": description,
                    "scene_info": f"Main Scene {i+1}",
                    "duration": scene_ts["duration"]
                })
            
            result["timestamps"] = final_timestamps
        
        # Clean up audio file
        video_processor.cleanup_files(None, audio_path)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai/test-video/<video_id>', methods=['GET'])
def test_video_access(video_id):
    """Test if video is accessible"""
    try:
        video_data = get_video_from_database(video_id)
        if not video_data:
            return jsonify({"error": "Video not found"}), 404
        
        video_path = get_video_file_path(video_data)
        if not video_path:
            return jsonify({"error": "Video file not found"}), 404
        
        return jsonify({
            "status": "success",
            "video_id": video_id,
            "video_path": video_path,
            "file_exists": os.path.exists(video_path)
        })
        
    except Exception as e:
        logger.error(f"Error testing video access: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Create upload directory
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Check if OpenAI API key is set
    if not os.getenv('OPENAI_API_KEY'):
        logger.warning("OPENAI_API_KEY environment variable not set!")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
