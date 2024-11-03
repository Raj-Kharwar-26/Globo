import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Globe, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-indigo-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Globe className="h-8 w-8 text-white" />
            <span className="text-white text-xl font-bold">Globo</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-white hover:text-indigo-100">Dashboard</Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-white hover:text-indigo-100"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="text-white hover:text-indigo-100"
                >
                  Login
                </Link>
                <Link 
                  to="/register"
                  className="bg-white text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-indigo-50"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;