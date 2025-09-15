class NotificationService {
  private isSupported = 'Notification' in window;
  private permission: NotificationPermission = 'default';

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return;
    }

    this.permission = Notification.permission;
    
    // Request permission if not granted
    if (this.permission === 'default') {
      this.permission = await this.requestPermission();
    }

    // Listen for permission changes
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then((permissionStatus) => {
        permissionStatus.onchange = () => {
          this.permission = permissionStatus.state as NotificationPermission;
        };
      });
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) return 'denied';

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  async showNotification(title: string, options: NotificationOptions = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      return false;
    }

    try {
      // Check if page is visible
      if (!document.hidden) {
        // Page is visible, show a toast instead
        this.showToast(title, options.body || '');
        return true;
      }

      // Page is hidden, show browser notification
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'tranzio-message',
        requireInteraction: false,
        silent: false,
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate to messages if it's a message notification
        if (options.tag === 'tranzio-message') {
          window.location.href = '/app/messages';
        }
      };

      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }

  showToast(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    // Set background color based on type
    const bgColors = {
      info: 'bg-blue-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500'
    };
    
    toast.className += ` ${bgColors[type]} text-white`;
    
    toast.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-1">
          <h4 class="font-medium">${title}</h4>
          ${message ? `<p class="text-sm opacity-90 mt-1">${message}</p>` : ''}
        </div>
        <button class="text-white opacity-70 hover:opacity-100 transition-opacity">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);

    // Handle close button
    const closeBtn = toast.querySelector('button');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.removeToast(toast);
      });
    }

    // Auto-remove after 4 seconds
    setTimeout(() => {
      this.removeToast(toast);
    }, 4000);
  }

  private removeToast(toast: HTMLElement) {
    toast.classList.add('translate-x-full');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  // Show message notification
  async showMessageNotification(senderName: string, message: string, transactionId: string) {
    return this.showNotification(
      `New message from ${senderName}`,
      {
        body: message,
        tag: 'tranzio-message',
        data: { transactionId },
        actions: [
          {
            action: 'reply',
            title: 'Reply',
            icon: '/favicon.ico'
          },
          {
            action: 'view',
            title: 'View',
            icon: '/favicon.ico'
          }
        ]
      }
    );
  }

  // Show transaction notification
  async showTransactionNotification(type: 'created' | 'joined' | 'completed' | 'disputed', transactionId: string) {
    const titles = {
      created: 'Transaction Created',
      joined: 'Transaction Joined',
      completed: 'Transaction Completed',
      disputed: 'Transaction Disputed'
    };

    const messages = {
      created: 'Your transaction has been created successfully',
      joined: 'Someone has joined your transaction',
      completed: 'Your transaction has been completed',
      disputed: 'Your transaction has been disputed'
    };

    return this.showNotification(
      titles[type],
      {
        body: messages[type],
        tag: 'tranzio-transaction',
        data: { transactionId }
      }
    );
  }

  // Check if notifications are supported and enabled
  isEnabled(): boolean {
    return this.isSupported && this.permission === 'granted';
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}

export const notificationService = new NotificationService();
