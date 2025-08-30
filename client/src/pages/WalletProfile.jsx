import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

const WalletProfile = () => {
  const { walletAddress } = useParams();
  const { user, isConnected } = useWallet();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    avatar: ''
  });

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user-profile', walletAddress],
    queryFn: () => api.get(`/auth/user/${walletAddress}`),
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000,
    onSuccess: (data) => {
      if (data?.data) {
        setFormData({
          username: data.data.username || '',
          email: data.data.email || '',
          bio: data.data.bio || '',
          avatar: data.data.avatar || ''
        });
      }
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.put('/auth/profile', data),
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      queryClient.invalidateQueries(['user-profile', walletAddress]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Wallet Not Connected
          </h1>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold transition-colors">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-16 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  👤 Profile Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your profile information
                </p>
              </div>
              
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  ✏️ Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={updateProfileMutation.isPending}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? '💾 Saving...' : '💾 Save'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                  >
                    ❌ Cancel
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </form>

            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                📊 Account Statistics
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {userData?.data?.stats?.totalMinted || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">NFTs Minted</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {userData?.data?.stats?.totalEarned || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">FLOW Earned</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {userData?.data?.stats?.achievements || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Achievements</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WalletProfile;
