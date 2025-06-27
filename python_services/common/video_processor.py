import os
import subprocess
import logging
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

class VideoProcessor:
    def __init__(self):
        self.allowed_extensions = {'mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'}
    
    def allowed_file(self, filename):
        """Check if file extension is allowed"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in self.allowed_extensions
    
    def extract_audio_from_video(self, video_path):
        """Extract audio from video file using ffmpeg"""
        audio_path = video_path.rsplit('.', 1)[0] + '.wav'
        
        try:
            # Use ffmpeg to extract audio
            cmd = [
                'ffmpeg', '-i', video_path, 
                '-vn',  # No video
                '-acodec', 'pcm_s16le',  # PCM 16-bit
                '-ar', '16000',  # 16kHz sample rate
                '-ac', '1',  # Mono
                '-y',  # Overwrite output file
                audio_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"FFmpeg error: {result.stderr}")
                raise Exception("Failed to extract audio from video")
            
            return audio_path
        except Exception as e:
            logger.error(f"Error extracting audio: {str(e)}")
            raise
    
    def save_video_file(self, video_file, upload_folder):
        """Save uploaded video file"""
        try:
            filename = secure_filename(video_file.filename)
            video_path = os.path.join(upload_folder, filename)
            
            # Create upload directory if it doesn't exist
            os.makedirs(upload_folder, exist_ok=True)
            
            video_file.save(video_path)
            return video_path
        except Exception as e:
            logger.error(f"Error saving video file: {str(e)}")
            raise
    
    def cleanup_files(self, *file_paths):
        """Clean up temporary files"""
        for file_path in file_paths:
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    logger.info(f"Cleaned up file: {file_path}")
                except Exception as e:
                    logger.warning(f"Failed to clean up file {file_path}: {str(e)}") 