import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

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

  const computeProgress = (startTime, endTime) => {
    try {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      const now = Date.now();
      if (!isFinite(start) || !isFinite(end) || end <= start) return 0;
      if (now <= start) return 0;
      if (now >= end) return 100;
      return Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
    } catch {
      return 0;
    }
  };

  const normalizedMatches = useMemo(() => {
    const raw = matchesData?.data?.matches || [];
    return raw.map((m) => {
      const participants = Array.isArray(m.participants)
        ? m.participants
        : (Array.isArray(m.options)
            ? m.options.map((opt, idx) => ({ id: `${m.id}_${idx}`, name: String(opt), odds: '2.0' }))
            : []);

      return {
        id: m.id,
        title: m.title,
        description: m.description,
        startTime: m.startTime,
        endTime: m.endTime,
        status: m.status,
        category: m.category,
        type: m.category,
        totalBets: m.totalBets ?? 0,
        totalVolume: m.totalVolume ?? 0,
        totalPool: m.totalVolume ?? 0,
        minBet: m.minBet ?? 1,
        maxBet: m.maxBet ?? 100,
        progress: m.progress ?? computeProgress(m.startTime, m.endTime),
        metadata: m.metadata || {},
        participants,
      };
    });
  }, [matchesData]);

  const filteredMatches = normalizedMatches.filter((match) => {
    const matchesCategory = selectedCategory === 'all' || match.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || match.status === selectedStatus;
    return matchesCategory && matchesStatus;
  });

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

  // Map popular matches to provided images when backend doesn't include one
  const getMatchImage = (match) => {
    if (match?.metadata?.image) return match.metadata.image;
    const t = (match?.title || '').toLowerCase();
    if (t.includes('naruto') && t.includes('sasuke')) {
      return 'https://i.pinimg.com/736x/e9/1a/13/e91a1331ad8950ce2727dcd287a2cdb8.jpg';
    }
    if (t.includes('one piece') && t.includes('treasure')) {
      return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSonkEZ8Yc4SEifhgi8rB6hkELXWRWls7gOyw&s';
    }
    if (t.includes('dragon ball') && t.includes('tournament')) {
      return 'https://wallpapers.com/images/hd/dragon-ball-super-ultra-instinct-vtm3rprigp9ovrmu.jpg';
    }
    return 'https://via.placeholder.com/400x200/10b981/ffffff?text=Match';
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
                  key={match.id}
                  variants={itemVariants}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  {/* Match Image */}
                  <div className="relative overflow-hidden">
                    <img
                      src={getMatchImage(match)}
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
                        Participants ({(match.participants || []).length})
                      </h4>
                      <div className="space-y-2">
                        {(match.participants || []).slice(0, 3).map((participant, index) => (
                          <div key={participant.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {index + 1}. {participant.name}
                            </span>
                            <span className="font-semibold text-emerald-600">
                              {participant.odds}x
                            </span>
                          </div>
                        ))}
                        {(match.participants || []).length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{(match.participants || []).length - 3} more
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
                        <BetButton match={match} disabled={!isConnected} />
                      )}
                      {match.status === 'active' && (
                        <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors font-medium">
                          In-Play
                        </button>
                      )}
                      {match.status === 'completed' && (
                        <button className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg transition-colors font-medium">
                          Settled
                        </button>
                      )}
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Markets
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

// Bet modal and button (UI only; no schema/model changes)
const BetButton = ({ match, disabled }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white py-2 rounded-lg transition-colors font-medium"
      >
        Place Bet
      </button>
      <AnimatePresence>
        {open && (
          <BetModal match={match} onClose={() => setOpen(false)} />)
        }
      </AnimatePresence>
    </>
  );
};

const BetModal = ({ match, onClose }) => {
  const [selection, setSelection] = useState(match.participants?.[0]?.id || '');
  const [stake, setStake] = useState(match.minBet || 1);
  const selected = match.participants?.find(p => p.id === selection);
  const potential = selected ? Number((Number(stake || 0) * Number(selected.odds || 1)).toFixed(2)) : 0;

  const placeBet = () => {
    toast.success('Bet placed! (UI only)');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs uppercase text-gray-500">Bet Slip</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{match.title}</div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Select Market</div>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                value={selection}
                onChange={(e) => setSelection(e.target.value)}
              >
                {(match.participants || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} • {p.odds}x</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Stake (FLOW)</span>
                <span className="text-xs">Min {match.minBet} • Max {match.maxBet}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={match.minBet}
                  max={match.maxBet}
                  step="1"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
                <div className="text-sm text-gray-500">FLOW</div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Potential Return</span>
                <span className="font-semibold text-emerald-600">{potential} FLOW</span>
              </div>
            </div>

            <button
              onClick={placeBet}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Place Bet
            </button>
            <div className="text-xs text-gray-500 text-center">UI-only demo. No funds are moved.</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

