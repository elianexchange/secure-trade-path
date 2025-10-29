// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  verified_email: boolean;
  idToken: string;
}

class GoogleAuthService {
  constructor() {
    // No client initialization needed for browser-based auth
  }

  // Initialize Google Sign-In
  async initializeGoogleSignIn(): Promise<void> {
    try {
      // Load Google API script
      await this.loadGoogleScript();
      
      // Initialize Google Sign-In
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: this.handleCredentialResponse.bind(this),
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    } catch (error) {
      console.error('Failed to initialize Google Sign-In:', error);
      throw error;
    }
  }

  // Load Google API script
  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.head.appendChild(script);
    });
  }

  // Handle Google credential response
  private handleCredentialResponse(response: any): GoogleUser {
    try {
      // Decode the JWT token on the client side (basic decoding)
      const payload = this.decodeJWT(response.credential);
      
      if (!payload) {
        throw new Error('Invalid Google token payload');
      }

      return {
        id: payload.sub,
        email: payload.email || '',
        name: payload.name || '',
        picture: payload.picture || '',
        given_name: payload.given_name || '',
        family_name: payload.family_name || '',
        verified_email: payload.email_verified || false,
        idToken: response.credential,
      };
    } catch (error) {
      console.error('Failed to decode Google token:', error);
      throw error;
    }
  }

  // Basic JWT decoding (client-side only)
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  }

  // Render Google Sign-In button
  renderGoogleSignInButton(elementId: string, onSuccess: (user: GoogleUser) => void, onError: (error: Error) => void, buttonText: string = 'signin_with'): void {
    if (!window.google) {
      onError(new Error('Google API not loaded'));
      return;
    }

    // Store callbacks
    (window as any).googleSignInSuccess = onSuccess;
    (window as any).googleSignInError = onError;

    // Update the callback
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        try {
          const user = await this.handleCredentialResponse(response);
          onSuccess(user);
        } catch (error) {
          onError(error as Error);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Render the button
    window.google.accounts.id.renderButton(
      document.getElementById(elementId),
      {
        theme: 'outline',
        size: 'large',
        text: buttonText === 'Sign up with Google' ? 'signup_with' : 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: '100%',
      }
    );
  }

  // Sign out from Google
  signOut(): void {
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  }

  // Check if user is signed in to Google
  isSignedIn(): boolean {
    return window.google?.accounts?.id?.isSignedIn?.() || false;
  }
}

// Extend Window interface for Google API
declare global {
  interface Window {
    google: any;
    googleSignInSuccess: (user: GoogleUser) => void;
    googleSignInError: (error: Error) => void;
  }
}

export const googleAuthService = new GoogleAuthService();
