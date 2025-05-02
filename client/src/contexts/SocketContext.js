import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import AuthService from '../services/auth.service';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 'newSocket' is used for immediate operations; 'socket' is provided via context for the rest of the app
    const newSocket = io('http://localhost:4000', {
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);
    newSocket.on('connect', () => {
      const currentUser = AuthService.getCurrentUser();
      if (currentUser && currentUser.id) {
        newSocket.emit('join', { userId: currentUser.id });
        console.log('[Socket] Joined room', currentUser.id);
      }
    });
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
} 