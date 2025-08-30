import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

const Betting = () => {
  const { user, isConnected } = useWallet();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['betting-matches'],
    queryFn: () => api.get('/betting/matches'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const categories = [
    { id: 'all', name: 'All Categories', icon: '🎯' },
    { id: 'anime', name: 'Anime', icon: '🎌' },
    { id: 'gaming', name: 'Gaming', icon: '🎮' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'esports', name: 'Esports', icon: '🏆' },
    { id: 'prediction', name: 'Prediction', icon: '🔮' },
  ];

  const statuses = [
    { id: 'all', name: 'All Status', color: 'text-gray-600' },
    { id: 'upcoming', name: 'Upcoming', color: 'text-blue-600' },
    { id: 'active', name: 'Active', color: 'text-green-600' },
    { id: 'locked', name: 'Locked', color: 'text-orange-600' },
    { id: 'completed', name: 'Completed', color: 'text-purple-600' },
  ];

  const filteredMatches = matchesData?.data?.matches?.filter(match => {
    const matchesCategory = selectedCategory === 'all' || match.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || match.status === selectedStatus;
    return matchesCategory && matchesStatus;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'locked': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'locked': return 'bg-orange-500';
      case 'completed': return 'bg-purple-500';
      default: return 'bg-gray-500';
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
            🎯 Betting Arena
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Place bets on your favorite anime, gaming, and sports events. 
            Use your knowledge to earn FLOW tokens and compete with other players.
          </p>
          
          {!isConnected && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-emerald-800 dark:text-emerald-200 mb-4">
                Connect your Flow wallet to start betting!
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

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id} className={status.color}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Matches Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-4 sm:px-6 lg:px-8 pb-20"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            🏆 Active Matches
          </h2>
          
          {matchesLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading matches...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No matches found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMatches.map((match) => (
                <motion.div
                  key={match.matchId}
                  variants={itemVariants}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  {/* Match Image */}
                  <div className="relative overflow-hidden">
                    <img
                      src={match.metadata?.image || 'https://via.placeholder.com/400x200/10b981/ffffff?text=Match'}
                      alt={match.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(match.status)}`}>
                        {match.status}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold">
                        {match.type}
                      </span>
                    </div>
                  </div>
                  
                  {/* Match Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {match.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {match.description}
                    </p>
                    
                    {/* Match Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Progress</span>
                        <span>{formatTime(match.startTime)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(match.status)}`}
                          style={{ width: `${match.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Participants */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Participants ({match.participants.length})
                      </h4>
                      <div className="space-y-2">
                        {match.participants.slice(0, 3).map((participant, index) => (
                          <div key={participant.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {index + 1}. {participant.name}
                            </span>
                            <span className="font-semibold text-emerald-600">
                              {participant.odds}x
                            </span>
                          </div>
                        ))}
                        {match.participants.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{match.participants.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Match Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-emerald-600">
                          {match.totalPool} FLOW
                        </div>
                        <div className="text-xs text-gray-500">Prize Pool</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {match.totalBets}
                        </div>
                        <div className="text-xs text-gray-500">Total Bets</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {match.minBet}-{match.maxBet}
                        </div>
                        <div className="text-xs text-gray-500">Bet Range</div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="flex gap-2">
                      {match.status === 'upcoming' && (
                        <button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg transition-colors font-medium">
                          Place Bet
                        </button>
                      )}
                      {match.status === 'active' && (
                        <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors font-medium">
                          View Live
                        </button>
                      )}
                      {match.status === 'completed' && (
                        <button className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg transition-colors font-medium">
                          View Results
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

export default Betting;
