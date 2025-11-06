import { useState, useEffect } from 'react';
import { alertsApi, Alert } from '../services/api';

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: '',
    is_suppressed: '',
    source_ip: '',
    username: '',
    start_time: '',
    end_time: '',
  });
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const filterParams: any = { limit: 100 };
      if (filters.severity) filterParams.severity = filters.severity;
      if (filters.is_suppressed !== '') filterParams.is_suppressed = filters.is_suppressed === 'true';
      if (filters.source_ip) filterParams.source_ip = filters.source_ip;
      if (filters.username) filterParams.username = filters.username;
      if (filters.start_time) filterParams.start_time = filters.start_time;
      if (filters.end_time) filterParams.end_time = filters.end_time;

      const data = await alertsApi.getAll(filterParams);
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const applyFilters = () => {
    loadAlerts();
  };

  const handleFeedback = async (alertId: number, feedback: 'true_positive' | 'false_positive') => {
    try {
      await alertsApi.submitFeedback(alertId, feedback);
      setFeedbackMessage({ type: 'success', text: 'Feedback submitted successfully' });
      setTimeout(() => setFeedbackMessage(null), 3000);
      loadAlerts();
    } catch (error) {
      setFeedbackMessage({ type: 'error', text: 'Failed to submit feedback' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const className = `badge badge-${severity.toLowerCase()}`;
    return <span className={className}>{severity.toUpperCase()}</span>;
  };

  const getAIScoreColor = (score: number) => {
    if (score >= 70) return '#f44336'; // Red for high risk
    if (score >= 40) return '#ff9800'; // Orange for medium risk
    return '#4caf50'; // Green for low risk
  };

  if (loading && alerts.length === 0) {
    return <div className="loading">Loading alerts...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Security Alerts</h1>

      {feedbackMessage && (
        <div className={feedbackMessage.type === 'success' ? 'success' : 'error'}>
          {feedbackMessage.text}
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Alert Filters</h2>
        <div className="filters">
          <div className="input-group">
            <label>Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
            >
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="input-group">
            <label>Suppression Status</label>
            <select
              value={filters.is_suppressed}
              onChange={(e) => handleFilterChange('is_suppressed', e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Suppressed</option>
              <option value="false">Active</option>
            </select>
          </div>
          <div className="input-group">
            <label>Source IP</label>
            <input
              type="text"
              value={filters.source_ip}
              onChange={(e) => handleFilterChange('source_ip', e.target.value)}
              placeholder="Filter by IP"
            />
          </div>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={filters.username}
              onChange={(e) => handleFilterChange('username', e.target.value)}
              placeholder="Filter by username"
            />
          </div>
          <div className="input-group">
            <label>Start Time</label>
            <input
              type="datetime-local"
              value={filters.start_time}
              onChange={(e) => handleFilterChange('start_time', e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>End Time</label>
            <input
              type="datetime-local"
              value={filters.end_time}
              onChange={(e) => handleFilterChange('end_time', e.target.value)}
            />
          </div>
          <div className="input-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={applyFilters}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Alert List</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>Severity</th>
                <th>AI Score</th>
                <th>MITRE Technique</th>
                <th>AI Classification</th>
                <th>Source IP</th>
                <th>Username</th>
                <th>Suppressed</th>
                <th>Description</th>
                <th>Feedback</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>{new Date(alert.timestamp).toLocaleString()}</td>
                    <td>{alert.event_type}</td>
                    <td>{getSeverityBadge(alert.severity)}</td>
                    <td>
                      <span
                        style={{
                          color: getAIScoreColor(alert.ai_score),
                          fontWeight: 'bold',
                        }}
                      >
                        {alert.ai_score.toFixed(1)}
                      </span>
                    </td>
                    <td>{alert.mitre_technique_id || '-'}</td>
                    <td>{alert.ai_classification || '-'}</td>
                    <td>{alert.source_ip || '-'}</td>
                    <td>{alert.username || '-'}</td>
                    <td>
                      {alert.is_suppressed ? (
                        <span className="badge badge-suppressed">Suppressed</span>
                      ) : (
                        <span style={{ color: '#4caf50' }}>Active</span>
                      )}
                      {alert.suppression_reason && (
                        <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>
                          {alert.suppression_reason}
                        </div>
                      )}
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {alert.description}
                    </td>
                    <td>
                      {alert.ai_feedback ? (
                        <span
                          className={
                            alert.ai_feedback === 'true_positive'
                              ? 'badge badge-high'
                              : 'badge badge-low'
                          }
                        >
                          {alert.ai_feedback === 'true_positive' ? 'TP' : 'FP'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {!alert.ai_feedback && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                          <button
                            className="btn btn-success"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            onClick={() => handleFeedback(alert.id, 'true_positive')}
                          >
                            TP
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            onClick={() => handleFeedback(alert.id, 'false_positive')}
                          >
                            FP
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', color: '#8b949e' }}>
                    No alerts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

