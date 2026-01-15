import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

// เลือกปุ่มด้วย ID ให้ตรงกับใน HTML
const googleBtn = document.getElementById('googleLoginBtn');

if (googleBtn) {
    googleBtn.addEventListener('click', () => {
        // ใช้ signInWithPopup เพื่อเรียกหน้าต่างเลือกบัญชี Gmail
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("เข้าสู่ระบบสำเร็จ!", result.user.displayName);
                window.location.href = "list-profile.html"; 
            })
            .catch((error) => {
                console.error("เกิดข้อผิดพลาด:", error.message);
                alert("เกิดข้อผิดพลาด: " + error.message);
            });
    });
}
