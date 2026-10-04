import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

function CreateProject() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="container">
        <div className="alert alert-error">Please login to create a project.</div>
      </div>
    );
  }

  if (user.role !== 'client') {
    return (
      <div className="container">
        <div className="alert alert-error">Access Denied: Only clients can create projects.</div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !budget) {
      setError('Please fill in all fields');
      return;
    }

    const numericBudget = Number(budget);
    if (isNaN(numericBudget) || numericBudget <= 0) {
      setError('Budget must be a valid positive number');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/projects', {
        title: title.trim(),
        description: description.trim(),
        budget: numericBudget
      });

      navigate(`/projects/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container form-container">
      <div className="form-card">
        <h2>Post a New Project</h2>
        <p className="form-subtitle">Fill in the details below to receive bids from talented freelancers</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Project Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Full-Stack E-commerce Website"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="budget">Budget (₹ INR)</label>
            <input
              id="budget"
              type="number"
              min="1"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 15000"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Project Description</label>
            <textarea
              id="description"
              rows="6"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of what needs to be done, requirements, technologies, etc."
              required
            />
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Posting Project...' : 'Post Project'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateProject;
