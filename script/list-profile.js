import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBXf1-WXXaPd_IModQCbBI8NwvsZ1rgJWU",
    authDomain: "aqundix-d3f38.firebaseapp.com",
    projectId: "aqundix-d3f38",
    storageBucket: "aqundix-d3f38.firebasestorage.app",
    messagingSenderId: "923430604932",
    appId: "1:923430604932:web:a06344e33b3df87aef72d1",
    measurementId: "G-NC6SKF25ZB"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const listDiv = document.getElementById('member-list');

// 2. ฟังก์ชันแสดงผลรายชื่อ (Main Render)
async function renderList() {
    if (!listDiv) return;
    try {
        const snapshot = await get(ref(db, 'members'));
        const allData = snapshot.exists() ? snapshot.val() : {};
        listDiv.innerHTML = '';
        const myOwnedProfile = localStorage.getItem('my_owned_profile');

        for (let i = 1; i <= 15; i++) {
            const idStr = i.toString();
            const savedData = allData[idStr];
            
            // จัดการ Banner: ตรวจสอบและครอบด้วย url() เพียงชั้นเดียว
            let bannerStyle = "background-color: #5865f2;"; 
            if (savedData?.banner && savedData.banner !== "" && savedData.banner !== "none") {
                // ล้าง url() เก่าออกถ้ามีก่อนใส่ใหม่ เพื่อป้องกันบัคจอขาว/ดำ
                const cleanUrl = savedData.banner.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
                bannerStyle = `background-image: url("${cleanUrl}"); background-size: cover; background-position: center;`;
            }

            const isLocked = savedData?.isLocked || false;
            const isOwner = myOwnedProfile === idStr;
            let actionBtn = '';

            // กำหนดสถานะปุ่ม
            if (isLocked && !isOwner) {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link locked">ดูโปรไฟล์</a>`;
            } else if (isOwner) {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link owned">แก้ไขของคุณ</a>`;
            } else if (myOwnedProfile && myOwnedProfile !== idStr) {
                actionBtn = `<span class="view-link limit">จำกัด 1 สิทธิ์</span>`;
            } else {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link">จัดการโปรไฟล์</a>`;
            }

            // --- ส่วนหลักใน Loop ของ renderList (หาบรรทัด itemHTML แล้วเปลี่ยนเป็นโค้ดนี้) ---
            const itemHTML = `
                <div class="profile-item">
                    <div class="card-banner" style="${bannerStyle}"></div>
                    <div class="banner-overlay"></div>
                    <div class="user-content-wrapper">
                        <div class="user-info">
                            <img src="${savedData?.avatar || 'img/profile.jpg'}" class="avatar-img" onerror="this.src='img/profile.jpg'">
                            <div class="name-details">
                                <span class="name">${savedData?.name || "ยังไม่ได้ตั้งชื่อ"}</span>
                                <span class="tag">@${idStr.padStart(4, '0')}</span>
                            </div>
                        </div>
                        <div class="button-area">
                            ${actionBtn}
                        </div>
                    </div>
                </div>
            `;
            listDiv.insertAdjacentHTML('beforeend', itemHTML);
        }
    } catch (e) {
        listDiv.innerHTML = '<p style="text-align:center; color: white;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
        console.error("Firebase Error:", e);
    }
}

// 3. ฟังก์ชัน Admin (Reset System)
window.openAuthModal = () => {
    const modal = document.getElementById('adminAuthModal');
    if (modal) modal.style.display = 'flex';
};

window.closeAuthModal = () => {
    const modal = document.getElementById('adminAuthModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('adminUser').value = '';
        document.getElementById('adminPass').value = '';
    }
};

window.verifyAndReset = async () => {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;

    if (user === "admin" && pass === "admin") {
        if (confirm("⚠️ ยืนยันการล้างข้อมูลทั้งหมดในเซิร์ฟเวอร์?")) {
            try {
                await remove(ref(db, 'members'));
                localStorage.clear();
                alert("รีเซ็ตระบบสำเร็จ!");
                location.reload();
            } catch (err) {
                alert("Error: " + err.message);
            }
        }
    } else { 
        alert("รหัสผ่านไม่ถูกต้อง"); 
    }
};

// 4. สั่งให้ทำงานเมื่อโหลดหน้าเว็บ
renderList();

// อัปเดตข้อมูลอัตโนมัติเมื่อผู้ใช้กลับมาที่หน้าเดิม
window.addEventListener('focus', renderList);
