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

// 2. Main Render Function
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
            
            // --- จัดการส่วน Banner ---
            let finalBannerStyle = "background-color: #5865f2;"; // สี Default ของ Discord
            if (savedData?.banner && savedData.banner !== "none" && savedData.banner !== "") {
                const bUrl = savedData.banner.includes('url(') ? savedData.banner : `url("${savedData.banner}")`;
                finalBannerStyle = `background-image: ${bUrl}; background-size: cover; background-position: center;`;
            }

            // --- จัดการระบบล็อคสิทธิ์ 1 คนต่อ 1 ID ---
            const isLocked = savedData?.isLocked || false;
            const isOwner = myOwnedProfile === idStr;
            let actionBtn = '';

            if (isLocked && !isOwner) {
                // โปรไฟล์ถูกจองโดยคนอื่น
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #ed4245;">ดูโปรไฟล์</a>`;
            } else if (isOwner) {
                // โปรไฟล์เป็นของเรา
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #43b581;">แก้ไขของคุณ</a>`;
            } else if (myOwnedProfile && myOwnedProfile !== idStr) {
                // เราจอง ID อื่นไปแล้ว
                actionBtn = `<span class="view-link" style="background: #4f545c; opacity: 0.6; cursor: not-allowed;">จำกัด 1 สิทธิ์</span>`;
            } else {
                // โปรไฟล์ว่าง และเรายังไม่มีการจอง
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link">จัดการโปรไฟล์</a>`;
            }

            // --- สร้าง HTML ---
            const itemHTML = `
                <div class="profile-item" style="position: relative; overflow: hidden; background: #2f3136; border-radius: 8px; margin-bottom: 12px; min-height: 120px; border: 1px solid #444;">
                    <div class="card-banner" style="position: absolute; top: 0; left: 0; width: 100%; height: 60px; z-index: 0; ${finalBannerStyle}"></div>
                    
                    <div class="user-info" style="position: relative; z-index: 1; padding: 45px 15px 10px 15px; display: flex; align-items: center; gap: 15px;">
                        <img src="${savedData?.avatar || 'img/profile.jpg'}" 
                             style="width: 65px; height: 65px; border-radius: 50%; border: 4px solid #2f3136; object-fit: cover; background:#2f3136;"
                             onerror="this.src='img/profile.jpg'">
                        <div style="margin-top: 15px;">
                            <div style="color: white; font-weight: bold; font-size: 1.1em;">${savedData?.name || "Username"}</div>
                            <div style="color: #b9bbbe; font-size: 0.85em;">@${idStr.padStart(4, '0')}</div>
                        </div>
                    </div>

                    <div style="position: relative; z-index: 1; padding: 5px 15px 15px 15px;">
                        ${actionBtn}
                    </div>
                </div>
            `;
            listDiv.insertAdjacentHTML('beforeend', itemHTML);
        }
    } catch (e) {
        listDiv.innerHTML = '<p style="text-align:center; color: white; padding: 20px;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
        console.error("Render Error:", e);
    }
}

// 3. Admin & Modal Functions
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
    const u = document.getElementById('adminUser').value;
    const p = document.getElementById('adminPass').value;

    if (u === "admin" && p === "admin") {
        if (confirm("⚠️ ยืนยันการล้างข้อมูลทั้งหมดใน Server? ข้อมูลสมาชิกทุกคนจะถูกลบ!")) {
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
        alert("Username หรือ Password ไม่ถูกต้อง");
    }
};

// 4. Initialization
renderList();
window.addEventListener('focus', renderList);
