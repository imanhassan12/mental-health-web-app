import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppointmentService from '../services/appointment.service';
import ClientService from '../services/client.service';
import '../styles/AppointmentCalendar.css';

const AppointmentCalendar = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Group appointments by day for a weekly view
  const [weeklyAppointments, setWeeklyAppointments] = useState({});
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch appointments
        const appointmentsData = await AppointmentService.getAllAppointments();
        setAppointments(appointmentsData);
        
        // Fetch clients for name display
        const clientsData = await ClientService.getAllClients();
        setClients(clientsData);
        
        // Organize appointments by day
        organizeAppointmentsByDay(appointmentsData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching appointment data:', err);
        setError('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const organizeAppointmentsByDay = (appointmentsData) => {
    // Get the current week's start and end dates
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start from Sunday
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Saturday
    
    // Create object with day keys
    const weekDays = {};
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dateStr = day.toISOString().split('T')[0];
      weekDays[dateStr] = [];
    }
    
    // Place appointments in the corresponding day
    appointmentsData.forEach(appt => {
      const apptDate = new Date(appt.startTime).toISOString().split('T')[0];
      if (weekDays[apptDate]) {
        weekDays[apptDate].push(appt);
      }
    });
    
    // Sort appointments by time within each day
    Object.keys(weekDays).forEach(date => {
      weekDays[date].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });
    
    setWeeklyAppointments(weekDays);
  };
  
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };
  
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
    organizeAppointmentsByDay(appointments);
  };
  
  const getStatusClass = (status) => {
    switch(status) {
      case 'completed': return 'status-completed';
      case 'no-show': return 'status-noshow';
      case 'canceled': return 'status-canceled';
      default: return 'status-scheduled';
    }
  };
  
  const handleAppointmentClick = (appointmentId) => {
    navigate('/appointments', { state: { editAppointmentId: appointmentId } });
  };
  
  if (loading) {
    return <div className="calendar-loading">Loading calendar...</div>;
  }
  
  if (error) {
    return <div className="calendar-error">{error}</div>;
  }
  
  return (
    <div className="appointment-calendar">
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={() => navigateWeek(-1)}>
          &lt; Prev Week
        </button>
        <h3 className="calendar-title">
          Week of {new Date(Object.keys(weeklyAppointments)[0]).toLocaleDateString()}
        </h3>
        <button className="calendar-nav-btn" onClick={() => navigateWeek(1)}>
          Next Week &gt;
        </button>
      </div>
      
      <div className="calendar-grid">
        {Object.keys(weeklyAppointments).map(date => (
          <div key={date} className="calendar-day">
            <div className="day-header">
              {formatDate(date)}
            </div>
            <div className="day-appointments">
              {weeklyAppointments[date].length > 0 ? (
                weeklyAppointments[date].map(appt => (
                  <div 
                    key={appt.id} 
                    className={`calendar-appointment ${getStatusClass(appt.status)}`}
                    onClick={() => handleAppointmentClick(appt.id)}
                  >
                    <div className="appt-time">{formatTime(appt.startTime)}</div>
                    <div className="appt-title">{appt.title}</div>
                    <div className="appt-client">{getClientName(appt.clientId)}</div>
                  </div>
                ))
              ) : (
                <div className="no-appointments">No appointments</div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="calendar-footer">
        <Link to="/appointments" className="view-all-appointments">
          View All Appointments
        </Link>
      </div>
    </div>
  );
};

export default AppointmentCalendar; 