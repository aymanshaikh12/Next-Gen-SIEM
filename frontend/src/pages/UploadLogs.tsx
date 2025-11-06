import { useState } from 'react';
import { logsApi } from '../services/api';

export default function UploadLogs() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [singleLog, setSingleLog] = useState({
    event_type: '',
    source_ip: '',
    destination_ip: '',
    username: '',
    action: '',
    status: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      const result = await logsApi.upload(file);
      setMessage({
        type: 'success',
        text: `Successfully uploaded ${result.length} log(s)`,
      });
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      let errorMessage = 'Failed to upload logs';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout - file may be too large or server is not responding';
      } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on http://localhost:8000';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setMessage({
        type: 'error',
        text: `Upload failed: ${errorMessage}`,
      });
      console.error('Upload error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSingleLogSubmit = async () => {
    if (!singleLog.event_type) {
      setMessage({ type: 'error', text: 'Event type is required' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      await logsApi.ingest(singleLog);
      setMessage({ type: 'success', text: 'Log ingested successfully' });
      setSingleLog({
        event_type: '',
        source_ip: '',
        destination_ip: '',
        username: '',
        action: '',
        status: '',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to ingest log',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Data Ingestion</h1>

      {message && (
        <div className={message.type === 'success' ? 'success' : 'error'}>
          {message.text}
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Bulk Upload (Multiple Formats)</h2>
        <p style={{ marginBottom: '1rem', color: '#8b949e' }}>
          Upload log files in multiple formats: JSON, NDJSON, CSV, CEF, or Syslog. The system will automatically detect and parse the format.
        </p>
        <div className="input-group">
          <label>Select File</label>
          <input
            id="file-input"
            type="file"
            accept=".json,.ndjson,.csv,.cef,.log,.syslog"
            onChange={handleFileChange}
          />
        </div>
        {file && (
          <p style={{ color: '#1B998B', marginBottom: '1rem' }}>
            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
        <button
          className="btn btn-primary"
          onClick={handleFileUpload}
          disabled={loading || !file}
        >
          {loading ? 'Uploading...' : 'Upload Logs'}
        </button>
      </div>

      <div className="card">
        <h2 className="card-title">Single Log Ingestion</h2>
        <p style={{ marginBottom: '1rem', color: '#8b949e' }}>
          Ingest a single log event via the REST API.
        </p>
        <div className="input-group">
          <label>Event Type *</label>
          <input
            type="text"
            value={singleLog.event_type}
            onChange={(e) => setSingleLog({ ...singleLog, event_type: e.target.value })}
            placeholder="e.g., failed_login, unauthorized_access"
            required
          />
        </div>
        <div className="input-group">
          <label>Source IP</label>
          <input
            type="text"
            value={singleLog.source_ip}
            onChange={(e) => setSingleLog({ ...singleLog, source_ip: e.target.value })}
            placeholder="e.g., 192.168.1.100"
          />
        </div>
        <div className="input-group">
          <label>Destination IP</label>
          <input
            type="text"
            value={singleLog.destination_ip}
            onChange={(e) => setSingleLog({ ...singleLog, destination_ip: e.target.value })}
            placeholder="e.g., 10.0.0.50"
          />
        </div>
        <div className="input-group">
          <label>Username</label>
          <input
            type="text"
            value={singleLog.username}
            onChange={(e) => setSingleLog({ ...singleLog, username: e.target.value })}
            placeholder="e.g., admin"
          />
        </div>
        <div className="input-group">
          <label>Action</label>
          <input
            type="text"
            value={singleLog.action}
            onChange={(e) => setSingleLog({ ...singleLog, action: e.target.value })}
            placeholder="e.g., login, file_access"
          />
        </div>
        <div className="input-group">
          <label>Status</label>
          <input
            type="text"
            value={singleLog.status}
            onChange={(e) => setSingleLog({ ...singleLog, status: e.target.value })}
            placeholder="e.g., success, failed"
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSingleLogSubmit}
          disabled={loading}
        >
          {loading ? 'Ingesting...' : 'Ingest Log'}
        </button>
      </div>
    </div>
  );
}

