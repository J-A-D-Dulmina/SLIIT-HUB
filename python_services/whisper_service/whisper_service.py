import os
import logging

logger = logging.getLogger(__name__)

class WhisperService:
    def __init__(self):
        self.model = None
        self._whisper = None
    
    def _import_whisper(self):
        """Import whisper with error handling"""
        try:
            # Try importing from openai_whisper specifically
            import openai_whisper as whisper
            self._whisper = whisper
            return whisper
        except ImportError:
            try:
                # Fallback to regular whisper import
                import whisper
                self._whisper = whisper
                return whisper
            except ImportError as e:
                logger.error(f"Whisper import failed: {e}")
                raise ImportError("OpenAI Whisper is not installed. Run: pip install openai-whisper")
    
    def load_model(self, model_name="base"):
        """Load Whisper model (lazy loading)"""
        if self.model is None:
            try:
                whisper = self._import_whisper()
                logger.info(f"Loading Whisper model: {model_name}")
                self.model = whisper.load_model(model_name)
                logger.info("Whisper model loaded successfully")
            except Exception as e:
                logger.error(f"Error loading Whisper model: {e}")
                raise
        return self.model
    
    def transcribe_audio(self, audio_path, model_name="base"):
        """Transcribe audio using OpenAI Whisper"""
        try:
            # Ensure whisper is imported
            if self._whisper is None:
                self._import_whisper()
            
            model = self.load_model(model_name)
            logger.info(f"Transcribing audio: {audio_path}")
            
            # Check if audio file exists
            if not os.path.exists(audio_path):
                raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
            # Transcribe with error handling
            try:
                result = model.transcribe(audio_path)
                transcript = result.get('text', '')
                
                if not transcript:
                    logger.warning("Whisper returned empty transcript")
                    return ""
                
                logger.info(f"Transcription completed. Length: {len(transcript)} characters")
                return transcript
                
            except Exception as e:
                logger.error(f"Whisper transcription failed: {e}")
                # Try with different parameters
                try:
                    logger.info("Retrying with different parameters...")
                    result = model.transcribe(audio_path, fp16=False, language='en')
                    transcript = result.get('text', '')
                    return transcript
                except Exception as e2:
                    logger.error(f"Retry also failed: {e2}")
                    raise e
            
        except Exception as e:
            logger.error(f"Error transcribing audio: {str(e)}")
            raise 