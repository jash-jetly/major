import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

function Dashboard() {
  const { user } = useContext(AuthContext);

  const [clientProjects, setClientProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: '', budget: '', description: '' });

  const [freelancerBids, setFreelancerBids] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      if (user.role === 'client') {
        const res = await api.get('/projects/my-projects');
        setClientProjects(res.data);
      } else if (user.role === 'freelancer') {
        const res = await api.get('/bids/my-bids');
        setFreelancerBids(res.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project and all its bids?')) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}`);
      setSuccess('Project deleted successfully.');
      if (selectedProject?._id === projectId) {
        setSelectedProject(null);
      }
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project.');
    }
  };

  const handleStartEdit = (proj) => {
    setEditingProject(proj._id);
    setEditFormData({
      title: proj.title,
      budget: proj.budget,
      description: proj.description
    });
  };

  const handleSaveEdit = async (projectId) => {
    try {
      await api.put(`/projects/${projectId}`, {
        title: editFormData.title,
        budget: Number(editFormData.budget),
        description: editFormData.description
      });
      setSuccess('Project updated successfully.');
      setEditingProject(null);
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update project.');
    }
  };

  const handleViewBids = async (projectId) => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setSelectedProject(res.data);
    } catch (err) {
      setError('Failed to load bids for this project.');
    }
  };

  const handleAcceptBid = async (bidId) => {
    if (!window.confirm('Accept this bid? Other bids will be marked as rejected.')) {
      return;
    }

    try {
      await api.patch(`/bids/${bidId}/accept`);
      setSuccess('Bid accepted! Project is now awarded.');
      loadDashboardData();
      if (selectedProject) {
        handleViewBids(selectedProject._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept bid.');
    }
  };

  if (!user) {
    return (
      <div className="container">
        <div className="alert alert-error">Please login to access the dashboard.</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h2>Welcome, {user.name}</h2>
          <p className="dashboard-role-tag">
            Account Type: <strong>{user.role.toUpperCase()}</strong> ({user.email})
          </p>
        </div>

        {user.role === 'client' && (
          <Link to="/create-project" className="btn-primary">
            + Post New Project
          </Link>
        )}
        {user.role === 'freelancer' && (
          <Link to="/" className="btn-primary">
            Browse All Projects
          </Link>
        )}
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading && <div className="loading-state">Loading dashboard...</div>}

      {!loading && user.role === 'client' && (
        <div className="client-dashboard">
          <div className="dashboard-section-header">
            <h3>My Posted Projects ({clientProjects.length})</h3>
          </div>

          {clientProjects.length === 0 ? (
            <div className="empty-state">
              <p>You have not posted any projects yet.</p>
              <Link to="/create-project" className="btn-primary">Create Your First Project</Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Budget</th>
                    <th>Status</th>
                    <th>Bids</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientProjects.map((proj) => (
                    <React.Fragment key={proj._id}>
                      {editingProject === proj._id ? (
                        <tr className="edit-row">
                          <td colSpan="5">
                            <div className="inline-edit-form">
                              <h4>Edit Project: {proj.title}</h4>
                              <div className="form-group">
                                <label>Title</label>
                                <input
                                  type="text"
                                  value={editFormData.title}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, title: e.target.value })
                                  }
                                />
                              </div>
                              <div className="form-group">
                                <label>Budget (₹)</label>
                                <input
                                  type="number"
                                  value={editFormData.budget}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, budget: e.target.value })
                                  }
                                />
                              </div>
                              <div className="form-group">
                                <label>Description</label>
                                <textarea
                                  rows="3"
                                  value={editFormData.description}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, description: e.target.value })
                                  }
                                />
                              </div>
                              <div className="inline-btn-group">
                                <button
                                  className="btn-primary btn-sm"
                                  onClick={() => handleSaveEdit(proj._id)}
                                >
                                  Save Changes
                                </button>
                                <button
                                  className="btn-secondary btn-sm"
                                  onClick={() => setEditingProject(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td>
                            <strong>{proj.title}</strong>
                          </td>
                          <td>₹{proj.budget.toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`status-badge status-${proj.status}`}>
                              {proj.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <button
                              className="bid-count-btn"
                              onClick={() => handleViewBids(proj._id)}
                            >
                              {proj.bidCount} Bids (View)
                            </button>
                          </td>
                          <td className="actions-cell">
                            <Link to={`/projects/${proj._id}`} className="btn-action btn-view">
                              View
                            </Link>
                            <button
                              onClick={() => handleStartEdit(proj)}
                              className="btn-action btn-edit"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProject(proj._id)}
                              className="btn-action btn-delete"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedProject && (
            <div className="project-bids-panel">
              <div className="panel-header">
                <div>
                  <h4>Bids for: {selectedProject.title}</h4>
                  <span className={`status-badge status-${selectedProject.status}`}>
                    {selectedProject.status.toUpperCase()}
                  </span>
                </div>
                <button
                  className="btn-close"
                  onClick={() => setSelectedProject(null)}
                >
                  ✕ Close
                </button>
              </div>

              {!selectedProject.bids || selectedProject.bids.length === 0 ? (
                <p className="empty-msg">No bids submitted yet for this project.</p>
              ) : (
                <div className="bids-grid">
                  {selectedProject.bids.map((bid) => (
                    <div key={bid._id} className={`bid-card bid-${bid.status}`}>
                      <div className="bid-card-header">
                        <div>
                          <strong>{bid.freelancer?.name || 'Freelancer'}</strong>
                          <div className="text-muted">{bid.freelancer?.email}</div>
                        </div>
                        <div className="bid-amount-badge">
                          ₹{bid.amount.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <p className="bid-proposal">{bid.proposal}</p>
                      <div className="bid-card-footer">
                        <span className={`status-badge status-${bid.status}`}>
                          {bid.status.toUpperCase()}
                        </span>
                        {selectedProject.status === 'open' && bid.status === 'pending' && (
                          <button
                            className="btn-accept"
                            onClick={() => handleAcceptBid(bid._id)}
                          >
                            Accept Bid
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!loading && user.role === 'freelancer' && (
        <div className="freelancer-dashboard">
          <div className="dashboard-section-header">
            <h3>My Submitted Bids ({freelancerBids.length})</h3>
          </div>

          {freelancerBids.length === 0 ? (
            <div className="empty-state">
              <p>You have not submitted any bids yet.</p>
              <Link to="/" className="btn-primary">Browse Available Projects</Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Project Budget</th>
                    <th>My Bid Amount</th>
                    <th>My Proposal</th>
                    <th>Bid Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {freelancerBids.map((bid) => (
                    <tr key={bid._id}>
                      <td>
                        <strong>{bid.project?.title || 'Untitled Project'}</strong>
                      </td>
                      <td>
                        {bid.project?.budget
                          ? `₹${bid.project.budget.toLocaleString('en-IN')}`
                          : '-'}
                      </td>
                      <td>
                        <strong className="highlight-price">
                          ₹{bid.amount.toLocaleString('en-IN')}
                        </strong>
                      </td>
                      <td className="proposal-snippet">{bid.proposal}</td>
                      <td>
                        <span className={`status-badge status-${bid.status}`}>
                          {bid.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {bid.project?._id ? (
                          <Link
                            to={`/projects/${bid.project._id}`}
                            className="btn-details-sm"
                          >
                            View Project
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
