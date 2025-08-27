import express from 'express';
const router = express.Router();

// Check for notifications updates
router.get('/check', async (req, res) => {
  try {
    // For now, return a simple response indicating no updates
    // This can be enhanced later to actually check for real updates
    res.json({
      hasUpdates: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking notifications:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      hasUpdates: false 
    });
  }
});

export default router;
