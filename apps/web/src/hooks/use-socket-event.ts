'use client';

import { useEffect } from 'react';
import { useSocket } from '../components/providers/socket-provider';

export function useSocketEvent<T = any>(event: string, callback: (data: T) => void) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handler = (data: T) => {
      callback(data);
    };

    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [socket, isConnected, event, callback]);
}
