import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const RiderDashboard = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const response = await api.lessons.getRiderLessons(user.username);
      setLessons(response.data);
    } catch (error) {
      toast.error('Failed to fetch lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (clickInfo) => {
    const lesson = lessons.find(l => l.id === clickInfo.event.id);
    if (lesson) {
      // Show lesson details in a toast notification
      toast.info(
        <div>
          <h3 className="font-bold">{lesson.name}</h3>
          <p>{lesson.description}</p>
          <p>Duration: {lesson.duration} minutes</p>
          {lesson.imagePath && (
            <img 
              src={lesson.imagePath} 
              alt="Lesson" 
              className="mt-2 max-h-32 rounded"
            />
          )}
        </div>,
        {
          autoClose: false,
          closeButton: true,
          position: "top-center"
        }
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Riding Lessons</h1>
          <div className="text-sm text-gray-600">
            Welcome back, {user.username}!
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            editable={false}
            selectable={false}
            dayMaxEvents={true}
            weekends={true}
            events={lessons.map(lesson => ({
              id: lesson.id,
              title: lesson.name,
              start: lesson.dateTime,
              end: new Date(new Date(lesson.dateTime).getTime() + lesson.duration * 60000).toISOString(),
              backgroundColor: '#4F46E5', // Indigo color for events
              borderColor: '#4338CA',
              textColor: '#ffffff',
              extendedProps: {
                description: lesson.description,
                imagePath: lesson.imagePath
              }
            }))}
            eventClick={handleEventClick}
            height="auto"
            // Custom styling
            eventContent={renderEventContent}
          />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Upcoming Lessons</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lessons
              .filter(lesson => new Date(lesson.dateTime) > new Date())
              .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
              .slice(0, 3)
              .map(lesson => (
                <div 
                  key={lesson.id}
                  className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500"
                >
                  <h3 className="font-semibold text-lg">{lesson.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {new Date(lesson.dateTime).toLocaleDateString()} at{' '}
                    {new Date(lesson.dateTime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                  <p className="text-gray-700 mt-2">{lesson.description}</p>
                  {lesson.imagePath && (
                    <img 
                      src={lesson.imagePath} 
                      alt="Lesson" 
                      className="mt-2 w-full h-32 object-cover rounded"
                    />
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom event rendering
const renderEventContent = (eventInfo) => {
  return (
    <div className="p-1">
      <div className="font-semibold">{eventInfo.event.title}</div>
      <div className="text-xs">
        {new Date(eventInfo.event.start).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
        {' - '}
        {new Date(eventInfo.event.end).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  );
};

export default RiderDashboard;
