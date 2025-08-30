const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Mock betting matches data (in production, this would come from a database)
const mockMatches = [
  {
    id: '1',
    title: 'Naruto vs Sasuke',
    description: 'Epic battle between the two legendary ninjas',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
    options: ['Naruto', 'Sasuke', 'Draw'],
    totalBets: 1500,
    totalVolume: 750,
    status: 'active',
    category: 'battle'
  },
  {
    id: '2',
    title: 'One Piece Treasure Hunt',
    description: 'Who will find the next piece of the One Piece?',
    startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 49 * 60 * 60 * 1000),
    options: ['Luffy', 'Blackbeard', 'Shanks', 'Other'],
    totalBets: 2300,
    totalVolume: 1150,
    status: 'active',
    category: 'adventure'
  },
  {
    id: '3',
    title: 'Dragon Ball Tournament',
    description: 'Ultimate martial arts tournament',
    startTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 73 * 60 * 60 * 1000),
    options: ['Goku', 'Vegeta', 'Gohan', 'Other'],
    totalBets: 1800,
    totalVolume: 900,
    status: 'active',
    category: 'tournament'
  }
];

// Get all betting matches
router.get('/matches', async (req, res) => {
  try {
    const { status = 'active', category, page = 1, limit = 20 } = req.query;
    
    let filteredMatches = mockMatches;
    
    if (status) {
      filteredMatches = filteredMatches.filter(match => match.status === status);
    }
    
    if (category) {
      filteredMatches = filteredMatches.filter(match => match.category === category);
    }
    
    const skip = (page - 1) * limit;
    const paginatedMatches = filteredMatches.slice(skip, skip + parseInt(limit));
    
    res.json({
      matches: paginatedMatches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredMatches.length,
        pages: Math.ceil(filteredMatches.length / limit)
      }
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ 
      error: 'Failed to get matches',
      message: error.message 
    });
  }
});

// Get match by ID
router.get('/matches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const match = mockMatches.find(m => m.id === id);
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    res.json({ match });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ 
      error: 'Failed to get match',
      message: error.message 
    });
  }
});

// Place a bet
router.post('/place-bet', [
  authenticateToken,
  body('matchId').isString().notEmpty(),
  body('option').isString().notEmpty(),
  body('amount').isNumeric().isFloat({ min: 0.1 }),
  body('prediction').optional().isString()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { matchId, option, amount, prediction } = req.body;
    
    // Find the match
    const match = mockMatches.find(m => m.id === matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    if (match.status !== 'active') {
      return res.status(400).json({ error: 'Match is not active for betting' });
    }
    
    // Validate option
    if (!match.options.includes(option)) {
      return res.status(400).json({ error: 'Invalid betting option' });
    }
    
    // Check if user has sufficient balance (this would check Flow balance in production)
    // For now, we'll assume they have enough
    
    // Create bet object
    const bet = {
      id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      matchId,
      userId: req.user.userId,
      userAddress: req.user.flowWalletAddress,
      option,
      amount: parseFloat(amount),
      prediction,
      timestamp: new Date(),
      status: 'pending'
    };
    
    // In production, this would be saved to the database
    // For now, we'll just return the bet object
    
    res.json({
      message: 'Bet placed successfully',
      bet,
      match: {
        id: match.id,
        title: match.title,
        totalBets: match.totalBets + 1,
        totalVolume: match.totalVolume + parseFloat(amount)
      }
    });
    
  } catch (error) {
    console.error('Place bet error:', error);
    res.status(500).json({ 
      error: 'Failed to place bet',
      message: error.message 
    });
  }
});

// Get user's bets
router.get('/user-bets', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    // Mock user bets (in production, this would come from a database)
    const mockUserBets = [
      {
        id: 'bet_1',
        matchId: '1',
        matchTitle: 'Naruto vs Sasuke',
        option: 'Naruto',
        amount: 0.5,
        prediction: 'Naruto will win with Rasengan',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'pending',
        potentialReward: 1.0
      },
      {
        id: 'bet_2',
        matchId: '2',
        matchTitle: 'One Piece Treasure Hunt',
        option: 'Luffy',
        amount: 0.3,
        prediction: 'Luffy will find the treasure',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'pending',
        potentialReward: 0.6
      }
    ];
    
    let filteredBets = mockUserBets;
    
    if (status) {
      filteredBets = filteredBets.filter(bet => bet.status === status);
    }
    
    const skip = (page - 1) * limit;
    const paginatedBets = filteredBets.slice(skip, skip + parseInt(limit));
    
    res.json({
      bets: paginatedBets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredBets.length,
        pages: Math.ceil(filteredBets.length / limit)
      }
    });
    
  } catch (error) {
    console.error('Get user bets error:', error);
    res.status(500).json({ 
      error: 'Failed to get user bets',
      message: error.message 
    });
  }
});

// Get betting statistics
router.get('/stats', async (req, res) => {
  try {
    const totalMatches = mockMatches.length;
    const activeMatches = mockMatches.filter(m => m.status === 'active').length;
    const totalBets = mockMatches.reduce((sum, m) => sum + m.totalBets, 0);
    const totalVolume = mockMatches.reduce((sum, m) => sum + m.totalVolume, 0);
    
    const categoryStats = mockMatches.reduce((acc, match) => {
      if (!acc[match.category]) {
        acc[match.category] = { count: 0, volume: 0, bets: 0 };
      }
      acc[match.category].count++;
      acc[match.category].volume += match.totalVolume;
      acc[match.category].bets += match.totalBets;
      return acc;
    }, {});
    
    res.json({
      overview: {
        totalMatches,
        activeMatches,
        totalBets,
        totalVolume
      },
      categoryStats,
      recentMatches: mockMatches
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, 5)
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get betting statistics',
      message: error.message 
    });
  }
});

// Get match odds (mock data)
router.get('/matches/:id/odds', async (req, res) => {
  try {
    const { id } = req.params;
    const match = mockMatches.find(m => m.id === id);
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Calculate mock odds based on betting distribution
    const odds = {};
    match.options.forEach(option => {
      // Mock calculation - in production this would be based on actual betting data
      const baseOdds = 2.0;
      const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      odds[option] = (baseOdds * randomFactor).toFixed(2);
    });
    
    res.json({
      matchId: id,
      odds,
      totalBets: match.totalBets,
      totalVolume: match.totalVolume
    });
    
  } catch (error) {
    console.error('Get odds error:', error);
    res.status(500).json({ 
      error: 'Failed to get match odds',
      message: error.message 
    });
  }
});

// Cancel bet (if allowed)
router.post('/bets/:betId/cancel', authenticateToken, async (req, res) => {
  try {
    const { betId } = req.params;
    
    // In production, this would check if the bet can be cancelled
    // and update the database accordingly
    
    res.json({
      message: 'Bet cancelled successfully',
      betId
    });
    
  } catch (error) {
    console.error('Cancel bet error:', error);
    res.status(500).json({ 
      error: 'Failed to cancel bet',
      message: error.message 
    });
  }
});

module.exports = router;
