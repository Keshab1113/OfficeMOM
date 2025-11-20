const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const jwt = require("jsonwebtoken");
const db = require("../config/db.js");
require("dotenv").config();

// Google Strategy (existing)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const fullName = profile.displayName;
          const profilePic = profile.photos[0]?.value || null;

          const [existingUser] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
          );

          if (existingUser.length > 0) {
            return done(null, { ...existingUser[0], isNewUser: false });
          } else {
            const [insertResult] = await db.query(
              "INSERT INTO users (fullName, email, profilePic, isGoogleUser) VALUES (?, ?, ?, ?)",
              [fullName, email, profilePic, true]
            );
            const [newUser] = await db.query(
              "SELECT * FROM users WHERE id = ?",
              [insertResult.insertId]
            );
            return done(null, { ...newUser[0], isNewUser: true });
          }
        } catch (error) {
          console.error("❌ Error in Google Strategy:", error);
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn(
    "⚠️  Google OAuth credentials not found. Google login disabled."
  );
}

// Enhanced Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'displayName', 'photos', 'email'],
        enableProof: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("Facebook profile received:", profile);

          let email = profile.emails?.[0]?.value;

          // Check if it's a placeholder email from previous login
          if (!email || email.includes('@placeholder.com')) {
            // Check if user exists with Facebook ID pattern
            const placeholderEmail = `facebook_${profile.id}@placeholder.com`;
            const [existingUser] = await db.query(
              "SELECT * FROM users WHERE email = ? OR email LIKE ?",
              [placeholderEmail, `facebook_${profile.id}@%`]
            );

            if (existingUser.length > 0) {
              return done(null, existingUser[0]);
            }

            // Create new user with placeholder
            email = placeholderEmail;
          }

          const fullName = profile.displayName || `Facebook User ${profile.id}`;
          const profilePic = profile.photos?.[0]?.value || null;

          const [existingUser] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
          );

          if (existingUser.length > 0) {
            // Update existing user's profile picture if needed
            if (profilePic && !existingUser[0].profilePic) {
              await db.query(
                "UPDATE users SET profilePic = ?, isFacebookUser = true WHERE id = ?",
                [profilePic, existingUser[0].id]
              );
              existingUser[0].profilePic = profilePic;
            }
            return done(null, existingUser[0]);
          } else {
            const [insertResult] = await db.query(
              "INSERT INTO users (fullName, email, profilePic, isFacebookUser) VALUES (?, ?, ?, ?)",
              [fullName, email, profilePic, true]
            );
            const [newUser] = await db.query("SELECT * FROM users WHERE id = ?", [
              insertResult.insertId,
            ]);
            return done(null, newUser[0]);
          }
        } catch (error) {
          console.error("❌ Error in Facebook Strategy:", error);
          return done(error, null);
        }
      }
    )
  );
}

passport.serializeUser(() => { });
passport.deserializeUser(() => { });

module.exports = passport;
