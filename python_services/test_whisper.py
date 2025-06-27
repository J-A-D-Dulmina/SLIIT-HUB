#!/usr/bin/env python3
"""
Test script to diagnose Whisper installation issues
"""

import sys
import os

def test_whisper_import():
    """Test if Whisper can be imported"""
    try:
        print("Testing Whisper import...")
        import whisper
        print(f"✅ Whisper imported successfully")
        
        # Try to get version, but don't fail if it doesn't exist
        try:
            version = whisper.__version__
            print(f"   Version: {version}")
        except AttributeError:
            print("   Version: Not available (this is normal for some versions)")
        
        return whisper
    except ImportError as e:
        print(f"❌ Whisper import failed: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

def test_whisper_api(whisper_module):
    """Test Whisper API methods"""
    try:
        print("\nTesting Whisper API...")
        
        # Test if load_model exists
        if hasattr(whisper_module, 'load_model'):
            print("✅ load_model method exists")
        else:
            print("❌ load_model method not found")
            print(f"   Available methods: {[m for m in dir(whisper_module) if not m.startswith('_')]}")
            return False
        
        # Test if we can create a model
        try:
            print("   Loading base model...")
            model = whisper_module.load_model("base")
            print("✅ Model loaded successfully")
            return True
        except Exception as e:
            print(f"❌ Model loading failed: {e}")
            return False
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def test_whisper_service():
    """Test our WhisperService class"""
    try:
        print("\nTesting WhisperService...")
        
        from whisper_service.whisper_service import WhisperService
        
        service = WhisperService()
        print("✅ WhisperService created successfully")
        
        # Test import method
        whisper_module = service._import_whisper()
        if whisper_module:
            print("✅ Whisper import through service successful")
            return True
        else:
            print("❌ Whisper import through service failed")
            return False
            
    except Exception as e:
        print(f"❌ WhisperService test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("Whisper Installation Diagnostic")
    print("=" * 40)
    
    # Test 1: Direct import
    whisper_module = test_whisper_import()
    if not whisper_module:
        print("\n❌ Whisper is not properly installed.")
        print("   Try: pip uninstall openai-whisper")
        print("   Then: pip install openai-whisper")
        return False
    
    # Test 2: API methods
    if not test_whisper_api(whisper_module):
        print("\n❌ Whisper API is not working correctly.")
        return False
    
    # Test 3: Our service
    if not test_whisper_service():
        print("\n❌ Our WhisperService has issues.")
        return False
    
    print("\n✅ All tests passed! Whisper is working correctly.")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 