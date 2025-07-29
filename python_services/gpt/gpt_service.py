import openai
import os
import logging
import time

logger = logging.getLogger(__name__)

class GPTService:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        openai.api_key = self.api_key
        self.model = "gpt-3.5-turbo"
        self.system_prompt = os.getenv(
            "OPENAI_SYSTEM_PROMPT",
            "You are an expert educational summarizer for university lectures. Write clear, concise, and student-friendly summaries that highlight the main concepts and key points."
        )

    def _try_model(self, model_name=None, fallback_model=None):
        return "gpt-3.5-turbo"

    def _make_api_call(self, messages, max_tokens, temperature=0.3, retries=3):
        """Make API call with retry logic"""
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
                time.sleep(2 ** attempt)  # Exponential backoff
        return None

    def generate_description(self, transcript, video_title=""):
        """Generate a short, concise description using GPT"""
        try:
            logger.info("Starting description generation...")
            prompt = f"""
            Create a short, engaging description for this educational video.
            
            Video Title: {video_title}
            
            Transcript:
            {transcript}
            
            Requirements:
            - Keep it under 150 characters
            - Make it engaging and informative
            - Focus on the main topic or key takeaway
            - Use clear, simple language
            - Avoid technical jargon unless necessary
            
            Return only the description text, nothing else.
            """
            
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            description = self._make_api_call(messages, max_tokens=200, temperature=0.3)
            
            if len(description) > 150:
                description = description[:147] + "..."
            
            logger.info("Description generation completed successfully")
            return description
            
        except Exception as e:
            logger.error(f"Error generating description: {str(e)}")
            raise Exception(f"Failed to generate description: {str(e)}")

    def generate_summary(self, transcript, video_title=""):
        """Generate summary using GPT"""
        try:
            logger.info("Starting summary generation...")
            prompt = f"""
            Please analyze the following video transcript and generate a comprehensive summary.
            
            Video Title: {video_title}
            
            Transcript:
            {transcript}
            
            Please provide:
            1. A concise summary (2-3 paragraphs)
            2. Key points covered in the video
            3. Main topics discussed
            4. Any important concepts or definitions mentioned
            
            Format the response as a well-structured summary that would be helpful for students reviewing the content.
            """
            
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            summary = self._make_api_call(messages, max_tokens=1000, temperature=0.3)
            
            logger.info("Summary generation completed successfully")
            return summary
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            raise Exception(f"Failed to generate summary: {str(e)}")

    def generate_timestamps(self, transcript, video_title=""):
        """Generate timestamps using GPT"""
        try:
            logger.info("Starting timestamps generation...")
            prompt = f"""
            Based on the following video transcript, generate logical timestamps for key sections of the video.
            
            Video Title: {video_title}
            
            Transcript:
            {transcript}
            
            Please provide timestamps in the format:
            - 00:00 - Introduction
            - 02:30 - Main Topic 1
            - 05:45 - Main Topic 2
            - 08:15 - Conclusion
            
            Focus on natural breaks in the content and important topic transitions. Return only the timestamps in the specified format.
            """
            
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            content = self._make_api_call(messages, max_tokens=500, temperature=0.2)
            
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