'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    const body = mode === 'login'
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao autenticar'); return }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(193,127,36,0.12) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', left: '-10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(92,61,17,0.08) 0%, transparent 70%)',
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-brown))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(193,127,36,0.3)',
          }}>
            <span style={{ fontSize: '28px' }}>💰</span>
          </div>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 700,
            color: 'var(--text-primary)', margin: '0 0 0.25rem',
          }}>
            FinançasMes
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Controle seus gastos com simplicidade
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
            background: 'var(--bg-secondary)', borderRadius: '10px', padding: '4px',
          }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{
                flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                transition: 'all 0.2s ease',
                background: mode === m ? 'var(--bg-card)' : 'transparent',
                color: mode === m ? 'var(--accent-gold)' : 'var(--text-muted)',
                boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
              }}>
                {m === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'register' && (
              <div>
                <label>Nome completo</label>
                <input
                  type="text" placeholder="Seu nome"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            )}
            <div>
              <label>E-mail</label>
              <input
                type="email" placeholder="seu@email.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label>Senha</label>
              <input
                type="password" placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required minLength={mode === 'register' ? 6 : 1}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(179,58,58,0.1)', border: '1px solid rgba(179,58,58,0.3)',
                color: 'var(--danger)', borderRadius: '8px', padding: '0.75rem',
                fontSize: '0.875rem',
              }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              padding: '0.75rem',
              background: loading ? 'var(--bg-secondary)' : 'linear-gradient(135deg, var(--accent-gold), var(--accent-amber))',
              color: loading ? 'var(--text-muted)' : 'white',
              border: 'none', borderRadius: '10px', fontWeight: 600,
              fontSize: '0.9375rem', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease', marginTop: '0.25rem',
            }}>
              {loading ? 'Aguarde...' : mode === 'login' ? '→ Entrar' : '→ Criar conta'}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
