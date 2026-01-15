import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const logoutBtn = document.getElementById('logoutBtn');
const btnText = document.getElementById('btnText');
const statusText = document.getElementById('statusText');
const errorMsg = document.getElementById('errorMsg');

// --- 1. ตรวจสอบสถานะการเข้าสู่ระบบแบบ Real-time ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // ถ้าล็อกอินอยู่
        googleBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        statusText.innerText = `สวัสดีคุณ ${user.displayName}`;
        console.log("ล็อกอินอยู่:", user.displayName);
        
        // หากต้องการให้เด้งไปหน้าอื่นทันทีเมื่อล็อกอินแล้ว ให้เอาคอมเมนต์ออกด้านล่างนี้:
        // window.location.href = "profile-list.html";
    } else {
        // ถ้าไม่ได้ล็อกอิน
        googleBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        statusText.innerText = "กรุณาเข้าสู่ระบบด้วยบัญชี Google ของคุณ";
        btnText.innerText = "Sign in with Google";
        googleBtn.disabled = false;
    }
});

// --- 2. ฟังก์ชัน Login ---
googleBtn.addEventListener('click', () => {
    btnText.innerText = "กำลังเชื่อมต่อ...";
    googleBtn.disabled = true;

    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Login สำเร็จ");
            // window.location.href = "profile-list.html"; 
        })
        .catch((error) => {
            btnText.innerText = "Sign in with Google";
            googleBtn.disabled = false;
            errorMsg.innerText = "Error: " + error.message;
            errorMsg.style.display = "block";
        });
});

// --- 3. ฟังก์ชัน Log Out (ออกจากระบบ) ---
logoutBtn.addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            alert("ออกจากระบบเรียบร้อยแล้ว");
            errorMsg.style.display = "none";
        })
        .catch((error) => {
            alert("ไม่สามารถออกจากระบบได้: " + error.message);
        });
});
