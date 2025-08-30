const express = require('express');
const router = express.Router();
const { authenticateToken, requireWhitelist } = require('../middleware/auth');

// Mock games data - replace with actual database queries
const mockGames = [
  {
    id: 'anime-quiz',
    name: 'Anime Quiz Challenge',
    description: 'Test your anime knowledge with daily trivia questions',
    image: 'https://via.placeholder.com/400x300/10b981/ffffff?text=Anime+Quiz',
    category: 'trivia',
    difficulty: 'medium',
    maxPlayers: 100,
    entryFee: 0,
    prizePool: 100,
    isActive: true,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    endTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
    questions: [
      {
        id: 1,
        question: 'What is the name of the main character in "Attack on Titan"?',
        options: ['Eren Yeager', 'Mikasa Ackerman', 'Armin Arlert', 'Levi Ackerman'],
        correctAnswer: 0
      },
      {
        id: 2,
        question: 'Which studio animated "Demon Slayer"?',
        options: ['MAPPA', 'ufotable', 'A-1 Pictures', 'Bones'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'nft-battle',
    name: 'NFT Battle Arena',
    description: 'Battle your NFTs against other players in turn-based combat',
    image: 'https://via.placeholder.com/400x300/10b981/ffffff?text=NFT+Battle',
    category: 'combat',
    difficulty: 'hard',
    maxPlayers: 50,
    entryFee: 10,
    prizePool: 500,
    isActive: true,
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    endTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    rules: {
      maxNFTs: 3,
      battleType: 'turn-based',
      rounds: 5
    }
  },
  {
    id: 'collection-race',
    name: 'Collection Race',
    description: 'Race to collect the most valuable NFT sets within time limit',
    image: 'https://via.placeholder.com/400x300/10b981/ffffff?text=Collection+Race',
    category: 'collection',
    difficulty: 'easy',
    maxPlayers: 200,
    entryFee: 5,
    prizePool: 1000,
    isActive: false,
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    targetSets: ['rare-anime', 'legendary-characters', 'limited-edition']
  }
];

// Mock leaderboards data
const mockLeaderboards = {
  'anime-quiz': [
    { rank: 1, username: 'AnimeMaster', score: 95, time: '00:45', date: new Date() },
    { rank: 2, username: 'OtakuKing', score: 92, time: '00:52', date: new Date() },
    { rank: 3, username: 'WeebQueen', score: 88, time: '00:58', date: new Date() }
  ],
  'nft-battle': [
    { rank: 1, username: 'BattleLord', wins: 15, losses: 2, winRate: '88%', date: new Date() },
    { rank: 2, username: 'CombatMaster', wins: 12, losses: 5, winRate: '71%', date: new Date() },
    { rank: 3, username: 'FighterPro', wins: 10, losses: 6, winRate: '63%', date: new Date() }
  ]
};

// Mock user game stats
const mockUserStats = {
  'anime-quiz': { gamesPlayed: 5, bestScore: 88, averageScore: 75, totalWinnings: 25 },
  'nft-battle': { gamesPlayed: 8, wins: 6, losses: 2, totalWinnings: 120 }
};

// GET /api/games - List all games
router.get('/', authenticateToken, (req, res) => {
  try {
    const { category, difficulty, isActive } = req.query;
    
    let filteredGames = mockGames;
    
    if (category) {
      filteredGames = filteredGames.filter(game => game.category === category);
    }
    
    if (difficulty) {
      filteredGames = filteredGames.filter(game => game.difficulty === difficulty);
    }
    
    if (isActive !== undefined) {
      filteredGames = filteredGames.filter(game => game.isActive === (isActive === 'true'));
    }
    
    res.json({
      success: true,
      data: {
        games: filteredGames,
        total: filteredGames.length,
        categories: [...new Set(mockGames.map(g => g.category))],
        difficulties: [...new Set(mockGames.map(g => g.difficulty))]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch games',
      error: error.message
    });
  }
});

// GET /api/games/:gameId - Get specific game details
router.get('/:gameId', authenticateToken, (req, res) => {
  try {
    const { gameId } = req.params;
    const game = mockGames.find(g => g.id === gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Get user stats for this game if they exist
    const userStats = mockUserStats[gameId] || null;
    
    res.json({
      success: true,
      data: {
        game,
        userStats,
        leaderboard: mockLeaderboards[gameId] || []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game details',
      error: error.message
    });
  }
});

// POST /api/games/:gameId/join - Join a game
router.post('/:gameId/join', authenticateToken, requireWhitelist, (req, res) => {
  try {
    const { gameId } = req.params;
    const { userId } = req.user;
    
    const game = mockGames.find(g => g.id === gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    if (!game.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Game is not currently active'
      });
    }
    
    if (game.entryFee > 0) {
      // TODO: Implement Flow token transfer for entry fee
      // This would interact with the Flow blockchain
    }
    
    // TODO: Add user to game participants in database
    // This would create a game session record
    
    res.json({
      success: true,
      message: 'Successfully joined game',
      data: {
        gameId,
        entryTime: new Date(),
        gameStartTime: game.startTime
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to join game',
      error: error.message
    });
  }
});

// POST /api/games/:gameId/submit - Submit game results
router.post('/:gameId/submit', authenticateToken, requireWhitelist, (req, res) => {
  try {
    const { gameId } = req.params;
    const { userId } = req.user;
    const { score, answers, timeSpent, gameData } = req.body;
    
    const game = mockGames.find(g => g.id === gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // TODO: Validate game submission
    // - Check if user is actually in the game
    // - Verify game is still active
    // - Validate answers and calculate score
    
    // TODO: Update leaderboard and user stats in database
    
    // Mock response
    const rank = Math.floor(Math.random() * 10) + 1;
    const winnings = rank <= 3 ? [100, 50, 25][rank - 1] : 0;
    
    res.json({
      success: true,
      message: 'Game results submitted successfully',
      data: {
        gameId,
        score,
        rank,
        winnings,
        submittedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit game results',
      error: error.message
    });
  }
});

// GET /api/games/:gameId/leaderboard - Get game leaderboard
router.get('/:gameId/leaderboard', authenticateToken, (req, res) => {
  try {
    const { gameId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const leaderboard = mockLeaderboards[gameId] || [];
    
    if (!leaderboard.length) {
      return res.json({
        success: true,
        data: {
          leaderboard: [],
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    }
    
    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLeaderboard = leaderboard.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        leaderboard: paginatedLeaderboard,
        total: leaderboard.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(leaderboard.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
});

// GET /api/games/user/stats - Get user's game statistics
router.get('/user/stats', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    
    // TODO: Fetch actual user stats from database
    const userStats = {
      totalGames: 13,
      totalWinnings: 145,
      favoriteGame: 'anime-quiz',
      achievements: [
        { id: 'first-win', name: 'First Victory', description: 'Win your first game', unlockedAt: new Date() },
        { id: 'quiz-master', name: 'Quiz Master', description: 'Score 90+ in anime quiz', unlockedAt: new Date() }
      ],
      gameStats: mockUserStats
    };
    
    res.json({
      success: true,
      data: userStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user stats',
      error: error.message
    });
  }
});

// POST /api/games/:gameId/claim-rewards - Claim game rewards
router.post('/:gameId/claim-rewards', authenticateToken, requireWhitelist, (req, res) => {
  try {
    const { gameId } = req.params;
    const { userId } = req.user;
    
    // TODO: Implement reward claiming logic
    // - Check if user has unclaimed rewards
    // - Transfer Flow tokens or NFTs
    // - Update claim status in database
    
    res.json({
      success: true,
      message: 'Rewards claimed successfully',
      data: {
        gameId,
        claimedAt: new Date(),
        rewards: {
          tokens: 25,
          nfts: []
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to claim rewards',
      error: error.message
    });
  }
});

module.exports = router;
