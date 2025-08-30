import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aniverse-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('aniverse-token');
      window.location.href = '/';
    }
    
    // Handle 403 errors (forbidden)
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
    }
    
    // Handle 500 errors (server error)
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Authentication
  auth: {
    flowConnect: '/auth/flow-connect',
    me: '/auth/me',
    profile: '/auth/profile',
    preferences: '/auth/preferences',
    logout: '/auth/logout',
    userByWallet: (address) => `/auth/wallet/${address}`,
    adminUsers: '/auth/admin/users',
    updateWhitelist: (userId) => `/auth/admin/whitelist/${userId}`,
  },
  
  // NFTs
  nfts: {
    collections: '/nfts/collections',
    collection: (id) => `/nfts/collections/${id}`,
    nft: (id) => `/nfts/${id}`,
    mint: '/nfts/mint',
    transfer: '/nfts/transfer',
    like: (id) => `/nfts/${id}/like`,
    search: '/nfts/search',
    forSale: '/nfts/for-sale',
    byOwner: (ownerId) => `/nfts/owner/${ownerId}`,
    byCollection: (collectionId) => `/nfts/collection/${collectionId}`,
  },
  
  // IPFS
  ipfs: {
    upload: '/ipfs/upload',
    file: (cid) => `/ipfs/${cid}`,
  },
  
  // Betting
  betting: {
    matches: '/betting/matches',
    placeBet: '/betting/place-bet',
    userBets: '/betting/user-bets',
    match: (id) => `/betting/matches/${id}`,
  },
  
  // Games
  games: {
    list: '/games',
    game: (slug) => `/games/${slug}`,
    leaderboard: (slug) => `/games/${slug}/leaderboard`,
    submitScore: (slug) => `/games/${slug}/score`,
  },
  
  // Collections
  collections: {
    list: '/collections',
    collection: (id) => `/collections/${id}`,
    create: '/collections',
    update: (id) => `/collections/${id}`,
    delete: (id) => `/collections/${id}`,
  },
};

// Helper functions for common API operations
export const apiHelpers = {
  // Handle API errors
  handleError: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },
  
  // Format NFT data
  formatNFT: (nft) => ({
    ...nft,
    rarityColor: nft.rarity ? `rarity-${nft.rarity}` : 'rarity-common',
    ageInDays: nft.mintDate ? Math.ceil((Date.now() - new Date(nft.mintDate)) / (1000 * 60 * 60 * 24)) : 0,
  }),
  
  // Format collection data
  formatCollection: (collection) => ({
    ...collection,
    totalValue: collection.nfts?.reduce((sum, nft) => sum + (nft.salePrice || 0), 0) || 0,
    averagePrice: collection.nfts?.length > 0 
      ? collection.nfts.reduce((sum, nft) => sum + (nft.salePrice || 0), 0) / collection.nfts.length 
      : 0,
  }),
  
  // Pagination helper
  createPaginationParams: (page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc') => ({
    page,
    limit,
    sortBy,
    sortOrder,
  }),
  
  // Search helper
  createSearchParams: (query, filters = {}) => ({
    q: query,
    ...filters,
  }),
};

// Export the configured axios instance
export default api;
