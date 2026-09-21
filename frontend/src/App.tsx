import { useState } from 'react'
import type { FormEvent } from 'react'
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { FacultyDashboard, HODDashboard, PrincipalDashboard, StudentDashboard } from './pages/Dashboards'
import './App.css'

const roles = ['Student', 'Faculty', 'HOD', 'Principal'] as const
type Role = (typeof roles)[number]

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 48 48" role="presentation">
        <path d="M24 4 8 10v11c0 10.4 6.8 19.6 16 23 9.2-3.4 16-12.6 16-23V10L24 4Z" />
        <path d="m15 20 9-5 9 5-9 5-9-5Zm4 3v5c3 2 7 2 10 0v-5" />
        <path d="M33 20v7" />
      </svg>
    </div>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('Student')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  setMessage('Signing in...')

  try {
    const response = await fetch('/api/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: email,
        password,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      setMessage(data.error || 'Invalid username or password.')
      return
    }

    if (data.role !== role) {
      setMessage(`This account is registered as ${data.role}.`)
      return
    }

    setMessage(`Login successful - ${data.role}`)
    window.setTimeout(() => {
      navigate(`/dashboard/${data.role.toLowerCase()}`)
    }, 450)
  } catch {
    setMessage('Unable to connect to the server.')
  }
}

  return (
    <main className="login-page">
      <section className="brand-panel" aria-labelledby="brand-title">
        <div className="brand-content">
          <div className="brand-lockup">
            <BrandMark />
            <span>EduGuard AI</span>
          </div>

          <div className="brand-copy">
            <p className="eyebrow">Student success intelligence</p>
            <h1 id="brand-title">Detect early.<br /><em>Support deeply.</em></h1>
            <p className="tagline">Detect Early. Understand Why. Take Action.</p>
            <p className="brand-description">
              A clearer view of every learner&apos;s journey, helping education teams
              turn early signals into meaningful action.
            </p>
          </div>

          <div className="insight-card" aria-label="EduGuard AI insight">
            <span className="insight-icon" aria-hidden="true">✦</span>
            <div>
              <strong>Every student has a story.</strong>
              <span>Let&apos;s find the right next step.</span>
            </div>
          </div>
        </div>
        <p className="copyright">© 2025 EduGuard AI <span>•</span> Built for better outcomes</p>
      </section>

      <section className="form-panel" aria-labelledby="login-title">
        <div className="login-card">
          <div className="card-heading">
            <p className="eyebrow">Welcome back</p>
            <h2 id="login-title">Sign in to your workspace</h2>
            <p>Continue your work toward stronger student outcomes.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="email">Email or username</label>
              <div className="input-wrap">
                <svg className="field-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 5h16v14H4zM4 7l8 6 8-6" />
                </svg>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@institution.edu"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <a href="#forgot-password" className="forgot-link">Forgot password?</a>
              </div>
              <div className="input-wrap">
                <svg className="field-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="visibility-button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <fieldset className="role-group">
              <legend>Your role</legend>
              <div className="role-options">
                {roles.map((option) => (
                  <label className={`role-option ${role === option ? 'selected' : ''}`} key={option}>
                    <input
                      type="radio"
                      name="role"
                      value={option}
                      checked={role === option}
                      onChange={() => setRole(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button type="submit" className="login-button">
              Sign in <span aria-hidden="true">→</span>
            </button>

            <p className={`form-message ${message ? 'visible' : ''}`} role="status" aria-live="polite">
              {message}
            </p>
          </form>

          <p className="secure-note"><span aria-hidden="true">⌁</span> Secure access for your institution</p>
        </div>
      </section>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard/student" element={<StudentDashboard />} />
        <Route path="/dashboard/faculty" element={<FacultyDashboard />} />
        <Route path="/dashboard/hod" element={<HODDashboard />} />
        <Route path="/dashboard/principal" element={<PrincipalDashboard />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
