import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

function ProjectDetails() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [amount, setAmount] = useState('');
  const [proposal, setProposal] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidError, setBidError] = useState('');

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      setError('Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setBidError('');
    setSuccess('');

    if (!amount || !proposal) {
      setBidError('Please provide both amount and proposal');
      return;
    }

    try {
      setSubmittingBid(true);
      await api.post(`/projects/${id}/bids`, {
        amount: Number(amount),
        proposal: proposal.trim()
      });
      setSuccess('Your bid was submitted successfully!');
      setAmount('');
      setProposal('');
      fetchProjectDetails();
    } catch (err) {
      setBidError(err.response?.data?.message || 'Failed to submit bid.');
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleAcceptBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to accept this bid? All other bids will be rejected.')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await api.patch(`/bids/${bidId}/accept`);
      setSuccess('Bid accepted successfully! The project is now awarded.');
      fetchProjectDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept bid.');
    }
  };

  if (loading) {
    return <div className="container loading-state">Loading project details...</div>;
  }

  if (error && !project) {
    return (
      <div className="container">
        <div className="alert alert-error">{error}</div>
        <Link to="/" className="btn-secondary">Back to Projects</Link>
      </div>
    );
  }

  const isOwner = user && project && project.client && (
    project.client._id === user._id || project.client === user._id
  );

  const isFreelancer = user && user.role === 'freelancer';

  const alreadyBidded = isFreelancer && project.bids && project.bids.some(
    (b) => b.freelancer && (b.freelancer._id === user._id || b.freelancer === user._id)
  );

  const formattedDate = new Date(project.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="container">
      <div className="details-header">
        <Link to="/" className="back-link">← Back to All Projects</Link>
        <div className="title-row">
          <h2>{project.title}</h2>
          <span className={`status-badge status-${project.status}`}>
            {project.status.toUpperCase()}
          </span>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="project-detail-card">
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Posted By:</span>
            <span className="detail-value">{project.client?.name || 'Client'} ({project.client?.email})</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Budget:</span>
            <span className="detail-value highlight-price">₹{project.budget.toLocaleString('en-IN')}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Posted On:</span>
            <span className="detail-value">{formattedDate}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Total Bids:</span>
            <span className="detail-value">{project.bids?.length || 0}</span>
          </div>
        </div>

        <div className="project-desc-section">
          <h4>Project Description</h4>
          <p className="description-text">{project.description}</p>
        </div>
      </div>

      {isFreelancer && (
        <div className="bid-submission-box">
          <h3>Submit a Bid for this Project</h3>

          {project.status !== 'open' ? (
            <div className="alert alert-info">
              This project is <strong>{project.status}</strong> and is no longer accepting bids.
            </div>
          ) : alreadyBidded ? (
            <div className="alert alert-info">
              ✓ You have already submitted a bid for this project.
            </div>
          ) : (
            <form onSubmit={handleBidSubmit} className="bid-form">
              {bidError && <div className="alert alert-error">{bidError}</div>}

              <div className="form-group">
                <label htmlFor="bidAmount">Your Bid Amount (₹)</label>
                <input
                  id="bidAmount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 12000"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="bidProposal">Proposal / Message (Max 1000 characters)</label>
                <textarea
                  id="bidProposal"
                  rows="4"
                  maxLength="1000"
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  placeholder="Explain why you are the best fit for this project, timeline, tools, etc."
                  required
                />
                <span className="char-count">{proposal.length} / 1000 characters</span>
              </div>

              <button type="submit" className="btn-primary" disabled={submittingBid}>
                {submittingBid ? 'Submitting Bid...' : 'Submit Bid'}
              </button>
            </form>
          )}
        </div>
      )}

      <div className="bids-section">
        <h3>Submitted Bids ({project.bids?.length || 0})</h3>

        {!project.bids || project.bids.length === 0 ? (
          <div className="empty-state">
            <p>No bids have been submitted for this project yet.</p>
          </div>
        ) : (
          <div className="bids-list">
            {project.bids.map((bid) => {
              const freelancerName = bid.freelancer?.name || 'Freelancer';
              const freelancerEmail = bid.freelancer?.email || '';

              return (
                <div key={bid._id} className={`bid-card bid-${bid.status}`}>
                  <div className="bid-card-header">
                    <div>
                      <h4 className="freelancer-name">{freelancerName}</h4>
                      {freelancerEmail && <span className="freelancer-email">{freelancerEmail}</span>}
                    </div>
                    <div className="bid-amount-badge">
                      ₹{bid.amount.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <p className="bid-proposal">{bid.proposal}</p>

                  <div className="bid-card-footer">
                    <span className={`status-badge status-${bid.status}`}>
                      Status: {bid.status.toUpperCase()}
                    </span>

                    {isOwner && project.status === 'open' && bid.status === 'pending' && (
                      <button
                        onClick={() => handleAcceptBid(bid._id)}
                        className="btn-accept"
                      >
                        Accept Bid
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDetails;
