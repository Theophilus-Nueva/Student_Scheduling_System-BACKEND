import admin from 'firebase-admin';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let serviceAccount;

if (process.env.FIREBASE_CREDENTIALS) {
    serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
} else {
    serviceAccount = JSON.parse(fs.readFileSync('./firebase-adminsdk.json', 'utf8'));
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'student-ms-object-storage.firebasestorage.app' 
});

export const bucket = admin.storage().bucket();
console.log('Firebase Storage initialized! 🏴‍☠️');