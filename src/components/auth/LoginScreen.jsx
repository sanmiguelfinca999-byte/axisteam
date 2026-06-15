import { useState } from 'react'
import { Shield, Lock, User, AlertTriangle, Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'
import { MODE } from '../../lib/dataSource'
import { supabase } from '../../lib/supabase'

export default function LoginScreen() {
  const { login } = useNEXUS()
  const [mode, setMode]         = useState('login') // 'login' | 'reset'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [info, setInfo]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPwd, setShowPwd]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setInfo('')
    setLoading(true)
    try {
      const id = MODE === 'supabase' ? username.trim() : username.trim().toLowerCase()
      if (mode === 'reset') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(id, {
          redirectTo: window.location.origin,
        })
        if (err) setError(err.message)
        else setInfo('Si la cuenta existe, recibirás un correo con instrucciones para restablecer tu clave.')
      } else {
        const result = await login(id, password)
        if (!result.ok) setError(result.error)
      }
    } catch (err) {
      setError(err?.message || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  const isCloud = MODE === 'supabase'

  return (
    <div className="min-h-screen bg-nexus-bg flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />

      <div className="absolute top-4 left-4 text-nexus-muted text-xs font-mono opacity-40">
        AXIS//SYS v4.1 | {isCloud ? 'CLOUD SYNC ACTIVE' : 'OFFLINE MODE'}
      </div>
      <div className="absolute top-4 right-4 text-nexus-muted text-xs font-mono opacity-40">
        {new Date().toLocaleString('es-MX', { hour12: false })}
      </div>
      <div className="absolute bottom-4 left-4 text-nexus-muted text-xs font-mono opacity-30">
        ENCRYPTION: AES-256 | AUTH: {isCloud ? 'SUPABASE' : 'TWO-FACTOR'}
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="hud-card p-8" style={{ boxShadow: '0 0 40px rgba(59,130,246,0.15), inset 0 1px 0 rgba(59,130,246,0.1)' }}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #1e2a5e, #0f1535)',
                  border: '2px solid #3b82f6',
                  boxShadow: '0 0 20px rgba(59,130,246,0.4)',
                }}>
                  <Shield className="w-10 h-10 text-blue-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-nexus-green flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-nexus-text tracking-[0.4em]">AXIS</h1>
            <p className="text-nexus-muted text-xs mt-2 tracking-[0.3em] uppercase">The Execution OS</p>
            <p className="text-blue-400/70 text-[10px] mt-1 italic">Where ambitious teams turn strategy into shipped outcomes</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-blue-500/40" />
              <span className="text-blue-400/60 text-xs font-mono">AUTENTICACIÓN REQUERIDA</span>
              <div className="h-px w-12 bg-blue-500/40" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-user" className="block text-nexus-muted text-xs font-mono uppercase mb-1 tracking-widest">
                {isCloud ? 'Email' : 'Identificador'}
              </label>
              <div className="relative">
                {mode === 'reset' ? <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nexus-muted" /> : <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nexus-muted" />}
                <input id="login-user" type={isCloud ? 'email' : 'text'} value={username} onChange={e => setUsername(e.target.value)}
                  placeholder={isCloud ? 'director@axis.demo' : 'usuario'} autoComplete="username" required
                  className="w-full bg-nexus-bg border border-nexus-border rounded-md py-3 pl-10 pr-4 text-nexus-text placeholder-nexus-muted/50 font-mono focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>

            {mode === 'login' && (
              <div>
                <label htmlFor="login-pwd" className="block text-nexus-muted text-xs font-mono uppercase mb-1 tracking-widest">Clave de Acceso</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nexus-muted" />
                  <input id="login-pwd" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required
                    className="w-full bg-nexus-bg border border-nexus-border rounded-md py-3 pl-10 pr-10 text-nexus-text placeholder-nexus-muted/50 font-mono focus:outline-none focus:border-blue-500 transition-colors" />
                  <button type="button" onClick={() => setShowPwd(s => !s)} aria-label={showPwd ? 'Ocultar clave' : 'Mostrar clave'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-nexus-muted hover:text-nexus-text">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-md px-3 py-2" role="alert">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="font-mono">{error}</span>
              </div>
            )}
            {info && (
              <div className="flex items-center gap-2 text-nexus-green text-sm bg-emerald-900/20 border border-emerald-800/50 rounded-md px-3 py-2" role="status">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="font-mono">{info}</span>
              </div>
            )}

            <button type="submit" disabled={loading || !username || (mode === 'login' && !password)}
              className="w-full py-3 rounded-md font-semibold text-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: loading ? '#1e3a5f' : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                color: 'white',
                boxShadow: loading ? 'none' : '0 0 20px rgba(59,130,246,0.3)',
              }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'reset' ? 'Enviando...' : 'Autenticando...'}
                </span>
              ) : (mode === 'reset' ? 'Enviar enlace de restablecimiento' : 'Acceder al Sistema')}
            </button>
          </form>

          {isCloud && (
            <div className="mt-4 text-center">
              <button type="button" onClick={() => { setMode(mode === 'login' ? 'reset' : 'login'); setError(''); setInfo('') }}
                className="text-blue-400/80 hover:text-blue-300 text-xs font-mono underline transition-colors">
                {mode === 'login' ? '¿Olvidaste tu clave?' : '← Volver al login'}
              </button>
            </div>
          )}

          {!isCloud && (
            <div className="mt-6 p-3 bg-nexus-bg/50 rounded-md border border-nexus-border/50">
              <p className="text-nexus-muted text-xs font-mono text-center opacity-60">
                ¿Olvidaste tu clave? Contacta al Centro de Mando.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
