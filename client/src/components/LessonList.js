import React, { useState } from 'react';
import { toast } from 'react-toastify';

const LessonList = ({ 
  lessons, 
  riders, 
  onAssignRider, 
  onUnassignRider, 
  onEdit, 
  onDelete 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || lesson.date === filterDate;
    return matchesSearch && matchesDate;
  });

  const handleAssignRider = async (lessonId, riderUsername) => {
    try {
      await onAssignRider(lessonId, riderUsername);
      toast.success(`Rider ${riderUsername} assigned successfully`);
    } catch (error) {
      toast.error('Failed to assign rider');
    }
  };

  const handleUnassignRider = async (lessonId, riderUsername) => {
    try {
      await onUnassignRider(lessonId, riderUsername);
      toast.success(`Rider ${riderUsername} unassigned successfully`);
    } catch (error) {
      toast.error('Failed to unassign rider');
    }
  };

  const handleDelete = async (lesson) => {
    if (window.confirm(`Are you sure you want to delete "${lesson.name}"?`)) {
      try {
        await onDelete(lesson.id);
        toast.success('Lesson deleted successfully');
      } catch (error) {
        toast.error('Failed to delete lesson');
      }
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Lessons</h2>
        <div className="flex space-x-4">
          <div>
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredLessons.map(lesson => (
          <div
            key={lesson.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            {lesson.imagePath && (
              <img
                src={lesson.imagePath}
                alt={lesson.name}
                className="w-full h-48 object-cover"
              />
            )}
            
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-900">
                  {lesson.name}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(lesson)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(lesson)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {lesson.description}
              </p>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <i className="fas fa-calendar mr-2"></i>
                  {new Date(lesson.date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <i className="fas fa-clock mr-2"></i>
                  {lesson.time} ({lesson.duration} minutes)
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900">Assigned Riders</h4>
                <div className="mt-2">
                  {Array.from(lesson.assignedRiders).length > 0 ? (
                    <div className="space-y-2">
                      {Array.from(lesson.assignedRiders).map(riderUsername => (
                        <div
                          key={riderUsername}
                          className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                        >
                          <span className="text-sm text-gray-700">
                            {riderUsername}
                          </span>
                          <button
                            onClick={() => handleUnassignRider(lesson.id, riderUsername)}
                            className="text-red-600 hover:text-red-800"
                            title="Unassign rider"
                          >
                            <i className="fas fa-user-minus"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No riders assigned</p>
                  )}
                </div>

                <div className="mt-4">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignRider(lesson.id, e.target.value);
                        e.target.value = ''; // Reset select after assigning
                      }
                    }}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Assign a rider...</option>
                    {riders
                      .filter(rider => !lesson.assignedRiders.has(rider.username))
                      .map(rider => (
                        <option key={rider.username} value={rider.username}>
                          {rider.username}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLessons.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <i className="fas fa-search text-4xl mb-4"></i>
            <p>No lessons found</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonList;
