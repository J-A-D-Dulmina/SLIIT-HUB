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
from datetime import datetime
from common.video_processor import VideoProcessor
from gpt.gpt_service import GPTService
from scene_detection.scene_detector import SceneDetector
from typing import Any, Dict
import whisper
import traceback

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

if __name__ == '__main__':
    # Create upload directory
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Check if OpenAI API key is set
    if not os.getenv('OPENAI_API_KEY'):
        logger.warning("OPENAI_API_KEY environment variable not set!")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
