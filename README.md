### Chapter 04 – System Development (Updated)

This chapter covers the end‑to‑end implementation of SLIIT‑HUB: React frontend, Express/MongoDB backend, realtime meetings, and a Python AI microservice. It also documents user‑facing features: authentication, calendar, content/videos, tutoring with lecturer review workflow, resources repository, recommendations, and the AI tool.

## 4.1. Frontend Development
React SPA with protected routing and feature‑oriented modules (`content`, `meetings`, `resources`, `tutoring`, `lecturer`, `ai`, `admin`, `user`). Layout uses `SideMenu` + `TopBar`. Auth‑guarded routes redirect unauthenticated users.

- Sign Up/Login: validated forms, error toasts, post‑login redirect to dashboard.
- ProtectedRoute example:
```jsx
// ProtectedRoute.jsx
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  return token ? children : <Navigate to="/login" state={{ from: location }} replace />;
};
```

- Dashboard: entry to Modules, Videos, Calendar, Meetings, AI Tools, Tutoring, Resources, and Lecturer Reviews; sections shown contextually by role.

- Content and Videos: module list → module videos → video details with comments and AI metadata.
```jsx
// VideoDetailsPage.jsx (simplified)
useEffect(() => {
  http.get(`/api/content/videos/${id}`).then(r => setVideo(r.data));
  http.get(`/api/content/${id}/comments`).then(r => setComments(r.data));
}, [id]);
```

- Calendar: personal/academic events with reminders.

- Tutoring + Lecturer Review:
  - Students upload videos, request lecturer review, and add a student note.
  - Lecturers see a review queue with clean cards showing: Title, Owner, Degree name, Year/Sem/Module, Tags (status, AI features), and actions.
  - Recommend/Reject uses confirmation modal; success toast shows after update.

- Real‑time Meetings: WebRTC + WebSocket signaling. Join/leave, media streams, and live session management.
```js
// WebRTCService.js (simplified)
export function createPeer(onTrack) {
  const pc = new RTCPeerConnection();
  pc.ontrack = e => onTrack(e.streams[0]);
  return pc;
}
```

- Resources Repository: browse, upload, update visibility, and download PDFs/docs, with “My” and “Public” views.

- AI Tool: trigger summary, timestamps, and descriptions, orchestrating to Python AI service.
```js
// useAIModel.js (simplified)
export function useAIModel() {
  const generateSummary = (videoId) =>
    http.post('/api/ai/generate-summary', { videoId }).then(r => r.data);
  return { generateSummary };
}
```

- Lecturer Recommendations: cards render degree name (not code/ObjectId), owner name, publish/upload date, and status tags. View opens the standard video page; actions are aligned in one row with confirm dialog and success banner.

- Profile/Admin: profile edits and image upload. Admin manages degrees, lecturers, students, announcements, and content oversight.

## 4.2. Database Development
MongoDB with Mongoose; connection via env, validated at startup.

```js
// db.js
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sliithub_db')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => { console.error('Database connection failed:', err); process.exit(1); });
```

Key models: Users (students/lecturers/admins), Videos/Content, Comments, Meetings, Resources, Degrees, Announcements, and Tutoring videos.

Important tutoring fields: `degree` (ObjectId or code), `reviewStatus`, `reviewLecturer`, `reviewNote`, `aiFeatures`, `duration`, `savedBy`, `likedBy`, `publishDate`.

## 4.3. Backend Development
Express server exposes REST APIs and initializes WebSocket server for meetings. Common middleware: CORS, JSON body parsing, cookies, auth, static uploads.

Mounted routes (actual project structure):
- `/api` → `user`, `lecturer`, `ai`, `meeting`
- `/api/content` → videos
- `/api/resources` → resources
- `/api/announcements`, `/api/admin/degrees`

Example server bootstrap:
```js
// server.js (excerpt)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', require('./modules/user'));
app.use('/api', require('./modules/lecturer'));
app.use('/api/content', require('./modules/content/video.routes'));
app.use('/api/resources', require('./modules/resources'));
```

Authentication: JWT via middleware. Protected endpoints check `req.user.type` for role‑based authorization.

Content: upload, list, details, comments. Meetings: create/join with socket events. AI: proxy to Python microservice endpoints.

AI controller example:
```js
// ai/controller.js (simplified)
const generateSummary = async (req, res) => {
  try {
    const { videoId } = req.body;
    const response = await axios.post(`${AI_SERVICE_URL}/summary`, { videoId });
    res.json(response.data);
  } catch {
    res.status(500).json({ error: 'AI service unavailable' });
  }
};
```

Lecturer Review workflow highlights:
- Student requests review (with optional note): stores `reviewLecturer`, sets `reviewStatus='pending'`, saves `reviewNote`.
- Lecturer queue returns enriched items: `studentName`, `degreeDisplay` (always a readable name), `year`, `semester`, `module`, `publishDate/addDate`, `aiFeatures`.
- Lecturer updates decision: sets `recommended`/`rejected`; confirmation dialog on UI; success toast.

Degree name resolution
- On queue API, backend returns `degreeDisplay` resolving in order: object.name → lookup by code → lookup by _id → raw string. Frontend uses `degreeDisplay` and hides ObjectIds.

## 4.4. AI Model Integration
Python microservice handles video intelligence: transcription (Whisper), summaries, timestamps, descriptions, and scene detection. Independent venv with `requirements.txt`, start scripts for Windows/Linux.

```python
# api.py (simplified)
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route('/summary', methods=['POST'])
def create_summary():
    # receive video or id, run pipeline, return JSON
    return jsonify({'summary': '...generated...'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
```

Backend → AI flow: health check, file mapping by video ID, stream multipart data, parse structured results; isolates heavy compute for scalability.

## 4.5. Real-time Communication (Meetings)
WebSocket server initializes with HTTP server; rooms and signaling support P2P WebRTC sessions.

```js
// meetingSocket.js (simplified)
io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);
  });
  socket.on('disconnect', () => socket.broadcast.emit('user-disconnected', socket.userId));
});
```

Frontend consumes this channel to render participant joins/leaves and render media streams.

## 4.6. Report, Help, and Guidance
- Resources: public/mine lists, secure downloads, visibility controls.
- Tutoring guidance: upload flow, AI processing, review requests with notes.
- Lecturer recommendations: prominent tags, consistent degree name, aligned actions, and confirmation feedback.
- Admin: degrees, lecturers, students, announcements, and content oversight.
- Help docs can be added using existing layout and routing for structured user guidance.

# SLIIT-HUB – Full Project Documentation

SLIIT-HUB is a full-stack learning and collaboration platform featuring secure authentication, content and video management, resources, tutoring, lecturer recommendations, real-time meetings, and AI-assisted video intelligence. The stack includes a React frontend, Node.js/Express backend with MongoDB, a Python AI microservice, and WebSocket-based real-time communication.

## Table of Contents
- Project Overview
- Features
- Architecture
- Getting Started (Setup & Run)
- Environment Configuration
- Chapter 04 – System Development
  - 4.1. Frontend Development
  - 4.2. Database Development
  - 4.3. Backend Development
  - 4.4. AI Model Integration
  - 4.5. Real-time Communication (Meetings)
  - 4.6. Report, Help, and Guidance
- Appendices
  - Appendix A: Frontend UI Mapping (React)
  - Appendix B: Backend API Endpoints (Express)
  - Appendix C: Database and Storage
  - Appendix D: Real-time Communication and WebRTC
  - Appendix E: AI Service Integration (Python)
  - Appendix F: Admin Module
  - Appendix G: Suggested Screenshot List
  - Appendix H: Endpoint-to-UI Crosswalk

---

## Project Overview
SLIIT-HUB streamlines student learning with a modular content system, integrated meetings, resource sharing, tutoring support, AI-enhanced video processing, and an administration console. It enforces authenticated access to core features and offers a consistent UX for both students and admins.

## Features
- Authentication and profile management
- Modular content & videos with comments
- Resource repository (upload, download)
- Calendar with reminders
- Tutoring flows and lecturer reviews
- Real-time meetings (WebSocket + WebRTC)
- AI tool for video summaries, timestamps, descriptions, and scene detection
- Admin dashboard (degrees, lecturers, students, videos, announcements, admins)

## Architecture
- Frontend: React SPA with React Router and protected routes
- Backend: Node.js + Express REST APIs
- Database: MongoDB with Mongoose
- Real-time: WebSocket server for meetings
- AI: Python microservice for model-heavy tasks (Whisper, scene detection, GPT-based summarization)

Directory layout (key parts):
- `client/` – React application (pages by feature)
- `server/` – Express server, routes per module, WebSocket server
- `python_services/` – Python AI microservice and utilities
- `shared/` – shared constants and types

---

## Getting Started (Setup & Run)

### Prerequisites
- Node.js LTS and npm
- Python 3.10+ and virtualenv (or venv)
- MongoDB running locally or a cloud URI

### Backend (server)
1. `cd server`
2. `npm install`
3. Create `.env` with:
   - `PORT=5000`
   - `MONGO_URI=mongodb://localhost:27017/sliithub_db`
4. `npm start`

### Frontend (client)
1. `cd client`
2. `npm install`
3. `npm start`

### AI Service (python_services)
1. `cd python_services`
2. Create and activate virtual environment:
   - Windows PowerShell: `python -m venv venv && .\venv\Scripts\Activate.ps1`
   - macOS/Linux: `python3 -m venv venv && source venv/bin/activate`
3. `pip install -r requirements.txt`
4. Start service:
   - Windows: `start_service.bat`
   - macOS/Linux: `./start_service.sh`

Ensure the AI service health endpoint responds (default `http://localhost:5001/health`).

---

## Environment Configuration
- Backend: `MONGO_URI`, `PORT`, any AI service base URL if configurable
- Client: API base URL configuration (if applicable)
- Python service: model paths and optional environment variables referenced in `api.py`

---

## Chapter 04 – System Development

This chapter documents the technical development of the SLIIT-HUB application. It covers frontend implementation in React, backend development with Node.js/Express, database setup using MongoDB/Mongoose, real-time meeting infrastructure, and AI service integration via a Python microservice. It also describes user-facing features such as authentication, calendar, content and resources, tutoring, lecturer recommendations, and an AI tool for video intelligence.

### 4.1. Frontend Development
The frontend is a single-page application built with React (React Router, protected routes, modular feature pages). The UI emphasizes clarity and quick access to learning resources, meetings, and AI tools. Routes are secured using a `ProtectedRoute` wrapper to ensure authenticated access to core features.

Implemented pages and features:
1) Sign Up and Login functionalities
- Users can register and sign in via Register and Login pages. Basic recovery via Forgot Password.
- Post-login navigation lands on the dashboard. Route protection redirects unauthenticated users to the login screen.

2) Dashboard function
- The dashboard acts as the hub for key modules: modules/content, videos, calendar, meetings, AI tool, tutoring, resources, and lecturer recommendations.

3) Content and Video features
- Organize learning units, list videos per module, and provide a detailed video page with comments.

4) Calendar with reminders feature
- Calendar view for academic scheduling and reminders.

5) Tutoring feature
- Session discovery and interaction with tutoring content.

6) Real-time Meetings feature
- Pages to join, manage, and participate in meetings; integrates with WebSocket for live session signaling.

7) Resources repository
- Browse and download shared materials uploaded via backend.

8) AI Tool feature
- Run AI-assisted operations on videos (summary, timestamps, descriptions). Orchestrates requests to backend AI endpoints.

9) Lecturer Recommendations
- View lecturer-provided recommendations tied to user’s profile and modules.

10) Profile and Admin
- User profile details; admin pages for management of degrees, lecturers, students, videos, announcements, admins.

### 4.2. Database Development
The application uses MongoDB with Mongoose. The connection is configured via `MONGO_URI` with a local default for development. The backend initializes the database connection during server startup and logs health. Models define collections for users, content/videos, meetings, resources, tutoring, and admin domains.

### 4.3. Backend Development
The backend is an Express server that exposes REST APIs for users, content, meetings, resources, tutoring, admin, and AI processing. It also establishes a WebSocket server for real-time meeting functionality. Middleware manages CORS, cookies, JSON parsing, and authentication.

- Server initialization, middleware, and WebSocket bootstrapping connect to MongoDB, start the HTTP server, and initialize the meeting socket server.
- Modules:
  - Users/auth: login, register, profile, admin management
  - Content: videos CRUD, comments
  - Meetings: creation/join, state, recording files, stats; real-time signaling via WS
  - Resources: upload/list/download/delete
  - Tutoring: video publishing, reactions, edit/delete
  - Admin: degrees, lecturers, students, videos, announcements, admins
  - AI: generation endpoints that proxy to the Python AI service

### 4.4. AI Model Integration
AI features are implemented as a Python microservice invoked by the Node backend via HTTP. Responsibilities include scene detection, transcription (Whisper), summarization, timestamps, and description generation. The Express AI controller verifies Python service health, maps Mongo video IDs to files, streams as multipart form-data, and returns structured results to the frontend.

- Python service: `python_services/` (api.py, gpt_service.py, scene_detector.py, whisper_service.py)
- Start scripts for Windows and POSIX systems
- Decoupled design allows independent scaling and updates

### 4.5. Real-time Communication (Meetings)
The WebSocket server supports meeting sessions with real-time signaling. The socket server is initialized alongside the HTTP server and integrates with meeting routes to synchronize join/leave, start/end, and recording events. The frontend `MeetingPage` interacts with this channel, supported by `WebRTCService.js` for peer connection orchestration.

### 4.6. Report, Help, and Guidance
The platform provides resource downloads, lecturer recommendations, and tutoring guidance, with clear navigation and protected routing. Admin tooling offers oversight and content management. A dedicated “Help” page can be added under client routes to centralize usage guidance.

---

## Appendices

### Appendix A: Frontend UI Mapping (React)
- Auth
  - `client/src/modules/user/components/LoginPage.jsx`
  - `client/src/modules/user/components/RegisterPage.jsx`
  - `client/src/modules/user/components/ForgotPasswordPage.jsx`
  - `client/src/shared/components/ProtectedRoute.jsx`
- Dashboard
  - `client/src/modules/user/components/LandingPage.jsx`
  - Routes: `client/src/routes.js`
- Profile
  - `client/src/modules/user/components/ProfilePage.jsx`
- Content & Videos
  - `client/src/modules/content/components/ModuleListPage.jsx`
  - `client/src/modules/content/components/ModulePage.jsx`
  - `client/src/modules/content/components/VideoListPage.jsx`
  - `client/src/modules/content/components/VideoDetailsPage.jsx`
- Calendar
  - `client/src/modules/calendar/components/CalendarPage.jsx`
- Meetings
  - `client/src/modules/meetings/components/JoinMeetingPage.jsx`
  - `client/src/modules/meetings/components/MyMeetingsPage.jsx`
  - `client/src/modules/communication/components/MeetingPage.jsx`
  - WebRTC helper: `client/src/services/WebRTCService.js`
- Resources
  - `client/src/modules/resources/components/ResourcesPage.jsx`
- Tutoring
  - `client/src/modules/tutoring/components/TutoringPage.jsx`
  - `client/src/modules/tutoring/components/VideoEditPage.jsx`
  - `client/src/modules/tutoring/components/LecturerReviewDialog.jsx`
- AI Tool
  - `client/src/modules/ai/components/AIToolPage.jsx`
  - `client/src/modules/ai/components/AISummaryGenerator.jsx`
  - `client/src/modules/ai/components/AITimestampsGenerator.jsx`
  - `client/src/modules/ai/components/AIDescriptionGenerator.jsx`
  - Hook: `client/src/modules/ai/hooks/useAIModel.js`
- Lecturer
  - `client/src/modules/lecturer/components/MyRecommendationsPage.jsx`
- Admin
  - Layout & Navigation: `AdminLayout.jsx`, `AdminSidebar.jsx`
  - Pages: `AdminDashboardHome.jsx`, `AdminDegreesPage.jsx`, `AdminLecturersPage.jsx`, `AdminStudentsPage.jsx`, `AdminVideosPage.jsx`, `AdminAnnouncementsPage.jsx`, `AdminAdminsPage.jsx`
  - Login: `AdminLoginPage.jsx`

### Appendix B: Backend API Endpoints (Express)
- Users & Auth (`server/modules/user/routes.js`)
  - POST `/api/user/login`
  - POST `/api/user/register`
  - GET `/api/user/protected` (JWT)
  - PUT `/api/user/profile`
  - Admin: GET/POST/PUT/DELETE `/api/user/admins`
  - Admin login: POST `/api/user/admin/login`
- Content – Videos (`server/modules/content/video.routes.js`)
  - `POST /api/content/videos`
  - `GET /api/content/videos`
  - `GET /api/content/videos/:id`
  - `PUT /api/content/videos/:id`
  - `DELETE /api/content/videos/:id`
- Content – Comments (`server/modules/content/comment.routes.js`)
  - `GET /api/content/:videoId/comments`
  - `POST /api/content/:videoId/comments`
  - `POST /api/content/comments/:commentId/replies`
  - `PUT /api/content/comments/:commentId`
  - `DELETE /api/content/comments/:commentId`
- Resources (`server/modules/resources/routes.js`)
  - `POST /api/resources/upload`
  - `GET /api/resources`
  - `GET /api/resources/download/:id`
  - `DELETE /api/resources/:id`
- Meetings (`server/modules/meeting/routes.js`)
  - `POST /api/meeting/`
  - `GET /api/meeting/`
  - `GET /api/meeting/public`
  - `GET /api/meeting/my-meetings`
  - `GET /api/meeting/:id`
  - `PUT /api/meeting/:id`
  - `DELETE /api/meeting/:id`
  - `POST /api/meeting/:meetingId/join`
  - `POST /api/meeting/:meetingId/leave`
  - `POST /api/meeting/:meetingId/start`
  - `POST /api/meeting/:meetingId/participate`
  - `POST /api/meeting/:meetingId/leave-participation`
  - `POST /api/meeting/:meetingId/end`
  - `POST /api/meeting/:meetingId/recording/start`
  - `POST /api/meeting/:meetingId/recording/stop`
  - `POST /api/meeting/:meetingId/recordings`
  - `GET /api/meeting/:meetingId/recordings`
  - `GET /api/meeting/:meetingId/stats`
- Tutoring (`server/modules/tutoring/routes.js`)
  - `GET /api/tutoring/videos/published`
  - `POST /api/tutoring/upload`
  - `GET /api/tutoring/videos`
  - `GET /api/tutoring/videos/:videoId`
  - `GET /api/tutoring/video/:videoId`
  - `GET /api/tutoring/thumbnail/:videoId`
  - `PUT /api/tutoring/videos/:videoId`
  - `DELETE /api/tutoring/videos/:videoId`
  - `POST /api/tutoring/videos/:videoId/like`
- Lecturer (`server/modules/lecturer/routes.js`)
  - `POST /api/lecturer/admin/lecturers`
- Admin – Degrees (`server/modules/admin/degree.routes.js`)
  - `POST /api/admin/degrees`
  - `GET /api/admin/degrees`
  - `GET /api/admin/degrees/:id`
  - `PUT /api/admin/degrees/:id`
  - `DELETE /api/admin/degrees/:id`
- AI (`server/modules/ai/routes.js`)
  - `POST /api/ai/generate-summary`
  - `POST /api/ai/generate-description`
  - `POST /api/ai/generate-timestamps`
  - `POST /api/ai/detect-scenes`
  - `POST /api/ai/process-video`
  - `GET /api/ai/test-video/:videoId`
  - `GET /api/ai/comprehensive-test/:videoId`
  - `GET /api/ai/health`

### Appendix C: Database and Storage
- Database: MongoDB + Mongoose
  - Connection: `server/config/db.js`, `server/server.js`
  - Representative models under `server/modules/*/model.js`

### Appendix D: Real-time Communication and WebRTC
- WebSocket server: `server/websocket/meetingSocket.js`
- HTTP+WS bootstrap: `server/server.js`
- Client signaling & peer management: `client/src/services/WebRTCService.js`
- Meeting UI: `JoinMeetingPage.jsx`, `MyMeetingsPage.jsx`, `MeetingPage.jsx`

### Appendix E: AI Service Integration (Python)
- Python microservice: `python_services/`
  - Entrypoint: `api.py`
  - GPT: `gpt/gpt_service.py`
  - Scene detection: `scene_detection/scene_detector.py`
  - Whisper/transcription: `whisper_service/`
  - Utilities: `common/video_processor.py`
  - Requirements: `requirements.txt`; launchers: `start_service.sh`, `start_service.bat`
- Backend integration: `server/modules/ai/controller.js`
- Frontend integration: `AIToolPage.jsx`, AI generator components, `useAIModel.js`

### Appendix F: Admin Module
- UI: `client/src/modules/admin/components/*`
- APIs: degrees (`/api/admin/degrees`), users/admins (`/api/user/*`), content/tutoring

### Appendix G: Suggested Screenshot List
- Auth: Login, Register, Forgot Password
- Dashboard: LandingPage
- Profile: ProfilePage
- Content & Videos: ModuleList, Module, VideoList, VideoDetails (with comments)
- Calendar: CalendarPage with add note dialog
- Meetings: JoinMeeting, MyMeetings, Meeting (join flow)
- Resources: ResourcesPage upload/download
- Tutoring: TutoringPage, VideoEditPage, LecturerReviewDialog
- AI Tool: AIToolPage (summary, timestamps, description)
- Lecturer: MyRecommendationsPage
- Admin: AdminDashboardHome, AdminDegrees, AdminLecturers, AdminStudents, AdminVideos, AdminAnnouncements, AdminAdmins
- Health: AI /health response, server status route

### Appendix H: Endpoint-to-UI Crosswalk
- `/api/user/login`, `/api/user/register` → LoginPage, RegisterPage
- `/api/content/videos`, `/api/content/videos/:id` → VideoListPage, VideoDetailsPage
- `/api/content/:videoId/comments` → VideoDetailsPage
- `/api/resources/*` → ResourcesPage
- `/api/meeting/*` → JoinMeetingPage, MyMeetingsPage, MeetingPage
- `/api/ai/*` → AIToolPage + AI generators
- `/api/admin/degrees` → AdminDegreesPage
- `/api/user/admins` → AdminAdminsPage
- `/api/user/admin/login` → AdminLoginPage

---

## License
This repository is intended for academic and internal development use. Add your chosen license here.
