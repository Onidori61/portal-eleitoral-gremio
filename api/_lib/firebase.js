import admin from "firebase-admin";

export const firebaseConfigured = Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
);

const normalizePrivateKey = (value) => {
    const trimmed = String(value).trim();
    const unquoted = trimmed
        .replace(/^"(.*)"$/s, "$1")
        .replace(/^'(.*)'$/s, "$1");

    return unquoted.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
};

export const getDb = () => {
    if (!firebaseConfigured) {
        throw new Error(
            "Firebase não está configurado nas variáveis de ambiente."
        );
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY)
            })
        });
    }

    return admin.firestore();
};