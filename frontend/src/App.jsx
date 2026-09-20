import { useEffect, useMemo, useRef, useState } from 'react'
import { appConfig, completeLogin, getStoredToken, logout, lookupEmployee, startLogin } from './api'

const quickIds = ['1001', '1002', '1003', '1005']

function Icon({ name, size = 20 }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    shield: <><path d="M12 3 20 7v5c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V7l8-4Z" /><path d="m9 12 2 2 4-4" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    money: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M7 9h.01M17 15h.01" /></>,
    id: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="10" r="2" /><path d="M13 9h5M13 13h5M6 16h12" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-6" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Field({ icon, label, value, accent }) {
  return <div className="field-row">
    <div className={`field-icon ${accent || ''}`}><Icon name={icon} size={18} /></div>
    <div className="field-copy"><span>{label}</span><strong>{value || '—'}</strong></div>
  </div>
}

export default function App() {
  const loginCallbackHandled = useRef(false)
  const [token, setToken] = useState(getStoredToken())
  const [employeeId, setEmployeeId] = useState('')
  const [employee, setEmployee] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    if (loginCallbackHandled.current) return
  
    loginCallbackHandled.current = true
  
    completeLogin()
      .then((newToken) => {
        if (newToken) {
          setToken(newToken)
        }
      })
      .catch((err) => {
        setLoginError(err.message)
      })
  }, [])

  const isAuthenticated = Boolean(token)
  const initials = useMemo(() => employee?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'HR', [employee])

  async function handleSearch(event) {
    event?.preventDefault()
    const normalized = employeeId.trim()
    if (!normalized) {
      setError('Enter an Employee ID to begin your search.')
      setEmployee(null)
      return
    }
    setStatus('loading')
    setError('')
    try {
      const result = await lookupEmployee(normalized, token)
      setEmployee(result)
      setStatus('success')
    } catch (err) {
      setEmployee(null)
      setError(err.message || 'We could not find that employee.')
      setStatus('error')
    }
  }

  async function handleLogin() {
    setLoginError('')
  
    try {
      await startLogin()
    } catch (error) {
      setLoginError(
        error.message || 'Unable to start Cognito login.'
      )
    }
  }

  function handleLogout() {
    setEmployee(null)
    setEmployeeId('')
    logout()
  }

  return <div className="app-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="topbar">
      <a className="brand" href="/" aria-label="Atlas HR home">
        <span className="brand-mark"><span /></span>
        <span><b>atlas</b><small>PEOPLE OPERATIONS</small></span>
      </a>
      <div className="topbar-actions">
        <div className="security-note"><span className="online-dot" /> Secure workspace</div>
        {isAuthenticated ? <button className="user-button" onClick={handleLogout}><span className="avatar">SS</span><span className="user-label">Sanjana Shankar</span><Icon name="logout" size={16} /></button> : <button className="login-button" onClick={handleLogin}><Icon name="lock" size={15} /> Sign in</button>}
      </div>
    </header>

    <main className="content">
      <section className="hero">
        <div className="eyebrow"><span className="eyebrow-line" /> PEOPLE DIRECTORY <span className="eyebrow-line" /></div>
        <h1>Find the people<br /><em>behind the work.</em></h1>
        <p className="hero-copy">A secure, focused way to access the employee information you need—right when you need it.</p>
        <div className="hero-badges"><span><Icon name="shield" size={15} /> Protected by Cognito</span><span><Icon name="check" size={15} /> Read-only access</span></div>
      </section>

      <section className="workspace-card">
        <div className="card-header">
          <div><p className="section-kicker">EMPLOYEE LOOKUP</p><h2>Who are you looking for?</h2></div>
          <div className={`auth-status ${isAuthenticated ? 'authenticated' : ''}`}><span className="status-dot" />{isAuthenticated ? 'Authenticated' : 'Sign in required'}</div>
        </div>
        {!isAuthenticated && <div className="auth-banner"><div className="banner-icon"><Icon name="lock" size={19} /></div><div><strong>Your directory is protected</strong><p>Sign in with your organization account to search employee records.</p></div><button onClick={handleLogin}>Sign in <Icon name="arrow" size={16} /></button></div>}
        {loginError && <div className="inline-error">{loginError}</div>}
        <form className="search-form" onSubmit={handleSearch}>
          <label htmlFor="employee-id">Employee ID</label>
          <div className="search-row"><div className="input-wrap"><Icon name="id" size={19} /><input id="employee-id" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} placeholder="e.g. 1001" inputMode="numeric" /><span className="input-hint">ID</span></div><button className="search-button" type="submit" disabled={status === 'loading' || !isAuthenticated}>{status === 'loading' ? <><span className="spinner" /> Searching</> : <><Icon name="search" size={18} /> Search directory</>}</button></div>
          <div className="quick-search"><span>Try a sample record</span>{quickIds.map((id) => <button type="button" key={id} onClick={() => { setEmployeeId(id); setError('') }}>{id}</button>)}</div>
        </form>
        {status === 'error' && <div className="error-state"><div className="error-symbol">!</div><div><strong>{error}</strong><p>Check the Employee ID and try again.</p></div></div>}
        {!employee && status !== 'error' && <div className="empty-state"><div className="empty-illustration"><div className="empty-circle"><Icon name="search" size={28} /></div><span className="spark spark-a">✦</span><span className="spark spark-b">•</span></div><h3>Search to see a profile</h3><p>Enter an Employee ID above and the employee’s details will appear here.</p></div>}
        {employee && status === 'success' && <div className="result-card"><div className="result-heading"><div className="profile-avatar">{initials}</div><div><span className="result-label">EMPLOYEE RECORD</span><h3>{employee.name}</h3><p>Employee ID <strong>#{employee.employeeId}</strong></p></div><div className="verified-pill"><Icon name="check" size={14} /> Verified</div></div><div className="field-grid"><Field icon="id" label="Employee ID" value={employee.employeeId} accent="blue" /><Field icon="user" label="Full name" value={employee.name} accent="purple" /><Field icon="money" label="Annual salary" value={typeof employee.salary === 'number' ? `$${employee.salary.toLocaleString()}` : employee.salary} accent="green" /><Field icon="calendar" label="Date of join" value={employee.dateOfJoin} accent="orange" /></div><div className="description-box"><span className="description-label">DESCRIPTION</span><p>{employee.description}</p></div><div className="result-footer"><span><span className="status-dot" /> Record retrieved securely</span><span>Read-only view</span></div></div>}
      </section>

      <section className="trust-row"><div><Icon name="shield" size={18} /><span><strong>Private by design</strong><small>Your search is protected by AWS Cognito authentication.</small></span></div><div><Icon name="lock" size={18} /><span><strong>Least-privilege access</strong><small>Records are retrieved through a secure API.</small></span></div><div><Icon name="check" size={18} /><span><strong>Always up to date</strong><small>Information comes directly from the HR directory.</small></span></div></section>
    </main>
    <footer><span>© 2026 Atlas People Operations</span><span className="demo-indicator">{appConfig.demoMode ? 'Demo mode · API ready' : 'Production API connected'}</span></footer>
  </div>
}
