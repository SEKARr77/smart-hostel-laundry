const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
const fs = require('fs');

// Read firebase config from the file
const firebaseContent = fs.readFileSync('./src/firebase.js', 'utf8');

// Primitive extraction of config
const apiKeyMatch = firebaseContent.match(/apiKey: "([^"]+)"/);
const authDomainMatch = firebaseContent.match(/authDomain: "([^"]+)"/);
const projectIdMatch = firebaseContent.match(/projectId: "([^"]+)"/);
const storageBucketMatch = firebaseContent.match(/storageBucket: "([^"]+)"/);
const messagingSenderIdMatch = firebaseContent.match(/messagingSenderId: "([^"]+)"/);
const appIdMatch = firebaseContent.match(/appId: "([^"]+)"/);

const firebaseConfig = {
    apiKey: apiKeyMatch[1],
    authDomain: authDomainMatch[1],
    projectId: projectIdMatch[1],
    storageBucket: storageBucketMatch[1],
    messagingSenderId: messagingSenderIdMatch[1],
    appId: appIdMatch[1]
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getRecoveryKey() {
    try {
        const docRef = doc(db, 'system', 'state');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            console.log('RECOVERY_KEY_FOUND:', snap.data().recoveryKey);
        } else {
            console.log('NO_STATE_DOCUMENT_FOUND');
        }
    } catch (err) {
        console.error('ERROR_FETCHING_KEY:', err.message);
    } finally {
        process.exit();
    }
}

getRecoveryKey();
