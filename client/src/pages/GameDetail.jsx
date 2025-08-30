import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

const GameDetail = () => {
  const { gameSlug } = useParams();
  const navigate = useNavigate();
  const { user, isConnected } = useWallet();
  const queryClient = useQueryClient();
  const [selectedDifficulty, setSelectedDifficulty] = useState('normal');

  const { data: gameData, isLoading: gameLoading } = useQuery({
    queryKey: ['game-detail', gameSlug],
    queryFn: () => api.get(`/games/${gameSlug}`),
    enabled: !!gameSlug,
    staleTime: 2 * 60 * 1000,
  });

  const joinGameMutation = useMutation({
    mutationFn: (data) => api.post(`/games/${gameSlug}/join`, data),
    onSuccess: () => {
      toast.success('Successfully joined the game!');
      queryClient.invalidateQueries(['game-detail', gameSlug]);
      queryClient.invalidateQueries(['user-games']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to join game');
    }
  });

  const submitResultMutation = useMutation({
    mutationFn: (data) => api.post(`/games/${gameSlug}/result`, data),
    onSuccess: () => {
      toast.success('Result submitted successfully!');
      queryClient.invalidateQueries(['game-detail', gameSlug]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit result');
    }
  });

  const handleJoinGame = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    joinGameMutation.mutate({
      difficulty: selectedDifficulty,
      walletAddress: user?.flowWalletAddress
    });
  };

  const handleSubmitResult = (score, time) => {
    submitResultMutation.mutate({
      score,
      time,
      walletAddress: user?.flowWalletAddress
    });
  };

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

  if (gameLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!gameData?.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Game Not Found
          </h1>
          <button
            onClick={() => navigate('/gamezone')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            Back to Game Zone
          </button>
        </div>
      </div>
    );
  }

  const game = gameData.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-16 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              {/* Game Image */}
              <div className="flex-shrink-0">
                <img
                  src={game.image}
                  alt={game.name}
                  className="w-48 h-48 rounded-2xl object-cover shadow-lg"
                />
              </div>
              
              {/* Game Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    {game.name}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    game.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    game.difficulty === 'normal' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {game.difficulty}
                  </span>
                </div>
                
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                  {game.description}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">
                      {game.maxPlayers}
                    </div>
                    <div className="text-sm text-gray-500">Max Players</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {game.entryFee}
                    </div>
                    <div className="text-sm text-gray-500">Entry Fee (FLOW)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {game.prizePool}
                    </div>
                    <div className="text-sm text-gray-500">Prize Pool (FLOW)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {game.participants?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Current Players</div>
                  </div>
                </div>
                
                {/* Join Game Section */}
                {game.isActive && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      🎮 Join This Game
                    </h3>
                    
                    <div className="flex flex-wrap gap-4 items-center">
                      <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="easy">Easy</option>
                        <option value="normal">Normal</option>
                        <option value="hard">Hard</option>
                      </select>
                      
                      <button
                        onClick={handleJoinGame}
                        disabled={joinGameMutation.isPending || !isConnected}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                      >
                        {joinGameMutation.isPending ? 'Joining...' : '🎯 Join Game'}
                      </button>
                      
                      {!isConnected && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Connect wallet to join
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Game Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-4 sm:px-6 lg:px-8 pb-20"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Game Rules */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              📋 Game Rules
            </h3>
            <div className="prose dark:prose-invert max-w-none">
              <div className="text-gray-600 dark:text-gray-400 space-y-2">
                {game.rules?.map((rule, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-emerald-500 font-bold">{index + 1}.</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Game Questions */}
          {game.questions && game.questions.length > 0 && (
            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                ❓ Sample Questions
              </h3>
              <div className="space-y-4">
                {game.questions.slice(0, 3).map((question, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="font-medium text-gray-900 dark:text-white mb-2">
                      {question.question}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {question.options?.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-2 rounded border ${
                            option === question.correctAnswer
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </span>
                          {option === question.correctAnswer && (
                            <span className="ml-2 text-green-600">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Leaderboard */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🏆 Leaderboard
            </h3>
            
            {game.leaderboard && game.leaderboard.length > 0 ? (
              <div className="space-y-3">
                {game.leaderboard.slice(0, 10).map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {entry.username || `Player ${entry.walletAddress?.slice(0, 8)}...`}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Score: {entry.score}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {entry.time ? `${entry.time}s` : 'N/A'}
                      </div>
                      {index < 3 && (
                        <div className="text-lg">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                No scores yet. Be the first to play!
              </div>
            )}
          </motion.div>

          {/* Game Statistics */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              📊 Game Statistics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <div className="text-3xl font-bold text-emerald-600 mb-2">
                  {game.statistics?.totalGames || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Games Played</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {game.statistics?.averageScore || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Average Score</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {game.statistics?.totalPrizePool || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Prizes (FLOW)</div>
              </div>
            </div>
          </motion.div>

          {/* Back Button */}
          <motion.div variants={itemVariants} className="text-center">
            <button
              onClick={() => navigate('/gamezone')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold transition-colors"
            >
              ← Back to Game Zone
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default GameDetail;
