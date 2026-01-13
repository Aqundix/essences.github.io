import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

async function renderList() {
    if (!listDiv) return;
    listDiv.innerHTML = '<p style="text-align:center; color: white;">กำลังโหลดข้อมูล...</p>';
    
    try {
        const snapshot = await get(ref(db, 'members'));
        const allData = snapshot.exists() ? snapshot.val() : {};
        listDiv.innerHTML = '';
        const myOwnedProfile = localStorage.getItem('my_owned_profile');

        for (let i = 1; i <= 15; i++) {
            const idStr = i.toString();
            const savedData = allData[idStr];
            
            // ประกาศตัวแปรให้ตรงกัน
            let bannerStyle = "background-color: #5865f2;"; 
            if (savedData?.banner && savedData.banner !== "none" && savedData.banner !== "") {
                const bVal = savedData.banner.includes('url(') ? savedData.banner : `url("${savedData.banner}")`;
                bannerStyle = `background-image: ${bVal}; background-size: cover; background-position: center;`;
            }

            const isLocked = savedData?.isLocked || false;
            const isOwner = myOwnedProfile === idStr;

            let actionButton = '';
            if (isLocked && !isOwner) {
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #5865f2;">ดูโปรไฟล์</a>`;
            } else if (isOwner) {
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #43b581;">แก้ไขของคุณ</a>`;
            } else if (myOwnedProfile && myOwnedProfile !== idStr) {
                actionButton = `<span class="view-link" style="background: #4f545c; cursor: not-allowed; opacity: 0.6;">จำกัด 1 สิทธิ์</span>`;
            } else {
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link">จัดการโปรไฟล์</a>`;
            }

                    
            // ในส่วน itemHTML ให้ใช้ตัวแปร bannerStyle
            const itemHTML = `
                <div class="profile-item">
                    <div class="card-banner" style="${bannerStyle}"></div>
                    <div class="user-info">
                        <img src="${savedData?.avatar || defaultAvatar}" 
                             style="width: 65px; height: 65px; border-radius: 50%; border: 4px solid #2f3136; object-fit: cover;"
                             onerror="this.src='${defaultAvatar}'">
                        <div class="name-details" style="margin-top: 15px; position: relative; z-index: 2;">
                            <div class="name" style="color: white; font-weight: bold; font-size: 1.1em;">${savedData?.name || "Username " + idStr}</div>
                            <div class="tag" style="color: #b9bbbe; font-size: 0.85em;">@${idStr.padStart(4, '0')}</div>
                        </div>
                    </div>
                    <div style="position: relative; z-index: 1; padding: 5px 15px 15px 15px;">
                        ${actionButton}
                    </div>
                </div>
            `;
            listDiv.insertAdjacentHTML('beforeend', itemHTML);
        }
    } catch (e) {
        console.error("Render error:", e);
        listDiv.innerHTML = '<p style="text-align:center; color: white;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
    }
}

// --- ฟังก์ชัน Admin (แก้ไขให้ใช้งานได้จริง) ---
window.openAuthModal = () => document.getElementById('adminAuthModal').style.display = 'flex';
window.closeAuthModal = () => document.getElementById('adminAuthModal').style.display = 'none';

window.verifyAndReset = async function() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;

    if (user === "admin" && pass === "admin") {
        if (confirm("ยืนยันการล้างข้อมูลทั้งหมด? ข้อมูลในระบบจะหายถาวร")) {
            try {
                await remove(ref(db, 'members')); // ต้องมี remove ใน import ด้านบน
                localStorage.clear();
                alert("รีเซ็ตเรียบร้อย!");
                location.reload();
            } catch (e) {
                alert("Error: " + e.message);
            }
        }
    } else {
        alert("Username หรือ Password ไม่ถูกต้อง");
    }
};

// เริ่มรันระบบ
renderList();
window.addEventListener('focus', renderList);
