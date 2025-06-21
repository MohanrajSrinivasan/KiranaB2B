import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !user.id) return;

    // Cleanup previous socket connection
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Join appropriate rooms based on user role
        if (user.role === 'admin') {
          newSocket.send(JSON.stringify({ type: 'join-admin-room' }));
        }
        newSocket.send(JSON.stringify({ type: 'join-user-room', userId: user.id }));
      };

      newSocket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      setSocket(newSocket);

      return () => {
        console.log('Cleaning up WebSocket connection');
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setIsConnected(false);
    }
  }, [user?.id, user?.role]); // Only depend on user ID and role

  return { socket, isConnected };
}

export function useRealTimeOrders() {
  const { socket, isConnected } = useSocket();
  const [realtimeOrders, setRealtimeOrders] = useState([]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'orderCreated') {
          setRealtimeOrders(prev => [data, ...prev].slice(0, 10)); // Keep last 10
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      if (socket) {
        socket.removeEventListener('message', handleMessage);
      }
    };
  }, [socket, isConnected]);

  return realtimeOrders;
}