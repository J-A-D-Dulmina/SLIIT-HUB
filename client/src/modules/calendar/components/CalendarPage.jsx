import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlus, FaCalendarAlt, FaBook, FaGraduationCap, FaTasks, FaBell } from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import moment from 'moment';
import '../styles/CalendarPage.css';

const TASK_TYPES = {
  ACADEMIC: { label: 'Academic', color: '#10b981', icon: <FaGraduationCap /> },
  TASK: { label: 'Task', color: '#f59e0b', icon: <FaTasks /> },
  REMINDER: { label: 'Reminder', color: '#ef4444', icon: <FaBell /> }
};

const CalendarPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Web Development Assignment Due',
      type: 'ACADEMIC',
      date: '2024-03-25',
      time: '14:00',
      description: 'Submit the final project for Web Development module'
    },
    {
      id: 2,
      title: 'Database Systems Quiz',
      type: 'ACADEMIC',
      date: '2024-03-26',
      time: '10:00',
      description: 'Mid-term quiz on Database Systems'
    },
    {
      id: 3,
      title: 'Group Project Meeting',
      type: 'TASK',
      date: '2024-03-27',
      time: '15:30',
      description: 'Team meeting to discuss project progress'
    }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(moment(currentDate).subtract(1, 'month').toDate());
  };

  const handleNextMonth = () => {
    setCurrentDate(moment(currentDate).add(1, 'month').toDate());
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowAddTaskModal(true);
  };

  const handleAddTask = (taskData) => {
    const newTask = {
      id: tasks.length + 1,
      ...taskData,
      date: moment(selectedDate).format('YYYY-MM-DD')
    };
    setTasks([...tasks, newTask]);
    setShowAddTaskModal(false);
  };

  const renderCalendar = () => {
    const startDate = moment(currentDate).startOf('month').startOf('week');
    const endDate = moment(currentDate).endOf('month').endOf('week');
    const days = [];
    let currentDay = startDate.clone();

    while (currentDay.isSameOrBefore(endDate)) {
      const isCurrentMonth = currentDay.month() === moment(currentDate).month();
      const isToday = currentDay.isSame(moment(), 'day');
      const isSelected = selectedDate && currentDay.isSame(selectedDate, 'day');
      
      const dayTasks = tasks.filter(task => 
        moment(task.date).isSame(currentDay, 'day')
      );

      days.push(
        <div
          key={currentDay.format('YYYY-MM-DD')}
          className={`calendar-day ${isCurrentMonth ? '' : 'other-month'} 
            ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => handleDateClick(currentDay.toDate())}
        >
          <span className="day-number">{currentDay.date()}</span>
          <div className="day-tasks">
            {dayTasks.map(task => (
              <div
                key={task.id}
                className="task-indicator"
                style={{ backgroundColor: TASK_TYPES[task.type].color }}
                title={`${task.title} (${task.time})`}
              >
                {TASK_TYPES[task.type].icon}
                <span>{task.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
      currentDay.add(1, 'day');
    }

    return days;
  };

  const renderAddTaskModal = () => {
    if (!showAddTaskModal || !selectedDate) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Add New Task</h2>
            <button className="close-btn" onClick={() => setShowAddTaskModal(false)}>×</button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleAddTask({
              title: formData.get('title'),
              type: formData.get('type'),
              time: formData.get('time'),
              description: formData.get('description')
            });
          }}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                required
                placeholder="Enter task title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select id="type" name="type" required>
                {Object.entries(TASK_TYPES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="time">Time</label>
              <input
                type="time"
                id="time"
                name="time"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows="3"
                placeholder="Enter task description"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowAddTaskModal(false)}>
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                Add Task
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <SideMenu collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="main-content">
        <div className="sidebar-toggle-btn-wrapper">
          <button
            className="sidebar-toggle-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>
        <TopBar currentTime={currentTime} />
        <main className="calendar-page">
          <div className="page-header">
            <h1>Academic Calendar</h1>
            <div className="header-right">
              <div className="task-legend">
                <div className="legend-items">
                  {Object.entries(TASK_TYPES).map(([key, { label, color, icon }]) => (
                    <div key={key} className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: color }}>
                        {icon}
                      </span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="add-task-btn" onClick={() => setShowAddTaskModal(true)}>
                <FaPlus /> Add Task
              </button>
            </div>
          </div>

          <div className="calendar-container">
            <div className="calendar-header">
              <button className="month-nav-btn" onClick={handlePrevMonth}>
                <FaChevronLeft />
              </button>
              <h2>{moment(currentDate).format('MMMM YYYY')}</h2>
              <button className="month-nav-btn" onClick={handleNextMonth}>
                <FaChevronRight />
              </button>
            </div>

            <div className="calendar-grid">
              <div className="weekday-header">Sun</div>
              <div className="weekday-header">Mon</div>
              <div className="weekday-header">Tue</div>
              <div className="weekday-header">Wed</div>
              <div className="weekday-header">Thu</div>
              <div className="weekday-header">Fri</div>
              <div className="weekday-header">Sat</div>
              {renderCalendar()}
            </div>
          </div>

          {renderAddTaskModal()}
        </main>
      </div>
    </div>
  );
};

export default CalendarPage; 