import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const RiderDashboard = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
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
    setSelectedLesson(lesson);
  };

  // Modal to display lesson details
  const LessonDetailsModal = ({ lesson, onClose }) => {
    if (!lesson) return null;

    const startTime = new Date(`${lesson.date}T${lesson.time}`);
    const endTime = new Date(startTime.getTime() + lesson.duration * 60000);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900">{lesson.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {lesson.imagePath && (
            <img
              src={lesson.imagePath}
              alt={lesson.name}
              className="w-full h-48 object-cover rounded-md mb-4"
            />
          )}

          <div className="space-y-4">
            <p className="text-gray-600">{lesson.description}</p>

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(lesson.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">
                    {startTime.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                    {' - '}
                    {endTime.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{lesson.duration} minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
          <h1 className="text-2xl font-bold text-gray-900">My Lessons</h1>
          <div className="text-gray-600">
            <i className="fas fa-user mr-2"></i>
            Welcome, {user.username}!
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin]}
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
              start: `${lesson.date}T${lesson.time}`,
              end: (() => {
                const start = new Date(`${lesson.date}T${lesson.time}`);
                return new Date(start.getTime() + lesson.duration * 60000).toISOString();
              })(),
              backgroundColor: '#3b82f6', // blue-600
              borderColor: '#2563eb', // blue-700
              textColor: '#ffffff',
              extendedProps: {
                description: lesson.description
              }
            }))}
            eventClick={handleEventClick}
            height="auto"
          />
        </div>

        {/* Upcoming Lessons List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Lessons</h2>
          <div className="space-y-4">
            {lessons
              .filter(lesson => new Date(`${lesson.date}T${lesson.time}`) > new Date())
              .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
              .slice(0, 5)
              .map(lesson => (
                <div
                  key={lesson.id}
                  className="border-l-4 border-blue-600 pl-4 py-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedLesson(lesson)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{lesson.name}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(lesson.date).toLocaleDateString()} at{' '}
                        {new Date(`${lesson.date}T${lesson.time}`).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className="text-blue-600">
                      <i className="fas fa-chevron-right"></i>
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {selectedLesson && (
        <LessonDetailsModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
        />
      )}
    </div>
  );
};

export default RiderDashboard;
