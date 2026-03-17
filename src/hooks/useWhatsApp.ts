import { useState, useEffect, useCallback } from 'react';
import {
  createInstance,
  getQRCode,
  getConnectionStatus,
  disconnectInstance,
} from '@/lib/evolution-api';

type ConnectionStatus = 'idle' | 'loading' | 'connecting' | 'connected' | 'error';

export function useWhatsApp(professionalId: string | undefined) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startConnection = useCallback(async () => {
    if (!professionalId) return;
    setStatus('loading');
    setError(null);

    try {
      // createInstance may fail if instance already exists — ignore that error
      try { await createInstance(professionalId); } catch { /* instance may already exist */ }
      setStatus('connecting');

      // Poll for QR Code
      let attempts = 0;
      const pollQR = async () => {
        if (attempts >= 10) {
          setError('Tempo esgotado. Tente novamente.');
          setStatus('error');
          return;
        }
        attempts++;
        const qr = await getQRCode(professionalId);
        if (qr?.base64) {
          setQrCode(qr.base64);
        } else {
          setTimeout(pollQR, 2000);
        }
      };
      await pollQR();
    } catch (err) {
      setError('Erro ao conectar. Verifique a configuração.');
      setStatus('error');
    }
  }, [professionalId]);

  const checkStatus = useCallback(async () => {
    if (!professionalId) return;
    const state = await getConnectionStatus(professionalId);
    if (state === 'open') {
      setStatus('connected');
      setQrCode(null);
    }
  }, [professionalId]);

  // Poll connection status when QR is displayed
  useEffect(() => {
    if (status !== 'connecting' || !qrCode) return;
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [status, qrCode, checkStatus]);

  const disconnect = useCallback(async () => {
    if (!professionalId) return;
    await disconnectInstance(professionalId);
    setStatus('idle');
    setQrCode(null);
  }, [professionalId]);

  return { status, qrCode, error, startConnection, disconnect, checkStatus };
}
