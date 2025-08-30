import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

const WalletDashboard = () => {
  const { walletAddress } = useParams();
  const { user, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user-profile', walletAddress],
    queryFn: () => api.get(`/auth/user/${walletAddress}`),
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000,
  });

  const { data: nftsData, isLoading: nftsLoading } = useQuery({
    queryKey: ['user-nfts', walletAddress],
    queryFn: () => api.get(`/nfts/owner/${walletAddress}`),
    enabled: !!walletAddress,
    staleTime: 2 * 60 * 1000,
  });

  const { data: bettingData, isLoading: bettingLoading } = useQuery({
    queryKey: ['user-betting', walletAddress],
    queryFn: () => api.get(`/betting/user/${walletAddress}`),
    enabled: !!walletAddress,
    staleTime: 2 * 60 * 1000,
  });

  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ['user-games', walletAddress],
    queryFn: () => api.get(`/games/user/${walletAddress}`),
    enabled: !!walletAddress,
    staleTime: 2 * 60 * 1000,
  });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'nfts', name: 'My NFTs', icon: '🖼️' },
    { id: 'betting', name: 'Betting History', icon: '🎲' },
    { id: 'games', name: 'Game Stats', icon: '🎮' },
    { id: 'activity', name: 'Activity', icon: '📈' },
  ];

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'bg-orange-100 text-orange-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'uncommon': return 'bg-green-100 text-green-800';
      case 'common': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRarityBadge = (rarity) => {
    switch (rarity) {
      case 'legendary': return '🔥';
      case 'epic': return '💎';
      case 'rare': return '🌟';
      case 'uncommon': return '✨';
      case 'common': return '⚪';
      default: return '⚪';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Wallet Not Connected
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please connect your Flow wallet to view your dashboard
          </p>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold transition-colors">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-16 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  🏠 Wallet Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Welcome back, {userData?.data?.username || 'Anon'}!
                </p>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {walletAddress}
                </div>
              </div>
              
              <div className="mt-4 lg:mt-0 flex gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {userData?.data?.nftCount || 0}
                  </div>
                  <div className="text-sm text-gray-500">NFTs Owned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {userData?.data?.collections?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Collections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {userData?.data?.totalValue || 0}
                  </div>
                  <div className="text-sm text-gray-500">Total Value</div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
                <div className="text-emerald-600 text-2xl mb-2">🎯</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {userData?.data?.stats?.totalMinted || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Minted</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                <div className="text-blue-600 text-2xl mb-2">💰</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {userData?.data?.stats?.totalEarned || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">FLOW Earned</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
                <div className="text-purple-600 text-2xl mb-2">🏆</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {userData?.data?.stats?.achievements || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Achievements</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl">
                <div className="text-orange-600 text-2xl mb-2">⭐</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {userData?.data?.stats?.level || 1}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 sm:px-6 lg:px-8 mb-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-lg">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-4 sm:px-6 lg:px-8 pb-20"
      >
        <div className="max-w-7xl mx-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Recent Activity */}
              <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  📈 Recent Activity
                </h3>
                <div className="space-y-4">
                  {userData?.data?.recentActivity?.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{activity.icon}</div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {activity.title}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(activity.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Top Collections */}
              <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  🎨 Top Collections
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userData?.data?.topCollections?.slice(0, 6).map((collection, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={collection.image}
                          alt={collection.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {collection.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {collection.count} NFTs
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* NFTs Tab */}
          {activeTab === 'nfts' && (
            <div className="space-y-6">
              <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  🖼️ My NFT Collection
                </h3>
                
                {nftsLoading ? (
                  <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading NFTs...</p>
                  </div>
                ) : nftsData?.data?.nfts?.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🖼️</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      No NFTs Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Start building your collection by minting or purchasing NFTs
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nftsData?.data?.nfts?.map((nft) => (
                      <div key={nft.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden group cursor-pointer">
                        <div className="relative overflow-hidden">
                          <img
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-4 left-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getRarityColor(nft.attributes.rarity)}`}>
                              {getRarityBadge(nft.attributes.rarity)} {nft.attributes.rarity}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                            {nft.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {nft.description}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Collection</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {nft.collection}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Betting Tab */}
          {activeTab === 'betting' && (
            <div className="space-y-6">
              <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  🎲 Betting History
                </h3>
                
                {bettingLoading ? (
                  <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading betting history...</p>
                  </div>
                ) : bettingData?.data?.bets?.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🎲</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      No Bets Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Start placing bets in the betting arena
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bettingData?.data?.bets?.map((bet) => (
                      <div key={bet.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {bet.match.title}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            bet.status === 'won' ? 'bg-green-100 text-green-800' :
                            bet.status === 'lost' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {bet.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Bet Amount:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {bet.betAmount} FLOW
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Potential Winnings:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {bet.potentialWinnings} FLOW
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Games Tab */}
          {activeTab === 'games' && (
            <div className="space-y-6">
              <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  🎮 Game Statistics
                </h3>
                
                {gamesLoading ? (
                  <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading game stats...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gamesData?.data?.games?.map((game) => (
                      <div key={game.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-3xl">{game.icon}</div>
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">
                              {game.name}
                            </h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {game.category}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Games Played:</span>
                            <span className="font-medium">{game.stats.gamesPlayed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Wins:</span>
                            <span className="font-medium text-green-600">{game.stats.wins}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Win Rate:</span>
                            <span className="font-medium text-blue-600">
                              {((game.stats.wins / game.stats.gamesPlayed) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  📈 Activity Timeline
                </h3>
                
                <div className="space-y-4">
                  {userData?.data?.activity?.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl">{activity.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(activity.timestamp)}
                        </div>
                      </div>
                      {activity.amount && (
                        <div className="text-right">
                          <div className={`font-bold ${
                            activity.type === 'earned' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {activity.type === 'earned' ? '+' : '-'}{activity.amount}
                          </div>
                          <div className="text-xs text-gray-500">FLOW</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default WalletDashboard;
