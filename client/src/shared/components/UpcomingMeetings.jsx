import React from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { FaLink } from 'react-icons/fa';

const UpcomingMeetings = ({ events }) => {
  const navigate = useNavigate();

  // Filter only upcoming meetings and get the first one
  const upcomingMeeting = events
    .filter(event => event.resource?.isUpcomingMeeting)
    .sort((a, b) => new Date(a.start) - new Date(b.start))[0];

  // Format meeting time
  const formatMeetingTime = (date) => {
    return moment(date).format('MMM D, YYYY [at] HH:mm');
  };

  // Get module details (this would come from your actual data)
  const getModuleDetails = (meetingId) => {
    // This is dummy data - replace with actual data from your backend
    const moduleDetails = {
      101: { 
        year: 'Year 1', 
        semester: 'Semester 1', 
        module: 'IT1010',
        coordinator: 'Dr. John Smith'
      },
      102: { 
        year: 'Year 2', 
        semester: 'Semester 2', 
        module: 'IT2020',
        coordinator: 'Prof. Sarah Johnson'
      },
    };
    return moduleDetails[meetingId] || { 
      year: 'N/A', 
      semester: 'N/A', 
      module: 'N/A',
      coordinator: 'N/A'
    };
  };

  return (
    <div className="upcoming-meetings-section">
      <h3>Upcoming Meeting</h3>
      {!upcomingMeeting ? (
        <div className="no-meetings">No upcoming meetings</div>
      ) : (
        <>
          <div className="meeting-list">
            <div className="meeting-item">
              <div className="meeting-header">
                <div className="meeting-details">
                  <h4 className="meeting-title">{upcomingMeeting.title}</h4>
                  <div className="meeting-meta">
                    <span>{getModuleDetails(upcomingMeeting.id).year}</span>
                    <span>{getModuleDetails(upcomingMeeting.id).semester}</span>
                    <span>{getModuleDetails(upcomingMeeting.id).module}</span>
                  </div>
                  <div className="meeting-coordinator">
                    Coordinator: {getModuleDetails(upcomingMeeting.id).coordinator}
                  </div>
                  <div className="meeting-time">
                    {formatMeetingTime(upcomingMeeting.start)}
                  </div>
                </div>
                <button 
                  className="join-meeting-btn"
                  onClick={() => navigate(`/join-meeting/${upcomingMeeting.id}`)}
                >
                  Join
                </button>
              </div>
              <div className="meeting-link">
                <FaLink style={{ marginRight: 4 }} />
                <a href={`https://meet.sliit-hub.com/meeting/${upcomingMeeting.id}`} target="_blank" rel="noopener noreferrer">
                  meet.sliit-hub.com/meeting/{upcomingMeeting.id}
                </a>
              </div>
            </div>
          </div>
          <button 
            className="view-all-meetings-btn"
            onClick={() => navigate('/join-meeting')}
          >
            View All Upcoming Meetings
          </button>
        </>
      )}
    </div>
  );
};

export default UpcomingMeetings;