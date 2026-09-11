import { api } from './api.js';
import { auth } from './auth.js';

class RealtimeSyncService {
  constructor() {
    this.clientId = this.getOrCreateClientId();
    this.device = this.detectDevice();
    this.activeUsers = [];
    this.lastPatientCount = null;
    this.lastPatientUpdated = null;
    this.lastPatientId = null;
    this.syncTimer = null;
    this.heartbeatTimer = null;
    this.listeners = {
      patient: new Set(),
      presence: new Set(),
    };

    // Cross-tab broadcast channel
    this.channel = typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('sip_realtime_sync')
      : null;

    if (this.channel) {
      this.channel.onmessage = (event) => {
        this.handleBroadcastMessage(event.data);
      };
    }

    // Fallback cross-tab listener via window storage event
    window.addEventListener('storage', (e) => {
      if (e.key === 'sip_broadcast_event' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          this.handleBroadcastMessage(data);
        } catch {
          // ignore parsing error
        }
      } else if (e.key === 'sip_active_presences' && !api.isBackendOnline) {
        this.syncLocalPresences();
      }
    });

    // Start background loops
    this.startHeartbeat();
    this.startSync();

    // Re-check sync immediately when tab becomes visible or online
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkPatientSync();
        this.sendHeartbeat();
      }
    });

    window.addEventListener('auth-changed', () => {
      this.sendHeartbeat();
      this.checkPatientSync();
    });
  }

  getOrCreateClientId() {
    let id = sessionStorage.getItem('sip_client_id');
    if (!id) {
      id = 'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      sessionStorage.setItem('sip_client_id', id);
    }
    return id;
  }

  detectDevice() {
    const ua = navigator.userAgent;
    const isSmallScreen = window.innerWidth <= 768;

    if (/Android/i.test(ua)) return isSmallScreen ? '📱 Android Mobile' : '📱 Android Tablet';
    if (/iPhone/i.test(ua)) return '📱 iPhone';
    if (/iPad/i.test(ua)) return '📱 iPad';
    if (/Mac/i.test(ua)) return '💻 Mac';
    if (/Windows/i.test(ua)) return '💻 Windows PC';
    if (/Linux/i.test(ua)) return '💻 Linux PC';
    return isSmallScreen ? '📱 Mobile Device' : '💻 Desktop Browser';
  }

  onPatientUpdate(callback) {
    this.listeners.patient.add(callback);
    return () => this.listeners.patient.delete(callback);
  }

  onPresenceUpdate(callback) {
    this.listeners.presence.add(callback);
    callback(this.activeUsers);
    return () => this.listeners.presence.delete(callback);
  }

  notifyPatientListeners(eventData) {
    this.listeners.patient.forEach((cb) => {
      try { cb(eventData); } catch (e) { console.error('[Realtime] Patient listener error:', e); }
    });
  }

  notifyPresenceListeners() {
    this.listeners.presence.forEach((cb) => {
      try { cb(this.activeUsers); } catch (e) { console.error('[Realtime] Presence listener error:', e); }
    });
  }

  handleBroadcastMessage(data) {
    if (!data || data.senderId === this.clientId) return;

    if (data.type === 'PATIENT_CREATED') {
      this.notifyPatientListeners({
        source: 'cross_tab',
        patient: data.patient,
        creator: data.creator || 'Another Device',
        device: data.device || 'Remote Device',
        timestamp: data.timestamp || Date.now(),
      });
    } else if (data.type === 'PRESENCE_PING') {
      if (!api.isBackendOnline) {
        this.syncLocalPresences();
      }
    }
  }

  broadcastPatientCreated(patient, creatorName = null) {
    const user = auth.getUser();
    const eventPayload = {
      type: 'PATIENT_CREATED',
      senderId: this.clientId,
      patient,
      creator: creatorName || user?.name || 'Clinical Staff',
      device: this.device,
      timestamp: Date.now(),
    };

    if (this.channel) {
      try { this.channel.postMessage(eventPayload); } catch { /* ignore */ }
    }

    try {
      localStorage.setItem('sip_broadcast_event', JSON.stringify(eventPayload));
    } catch { /* ignore */ }

    // Notify local listeners as well
    this.notifyPatientListeners({
      source: 'local',
      patient,
      creator: eventPayload.creator,
      device: eventPayload.device,
      timestamp: eventPayload.timestamp,
    });
  }

  startSync() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    // 2-second fast sync interval for responsive cross-device updates
    this.syncTimer = setInterval(() => {
      this.checkPatientSync();
    }, 2000);
    this.checkPatientSync();
  }

  startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    // Send heartbeat every 10 seconds
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, 10000);
    this.sendHeartbeat();
  }

  async sendHeartbeat() {
    const user = auth.getUser();
    if (!user) return;

    if (api.isBackendOnline && api.getToken() && !api.getToken().startsWith('demo_sanctum_token_')) {
      try {
        const res = await api.request('/presence/heartbeat', {
          method: 'POST',
          body: JSON.stringify({
            client_id: this.clientId,
            device: this.device,
          }),
        });
        if (res?.data && Array.isArray(res.data)) {
          this.activeUsers = res.data;
          this.notifyPresenceListeners();
        }
      } catch (err) {
        console.debug('[Realtime] Heartbeat failed:', err.message);
      }
    } else {
      // Local/Demo Mode Heartbeat
      const now = Date.now();
      let presences = [];
      try {
        presences = JSON.parse(localStorage.getItem('sip_active_presences') || '[]');
      } catch {
        presences = [];
      }

      // Filter active in last 30s
      presences = presences.filter(p => (now - p.last_seen) < 30000 && p.client_id !== this.clientId);

      presences.push({
        client_id: this.clientId,
        user_id: user.id || 0,
        name: user.name || 'User',
        role: user.role || 'staff',
        device: this.device,
        last_seen: now,
      });

      try {
        localStorage.setItem('sip_active_presences', JSON.stringify(presences));
      } catch { /* ignore */ }

      this.activeUsers = presences;
      this.notifyPresenceListeners();

      if (this.channel) {
        try {
          this.channel.postMessage({ type: 'PRESENCE_PING', senderId: this.clientId });
        } catch { /* ignore */ }
      }
    }
  }

  syncLocalPresences() {
    const now = Date.now();
    try {
      const presences = JSON.parse(localStorage.getItem('sip_active_presences') || '[]');
      this.activeUsers = presences.filter(p => (now - p.last_seen) < 30000);
      this.notifyPresenceListeners();
    } catch {
      // ignore
    }
  }

  async checkPatientSync() {
    if (!auth.isAuthenticated()) return;

    if (api.isBackendOnline && api.getToken() && !api.getToken().startsWith('demo_sanctum_token_')) {
      try {
        const res = await api.request('/patients/sync');
        const data = res?.data;
        if (!data) return;

        const currentCount = data.count ?? 0;
        const currentUpdated = data.last_updated;
        const latestPatient = data.latest_patient;
        const lastCreatedEvent = data.last_created_event;

        // Check if this is the first initial poll
        if (this.lastPatientCount === null) {
          this.lastPatientCount = currentCount;
          this.lastPatientUpdated = currentUpdated;
          this.lastPatientId = latestPatient?.id || null;
          return;
        }

        const countIncreased = currentCount > this.lastPatientCount;
        const updatedChanged = currentUpdated && currentUpdated !== this.lastPatientUpdated;
        const newPatientId = latestPatient?.id && latestPatient?.id !== this.lastPatientId;

        if (countIncreased || (updatedChanged && newPatientId)) {
          this.lastPatientCount = currentCount;
          this.lastPatientUpdated = currentUpdated;
          this.lastPatientId = latestPatient?.id || null;

          const creatorName = lastCreatedEvent?.creator_name || 'Another Device';
          const patientName = latestPatient?.full_name || `${latestPatient?.first_name || ''} ${latestPatient?.last_name || ''}`.trim() || 'New Patient';

          this.notifyPatientListeners({
            source: 'backend_sync',
            patient: latestPatient,
            creator: creatorName,
            device: 'Another Device',
            timestamp: Date.now(),
          });
        }
      } catch (err) {
        console.debug('[Realtime] Sync check failed:', err.message);
      }
    } else {
      // Demo / Local Mode sync check via localStorage
      const demoPatients = api.getLocalPatients();
      const count = demoPatients.length;
      if (this.lastPatientCount === null) {
        this.lastPatientCount = count;
        this.lastPatientId = demoPatients[0]?.id || null;
        return;
      }

      if (count > this.lastPatientCount) {
        this.lastPatientCount = count;
        const latest = demoPatients[0];
        this.lastPatientId = latest?.id || null;

        this.notifyPatientListeners({
          source: 'demo_sync',
          patient: latest,
          creator: 'Demo User',
          device: this.device,
          timestamp: Date.now(),
        });
      }
    }
  }

  getActiveUsers() {
    return this.activeUsers;
  }
}

export const realtime = new RealtimeSyncService();

