import sys
import os
from dotenv import load_dotenv
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import whisper
import json
from moviepy.editor import VideoFileClip
from scenedetect import VideoManager, SceneManager
from scenedetect.detectors import ContentDetector
from gpt.gpt_service import GPTService
from scene_detection.scene_detector import SceneDetector

# Explicitly load the .env from python_services
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
key = os.getenv("OPENAI_API_KEY")
if key:
    masked_key = key[:4] + "..." + key[-4:]
else:
    masked_key = None
print("[DEBUG] OPENAI_API_KEY:", masked_key)

def extract_audio(video_path, audio_path="temp_audio.wav"):
    clip = VideoFileClip(video_path)
    if clip.audio is None:
        raise ValueError(f"No audio track found in {video_path}")
    clip.audio.write_audiofile(audio_path)
    return audio_path

def transcribe_with_whisper(audio_path, model_name="base"):
    model = whisper.load_model(model_name)
    result = model.transcribe(audio_path, word_timestamps=True, verbose=True)
    return result

def detect_pauses(segments, min_pause_sec=1.0):
    """Detects pauses between segments and returns split points."""
    timestamps = []
    for i in range(1, len(segments)):
        prev_end = segments[i-1]['end']
        curr_start = segments[i]['start']
        if curr_start - prev_end >= min_pause_sec:
            timestamps.append(curr_start)
    return timestamps

def detect_scenes(video_path, threshold=27.0):
    video_manager = VideoManager([video_path])
    scene_manager = SceneManager()
    scene_manager.add_detector(ContentDetector(threshold=threshold))
    video_manager.set_downscale_factor()
    video_manager.start()
    scene_manager.detect_scenes(frame_source=video_manager)
    scene_list = scene_manager.get_scene_list()
    times = [scene[0].get_seconds() for scene in scene_list]
    video_manager.release()
    return times

def generate_timestamps(segments, scene_times=None, pause_times=None, min_words=10):
    """Generates a list of {time, description} using scene/pause/word boundaries, ensuring timestamps are within segment start/end times."""
    timestamps = []
    last_time = 0.0
    buffer = []
    for seg in segments:
        start = seg['start']
        end = seg['end']
        text = seg['text'].strip()
        # Check if any scene or pause time falls within this segment
        matched = False
        if scene_times:
            for t in scene_times:
                if start <= t < end:
            if buffer:
                timestamps.append({'time': last_time, 'description': ' '.join(buffer)})
                buffer = []
                    last_time = t
                    matched = True
        if pause_times and not matched:
            for t in pause_times:
                if start <= t < end:
            if buffer:
                timestamps.append({'time': last_time, 'description': ' '.join(buffer)})
                buffer = []
                    last_time = t
        buffer.append(text)
        if len(' '.join(buffer).split()) >= min_words:
            timestamps.append({'time': last_time, 'description': ' '.join(buffer)})
            buffer = []
            last_time = end
    if buffer:
        timestamps.append({'time': last_time, 'description': ' '.join(buffer)})
    return timestamps

def seconds_to_mmss(seconds):
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes:02d}:{secs:02d}"

def mmss_to_seconds(mmss):
    parts = mmss.split(':')
    if len(parts) == 2:
        return int(parts[0]) * 60 + int(parts[1])
    return 0

def main(video_path, min_scene_length=1.0, max_scene_length=60.0):
    # 1. Extract audio
    audio_path = extract_audio(video_path)
    # 2. Transcribe with Whisper (base)
    result = transcribe_with_whisper(audio_path, model_name="base")
    segments = result['segments']
    # 3. Detect scenes (PySceneDetect)
    scene_detector = SceneDetector()
    scenes = scene_detector.detect_scenes(video_path, min_scene_length=min_scene_length)
    # 4. Get video duration for clamping
    video_info = scene_detector.get_video_info(video_path)
    video_duration = video_info['duration']
    gpt_service = GPTService()
    timestamps = []

    for i, scene in enumerate(scenes):
        # Clamp both start and end to video duration
        scene_start = min(scene['start_time'], video_duration)
        scene_end = min(scene['end_time'], video_duration)
        if scene_start >= video_duration:
            continue  # skip any scene that starts after video ends
        # Get all Whisper segments that overlap with this scene
        scene_segments = [seg for seg in segments if isinstance(seg, dict) and seg['end'] > scene_start and seg['start'] < scene_end]
        # Concatenate all text in the scene
        scene_text = ' '.join(seg['text'] for seg in scene_segments if isinstance(seg, dict))
        time_start = seconds_to_mmss(scene_start)
        description = gpt_service.generate_description(scene_text)
        timestamps.append({
            'time_start': time_start,
            'description': description,
            'scene': i+1
        })

    # Compose summary (full transcription)
    summary = result.get('text', '')
    # Output as JSON
    output = {
        'summary': summary,
        'timestamps': timestamps
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))
    # Clean up
    if os.path.exists(audio_path):
        os.remove(audio_path)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python full_pipeline.py <video_path>")
        exit(1)
    main(sys.argv[1]) 