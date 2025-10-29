import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface GoogleUserData {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  verified_email: boolean;
}

class BackendGoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(GOOGLE_CLIENT_ID);
  }

  // Verify Google ID token
  async verifyGoogleToken(idToken: string): Promise<GoogleUserData> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
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
      };
    } catch (error) {
      console.error('Failed to verify Google token:', error);
      throw new Error('Invalid Google token');
    }
  }

  // Authenticate or create user with Google data
  async authenticateOrCreateUser(googleUser: GoogleUserData) {
    try {
      // Check if user exists by email
      let user = await prisma.user.findUnique({
        where: { email: googleUser.email }
      });

      if (user) {
        // Update user with Google data if needed
        if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: googleUser.id,
              firstName: googleUser.given_name || user.firstName,
              lastName: googleUser.family_name || user.lastName,
              profilePicture: googleUser.picture || user.profilePicture,
              isVerified: googleUser.verified_email || user.isVerified,
            }
          });
        }
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            googleId: googleUser.id,
            email: googleUser.email,
            firstName: googleUser.given_name,
            lastName: googleUser.family_name,
            profilePicture: googleUser.picture,
            isVerified: googleUser.verified_email,
            status: 'ACTIVE',
            role: 'USER',
            verificationLevel: 'BASIC',
            trustScore: 50, // Default trust score for new users
            password: '', // No password for Google users
          }
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          role: user.role,
          authMethod: 'google'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          isVerified: user.isVerified,
          profilePicture: user.profilePicture,
          googleId: user.googleId,
        },
        token
      };
    } catch (error) {
      console.error('Error in Google authentication:', error);
      throw new Error('Failed to authenticate with Google');
    }
  }

  // Check if user has Google account linked
  async isGoogleLinked(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { googleId: true }
      });
      return !!user?.googleId;
    } catch (error) {
      console.error('Error checking Google link status:', error);
      return false;
    }
  }

  // Unlink Google account
  async unlinkGoogleAccount(userId: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { googleId: null }
      });
      return true;
    } catch (error) {
      console.error('Error unlinking Google account:', error);
      return false;
    }
  }
}

export const backendGoogleAuthService = new BackendGoogleAuthService();
