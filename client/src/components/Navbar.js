import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePasswordChange = () => {
    navigate('/change-password');
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link 
                to={user?.role === 'admin' ? '/admin' : '/rider'} 
                className="flex items-center text-blue-600 text-xl font-semibold"
              >
                <i className="fas fa-horse-head mr-2"></i>
                Riding School
              </Link>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {user?.role === 'admin' && (
                <>
                  <Link
                    to="/admin"
                    className="inline-flex items-center px-1 pt-1 text-gray-700 hover:text-blue-600"
                  >
                    <i className="fas fa-calendar-alt mr-2"></i>
                    Calendar
                  </Link>
                  <Link
                    to="/admin/lessons"
                    className="inline-flex items-center px-1 pt-1 text-gray-700 hover:text-blue-600"
                  >
                    <i className="fas fa-book-open mr-2"></i>
                    Lessons
                  </Link>
                  <Link
                    to="/admin/riders"
                    className="inline-flex items-center px-1 pt-1 text-gray-700 hover:text-blue-600"
                  >
                    <i className="fas fa-users mr-2"></i>
                    Riders
                  </Link>
                </>
              )}
              {user?.role === 'rider' && (
                <Link
                  to="/rider"
                  className="inline-flex items-center px-1 pt-1 text-gray-700 hover:text-blue-600"
                >
                  <i className="fas fa-calendar-alt mr-2"></i>
                  My Lessons
                </Link>
              )}
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="ml-3 relative">
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  <i className="fas fa-user mr-2"></i>
                  {user?.username}
                </span>
                <button
                  onClick={handlePasswordChange}
                  className="text-gray-700 hover:text-blue-600"
                  title="Change Password"
                >
                  <i className="fas fa-key"></i>
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-blue-600"
                  title="Logout"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden" id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          {user?.role === 'admin' && (
            <>
              <Link
                to="/admin"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              >
                <i className="fas fa-calendar-alt mr-2"></i>
                Calendar
              </Link>
              <Link
                to="/admin/lessons"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              >
                <i className="fas fa-book-open mr-2"></i>
                Lessons
              </Link>
              <Link
                to="/admin/riders"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              >
                <i className="fas fa-users mr-2"></i>
                Riders
              </Link>
            </>
          )}
          {user?.role === 'rider' && (
            <Link
              to="/rider"
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              <i className="fas fa-calendar-alt mr-2"></i>
              My Lessons
            </Link>
          )}
          <button
            onClick={handlePasswordChange}
            className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
          >
            <i className="fas fa-key mr-2"></i>
            Change Password
          </button>
          <button
            onClick={handleLogout}
            className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
