import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './use-auth';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socketInstance = io(wsUrl, {
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('Connected to Socket.io server');
      setIsConnected(true);
      
      if (user) {
        socketInstance.emit('join-user-room', user.id);
        
        if (user.role === 'admin') {
          socketInstance.emit('join-admin-room');
        }
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  return { socket, isConnected };
}

export function useRealTimeOrders() {
  const { socket } = useSocket();
  const [newOrders, setNewOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleOrderCreated = (orderData: any) => {
      setNewOrders(prev => [orderData, ...prev]);
    };

    socket.on('orderCreated', handleOrderCreated);

    return () => {
      socket.off('orderCreated', handleOrderCreated);
    };
  }, [socket]);

  return { newOrders, clearNewOrders: () => setNewOrders([]) };
}