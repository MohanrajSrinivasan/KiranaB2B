import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      setIsConnected(true);
      
      // Join appropriate rooms based on user role
      if (user.role === 'admin') {
        newSocket.send(JSON.stringify({ type: 'join-admin-room' }));
      }
      newSocket.send(JSON.stringify({ type: 'join-user-room', userId: user.id }));
    };

    newSocket.onclose = () => {
      setIsConnected(false);
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  return { socket, isConnected };
}

export function useRealTimeOrders() {
  const { socket } = useSocket();
  const [realtimeOrders, setRealtimeOrders] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleOrderCreated = (data) => {
      setRealtimeOrders(prev => [data, ...prev].slice(0, 10)); // Keep last 10
    };

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'orderCreated') {
          handleOrderCreated(data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket]);

  return realtimeOrders;
}