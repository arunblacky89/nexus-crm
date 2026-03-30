export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: 'super_admin' | 'admin' | 'manager' | 'sales_rep' | 'viewer'
  team: number | null
  team_name: string | null
  phone: string
  avatar: string | null
  avatar_url: string | null
  timezone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
  color: string
}

export interface Lead {
  id: number
  uuid: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
  mobile: string
  company_name: string
  job_title: string
  website: string
  lead_source: string
  status: 'New' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Lost' | 'Converted'
  priority: 'Low' | 'Medium' | 'High'
  assigned_to: number | null
  assigned_to_name: string | null
  tags: number[]
  tags_detail: Tag[]
  lead_score: number
  city: string
  state: string
  country: string
  description: string
  notes: string
  converted: boolean
  converted_at: string | null
  created_at: string
  updated_at: string
}

export interface Contact {
  id: number
  uuid: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
  mobile: string
  whatsapp: string
  job_title: string
  department: string
  company: number | null
  company_detail: { id: number; uuid: string; name: string; industry: string; city: string; country: string } | null
  assigned_to: number | null
  assigned_to_name: string | null
  tags: number[]
  tags_detail: Tag[]
  linkedin_url: string
  twitter_url: string
  date_of_birth: string | null
  street: string
  city: string
  state: string
  zip_code: string
  country: string
  avatar: string | null
  do_not_contact: boolean
  deal_count: number
  created_at: string
  updated_at: string
}

export interface Company {
  id: number
  uuid: string
  name: string
  website: string
  phone: string
  email: string
  industry: string
  company_size: string
  annual_revenue: number | null
  assigned_to: number | null
  assigned_to_name: string | null
  street: string
  city: string
  state: string
  zip_code: string
  country: string
  logo: string | null
  linkedin_url: string
  twitter_url: string
  description: string
  contact_count: number
  deal_count: number
  created_at: string
  updated_at: string
}

export interface PipelineStage {
  id: number
  pipeline: number
  name: string
  order: number
  probability: number
  color: string
  deal_count: number
  deal_value: number
}

export interface Pipeline {
  id: number
  name: string
  is_default: boolean
  stages: PipelineStage[]
}

export interface Deal {
  id: number
  uuid: string
  title: string
  amount: number
  currency: string
  pipeline: number | null
  pipeline_name: string | null
  stage: number | null
  stage_name: string | null
  stage_color: string | null
  stage_probability: number | null
  contact: number | null
  contact_name: string | null
  company: number | null
  company_name: string | null
  assigned_to: number | null
  assigned_to_name: string | null
  expected_close_date: string | null
  actual_close_date: string | null
  deal_type: string
  status: 'Open' | 'Won' | 'Lost' | 'On Hold'
  lost_reason: string
  tags: number[]
  tags_detail: Tag[]
  description: string
  stage_history: DealStageHistory[]
  created_at: string
  updated_at: string
}

export interface DealStageHistory {
  id: number
  from_stage: number | null
  from_stage_name: string | null
  to_stage: number | null
  to_stage_name: string | null
  changed_by: number | null
  changed_by_name: string | null
  changed_at: string
}

export interface Activity {
  id: number
  uuid: string
  activity_type: 'Call' | 'Meeting' | 'Task' | 'Note' | 'Email'
  title: string
  description: string
  due_date: string | null
  completed: boolean
  completed_at: string | null
  priority: 'Low' | 'Medium' | 'High'
  assigned_to: number | null
  assigned_to_name: string | null
  related_lead: number | null
  related_lead_name: string | null
  related_contact: number | null
  related_contact_name: string | null
  related_deal: number | null
  related_deal_name: string | null
  related_company: number | null
  related_company_name: string | null
  call_direction: string
  call_duration_minutes: number | null
  call_result: string
  location: string
  meeting_link: string
  meeting_type: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: number
  title: string
  message: string
  notification_type: string
  object_id: number | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface EmailTemplate {
  id: number
  name: string
  subject: string
  body: string
  category: string
  created_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface DashboardStats {
  total_leads: number
  leads_this_month: number
  leads_last_month: number
  leads_converted: number
  total_contacts: number
  total_companies: number
  total_deals: number
  deals_won_this_month: { count: number; value: number }
  deals_lost_this_month: { count: number; value: number }
  open_deals_value: number
  activities_due_today: number
  overdue_activities: number
  pipeline_by_stage: Array<{ stage: string; color: string; count: number; value: number }>
  recent_activities: Activity[]
  top_performers: Array<{ user_id: number; name: string; deals_won: number; revenue: number }>
  lead_sources: Array<{ lead_source: string; count: number }>
}
