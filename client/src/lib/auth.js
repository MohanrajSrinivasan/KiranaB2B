export const AUTH_STORAGE_KEY = 'kiranaconnect_user';

export class AuthService {
  static saveUser(user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }

  static getStoredUser() {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  static removeUser() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  static isAuthenticated() {
    return this.getStoredUser() !== null;
  }

  static hasRole(requiredRole) {
    const user = this.getStoredUser();
    return user && user.role === requiredRole;
  }

  static hasAnyRole(roles) {
    const user = this.getStoredUser();
    return user && roles.includes(user.role);
  }

  static canAccessAdminFeatures() {
    return this.hasRole('admin');
  }

  static canAccessKiranaFeatures() {
    return this.hasRole('vendor');
  }

  static canAccessRetailFeatures() {
    return this.hasRole('retail_user');
  }

  static getDashboardRoute(user) {
    const currentUser = user || this.getStoredUser();
    if (!currentUser) return '/';

    switch (currentUser.role) {
      case 'admin': return '/admin';
      case 'vendor': return '/kirana';
      case 'retail_user': return '/retail';
      default: return '/';
    }
  }

  static getUserDisplayName(user) {
    const currentUser = user || this.getStoredUser();
    return currentUser?.name || 'User';
  }

  static getUserInitials(user) {
    const currentUser = user || this.getStoredUser();
    const name = currentUser?.name || 'U';
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  static isSessionExpired() {
    // Basic session check - could be enhanced with JWT expiry
    return !this.isAuthenticated();
  }

  static async refreshSession() {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.saveUser(data.user);
        return data.user;
      } else {
        this.removeUser();
        return null;
      }
    } catch {
      this.removeUser();
      return null;
    }
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    return {
      isValid: password.length >= 6,
      message: password.length >= 6 ? '' : 'Password must be at least 6 characters long'
    };
  }

  static validatePhoneNumber(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  static formatPhoneNumber(phone) {
    return phone.replace(/\D/g, '');
  }

  static getRegions() {
    return ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];
  }

  static getUserTypeLabel(role) {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'vendor': return 'Kirana Store Owner';
      case 'retail_user': return 'Retail Customer';
      default: return 'User';
    }
  }

  static getPermissions(role) {
    switch (role) {
      case 'admin':
        return ['manage_users', 'manage_products', 'view_analytics', 'manage_orders', 'manage_inventory'];
      case 'vendor':
        return ['view_products', 'create_orders', 'view_own_orders', 'manage_profile'];
      case 'retail_user':
        return ['view_products', 'create_orders', 'view_own_orders', 'manage_profile'];
      default:
        return [];
    }
  }

  static hasPermission(permission, user) {
    const currentUser = user || this.getStoredUser();
    if (!currentUser) return false;
    
    const permissions = this.getPermissions(currentUser.role);
    return permissions.includes(permission);
  }
}