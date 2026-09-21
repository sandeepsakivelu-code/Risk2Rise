export type RecentPerformanceTrend = 'Improving' | 'Stable' | 'Declining'
export type RiskLevel = 'Low' | 'Medium' | 'High'

export interface StudentRiskPredictionRequest {
  attendance_percentage: number
  average_marks_percentage: number
  assignment_completion_percentage: number
  recent_performance_trend: RecentPerformanceTrend
}

export interface StudentAcademicData {
  student_id: string
  student_name: string
  roll_number: string
  department: string
  class_name: string
  attendance_percentage: number
  average_marks_percentage: number
  assignment_completion_percentage: number
  recent_performance_trend: RecentPerformanceTrend
}

export interface StudentRiskPrediction {
  risk_level: RiskLevel
  confidence?: number
}

export interface RiskFactor {
  factor: string
  value: number | string
  message: string
}

export interface RiskExplanation {
  summary: string
  risk_factors: RiskFactor[]
}

export type RecommendationPriority = 'Low' | 'Medium' | 'High'

export interface RiskRecommendation {
  category: string
  priority: RecommendationPriority
  title: string
  action: string
}

export interface RiskRecommendations {
  risk_level: RiskLevel
  recommendations: RiskRecommendation[]
}

export interface StudentRiskPredictionResult extends StudentRiskPrediction {
  explanation: RiskExplanation
  recommendations: RiskRecommendations
}

interface StudentRiskPredictionResponse {
  success: boolean
  prediction?: StudentRiskPrediction
  explanation?: RiskExplanation
  recommendations?: RiskRecommendations
  error?: string
}

const RISK_API_URL = import.meta.env.VITE_RISK_API_URL ?? '/api/predict-risk/'
const STUDENT_API_URL = import.meta.env.VITE_STUDENT_API_URL ?? '/api/students/'

export async function getStudentAcademicData(studentId: string): Promise<StudentAcademicData> {
  const response = await fetch(`${STUDENT_API_URL}${encodeURIComponent(studentId)}/`)

  let responseData: StudentAcademicData | { error?: string }
  try {
    responseData = await response.json() as StudentAcademicData | { error?: string }
  } catch {
    throw new Error('The student service returned an unreadable response.')
  }

  if (!response.ok || !('student_id' in responseData)) {
    const errorMessage = 'error' in responseData && responseData.error ? responseData.error : 'The student service could not load academic data.'
    throw new Error(errorMessage)
  }

  return responseData
}

export async function predictStudentRisk(
  request: StudentRiskPredictionRequest,
): Promise<StudentRiskPredictionResult> {
  const response = await fetch(RISK_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  let responseData: StudentRiskPredictionResponse
  try {
    responseData = await response.json() as StudentRiskPredictionResponse
  } catch {
    throw new Error('The prediction service returned an unreadable response.')
  }

  if (!response.ok || !responseData.success || !responseData.prediction || !responseData.explanation || !responseData.recommendations) {
    throw new Error(responseData.error ?? 'The prediction service could not calculate risk.')
  }

  return {
    ...responseData.prediction,
    explanation: responseData.explanation,
    recommendations: responseData.recommendations,
  }
}
export async function getStudents() {
  const response = await fetch("/api/students/");

  if (!response.ok) {
    throw new Error("Failed to fetch students");
  }

  return response.json();
}
export type Intervention = {
  id: number
  student: number
  intervention_type: string
  assigned_date: string
  follow_up_date: string
  faculty: number | null
  status: 'Not Started' | 'Assigned' | 'In Progress' | 'Completed'
  notes: string
  priority: 'High' | 'Medium' | 'Low'
  outcome?: 'Improving' | 'No Significant Change' | 'Needs Further Support' | null
}

export async function getInterventions(studentId?: string): Promise<Intervention[]> {
  const url = studentId
    ? `/api/interventions/?student_id=${studentId}`
    : '/api/interventions/'

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch interventions')
  }

  return response.json()
}

export async function createIntervention(
  intervention: Omit<Intervention, 'id'>
): Promise<Intervention> {
  const response = await fetch('/api/interventions/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(intervention),
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new Error('Failed to create intervention')
  }

  return data.intervention
}