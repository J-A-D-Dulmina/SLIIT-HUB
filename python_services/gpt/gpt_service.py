import openai
import os
import logging
import time
import json
import re

logger = logging.getLogger(__name__)

class GPTService:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        openai.api_key = self.api_key
        # Use faster model for better performance
        self.model = "gpt-3.5-turbo"
        self.system_prompt = os.getenv(
            "OPENAI_SYSTEM_PROMPT",
            "You are an expert educational summarizer. Write clear, concise summaries quickly."
        )

    def _try_model(self, model_name=None, fallback_model=None):
        return "gpt-3.5-turbo"

    def _make_api_call(self, messages, max_tokens, temperature=0.3, retries=2):
        """Make API call with optimized retry logic for faster performance"""
        for attempt in range(retries):
            try:
                logger.info(f"Making OpenAI API call (attempt {attempt + 1}/{retries})")
                response = openai.ChatCompletion.create(
                    model=self.model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature
                )
                logger.info(f"API call successful on attempt {attempt + 1}")
                return response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"API call failed on attempt {attempt + 1}: {str(e)}")
                if attempt == retries - 1:
                    raise e
                time.sleep(1)  # Reduced backoff for faster retry
        return None

    def generate_description(self, transcript, video_title=""):
        """Generate a short, concise description using GPT - Optimized for speed"""
        try:
            logger.info("Starting description generation...")
            
            # Truncate transcript for faster processing (first 1000 chars)
            short_transcript = transcript[:1000] + "..." if len(transcript) > 1000 else transcript
            
            prompt = f"""
            Create a short description for this educational video.
            
            Title: {video_title}
            Content: {short_transcript}
            
            Requirements:
            - Keep under 120 characters
            - Be engaging and clear
            - Focus on main topic
            
            Description:"""
            
            messages = [
                {"role": "system", "content": "You are a helpful assistant. Write concise descriptions quickly."},
                {"role": "user", "content": prompt}
            ]
            
            description = self._make_api_call(messages, max_tokens=150, temperature=0.3)
            
            if len(description) > 120:
                description = description[:117] + "..."
            
            logger.info("Description generation completed successfully")
            return description
            
        except Exception as e:
            logger.error(f"Error generating description: {str(e)}")
            raise Exception(f"Failed to generate description: {str(e)}")

    def generate_summary(self, transcript, video_title=""):
        """Generate summary using GPT - Optimized for speed"""
        try:
            logger.info("Starting summary generation...")
            
            # Truncate transcript for faster processing (first 2000 chars)
            short_transcript = transcript[:2000] + "..." if len(transcript) > 2000 else transcript
            
            prompt = f"""
            Create a concise summary for this educational video.
            
            Title: {video_title}
            Content: {short_transcript}
            
            Provide:
            1. Brief summary (1-2 paragraphs)
            2. Key points
            3. Main topics
            
            Summary:"""
            
            messages = [
                {"role": "system", "content": "You are a helpful assistant. Write concise summaries quickly."},
                {"role": "user", "content": prompt}
            ]
            
            summary = self._make_api_call(messages, max_tokens=600, temperature=0.3)
            
            logger.info("Summary generation completed successfully")
            return summary
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            raise Exception(f"Failed to generate summary: {str(e)}")

    def generate_timestamps(self, transcript, video_title=""):
        """Generate timestamps using GPT - Optimized for speed"""
        try:
            logger.info("Starting timestamps generation...")
            
            # Truncate transcript for faster processing (first 1500 chars)
            short_transcript = transcript[:1500] + "..." if len(transcript) > 1500 else transcript
            
            prompt = f"""
            Generate timestamps for this video.
            
            Title: {video_title}
            Content: {short_transcript}
            
            Format: 00:00 - Description
            
            Return only timestamps in the specified format."""
            
            messages = [
                {"role": "system", "content": "You are a helpful assistant. Generate timestamps quickly."},
                {"role": "user", "content": prompt}
            ]
            
            content = self._make_api_call(messages, max_tokens=300, temperature=0.2)
            
            # Parse timestamps
            timestamps = []
            for line in content.split('\n'):
                if ' - ' in line:
                    parts = line.split(' - ', 1)
                    if len(parts) == 2:
                        time_str = parts[0].strip().replace('-', '').strip()
                        description = parts[1].strip()
                        timestamps.append({
                            "time_start": time_str,
                            "description": description
                        })
            
            logger.info(f"Timestamps generation completed successfully. Generated {len(timestamps)} timestamps.")
            return timestamps
            
        except Exception as e:
            logger.error(f"Error generating timestamps: {str(e)}")
            raise Exception(f"Failed to generate timestamps: {str(e)}")

    def generate_scene_descriptions(self, scene_timestamps, transcript, video_title=""):
        """Generate descriptions for specific scene timestamps without modifying the timestamps"""
        try:
            logger.info("Starting scene descriptions generation...")
            
            if not scene_timestamps:
                return []
            
            scene_descriptions = []
            
            for i, scene_ts in enumerate(scene_timestamps):
                start_time = scene_ts.get("start_time", 0)
                end_time = scene_ts.get("end_time", 0)
                duration = end_time - start_time
                
                # Extract transcript segment for this scene
                scene_transcript = self._extract_transcript_segment(transcript, start_time, end_time)
                
                if scene_transcript.strip():
                    prompt = f"""
                    Create a short, accurate description for this video scene.
                    
                    Video Title: {video_title}
                    Scene Duration: {duration:.1f} seconds
                    Scene Start Time: {start_time:.1f}s
                    Scene End Time: {end_time:.1f}s
                    
                    Scene Transcript:
                    {scene_transcript}
                    
                    Requirements:
                    - Keep it under 80 characters
                    - Be accurate to the actual content
                    - Focus on the main topic or key point
                    - Use clear, simple language
                    - Avoid generic descriptions like "Scene 1"
                    - Make it useful for navigation
                    
                    Examples of good descriptions:
                    - "Introduction to React hooks"
                    - "Setting up the database"
                    - "Error handling demonstration"
                    - "Final project overview"
                    
                    Return only the description text, nothing else.
                    """
                    
                    messages = [
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": prompt}
                    ]
                    
                    description = self._make_api_call(messages, max_tokens=150, temperature=0.3)
                    
                    # Clean up the description
                    description = description.strip()
                    if len(description) > 80:
                        description = description[:77] + "..."
                    
                    # If description is too generic, use a more specific one
                    if description.lower() in ['scene', 'scene 1', 'introduction', 'part']:
                        description = f"Section {i+1} ({duration:.0f}s)"
                    
                    scene_descriptions.append({
                        "scene_index": i,
                        "start_time": start_time,
                        "description": description
                    })
                else:
                    # Use a more descriptive default if no transcript available
                    scene_descriptions.append({
                        "scene_index": i,
                        "start_time": start_time,
                        "description": f"Section {i+1} ({duration:.0f}s)"
                    })
            
            logger.info(f"Scene descriptions generation completed successfully. Generated {len(scene_descriptions)} descriptions.")
            return scene_descriptions
            
        except Exception as e:
            logger.error(f"Error generating scene descriptions: {str(e)}")
            raise Exception(f"Failed to generate scene descriptions: {str(e)}")
    
    def _extract_transcript_segment(self, transcript, start_time, end_time):
        """Extract transcript segment for a specific time range"""
        try:
            # For now, we'll use the full transcript and let GPT focus on the scene
            # In a future implementation, you could use Whisper's segment timestamps
            # to extract the exact transcript for each time range
            
            # Add timing context to help GPT understand the scene
            duration = end_time - start_time
            start_minutes = int(start_time // 60)
            start_seconds = int(start_time % 60)
            end_minutes = int(end_time // 60)
            end_seconds = int(end_time % 60)
            
            context = f"""
            Scene Timing: {start_minutes:02d}:{start_seconds:02d} - {end_minutes:02d}:{end_seconds:02d}
            Duration: {duration:.1f} seconds
            
            Full Video Transcript:
            {transcript}
            
            Focus on the content that would be most relevant for this time period.
            """
            
            return context
            
        except Exception as e:
            logger.error(f"Error extracting transcript segment: {str(e)}")
            return transcript

    def filter_main_scenes(self, scene_timestamps, transcript, video_title=""):
        """Filter scenes to only include main/important scenes using GPT"""
        try:
            logger.info("Starting main scenes filtering...")
            
            if not scene_timestamps:
                return []
            
            # If we have very few scenes (5 or less), keep all of them
            if len(scene_timestamps) <= 5:
                logger.info(f"Only {len(scene_timestamps)} scenes detected, keeping all")
                return scene_timestamps
            
            # Create a summary of all scenes for GPT to analyze
            scenes_summary = []
            for i, scene_ts in enumerate(scene_timestamps):
                start_time = scene_ts.get("start_time", 0)
                end_time = scene_ts.get("end_time", 0)
                duration = end_time - start_time
                
                scenes_summary.append({
                    "scene_number": i + 1,
                    "start_time": start_time,
                    "end_time": end_time,
                    "duration": duration,
                    "time_start": scene_ts.get("time_start", "")
                })
            
            prompt = f"""
            Analyze these video scenes and identify the MAIN/IMPORTANT scenes.
            
            Video Title: {video_title}
            Total Scenes Detected: {len(scene_timestamps)}
            
            All Detected Scenes:
            {json.dumps(scenes_summary, indent=2)}
            
            Instructions:
            1. Identify MAIN/IMPORTANT scenes that contain key content
            2. Include scenes that are longer than 5 seconds (likely important)
            3. Include scenes that represent different topics or sections
            4. Keep at least 60-70% of the original scenes
            5. Focus on scenes that would be useful for navigation
            6. Do NOT modify any timestamps or timing information
            7. Return only the scene numbers of important scenes
            
            Guidelines:
            - Keep scenes longer than 5 seconds
            - Keep scenes that are well-spaced throughout the video
            - Avoid removing too many scenes (keep most of them)
            - Focus on educational content and topic transitions
            
            Return only a JSON array of important scene numbers, nothing else.
            Example: [1, 2, 4, 6, 8, 10]
            """
            
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            response = self._make_api_call(messages, max_tokens=200, temperature=0.2)
            
            # Parse the response to get important scene numbers
            try:
                # Clean the response to extract JSON array
                response = response.strip()
                if response.startswith('[') and response.endswith(']'):
                    important_scene_numbers = json.loads(response)
                else:
                    # Try to extract numbers from the response
                    numbers = re.findall(r'\d+', response)
                    important_scene_numbers = [int(n) for n in numbers if int(n) <= len(scene_timestamps)]
                
                # Ensure we keep at least 60% of scenes
                min_scenes = max(3, int(len(scene_timestamps) * 0.6))
                if len(important_scene_numbers) < min_scenes:
                    logger.warning(f"GPT filtered too many scenes. Keeping at least {min_scenes} scenes.")
                    # Keep scenes with longer duration
                    scene_durations = [(i+1, scene_ts.get("end_time", 0) - scene_ts.get("start_time", 0)) 
                                     for i, scene_ts in enumerate(scene_timestamps)]
                    scene_durations.sort(key=lambda x: x[1], reverse=True)
                    important_scene_numbers = [scene_num for scene_num, _ in scene_durations[:min_scenes]]
                    important_scene_numbers.sort()  # Keep original order
                    
            except:
                logger.warning("Failed to parse GPT response for scene filtering, using all scenes")
                important_scene_numbers = list(range(1, len(scene_timestamps) + 1))
            
            # Filter scenes to only include important ones
            filtered_scenes = []
            for i, scene_ts in enumerate(scene_timestamps):
                scene_number = i + 1
                if scene_number in important_scene_numbers:
                    filtered_scenes.append(scene_ts)
            
            logger.info(f"Scene filtering completed. Kept {len(filtered_scenes)} out of {len(scene_timestamps)} scenes.")
            return filtered_scenes
            
        except Exception as e:
            logger.error(f"Error filtering main scenes: {str(e)}")
            # Return all scenes if filtering fails
            return scene_timestamps 