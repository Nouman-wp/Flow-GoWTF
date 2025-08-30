import React, { createContext, useContext, useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();

  // Configure FCL
  useEffect(() => {
    const isProd = import.meta.env.PROD;
    const accessNode = isProd
      ? (import.meta.env.VITE_FLOW_ACCESS_NODE || 'https://rest-mainnet.onflow.org')
      : (import.meta.env.VITE_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org');
    const discoveryWallet = isProd
      ? (import.meta.env.VITE_FCL_DISCOVERY || 'https://fcl-discovery.onflow.org/authn')
      : (import.meta.env.VITE_FCL_DISCOVERY || 'https://fcl-discovery.onflow.org/testnet/authn');

    fcl.config()
      .put('accessNode.api', accessNode)
      .put('discovery.wallet', discoveryWallet)
      .put('discovery.authn.endpoint', discoveryWallet)
      .put('app.detail.title', isProd ? 'Aniverse NFT Platform' : 'Aniverse NFT Platform (Testnet)')
      .put('app.detail.icon', 'https://aniverse.com/icon.png');

    // Subscribe to user changes
    fcl.currentUser.subscribe((user) => {
      if (user && user.loggedIn) {
        handleUserConnected(user);
      } else {
        handleUserDisconnected();
      }
    });
  }, []);

  // Handle user connection
  const handleUserConnected = async (flowUser) => {
    try {
      setIsConnecting(true);
      
      // Connect to backend
      const response = await api.post('/auth/flow-connect', {
        flowWalletAddress: flowUser.addr,
        username: flowUser.addr.slice(-6), // Use last 6 chars as default username
      });

      if (response.data.token) {
        // Store token
        localStorage.setItem('aniverse-token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        // Set user state
        setUser(response.data.user);
        setIsConnected(true);
        
        toast.success('Wallet connected successfully!');
        
        // Invalidate and refetch user data
        queryClient.invalidateQueries(['user', flowUser.addr]);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
      
      // Disconnect from Flow if backend connection fails
      await fcl.unauthenticate();
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle user disconnection
  const handleUserDisconnected = () => {
    setUser(null);
    setIsConnected(false);
    localStorage.removeItem('aniverse-token');
    delete api.defaults.headers.common['Authorization'];
    
    // Invalidate all user-related queries
    queryClient.invalidateQueries(['user']);
    queryClient.invalidateQueries(['nfts']);
    queryClient.invalidateQueries(['collections']);
  };

  // Connect wallet
  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      await fcl.authenticate();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    try {
      await fcl.unauthenticate();
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  // Get user profile
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery(
    ['user', user?.flowWalletAddress],
    () => api.get('/auth/me').then(res => res.data.user),
    {
      enabled: isConnected && !!user?.flowWalletAddress,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Update user profile
  const updateProfileMutation = useMutation(
    (profileData) => api.put('/auth/profile', profileData),
    {
      onSuccess: (response) => {
        setUser(response.data.user);
        queryClient.invalidateQueries(['user', user?.flowWalletAddress]);
        toast.success('Profile updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      },
    }
  );

  // Update user preferences
  const updatePreferencesMutation = useMutation(
    (preferences) => api.put('/auth/preferences', preferences),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['user', user?.flowWalletAddress]);
        toast.success('Preferences updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update preferences');
      },
    }
  );

  // Check if user has collection
  const { data: hasCollection, isLoading: isLoadingCollection } = useQuery(
    ['collection', user?.flowWalletAddress],
    async () => {
      if (!user?.flowWalletAddress) return false;
      
      try {
        const account = await fcl.send([fcl.getAccount(user.flowWalletAddress)]);
        const decoded = await fcl.decode(account);
        const contractAddress = import.meta.env.VITE_FLOW_CONTRACT_ADDRESS;
        return contractAddress ? decoded.contracts[contractAddress] !== undefined : false;
      } catch (error) {
        console.error('Error checking collection:', error);
        return false;
      }
    },
    {
      enabled: isConnected && !!user?.flowWalletAddress,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Get Flow balance
  const { data: flowBalance, isLoading: isLoadingBalance } = useQuery(
    ['balance', user?.flowWalletAddress],
    async () => {
      if (!user?.flowWalletAddress) return 0;
      
      try {
        const account = await fcl.send([fcl.getAccount(user.flowWalletAddress)]);
        const decoded = await fcl.decode(account);
        return decoded.balance;
      } catch (error) {
        console.error('Error getting balance:', error);
        return 0;
      }
    },
    {
      enabled: isConnected && !!user?.flowWalletAddress,
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 30 * 1000, // Refetch every 30 seconds
    }
  );

  // Create collection
  const createCollectionMutation = useMutation(
    async () => {
      if (!user?.flowWalletAddress) throw new Error('User not connected');
      
      const contractAddress = import.meta.env.VITE_FLOW_CONTRACT_ADDRESS;
      if (!contractAddress) throw new Error('FLOW contract address not configured');

      const transactionId = await fcl.send([
        fcl.transaction(`
          import NonFungibleToken from 0xNonFungibleToken
          import AniverseNFT from ${contractAddress}
          
          transaction {
            prepare(signer: AuthAccount) {
              let collection <- AniverseNFT.createEmptyCollection()
              signer.save(<-collection, to: AniverseNFT.CollectionStoragePath)
              signer.link<&AniverseNFT.Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.ReceiverPublic, AniverseNFT.CollectionPublic}>(
                AniverseNFT.CollectionPublicPath,
                target: AniverseNFT.CollectionStoragePath
              )
            }
          }
        `),
        fcl.proposer(fcl.currentUser),
        fcl.authorizations([fcl.currentUser]),
        fcl.payer(fcl.currentUser)
      ]);
      
      return fcl.tx(transactionId).onceSealed();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['collection', user?.flowWalletAddress]);
        toast.success('Collection created successfully!');
      },
      onError: (error) => {
        console.error('Error creating collection:', error);
        toast.error('Failed to create collection');
      },
    }
  );

  const value = {
    // State
    user: userProfile || user,
    isConnected,
    isConnecting,
    hasCollection,
    flowBalance,
    
    // Loading states
    isLoadingProfile,
    isLoadingCollection,
    isLoadingBalance,
    
    // Actions
    connectWallet,
    disconnectWallet,
    updateProfile: updateProfileMutation.mutate,
    updatePreferences: updatePreferencesMutation.mutate,
    createCollection: createCollectionMutation.mutate,
    
    // Mutations
    updateProfileMutation,
    updatePreferencesMutation,
    createCollectionMutation,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
