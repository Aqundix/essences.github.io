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
        console.log("ล็อกอินสำเร็จ:", user.displayName);
        
        // ตรวจสอบว่ามี Element เหล่านี้จริงไหมก่อนแก้ข้อความเพื่อป้องกัน Error
        const statusHeader = document.getElementById('statusHeader');
        const statusTextElem = document.getElementById('statusText');
        
        if (statusHeader) statusHeader.innerText = `สวัสดีคุณ ${user.displayName}`;
        if (statusTextElem) statusTextElem.innerText = "กำลังนำคุณเข้าสู่ระบบ...";

        // ซ่อนปุ่ม Google
        if (googleBtn) googleBtn.style.display = 'none';

        // เด้งไปหน้า list-profile.html ทันที
        // ลองใส่ setTimeout เล็กน้อยเพื่อให้มั่นใจว่า Firebase บันทึก Token เสร็จ
        setTimeout(() => {
            console.log("Redirecting...");
            window.location.assign("page/list-profile.html"); // ใช้ .assign จะช่วยลดปัญหาในบาง Browser
        }, 500); 

    } else {
        if (googleBtn) {
            googleBtn.style.display = 'flex'; // หรือ 'block' ตาม CSS ของคุณ
            googleBtn.disabled = false;
            googleBtn.style.opacity = "1";
        }
        if (btnText) btnText.innerText = "Login with Google";
        if (statusText) statusText.innerText = "Welcome back! Please login to your account.";
    }
});

// --- 2. ฟังก์ชัน Login ---
googleBtn.addEventListener('click', () => {
    // 1. เปลี่ยนสถานะปุ่มขณะรอ Pop-up
    btnText.innerText = "กำลังเชื่อมต่อ...";
    googleBtn.disabled = true;
    googleBtn.style.opacity = "0.7"; // ลดความเข้มของปุ่มเพื่อให้ดูเหมือนทำงานอยู่

    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Login สำเร็จ");
            // เมื่อสำเร็จจะถูกเด้งไปหน้าอื่นโดย onAuthStateChanged อยู่แล้ว
        })
        .catch((error) => {
            // --- ส่วนที่แก้ไข: รีเซ็ตปุ่มให้กลับมาเป็นปกติ ---
            console.error("Login Error:", error.code);
            
            // คืนค่าปุ่ม
            googleBtn.disabled = false;
            googleBtn.style.opacity = "1";
            btnText.innerText = "Sign in with Google";

            // แสดง Error ตามกรณี
            if (error.code === 'auth/popup-closed-by-user') {
                errorMsg.innerText = "คุณปิดหน้าต่างเข้าสู่ระบบก่อนทำรายการเสร็จ";
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMsg.innerText = "มีการเปิด Pop-up ซ้อนกัน กรุณาลองใหม่";
            } else {
                errorMsg.innerText = "เกิดข้อผิดพลาด: " + error.message;
            }
            
            errorMsg.style.display = "block";
            
            // ซ่อน Error อัตโนมัติหลังจาก 3 วินาที (Optional)
            setTimeout(() => {
                errorMsg.style.display = "none";
            }, 3000);
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

// script-login.js

document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.querySelector('input[type="email"]').value;
    const password = document.querySelector('input[type="password"]').value;

    if(email && password) {
        console.log("Logging in with:", email);
        // เพิ่ม Logic การตรวจสอบรหัสผ่านตรงนี้
    } else {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    }
});