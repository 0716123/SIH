const AUDIT_KEY = 'sip_audit_log';
const MAX_ENTRIES = 100;

export function recordAudit(action, entity, details = '') {
  const currentUser = JSON.parse(sessionStorage.getItem('sip_auth_user') || localStorage.getItem('sip_auth_user') || 'null');
  const entries = getAuditEntries();
  entries.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    entity,
    details,
    user: currentUser?.name || 'System',
    role: currentUser?.role || 'system',
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(AUDIT_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function getAuditEntries() {
  try {
    const entries = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

export function exportAuditCsv() {
  const rows = getAuditEntries();
  const header = ['Timestamp', 'User', 'Role', 'Action', 'Entity', 'Details'];
  const csv = [header, ...rows.map(row => [
    row.timestamp,
    row.user,
    row.role,
    row.action,
    row.entity,
    row.details,
  ])].map(columns => columns.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sip-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
