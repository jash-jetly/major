const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Bid = require('../models/Bid');
const authMiddleware = require('../middleware/auth');

router.get('/my-projects', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients have a client project list' });
    }

    const projects = await Project.find({ client: req.user._id }).sort({ createdAt: -1 });

    const projectsWithBidCount = await Promise.all(
      projects.map(async (project) => {
        const bidCount = await Bid.countDocuments({ project: project._id });
        return {
          ...project.toObject(),
          bidCount
        };
      })
    );

    res.status(200).json(projectsWithBidCount);
  } catch (error) {
    console.error('Error fetching my projects:', error);
    res.status(500).json({ message: 'Server error fetching your projects' });
  }
});

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('client', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('client', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const bids = await Bid.find({ project: project._id })
      .populate('freelancer', 'name email')
      .sort({ createdAt: -1 });

    const projectData = project.toObject();
    projectData.bids = bids;

    res.status(200).json(projectData);
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ message: 'Server error fetching project details' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can create projects' });
    }

    const { title, description, budget } = req.body;

    if (!title || !description || budget === undefined || budget === null) {
      return res.status(400).json({ message: 'Title, description, and budget are required' });
    }

    const numericBudget = Number(budget);
    if (isNaN(numericBudget) || numericBudget <= 0) {
      return res.status(400).json({ message: 'Budget must be greater than 0' });
    }

    const newProject = new Project({
      title,
      description,
      budget: numericBudget,
      client: req.user._id,
      status: 'open'
    });

    await newProject.save();

    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error creating project' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not allowed to modify this project' });
    }

    const { title, description, budget, status } = req.body;

    if (title) project.title = title;
    if (description) project.description = description;
    if (budget !== undefined) {
      const numericBudget = Number(budget);
      if (isNaN(numericBudget) || numericBudget <= 0) {
        return res.status(400).json({ message: 'Budget must be greater than 0' });
      }
      project.budget = numericBudget;
    }
    if (status && ['open', 'awarded', 'closed'].includes(status)) {
      project.status = status;
    }

    await project.save();

    res.status(200).json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error updating project' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not allowed to delete this project' });
    }

    await Project.findByIdAndDelete(req.params.id);
    await Bid.deleteMany({ project: req.params.id });

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error deleting project' });
  }
});

router.post('/:id/bids', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can submit bids' });
    }

    const { amount, proposal } = req.body;

    if (amount === undefined || amount === null || !proposal) {
      return res.status(400).json({ message: 'Amount and proposal are required' });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    if (proposal.trim().length === 0) {
      return res.status(400).json({ message: 'Proposal cannot be empty' });
    }

    if (proposal.length > 1000) {
      return res.status(400).json({ message: 'Proposal cannot exceed 1000 characters' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.status !== 'open') {
      return res.status(400).json({ message: 'Project is no longer accepting bids.' });
    }

    const existingBid = await Bid.findOne({
      project: project._id,
      freelancer: req.user._id
    });

    if (existingBid) {
      return res.status(400).json({ message: 'You have already submitted a bid for this project.' });
    }

    const newBid = new Bid({
      project: project._id,
      freelancer: req.user._id,
      amount: numericAmount,
      proposal: proposal.trim(),
      status: 'pending'
    });

    await newBid.save();

    await newBid.populate('freelancer', 'name email');

    res.status(201).json(newBid);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already submitted a bid for this project.' });
    }
    console.error('Error submitting bid:', error);
    res.status(500).json({ message: 'Server error submitting bid' });
  }
});

module.exports = router;
