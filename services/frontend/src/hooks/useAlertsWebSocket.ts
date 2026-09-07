'use client';

import { useEffect, useState, useRef } from 'react';

export interface AlertNotification {
  type: string;
  user_id: string;
  user_name: string;
  w_total: number;
  timestamp: string;
  breakdown?: {
    t_assigned: number;
    h_tracked: number;
    effective_capacity: number;
    f_fragmentation: number;
  };
}

export function useAlertsWebSocket() {
  const [activeAlert, setActiveAlert] = useState<AlertNotification | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws/alerts';

    function connect() {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          console.log('[WEBSOCKET] Connected to EquiFlow alert relay');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'OVERLOAD_ALERT') {
              setActiveAlert(data);
            }
          } catch (e) {
            console.error('[WEBSOCKET PARSE ERROR]', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Try reconnect after 5 seconds
          setTimeout(connect, 5000);
        };

        ws.onerror = () => {
          setIsConnected(false);
        };
      } catch (err) {
        console.warn('[WEBSOCKET] Could not connect to alert relay:', err);
      }
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const dismissAlert = () => setActiveAlert(null);

  return { activeAlert, isConnected, dismissAlert };
}
