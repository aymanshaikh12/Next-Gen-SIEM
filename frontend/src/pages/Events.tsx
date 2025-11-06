import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logsApi, LogEvent } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

export default function Events() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [timeRange, setTimeRange] = useState('1h');
  const [filters, setFilters] = useState({
    user: '',
    src_ip: '',
    event_type: '',
  });
  const [ingestData, setIngestData] = useState({
    server: 'server',
    format: 'json',
    logContent: JSON.stringify({
      "@timestamp": new Date().toISOString(),
      "src_ip": "1.2.3.4",
      "dst_ip": "10.0.0.10",
      "user": "alice",
      "event_type": "failed_login"
    }, null, 2)
  });
  const [eventVolume, setEventVolume] = useState<any[]>([]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      
      // Apply time range
      if (timeRange !== 'all') {
        const now = new Date();
        let startTime: Date;
        if (timeRange === '1h') {
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
        } else if (timeRange === '24h') {
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        } else if (timeRange === '7d') {
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
          startTime = new Date(0);
        }
        params.start_time = startTime.toISOString();
      }
      
      if (filters.user) params.username = filters.user;
      if (filters.src_ip) params.source_ip = filters.src_ip;
      if (filters.event_type) params.event_type = filters.event_type;
      
      const data = await logsApi.getAll(params);
      setLogs(data);
      
      // Calculate event volume for chart
      const volumeMap = new Map<string, number>();
      data.forEach(log => {
        const date = new Date(log.timestamp).toLocaleDateString();
        volumeMap.set(date, (volumeMap.get(date) || 0) + 1);
      });
      setEventVolume(Array.from(volumeMap.entries()).map(([date, count]) => ({ date, count })));
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 30000);
    return () => clearInterval(interval);
  }, [timeRange, filters]);

  const handleIngest = async () => {
    try {
      setLoading(true);
      let logData: any;
      
      if (ingestData.format === 'json') {
        logData = JSON.parse(ingestData.logContent);
      } else {
        // Handle other formats if needed
        logData = JSON.parse(ingestData.logContent);
      }
      
      // Send raw JSON directly
      await axios.post('http://localhost:8000/api/logs/ingest', logData);
      setIngestData({
        ...ingestData,
        logContent: JSON.stringify({
          "@timestamp": new Date().toISOString(),
          "src_ip": "1.2.3.4",
          "dst_ip": "10.0.0.10",
          "user": "alice",
          "event_type": "failed_login"
        }, null, 2)
      });
      loadLogs();
    } catch (error: any) {
      alert('Error ingesting log: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      log.event_type?.toLowerCase().includes(keyword) ||
      log.source_ip?.toLowerCase().includes(keyword) ||
      log.username?.toLowerCase().includes(keyword) ||
      log.action?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
      {/* Left Sidebar */}
      <div style={{ 
        width: '300px', 
        backgroundColor: '#161b22', 
        borderRight: '1px solid #30363d',
        padding: '1.5rem',
        overflowY: 'auto'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#1B998B', marginBottom: '1rem', fontSize: '0.875rem', textTransform: 'uppercase' }}>Navigation</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button onClick={() => navigate('/')} style={{ padding: '0.5rem', color: '#c9d1d9', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>Events</button>
            <button onClick={() => navigate('/alerts')} style={{ padding: '0.5rem', color: '#c9d1d9', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>Alerts</button>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem', color: '#c9d1d9', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>Dashboard</button>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#1B998B', marginBottom: '1rem', fontSize: '0.875rem', textTransform: 'uppercase' }}>Filters</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b949e', fontSize: '0.875rem' }}>User contains</label>
              <input
                type="text"
                value={filters.user}
                onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#c9d1d9' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b949e', fontSize: '0.875rem' }}>Src IP contains</label>
              <input
                type="text"
                value={filters.src_ip}
                onChange={(e) => setFilters({ ...filters, src_ip: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#c9d1d9' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b949e', fontSize: '0.875rem' }}>Event type contains</label>
              <input
                type="text"
                value={filters.event_type}
                onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#c9d1d9' }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#1B998B', marginBottom: '1rem', fontSize: '0.875rem', textTransform: 'uppercase' }}>Bulk Upload</h3>
          <input
            type="file"
            accept=".json,.ndjson,.csv,.cef,.log,.syslog"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  setLoading(true);
                  const result = await logsApi.upload(file);
                  alert(`Successfully uploaded ${result.length} log(s)`);
                  loadLogs();
                  // Reset file input
                  e.target.value = '';
                } catch (error: any) {
                  let errorMessage = 'Error uploading file';
                  if (error.code === 'ECONNABORTED') {
                    errorMessage = 'Upload timeout - file may be too large or server is not responding';
                  } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                    errorMessage = 'Cannot connect to server. Please ensure the backend is running on http://localhost:8000';
                  } else if (error.response?.data?.detail) {
                    errorMessage = error.response.data.detail;
                  } else if (error.message) {
                    errorMessage = error.message;
                  }
                  alert(`Error uploading file: ${errorMessage}`);
                  console.error('Upload error details:', {
                    message: error.message,
                    code: error.code,
                    response: error.response?.data,
                    status: error.response?.status,
                  });
                } finally {
                  setLoading(false);
                }
              }
            }}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            style={{
              display: 'block',
              padding: '0.5rem 1rem',
              backgroundColor: '#1B998B',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: '0.875rem'
            }}
          >
            Choose file
          </label>
          <span style={{ display: 'block', marginTop: '0.5rem', color: '#8b949e', fontSize: '0.875rem' }}>No file chosen</span>
        </div>

        <div>
          <h3 style={{ color: '#1B998B', marginBottom: '1rem', fontSize: '0.875rem', textTransform: 'uppercase' }}>SOAR Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <input
                type="text"
                placeholder="IP to block"
                style={{ width: '100%', padding: '0.5rem', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#c9d1d9', marginBottom: '0.5rem' }}
              />
              <button
                onClick={async () => {
                  const ip = (document.querySelector('input[placeholder="IP to block"]') as HTMLInputElement)?.value;
                  if (ip) {
                    try {
                      await axios.post('http://localhost:8000/api/soar/execute', {
                        action_type: 'block_ip',
                        target: ip
                      });
                      alert(`IP ${ip} blocked`);
                    } catch (error) {
                      alert('Error blocking IP');
                    }
                  }
                }}
                style={{ width: '100%', padding: '0.5rem', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Block IP
              </button>
            </div>
            <div>
              <input
                type="text"
                placeholder="User to disable"
                style={{ width: '100%', padding: '0.5rem', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#c9d1d9', marginBottom: '0.5rem' }}
              />
              <button
                onClick={async () => {
                  const user = (document.querySelector('input[placeholder="User to disable"]') as HTMLInputElement)?.value;
                  if (user) {
                    try {
                      await axios.post('http://localhost:8000/api/soar/execute', {
                        action_type: 'disable_account',
                        target: user
                      });
                      alert(`User ${user} disabled`);
                    } catch (error) {
                      alert('Error disabling user');
                    }
                  }
                }}
                style={{ width: '100%', padding: '0.5rem', backgroundColor: '#f57c00', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Disable Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        {/* Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <h1 style={{ color: '#1B998B', margin: 0 }}>Sec Force</h1>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem', backgroundColor: '#1B998B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Events</button>
              <button onClick={() => navigate('/alerts')} style={{ padding: '0.5rem 1rem', color: '#c9d1d9', background: 'none', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Alerts</button>
              <button onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem 1rem', color: '#c9d1d9', background: 'none', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Dashboard</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search events (keyword)"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ padding: '0.5rem', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#c9d1d9', width: '250px' }}
            />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{ padding: '0.5rem', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#c9d1d9' }}
            >
              <option value="1h">Last 1h</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7d</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={loadLogs}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#1B998B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Ingest Log Section */}
        <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#1B998B', marginBottom: '1rem' }}>Ingest Log</h2>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              value={ingestData.server}
              onChange={(e) => setIngestData({ ...ingestData, server: e.target.value })}
              style={{ padding: '0.5rem', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#c9d1d9', width: '150px' }}
            />
            <select
              value={ingestData.format}
              onChange={(e) => setIngestData({ ...ingestData, format: e.target.value })}
              style={{ padding: '0.5rem', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#c9d1d9', width: '100px' }}
            >
              <option value="json">json</option>
            </select>
            <button
              onClick={handleIngest}
              disabled={loading}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#1B998B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Send
            </button>
          </div>
          <textarea
            value={ingestData.logContent}
            onChange={(e) => setIngestData({ ...ingestData, logContent: e.target.value })}
            style={{ width: '100%', minHeight: '150px', padding: '0.75rem', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#c9d1d9', fontFamily: 'monospace', fontSize: '0.875rem' }}
          />
        </div>

        {/* Event Volume Chart */}
        <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', minHeight: '300px' }}>
          <h2 style={{ color: '#1B998B', marginBottom: '1rem' }}>Event Volume</h2>
          {eventVolume.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={eventVolume}>
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
                <Line type="monotone" dataKey="count" stroke="#1B998B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ border: '2px dashed #30363d', borderRadius: '4px', padding: '3rem', textAlign: 'center', color: '#8b949e' }}>
              No event volume data available
            </div>
          )}
        </div>

        {/* Recent Logs Table */}
        <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '1.5rem' }}>
          <h2 style={{ color: '#1B998B', marginBottom: '1rem' }}>Recent Logs ({filteredLogs.length})</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #30363d', color: '#1B998B', fontSize: '0.875rem' }}>Time</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #30363d', color: '#1B998B', fontSize: '0.875rem' }}>Type</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #30363d', color: '#1B998B', fontSize: '0.875rem' }}>User</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #30363d', color: '#1B998B', fontSize: '0.875rem' }}>Src</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #30363d', color: '#1B998B', fontSize: '0.875rem' }}>Dst</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #30363d', color: '#1B998B', fontSize: '0.875rem' }}>Geo</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #30363d', color: '#1B998B', fontSize: '0.875rem' }}>Crit</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #30363d', color: '#1B998B', fontSize: '0.875rem' }}>Risk</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #30363d' }}>
                      <td style={{ padding: '0.75rem', color: '#c9d1d9', fontSize: '0.875rem' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#c9d1d9', fontSize: '0.875rem' }}>{log.event_type}</td>
                      <td style={{ padding: '0.75rem', color: '#c9d1d9', fontSize: '0.875rem' }}>{log.username || '-'}</td>
                      <td style={{ padding: '0.75rem', color: '#c9d1d9', fontSize: '0.875rem' }}>{log.source_ip || '-'}</td>
                      <td style={{ padding: '0.75rem', color: '#c9d1d9', fontSize: '0.875rem' }}>{log.destination_ip || '-'}</td>
                      <td style={{ padding: '0.75rem', color: '#c9d1d9', fontSize: '0.875rem' }}>{log.geo_location || '-'}</td>
                      <td style={{ padding: '0.75rem', color: '#c9d1d9', fontSize: '0.875rem' }}>{log.asset_criticality.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem', color: '#c9d1d9', fontSize: '0.875rem' }}>{log.user_risk_score.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#8b949e' }}>
                      No logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

