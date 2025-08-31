import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const GameZone = () => {
  const { user, isConnected } = useWallet();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ['games'],
    queryFn: () => api.get('/games'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fallback static games when API returns nothing
  const staticGames = useMemo(() => ([
    {
      gameId: 'jujutsu-arena',
      name: 'Cursed Clash (Jujutsu Arena)',
      description: 'Jujutsu Kaisen inspired card-battle arena. Fast rounds, epic moves.',
      image: 'https://static.bandainamcoent.eu/high/jujutsu-kaisen/jujutsu-kaisen-cursed-clash/00-page-setup/jjk-news-announcement-thumbnail.jpg',
      category: 'combat',
      difficulty: 'medium',
      isActive: true,
      maxPlayers: 1,
      prizePool: 0,
      startTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      progress: 10,
      rules: { battleType: 'solo', rounds: 3 }
    },
    {
      gameId: 'poke-card-brawl',
      name: 'PokéCard Brawl',
      description: 'Turn-based card battles. Elemental counters and evolutions.',
      image: 'https://static0.gamerantimages.com/wordpress/wp-content/uploads/2021/04/pokemon-anime-characters.jpg?q=70&fit=contain&w=1200&h=628&dpr=1',
      category: 'trivia',
      difficulty: 'easy',
      isActive: false,
      maxPlayers: 2,
      prizePool: 0,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      progress: 0,
      rules: { maxNFTs: 5 }
    },
    {
      gameId: 'hashira-match',
      name: 'Hashira Match Quest',
      description: 'Match-3 puzzle with Demon Slayer inspired abilities.',
      image: 'https://static1.cbrimages.com/wordpress/wp-content/uploads/2024/06/demon-slayer-hashira-members.jpg',
      category: 'puzzle',
      difficulty: 'hard',
      isActive: false,
      maxPlayers: 1,
      prizePool: 0,
      startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      progress: 0
    }
  ]), []);

  const allGames = (gamesData?.data?.games && gamesData.data.games.length > 0)
    ? gamesData.data.games
    : staticGames;

  const categories = [
    { id: 'all', name: 'All Games', icon: '🎮' },
    { id: 'trivia', name: 'Trivia', icon: '🧠' },
    { id: 'combat', name: 'Combat', icon: '⚔️' },
    { id: 'collection', name: 'Collection', icon: '💎' },
    { id: 'puzzle', name: 'Puzzle', icon: '🧩' },
    { id: 'racing', name: 'Racing', icon: '🏁' },
  ];

  const difficulties = [
    { id: 'all', name: 'All Difficulties', color: 'text-gray-600' },
    { id: 'easy', name: 'Easy', color: 'text-green-600' },
    { id: 'medium', name: 'Medium', color: 'text-yellow-600' },
    { id: 'hard', name: 'Hard', color: 'text-orange-600' },
    { id: 'expert', name: 'Expert', color: 'text-red-600' },
  ];

  const filteredGames = allGames.filter(game => {
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || game.difficulty === selectedDifficulty;
    return matchesCategory && matchesDifficulty;
  }) || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date - now;
    
    if (diff <= 0) return 'Now';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🟠';
      case 'expert': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-20 px-4 sm:px-6 lg:px-8 text-center"
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-6">
            🎮 Game Zone
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Challenge yourself with exciting games and earn rewards! 
            From trivia challenges to NFT battles, there's something for every player.
          </p>
          
          {!isConnected && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-emerald-800 dark:text-emerald-200 mb-4">
                Connect your Flow wallet to start playing!
              </p>
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold transition-colors">
                Connect Wallet
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 sm:px-6 lg:px-8 mb-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category.id
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Difficulty Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Difficulty:</span>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty.id} value={difficulty.id} className={difficulty.color}>
                      {difficulty.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Games Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-4 sm:px-6 lg:px-8 pb-20"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            🎯 Available Games
          </h2>
          
          {gamesLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading games...</p>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No games found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGames.map((game) => (
                <motion.div
                  key={game.gameId}
                  variants={itemVariants}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  {/* Game Image */}
                  <div className="relative overflow-hidden">
                    <img
                      src={game.image}
                      alt={game.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getDifficultyColor(game.difficulty)}`}>
                        {getDifficultyBadge(game.difficulty)} {game.difficulty}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold">
                        {game.category}
                      </span>
                    </div>
                    {!game.isActive && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">Coming Soon</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Game Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {game.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {game.description}
                    </p>
                    
                    {/* Game Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-emerald-600">
                          {game.maxPlayers}
                        </div>
                        <div className="text-xs text-gray-500">Max Players</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {game.prizePool} FLOW
                        </div>
                        <div className="text-xs text-gray-500">Prize Pool</div>
                      </div>
                    </div>
                    
                    {/* Game Schedule */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Starts in</span>
                        <span>{formatTime(game.startTime)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300 bg-emerald-500"
                          style={{ width: `${game.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Game Rules (if available) */}
                    {game.rules && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Game Rules
                        </h4>
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          {game.rules.maxNFTs && (
                            <div>• Max NFTs: {game.rules.maxNFTs}</div>
                          )}
                          {game.rules.battleType && (
                            <div>• Type: {game.rules.battleType}</div>
                          )}
                          {game.rules.rounds && (
                            <div>• Rounds: {game.rules.rounds}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Button */}
                    <div className="flex gap-2">
                      {game.isActive ? (
                        <button
                          onClick={() => window.open('/gamezone/jujutsu-arena', '_blank')}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg transition-colors font-medium"
                        >
                          {game.entryFee > 0 ? `Play for ${game.entryFee} FLOW` : 'Play Now'}
                        </button>
                      ) : (
                        <button className="flex-1 bg-gray-400 text-white py-2 rounded-lg font-medium cursor-not-allowed">
                          Coming Soon
                        </button>
                      )}
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GameZone;
