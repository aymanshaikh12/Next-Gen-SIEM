import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

export interface LogEvent {
  id: number;
  timestamp: string;
  event_type: string;
  source_ip?: string;
  destination_ip?: string;
  username?: string;
  action?: string;
  status?: string;
  geo_location?: string;
  user_risk_score: number;
  asset_criticality: number;
}

export interface Alert {
  id: number;
  timestamp: string;
  event_type: string;
  severity: string;
  mitre_technique_id?: string;
  description: string;
  source_ip?: string;
  username?: string;
  log_event_id?: number;
  ai_score: number;
  is_suppressed: boolean;
  suppression_reason?: string;
  ai_feedback?: string;
  ai_feedback_at?: string;
  ai_classification?: string;
}

export interface DashboardStats {
  total_logs: number;
  total_alerts: number;
  suppressed_alerts: number;
  event_types: Record<string, number>;
  daily_log_counts: Record<string, number>;
}

export interface LogFilters {
  source_ip?: string;
  username?: string;
  event_type?: string;
  start_time?: string;
  end_time?: string;
  skip?: number;
  limit?: number;
}

export interface AlertFilters {
  severity?: string;
  is_suppressed?: boolean;
  source_ip?: string;
  username?: string;
  start_time?: string;
  end_time?: string;
  skip?: number;
  limit?: number;
}

// Logs API
export const logsApi = {
  ingest: async (logData: any): Promise<LogEvent> => {
    const response = await api.post('/api/logs/ingest', logData);
    return response.data;
  },
  
  upload: async (file: File): Promise<LogEvent[]> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/logs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 second timeout for file uploads
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      },
    });
    return response.data;
  },
  
  getAll: async (filters?: LogFilters): Promise<LogEvent[]> => {
    const response = await api.get('/api/logs', { params: filters });
    return response.data;
  },
};

// Alerts API
export const alertsApi = {
  getAll: async (filters?: AlertFilters): Promise<Alert[]> => {
    const response = await api.get('/api/alerts', { params: filters });
    return response.data;
  },
  
  submitFeedback: async (alertId: number, feedback: string): Promise<void> => {
    await api.post(`/api/alerts/${alertId}/feedback`, { feedback });
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  },
};

// SOAR API
export const soarApi = {
  execute: async (actionType: string, target: string, reason?: string): Promise<any> => {
    const response = await api.post('/api/soar/execute', {
      action_type: actionType,
      target,
      reason,
    });
    return response.data;
  },
};

export default api;

