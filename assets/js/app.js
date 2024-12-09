// app.js
import { db } from './firebase-config.js'; // Adjust the path as necessary
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const auth = getAuth();
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch user role from Firestore
        const userDoc = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDoc);

        if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.role === 'admin') {
                // Redirect to admin dashboard
                window.location.href = 'admin-dashboard.html';
            } else {
                // Redirect to user dashboard
                window.location.href = 'user-dashboard.html';
            }
        } else {
            alert("No user data found.");
        }
    } catch (error) {
        alert("Error: " + error.message);
    }
});
