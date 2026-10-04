import React, { useState, useEffect } from 'react';
import api from '../api';
import ProjectCard from '../components/ProjectCard';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      setError('Failed to load projects. Please make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (filterStatus === 'all') return true;
    return project.status === filterStatus;
  });

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>Available Projects</h2>
          <p className="page-subtitle">Browse listed projects or submit your bids as a freelancer</p>
        </div>

        <div className="filter-group">
          <label htmlFor="filterStatus">Status: </label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Projects ({projects.length})</option>
            <option value="open">Open</option>
            <option value="awarded">Awarded</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {loading && <div className="loading-state">Loading projects...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && filteredProjects.length === 0 && (
        <div className="empty-state">
          <p>No projects found matching the selected filter.</p>
        </div>
      )}

      <div className="projects-grid">
        {filteredProjects.map((project) => (
          <ProjectCard key={project._id} project={project} />
        ))}
      </div>
    </div>
  );
}

export default Projects;
