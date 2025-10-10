const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const db = require("../config/db.js");
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL, // e.g., http://localhost:5000/api/auth/google/callback
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const fullName = profile.displayName;
        const profilePic = profile.photos[0]?.value || null;

        // Check if user exists
        const [existingUser] = await db.query(
          "SELECT * FROM users WHERE email = ?",
          [email]
        );

        if (existingUser.length > 0) {
          // Existing user
          return done(null, existingUser[0]);
        } else {
          // New user
          const [insertResult] = await db.query(
            "INSERT INTO users (fullName, email, profilePic, isGoogleUser) VALUES (?, ?, ?, ?)",
            [fullName, email, profilePic, true]
          );
          const [newUser] = await db.query("SELECT * FROM users WHERE id = ?", [
            insertResult.insertId,
          ]);
          return done(null, newUser[0]);
        }
      } catch (error) {
        console.error("❌ Error in Google Strategy:", error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser(() => {});
passport.deserializeUser(() => {});


module.exports = passport;
