import { api } from './api.js';
import { mockUsers } from './mockData.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.loadPersistedUser();
  }

  loadPersistedUser() {
    const saved = localStorage.getItem('sip_auth_user');
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch {
        this.currentUser = null;
      }
    } else {
      // Default to Dr. Rajesh Patel (Doctor) or Admin for immediate rich preview
      this.currentUser = mockUsers[0]; // Admin by default
      localStorage.setItem('sip_auth_user', JSON.stringify(this.currentUser));
      api.setToken('demo_sanctum_token_admin');
    }
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
      localStorage.setItem('sip_auth_user', JSON.stringify(this.currentUser));
      window.dispatchEvent(new CustomEvent('auth-changed', { detail: this.currentUser }));
      return this.currentUser;
    }
    throw new Error(res.message || 'Login failed.');
  }

  switchUser(user) {
    this.currentUser = user;
    api.setToken(`demo_sanctum_token_${user.id}`);
    localStorage.setItem('sip_auth_user', JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: this.currentUser }));
  }

  logout() {
    this.currentUser = null;
    api.setToken('');
    localStorage.removeItem('sip_auth_user');
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: null }));
  }
}

export const auth = new AuthService();
