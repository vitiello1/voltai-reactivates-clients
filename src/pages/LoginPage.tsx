import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

type View = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [salonName, setSalonName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useApp();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Preencha todos os campos'); return; }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      toast.error('E-mail ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !salonName || !email || !password) { toast.error('Preencha todos os campos'); return; }
    if (password.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return; }
    setLoading(true);
    try {
      await signup(email, password, name, salonName);
      navigate('/onboarding');
    } catch {
      toast.error('Este e-mail já está em uso');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Digite seu e-mail'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    setLoading(false);
    if (error) toast.error('Erro ao enviar e-mail. Verifique o endereço.');
    else {
      toast.success('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
      setView('login');
    }
  };

  if (view === 'forgot') {
    return (
      <div className="min-h-screen bg-background flex flex-col px-6 py-8">
        <button onClick={() => setView('login')} className="self-start text-muted-foreground mb-6">
          ← Voltar
        </button>
        <h1 className="heading-lg mb-2">Esqueceu a senha?</h1>
        <p className="body-sm text-muted-foreground mb-8">Enviaremos um link para redefinir sua senha.</p>
        <form onSubmit={handleForgot} className="flex flex-col gap-4">
          <div>
            <label className="label-text text-muted-foreground mb-1.5 block">E-mail</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="h-12 rounded-md bg-surface" />
          </div>
          <Button type="submit" disabled={loading} size="lg" className="w-full h-12 mt-2 text-[16px] font-semibold rounded-md">
            {loading ? 'Enviando...' : 'ENVIAR LINK'}
          </Button>
        </form>
      </div>
    );
  }

  if (view === 'signup') {
    return (
      <div className="min-h-screen bg-background flex flex-col px-6 py-8">
        <button onClick={() => setView('login')} className="self-start text-muted-foreground mb-6">
          ← Voltar
        </button>
        <h1 className="heading-lg mb-8">Criar sua conta</h1>
        <form onSubmit={handleSignup} className="flex flex-col gap-4 flex-1">
          <div>
            <label className="label-text text-muted-foreground mb-1.5 block">Nome completo</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" className="h-12 rounded-md bg-surface" />
          </div>
          <div>
            <label className="label-text text-muted-foreground mb-1.5 block">Nome do salão</label>
            <Input value={salonName} onChange={e => setSalonName(e.target.value)} placeholder="Nome do seu salão" className="h-12 rounded-md bg-surface" />
          </div>
          <div>
            <label className="label-text text-muted-foreground mb-1.5 block">E-mail</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="h-12 rounded-md bg-surface" />
          </div>
          <div>
            <label className="label-text text-muted-foreground mb-1.5 block">Senha</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="h-12 rounded-md bg-surface" />
          </div>
          <Button type="submit" disabled={loading} size="lg" className="w-full h-12 mt-4 text-[16px] font-semibold rounded-md">
            {loading ? 'Criando conta...' : 'CRIAR CONTA'}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        <h1 className="heading-xl text-primary mb-2">Voltai</h1>
        <p className="body-sm text-muted-foreground mb-10">Faça seus clientes voltarem</p>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <div>
            <label className="label-text text-muted-foreground mb-1.5 block">E-mail</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="h-12 rounded-md bg-surface" />
          </div>
          <div>
            <label className="label-text text-muted-foreground mb-1.5 block">Senha</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" className="h-12 rounded-md bg-surface" />
          </div>
          <Button type="submit" disabled={loading} size="lg" className="w-full h-12 mt-2 text-[16px] font-semibold rounded-md">
            {loading ? 'Entrando...' : 'ENTRAR'}
          </Button>
        </form>

        <button onClick={() => setView('forgot')} className="mt-4 body-sm text-muted-foreground">
          Esqueceu a senha?
        </button>

        <button onClick={() => setView('signup')} className="mt-3 body-sm text-muted-foreground">
          Não tem conta? <span className="text-primary font-medium">Criar conta</span>
        </button>
      </div>
    </div>
  );
}
