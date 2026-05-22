import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useToast } from './hooks/useToast'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import RegistroPage from './pages/RegistroPage'
import RelatoriosPage from './pages/RelatoriosPage'
import FinanceiroPage from './pages/FinanceiroPage'
import PerfilPage from './pages/PerfilPage'
import { LayoutDashboard, PlusCircle, BarChart3, Stethoscope, Wallet, UserCircle } from 'lucide-react'

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

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', background:'var(--bg)' }}>
        <div className="spinner" style={{ width:36, height:36 }} />
      </div>
    )
  }

  return (
    <>
      {toast && <div className="toast">{toast}</div>}
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