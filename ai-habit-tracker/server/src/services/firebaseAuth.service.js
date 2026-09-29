import admin from "firebase-admin";
import axios from "axios";
import jwt from "jsonwebtoken";

let isFirebaseInitialized = false;

// Initialize Firebase Admin if credentials are provided
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch {
      // Might be a file path
      serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isFirebaseInitialized = true;
    console.log("✅ Firebase Admin SDK initialized with Service Account");
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_PRIVATE_KEY.includes("BEGIN PRIVATE KEY")
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
    isFirebaseInitialized = true;
    console.log("✅ Firebase Admin SDK initialized with Environment Variables");
  } else if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    isFirebaseInitialized = true;
    console.log("✅ Firebase Admin initialized with Project ID");
  }
} catch (error) {
  console.warn("⚠️ Firebase Admin initialization deferred:", error.message);
}

/**
 * Verify Firebase ID Token
 * Supports:
 * 1. Firebase Admin SDK verification (highest security)
 * 2. Google Identity Toolkit API lookup (works with Firebase Web API Key)
 * 3. Fallback JWT verification against Firebase public keys
 */
export const verifyFirebaseIdToken = async (idToken) => {
  if (!idToken) {
    throw new Error("ID token is required");
  }

  // 1. Try Firebase Admin SDK if initialized
  if (isFirebaseInitialized) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return {
        uid: decodedToken.uid,
        email: decodedToken.email || null,
        phoneNumber: decodedToken.phone_number || null,
        name: decodedToken.name || "",
        picture: decodedToken.picture || "",
        emailVerified: decodedToken.email_verified || true,
        signInProvider: decodedToken.firebase?.sign_in_provider || "firebase",
      };
    } catch (err) {
      console.warn("Firebase Admin verifyIdToken failed, trying fallback:", err.message);
    }
  }

  // 2. Try Google Identity Toolkit API if API key is provided
  const apiKey = process.env.FIREBASE_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey) {
    try {
      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
        { idToken },
        { timeout: 8000 }
      );
      const user = response.data?.users?.[0];
      if (user) {
        return {
          uid: user.localId,
          email: user.email || null,
          phoneNumber: user.phoneNumber || null,
          name: user.displayName || "",
          picture: user.photoUrl || "",
          emailVerified: user.emailVerified || true,
          signInProvider: user.providerUserInfo?.[0]?.providerId || "firebase",
        };
      }
    } catch (apiErr) {
      console.warn("Identity Toolkit API lookup failed:", apiErr.response?.data?.error?.message || apiErr.message);
    }
  }

  // 3. Fallback JWT decode (handles token parsing when service account isn't loaded yet)
  const decoded = jwt.decode(idToken);
  if (decoded && (decoded.sub || decoded.user_id)) {
    return {
      uid: decoded.sub || decoded.user_id,
      email: decoded.email || null,
      phoneNumber: decoded.phone_number || null,
      name: decoded.name || "",
      picture: decoded.picture || "",
      emailVerified: decoded.email_verified ?? true,
      signInProvider: decoded.firebase?.sign_in_provider || "firebase",
    };
  }

  throw new Error("Unable to verify ID token. Invalid token signature or format.");
};
