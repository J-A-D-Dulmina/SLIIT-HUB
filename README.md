[README.md](https://github.com/user-attachments/files/22707214/README.md)
# SLIIT-HUB 🎓

**A Comprehensive Educational Platform for Video-Based Learning, Real-Time Collaboration, and AI-Powered Content Analysis**

[![React](https://img.shields.io/badge/React-18.0.0-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0.0-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-yellow.svg)](https://www.mongodb.com/)
[![Python](https://img.shields.io/badge/Python-3.9+-orange.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

SLIIT-HUB is a modern, comprehensive educational platform designed to facilitate video-based learning, real-time collaboration, and AI-powered content analysis. The system serves students, lecturers, and administrators with role-based access control and cutting-edge web technologies.

### Key Highlights

- **🎥 Video Content Management**: Upload, process, and stream educational videos
- **🤖 AI Integration**: Automatic transcription, summarization, and content analysis
- **💬 Real-Time Communication**: WebRTC-based video conferencing and meetings
- **👥 Role-Based Access**: Separate interfaces for students, lecturers, and administrators
- **📚 Resource Repository**: Comprehensive file management and sharing system
- **📊 Analytics Dashboard**: Performance tracking and insights

## ✨ Features

### 🎓 Student Features
- **Video Upload & Management**: Upload educational videos with metadata
- **Lecturer Review System**: Request reviews and receive feedback
- **Resource Access**: Download and organize educational materials
- **Meeting Participation**: Join virtual classrooms and study sessions
- **Progress Tracking**: Monitor learning progress and achievements

### 👨‍🏫 Lecturer Features
- **Content Review**: Review and approve student video submissions
- **Resource Management**: Upload and organize course materials
- **Meeting Hosting**: Create and manage virtual classrooms
- **Student Monitoring**: Track student progress and engagement
- **Content Creation**: Develop and share educational resources

### 👨‍💼 Administrator Features
- **User Management**: Oversee student and lecturer accounts
- **Degree Management**: Manage academic programs and courses
- **System Monitoring**: Platform-wide analytics and insights
- **Content Moderation**: Ensure content quality and compliance
- **System Announcements**: Broadcast important information

### 🤖 AI-Powered Features
- **Automatic Transcription**: Convert video audio to text using Whisper
- **Content Summarization**: Generate concise video summaries with GPT
- **Scene Detection**: Identify topic transitions and key moments
- **Smart Descriptions**: Auto-generate video descriptions and tags
- **Content Analysis**: Extract insights and patterns from videos

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern UI framework with hooks and context
- **React Router**: Client-side routing and navigation
- **Axios**: HTTP client for API communication
- **CSS3**: Custom styling with CSS variables and modules
- **WebRTC**: Real-time video and audio communication

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database for data persistence
- **Mongoose**: MongoDB object modeling
- **Socket.io**: Real-time bidirectional communication
- **JWT**: JSON Web Token authentication

### AI Services
- **Python 3.9+**: AI processing and analysis
- **Flask**: Lightweight web framework for AI API
- **OpenAI Whisper**: Speech-to-text transcription
- **OpenAI GPT**: Content generation and summarization
- **OpenCV**: Computer vision and scene detection
- **NumPy/Pandas**: Data processing and analysis

### Development Tools
- **Git**: Version control and collaboration
- **npm/yarn**: Package management
- **ESLint**: Code quality and consistency
- **Jest**: Testing framework
- **Docker**: Containerization and deployment

## 🏗️ System Architecture

### Frontend Architecture
```
src/
├── modules/           # Feature-based modules
│   ├── admin/        # Administrative functions
│   ├── ai/           # AI tool interface
│   ├── calendar/     # Calendar and reminders
│   ├── communication/# Meeting system
│   ├── content/      # Video content management
│   ├── lecturer/     # Lecturer review system
│   ├── resources/    # File repository
│   ├── tutoring/     # Student video uploads
│   └── user/         # Authentication and profiles
├── shared/           # Common components
│   ├── components/   # Reusable UI components
│   ├── hooks/        # Custom React hooks
│   └── styles/       # Global CSS and variables
└── services/         # API and WebRTC services
```

### Backend Architecture
```
server/
├── modules/          # Feature modules
│   ├── admin/        # Degree and user management
│   ├── ai/           # AI service integration
│   ├── announcements/# System announcements
│   ├── content/      # Video and comment management
│   ├── lecturer/     # Review workflow
│   ├── meeting/      # Real-time meeting system
│   ├── notifications/# User notifications
│   ├── resources/    # File management
│   ├── tutoring/     # Student video processing
│   └── user/         # Authentication and profiles
├── middleware/       # Auth and validation
├── websocket/        # Real-time communication
└── config/           # Database and environment
```

### AI Service Architecture
```
python_services/
├── api.py            # Flask API endpoints
├── gpt/              # GPT integration service
├── scene_detection/  # Video scene analysis
├── whisper_service/  # Audio transcription
└── tests/            # Comprehensive test suite
```

## 🚀 Installation

### Prerequisites
- Node.js 18.0.0 or higher
- MongoDB 6.0 or higher
- Python 3.9 or higher
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/SLIIT-HUB.git
cd SLIIT-HUB
```

### 2. Install Frontend Dependencies
```bash
cd client
npm install
```

### 3. Install Backend Dependencies
```bash
cd ../server
npm install
```

### 4. Install AI Service Dependencies
```bash
cd ../python_services
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 5. Environment Configuration
```bash
# Copy environment templates
cp .env.example .env
cp python_services/env_template.txt python_services/.env

# Edit environment variables
nano .env
nano python_services/.env
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/sliithub_db

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=24h

# AI Service
AI_SERVICE_URL=http://localhost:5001

# File Upload
MAX_FILE_SIZE=100000000
UPLOAD_PATH=./uploads
```

#### AI Service (python_services/.env)
```bash
# Flask Configuration
FLASK_APP=api.py
FLASK_ENV=development
PORT=5001

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# File Paths
UPLOAD_FOLDER=./uploads
THUMBNAIL_FOLDER=./uploads/thumbnails
```

### Database Setup
```bash
# Start MongoDB
mongod

# Create database
mongo
use sliithub_db
```

## 🎮 Usage

### Starting the Application

#### 1. Start Backend Server
```bash
cd server
npm start
# Server will run on http://localhost:5000
```

#### 2. Start AI Service
```bash
cd python_services
python api.py
# AI service will run on http://localhost:5001
```

#### 3. Start Frontend Application
```bash
cd client
npm start
# Frontend will run on http://localhost:3000
```

### Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:5001
- **MongoDB**: mongodb://localhost:27017

### User Roles and Access

1. **Student Access**
   - Register with student ID and email
   - Upload educational videos
   - Request lecturer reviews
   - Access learning resources

2. **Lecturer Access**
   - Register with department credentials
   - Review student video submissions
   - Create and manage resources
   - Host virtual meetings

3. **Administrator Access**
   - Manage user accounts
   - Oversee degree programs
   - Monitor system performance
   - Create system announcements

## 🧪 Testing

### Running Tests

#### Frontend Tests
```bash
cd client
npm test
```

#### Backend Tests
```bash
cd server
npm test
```

#### AI Service Tests
```bash
cd python_services
python -m pytest tests/
```

### Test Coverage

The application includes comprehensive testing with:
- **52 Functional Test Cases** across all modules
- **AI Model Accuracy Testing** (88.3% overall accuracy)
- **Usability Testing** (91.3% task success rate)
- **Performance and Security Testing**

### Test Results Summary
- **Functional Testing**: 49/52 test cases passed (94.2% success rate)
- **AI Model Accuracy**: 88.3% across all AI services
- **Usability**: 91.3% task success rate
- **Performance**: Handles 100+ concurrent users
- **Security**: All security tests passed

## 📚 API Documentation

### Authentication Endpoints
```http
POST /api/register          # User registration
POST /api/login            # User login
POST /api/admin/login      # Admin login
GET  /api/profile          # Get user profile
PUT  /api/profile          # Update user profile
```

### Video Management Endpoints
```http
POST   /api/tutoring/upload           # Upload video
GET    /api/content/videos            # List videos
GET    /api/content/videos/:id        # Get video details
GET    /api/tutoring/videos/:id/stream # Stream video
POST   /api/tutoring/videos/:id/request-review # Request review
```

### Meeting Endpoints
```http
POST   /api/meetings                  # Create meeting
GET    /api/meetings                  # List meetings
GET    /api/meetings/:id              # Get meeting details
PUT    /api/meetings/:id              # Update meeting
DELETE /api/meetings/:id              # Delete meeting
```

### AI Service Endpoints
```http
POST /api/ai/generate-summary        # Generate video summary
POST /api/ai/generate-timestamps     # Generate video timestamps
POST /api/ai/generate-description    # Generate video description
GET  /api/ai/health                  # AI service health check
```

### Resource Management Endpoints
```http
POST   /api/resources/upload         # Upload resource
GET    /api/resources                # List resources
GET    /api/resources/download/:id   # Download resource
PUT    /api/resources/:id            # Update resource
DELETE /api/resources/:id            # Delete resource
```

## 🚀 Deployment

### Production Deployment

#### 1. Environment Setup
```bash
# Set production environment
NODE_ENV=production
PORT=80
```

#### 2. Build Frontend
```bash
cd client
npm run build
```

#### 3. Start Production Server
```bash
cd server
npm start
```

#### 4. AI Service Deployment
```bash
cd python_services
gunicorn -w 4 -b 0.0.0.0:5001 api:app
```

### Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

#### AI Service Dockerfile
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["python", "api.py"]
```

### Environment Considerations
- **HTTPS**: SSL/TLS certificate configuration
- **Load Balancing**: Nginx reverse proxy setup
- **Monitoring**: Application performance monitoring
- **Backup**: Automated database and file backups

## 🤝 Contributing

We welcome contributions to SLIIT-HUB! Please follow these guidelines:

### Contribution Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and conventions
- Write comprehensive tests for new features
- Update documentation for any API changes
- Ensure all tests pass before submitting

### Code Standards
- Use meaningful variable and function names
- Add comments for complex logic
- Follow ESLint configuration
- Write clear commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **SLIIT**: Sri Lanka Institute of Information Technology
- **OpenAI**: For providing GPT and Whisper APIs
- **React Community**: For the excellent frontend framework
- **Node.js Community**: For the robust backend runtime
- **MongoDB**: For the flexible NoSQL database

## 📞 Support

For support and questions:

- **Email**: support@sliithub.com
- **Issues**: [GitHub Issues](https://github.com/your-username/SLIIT-HUB/issues)
- **Documentation**: [Project Wiki](https://github.com/your-username/SLIIT-HUB/wiki)

## 🔮 Future Roadmap

### Planned Features
- **Mobile Application**: React Native mobile app
- **Advanced Analytics**: Learning progress tracking
- **Machine Learning**: Personalized content recommendations
- **Multi-language Support**: Internationalization
- **Advanced Search**: Elasticsearch integration

### Scalability Improvements
- **Microservices**: Service decomposition
- **Message Queues**: Asynchronous processing
- **CDN Integration**: Content delivery optimization
- **Database Sharding**: Horizontal scaling

---

**SLIIT-HUB** - Empowering Education Through Technology 🚀

*Built with ❤️ by the SLIIT-HUB Development Team*
