import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  const { user, updateProfessional } = useApp();
  const navigate = useNavigate();
  const { status, qrCode, error, startConnection } = useWhatsApp(user?.id);

  useEffect(() => {
    if (user?.id && status === 'idle') {
      startConnection();
    }
  }, [user?.id]);

  useEffect(() => {
    if (status === 'connected') {
      updateProfessional({ whatsapp_connected: true });
      setTimeout(() => navigate('/dashboard'), 1500);
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-6 py-10">
      <p className="label-text text-muted-foreground mb-6">Passo 1 de 1</p>
      <h1 className="heading-lg mb-2 text-center">Conecte seu WhatsApp</h1>
      <p className="body-sm text-muted-foreground text-center mb-8">
        O Voltai vai enviar mensagens pelo seu número
      </p>

      <div className="w-[220px] h-[220px] rounded-card border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-8 overflow-hidden">
        {status === 'connected' && (
          <span className="text-status-green heading-xl">✓</span>
        )}
        {qrCode && status === 'connecting' && (
          <img src={`data:image/png;base64,${qrCode}`} alt="QR Code WhatsApp" className="w-full h-full object-contain p-2" />
        )}
        {(status === 'loading' || (status === 'connecting' && !qrCode)) && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="label-text text-muted-foreground">Gerando QR Code...</span>
          </div>
        )}
        {status === 'error' && (
          <span className="body-sm text-status-red text-center px-4">{error}</span>
        )}
      </div>

      <div className="w-full max-w-sm space-y-3 mb-8">
        <p className="body-sm text-muted-foreground">1. Abra o WhatsApp no seu celular</p>
        <p className="body-sm text-muted-foreground">2. Toque em Menu &gt; Dispositivos conectados</p>
        <p className="body-sm text-muted-foreground">3. Toque em "Conectar dispositivo"</p>
        <p className="body-sm text-muted-foreground">4. Escaneie o QR Code acima</p>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {status === 'connected' ? (
          <><span className="w-2.5 h-2.5 rounded-full bg-status-green" /><span className="body-sm text-status-green font-medium">WhatsApp conectado!</span></>
        ) : status === 'error' ? (
          <><span className="w-2.5 h-2.5 rounded-full bg-status-red" /><span className="body-sm text-status-red">{error}</span></>
        ) : (
          <><span className="w-2.5 h-2.5 rounded-full bg-status-orange animate-pulse" /><span className="body-sm text-status-orange">Aguardando conexão...</span></>
        )}
      </div>

      {status === 'connected' && (
        <Button onClick={() => navigate('/dashboard')} size="lg" className="w-full max-w-sm h-12 text-[16px] font-semibold rounded-md">
          IR PARA O APP
        </Button>
      )}
      {status === 'error' && (
        <Button onClick={startConnection} variant="outline" size="lg" className="w-full max-w-sm h-12 font-semibold rounded-md">
          TENTAR NOVAMENTE
        </Button>
      )}
    </div>
  );
}
