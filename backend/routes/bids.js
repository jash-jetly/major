const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const Project = require('../models/Project');
const authMiddleware = require('../middleware/auth');

router.get('/my-bids', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can view submitted bids' });
    }

    const bids = await Bid.find({ freelancer: req.user._id })
      .populate('project', 'title budget status client')
      .sort({ createdAt: -1 });

    res.status(200).json(bids);
  } catch (error) {
    console.error('Error fetching my bids:', error);
    res.status(500).json({ message: 'Server error fetching your bids' });
  }
});

router.patch('/:id/accept', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can accept bids' });
    }

    const bid = await Bid.findById(req.params.id);
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    const project = await Project.findById(bid.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to accept bids on this project' });
    }

    if (project.status === 'awarded') {
      return res.status(400).json({ message: 'Project has already been awarded' });
    }

    bid.status = 'accepted';
    await bid.save();

    await Bid.updateMany(
      { project: project._id, _id: { $ne: bid._id } },
      { status: 'rejected' }
    );

    project.status = 'awarded';
    await project.save();

    await bid.populate('freelancer', 'name email');

    res.status(200).json({
      message: 'Bid accepted successfully',
      project,
      bid
    });
  } catch (error) {
    console.error('Error accepting bid:', error);
    res.status(500).json({ message: 'Server error accepting bid' });
  }
});

module.exports = router;
