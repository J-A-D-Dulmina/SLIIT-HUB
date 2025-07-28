import React from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { FaLink, FaPlay } from 'react-icons/fa';
import '../styles/UpcomingMeetings.css';

const UpcomingMeetings = ({ events }) => {
  const navigate = useNavigate();

  // Filter only upcoming meetings based on backend status and get the first one
  const upcomingMeeting = events
    .filter(event => {
      const status = event.computedStatus || event.status;
      return status === 'upcoming' || status === 'starting-soon';
    })
    .sort((a, b) => new Date(a.startTime || a.start) - new Date(b.startTime || b.start))[0];

  // Format meeting time
  const formatMeetingTime = (date) => {
    return moment(date).format('MMM D, YYYY [at] HH:mm');
  };

  // Get module details from backend data
  const getModuleDetails = (meeting) => {
    return {
      year: meeting.resource?.year || meeting.year || 'N/A',
      semester: meeting.resource?.semester || meeting.semester || 'N/A',
      module: meeting.resource?.module || meeting.module || 'N/A',
      coordinator: meeting.resource?.hostName || meeting.hostName || 'N/A'
    };
  };

  return (
    <div className="upcoming-meetings-card">
      <h3>Upcoming Meeting</h3>
      {!upcomingMeeting ? (
        <div className="no-meetings">No upcoming meetings</div>
      ) : (
        <div className="meeting-list">
          <div className="meeting-item">
            <div className="meeting-header">
              <div className="meeting-details">
                <h4 className="meeting-title">{upcomingMeeting.title}</h4>
                <div className="meeting-description">
                  {upcomingMeeting.resource?.description || upcomingMeeting.description || 'No description available'}
                </div>
                <div className="meeting-meta">
                  <span>{getModuleDetails(upcomingMeeting).year}</span>
                  <span>{getModuleDetails(upcomingMeeting).semester}</span>
                  <span>{getModuleDetails(upcomingMeeting).module}</span>
                </div>
                <div className="meeting-coordinator">
                  Coordinator: {getModuleDetails(upcomingMeeting).coordinator}
                </div>
                <div className="meeting-time">
                  {formatMeetingTime(upcomingMeeting.start)}
                </div>
              </div>
              <button 
                className="upcoming-join-btn"
                onClick={() => navigate(`/join-meeting/${upcomingMeeting.id}`)}
              >
                <FaPlay style={{ marginRight: 6 }} /> Join
              </button>
            </div>
            <div className="meeting-link">
              <FaLink style={{ marginRight: 4 }} />
              <a href={upcomingMeeting.resource?.meetingLink || upcomingMeeting.meetingLink || '#'} target="_blank" rel="noopener noreferrer">
                {upcomingMeeting.resource?.meetingLink || upcomingMeeting.meetingLink || 'N/A'}
              </a>
            </div>
          </div>
        </div>
      )}
      <button 
        className="view-all-btn"
        onClick={() => navigate('/join-meeting')}
      >
        View All Upcoming Meetings
      </button>
    </div>
  );
};

export default UpcomingMeetings;