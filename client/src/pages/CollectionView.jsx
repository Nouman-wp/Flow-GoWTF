import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

const CollectionView = () => {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useWallet();
  const [filterRarity, setFilterRarity] = useState('all');

  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ['collection', collectionId],
    queryFn: () => api.get(`/nfts/collections/${collectionId}`),
    enabled: !!collectionId,
  });

  const { data: nftsData, isLoading: nftsLoading } = useQuery({
    queryKey: ['collection-nfts', collectionId],
    queryFn: () => api.get(`/nfts/collections/${collectionId}/nfts`),
    enabled: !!collectionId,
  });

  const rarities = [
    { id: 'all', name: 'All Rarities' },
    { id: 'common', name: 'Common' },
    { id: 'uncommon', name: 'Uncommon' },
    { id: 'rare', name: 'Rare' },
    { id: 'epic', name: 'Epic' },
    { id: 'legendary', name: 'Legendary' },
    { id: 'mythic', name: 'Mythic' },
  ];

  const filteredNFTs = nftsData?.data?.nfts?.filter(nft => {
    return filterRarity === 'all' || nft.rarity === filterRarity;
  }) || [];

  if (collectionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!collection?.data?.collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Collection not found
          </h3>
          <button
            onClick={() => navigate('/marketplace')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const collectionData = collection.data.collection;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Collection Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="absolute inset-0 z-0">
          <img
            src={collectionData.banner || collectionData.image}
            alt={collectionData.name}
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 to-blue-900/80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="flex-shrink-0">
              <img
                src={collectionData.image}
                alt={collectionData.name}
                className="w-32 h-32 lg:w-48 lg:h-48 rounded-2xl shadow-2xl border-4 border-white dark:border-gray-800"
              />
            </div>

            <div className="flex-1 text-white">
              <h1 className="text-4xl lg:text-6xl font-bold mb-4">{collectionData.name}</h1>
              <p className="text-xl lg:text-2xl text-emerald-100 mb-6 max-w-3xl">
                {collectionData.description}
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{collectionData.supply?.minted || 0}</div>
                  <div className="text-emerald-200">Minted</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{collectionData.supply?.total || '∞'}</div>
                  <div className="text-emerald-200">Total Supply</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{collectionData.statistics?.uniqueOwners || 0}</div>
                  <div className="text-emerald-200">Owners</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {collectionData.statistics?.floorPrice ? `${collectionData.statistics.floorPrice} FLOW` : 'N/A'}
                  </div>
                  <div className="text-emerald-200">Floor Price</div>
                </div>
              </div>
            </div>
          </div>
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
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filter by Rarity:</span>
              <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {rarities.map((rarity) => (
                  <option key={rarity.id} value={rarity.id}>
                    {rarity.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* NFTs Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 sm:px-6 lg:px-8 pb-20"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            NFTs in Collection
          </h2>
          
          {nftsLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading NFTs...</p>
            </div>
          ) : filteredNFTs.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No NFTs found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNFTs.map((nft) => (
                <motion.div
                  key={nft._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={nft.image}
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
                        {nft.price ? `${nft.price} FLOW` : 'Not for sale'}
                      </span>
                      <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors">
                        View Details
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

export default CollectionView;
