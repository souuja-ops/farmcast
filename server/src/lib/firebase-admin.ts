import admin from "firebase-admin";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { config } from "../config";

if (admin.apps.length === 0) {
  const privateKey = config.firebase.privateKey.replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey,
    }),
  });
}

export { admin };
export const auth: Auth = admin.auth();
export const db: Firestore = admin.firestore();
