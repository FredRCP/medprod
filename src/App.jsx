import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useToast } from './hooks/useToast'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import RegistroPage from './pages/RegistroPage'
import RelatoriosPage from './pages/RelatoriosPage'
import FinanceiroPage from './pages/FinanceiroPage'
import PerfilPage from './pages/PerfilPage'
import { LayoutDashboard, PlusCircle, BarChart3, Stethoscope, Wallet, UserCircle, WifiOff } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/',           icon: LayoutDashboard, label: 'Início' },
  { path: '/registrar',  icon: PlusCircle,      label: 'Registrar' },
  { path: '/financeiro', icon: Wallet,           label: 'Financeiro' },
  { path: '/relatorios', icon: BarChart3,        label: 'Relatórios' },
  { path: '/perfil',     icon: UserCircle,       label: 'Perfil' },
]

function NavBar({ currentPath }) {
  const navigate = useNavigate()
  return (
    <nav className="app-nav">
      <div className="nav-logo">
        <Stethoscope size={20} />
        MedProd
      </div>
      {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
        <button
          key={path}
          className={`nav-item ${currentPath === path ? 'active' : ''}`}
          onClick={() => navigate(path)}
        >
          <Icon size={22} />
          {label}
        </button>
      ))}
    </nav>
  )
}

function ProtectedLayout({ user, signOut }) {
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="app-shell">
      <div className="app-inner">
        <NavBar currentPath={location.pathname} />
        <div className="app-page">
          <Routes>
            <Route path="/"           element={<DashboardPage user={user} signOut={signOut} />} />
            <Route path="/registrar"  element={<RegistroPage user={user} />} />
            <Route path="/financeiro" element={<FinanceiroPage user={user} />} />
            <Route path="/relatorios" element={<RelatoriosPage user={user} />} />
            <Route path="/perfil"     element={<PerfilPage user={user} signOut={signOut} />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth()
  const { toast, showToast } = useToast()
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const onOnline  = () => setOffline(false)
    const onOffline = () => setOffline(true)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', background:'var(--bg)' }}>
        <div className="spinner" style={{ width:36, height:36 }} />
      </div>
    )
  }

  return (
    <>
      {/* Barra de aviso offline */}
      {offline && (
        <div style={{
          position:'fixed', top:0, left:0, right:0, zIndex:9999,
          background:'#b03020', color:'white',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          padding:'9px 16px', fontSize:13, fontWeight:700,
          boxShadow:'0 2px 8px rgba(0,0,0,0.2)'
        }}>
          <WifiOff size={15} />
          Sem conexão — os dados não serão salvos
        </div>
      )}

      {toast && <div className="toast" style={{ top: offline ? 52 : 60 }}>{toast}</div>}

      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/" replace /> :
          <LoginPage signIn={signIn} signUp={signUp} showToast={showToast} />
        } />
        <Route path="/*" element={<ProtectedLayout user={user} signOut={signOut} />} />
      </Routes>
    </>
  )
}