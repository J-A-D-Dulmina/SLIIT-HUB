#!/usr/bin/env python3
"""
Test script for AI Video Processing Service
Run this script to test the service functionality
"""

import requests
import os
import json
import time
import sys
import argparse

# Service URL
SERVICE_URL = "http://localhost:5001"

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{SERVICE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
        return False

def test_scene_detection(video_path):
    """Test scene detection with a video file"""
    print(f"🎬 Testing scene detection with: {video_path}")
    
    if not os.path.exists(video_path):
        print(f"❌ Video file not found: {video_path}")
        return False
    
    try:
        with open(video_path, 'rb') as video_file:
            files = {'video': video_file}
            data = {
                'method': 'content',
                'threshold': '27.0',
                'min_scene_length': '1.0'
            }
            
            response = requests.post(f"{SERVICE_URL}/detect-scenes", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Scene detection successful!")
                print(f"📊 Video info: {result.get('video_info', {})}")
                print(f"🎯 Detected {len(result.get('scenes', []))} scenes")
                
                # Show first few scenes
                scenes = result.get('scenes', [])
                for i, scene in enumerate(scenes[:3]):
                    print(f"   Scene {i+1}: {scene['time']} - {scene['description']}")
                
                if len(scenes) > 3:
                    print(f"   ... and {len(scenes) - 3} more scenes")
                
                return True
            else:
                print(f"❌ Scene detection failed: {response.status_code}")
                print(f"Error: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Scene detection error: {str(e)}")
        return False

def test_transcription(video_path):
    """Test transcription with a video file"""
    print(f"🎤 Testing transcription with: {video_path}")
    
    if not os.path.exists(video_path):
        print(f"❌ Video file not found: {video_path}")
        return False
    
    try:
        with open(video_path, 'rb') as video_file:
            files = {'video': video_file}
            
            response = requests.post(f"{SERVICE_URL}/transcribe", files=files)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Transcription successful!")
                print(f"📝 Transcript length: {len(result.get('transcript', ''))} characters")
                print(f"⏱️  Duration: {result.get('duration', 'Unknown')}")
                
                # Show preview of transcript
                transcript = result.get('transcript', '')
                if transcript:
                    preview = transcript[:200] + "..." if len(transcript) > 200 else transcript
                    print(f"📄 Preview: {preview}")
                
                return True
            else:
                print(f"❌ Transcription failed: {response.status_code}")
                print(f"Error: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Transcription error: {str(e)}")
        return False

def test_summary_generation(video_path, title="Test Video"):
    """Test summary generation with a video file"""
    print(f"📄 Testing summary generation with: {video_path}")
    
    if not os.path.exists(video_path):
        print(f"❌ Video file not found: {video_path}")
        return False
    
    try:
        with open(video_path, 'rb') as video_file:
            files = {'video': video_file}
            data = {
                'title': title,
                'type': 'summary'
            }
            
            response = requests.post(f"{SERVICE_URL}/process-video", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Summary generation successful!")
                
                if result.get('summary'):
                    print(f"📄 Summary length: {len(result['summary'])} characters")
                    print(f"📝 Summary: {result['summary']}")
                
                return True
            else:
                print(f"❌ Summary generation failed: {response.status_code}")
                print(f"Error: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Summary generation error: {str(e)}")
        return False

def test_description_generation(video_path, title="Test Video"):
    """Test description generation with a video file"""
    print(f"📝 Testing description generation with: {video_path}")
    
    if not os.path.exists(video_path):
        print(f"❌ Video file not found: {video_path}")
        return False
    
    try:
        with open(video_path, 'rb') as video_file:
            files = {'video': video_file}
            data = {
                'title': title
            }
            
            response = requests.post(f"{SERVICE_URL}/generate-description", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Description generation successful!")
                
                if result.get('description'):
                    print(f"📝 Description: {result['description']}")
                    print(f"📊 Length: {len(result['description'])} characters")
                
                if result.get('transcript'):
                    print(f"🎤 Transcript length: {len(result['transcript'])} characters")
                
                if result.get('duration_formatted'):
                    print(f"⏱️  Duration: {result['duration_formatted']}")
                
                return True
            else:
                print(f"❌ Description generation failed: {response.status_code}")
                print(f"Error: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Description generation error: {str(e)}")
        return False

def test_full_processing(video_path, title="Test Video"):
    """Test full video processing (summary + timestamps + scenes + description)"""
    print(f"🚀 Testing full video processing with: {video_path}")
    
    if not os.path.exists(video_path):
        print(f"❌ Video file not found: {video_path}")
        return False
    
    try:
        with open(video_path, 'rb') as video_file:
            files = {'video': video_file}
            data = {
                'title': title,
                'type': 'all',
                'scene_method': 'content',
                'threshold': '27.0'
            }
            
            print("⏳ Processing video (this may take a few minutes)...")
            start_time = time.time()
            
            response = requests.post(f"{SERVICE_URL}/process-video", files=files, data=data)
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Full processing successful! (took {processing_time:.2f} seconds)")
                
                # Show results
                if result.get('transcript'):
                    print(f"📝 Transcript length: {len(result['transcript'])} characters")
                
                if result.get('description'):
                    print(f"📝 Description: {result['description']}")
                    print(f"   Length: {len(result['description'])} characters")
                
                if result.get('summary'):
                    print(f"📄 Summary generated: {len(result['summary'])} characters")
                    print(f"   Preview: {result['summary'][:100]}...")
                
                if result.get('timestamps'):
                    print(f"⏰ Timestamps generated: {len(result['timestamps'])} timestamps")
                    for i, ts in enumerate(result['timestamps'][:3]):
                        print(f"   {ts['time']} - {ts['description']}")
                
                if result.get('scenes'):
                    print(f"🎬 Scenes detected: {len(result['scenes'])} scenes")
                
                if result.get('video_info'):
                    info = result['video_info']
                    print(f"📊 Video info: {info.get('duration_formatted', 'Unknown')} duration, {info.get('fps', 'Unknown')} FPS")
                
                return True
            else:
                print(f"❌ Full processing failed: {response.status_code}")
                print(f"Error: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Full processing error: {str(e)}")
        return False

def find_sample_videos():
    """Find sample videos in the current directory"""
    sample_videos = [
        "sample.mp4",
        "test.mp4", 
        "video.mp4",
        "sample_video.mp4",
        "videoFile-1750982251814-685619044.mp4"
    ]
    
    found_videos = []
    for video in sample_videos:
        if os.path.exists(video):
            found_videos.append(video)
    
    return found_videos

def main():
    """Main test function"""
    parser = argparse.ArgumentParser(description='Test AI Video Processing Service')
    parser.add_argument('video', nargs='?', help='Path to video file to test')
    parser.add_argument('--scenes', action='store_true', help='Test only scene detection')
    parser.add_argument('--transcribe', action='store_true', help='Test only transcription')
    parser.add_argument('--summary', action='store_true', help='Test only summary generation')
    parser.add_argument('--description', action='store_true', help='Test only description generation')
    parser.add_argument('--full', action='store_true', help='Test full processing (default)')
    parser.add_argument('--title', default='Test Video', help='Video title for processing')
    
    args = parser.parse_args()
    
    print("🧪 AI Video Processing Service Test")
    print("=" * 50)
    
    # Test 1: Health check
    if not test_health_check():
        print("\n❌ Service is not running. Please start the service first:")
        print("   python api.py")
        return
    
    print("\n" + "=" * 50)
    
    # Determine video file to use
    video_path = args.video
    if not video_path:
        # Look for sample videos
        sample_videos = find_sample_videos()
        if sample_videos:
            video_path = sample_videos[0]
            print(f"📹 Using sample video: {video_path}")
        else:
            print("📹 No video file specified and no sample videos found.")
            print("   Usage: python test_service.py <video_file>")
            print("   Or place a video file in this directory.")
            print("   Supported formats: MP4, AVI, MOV, MKV, WMV, FLV, WebM")
            return
    
    if not os.path.exists(video_path):
        print(f"❌ Video file not found: {video_path}")
        return
    
    # Run specific tests based on arguments
    if args.scenes:
        test_scene_detection(video_path)
    elif args.transcribe:
        test_transcription(video_path)
    elif args.summary:
        test_summary_generation(video_path, args.title)
    elif args.description:
        test_description_generation(video_path, args.title)
    else:
        # Default: test full processing
        test_full_processing(video_path, args.title)
    
    print("\n" + "=" * 50)
    print("✅ Testing completed!")
    print("\n💡 Tips:")
    print("   - Check the console output for detailed logs")
    print("   - Monitor OpenAI usage at https://platform.openai.com/usage")
    print("   - Use shorter videos for faster testing")

if __name__ == "__main__":
    main() 