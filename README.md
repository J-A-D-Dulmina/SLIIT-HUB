# SLIIT-HUB - Comprehensive User Manual

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Installation & Setup](#installation--setup)
4. [Features & Modules](#features--modules)
5. [User Guide](#user-guide)
6. [Administrator Guide](#administrator-guide)
7. [API Documentation](#api-documentation)
8. [Troubleshooting](#troubleshooting)
9. [Development Guide](#development-guide)
10. [Contributing](#contributing)

## Project Overview

**SLIIT-HUB** is a comprehensive educational platform designed for Sri Lanka Institute of Information Technology (SLIIT). It provides a modern, integrated learning environment that combines traditional academic content with cutting-edge AI tools, real-time communication, and resource management.

### Key Features
- **Multi-User Platform**: Support for students, lecturers, and administrators
- **Content Management**: Video lectures, modules, and educational resources
- **AI-Powered Tools**: Intelligent tutoring and content analysis
- **Real-Time Communication**: Video meetings and WebRTC support
- **Resource Hub**: Document sharing and management system
- **Responsive Design**: Modern UI/UX optimized for all devices

### Target Users
- **Students**: Access learning materials, join tutoring sessions, participate in meetings
- **Lecturers**: Upload content, conduct meetings, manage student interactions
- **Administrators**: System management, user administration, content oversight

## System Architecture

The SLIIT-HUB platform consists of three main components:

### 1. Frontend (React.js)
- **Location**: `client/` directory
- **Technology**: React 18, Redux Toolkit, React Router
- **UI Framework**: Custom CSS with React Icons
- **State Management**: Redux for global state, local state for components

### 2. Backend (Node.js)
- **Location**: `server/` directory
- **Technology**: Express.js, MongoDB, WebSocket
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: WebSocket server for live communication

### 3. AI Services (Python)
- **Location**: `python_services/` directory
- **Technology**: Flask, OpenAI Whisper, Scene Detection
- **Features**: Video processing, AI analysis, automated testing

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+
- MongoDB (v4.4 or higher)
- Git

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd SLIIT-HUB
```

### Step 2: Frontend Setup
```bash
cd client
npm install
```

**Environment Configuration**: Create `.env` file in client directory:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WEBSOCKET_URL=ws://localhost:5000
```

### Step 3: Backend Setup
```bash
cd ../server
npm install
```

**Environment Configuration**: Create `.env` file in server directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/sliithub
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

### Step 4: Python Services Setup
```bash
cd ../python_services
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

**Environment Configuration**: Create `.env` file in python_services directory:
```env
FLASK_ENV=development
OPENAI_API_KEY=your_openai_api_key
FLASK_APP=api.py
```

### Step 5: Database Setup
1. Start MongoDB service
2. Create database: `sliithub`
3. Import initial data if available

### Step 6: Start Services

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

**Terminal 3 - Python Services:**
```bash
cd python_services
python api.py
```

## Features & Modules

### 1. User Management Module
**Location**: `client/src/modules/user/`

**Features:**
- User registration and authentication
- Profile management
- Password recovery
- Role-based access control

**Key Components:**
- `LoginPage.jsx` - User authentication
- `RegisterPage.jsx` - New user registration
- `ProfilePage.jsx` - User profile management
- `ForgotPasswordPage.jsx` - Password recovery

### 2. Content Management Module
**Location**: `client/src/modules/content/`

**Features:**
- Module organization by degree and year
- Video lecture management
- Content categorization
- Search and filtering

**Key Components:**
- `ModuleListPage.jsx` - Browse available modules
- `ModulePage.jsx` - Individual module view
- `VideoListPage.jsx` - Video content listing
- `VideoDetailsPage.jsx` - Video player and details

### 3. AI Tools Module
**Location**: `client/src/modules/ai/`

**Features:**
- AI-powered tutoring assistance
- Content analysis and recommendations
- Intelligent search capabilities
- Automated content processing

**Key Components:**
- `AIToolPage.jsx` - Main AI interface
- `gpt_service.py` - OpenAI integration
- `whisper_service.py` - Audio transcription

### 4. Meeting & Communication Module
**Location**: `client/src/modules/meetings/` & `client/src/modules/communication/`

**Features:**
- Real-time video meetings
- WebRTC integration
- Meeting scheduling and management
- Participant controls

**Key Components:**
- `MeetingPage.jsx` - Video meeting interface
- `JoinMeetingPage.jsx` - Meeting entry point
- `MyMeetingsPage.jsx` - Meeting management
- `meetingSocket.js` - WebSocket server

### 5. Resources Module
**Location**: `client/src/modules/resources/`

**Features:**
- Document upload and sharing
- Resource categorization
- Search and filtering
- Access control and permissions

**Key Components:**
- `ResourcesPage.jsx` - Main resources interface
- `UploadResourceModal.jsx` - File upload
- Resource management and sharing

### 6. Tutoring Module
**Location**: `client/src/modules/tutoring/`

**Features:**
- Tutoring session management
- Student-tutor matching
- Session scheduling
- Progress tracking

### 7. Calendar Module
**Location**: `client/src/modules/calendar/`

**Features:**
- Event scheduling
- Meeting coordination
- Academic calendar integration
- Reminder system

### 8. Admin Module
**Location**: `client/src/modules/admin/`

**Features:**
- User administration
- Content oversight
- System configuration
- Analytics and reporting

**Key Components:**
- `AdminLayout.jsx` - Admin dashboard
- `AdminDashboardHome.jsx` - Overview
- User, content, and system management pages

## User Guide

### Getting Started

#### 1. First Login
1. Navigate to the login page
2. Enter your credentials (provided by administrator)
3. Complete profile setup if prompted
4. Explore the dashboard

#### 2. Navigation
- **Sidebar Menu**: Access all modules and features
- **Top Bar**: User profile, notifications, and quick actions
- **Breadcrumbs**: Navigate through hierarchical content

#### 3. Dashboard Overview
- **Quick Actions**: Common tasks and shortcuts
- **Recent Activity**: Latest updates and notifications
- **Quick Access**: Frequently used modules and resources

### Using the Platform

#### Content Access
1. **Browse Modules**: Navigate to "Units" from the main menu
2. **Select Degree/Year**: Choose your academic program
3. **Access Content**: Click on modules to view available resources
4. **Watch Videos**: Use the integrated video player
5. **Download Resources**: Access supplementary materials

#### Resource Management
1. **Upload Files**: Use the upload button in resources section
2. **Organize Content**: Categorize by type, degree, year, semester
3. **Set Permissions**: Choose public or private visibility
4. **Share Resources**: Generate shareable links
5. **Search & Filter**: Find specific content quickly

#### Meeting Participation
1. **Join Meetings**: Use meeting links or codes
2. **Video Controls**: Mute/unmute, camera on/off
3. **Screen Sharing**: Present content to participants
4. **Chat**: Use text chat during meetings
5. **Recording**: Access meeting recordings if available

#### AI Tools Usage
1. **Access AI Tools**: Navigate to AI section
2. **Ask Questions**: Get intelligent responses
3. **Content Analysis**: Analyze uploaded materials
4. **Learning Recommendations**: Receive personalized suggestions

### Best Practices

#### Content Organization
- Use descriptive titles and descriptions
- Categorize resources properly
- Set appropriate visibility settings
- Tag content with relevant keywords

#### Meeting Etiquette
- Test audio/video before joining
- Use headphones in shared spaces
- Mute when not speaking
- Respect meeting schedules

#### Resource Sharing
- Verify file permissions before sharing
- Use appropriate file formats
- Include context with shared materials
- Respect intellectual property rights

## Administrator Guide

### System Administration

#### User Management
1. **Access Admin Panel**: Login with admin credentials
2. **View Users**: Monitor all registered users
3. **Manage Roles**: Assign user permissions
4. **User Actions**: Enable/disable accounts, reset passwords

#### Content Oversight
1. **Review Uploads**: Monitor new content
2. **Content Moderation**: Approve or reject materials
3. **Quality Control**: Ensure content standards
4. **Storage Management**: Monitor disk usage

#### System Configuration
1. **Degree Programs**: Manage academic structures
2. **Module Configuration**: Set up course modules
3. **System Settings**: Configure platform parameters
4. **Backup & Recovery**: System maintenance

### Monitoring & Analytics

#### Usage Statistics
- **User Activity**: Login patterns and usage
- **Content Metrics**: Popular resources and downloads
- **Meeting Statistics**: Participation and duration
- **System Performance**: Response times and errors

#### Performance Monitoring
- **Server Health**: CPU, memory, and disk usage
- **Database Performance**: Query times and connections
- **Network Status**: API response times
- **Error Tracking**: Log analysis and alerts

## API Documentation

### Authentication
All API requests require authentication via JWT tokens.

```javascript
// Example API call
const response = await fetch('/api/resources', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Key Endpoints

#### User Management
- `POST /api/login` - User authentication
- `POST /api/register` - User registration
- `GET /api/profile` - User profile
- `PUT /api/profile` - Update profile

#### Content Management
- `GET /api/content/modules` - List modules
- `GET /api/content/videos` - List videos
- `POST /api/content/upload` - Upload content

#### Resources
- `GET /api/resources` - List resources
- `POST /api/resources/upload` - Upload resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource

#### Meetings
- `GET /api/meetings` - List meetings
- `POST /api/meetings/create` - Create meeting
- `GET /api/websocket/status` - WebSocket status

### WebSocket Events

#### Meeting Events
- `join-room` - Join meeting room
- `leave-room` - Leave meeting room
- `user-joined` - User joined notification
- `user-left` - User left notification
- `message` - Chat message

## Troubleshooting

### Common Issues

#### Frontend Issues
1. **Page Not Loading**
   - Check browser console for errors
   - Verify API server is running
   - Clear browser cache and cookies

2. **Authentication Problems**
   - Verify login credentials
   - Check JWT token expiration
   - Clear stored authentication data

3. **Video Playback Issues**
   - Check internet connection
   - Verify video file format
   - Update browser to latest version

#### Backend Issues
1. **Server Not Starting**
   - Check MongoDB connection
   - Verify environment variables
   - Check port availability

2. **Database Connection Errors**
   - Verify MongoDB service status
   - Check connection string
   - Verify database permissions

3. **File Upload Failures**
   - Check disk space
   - Verify file permissions
   - Check file size limits

#### Python Services Issues
1. **AI Services Not Responding**
   - Check Python environment
   - Verify API keys
   - Check service logs

2. **Video Processing Failures**
   - Verify FFmpeg installation
   - Check file formats
   - Monitor system resources

### Error Codes

#### HTTP Status Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

#### Common Error Messages
- `"Authentication failed"` - Invalid credentials
- `"File too large"` - Exceeds size limit
- `"Invalid file type"` - Unsupported format
- `"Database connection failed"` - MongoDB issue

### Performance Optimization

#### Frontend
- Enable code splitting
- Optimize bundle size
- Use lazy loading for routes
- Implement caching strategies

#### Backend
- Database indexing
- Query optimization
- Connection pooling
- Rate limiting

#### Database
- Regular maintenance
- Index optimization
- Query analysis
- Backup strategies

## Development Guide

### Development Environment Setup

#### Prerequisites
- Node.js development tools
- Python development environment
- MongoDB development instance
- Git workflow setup

#### Development Scripts
```bash
# Frontend development
cd client
npm run start

# Backend development
cd server
npm run dev

# Python services
cd python_services
python api.py

# Testing
npm test
python -m pytest
```

### Code Structure

#### Frontend Architecture
```
src/
├── modules/          # Feature modules
├── shared/           # Common components
├── services/         # API services
├── styles/           # Global styles
└── utils/            # Utility functions
```

#### Backend Architecture
```
server/
├── modules/          # Feature modules
├── middleware/       # Custom middleware
├── config/           # Configuration files
├── websocket/        # WebSocket handlers
└── utils/            # Utility functions
```

#### Python Services
```
python_services/
├── gpt/              # AI services
├── whisper_service/  # Audio processing
├── scene_detection/  # Video analysis
└── tests/            # Test suite
```

### Testing

#### Frontend Testing
```bash
cd client
npm test              # Run all tests
npm run test:coverage # Coverage report
npm run test:watch    # Watch mode
```

#### Backend Testing
```bash
cd server
npm test              # Run tests
npm run test:watch    # Watch mode
```

#### Python Testing
```bash
cd python_services
python -m pytest      # Run all tests
python -m pytest -v   # Verbose output
python -m pytest --cov # Coverage report
```

### Deployment

#### Production Build
```bash
# Frontend
cd client
npm run build

# Backend
cd server
npm run build
```

#### Environment Configuration
- Set production environment variables
- Configure production database
- Set up SSL certificates
- Configure reverse proxy

#### Monitoring & Logging
- Application performance monitoring
- Error tracking and alerting
- Log aggregation and analysis
- Health check endpoints

## Contributing

### Development Workflow
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature-name`
3. **Make changes**: Follow coding standards
4. **Test thoroughly**: Ensure all tests pass
5. **Submit pull request**: Include detailed description

### Coding Standards
- **JavaScript**: ESLint configuration
- **Python**: PEP 8 compliance
- **CSS**: BEM methodology
- **Git**: Conventional commit messages

### Documentation
- Update README for new features
- Document API changes
- Include usage examples
- Maintain changelog

### Testing Requirements
- Unit tests for new features
- Integration tests for API changes
- UI tests for frontend components
- Performance testing for critical paths

---

## Support & Contact

### Getting Help
- **Documentation**: Check this README first
- **Issues**: Use GitHub issue tracker
- **Discussions**: GitHub discussions for questions
- **Email**: Contact development team

### Reporting Bugs
1. Check existing issues
2. Create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Screenshots/logs if applicable

### Feature Requests
- Use GitHub discussions
- Provide use case details
- Consider implementation complexity
- Prioritize based on user needs

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainers**: SLIIT Development Team
