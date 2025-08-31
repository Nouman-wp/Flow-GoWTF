import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const Marketplace = () => {
  const { user } = useWallet();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Fetch collections
  const { data: collectionsData, isLoading: collectionsLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => api.get('/nfts/collections'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch featured NFTs
  const { data: featuredNFTs, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-nfts'],
    queryFn: () => api.get('/nfts/featured'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const categories = [
    { id: 'all', name: 'All Categories', icon: '🌟' },
    { id: 'anime', name: 'Anime', icon: '🎌' },
    { id: 'gaming', name: 'Gaming', icon: '🎮' },
    { id: 'art', name: 'Art', icon: '🎨' },
    { id: 'collectibles', name: 'Collectibles', icon: '💎' },
    { id: 'limited', name: 'Limited Edition', icon: '🔥' },
  ];

  const rarities = [
    { id: 'all', name: 'All Rarities', color: 'text-gray-600' },
    { id: 'common', name: 'Common', color: 'text-gray-500' },
    { id: 'uncommon', name: 'Uncommon', color: 'text-green-500' },
    { id: 'rare', name: 'Rare', color: 'text-blue-500' },
    { id: 'epic', name: 'Epic', color: 'text-purple-500' },
    { id: 'legendary', name: 'Legendary', color: 'text-orange-500' },
    { id: 'mythic', name: 'Mythic', color: 'text-red-500' },
  ];

  const sortOptions = [
    { id: 'newest', name: 'Newest First' },
    { id: 'oldest', name: 'Oldest First' },
    { id: 'price-high', name: 'Price: High to Low' },
    { id: 'price-low', name: 'Price: Low to High' },
    { id: 'rarity', name: 'Rarity' },
    { id: 'popularity', name: 'Most Popular' },
  ];

  const filteredCollections = collectionsData?.data?.collections?.filter(collection => {
    const matchesSearch = collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         collection.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || collection.category === selectedCategory;
    const matchesRarity = selectedRarity === 'all' || collection.attributes?.rarity === selectedRarity;
    
    return matchesSearch && matchesCategory && matchesRarity;
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
            NFT Marketplace
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Discover, collect, and trade unique anime NFTs on the Flow blockchain. 
            From rare collectibles to limited editions, find your perfect digital treasure.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search collections, NFTs, or creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 text-lg border-2 border-emerald-200 rounded-full focus:border-emerald-500 focus:outline-none shadow-lg bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
              <button className="absolute right-2 top-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-full transition-colors">
                🔍
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters and Sort */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 sm:px-6 lg:px-8 mb-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
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

            {/* Rarity Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Rarity:</span>
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {rarities.map((rarity) => (
                  <option key={rarity.id} value={rarity.id} className={rarity.color}>
                    {rarity.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Featured NFTs */}
      {featuredNFTs?.data?.nfts?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 sm:px-6 lg:px-8 mb-12"
        >
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              🌟 Featured NFTs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredNFTs.data.nfts.map((nft) => (
                <motion.div
                  key={nft._id}
                  variants={itemVariants}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={nft.image?.startsWith('ipfs://') ? nft.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') : nft.image}
                      alt={nft.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                        nft.rarity === 'legendary' ? 'bg-orange-500' :
                        nft.rarity === 'epic' ? 'bg-purple-500' :
                        nft.rarity === 'rare' ? 'bg-blue-500' :
                        nft.rarity === 'uncommon' ? 'bg-green-500' :
                        'bg-gray-500'
                      }`}>
                        {nft.rarity}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {nft.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {nft.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-emerald-600">
                        {nft.isForSale && typeof nft.salePrice === 'number' ? `${nft.salePrice} FLOW` : 'Not for sale'}
                      </span>
                      <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Collections Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-4 sm:px-6 lg:px-8 pb-20"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            📚 Collections
          </h2>
          
          {collectionsLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading collections...</p>
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No collections found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search terms or filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCollections.map((collection) => (
                <motion.div
                  key={collection._id}
                  variants={itemVariants}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={collection.image?.startsWith('ipfs://') ? collection.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') : collection.image}
                      alt={collection.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="text-xl font-bold mb-2">{collection.name}</h3>
                      <p className="text-sm opacity-90 line-clamp-2">
                        {collection.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        collection.attributes?.rarity === 'legendary' ? 'bg-orange-100 text-orange-800' :
                        collection.attributes?.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                        collection.attributes?.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                        collection.attributes?.rarity === 'uncommon' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {collection.attributes?.rarity || 'common'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {collection.supply?.minted || 0} / {collection.supply?.total || '∞'}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Floor Price:</span>
                        <span className="font-semibold text-emerald-600">
                          {collection.statistics?.floorPrice ? `${collection.statistics.floorPrice} FLOW` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Total Volume:</span>
                        <span className="font-semibold text-emerald-600">
                          {collection.statistics?.totalVolume ? `${collection.statistics.totalVolume} FLOW` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Owners:</span>
                        <span className="font-semibold text-emerald-600">
                          {collection.statistics?.uniqueOwners || 0}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Mint Price: {collection.pricing?.mintPrice ? `${collection.pricing.mintPrice} FLOW` : 'Free'}
                        </span>
                        <a href={`/marketplace/${collection._id}/view`} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-colors font-medium">
                          Explore Collection
                        </a>
                      </div>
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

export default Marketplace;
