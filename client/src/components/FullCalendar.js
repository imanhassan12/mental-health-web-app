import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Link, useNavigate } from 'react-router-dom';
import AppointmentService from '../services/appointment.service';
import ClientService from '../services/client.service';
import '../styles/FullCalendar.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup the localizer for dates
const localizer = momentLocalizer(moment);

const FullCalendar = () => {
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch appointments
        const appointmentsData = await AppointmentService.getAllAppointments();
        
        // Fetch clients for name display
        const clientsData = await ClientService.getAllClients();
        
        setClients(clientsData);
        
        // Format appointments for the calendar
        const formattedAppointments = appointmentsData.map(appt => ({
          id: appt.id,
          title: appt.title || 'Appointment',
          start: new Date(appt.startTime),
          end: appt.endTime ? new Date(appt.endTime) : moment(appt.startTime).add(1, 'hour').toDate(),
          clientId: appt.clientId,
          status: appt.status,
          notes: appt.notes,
          clientName: getClientName(appt.clientId, clientsData)
        }));
        
        setAppointments(formattedAppointments);
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
  
  const getClientName = (clientId, clientList = clients) => {
    const client = clientList.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };
  
  const handleViewChange = (newView) => {
    setView(newView);
  };
  
  const handleNavigate = (newDate) => {
    setDate(newDate);
  };
  
  // Custom appointment component for the calendar
  const AppointmentEvent = ({ event }) => {
    const statusClass = getStatusClass(event.status);
    
    const handleEventClick = () => {
      // Navigate to the appointments page with this appointment set for editing
      navigate('/appointments', { state: { editAppointmentId: event.id } });
    };
    
    return (
      <div 
        className={`calendar-event ${statusClass}`} 
        onClick={handleEventClick}
      >
        <div className="event-time">
          {moment(event.start).format('h:mm A')}
        </div>
        <div className="event-title">{event.title}</div>
        <div className="event-client">{event.clientName}</div>
      </div>
    );
  };
  
  const getStatusClass = (status) => {
    switch(status) {
      case 'completed': return 'status-completed';
      case 'no-show': return 'status-noshow';
      case 'canceled': return 'status-canceled';
      default: return 'status-scheduled';
    }
  };
  
  // Custom toolbar component
  const CustomToolbar = (toolbar) => {
    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };
    
    const goToPrev = () => {
      toolbar.onNavigate('PREV');
    };
    
    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };
    
    const label = () => {
      const date = moment(toolbar.date);
      const currentView = toolbar.view;
      
      // Format the label based on the current view
      let formattedLabel;
      
      switch(currentView) {
        case 'month':
          // For month view: "March 2025"
          formattedLabel = date.format('MMMM YYYY');
          break;
        
        case 'week':
          // For week view: "Mar 10 - Mar 16, 2025"
          const startOfWeek = date.clone().startOf('week');
          const endOfWeek = date.clone().endOf('week');
          
          // Check if the start and end dates are in the same month
          if (startOfWeek.month() === endOfWeek.month()) {
            formattedLabel = `${startOfWeek.format('MMM D')} - ${endOfWeek.format('D')}, ${endOfWeek.format('YYYY')}`;
          } else if (startOfWeek.year() === endOfWeek.year()) {
            formattedLabel = `${startOfWeek.format('MMM D')} - ${endOfWeek.format('MMM D')}, ${endOfWeek.format('YYYY')}`;
          } else {
            formattedLabel = `${startOfWeek.format('MMM D, YYYY')} - ${endOfWeek.format('MMM D, YYYY')}`;
          }
          break;
        
        case 'day':
          // For day view: "Tuesday, March 11, 2025"
          formattedLabel = date.format('dddd, MMMM D, YYYY');
          break;
        
        case 'agenda':
          // For agenda view: "Agenda: Next 30 days"
          const startDate = date.format('MMM D');
          const endDate = date.clone().add(30, 'days').format('MMM D');
          formattedLabel = `Agenda: ${startDate} - ${endDate}`;
          break;
        
        default:
          formattedLabel = date.format('MMMM YYYY');
      }
      
      return (
        <span className="calendar-label">
          {formattedLabel}
        </span>
      );
    };
    
    return (
      <div className="calendar-toolbar">
        <div className="toolbar-buttons left">
          <button 
            className="toolbar-btn today-btn" 
            onClick={goToToday}
          >
            Today
          </button>
          <button 
            className="toolbar-btn back-btn" 
            onClick={goToPrev}
          >
            Back
          </button>
          <button 
            className="toolbar-btn next-btn" 
            onClick={goToNext}
          >
            Next
          </button>
        </div>
        
        <div className="toolbar-label">
          {label()}
        </div>
        
        <div className="toolbar-buttons right">
          <button 
            className={`view-btn ${view === 'month' ? 'active' : ''}`}
            onClick={() => toolbar.onView('month')}
          >
            Month
          </button>
          <button 
            className={`view-btn ${view === 'week' ? 'active' : ''}`}
            onClick={() => toolbar.onView('week')}
          >
            Week
          </button>
          <button 
            className={`view-btn ${view === 'day' ? 'active' : ''}`}
            onClick={() => toolbar.onView('day')}
          >
            Day
          </button>
          <button 
            className={`view-btn ${view === 'agenda' ? 'active' : ''}`}
            onClick={() => toolbar.onView('agenda')}
          >
            Agenda
          </button>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return <div className="calendar-loading">Loading calendar...</div>;
  }
  
  if (error) {
    return <div className="calendar-error">{error}</div>;
  }
  
  return (
    <div className="full-calendar-container">
      <Calendar
        localizer={localizer}
        events={appointments}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        view={view}
        date={date}
        onView={handleViewChange}
        onNavigate={handleNavigate}
        onSelectEvent={(event) => {
          // Handle click on any event in any view
          navigate('/appointments', { state: { editAppointmentId: event.id } });
        }}
        components={{
          event: AppointmentEvent,
          toolbar: CustomToolbar
        }}
        eventPropGetter={(event) => {
          const status = event.status || 'scheduled';
          const backgroundColor = 
            status === 'completed' ? '#6c757d' : 
            status === 'no-show' ? '#ff6f61' : 
            status === 'canceled' ? '#ff9800' : 
            '#2aa09b';
          
          return {
            style: {
              backgroundColor,
              borderRadius: '4px',
              cursor: 'pointer' // Add cursor pointer to all events in all views
            }
          };
        }}
      />
      
      <div className="calendar-footer">
        <Link to="/appointments" className="manage-appointments-link">
          Manage Appointments
        </Link>
      </div>
    </div>
  );
};

export default FullCalendar; 