import type { ReactNode } from 'react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import './Dashboard.css'

type DashboardRole = 'Student' | 'Faculty' | 'HOD' | 'Principal'

type DashboardLayoutProps = {
  role: DashboardRole
  subtitle: string
  children: ReactNode
  studentName?: string
  studentRollNumber?: string
  activeStudentSection?: string
  onStudentSectionChange?: (section: string) => void
  activeFacultySection?: string
  onFacultySectionChange?: (section: string) => void
  activeHodSection?: string
  onHodSectionChange?: (section: string) => void
  activePrincipalSection?: string
  onPrincipalSectionChange?: (section: string) => void
}

const rolePaths: Record<DashboardRole, string> = {
  Student: '/dashboard/student',
  Faculty: '/dashboard/faculty',
  HOD: '/dashboard/hod',
  Principal: '/dashboard/principal',
}

const defaultNavigation = [
  { label: 'Overview', icon: '◈' },
  { label: 'Insights', icon: '⌁' },
  { label: 'Interventions', icon: '↗' },
]

const studentNavigation = [
  { label: 'Dashboard', icon: '◈' },
  { label: 'My Performance', icon: '↗' },
  { label: 'Attendance', icon: '◒' },
  { label: 'Marks', icon: '▥' },
  { label: 'Assignments', icon: '▣' },
  { label: 'AI Recommendations', icon: '✦' },
  { label: 'Notifications', icon: '◌' },
]

const facultyNavigation = [
  { label: 'Dashboard', icon: '◈' },
  { label: 'My Students', icon: '◎' },
  { label: 'At-Risk Students', icon: '△' },
  { label: 'Interventions', icon: '↗' },
  { label: 'Notifications', icon: '◌' },
]

const hodNavigation = [
  { label: 'Dashboard', icon: '◈' },
  { label: 'Students', icon: '◎' },
  { label: 'Faculty', icon: '♧' },
  { label: 'Risk Analytics', icon: '△' },
  { label: 'Interventions', icon: '↗' },
  { label: 'Reports', icon: '▤' },
  { label: 'Notifications', icon: '◌' },
]

const principalNavigation = [
  { label: 'Dashboard', icon: '◈' },
  { label: 'Departments', icon: '♧' },
  { label: 'Academic Analytics', icon: '▥' },
  { label: 'Risk Analytics', icon: '△' },
  { label: 'Interventions', icon: '↗' },
  { label: 'Reports', icon: '▤' },
  { label: 'Notifications', icon: '◌' },
  { label: 'Settings', icon: '⚙' },
]

function DashboardMark() {
  return (
    <div className="dashboard-mark" aria-hidden="true">
      <svg viewBox="0 0 48 48" role="presentation">
        <path d="M24 4 8 10v11c0 10.4 6.8 19.6 16 23 9.2-3.4 16-12.6 16-23V10L24 4Z" />
        <path d="m15 20 9-5 9 5-9 5-9-5Zm4 3v5c3 2 7 2 10 0v-5" />
        <path d="M33 20v7" />
      </svg>
    </div>
  )
}

export function DashboardLayout({ role, subtitle, children, studentName, studentRollNumber, activeStudentSection, onStudentSectionChange, activeFacultySection, onFacultySectionChange, activeHodSection, onHodSectionChange, activePrincipalSection, onPrincipalSectionChange }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const navigation = role === 'Student' ? studentNavigation : role === 'Faculty' ? facultyNavigation : role === 'HOD' ? hodNavigation : role === 'Principal' ? principalNavigation : defaultNavigation
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  function handleLogout() {
    navigate('/')
  }

  return (
    <div className={`dashboard-shell dashboard-${role.toLowerCase()}`}>
      <aside className="dashboard-sidebar">
        <div>
          <div className="dashboard-brand">
            <DashboardMark />
            <span>EduGuard <b>AI</b></span>
          </div>
          <p className="sidebar-label">Workspace</p>
          <nav aria-label="Dashboard navigation">
            {navigation.map((item, index) => (
              <NavLink
                className={() => `sidebar-link ${(role === 'Student' && activeStudentSection === item.label) || (role === 'Faculty' && activeFacultySection === item.label) || (role === 'HOD' && activeHodSection === item.label) || (role === 'Principal' && activePrincipalSection === item.label) ? 'active' : ''}`}
                end={index === 0}
                key={item.label}
                to={`${rolePaths[role]}${index === 0 ? '' : `/${item.label.toLowerCase().replaceAll(' ', '-')}`}`}
                onClick={(event) => {
                  event.preventDefault()
                  if (role === 'Student') onStudentSectionChange?.(item.label)
                  if (role === 'Faculty') onFacultySectionChange?.(item.label)
                  if (role === 'HOD') onHodSectionChange?.(item.label)
                  if (role === 'Principal') onPrincipalSectionChange?.(item.label)
                }}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="sidebar-footer">
          <div className="help-badge" aria-hidden="true">?</div>
          <div>
            <strong>Need help?</strong>
            <span>Contact your admin</span>
          </div>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="mobile-brand"><DashboardMark /><span>EduGuard <b>AI</b></span></div>
          {role === 'Student' && <div className="header-page-title">Student Dashboard</div>}
          {role === 'Faculty' && <div className="header-page-title">Faculty Dashboard</div>}
          {role === 'HOD' && <div className="header-page-title">HOD Dashboard</div>}
          {role === 'Principal' && <div className="header-page-title">Principal Dashboard</div>}
          <div className="header-spacer" />
          {role === 'Student' && <span className="student-name">{studentName ?? 'Loading student...'}{studentRollNumber && <small> · {studentRollNumber}</small>}</span>}
          {role === 'Faculty' && <span className="faculty-name">Dr. Priya Sharma <small>Computer Science &amp; Information Technology</small></span>}
          {role === 'HOD' && <span className="faculty-name">Dr. B. Ramesh <small>Computer Science &amp; Information Technology</small></span>}
          {role === 'Principal' && <span className="principal-name">Dr. C. Nadhamuni Reddy <small>Annamacharya Institute of Technology &amp; Sciences</small></span>}
          {(role === 'Student' || role === 'Faculty' || role === 'Principal') && <div className="notification-wrap">
            <button type="button" className="header-icon-button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}>◌<span className="notification-dot" /></button>
            {(role === 'Student' || role === 'Principal') && notificationsOpen && (
              <div className="notification-panel" role="dialog" aria-label="Notifications">
                <div className="notification-heading"><strong>Notifications</strong><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications">×</button></div>
                {role === 'Student' ? <><div className="notification-item"><span className="notification-item-icon blue">✓</span><p>Your attendance was updated.<small>Today, 9:15 AM</small></p></div><div className="notification-item"><span className="notification-item-icon amber">!</span><p>New assignment deadline approaching.<small>Yesterday</small></p></div><div className="notification-item"><span className="notification-item-icon violet">✦</span><p>Faculty mentor added a recommendation.<small>Mon, 3:40 PM</small></p></div><div className="notification-item"><span className="notification-item-icon green">↗</span><p>Your academic risk analysis was updated.<small>Mon, 9:15 AM</small></p></div></> : <><div className="notification-item"><span className="notification-item-icon blue">↗</span><p>CSE department intervention report updated.<small>Today, 10:24 AM</small></p></div><div className="notification-item"><span className="notification-item-icon violet">△</span><p>New institution risk trend detected.<small>Yesterday</small></p></div><div className="notification-item"><span className="notification-item-icon green">✓</span><p>12 interventions completed this week.<small>Mon, 3:40 PM</small></p></div></>}
              </div>
            )}
          </div>}
          {role === 'Student' && <button type="button" className="profile-button" aria-label="Open profile">RK</button>}
          {role === 'Faculty' && <button type="button" className="profile-button" aria-label="Open profile">PS</button>}
          {role === 'HOD' && <><button type="button" className="header-icon-button" aria-label="Notifications">◌<span className="notification-dot" /></button><button type="button" className="profile-button" aria-label="Open profile">BR</button></>}
          {role === 'Principal' && <button type="button" className="profile-button" aria-label="Open profile">CR</button>}
          <div className="role-badge"><span className="online-dot" /> {role} portal</div>
          <button type="button" className="logout-button" onClick={handleLogout}>
            <span aria-hidden="true">↪</span> Log out
          </button>
        </header>

        <main className="dashboard-content">
          <div className="dashboard-intro">
            <div>
              <p className="dashboard-kicker">{role} dashboard</p>
              <h1>Good morning, {role}.</h1>
              <p>{subtitle}</p>
            </div>
            <div className="date-chip"><span aria-hidden="true">◷</span> Academic year 2025–26</div>
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
