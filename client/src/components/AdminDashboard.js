import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { toast } from 'react-toastify';
import api from '../services/api';
import LessonForm from './LessonForm';
import RiderList from './RiderList';
import LessonList from './LessonList';

const AdminDashboard = () => {
  const [lessons, setLessons] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lessonsResponse, ridersResponse] = await Promise.all([
        api.lessons.getAll(),
        api.auth.getRiders()
      ]);

      setLessons(lessonsResponse.data);
      setRiders(ridersResponse.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleEventDrop = async ({ event }) => {
    try {
      await api.events.update(event.id, {
        dateTime: event.start.toISOString()
      });
      toast.success('Lesson time updated successfully');
    } catch (error) {
      toast.error('Failed to update lesson time');
      // Refresh calendar to revert the change
      fetchData();
    }
  };

  const handleEventClick = (clickInfo) => {
    const lesson = lessons.find(l => l.id === clickInfo.event.id);
    setSelectedLesson(lesson);
    setShowLessonForm(true);
  };

  const handleDateSelect = (selectInfo) => {
    setSelectedLesson({
      dateTime: selectInfo.startStr,
      duration: 60 // default duration
    });
    setShowLessonForm(true);
  };

  const handleCreateLesson = async (lessonData) => {
    try {
      const response = await api.lessons.create(lessonData);
      setLessons([...lessons, response.data]);
      setShowLessonForm(false);
      toast.success('Lesson created successfully');
    } catch (error) {
      toast.error('Failed to create lesson');
    }
  };

  const handleUpdateLesson = async (id, lessonData) => {
    try {
      const response = await api.lessons.update(id, lessonData);
      setLessons(lessons.map(lesson => 
        lesson.id === id ? response.data : lesson
      ));
      setShowLessonForm(false);
      toast.success('Lesson updated successfully');
    } catch (error) {
      toast.error('Failed to update lesson');
    }
  };

  const handleDeleteLesson = async (id) => {
    try {
      await api.lessons.delete(id);
      setLessons(lessons.filter(lesson => lesson.id !== id));
      setShowLessonForm(false);
      toast.success('Lesson deleted successfully');
    } catch (error) {
      toast.error('Failed to delete lesson');
    }
  };

  const handleAssignRider = async (lessonId, riderUsername) => {
    try {
      const response = await api.lessons.assignRider(lessonId, { riderUsername });
      setLessons(lessons.map(lesson =>
        lesson.id === lessonId ? response.data : lesson
      ));
      toast.success('Rider assigned successfully');
    } catch (error) {
      toast.error('Failed to assign rider');
    }
  };

  const handleUnassignRider = async (lessonId) => {
    try {
      const response = await api.lessons.unassignRider(lessonId);
      setLessons(lessons.map(lesson =>
        lesson.id === lessonId ? response.data : lesson
      ));
      toast.success('Rider unassigned successfully');
    } catch (error) {
      toast.error('Failed to unassign rider');
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
      <Routes>
        <Route
          path="/"
          element={
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <button
                  onClick={() => {
                    setSelectedLesson(null);
                    setShowLessonForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <i className="fas fa-plus mr-2"></i>
                  New Lesson
                </button>
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
                  editable={true}
                  selectable={true}
                  selectMirror={true}
                  dayMaxEvents={true}
                  weekends={true}
                  events={lessons.map(lesson => ({
                    id: lesson.id,
                    title: `${lesson.name}${lesson.assignedRider ? ` - ${lesson.assignedRider}` : ''}`,
                    start: lesson.dateTime,
                    end: new Date(new Date(lesson.dateTime).getTime() + lesson.duration * 60000).toISOString(),
                    extendedProps: {
                      description: lesson.description,
                      assignedRider: lesson.assignedRider,
                      imagePath: lesson.imagePath
                    }
                  }))}
                  eventDrop={handleEventDrop}
                  eventClick={handleEventClick}
                  select={handleDateSelect}
                  height="auto"
                />
              </div>
            </div>
          }
        />
        <Route
          path="/lessons"
          element={
            <LessonList
              lessons={lessons}
              riders={riders}
              onAssignRider={handleAssignRider}
              onUnassignRider={handleUnassignRider}
              onEdit={lesson => {
                setSelectedLesson(lesson);
                setShowLessonForm(true);
              }}
              onDelete={handleDeleteLesson}
            />
          }
        />
        <Route
          path="/riders"
          element={
            <RiderList
              riders={riders}
              onRefresh={fetchData}
            />
          }
        />
      </Routes>

      {showLessonForm && (
        <LessonForm
          lesson={selectedLesson}
          riders={riders}
          onSubmit={selectedLesson?.id ? handleUpdateLesson : handleCreateLesson}
          onDelete={selectedLesson?.id ? handleDeleteLesson : undefined}
          onClose={() => {
            setShowLessonForm(false);
            setSelectedLesson(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
