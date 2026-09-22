import admin from "firebase-admin";

export const firebaseConfigured = Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    (process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY)
);

const normalizePrivateKey = (value) => {
    const trimmed = String(value).trim();
    const unquoted = trimmed
        .replace(/^"(.*)"$/s, "$1")
        .replace(/^'(.*)'$/s, "$1");

    return unquoted
        .replace(/\\n/g, "\n")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();
};

const getServiceAccount = () => {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            const account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            return {
                projectId: account.project_id,
                clientEmail: account.client_email,
                privateKey: normalizePrivateKey(account.private_key)
            };
        } catch (error) {
            console.error("A variável FIREBASE_SERVICE_ACCOUNT_JSON não contém um JSON válido.", error);
            throw new Error("Configuração do Firebase inválida.");
        }
    }

    return {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY)
    };
};

export const getDb = () => {
    if (!firebaseConfigured) {
        throw new Error(
            "Firebase não está configurado nas variáveis de ambiente."
        );
    }

    if (!admin.apps.length) {
        const account = getServiceAccount();
        if (!account.projectId || !account.clientEmail || !account.privateKey) {
            throw new Error("Configuração do Firebase incompleta.");
        }
        admin.initializeApp({ credential: admin.credential.cert(account) });
    }

    return admin.firestore();
};