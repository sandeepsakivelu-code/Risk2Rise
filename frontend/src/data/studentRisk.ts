export type RecentPerformanceTrend = 'Improving' | 'Stable' | 'Declining'
export type RiskLevel = 'Low' | 'Medium' | 'High'

export interface StudentRiskData {
  studentId: string
  studentName: string
  rollNumber: string
  department: string
  className: string
  attendancePercentage: number
  averageMarksPercentage: number
  assignmentCompletionPercentage: number
  recentPerformanceTrend: RecentPerformanceTrend
  previousRiskScore: number
  currentRiskScore: number
  riskLevel: RiskLevel
  primaryRiskFactors: string[]
}

const trendRiskValues: Record<RecentPerformanceTrend, number> = {
  Improving: 0,
  Stable: 50,
  Declining: 100,
}

function clampPercentage(value: number): number {
  return Math.min(100, Math.max(0, value))
}

/**
 * DEMO RISK CALCULATION — WILL BE REPLACED BY ML MODEL
 *
 * The score is intentionally transparent: lower academic inputs increase
 * risk, while a declining performance trend adds the strongest trend signal.
 */
export function calculateDemoRiskScore(studentData: StudentRiskData): number {
  const attendanceRisk = 100 - clampPercentage(studentData.attendancePercentage)
  const marksRisk = 100 - clampPercentage(studentData.averageMarksPercentage)
  const assignmentRisk = 100 - clampPercentage(studentData.assignmentCompletionPercentage)
  const trendRisk = trendRiskValues[studentData.recentPerformanceTrend]

  const score =
    attendanceRisk * 0.3 +
    marksRisk * 0.35 +
    assignmentRisk * 0.2 +
    trendRisk * 0.15

  return Math.round(Math.min(100, Math.max(0, score)))
}

export function getRiskLevel(score: number): RiskLevel {
  const normalizedScore = Math.min(100, Math.max(0, score))

  if (normalizedScore >= 70) return 'High'
  if (normalizedScore >= 40) return 'Medium'
  return 'Low'
}

export function getRiskFactors(studentData: StudentRiskData): string[] {
  const factors: string[] = []

  if (studentData.attendancePercentage < 60) {
    factors.push('Low attendance')
  } else if (studentData.attendancePercentage < 75) {
    factors.push('Attendance below target')
  }

  if (studentData.averageMarksPercentage < 50) {
    factors.push('Low average marks')
  } else if (studentData.averageMarksPercentage < 65) {
    factors.push('Recent marks below target')
  }

  if (studentData.assignmentCompletionPercentage < 60) {
    factors.push('Multiple incomplete assignments')
  } else if (studentData.assignmentCompletionPercentage < 80) {
    factors.push('Incomplete assignments')
  }

  if (studentData.recentPerformanceTrend === 'Declining') {
    factors.push('Recent performance decline')
  } else if (studentData.recentPerformanceTrend === 'Improving') {
    factors.push('Performance is improving')
  }

  return factors.length > 0 ? factors : ['No immediate concerns']
}

function createDemoStudent(
  student: Omit<StudentRiskData, 'currentRiskScore' | 'riskLevel' | 'primaryRiskFactors'>,
): StudentRiskData {
  const currentRiskScore = calculateDemoRiskScore({
    ...student,
    currentRiskScore: 0,
    riskLevel: 'Low',
    primaryRiskFactors: [],
  })

  return {
    ...student,
    currentRiskScore,
    riskLevel: getRiskLevel(currentRiskScore),
    primaryRiskFactors: getRiskFactors(student as StudentRiskData),
  }
}

export const demoStudentRiskData: StudentRiskData[] = [
  createDemoStudent({ studentId: 'STU-001', studentName: 'Rahul Kumar', rollNumber: '23CS101', department: 'Computer Science & Information Technology', className: '3-1 CSIT', attendancePercentage: 56, averageMarksPercentage: 38, assignmentCompletionPercentage: 40, recentPerformanceTrend: 'Declining', previousRiskScore: 78 }),
  createDemoStudent({ studentId: 'STU-002', studentName: 'Anjali Reddy', rollNumber: '23CS102', department: 'Computer Science & Information Technology', className: '3-1 CSIT', attendancePercentage: 72, averageMarksPercentage: 58, assignmentCompletionPercentage: 70, recentPerformanceTrend: 'Stable', previousRiskScore: 59 }),
  createDemoStudent({ studentId: 'STU-003', studentName: 'Kiran Mehta', rollNumber: '23CS108', department: 'Computer Science & Information Technology', className: '3-2 CSIT', attendancePercentage: 64, averageMarksPercentage: 46, assignmentCompletionPercentage: 60, recentPerformanceTrend: 'Declining', previousRiskScore: 69 }),
  createDemoStudent({ studentId: 'STU-004', studentName: 'Sneha Iyer', rollNumber: '23CS115', department: 'Computer Science & Information Technology', className: '3-3 CSIT', attendancePercentage: 81, averageMarksPercentage: 69, assignmentCompletionPercentage: 80, recentPerformanceTrend: 'Improving', previousRiskScore: 48 }),
  createDemoStudent({ studentId: 'STU-005', studentName: 'Arjun Nair', rollNumber: '23CS121', department: 'Computer Science & Engineering', className: '3-1 CSE', attendancePercentage: 91, averageMarksPercentage: 84, assignmentCompletionPercentage: 100, recentPerformanceTrend: 'Stable', previousRiskScore: 24 }),
  createDemoStudent({ studentId: 'STU-006', studentName: 'Meera Shah', rollNumber: '23CS128', department: 'Computer Science & Engineering', className: '3-2 CSE', attendancePercentage: 76, averageMarksPercentage: 62, assignmentCompletionPercentage: 70, recentPerformanceTrend: 'Stable', previousRiskScore: 51 }),
  createDemoStudent({ studentId: 'STU-007', studentName: 'Vikram Singh', rollNumber: '23CS134', department: 'Computer Science & Engineering', className: '2-2 CSE', attendancePercentage: 49, averageMarksPercentage: 41, assignmentCompletionPercentage: 30, recentPerformanceTrend: 'Declining', previousRiskScore: 89 }),
  createDemoStudent({ studentId: 'STU-008', studentName: 'Divya Menon', rollNumber: '23CS141', department: 'Electronics & Communication Engineering', className: '3-1 ECE', attendancePercentage: 88, averageMarksPercentage: 73, assignmentCompletionPercentage: 90, recentPerformanceTrend: 'Improving', previousRiskScore: 31 }),
  createDemoStudent({ studentId: 'STU-009', studentName: 'Aditya Rao', rollNumber: '23CS146', department: 'Electrical & Electronics Engineering', className: '2-1 EEE', attendancePercentage: 70, averageMarksPercentage: 55, assignmentCompletionPercentage: 60, recentPerformanceTrend: 'Declining', previousRiskScore: 62 }),
  createDemoStudent({ studentId: 'STU-010', studentName: 'Pooja Nair', rollNumber: '23CS153', department: 'Mechanical Engineering', className: '2-2 ME', attendancePercentage: 84, averageMarksPercentage: 77, assignmentCompletionPercentage: 90, recentPerformanceTrend: 'Improving', previousRiskScore: 29 }),
]
