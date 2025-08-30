import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useWallet } from './WalletContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isConnected: isWalletConnected } = useWallet();

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('🔌 Socket connected');
      setIsConnected(true);
      
      // Join user-specific room if connected
      if (isWalletConnected && user?.flowWalletAddress) {
        newSocket.emit('join-user-room', user.flowWalletAddress);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
      setIsConnected(false);
    });

    // Connect socket when wallet is connected
    if (isWalletConnected) {
      newSocket.connect();
    }

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [isWalletConnected]);

  // Reconnect socket when user changes
  useEffect(() => {
    if (socket && isWalletConnected && user?.flowWalletAddress) {
      socket.emit('join-user-room', user.flowWalletAddress);
    }
  }, [socket, isWalletConnected, user?.flowWalletAddress]);

  // Socket utility functions
  const socketUtils = {
    // Emit events
    emit: (event, data) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      }
    },

    // Listen to events
    on: (event, callback) => {
      if (socket) {
        socket.on(event, callback);
      }
    },

    // Remove event listener
    off: (event, callback) => {
      if (socket) {
        socket.off(event, callback);
      }
    },

    // Join room
    joinRoom: (room) => {
      if (socket && isConnected) {
        socket.emit('join-room', room);
      }
    },

    // Leave room
    leaveRoom: (room) => {
      if (socket && isConnected) {
        socket.emit('leave-room', room);
      }
    },

    // Place bet
    placeBet: (betData) => {
      if (socket && isConnected) {
        socket.emit('place-bet', betData);
      }
    },

    // Game action
    gameAction: (actionData) => {
      if (socket && isConnected) {
        socket.emit('game-action', actionData);
      }
    },

    // Send message
    sendMessage: (messageData) => {
      if (socket && isConnected) {
        socket.emit('send-message', messageData);
      }
    },
  };

  const value = {
    socket,
    isConnected,
    ...socketUtils,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
