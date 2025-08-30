import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const Redeem = () => {
  const { user, isConnected } = useWallet();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: codesData, isLoading: codesLoading } = useQuery({
    queryKey: ['redemption-codes'],
    queryFn: () => api.get('/redeem/codes'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const categories = [
    { id: 'all', name: 'All Categories', icon: '🎁' },
    { id: 'promotional', name: 'Promotional', icon: '📢' },
    { id: 'reward', name: 'Rewards', icon: '🏆' },
    { id: 'limited_edition', name: 'Limited Edition', icon: '💎' },
    { id: 'beta_access', name: 'Beta Access', icon: '🔓' },
    { id: 'vip', name: 'VIP', icon: '👑' },
  ];

  const filteredCodes = codesData?.data?.codes?.filter(code => {
    const matchesSearch = code.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         code.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || code.metadata?.category === selectedCategory;
    return matchesSearch && matchesCategory;
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

  const formatExpiration = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Expiring soon';
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
            🎁 Redeem Codes
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Unlock exclusive NFTs and rewards with redemption codes! 
            From limited editions to beta access, discover unique digital treasures.
          </p>
          
          {!isConnected && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-emerald-800 dark:text-emerald-200 mb-4">
                Connect your Flow wallet to redeem codes!
              </p>
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold transition-colors">
                Connect Wallet
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 sm:px-6 lg:px-8 mb-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search codes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <div className="absolute right-3 top-2.5">🔍</div>
                </div>
              </div>

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
            </div>
          </div>
        </div>
      </motion.div>

      {/* Codes Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-4 sm:px-6 lg:px-8 pb-20"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            🎯 Available Codes
          </h2>
          
          {codesLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading codes...</p>
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No codes found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search terms or filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCodes.map((code) => (
                <motion.div
                  key={code.id}
                  variants={itemVariants}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  {/* Code Image */}
                  <div className="relative overflow-hidden">
                    <img
                      src={code.nftTemplate.image}
                      alt={code.nftTemplate.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getRarityColor(code.nftTemplate.attributes.rarity)}`}>
                        {getRarityBadge(code.nftTemplate.attributes.rarity)} {code.nftTemplate.attributes.rarity}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold">
                        {code.metadata?.category || 'promotional'}
                      </span>
                    </div>
                    {!code.isActive && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">Inactive</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Code Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {code.nftTemplate.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {code.description}
                    </p>
                    
                    {/* NFT Template Info */}
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        NFT Details
                      </h4>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <div>• Collection: {code.nftTemplate.collection}</div>
                        {code.nftTemplate.attributes.series && (
                          <div>• Series: {code.nftTemplate.attributes.series}</div>
                        )}
                        {code.nftTemplate.attributes.edition && (
                          <div>• Edition: {code.nftTemplate.edition}</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Redemption Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-emerald-600">
                          {code.remainingRedemptions}
                        </div>
                        <div className="text-xs text-gray-500">Remaining</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {code.rewards.tokens || 0}
                        </div>
                        <div className="text-xs text-gray-500">FLOW Tokens</div>
                      </div>
                    </div>
                    
                    {/* Expiration */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Expires</span>
                        <span className={code.isExpired ? 'text-red-500' : 'text-emerald-500'}>
                          {formatExpiration(code.expiresAt)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            code.isExpired ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${100 - (code.daysUntilExpiration / 30) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Requirements */}
                    {code.requirements && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Requirements
                        </h4>
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          {code.requirements.minBalance > 0 && (
                            <div>• Min Balance: {code.requirements.minBalance} FLOW</div>
                          )}
                          {code.requirements.minNFTs > 0 && (
                            <div>• Min NFTs: {code.requirements.minNFTs}</div>
                          )}
                          {code.requirements.whitelistOnly && (
                            <div>• Whitelist Only</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Button */}
                    <div className="flex gap-2">
                      {code.isActive && !code.isExpired && code.remainingRedemptions > 0 ? (
                        <button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg transition-colors font-medium">
                          Redeem Code
                        </button>
                      ) : (
                        <button className="flex-1 bg-gray-400 text-white py-2 rounded-lg font-medium cursor-not-allowed">
                          {code.isExpired ? 'Expired' : 'Unavailable'}
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

export default Redeem;
