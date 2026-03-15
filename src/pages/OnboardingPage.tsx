import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  const [connected, setConnected] = useState(false);
  const { updateProfessional } = useApp();
  const navigate = useNavigate();

  const simulateConnect = () => {
    setTimeout(() => {
      setConnected(true);
      updateProfessional({ whatsapp_connected: true, whatsapp_number: '+55 11 99900-1234' });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-6 py-10">
      <p className="label-text text-muted-foreground mb-6">Passo 1 de 1</p>
      <h1 className="heading-lg mb-2 text-center">Conecte seu WhatsApp</h1>
      <p className="body-sm text-muted-foreground text-center mb-8">O Voltai vai enviar mensagens pelo seu número</p>

      <div
        onClick={!connected ? simulateConnect : undefined}
        className="w-[200px] h-[200px] rounded-card border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-8 cursor-pointer hover:border-primary transition-colors"
      >
        {connected ? (
          <span className="text-status-green heading-md">✓</span>
        ) : (
          <span className="text-muted-foreground body-sm text-center px-4">Toque para simular<br />conexão do QR Code</span>
        )}
      </div>

      <div className="w-full max-w-sm space-y-3 mb-8">
        <p className="body-sm text-muted-foreground">1. Abra o WhatsApp no seu celular</p>
        <p className="body-sm text-muted-foreground">2. Toque em ⋮ Menu {'>'} Dispositivos conectados</p>
        <p className="body-sm text-muted-foreground">3. Toque em "Conectar dispositivo"</p>
        <p className="body-sm text-muted-foreground">4. Escaneie o QR Code acima</p>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {connected ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-status-green" />
            <span className="body-sm text-status-green font-medium">WhatsApp conectado!</span>
          </>
        ) : (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-status-orange animate-pulse-dot" />
            <span className="body-sm text-status-orange">Aguardando conexão...</span>
          </>
        )}
      </div>

      {connected && (
        <div className="w-full max-w-sm space-y-4">
          <p className="body-sm text-center text-muted-foreground">+55 11 99900-1234</p>
          <Button onClick={() => navigate('/dashboard')} size="lg" className="w-full h-12 text-[16px] font-semibold rounded-md">
            IR PARA O APP
          </Button>
        </div>
      )}
    </div>
  );
}
