import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import {
  getStudentAcademicData,
  getStudents,
  predictStudentRisk,
} from '../services/riskApi'
import type { StudentAcademicData, StudentRiskPredictionRequest, StudentRiskPredictionResult } from '../services/riskApi'

type StudentSummary = {
  label: string
  value: string
  status: string
  icon: string
  tone: 'blue' | 'green' | 'amber' | 'red'
}

function StudentSummaryCards({ academicData, prediction, loading, error }: { academicData: StudentAcademicData | null; prediction: StudentRiskPredictionResult | null; loading: boolean; error: string | null }) {
  const riskDisplay = loading ? 'Loading...' : prediction ? `${prediction.risk_level} Risk` : 'Unavailable'
  const confidenceDisplay = prediction?.confidence === undefined ? 'Awaiting API' : `${Math.round(prediction.confidence * 100)}% confidence`
  const academicStatus = error ? 'Unavailable' : loading ? 'Loading...' : 'Updated from API'
  const summaries: StudentSummary[] = [
    { label: 'Attendance', value: academicData ? `${academicData.attendance_percentage}%` : '—', status: academicStatus, icon: '◒', tone: 'amber' },
    { label: 'Average marks', value: academicData ? `${academicData.average_marks_percentage}%` : '—', status: academicStatus, icon: '↗', tone: 'blue' },
    { label: 'Assignments', value: academicData ? `${Math.round(academicData.assignment_completion_percentage)}%` : '—', status: academicData ? `${Math.round(100 - academicData.assignment_completion_percentage)}% pending` : academicStatus, icon: '▣', tone: 'red' },
    { label: 'AI risk level', value: riskDisplay, status: confidenceDisplay, icon: '◆', tone: 'amber' },
  ]

  return (
    <div className="student-summary-grid">
      {summaries.map((summary) => (
        <article className={`student-summary-card summary-${summary.tone}`} key={summary.label}>
          <div className="summary-card-topline"><span className="summary-icon" aria-hidden="true">{summary.icon}</span><span>Updated today</span></div>
          <p>{summary.label}</p>
          <strong>{summary.value}</strong>
          <span className="summary-status">{summary.status}</span>
        </article>
      ))}
    </div>
  )
}

function RiskAnalysis({ onViewWhy, prediction, loading, error }: { onViewWhy: () => void; prediction: StudentRiskPredictionResult | null; loading: boolean; error: string | null }) {
  const confidenceDisplay = prediction?.confidence === undefined ? null : `${(prediction.confidence * 100).toFixed(1)}%`
  const riskLevelDisplay = prediction ? `${prediction.risk_level} Risk` : loading ? 'Loading prediction...' : 'Prediction unavailable'

  return (
    <section className="student-risk-card">
      <div className="risk-copy">
        <p className="dashboard-kicker">AI insight</p>
        <h2>AI Academic Risk Analysis</h2>
        <p>Your current risk level is influenced by attendance, recent marks and incomplete assignments.</p>
        <button type="button" className="risk-button" onClick={onViewWhy}>View Why? <span aria-hidden="true">→</span></button>
      </div>
      <div className="risk-gauge" aria-label={confidenceDisplay ? `Model confidence ${confidenceDisplay}` : 'Model prediction status'}>
        <div className="gauge-ring"><div><strong>{confidenceDisplay ?? (loading ? '...' : '—')}</strong><span>Model confidence</span></div></div>
        <span className="risk-level">{riskLevelDisplay}</span>
        {error && <span className="risk-error" role="alert">{error}</span>}
      </div>
    </section>
  )
}

function Recommendations({ prediction, loading, error, planned, onPlan }: { prediction: StudentRiskPredictionResult | null; loading: boolean; error: string | null; planned: Set<string>; onPlan: (title: string) => void }) {
  const recommendations = prediction?.recommendations.recommendations ?? []
  const sectionCount = loading ? 'Loading...' : `${recommendations.length} suggestion${recommendations.length === 1 ? '' : 's'}`

  return (
    <section className="student-section">
      <div className="student-section-heading"><div><p className="dashboard-kicker">Personalized for you</p><h2>AI Recommended Actions</h2></div><span className="section-count">{sectionCount}</span></div>
      {error && <p className="risk-error" role="alert">{error}</p>}
      <div className="recommendation-grid">
        {loading && <p>Loading recommendations...</p>}
        {!loading && !error && recommendations.length === 0 && <p>No specific actions are required right now. Continue maintaining consistent academic habits.</p>}
        {!loading && recommendations.map((recommendation) => {
          const tone = recommendation.priority === 'High' ? 'amber' : recommendation.priority === 'Medium' ? 'blue' : 'green'
          const isPlanned = planned.has(recommendation.title)

          return (
            <article className={`recommendation-card recommendation-${tone}`} key={recommendation.title}>
              <span className="recommendation-icon" aria-hidden="true">↗</span>
              <span className="dashboard-kicker">{recommendation.category} · {recommendation.priority} priority</span>
              <h3>{recommendation.title}</h3>
              <p>{recommendation.action}</p>
              <button type="button" className="action-link" onClick={() => onPlan(recommendation.title)} disabled={isPlanned}>
                {isPlanned ? 'Planned ✓' : 'Mark as Planned'} {!isPlanned && <span aria-hidden="true">→</span>}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function PerformanceChart({ averageMarks, trend }: { averageMarks: number | null; trend: StudentAcademicData['recent_performance_trend'] | null }) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const values = [54, 63, 58, 70, averageMarks ?? 0]
  const labels = ['Unit 1', 'Unit 2', 'Mid Exam', 'Unit 3', 'Current']
  const points = values.map((value, index) => `${index * 25 + 1},${100 - value}`).join(' ')

  return (
    <section className="student-panel performance-panel">
      <div className="panel-heading"><div><p className="dashboard-kicker">Academic trend</p><h2>Performance overview</h2></div><span className="chart-legend"><i /> Marks percentage{trend && ` · ${trend}`}</span></div>
      <div className="performance-chart" aria-label="Academic performance line chart">
        <div className="chart-y-axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div>
        <div className="chart-area">
          <div className="chart-grid-lines"><i /><i /><i /><i /><i /></div>
          <svg viewBox="0 0 102 100" preserveAspectRatio="none" role="img" aria-label={`Performance values ${values.join(', ')} percent`}>
            <polyline points={points} fill="none" />
            {values.map((value, index) => <circle key={value + index} cx={index * 25 + 1} cy={100 - value} r="1.8" onMouseEnter={() => setHoveredPoint(index)} onMouseLeave={() => setHoveredPoint(null)} onClick={() => setHoveredPoint(index)} />)}
          </svg>
          {hoveredPoint !== null && <div className="chart-tooltip" style={{ left: `${hoveredPoint * 25}%` }}>{labels[hoveredPoint]}: <strong>{values[hoveredPoint]}%</strong></div>}
          <div className="chart-labels">{labels.map((label) => <span key={label}>{label}</span>)}</div>
        </div>
      </div>
    </section>
  )
}

function AttendanceBreakdown() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const subjects = [
    { name: 'Python', percentage: 78, attended: 14, total: 18 },
    { name: 'DBMS', percentage: 69, attended: 11, total: 16 },
    { name: 'Computer Networks', percentage: 74, attended: 14, total: 19 },
    { name: 'Operating Systems', percentage: 66, attended: 10, total: 15 },
    { name: 'Software Engineering', percentage: 73, attended: 11, total: 15 },
  ]
  return (
    <section className="student-panel attendance-panel" id="attendance-section">
      <div className="panel-heading"><div><p className="dashboard-kicker">Class participation</p><h2>Attendance breakdown</h2></div><button type="button" className="text-button">View details <span aria-hidden="true">→</span></button></div>
      <div className="subject-list">
        {subjects.map((subject) => <button type="button" className={`subject-row ${selectedSubject === subject.name ? 'selected' : ''}`} key={subject.name} onClick={() => setSelectedSubject(selectedSubject === subject.name ? null : subject.name)}><div><strong>{subject.name}</strong><span>{subject.percentage}%</span></div><div className="subject-track"><i style={{ width: `${subject.percentage}%` }} /></div>{selectedSubject === subject.name && <div className="subject-details"><span>Classes attended <b>{subject.attended}</b></span><span>Total classes <b>{subject.total}</b></span></div>}</button>)}
      </div>
    </section>
  )
}

function AssignmentStatus({ completionPercentage }: { completionPercentage: number | null }) {
  const assignments = [
    ['Python Assignment 4', 'Completed', 'Submitted today'],
    ['DBMS Case Study', 'Pending', 'Due in 2 days'],
    ['Networks Lab Report', 'Overdue', 'Due 3 days ago'],
    ['Software Engineering Quiz', 'Completed', 'Submitted Monday'],
  ] as const
  return (
    <section className="student-panel assignment-panel" id="assignments-section">
      <div className="panel-heading"><div><p className="dashboard-kicker">Coursework tracker</p><h2>Assignment status</h2></div><span className="section-count">{completionPercentage === null ? 'Loading...' : `${Math.round(completionPercentage)}% completed`}</span></div>
      <div className="assignment-list">{assignments.map(([title, status, detail]) => <div className="assignment-row" key={title}><span className={`assignment-status status-${status.toLowerCase()}`}>{status === 'Completed' ? '✓' : status === 'Pending' ? '!' : '×'}</span><div><strong>{title}</strong><span>{detail}</span></div><span className={`assignment-label status-text-${status.toLowerCase()}`}>{status}</span></div>)}</div>
    </section>
  )
}

function RiskWhyModal({ onClose, prediction, loading }: { onClose: () => void; prediction: StudentRiskPredictionResult | null; loading: boolean }) {
  const riskLevel = prediction ? `${prediction.risk_level} Risk` : loading ? 'Loading prediction...' : 'Prediction unavailable'

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="risk-modal" role="dialog" aria-modal="true" aria-labelledby="risk-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading"><div><p className="dashboard-kicker">AI explanation</p><h2 id="risk-modal-title">Why is my risk level {riskLevel}?</h2></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close risk explanation">×</button></div>
        <p className="modal-intro">{prediction?.explanation.summary ?? (loading ? 'Loading explanation...' : 'The explanation is unavailable.')}</p>
        <div className="risk-factor-list">{prediction?.explanation.risk_factors.map((factor) => <div key={`${factor.factor}-${factor.value}`}><span>{factor.factor}</span><strong>{factor.value}<em>{factor.message}</em></strong></div>)}</div>
        <p className="modal-disclaimer">These factors are indicators used by EduGuard AI. They are not a permanent judgment about the student.</p>
      </section>
    </div>
  )
}

function StudentActivity() {
  const activities = [['Assignment submitted', 'Python · Assignment 4', 'Today, 10:24 AM', '✓'], ['Unit test completed', 'DBMS · Unit 2 assessment', 'Yesterday', '↗'], ['Faculty feedback received', 'Dr. Priya Sharma · Python', 'Mon, 3:40 PM', '✦'], ['Attendance updated', 'Computer Networks · 74%', 'Mon, 9:15 AM', '◒']]
  return (
    <section className="student-panel recent-panel">
      <div className="panel-heading"><div><p className="dashboard-kicker">Keep track</p><h2>Recent activity</h2></div><button type="button" className="text-button">View all <span aria-hidden="true">→</span></button></div>
      <div className="student-activity-list">{activities.map(([title, detail, time, icon]) => <div className="student-activity-row" key={title}><span className="activity-avatar avatar-blue">{icon}</span><div><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div>)}</div>
    </section>
  )
}

function StudentNotifications() {
  const notifications = [
    ['Your attendance was updated.', 'Today, 9:15 AM', '✓'],
    ['New assignment deadline approaching.', 'Yesterday', '!'],
    ['Faculty mentor added a recommendation.', 'Mon, 3:40 PM', '✦'],
    ['Your academic risk analysis was updated.', 'Mon, 9:15 AM', '↗'],
  ]
  return (
    <section className="student-panel notifications-section" id="notifications-section">
      <div className="panel-heading"><div><p className="dashboard-kicker">Stay informed</p><h2>Notifications</h2></div><span className="section-count">4 recent updates</span></div>
      <div className="student-activity-list">{notifications.map(([title, time, icon]) => <div className="student-activity-row" key={title}><span className="activity-avatar avatar-blue">{icon}</span><div><strong>{title}</strong><span>EduGuard AI demo notification</span></div><time>{time}</time></div>)}</div>
    </section>
  )
}

type FacultyRisk = 'High' | 'Medium' | 'Low'
type InterventionStatus = 'Not Started' | 'Assigned' | 'In Progress' | 'Completed'

type FacultyIntervention = {
  id: string
  type: string
  assignedDate: string
  followUpDate: string
  faculty: string
  status: InterventionStatus
  notes: string
  priority: 'High' | 'Medium' | 'Low'
  outcome?: 'Improving' | 'No Significant Change' | 'Needs Further Support'
}

type FacultyStudent = {
  studentId: string
  studentName: string
  department: string
  className: string
  attendancePercentage: number
  averageMarksPercentage: number
  assignmentCompletionPercentage: number
  recentPerformanceTrend: StudentAcademicData['recent_performance_trend']
  name: string
  initials: string
  rollNumber: string
  attendance: number
  marks: number
  assignments: string
  riskScore: number
  riskLevel: FacultyRisk
  riskConfidence?: number
  subject: string
  factors: string[]
}

function mapFacultyStudent(student: StudentAcademicData, prediction?: StudentRiskPredictionResult): FacultyStudent {
  const riskScore = Math.round(
    (100 - student.attendance_percentage) * 0.3 +
    (100 - student.average_marks_percentage) * 0.35 +
    (100 - student.assignment_completion_percentage) * 0.2 +
    (student.recent_performance_trend === 'Declining' ? 100 : student.recent_performance_trend === 'Stable' ? 50 : 0) * 0.15,
  )
  const riskLevel: FacultyRisk = prediction?.risk_level ?? (riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low')
  const factors = [
    student.attendance_percentage < 75 ? 'Attendance below target' : null,
    student.average_marks_percentage < 65 ? 'Recent marks below target' : null,
    student.assignment_completion_percentage < 80 ? 'Incomplete assignments' : null,
    student.recent_performance_trend === 'Declining' ? 'Recent performance decline' : null,
  ].filter((factor): factor is string => factor !== null)

  return {
    studentId: student.student_id,
    studentName: student.student_name,
    rollNumber: student.roll_number,
    department: student.department,
    className: student.class_name,
    attendancePercentage: student.attendance_percentage,
    averageMarksPercentage: student.average_marks_percentage,
    assignmentCompletionPercentage: student.assignment_completion_percentage,
    recentPerformanceTrend: student.recent_performance_trend,
    name: student.student_name,
    initials: student.student_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
    attendance: student.attendance_percentage,
    marks: student.average_marks_percentage,
    assignments: `${Math.round(student.assignment_completion_percentage)}%`,
    riskScore,
    riskLevel,
    riskConfidence: prediction?.confidence,
    subject: student.department.includes('Information Technology') ? 'Information Technology' : 'Computer Science',
    factors: factors.length > 0 ? factors : ['No immediate concerns'],
  }
}
const initialFacultyInterventions: Record<string, FacultyIntervention[]> = {
  '23CS101': [{ id: 'demo-rahul', type: 'Mentor Counselling', assignedDate: '08 Sep 2025', followUpDate: '22 Sep 2025', faculty: 'Dr. Priya Sharma', status: 'Assigned', notes: 'Discuss attendance recovery plan.', priority: 'High' }],
  '23CS108': [{ id: 'demo-kiran', type: 'Remedial Class', assignedDate: '03 Sep 2025', followUpDate: '10 Sep 2025', faculty: 'Dr. Priya Sharma', status: 'Completed', notes: 'Connected student with DBMS support group.', priority: 'Medium', outcome: 'Improving' }],
}

function FacultySummaryCards({ pending, completed }: { pending: number; completed: number }) {
  const cards = [
    ['Assigned Students', '42', '6 more than last term', '◎', 'blue'],
    ['High Risk', '6', 'Require immediate review', '△', 'red'],
    ['Medium Risk', '13', 'Watch list students', '◒', 'amber'],
    ['Pending Interventions', String(pending), '3 due this week', '↗', 'violet'],
    ['Completed Interventions', String(completed), 'Positive outcomes recorded', '✓', 'green'],
  ] as const
  return <div className="faculty-summary-grid">{cards.map(([label, value, detail, icon, tone]) => <article className={`faculty-summary-card faculty-summary-${tone}`} key={label}><div className="faculty-summary-top"><span>{icon}</span><small>Live demo</small></div><p>{label}</p><strong>{value}</strong><em>{detail}</em></article>)}</div>
}

function RiskTrendChart() {
  const riskCounts = [['High', 6, 'red'], ['Medium', 13, 'amber'], ['Low', 23, 'green']] as const
  return <section className="faculty-panel risk-trend-panel" id="faculty-risk-section"><div className="faculty-panel-heading"><div><p className="dashboard-kicker">Student distribution</p><h2>Students by Risk Level</h2></div><span className="demo-label">Demo data</span></div><div className="risk-bars">{riskCounts.map(([label, count, tone]) => <div className="risk-bar-row" key={label}><div><span>{label}</span><strong>{count}</strong></div><div className="risk-bar-track"><i className={`risk-bar-${tone}`} style={{ width: `${(count / 23) * 100}%` }} /></div></div>)}</div></section>
}

function FacultyActivity() {
  const activities = [['Intervention assigned to Rahul Kumar', 'Mentor counselling', 'Today, 10:24 AM', '↗'], ['Attendance updated for Anjali Reddy', 'Computer Science · 72%', 'Yesterday', '◒'], ['Follow-up completed for Kiran', 'Progress review recorded', 'Mon, 3:40 PM', '✓'], ['New high-risk student detected', 'Vikram Singh · 92% score', 'Mon, 9:15 AM', '△']]
  return <section className="faculty-panel faculty-activity-panel" id="faculty-activity-section"><div className="faculty-panel-heading"><div><p className="dashboard-kicker">Keep your cohort moving</p><h2>Recent Activity</h2></div><button type="button" className="text-button">View all <span aria-hidden="true">→</span></button></div><div className="faculty-activity-list">{activities.map(([title, detail, time, icon]) => <div className="faculty-activity-row" key={title}><span className="activity-avatar avatar-blue">{icon}</span><div><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div>)}</div></section>
}

function FacultyInterventionWorkflow({ student, interventions, onClose, onAdd, onStatusChange, onFollowup }: { student: FacultyStudent; interventions: FacultyIntervention[]; onClose: () => void; onAdd: (intervention: FacultyIntervention) => void; onStatusChange: (id: string, status: InterventionStatus) => void; onFollowup: (id: string, note: string, outcome: FacultyIntervention['outcome']) => void }) {
  const [assignOpen, setAssignOpen] = useState(false)
  const [followupId, setFollowupId] = useState<string | null>(null)
  const [type, setType] = useState('Mentor Counselling')
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium')
  const [note, setNote] = useState('')
  const [followUpDate, setFollowUpDate] = useState('2025-09-30')
  const [followupNote, setFollowupNote] = useState('')
  const [outcome, setOutcome] = useState<FacultyIntervention['outcome']>('Improving')
  const [message, setMessage] = useState('')
  const recommendations = [
    ['Mentor Counselling', 'Build a shared understanding of current blockers.', 'Discuss barriers and agree on a weekly support plan.'],
    ['Attendance Improvement Plan', 'Attendance is below the expected threshold.', 'Set a practical attendance goal and review it weekly.'],
    ['Remedial Class', 'Recent marks suggest targeted subject support could help.', 'Connect the student with an upcoming remedial session.'],
    ['Assignment Completion Plan', 'Incomplete work is contributing to the risk signal.', 'Break pending coursework into smaller deadlines.'],
    ['Parent/Guardian Communication', 'Additional support may help maintain momentum.', 'Share a supportive progress update when appropriate.'],
  ]
  const activeStatus = (status: InterventionStatus) => status === 'Assigned' ? 'In Progress' : status === 'In Progress' ? 'Completed' : status

  function submitIntervention(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onAdd({ id: `intervention-${Date.now()}`, type, assignedDate: 'Today', followUpDate: new Date(`${followUpDate}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), faculty: 'Dr. Priya Sharma', status: 'Assigned', notes: note || 'No faculty note added.', priority })
    setAssignOpen(false)
    setNote('')
    setMessage('Intervention assigned successfully.')
  }

  function submitFollowup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!followupId) return
    onFollowup(followupId, followupNote || 'Follow-up completed.', outcome)
    setFollowupId(null)
    setFollowupNote('')
    setMessage('Follow-up saved successfully.')
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="faculty-detail-modal" role="dialog" aria-modal="true" aria-labelledby="faculty-student-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="dashboard-kicker">Student profile · Demo data</p><h2 id="faculty-student-title">{student.name}</h2><span className="faculty-roll">{student.rollNumber} · {student.subject}</span></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close student details">×</button></div><div className="faculty-detail-metrics"><div><span>Attendance</span><strong>{student.attendance}%</strong></div><div><span>Average marks</span><strong>{student.marks}%</strong></div><div><span>Assignments</span><strong>{student.assignments}</strong></div><div><span>Risk score</span><strong>{student.riskScore}%</strong></div></div><div className="faculty-detail-risk"><div><p className="dashboard-kicker">Current assessment</p><span className={`risk-pill risk-${student.riskLevel.toLowerCase()}`}>{student.riskLevel} Risk</span></div><span className="demo-label">All values are demo data</span></div><div className="faculty-factors"><h3>AI Risk Factors</h3><ul>{student.factors.map((factor) => <li key={factor}>{factor}</li>)}</ul></div><div className="intervention-section"><div className="faculty-panel-heading"><div><p className="dashboard-kicker">Decision support · Demo data</p><h3>AI Recommended Interventions</h3></div><button type="button" className="assign-primary-button" onClick={() => setAssignOpen(true)}>+ Assign Intervention</button></div><div className="intervention-list">{recommendations.map(([title, reason, action]) => <div className="intervention-row" key={title}><div><strong>{title}</strong><span><b>Why:</b> {reason}</span><span><b>Suggested action:</b> {action}</span></div><button type="button" onClick={() => { setType(title); setAssignOpen(true) }}>Assign Intervention</button></div>)}</div></div>{message && <p className="workflow-success" role="status">✓ {message}</p>}<div className="history-section"><div className="faculty-panel-heading"><div><p className="dashboard-kicker">Track support</p><h3>Intervention History</h3></div><span className="demo-label">{interventions.length} record{interventions.length === 1 ? '' : 's'}</span></div>{interventions.length === 0 ? <p className="empty-state">No interventions assigned yet.</p> : <div className="intervention-history">{interventions.map((intervention) => <div className="history-row" key={intervention.id}><div className="history-main"><strong>{intervention.type}</strong><span>{intervention.assignedDate} · {intervention.faculty}</span><small>Follow-up: {intervention.followUpDate} · {intervention.priority} priority</small><small>Notes: {intervention.notes}</small></div><div className="history-controls"><span className={`intervention-status status-${intervention.status.toLowerCase().replaceAll(' ', '-')}`}>{intervention.status}</span>{intervention.status !== 'Completed' && <button type="button" className="status-action" onClick={() => onStatusChange(intervention.id, activeStatus(intervention.status))}>{activeStatus(intervention.status) === 'In Progress' ? 'Start' : 'Complete'}</button>}{intervention.status !== 'Not Started' && <button type="button" className="followup-action" onClick={() => setFollowupId(intervention.id)}>Follow-up</button>}</div>{intervention.outcome && <div className="outcome-card"><strong>Intervention Outcome</strong><span>Before Risk Score: {student.riskScore}% → After Risk Score: 68%</span><b>Risk trend improved after intervention.</b><small>Demo result only</small></div>}</div>)}</div>}</div><div className="quick-actions"><button type="button" onClick={() => setMessage('Student profile is already open.')}>View Student</button><button type="button" onClick={() => setAssignOpen(true)}>Assign Intervention</button><button type="button" onClick={() => setMessage('Note draft opened for this student.')}>Add Note</button><button type="button" onClick={() => setMessage('Follow-up scheduler opened.')}>Schedule Follow-up</button></div>{assignOpen && <div className="workflow-overlay"><form className="workflow-form" onSubmit={submitIntervention}><div className="modal-heading"><div><p className="dashboard-kicker">Demo workflow</p><h3>Assign Intervention</h3></div><button type="button" className="modal-close" onClick={() => setAssignOpen(false)} aria-label="Close assignment form">×</button></div><label>Intervention type<select value={type} onChange={(event) => setType(event.target.value)}>{recommendations.map(([title]) => <option key={title}>{title}</option>)}</select></label><label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value as 'High' | 'Medium' | 'Low')}><option>High</option><option>Medium</option><option>Low</option></select></label><label>Faculty note<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add context for this intervention" rows={3} /></label><label>Follow-up date<input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} required /></label><div className="workflow-form-actions"><button type="button" onClick={() => setAssignOpen(false)}>Cancel</button><button type="submit">Assign</button></div></form></div>}{followupId && <div className="workflow-overlay"><form className="workflow-form" onSubmit={submitFollowup}><div className="modal-heading"><div><p className="dashboard-kicker">Demo workflow</p><h3>Record Follow-up</h3></div><button type="button" className="modal-close" onClick={() => setFollowupId(null)} aria-label="Close follow-up form">×</button></div><label>Follow-up note<textarea value={followupNote} onChange={(event) => setFollowupNote(event.target.value)} placeholder="What changed since the last check-in?" rows={3} required /></label><label>Outcome<select value={outcome} onChange={(event) => setOutcome(event.target.value as FacultyIntervention['outcome'])}><option>Improving</option><option>No Significant Change</option><option>Needs Further Support</option></select></label><div className="workflow-form-actions"><button type="button" onClick={() => setFollowupId(null)}>Cancel</button><button type="submit">Save Follow-up</button></div></form></div>}</section></div>
}

function FacultyStudentModal({ student, status, onClose, onAssign, onQuickAction, interventions = [], onAdd, onStatusChange, onFollowup }: { student: FacultyStudent; status: InterventionStatus; onClose: () => void; onAssign: () => void; onQuickAction: (action: string) => void; interventions?: FacultyIntervention[]; onAdd?: (intervention: FacultyIntervention) => void; onStatusChange?: (id: string, status: InterventionStatus) => void; onFollowup?: (id: string, note: string, outcome: FacultyIntervention['outcome']) => void }) {
  if (onAdd && onStatusChange && onFollowup) return <FacultyInterventionWorkflow student={student} interventions={interventions} onClose={onClose} onAdd={onAdd} onStatusChange={onStatusChange} onFollowup={onFollowup} />
  const recommendations = [
    ['Mentor counselling', 'Build a shared understanding of current blockers.'],
    ['Attendance improvement plan', 'Agree on a practical weekly attendance goal.'],
    ['Remedial class', 'Connect the student with subject support sessions.'],
    ['Assignment completion plan', 'Break pending coursework into smaller deadlines.'],
    ['Parent/guardian communication', 'Share a supportive progress update when appropriate.'],
  ]
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="faculty-detail-modal" role="dialog" aria-modal="true" aria-labelledby="faculty-student-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="dashboard-kicker">Student profile</p><h2 id="faculty-student-title">{student.name}</h2><span className="faculty-roll">{student.rollNumber} · {student.subject}</span></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close student details">×</button></div><div className="faculty-detail-metrics"><div><span>Attendance</span><strong>{student.attendance}%</strong></div><div><span>Average marks</span><strong>{student.marks}%</strong></div><div><span>Assignments</span><strong>{student.assignments}</strong></div><div><span>Risk score</span><strong>{student.riskScore}%</strong></div></div><div className="faculty-detail-risk"><div><p className="dashboard-kicker">Current assessment</p><span className={`risk-pill risk-${student.riskLevel.toLowerCase()}`}>{student.riskLevel} Risk</span></div><span className={`intervention-status status-${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span></div><div className="faculty-factors"><h3>AI Risk Factors</h3><ul>{student.factors.map((factor) => <li key={factor}>{factor}</li>)}</ul></div><div className="intervention-section"><div className="faculty-panel-heading"><div><p className="dashboard-kicker">Take the next step</p><h3>Recommended Intervention</h3></div></div><div className="intervention-list">{recommendations.map(([title, reason]) => <div className="intervention-row" key={title}><div><strong>{title}</strong><span>{reason}</span></div><button type="button" onClick={onAssign} disabled={status !== 'Not Started'}>{status === 'Not Started' ? 'Assign Intervention' : 'Assigned ✓'}</button></div>)}</div></div><div className="quick-actions"><button type="button" onClick={() => onQuickAction('Student profile opened')}>View Student</button><button type="button" onClick={onAssign}>Assign Intervention</button><button type="button" onClick={() => onQuickAction('Note draft opened')}>Add Note</button><button type="button" onClick={() => onQuickAction('Follow-up scheduler opened')}>Schedule Follow-up</button></div></section></div>
}

function FacultyRiskTable({ students, onSelect }: { students: FacultyStudent[]; onSelect: (student: FacultyStudent) => void }) {
  return <section className="faculty-panel faculty-table-panel" id="faculty-students-section"><div className="faculty-panel-heading"><div><p className="dashboard-kicker">Assigned cohort</p><h2>Student Risk Overview</h2></div><span className="demo-label">{students.length} shown</span></div><div className="faculty-table-scroll"><table className="faculty-table"><thead><tr><th>Student</th><th>Roll Number</th><th>Attendance</th><th>Average Marks</th><th>Assignments</th><th>Risk Score</th><th>Risk Level</th><th>Action</th></tr></thead><tbody>{students.map((student) => <tr key={student.rollNumber} onClick={() => onSelect(student)}><td><span className="student-cell"><b>{student.initials}</b><strong>{student.name}</strong></span></td><td>{student.rollNumber}</td><td>{student.attendance}%</td><td>{student.marks}%</td><td>{student.assignments}</td><td><strong>{student.riskScore}%</strong></td><td><span className={`risk-pill risk-${student.riskLevel.toLowerCase()}`}>{student.riskLevel}</span></td><td><button type="button" className="view-student-button" onClick={(event) => { event.stopPropagation(); onSelect(student) }}>View</button></td></tr>)}</tbody></table>{students.length === 0 && <p className="empty-state">No students match these filters.</p>}</div></section>
}

function FacultyFilters({ search, setSearch, risk, setRisk, subject, setSubject, sort, setSort }: { search: string; setSearch: (value: string) => void; risk: FacultyRisk | 'All'; setRisk: (value: FacultyRisk | 'All') => void; subject: string; setSubject: (value: string) => void; sort: 'desc' | 'asc'; setSort: (value: 'desc' | 'asc') => void }) {
  return <div className="faculty-filters"><label className="search-field"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student" aria-label="Search student" /></label><select value={risk} onChange={(event) => setRisk(event.target.value as FacultyRisk | 'All')} aria-label="Filter by risk level"><option value="All">All risk levels</option><option value="High">High risk</option><option value="Medium">Medium risk</option><option value="Low">Low risk</option></select><select value={subject} onChange={(event) => setSubject(event.target.value)} aria-label="Filter by subject"><option value="All">All subjects</option><option value="Computer Science">Computer Science</option><option value="Information Technology">Information Technology</option></select><select value={sort} onChange={(event) => setSort(event.target.value as 'desc' | 'asc')} aria-label="Sort students"><option value="desc">Risk score: high to low</option><option value="asc">Risk score: low to high</option></select></div>
}

function HodSummaryCards({ filters }: { filters: HodFilters }) {
  const selectedClass = filters.className === 'All Classes' ? null : hodClasses.find((row) => row[0] === filters.className)
  const totalStudents = selectedClass ? selectedClass[1] : 240
  const riskMultiplier = filters.risk === 'High' ? .47 : filters.risk === 'Medium' ? .53 : filters.risk === 'Low' ? .9 : 1
  const atRiskStudents = Math.round((selectedClass ? selectedClass[4] + selectedClass[5] : 38) * riskMultiplier)
  const attendance = selectedClass ? selectedClass[2] : filters.subject === 'All Subjects' ? '76%' : '74%'
  const successRate = filters.academicYear === '2026-27' ? '76%' : selectedClass ? '70%' : '72%'
  const cards = [['Total Students', String(totalStudents), filters.className === 'All Classes' ? '+4.1% this year' : 'Selected class', '◎', 'blue'], ['At-Risk Students', String(atRiskStudents), filters.risk === 'All' ? '6 fewer than last term' : `${filters.risk} risk filter`, '△', 'red'], ['Average Attendance', attendance, '+2.6% this term', '◒', 'amber'], ['Intervention Success Rate', successRate, '+8.4% this year', '✓', 'green']] as const
  return <div className="hod-summary-grid">{cards.map(([label, value, trend, icon, tone]) => <article className={`hod-summary-card hod-${tone}`} key={label}><div><span className="hod-card-icon">{icon}</span><small>Department view</small></div><p>{label}</p><strong>{value}</strong><em>↗ {trend}</em></article>)}</div>
}

const hodClasses = [['3-1 CSIT', 48, '78%', '71%', 7, 5], ['3-2 CSIT', 46, '74%', '68%', 8, 6], ['3-3 CSIT', 49, '77%', '72%', 6, 5], ['2-1 CSIT', 47, '75%', '64%', 9, 4], ['2-2 CSIT', 50, '76%', '67%', 8, 7]] as const
const hodSubjects = [['Python', '74%', '79%', 5], ['DBMS', '71%', '68%', 9], ['Computer Networks', '76%', '72%', 7], ['Operating Systems', '78%', '75%', 6], ['Software Engineering', '81%', '78%', 4]] as const
type HodStudent = StudentAcademicData & {
  studentId: string
  studentName: string
  rollNumber: string
  className: string
  attendancePercentage: number
  averageMarksPercentage: number
  assignmentCompletionPercentage: number
  recentPerformanceTrend: StudentAcademicData['recent_performance_trend']
  subject: string
  riskScore: number
  riskLevel: FacultyRisk
  riskConfidence?: number
  primaryRiskFactor: string
  faculty: string
}

function mapHodStudent(student: StudentAcademicData, prediction?: StudentRiskPredictionResult): HodStudent {
  const riskScore = Math.round(
    (100 - student.attendance_percentage) * 0.3 +
    (100 - student.average_marks_percentage) * 0.35 +
    (100 - student.assignment_completion_percentage) * 0.2 +
    (student.recent_performance_trend === 'Declining' ? 100 : student.recent_performance_trend === 'Stable' ? 50 : 0) * 0.15,
  )
  const factors = [
    student.attendance_percentage < 75 ? 'Low attendance' : null,
    student.average_marks_percentage < 65 ? 'Declining marks' : null,
    student.assignment_completion_percentage < 80 ? 'Incomplete assignments' : null,
    student.recent_performance_trend === 'Declining' ? 'Recent performance decline' : null,
  ].filter((factor): factor is string => factor !== null)
  const subject = student.department.includes('Information Technology') ? 'Information Technology' : 'Computer Science'

  return {
    ...student,
    studentId: student.student_id,
    studentName: student.student_name,
    rollNumber: student.roll_number,
    className: student.class_name,
    attendancePercentage: student.attendance_percentage,
    averageMarksPercentage: student.average_marks_percentage,
    assignmentCompletionPercentage: student.assignment_completion_percentage,
    recentPerformanceTrend: student.recent_performance_trend,
    subject,
    riskScore,
    riskLevel: prediction?.risk_level ?? (riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low'),
    riskConfidence: prediction?.confidence,
    primaryRiskFactor: factors[0] ?? 'No immediate concerns',
    faculty: 'Faculty assignment pending',
  }
}

type HodFilters = { academicYear: '2025-26' | '2026-27'; className: string; subject: string; risk: FacultyRisk | 'All' }

const defaultHodFilters: HodFilters = { academicYear: '2025-26', className: 'All Classes', subject: 'All Subjects', risk: 'All' }

function getFilteredHodStudents(students: HodStudent[], filters: HodFilters, search = '', sort: 'desc' | 'asc' = 'desc') {
  return students
    .filter((student) => filters.className === 'All Classes' || student.className === filters.className)
    .filter((student) => filters.subject === 'All Subjects' || student.subject === filters.subject)
    .filter((student) => filters.risk === 'All' || student.riskLevel === filters.risk)
    .filter((student) => student.studentName.toLowerCase().includes(search.toLowerCase()))
    .sort((first, second) => sort === 'desc' ? second.riskScore - first.riskScore : first.riskScore - second.riskScore)
}

function HodRiskDistribution({ filters, onRiskSelect }: { filters: HodFilters; onRiskSelect: (risk: FacultyRisk) => void }) {
  const selectedClass = filters.className === 'All Classes' ? null : hodClasses.find((row) => row[0] === filters.className)
  const baseCounts = selectedClass ? [selectedClass[4], selectedClass[5], selectedClass[1] - selectedClass[4] - selectedClass[5]] : [18, 20, 202]
  const distribution = [['High Risk', baseCounts[0], 'red', 'High'], ['Medium Risk', baseCounts[1], 'amber', 'Medium'], ['Low Risk', baseCounts[2], 'green', 'Low']] as const
  const visibleCounts = distribution.map(([, count, , level]) => filters.risk === 'All' || filters.risk === level ? count : 0)
  return <section className="hod-panel hod-risk-panel" id="hod-risk-section"><div className="hod-panel-heading"><div><p className="dashboard-kicker">Department overview</p><h2>Risk Distribution</h2></div><span className="hod-demo-label">DEMO DATA · CLICK A LEVEL</span></div><div className="hod-distribution"><div className="hod-donut"><div><strong>{visibleCounts.reduce((total, count) => total + count, 0)}</strong><span>students</span></div></div><div className="hod-legend">{distribution.map(([label, , tone, level], index) => <button type="button" className="hod-legend-button" key={label} onClick={() => onRiskSelect(level)}><span className={`hod-legend-dot ${tone}`} /><p>{label}<strong>{visibleCounts[index]}</strong></p></button>)}</div></div></section>
}

function HodClassAnalysis({ filters, onSelect }: { filters: HodFilters; onSelect: (row: (typeof hodClasses)[number]) => void }) {
  const rows = hodClasses.filter((row) => filters.className === 'All Classes' || row[0] === filters.className)
  return <section className="hod-panel hod-table-panel" id="hod-classes-section"><div className="hod-panel-heading"><div><p className="dashboard-kicker">Cohort comparison</p><h2>Class-wise Analysis</h2></div><select className="hod-select" aria-label="Class analysis term"><option>Current term</option><option>Previous term</option></select></div><div className="hod-table-scroll"><table className="hod-table"><thead><tr><th>Class</th><th>Students</th><th>Avg. Attendance</th><th>Avg. Marks</th><th>High Risk</th><th>Medium Risk</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]} className="hod-clickable-row" onClick={() => onSelect(row)}>{row.map((value, index) => index === 0 ? <td key={`${row[0]}-${index}`}><strong>{value}</strong></td> : <td key={`${row[0]}-${index}`}>{index > 3 ? <span className={`hod-number ${index === 4 ? 'high' : 'medium'}`}>{value}</span> : value}</td>)}</tr>)}</tbody></table></div></section>
}

function HodSubjectPerformance({ filters, onSelect }: { filters: HodFilters; onSelect: (row: (typeof hodSubjects)[number]) => void }) {
  const rows = hodSubjects.filter((row) => filters.subject === 'All Subjects' || row[0] === filters.subject)
  return <section className="hod-panel hod-table-panel" id="hod-subjects-section"><div className="hod-panel-heading"><div><p className="dashboard-kicker">Learning outcomes</p><h2>Subject Performance</h2></div><span className="hod-demo-label">DEMO DATA · CLICK A SUBJECT</span></div><div className="hod-table-scroll"><table className="hod-table subject-table"><thead><tr><th>Subject</th><th>Average Marks</th><th>Attendance</th><th>At-Risk Students</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]} className="hod-clickable-row" onClick={() => onSelect(row)}><td><strong>{row[0]}</strong></td><td><div className="hod-progress-value"><span>{row[1]}</span><i><b style={{ width: row[1] }} /></i></div></td><td>{row[2]}</td><td><span className="hod-number medium">{row[3]}</span></td></tr>)}</tbody></table></div></section>
}

function HodRiskTrend() {
  const values = [52, 47, 43, 38]
  const labels = ['June', 'July', 'August', 'September']
  const points = values.map((value, index) => `${index * 33 + 2},${100 - value * 1.2}`).join(' ')
  return <section className="hod-panel hod-trend-panel" id="hod-trend-section"><div className="hod-panel-heading"><div><p className="dashboard-kicker">Early warning movement</p><h2>At-Risk Student Trend</h2></div><span className="hod-demo-label">DEMO DATA</span></div><div className="hod-line-chart"><div className="hod-chart-y"><span>60</span><span>45</span><span>30</span><span>15</span><span>0</span></div><div className="hod-chart-area"><div className="hod-chart-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 102 100" preserveAspectRatio="none" role="img" aria-label="At-risk students from June to September"><polyline points={points} fill="none" />{values.map((value, index) => <circle key={value} cx={index * 33 + 2} cy={100 - value * 1.2} r="2" />)}</svg><div className="hod-chart-labels">{labels.map((label) => <span key={label}>{label}</span>)}</div></div></div></section>
}

function HodInterventionAnalytics({ onSelect }: { onSelect: (type: string) => void }) {
  const types = [['Mentor Counselling', 42, 34], ['Remedial Class', 28, 22], ['Attendance Improvement', 36, 27], ['Assignment Support', 31, 24], ['Parent/Guardian Communication', 18, 12]] as const
  return <section className="hod-panel hod-intervention-panel" id="hod-interventions-section"><div className="hod-panel-heading"><div><p className="dashboard-kicker">Support outcomes</p><h2>Intervention Effectiveness</h2></div><span className="hod-demo-label">DEMO DATA · CLICK A TYPE</span></div><div className="hod-intervention-metrics"><div><span>Total Interventions</span><strong>155</strong></div><div><span>Completed</span><strong>109</strong></div><div><span>In Progress</span><strong>28</strong></div><div><span>Pending</span><strong>18</strong></div><div><span>Success Rate</span><strong>72%</strong></div></div><div className="hod-intervention-types">{types.map(([type, total, completed]) => <button type="button" className="hod-intervention-type" key={type} onClick={() => onSelect(type)}><div><strong>{type}</strong><span>{completed} of {total} completed</span></div><div className="hod-type-track"><i style={{ width: `${(completed / total) * 100}%` }} /></div><b>{Math.round((completed / total) * 100)}%</b></button>)}</div></section>
}

function HodFacultyPerformance() {
  const faculty = [['Dr. Priya Sharma', '42', '18', '14', '78%'], ['Dr. A. Mehta', '39', '16', '12', '75%'], ['Dr. N. Rao', '47', '21', '17', '81%'], ['Prof. S. Iyer', '36', '14', '10', '71%']] as const
  return <section className="hod-panel hod-table-panel" id="hod-faculty-section"><div className="hod-panel-heading"><div><p className="dashboard-kicker">Mentor outcomes</p><h2>Faculty Performance</h2></div><span className="hod-demo-label">DEMO DATA</span></div><div className="hod-table-scroll"><table className="hod-table"><thead><tr><th>Faculty</th><th>Assigned Students</th><th>Interventions</th><th>Completed</th><th>Success Rate</th></tr></thead><tbody>{faculty.map(([name, assigned, interventions, completed, success]) => <tr key={name}><td><span className="hod-person"><b>{name.split(' ').map((part) => part[0]).join('')}</b>{name}</span></td><td>{assigned}</td><td>{interventions}</td><td>{completed}</td><td><span className="success-value">{success}</span></td></tr>)}</tbody></table></div></section>
}

function HodAtRiskOverview({ students: allStudents, filters, search, sort, onSearchChange, onSortChange, onSelect }: { students: HodStudent[]; filters: HodFilters; search: string; sort: 'desc' | 'asc'; onSearchChange: (value: string) => void; onSortChange: (value: 'desc' | 'asc') => void; onSelect: (student: HodStudent) => void }) {
  const students = getFilteredHodStudents(allStudents, filters, search, sort)
  return <section className="hod-panel hod-table-panel" id="hod-students-section"><div className="hod-panel-heading"><div><p className="dashboard-kicker">Priority cohort</p><h2>At-Risk Student Overview</h2></div><span className="hod-demo-label">{students.length} SHOWN · DEMO DATA</span></div><div className="hod-filter-row"><label className="search-field"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search student" aria-label="Search student" /></label><select className="hod-select" value={sort} onChange={(event) => onSortChange(event.target.value as 'desc' | 'asc')} aria-label="Sort by risk score"><option value="desc">Risk score: high to low</option><option value="asc">Risk score: low to high</option></select></div><div className="hod-table-scroll"><table className="hod-table"><thead><tr><th>Student</th><th>Class</th><th>Subject</th><th>Risk Score</th><th>Risk Level</th><th>Primary Risk Factor</th><th>Faculty</th><th>Action</th></tr></thead><tbody>{students.map((student) => <tr key={student.studentId}><td><strong>{student.studentName}</strong></td><td>{student.className}</td><td>{student.subject}</td><td><strong>{student.riskScore}%</strong></td><td><span className={`risk-pill risk-${student.riskLevel.toLowerCase()}`}>{student.riskLevel}</span></td><td>{student.primaryRiskFactor}</td><td>{student.faculty}</td><td><button type="button" className="view-student-button" onClick={() => onSelect(student)}>View</button></td></tr>)}</tbody></table>{students.length === 0 && <p className="empty-state">No students match the selected filters.</p>}</div></section>
}

function HodAlertsAndReports({ onReport, onAlert }: { onReport: (title: string) => void; onAlert: (index: number) => void }) {
  const alerts = ['8 students have attendance below 60%.', '5 students show declining marks.', '3 students have multiple overdue assignments.', '6 high-risk students require follow-up.']
  return <div className="hod-alert-report-grid"><section className="hod-panel hod-alert-panel" id="hod-alerts-section"><div className="hod-panel-heading"><div><p className="dashboard-kicker">Needs attention</p><h2>Department Alerts</h2></div><span className="hod-alert-count">4 alerts</span></div><div className="hod-alert-list">{alerts.map((alert, index) => <button type="button" key={alert} onClick={() => onAlert(index)}><span>{index + 1}</span><p>{alert}</p><b aria-hidden="true">→</b></button>)}</div></section><section className="hod-panel hod-report-panel" id="hod-reports-section"><div className="hod-panel-heading"><div><p className="dashboard-kicker">Department intelligence</p><h2>Reports</h2></div></div><div className="hod-report-buttons"><button type="button" onClick={() => onReport('View Risk Report')}>▥ <span>View Risk Report</span> →</button><button type="button" onClick={() => onReport('View Intervention Report')}>↗ <span>View Intervention Report</span> →</button><button type="button" onClick={() => onReport('View Attendance Report')}>◒ <span>View Attendance Report</span> →</button></div></section></div>
}

function HodStudentModal({ student, onClose }: { student: HodStudent; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="hod-student-modal" role="dialog" aria-modal="true" aria-labelledby="hod-student-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="dashboard-kicker">Priority student · Demo data</p><h2 id="hod-student-title">{student.studentName}</h2><span className="faculty-roll">{student.className} · {student.subject} · Assigned to {student.faculty}</span></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close student details">×</button></div><div className="hod-student-detail-grid"><div><span>Risk score</span><strong>{student.riskScore}%</strong></div><div><span>Risk level</span><strong>{student.riskLevel}</strong></div><div><span>Primary factor</span><strong>{student.primaryRiskFactor}</strong></div><div><span>Attendance</span><strong>{student.attendancePercentage}%</strong></div><div><span>Average marks</span><strong>{student.averageMarksPercentage}%</strong></div><div><span>Assignment completion</span><strong>{student.assignmentCompletionPercentage}%</strong></div></div><div className="hod-modal-note"><strong>Department action</strong><p>Coordinate with {student.faculty} to review the student&apos;s support plan and follow-up progress.</p><p>Student risk information is intended for academic support and should not be treated as a permanent label.</p></div><span className="hod-demo-label">Current intervention: Mentor Counselling · Status: In Progress · Demo data only</span></section></div>
}

function HodReportModal({ title, onClose }: { title: string; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="hod-report-modal" role="dialog" aria-modal="true" aria-labelledby="hod-report-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="dashboard-kicker">Demo report</p><h2 id="hod-report-title">{title}</h2></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close report">×</button></div><p>Demo report — backend reporting will be connected later.</p><button type="button" className="assign-primary-button" onClick={onClose}>Close report</button></section></div>
}

function HodDrilldownModal({ title, details, onClose }: { title: string; details: string[]; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="hod-report-modal" role="dialog" aria-modal="true" aria-labelledby="hod-drilldown-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="dashboard-kicker">Analytics drill-down · Demo data</p><h2 id="hod-drilldown-title">{title}</h2></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close analytics details">×</button></div><div className="hod-drilldown-list">{details.map((detail) => <div key={detail}>{detail}</div>)}</div><button type="button" className="assign-primary-button" onClick={onClose}>Close details</button></section></div>
}

type PrincipalFilters = { academicYear: '2025-26' | '2026-27'; department: string; risk: FacultyRisk | 'All' }
const defaultPrincipalFilters: PrincipalFilters = { academicYear: '2025-26', department: 'All Departments', risk: 'All' }
const principalDepartments = [
  ['Computer Science & Information Technology', 420, '78%', '74%', 54, '76%'],
  ['Computer Science & Engineering', 465, '76%', '71%', 62, '73%'],
  ['Electronics & Communication Engineering', 390, '74%', '68%', 58, '69%'],
  ['Electrical & Electronics Engineering', 350, '77%', '70%', 47, '75%'],
  ['Mechanical Engineering', 410, '72%', '65%', 55, '71%'],
  ['Civil Engineering', 365, '75%', '67%', 36, '76%'],
] as const

type PrincipalStudent = {
  studentId: string
  studentName: string
  rollNumber: string
  department: string
  className: string
  attendancePercentage: number
  averageMarksPercentage: number
  assignmentCompletionPercentage: number
  recentPerformanceTrend: StudentAcademicData['recent_performance_trend']
  riskLevel: FacultyRisk
  riskConfidence?: number
}

function mapPrincipalStudent(student: StudentAcademicData, prediction?: StudentRiskPredictionResult): PrincipalStudent {
  const riskScore = (100 - student.attendance_percentage) * 0.3 + (100 - student.average_marks_percentage) * 0.35 + (100 - student.assignment_completion_percentage) * 0.2 + (student.recent_performance_trend === 'Declining' ? 100 : student.recent_performance_trend === 'Stable' ? 50 : 0) * 0.15

  return {
    studentId: student.student_id,
    studentName: student.student_name,
    rollNumber: student.roll_number,
    department: student.department,
    className: student.class_name,
    attendancePercentage: student.attendance_percentage,
    averageMarksPercentage: student.average_marks_percentage,
    assignmentCompletionPercentage: student.assignment_completion_percentage,
    recentPerformanceTrend: student.recent_performance_trend,
    riskLevel: prediction?.risk_level ?? (riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low'),
    riskConfidence: prediction?.confidence,
  }
}

function PrincipalFilters({ filters, onChange, onReset }: { filters: PrincipalFilters; onChange: <Key extends keyof PrincipalFilters>(key: Key, value: PrincipalFilters[Key]) => void; onReset: () => void }) {
  return <section className="principal-filter-bar"><div><p className="dashboard-kicker">Executive filters</p><strong>Institution-wide view · Demo data</strong></div><div className="principal-filter-controls"><select aria-label="Academic year" value={filters.academicYear} onChange={(event) => onChange('academicYear', event.target.value as PrincipalFilters['academicYear'])}><option>2025-26</option><option>2026-27</option></select><select aria-label="Department" value={filters.department} onChange={(event) => onChange('department', event.target.value)}><option>All Departments</option>{principalDepartments.map(([department]) => <option key={department}>{department}</option>)}</select><select aria-label="Risk level" value={filters.risk} onChange={(event) => onChange('risk', event.target.value as PrincipalFilters['risk'])}><option>All</option><option>High</option><option>Medium</option><option>Low</option></select><button type="button" onClick={onReset}>Reset Filters</button></div></section>
}

function PrincipalSummary({ filters }: { filters: PrincipalFilters }) {
  const selected = principalDepartments.find(([department]) => department === filters.department)
  const students = selected ? selected[1] : 2400
  const atRisk = selected ? selected[4] : filters.risk === 'High' ? 96 : filters.risk === 'Medium' ? 216 : 312
  const success = selected ? selected[5] : filters.academicYear === '2026-27' ? '77%' : '74%'
  const cards = [['Total Students', students, 'Institution enrollment', '◎', 'blue'], ['Total Faculty', selected ? 32 : 180, 'Academic staff', '♧', 'violet'], ['At-Risk Students', atRisk, filters.risk === 'All' ? '12 fewer this term' : `${filters.risk} filter active`, '△', 'red'], ['Intervention Success Rate', success, '+6.8% this year', '✓', 'green']] as const
  return <div className="principal-summary-grid">{cards.map(([label, value, detail, icon, tone]) => <article className={`principal-summary-card principal-${tone}`} key={label}><div><span>{icon}</span><small>DEMO DATA</small></div><p>{label}</p><strong>{value}</strong><em>{detail}</em></article>)}</div>
}

function PrincipalRiskDistribution({ filters, onSelect }: { filters: PrincipalFilters; onSelect: (risk: FacultyRisk) => void }) {
  const selected = filters.department !== 'All Departments'
  const counts = selected ? [8, 14, 10] : [128, 184, 2088]
  const levels = [['High Risk', counts[0], 'red', 'High'], ['Medium Risk', counts[1], 'amber', 'Medium'], ['Low Risk', counts[2], 'green', 'Low']] as const
  return <section className="principal-panel principal-risk-panel" id="principal-risk-section"><div className="principal-panel-heading"><div><p className="dashboard-kicker">Institution overview</p><h2>College Risk Distribution</h2></div><span className="principal-demo-label">DEMO DATA · CLICK A LEVEL</span></div><div className="principal-risk-content"><div className="principal-donut"><div><strong>{counts.reduce((total, count) => total + count, 0)}</strong><span>students</span></div></div><div className="principal-legend">{levels.map(([label, count, tone, risk]) => <button type="button" key={label} onClick={() => onSelect(risk)}><i className={tone} /><span>{label}</span><strong>{count}</strong></button>)}</div></div></section>
}

function PrincipalDepartmentTable({ filters, onSelect }: { filters: PrincipalFilters; onSelect: (department: (typeof principalDepartments)[number]) => void }) {
  const rows = principalDepartments.filter(([department]) => filters.department === 'All Departments' || filters.department === department)
  return <section className="principal-panel principal-table-panel" id="principal-departments-section"><div className="principal-panel-heading"><div><p className="dashboard-kicker">Institution comparison</p><h2>Department Overview</h2></div><span className="principal-demo-label">DEMO DATA · CLICK A ROW</span></div><div className="principal-table-scroll"><table className="principal-table"><thead><tr><th>Department</th><th>Students</th><th>Avg. Attendance</th><th>Avg. Marks</th><th>At-Risk Students</th><th>Intervention Success</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]} onClick={() => onSelect(row)}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td><span className="principal-risk-number">{row[4]}</span></td><td><span className="principal-success">{row[5]}</span></td></tr>)}</tbody></table></div></section>
}

function PrincipalStudentOverview({ students, filters }: { students: PrincipalStudent[]; filters: PrincipalFilters }) {
  const visibleStudents = students
    .filter((student) => filters.department === 'All Departments' || student.department === filters.department)
    .filter((student) => filters.risk === 'All' || student.riskLevel === filters.risk)
    .sort((first, second) => second.averageMarksPercentage - first.averageMarksPercentage)

  return <section className="principal-panel principal-table-panel" id="principal-students-section"><div className="principal-panel-heading"><div><p className="dashboard-kicker">Student-level overview</p><h2>At-Risk Students</h2></div><span className="principal-demo-label">{visibleStudents.length} SHOWN</span></div><div className="principal-table-scroll"><table className="principal-table"><thead><tr><th>Student</th><th>Roll Number</th><th>Class</th><th>Attendance</th><th>Average Marks</th><th>Assignments</th><th>Risk Level</th></tr></thead><tbody>{visibleStudents.map((student) => <tr key={student.studentId}><td><strong>{student.studentName}</strong></td><td>{student.rollNumber}</td><td>{student.className}</td><td>{student.attendancePercentage}%</td><td>{student.averageMarksPercentage}%</td><td>{student.assignmentCompletionPercentage}%</td><td><span className={`risk-pill risk-${student.riskLevel.toLowerCase()}`}>{student.riskLevel}</span></td></tr>)}</tbody></table>{visibleStudents.length === 0 && <p className="empty-state">No students match the selected filters.</p>}</div></section>
}

function PrincipalComparison({ metric, onMetricChange }: { metric: 'risk' | 'attendance' | 'success'; onMetricChange: (metric: 'risk' | 'attendance' | 'success') => void }) {
  const metricData = { risk: principalDepartments.map(([name, , , , risk]) => [name, risk] as const), attendance: principalDepartments.map(([name, , attendance]) => [name, Number.parseInt(attendance, 10)] as const), success: principalDepartments.map(([name, , , , , success]) => [name, Number.parseInt(success, 10)] as const) }[metric]
  const max = Math.max(...metricData.map(([, value]) => value))
  return <section className="principal-panel principal-comparison-panel" id="principal-analytics-section"><div className="principal-panel-heading"><div><p className="dashboard-kicker">Strategic comparison</p><h2>Department Comparison</h2></div><select aria-label="Comparison metric" value={metric} onChange={(event) => onMetricChange(event.target.value as typeof metric)}><option value="risk">At-Risk Students</option><option value="attendance">Average Attendance</option><option value="success">Intervention Success Rate</option></select></div><div className="principal-comparison-bars">{metricData.map(([name, value]) => <div key={name}><div><span>{name}</span><strong>{value}{metric === 'risk' ? '' : '%'}</strong></div><i><b style={{ width: `${(value / max) * 100}%` }} /></i></div>)}</div></section>
}

function PrincipalTrend() {
  const values = [390, 372, 355, 338, 325, 312]
  const labels = ['April', 'May', 'June', 'July', 'August', 'September']
  const points = values.map((value, index) => `${index * 20 + 2},${100 - (value - 280) * .8}`).join(' ')
  return <section className="principal-panel principal-trend-panel" id="principal-trend-section"><div className="principal-panel-heading"><div><p className="dashboard-kicker">Institution risk movement</p><h2>College Risk Trend</h2></div><span className="principal-demo-label">DEMO DATA</span></div><div className="principal-line-chart"><div className="principal-chart-y"><span>400</span><span>350</span><span>300</span></div><div className="principal-chart-area"><div className="principal-chart-lines"><i /><i /><i /></div><svg viewBox="0 0 102 100" preserveAspectRatio="none" role="img" aria-label="College at-risk student trend from April to September"><polyline points={points} fill="none" />{values.map((value, index) => <circle key={value} cx={index * 20 + 2} cy={100 - (value - 280) * .8} r="2" />)}</svg><div className="principal-chart-labels">{labels.map((label) => <span key={label}>{label}</span>)}</div></div></div></section>
}

function PrincipalInterventions() {
  const types = [['Mentor Counselling', 58, 43, 35], ['Remedial Classes', 42, 31, 25], ['Attendance Improvement', 52, 38, 29], ['Assignment Support', 46, 34, 27], ['Parent/Guardian Communication', 27, 19, 14]] as const
  return <section className="principal-panel principal-intervention-panel" id="principal-interventions-section"><div className="principal-panel-heading"><div><p className="dashboard-kicker">College-wide support</p><h2>College Intervention Overview</h2></div><span className="principal-demo-label">DEMO DATA</span></div><div className="principal-intervention-metrics"><div><span>Total Interventions</span><strong>225</strong></div><div><span>Completed</span><strong>165</strong></div><div><span>In Progress</span><strong>36</strong></div><div><span>Pending</span><strong>24</strong></div><div><span>Successful Outcomes</span><strong>142</strong></div></div><div className="principal-outcome-table"><div className="principal-outcome-header"><span>Intervention Type</span><span>Assigned</span><span>Completed</span><span>Improved</span></div>{types.map(([type, assigned, completed, improved]) => <div className="principal-outcome-row" key={type}><strong>{type}</strong><span>{assigned}</span><span>{completed}</span><span className="principal-success">{improved}</span></div>)}</div></section>
}

function PrincipalHealth() {
  const cards = [['Average College Attendance', '76%', 'Across all departments', '◒'], ['Average Academic Score', '69%', 'Current academic year', '↗'], ['Assignment Completion Rate', '82%', 'College-wide completion', '▣'], ['Immediate Support Needed', '312', 'Students require review', '△']] as const
  return <section className="principal-panel" id="principal-health-section"><div className="principal-panel-heading"><div><p className="dashboard-kicker">Executive pulse</p><h2>Academic Health Overview</h2></div><span className="principal-demo-label">DEMO DATA</span></div><div className="principal-health-grid">{cards.map(([label, value, detail, icon]) => <div key={label}><span>{icon}</span><p>{label}</p><strong>{value}</strong><small>{detail}</small></div>)}</div></section>
}

function PrincipalAlertsAndActivity({ onReport }: { onReport: (report: string) => void }) {
  const alerts = ['312 students currently require academic support.', '42 students have attendance below 60%.', '67 students show declining academic performance.', '28 students have multiple overdue assignments.', '15 intervention cases require follow-up.']
  const activity = ['CSE department intervention report updated', 'CSIT department risk analysis updated', '12 interventions completed this week', 'New academic risk trend detected']
  return <div className="principal-bottom-grid"><section className="principal-panel" id="principal-alerts-section"><div className="principal-panel-heading"><div><p className="dashboard-kicker">Executive attention</p><h2>Institution Alerts</h2></div><span className="principal-demo-label">DEMO DATA</span></div><div className="principal-alert-list">{alerts.map((alert, index) => <button type="button" key={alert} onClick={() => index === 0 && onReport('Institution Risk Focus')}><span>{index + 1}</span>{alert}<b>→</b></button>)}</div></section><section className="principal-panel" id="principal-reports-section"><div className="principal-panel-heading"><div><p className="dashboard-kicker">Executive reporting</p><h2>Reports</h2></div></div><div className="principal-report-buttons"><button type="button" onClick={() => onReport('College Risk Report')}>△ <span>College Risk Report</span> →</button><button type="button" onClick={() => onReport('Department Performance Report')}>▥ <span>Department Performance Report</span> →</button><button type="button" onClick={() => onReport('Intervention Effectiveness Report')}>↗ <span>Intervention Effectiveness Report</span> →</button><button type="button" onClick={() => onReport('Academic Performance Report')}>◒ <span>Academic Performance Report</span> →</button></div><div className="principal-activity"><p className="dashboard-kicker">Recent Institution Activity</p>{activity.map((item) => <div key={item}><span>•</span>{item}<small>Today</small></div>)}</div></section></div>
}

function PrincipalDepartmentModal({ department, onClose }: { department: (typeof principalDepartments)[number]; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="principal-detail-modal" role="dialog" aria-modal="true" aria-labelledby="principal-department-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="dashboard-kicker">Department drill-down · Demo data</p><h2 id="principal-department-title">{department[0]}</h2></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close department details">×</button></div><div className="principal-detail-grid"><div><span>Students</span><strong>{department[1]}</strong></div><div><span>Attendance</span><strong>{department[2]}</strong></div><div><span>Average marks</span><strong>{department[3]}</strong></div><div><span>At-risk students</span><strong>{department[4]}</strong></div><div><span>Intervention success</span><strong>{department[5]}</strong></div></div><p className="principal-modal-note">Department figures are demo analytics for executive review. Use the department portal for student-level action.</p></section></div>
}

function PrincipalReportModal({ title, onClose }: { title: string; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="principal-report-modal" role="dialog" aria-modal="true" aria-labelledby="principal-report-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="dashboard-kicker">Demo Report</p><h2 id="principal-report-title">{title}</h2></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close report">×</button></div><p>Demo summary for executive review. Backend reporting will be connected later.</p><button type="button" className="assign-primary-button" onClick={onClose}>Close Report</button></section></div>
}

export function StudentDashboard() {
  const [activeSection, setActiveSection] = useState('Dashboard')
  const [riskModalOpen, setRiskModalOpen] = useState(false)
  const [plannedRecommendations, setPlannedRecommendations] = useState<Set<string>>(new Set())
  const [prediction, setPrediction] = useState<StudentRiskPredictionResult | null>(null)
  const [predictionLoading, setPredictionLoading] = useState(true)
  const [predictionError, setPredictionError] = useState<string | null>(null)
  const [academicData, setAcademicData] = useState<StudentAcademicData | null>(null)
  const [studentLoading, setStudentLoading] = useState(true)
  const [studentError, setStudentError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    getStudentAcademicData('DEMO001')
      .then((data) => {
        if (!active) return null
        setAcademicData(data)
        setStudentError(null)
        const studentInput: StudentRiskPredictionRequest = {
          attendance_percentage: data.attendance_percentage,
          average_marks_percentage: data.average_marks_percentage,
          assignment_completion_percentage: data.assignment_completion_percentage,
          recent_performance_trend: data.recent_performance_trend,
        }
        return predictStudentRisk(studentInput)
      })
      .then((result) => {
        if (!result || !active) return
        setPrediction(result)
        setPredictionError(null)
      })
      .catch((error: unknown) => {
        if (!active) return
        if (error instanceof Error && error.message.startsWith('The student service')) {
          setStudentError('Student academic data is temporarily unavailable.')
        } else {
          setPredictionError('Risk prediction is temporarily unavailable. Please try again later.')
        }
      })
      .finally(() => {
        if (!active) return
        setStudentLoading(false)
        setPredictionLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function handleStudentSection(section: string) {
    setActiveSection(section)
    const targetId = section === 'Dashboard' ? 'student-dashboard-top' : section === 'Attendance' ? 'attendance-section' : section === 'Assignments' ? 'assignments-section' : section === 'My Performance' || section === 'Marks' ? 'performance-section' : section === 'AI Recommendations' ? 'recommendations-section' : section === 'Notifications' ? 'notifications-section' : 'student-activity-section'
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function markRecommendation(title: string) {
    setPlannedRecommendations((current) => new Set(current).add(title))
  }

  return (
    <DashboardLayout role="Student" subtitle="Here is your learning progress at a glance." studentName={academicData?.student_name} studentRollNumber={academicData?.roll_number} activeStudentSection={activeSection} onStudentSectionChange={handleStudentSection}>
      <div className="student-dashboard-content" id="student-dashboard-top">
        <StudentSummaryCards academicData={academicData} prediction={prediction} loading={studentLoading || predictionLoading} error={studentError} />
        <RiskAnalysis onViewWhy={() => setRiskModalOpen(true)} prediction={prediction} loading={predictionLoading} error={predictionError} />
        <section id="recommendations-section"><Recommendations prediction={prediction} loading={predictionLoading} error={predictionError} planned={plannedRecommendations} onPlan={markRecommendation} /></section>
        <div className="student-data-grid"><div id="performance-section"><PerformanceChart averageMarks={academicData?.average_marks_percentage ?? null} trend={academicData?.recent_performance_trend ?? null} /></div><AttendanceBreakdown /></div>
        <AssignmentStatus completionPercentage={academicData?.assignment_completion_percentage ?? null} />
        <div id="student-activity-section"><StudentActivity /></div>
        <StudentNotifications />
      </div>
      {riskModalOpen && <RiskWhyModal onClose={() => setRiskModalOpen(false)} prediction={prediction} loading={predictionLoading} />}
    </DashboardLayout>
  )
}

export function FacultyDashboard() {
  const [activeSection, setActiveSection] = useState('Dashboard')
  const [search, setSearch] = useState('')
  const [risk, setRisk] = useState<FacultyRisk | 'All'>('All')
  const [subject, setSubject] = useState('All')
  const [sort, setSort] = useState<'desc' | 'asc'>('desc')
  const [facultyStudents, setFacultyStudents] = useState<FacultyStudent[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<FacultyStudent | null>(null)
  const [interventionsByStudent, setInterventionsByStudent] = useState<Record<string, FacultyIntervention[]>>(initialFacultyInterventions)

  useEffect(() => {
    let active = true

    getStudents()
      .then(async (students: StudentAcademicData[]) => {
        if (!active) return
        const mappedStudents = await Promise.all(students.map(async (student) => {
          try {
            const prediction = await predictStudentRisk({
              attendance_percentage: student.attendance_percentage,
              average_marks_percentage: student.average_marks_percentage,
              assignment_completion_percentage: student.assignment_completion_percentage,
              recent_performance_trend: student.recent_performance_trend,
            })
            return mapFacultyStudent(student, prediction)
          } catch {
            return mapFacultyStudent(student)
          }
        }))
        if (!active) return
        setFacultyStudents(mappedStudents)
        setStudentsError(null)
      })
      .catch(() => {
        if (active) setStudentsError('Unable to load students. Please try again later.')
      })
      .finally(() => {
        if (active) setStudentsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function handleFacultySection(section: string) {
    setActiveSection(section)
    const targetId = section === 'Dashboard' ? 'faculty-dashboard-top' : section === 'My Students' ? 'faculty-students-section' : section === 'At-Risk Students' ? 'faculty-risk-section' : section === 'Interventions' ? 'faculty-interventions-section' : 'faculty-activity-section'
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function addIntervention(intervention: FacultyIntervention) {
    if (!selectedStudent) return
    setInterventionsByStudent((current) => ({ ...current, [selectedStudent.rollNumber]: [...(current[selectedStudent.rollNumber] ?? []), intervention] }))
  }

  function updateInterventionStatus(rollNumber: string, interventionId: string, status: InterventionStatus) {
    setInterventionsByStudent((current) => ({ ...current, [rollNumber]: (current[rollNumber] ?? []).map((item) => item.id === interventionId ? { ...item, status, outcome: status === 'Completed' ? item.outcome ?? 'Improving' : item.outcome } : item) }))
  }

  function saveFollowup(rollNumber: string, interventionId: string, note: string, outcome: FacultyIntervention['outcome']) {
    setInterventionsByStudent((current) => ({ ...current, [rollNumber]: (current[rollNumber] ?? []).map((item) => item.id === interventionId ? { ...item, notes: `${item.notes} Follow-up: ${note}`, outcome } : item) }))
  }

  const filteredStudents = facultyStudents
    .filter((student) => student.name.toLowerCase().includes(search.toLowerCase()) || student.rollNumber.toLowerCase().includes(search.toLowerCase()))
    .filter((student) => risk === 'All' || student.riskLevel === risk)
    .filter((student) => subject === 'All' || student.subject === subject)
    .sort((first, second) => sort === 'desc' ? second.riskScore - first.riskScore : first.riskScore - second.riskScore)
  const allInterventions = Object.values(interventionsByStudent).flat()
  const pendingCount = 7 + allInterventions.filter((item) => item.status !== 'Completed').length
  const completedCount = 5 + allInterventions.filter((item) => item.status === 'Completed').length

  return (
    <DashboardLayout role="Faculty" subtitle="Identify risk early, then turn insight into meaningful student support." activeFacultySection={activeSection} onFacultySectionChange={handleFacultySection}>
      <div className="faculty-dashboard-content" id="faculty-dashboard-top">
        <FacultySummaryCards pending={pendingCount} completed={completedCount} />
        <div className="faculty-intent-banner"><span className="intent-icon">✦</span><div><strong>From insight to action</strong><p>Use student signals to decide what support will make the biggest difference next.</p></div><span className="intent-arrow" aria-hidden="true">→</span></div>
        <div className="faculty-toolbar"><div><p className="dashboard-kicker">Mentor workspace</p><h2>Assigned students</h2></div><FacultyFilters search={search} setSearch={setSearch} risk={risk} setRisk={setRisk} subject={subject} setSubject={setSubject} sort={sort} setSort={setSort} /></div>
        {studentsLoading && <p className="empty-state">Loading students...</p>}
        {studentsError && <p className="empty-state" role="alert">{studentsError}</p>}
        {!studentsLoading && !studentsError && <FacultyRiskTable students={filteredStudents} onSelect={setSelectedStudent} />}
        <div id="faculty-interventions-section" className="faculty-lower-grid"><RiskTrendChart /><FacultyActivity /></div>
      </div>
      {selectedStudent && <FacultyStudentModal student={selectedStudent} status={interventionsByStudent[selectedStudent.rollNumber]?.[0]?.status ?? 'Not Started'} interventions={interventionsByStudent[selectedStudent.rollNumber] ?? []} onClose={() => setSelectedStudent(null)} onAssign={() => undefined} onQuickAction={() => undefined} onAdd={addIntervention} onStatusChange={(id, status) => updateInterventionStatus(selectedStudent.rollNumber, id, status)} onFollowup={(id, note, outcome) => saveFollowup(selectedStudent.rollNumber, id, note, outcome)} />}
    </DashboardLayout>
  )
}

export function HODDashboard() {
  const [activeSection, setActiveSection] = useState('Dashboard')
  const [hodStudents, setHodStudents] = useState<HodStudent[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<HodStudent | null>(null)
  const [report, setReport] = useState<string | null>(null)
  const [filters, setFilters] = useState<HodFilters>(defaultHodFilters)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentSort, setStudentSort] = useState<'desc' | 'asc'>('desc')
  const [classDetails, setClassDetails] = useState<(typeof hodClasses)[number] | null>(null)
  const [subjectDetails, setSubjectDetails] = useState<(typeof hodSubjects)[number] | null>(null)
  const [interventionDetails, setInterventionDetails] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    getStudents()
      .then(async (students: StudentAcademicData[]) => {
        if (!active) return
        const mappedStudents = await Promise.all(students.map(async (student) => {
          try {
            const prediction = await predictStudentRisk({
              attendance_percentage: student.attendance_percentage,
              average_marks_percentage: student.average_marks_percentage,
              assignment_completion_percentage: student.assignment_completion_percentage,
              recent_performance_trend: student.recent_performance_trend,
            })
            return mapHodStudent(student, prediction)
          } catch {
            return mapHodStudent(student)
          }
        }))
        if (!active) return
        setHodStudents(mappedStudents)
        setStudentsError(null)
      })
      .catch(() => {
        if (active) setStudentsError('Unable to load students. Please try again later.')
      })
      .finally(() => {
        if (active) setStudentsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function handleHodSection(section: string) {
    setActiveSection(section)
    const targetId = section === 'Dashboard' ? 'hod-dashboard-top' : section === 'Students' ? 'hod-students-section' : section === 'Faculty' ? 'hod-faculty-section' : section === 'Risk Analytics' ? 'hod-risk-section' : section === 'Interventions' ? 'hod-interventions-section' : section === 'Reports' ? 'hod-reports-section' : 'hod-alerts-section'
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function updateFilter<Key extends keyof HodFilters>(key: Key, value: HodFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function handleAlert(index: number) {
    if (index === 0) updateFilter('risk', 'High')
    if (index === 3) updateFilter('risk', 'High')
    setActiveSection('Students')
    document.getElementById('hod-students-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <DashboardLayout role="HOD" subtitle="A department-wide view of progress, risk, and intervention outcomes." activeHodSection={activeSection} onHodSectionChange={handleHodSection}>
      <div className="hod-dashboard-content" id="hod-dashboard-top">
        <div className="hod-filter-bar"><div><p className="dashboard-kicker">Department filters</p><strong>Explore the current academic picture</strong></div><div className="hod-filter-controls"><select aria-label="Academic year" value={filters.academicYear} onChange={(event) => updateFilter('academicYear', event.target.value as HodFilters['academicYear'])}><option>2025-26</option><option>2026-27</option></select><select aria-label="Class" value={filters.className} onChange={(event) => updateFilter('className', event.target.value)}><option>All Classes</option>{hodClasses.map(([name]) => <option key={name}>{name}</option>)}</select><select aria-label="Subject" value={filters.subject} onChange={(event) => updateFilter('subject', event.target.value)}><option>All Subjects</option>{hodSubjects.map(([name]) => <option key={name}>{name}</option>)}</select><select aria-label="Risk level" value={filters.risk} onChange={(event) => updateFilter('risk', event.target.value as HodFilters['risk'])}><option>All</option><option>High</option><option>Medium</option><option>Low</option></select><button type="button" className="hod-reset-button" onClick={() => { setFilters(defaultHodFilters); setStudentSearch(''); setStudentSort('desc') }}>Reset Filters</button></div></div>
        <HodSummaryCards filters={filters} />
        <div className="hod-intent-banner"><span>✦</span><div><strong>Department clarity for better decisions</strong><p>See where student support is needed, track intervention outcomes, and coordinate action across your department.</p></div></div>
        <div className="hod-analytics-top"><HodRiskDistribution filters={filters} onRiskSelect={(risk) => updateFilter('risk', risk)} /><HodRiskTrend /></div>
        <HodClassAnalysis filters={filters} onSelect={setClassDetails} />
        <HodSubjectPerformance filters={filters} onSelect={setSubjectDetails} />
        <HodInterventionAnalytics onSelect={setInterventionDetails} />
        <HodFacultyPerformance />
        {studentsLoading && <p className="empty-state">Loading students...</p>}
        {studentsError && <p className="empty-state" role="alert">{studentsError}</p>}
        {!studentsLoading && !studentsError && <HodAtRiskOverview students={hodStudents} filters={filters} search={studentSearch} sort={studentSort} onSearchChange={setStudentSearch} onSortChange={setStudentSort} onSelect={setSelectedStudent} />}
        <HodAlertsAndReports onReport={setReport} onAlert={handleAlert} />
      </div>
      {selectedStudent && <HodStudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
      {report && <HodReportModal title={report} onClose={() => setReport(null)} />}
      {classDetails && <HodDrilldownModal title={classDetails[0]} details={[`Students: ${classDetails[1]}`, `Average attendance: ${classDetails[2]}`, `Average marks: ${classDetails[3]}`, `High-risk students: ${classDetails[4]}`, `Medium-risk students: ${classDetails[5]}`, 'Intervention success rate: 70%']} onClose={() => setClassDetails(null)} />}
      {subjectDetails && <HodDrilldownModal title={subjectDetails[0]} details={[`Average marks: ${subjectDetails[1]}`, `Attendance: ${subjectDetails[2]}`, `At-risk students: ${subjectDetails[3]}`, `Performance status: ${Number.parseInt(subjectDetails[1], 10) >= 75 ? 'On track' : 'Needs attention'}`]} onClose={() => setSubjectDetails(null)} />}
      {interventionDetails && <HodDrilldownModal title={interventionDetails} details={['Assigned: 42', 'In Progress: 8', 'Completed: 27', 'Improved: 22', 'Needs Further Support: 5']} onClose={() => setInterventionDetails(null)} />}
    </DashboardLayout>
  )
}

export function PrincipalDashboard() {
  const [activeSection, setActiveSection] = useState('Dashboard')
  const [principalStudents, setPrincipalStudents] = useState<PrincipalStudent[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PrincipalFilters>(defaultPrincipalFilters)
  const [metric, setMetric] = useState<'risk' | 'attendance' | 'success'>('risk')
  const [departmentDetails, setDepartmentDetails] = useState<(typeof principalDepartments)[number] | null>(null)
  const [report, setReport] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    getStudents()
      .then(async (students: StudentAcademicData[]) => {
        if (!active) return
        const mappedStudents = await Promise.all(students.map(async (student) => {
          try {
            const prediction = await predictStudentRisk({
              attendance_percentage: student.attendance_percentage,
              average_marks_percentage: student.average_marks_percentage,
              assignment_completion_percentage: student.assignment_completion_percentage,
              recent_performance_trend: student.recent_performance_trend,
            })
            return mapPrincipalStudent(student, prediction)
          } catch {
            return mapPrincipalStudent(student)
          }
        }))
        if (!active) return
        setPrincipalStudents(mappedStudents)
        setStudentsError(null)
      })
      .catch(() => {
        if (active) setStudentsError('Unable to load students. Please try again later.')
      })
      .finally(() => {
        if (active) setStudentsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function updateFilter<Key extends keyof PrincipalFilters>(key: Key, value: PrincipalFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function handleSection(section: string) {
    setActiveSection(section)
    const ids: Record<string, string> = { Dashboard: 'principal-dashboard-top', Departments: 'principal-departments-section', 'Academic Analytics': 'principal-analytics-section', 'Risk Analytics': 'principal-risk-section', Interventions: 'principal-interventions-section', Reports: 'principal-reports-section', Notifications: 'principal-alerts-section', Settings: 'principal-health-section' }
    document.getElementById(ids[section])?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return <DashboardLayout role="Principal" subtitle="Institution-level visibility into academic risk, intervention activity and outcomes." activePrincipalSection={activeSection} onPrincipalSectionChange={handleSection}>
    <div className="principal-dashboard-content" id="principal-dashboard-top">
      <PrincipalFilters filters={filters} onChange={updateFilter} onReset={() => setFilters(defaultPrincipalFilters)} />
      <PrincipalSummary filters={filters} />
      <div className="principal-analytics-grid"><PrincipalRiskDistribution filters={filters} onSelect={(risk) => updateFilter('risk', risk)} /><PrincipalTrend /></div>
      <PrincipalDepartmentTable filters={filters} onSelect={setDepartmentDetails} />
      {studentsLoading && <p className="empty-state">Loading students...</p>}
      {studentsError && <p className="empty-state" role="alert">{studentsError}</p>}
      {!studentsLoading && !studentsError && <PrincipalStudentOverview students={principalStudents} filters={filters} />}
      <PrincipalComparison metric={metric} onMetricChange={setMetric} />
      <PrincipalInterventions />
      <PrincipalHealth />
      <PrincipalAlertsAndActivity onReport={setReport} />
    </div>
    {departmentDetails && <PrincipalDepartmentModal department={departmentDetails} onClose={() => setDepartmentDetails(null)} />}
    {report && <PrincipalReportModal title={report} onClose={() => setReport(null)} />}
  </DashboardLayout>
}
