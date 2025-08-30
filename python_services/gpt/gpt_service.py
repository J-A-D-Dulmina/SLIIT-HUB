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
        
        # Check OpenAI library version and initialize accordingly
        try:
            # Try new version (1.0.0+)
            self.client = openai.OpenAI(api_key=self.api_key)
            self.is_new_version = True
            logger.info("Using OpenAI library version 1.0.0+")
        except AttributeError:
            # Fallback to old version (< 1.0.0)
            openai.api_key = self.api_key
            self.is_new_version = False
            logger.info("Using OpenAI library version < 1.0.0")
        
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
                
                if self.is_new_version:
                    # New version syntax
                    response = self.client.chat.completions.create(
                        model=self.model,
                        messages=messages,
                        max_tokens=max_tokens,
                        temperature=temperature
                    )
                    result = response.choices[0].message.content.strip()
                else:
                    # Old version syntax
                    response = openai.ChatCompletion.create(
                        model=self.model,
                        messages=messages,
                        max_tokens=max_tokens,
                        temperature=temperature
                    )
                    result = response.choices[0].message.content.strip()
                
                logger.info(f"API call successful on attempt {attempt + 1}")
                return result
                
            except Exception as e:
                logger.error(f"API call failed on attempt {attempt + 1}: {str(e)}")
                if attempt == retries - 1:
                    raise e
                time.sleep(1)  
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
                
                # Extract transcript segment for this scene with more context
                scene_transcript = self._extract_transcript_segment(transcript, start_time, end_time)
                
                if scene_transcript.strip():
                    # Get more context by including surrounding content
                    context_before = self._extract_transcript_segment(transcript, max(0, start_time - 30), start_time)
                    context_after = self._extract_transcript_segment(transcript, end_time, min(len(transcript), end_time + 30))
                    
                    prompt = f"""
                    Create a specific, accurate description for this video scene.
                    
                    Video Title: {video_title}
                    Scene {i+1} of {len(scene_timestamps)}
                    Duration: {duration:.1f} seconds ({start_time:.1f}s - {end_time:.1f}s)
                    
                    Previous Context: {context_before[-200:] if context_before else "Start of video"}
                    
                    Scene Content:
                    {scene_transcript}
                    
                    Next Context: {context_after[:200] if context_after else "End of video"}
                    
                    Requirements:
                    - Be specific to the actual content in this scene
                    - Focus on the main topic, concept, or action
                    - Use 3-8 words maximum
                    - Avoid generic terms like "Scene", "Part", "Section"
                    - Make it useful for navigation
                    - Be unique and different from other scenes
                    
                    Examples of good descriptions:
                    - "React useState hook"
                    - "Database connection setup"
                    - "Error handling demo"
                    - "Final code review"
                    - "API endpoint creation"
                    - "User authentication"
                    
                    Description:"""
                    
                    messages = [
                        {"role": "system", "content": "You are an expert video content analyzer. Create precise, unique descriptions for video segments."},
                        {"role": "user", "content": prompt}
                    ]
                    
                    description = self._make_api_call(messages, max_tokens=100, temperature=0.4)
                    
                    # Clean up the description
                    if description:
                        description = description.strip()
                        # Remove quotes if present
                        if description.startswith('"') and description.endswith('"'):
                            description = description[1:-1]
                        # Remove numbering if present
                        if description.startswith(f"{i+1}. "):
                            description = description[len(f"{i+1}. "):]
                        # Ensure it's not too long
                        if len(description) > 80:
                            description = description[:77] + "..."
                        
                        scene_descriptions.append({
                            "scene_index": i,
                            "description": description,
                            "start_time": start_time,
                            "end_time": end_time,
                            "duration": duration
                        })
                    else:
                        # Fallback description
                        scene_descriptions.append({
                            "scene_index": i,
                            "description": f"Scene {i+1} ({duration:.1f}s)",
                            "start_time": start_time,
                            "end_time": end_time,
                            "duration": duration
                        })
                else:
                    # No transcript available for this scene
                    scene_descriptions.append({
                        "scene_index": i,
                        "description": f"Scene {i+1} ({duration:.1f}s)",
                        "start_time": start_time,
                        "end_time": end_time,
                        "duration": duration
                    })
            
            logger.info(f"Generated {len(scene_descriptions)} scene descriptions")
            return scene_descriptions
            
        except Exception as e:
            logger.error(f"Error generating scene descriptions: {str(e)}")
            raise Exception(f"Failed to generate scene descriptions: {str(e)}")
    
    def _extract_transcript_segment(self, transcript, start_time, end_time):
        """Extract transcript segment for a specific time range with better context"""
        try:
            # Calculate timing information
            duration = end_time - start_time
            start_minutes = int(start_time // 60)
            start_seconds = int(start_time % 60)
            end_minutes = int(end_time // 60)
            end_seconds = int(end_time % 60)
            
            # Estimate character position based on time (rough approximation)
            # Assuming average speaking rate of 150 words per minute
            # and average word length of 5 characters
            chars_per_second = (150 * 5) / 60  # ~12.5 characters per second
            
            start_char = int(start_time * chars_per_second)
            end_char = int(end_time * chars_per_second)
            
            # Ensure we don't go out of bounds
            start_char = max(0, min(start_char, len(transcript)))
            end_char = max(start_char, min(end_char, len(transcript)))
            
            # Extract the segment
            segment = transcript[start_char:end_char]
            
            # If segment is too short, expand it
            if len(segment) < 50:
                # Expand by 100 characters on each side
                expanded_start = max(0, start_char - 100)
                expanded_end = min(len(transcript), end_char + 100)
                segment = transcript[expanded_start:expanded_end]
            
            # Add timing context
            context = f"""
            Time Range: {start_minutes:02d}:{start_seconds:02d} - {end_minutes:02d}:{end_seconds:02d}
            Duration: {duration:.1f} seconds
            
            Content for this time period:
            {segment}
            """
            
            return context.strip()
            
        except Exception as e:
            logger.error(f"Error extracting transcript segment: {str(e)}")
            return transcript

    def filter_main_scenes(self, scene_timestamps, transcript, video_title=""):
        """Filter scenes to only include main/important scenes using GPT"""
        try:
            logger.info("Starting main scenes filtering...")
            
            if not scene_timestamps:
                return []
            
            # If we have very few scenes (8 or less), keep all of them
            if len(scene_timestamps) <= 8:
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
            2. Include scenes that are longer than 3 seconds (likely important)
            3. Include scenes that represent different topics or sections
            4. Keep at least 70-80% of the original scenes (be less aggressive)
            5. Focus on scenes that would be useful for navigation
            6. Do NOT modify any timestamps or timing information
            7. Return only the scene numbers of important scenes (e.g., "1,3,5,7,8")
            
            Important: Keep more scenes rather than fewer to ensure good coverage.
            """
            
            messages = [
                {"role": "system", "content": "You are an expert video content analyzer. Identify important scenes for navigation."},
                {"role": "user", "content": prompt}
            ]
            
            response = self._make_api_call(messages, max_tokens=200, temperature=0.2)
            
            if response:
                # Parse the response to get scene numbers
                try:
                    # Extract numbers from the response
                    import re
                    scene_numbers = re.findall(r'\d+', response)
                    scene_numbers = [int(num) for num in scene_numbers]
                    
                    # Filter to valid scene numbers
                    valid_scenes = []
                    for num in scene_numbers:
                        if 1 <= num <= len(scene_timestamps):
                            valid_scenes.append(num - 1)  # Convert to 0-based index
                    
                    # If GPT was too aggressive, keep more scenes
                    if len(valid_scenes) < len(scene_timestamps) * 0.6:
                        logger.warning(f"GPT filtered too aggressively ({len(valid_scenes)}/{len(scene_timestamps)}), keeping more scenes")
                        # Keep scenes with duration > 2 seconds or first/last scenes
                        valid_scenes = []
                        for i, scene_ts in enumerate(scene_timestamps):
                            duration = scene_ts.get("end_time", 0) - scene_ts.get("start_time", 0)
                            if duration > 2.0 or i == 0 or i == len(scene_timestamps) - 1:
                                valid_scenes.append(i)
                    
                    # Ensure we have at least some scenes
                    if not valid_scenes:
                        logger.warning("No valid scenes found, keeping all scenes")
                        return scene_timestamps
                    
                    # Return filtered scenes
                    filtered_scenes = [scene_timestamps[i] for i in valid_scenes]
                    logger.info(f"Filtered to {len(filtered_scenes)} main scenes out of {len(scene_timestamps)} total")
                    return filtered_scenes
                    
                except Exception as e:
                    logger.error(f"Error parsing GPT response: {str(e)}")
                    # Fallback: keep scenes with duration > 2 seconds
                    filtered_scenes = []
                    for scene_ts in scene_timestamps:
                        duration = scene_ts.get("end_time", 0) - scene_ts.get("start_time", 0)
                        if duration > 2.0:
                            filtered_scenes.append(scene_ts)
                    
                    if not filtered_scenes:
                        return scene_timestamps
                    
                    logger.info(f"Fallback filtering: kept {len(filtered_scenes)} scenes")
                    return filtered_scenes
            
            # If GPT response is empty, keep all scenes
            logger.warning("Empty GPT response, keeping all scenes")
            return scene_timestamps
            
        except Exception as e:
            logger.error(f"Error filtering main scenes: {str(e)}")
            # Return all scenes as fallback
            return scene_timestamps 