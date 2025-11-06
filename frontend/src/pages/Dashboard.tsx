import { useState, useEffect } from 'react';
import { dashboardApi, logsApi, LogEvent, DashboardStats } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

const COLORS = ['#1B998B', '#65A637', '#2d8659', '#1a5d3f', '#0d3d2a', '#4a9d7f'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    source_ip: '',
    username: '',
    event_type: '',
    start_time: '',
    end_time: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, logsData] = await Promise.all([
        dashboardApi.getStats(),
        logsApi.getAll({ limit: 50 }),
      ]);
      setStats(statsData);
      setLogs(logsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const filteredLogs = await logsApi.getAll({ ...filters, limit: 50 });
      setLogs(filteredLogs);
    } catch (error) {
      console.error('Error filtering logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const eventTypeData = stats
    ? Object.entries(stats.event_types).map(([name, value]) => ({ name, value }))
    : [];

  const dailyLogData = stats
    ? Object.entries(stats.daily_log_counts)
        .map(([date, count]) => ({ date: new Date(date).toLocaleDateString(), count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Security Dashboard</h1>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total_logs}</div>
            <div className="stat-label">Total Logs</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_alerts}</div>
            <div className="stat-label">Total Alerts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.suppressed_alerts}</div>
            <div className="stat-label">Suppressed Alerts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {stats.total_alerts > 0
                ? Math.round((stats.suppressed_alerts / stats.total_alerts) * 100)
                : 0}%
            </div>
            <div className="stat-label">Suppression Rate</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <h2 className="card-title">Event Types Distribution</h2>
          {eventTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={eventTypeData}
                  cx="50%"
                  cy="45%"
                  labelLine={true}
                  label={({ name, percent, value }) => {
                    // Only show label if slice is large enough (>3%) or show in legend
                    if (percent > 0.03) {
                      return `${name}: ${(percent * 100).toFixed(1)}%`;
                    }
                    return null; // Small slices won't have inline labels
                  }}
                  outerRadius={100}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {eventTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161b22',
                    border: '1px solid #30363d',
                    color: '#c9d1d9',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} events`,
                    name
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={80}
                  formatter={(value, entry: any) => {
                    const total = eventTypeData.reduce((sum, item) => sum + item.value, 0);
                    const item = eventTypeData.find(e => e.name === value);
                    const percent = item ? ((item.value / total) * 100).toFixed(1) : '0';
                    return `${value} (${percent}%)`;
                  }}
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '0.875rem',
                    color: '#c9d1d9'
                  }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#8b949e' }}>No data available</p>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Daily Log Counts (Last 7 Days)</h2>
          {dailyLogData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyLogData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis dataKey="date" stroke="#8b949e" />
                <YAxis stroke="#8b949e" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161b22',
                    border: '1px solid #30363d',
                    color: '#c9d1d9',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#1B998B" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#8b949e' }}>No data available</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Recent Logs</h2>
        
        <div className="filters">
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
            <label>Event Type</label>
            <input
              type="text"
              value={filters.event_type}
              onChange={(e) => handleFilterChange('event_type', e.target.value)}
              placeholder="Filter by event type"
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

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>Source IP</th>
                <th>Username</th>
                <th>Action</th>
                <th>Status</th>
                <th>Geo Location</th>
                <th>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.event_type}</td>
                    <td>{log.source_ip || '-'}</td>
                    <td>{log.username || '-'}</td>
                    <td>{log.action || '-'}</td>
                    <td>{log.status || '-'}</td>
                    <td>{log.geo_location || '-'}</td>
                    <td>{log.user_risk_score.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#8b949e' }}>
                    No logs found
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

