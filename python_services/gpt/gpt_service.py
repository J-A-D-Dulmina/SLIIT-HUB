import openai
import os
import logging

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

    def generate_description(self, transcript, video_title=""):
        """Generate a short, concise description using GPT"""
        try:
            model_to_use = self._try_model()
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
            response = openai.ChatCompletion.create(
                model=model_to_use,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.3
            )
            logger.info(f"Description generated using {model_to_use}")
            description = response.choices[0].message.content.strip()
            if len(description) > 150:
                description = description[:147] + "..."
            return description
        except Exception as e:
            logger.error(f"Error generating description: {str(e)}")
            raise Exception(f"Failed to generate description: {str(e)}")

    def generate_summary(self, transcript, video_title=""):
        """Generate summary using GPT"""
        try:
            model_to_use = self._try_model()
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
            response = openai.ChatCompletion.create(
                model=model_to_use,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.3
            )
            logger.info(f"Summary generated using {model_to_use}")
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            raise Exception(f"Failed to generate summary: {str(e)}")

    def generate_timestamps(self, transcript, video_title=""):
        """Generate timestamps using GPT"""
        try:
            model_to_use = self._try_model()
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
            response = openai.ChatCompletion.create(
                model=model_to_use,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.2
            )
            logger.info(f"Timestamps generated using {model_to_use}")
            content = response.choices[0].message.content.strip()
            timestamps = []
            for line in content.split('\n'):
                if ' - ' in line:
                    parts = line.split(' - ', 1)
                    if len(parts) == 2:
                        time_str = parts[0].strip().replace('-', '').strip()
                        description = parts[1].strip()
                        timestamps.append({
                            "time": time_str,
                            "description": description
                        })
            return timestamps
        except Exception as e:
            logger.error(f"Error generating timestamps: {str(e)}")
            raise Exception(f"Failed to generate timestamps: {str(e)}") 