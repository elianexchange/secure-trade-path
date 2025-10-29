import passport from 'passport';

// Only configure Google OAuth if environment variables are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://tranzio-backend.onrender.com/api/auth/google/callback',
    scope: ['profile', 'email'],
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      const { prisma } = require('../lib/prisma');
      let user = await prisma.user.findUnique({
        where: { email: profile.emails[0].value },
      });
      if (user) {
        return done(null, user);
      }
      user = await prisma.user.create({
        data: {
          email: profile.emails[0].value,
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          avatar: profile.photos?.[0]?.value,
          role: 'BUYER',
          status: 'ACTIVE',
          password: '',
        },
      });
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));
}

// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const { prisma } = require('../index');
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
