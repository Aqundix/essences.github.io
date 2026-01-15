import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase Config ของคุณ
const firebaseConfig = {
    apiKey: "AIzaSyBXf1-WXXaPd_IModQCb0I8NwvsZ1rgJWU",
    authDomain: "aqundix-d3f38.firebaseapp.com",
    projectId: "aqundix-d3f38",
    storageBucket: "aqundix-d3f38.firebasestorage.app",
    messagingSenderId: "923430604932",
    appId: "1:923430604932:web:cc2985eaa5125dc9ef72d1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const provider = new GoogleAuthProvider();

const googleBtn = document.getElementById('googleLoginBtn');

googleBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            // ดึงข้อมูลผู้ใช้ที่ Login สำเร็จ
            const user = result.user;
            console.log("Logged in as:", user.displayName);
            
            // ส่งผู้ใช้ไปที่หน้า Profile List
            window.location.href = "profile-list.html";
        })
        .catch((error) => {
            console.error("Login Error:", error.message);
            alert("การเข้าสู่ระบบล้มเหลว: " + error.message);
        });
});
