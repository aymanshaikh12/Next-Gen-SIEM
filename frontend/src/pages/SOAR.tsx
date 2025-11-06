import { useState } from 'react';
import { soarApi } from '../services/api';

export default function SOAR() {
  const [actionType, setActionType] = useState('block_ip');
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const handleExecute = async () => {
    if (!target) {
      setMessage({ type: 'error', text: 'Target is required' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      const result = await soarApi.execute(actionType, target, reason);
      setMessage({ type: 'success', text: result.message });
      setHistory([result, ...history].slice(0, 10)); // Keep last 10 actions
      setTarget('');
      setReason('');
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to execute SOAR action',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>SOAR Automation</h1>

      {message && (
        <div className={message.type === 'success' ? 'success' : 'error'}>
          {message.text}
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Execute SOAR Action</h2>
        <p style={{ marginBottom: '1rem', color: '#8b949e' }}>
          Execute automated security response actions.
        </p>
        <div className="input-group">
          <label>Action Type</label>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
          >
            <option value="block_ip">Block IP Address</option>
            <option value="disable_account">Disable Account</option>
            <option value="send_notification">Send Security Notification</option>
          </select>
        </div>
        <div className="input-group">
          <label>Target *</label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={
              actionType === 'block_ip'
                ? 'e.g., 192.168.1.100'
                : actionType === 'disable_account'
                ? 'e.g., username@domain.com'
                : 'e.g., security@company.com'
            }
            required
          />
        </div>
        <div className="input-group">
          <label>Reason (Optional)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for this action"
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={handleExecute}
          disabled={loading || !target}
        >
          {loading ? 'Executing...' : 'Execute Action'}
        </button>
      </div>

      {history.length > 0 && (
        <div className="card">
          <h2 className="card-title">Recent Actions</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Type</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {history.map((action, index) => (
                  <tr key={index}>
                    <td>{new Date().toLocaleString()}</td>
                    <td>
                      <span className="badge badge-high">
                        {action.action_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>{action.target}</td>
                    <td>
                      {action.success ? (
                        <span style={{ color: '#4caf50' }}>Success</span>
                      ) : (
                        <span style={{ color: '#f44336' }}>Failed</span>
                      )}
                    </td>
                    <td>{action.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

