import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          Freelancer Platform
        </Link>

        <div className="nav-links">
          <Link to="/" className="nav-link">
            Projects
          </Link>

          {user && (
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
          )}

          {user && user.role === 'client' && (
            <Link to="/create-project" className="nav-link btn-link">
              + Post Project
            </Link>
          )}

          {user ? (
            <div className="nav-user-section">
              <span className="user-badge">
                <strong>{user.name}</strong> ({user.role})
              </span>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </div>
          ) : (
            <div className="nav-auth-links">
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link btn-register">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
