import { api } from './api.js';
import { recordAudit } from './audit.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.loadPersistedUser();
  }

  loadPersistedUser() {
    // Authentication is intentionally session-only so a fresh website visit starts at login.
    this.currentUser = null;
    sessionStorage.removeItem('sip_auth_user');
    localStorage.removeItem('sip_auth_user');
    api.setToken('');
  }

  getUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  isAdmin() {
    return this.currentUser?.role === 'admin';
  }

  isDoctor() {
    return this.currentUser?.role === 'doctor';
  }

  isStaff() {
    return this.currentUser?.role === 'staff';
  }

  async login(email, password) {
    const res = await api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.data?.user && res.data?.token) {
      this.currentUser = res.data.user;
      api.setToken(res.data.token);
      sessionStorage.setItem('sip_auth_user', JSON.stringify(this.currentUser));
      recordAudit('Signed in', 'Authentication', 'Successful login');
      window.dispatchEvent(new CustomEvent('auth-changed', { detail: this.currentUser }));
      return this.currentUser;
    }
    throw new Error(res.message || 'Login failed.');
  }

  async switchUser(user, password) {
    if (!password) {
      throw new Error('Password is required to switch accounts.');
    }
    return this.login(user.email, password);
  }

  logout() {
    recordAudit('Signed out', 'Authentication', 'Session ended');
    this.currentUser = null;
    api.setToken('');
    sessionStorage.removeItem('sip_auth_user');
    localStorage.removeItem('sip_auth_user');
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: null }));
  }
}

export const auth = new AuthService();
