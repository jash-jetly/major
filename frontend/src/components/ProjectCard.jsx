import React from 'react';
import { Link } from 'react-router-dom';

function ProjectCard({ project }) {
  const clientName = project.client?.name || 'Unknown Client';

  return (
    <div className="project-card">
      <div className="card-header">
        <h3 className="project-title">{project.title}</h3>
        <span className={`status-badge status-${project.status}`}>
          {project.status.toUpperCase()}
        </span>
      </div>

      <p className="project-description">{project.description}</p>

      <div className="card-meta">
        <div className="meta-item">
          <span className="meta-label">Budget:</span>
          <span className="meta-value">₹{project.budget.toLocaleString('en-IN')}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Client:</span>
          <span className="meta-value">{clientName}</span>
        </div>
      </div>

      <div className="card-footer">
        <Link to={`/projects/${project._id}`} className="btn-details">
          View Details
        </Link>
      </div>
    </div>
  );
}

export default ProjectCard;
