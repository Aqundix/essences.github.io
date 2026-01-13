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
    try {
        const snapshot = await get(ref(db, 'members'));
        const allData = snapshot.exists() ? snapshot.val() : {};
        listDiv.innerHTML = '';
        const myOwnedProfile = localStorage.getItem('my_owned_profile');

        for (let i = 1; i <= 15; i++) {
            const idStr = i.toString();
            const savedData = allData[idStr];
            
            // แก้ไขเรื่อง Banner และสีน้ำเงินค้าง
            let finalBanner = "background-color: #5865f2;";
            if (savedData?.banner && savedData.banner !== "none" && savedData.banner !== "") {
                const bUrl = savedData.banner.includes('url(') ? savedData.banner : `url("${savedData.banner}")`;
                finalBanner = `background-image: ${bUrl}; background-size: cover; background-position: center;`;
            }

            const isLocked = savedData?.isLocked || false;
            const isOwner = myOwnedProfile === idStr;
            let actionBtn = '';

            if (isLocked && !isOwner) {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #ed4245;">ดูโปรไฟล์</a>`;
            } else if (isOwner) {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #43b581;">แก้ไขของคุณ</a>`;
            } else if (myOwnedProfile) {
                actionBtn = `<span class="view-link" style="background: #4f545c; opacity: 0.6;">จำกัด 1 สิทธิ์</span>`;
            } else {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link">จัดการโปรไฟล์</a>`;
            }

            listDiv.insertAdjacentHTML('beforeend', `
                <div class="profile-item" style="position: relative; overflow: hidden; background: #2f3136; border-radius: 8px; margin-bottom: 12px; min-height: 120px;">
                    <div class="card-banner" style="position: absolute; top: 0; left: 0; width: 100%; height: 60px; z-index: 0; ${finalBanner}"></div>
                    <div class="user-info" style="position: relative; z-index: 1; padding: 45px 15px 10px 15px; display: flex; align-items: center; gap: 15px;">
                        <img src="${savedData?.avatar || 'img/profile.jpg'}" style="width: 65px; height: 65px; border-radius: 50%; border: 4px solid #2f3136; object-fit: cover;">
                        <div style="margin-top: 15px;">
                            <div style="color: white; font-weight: bold;">${savedData?.name || "Username " + idStr}</div>
                            <div style="color: #b9bbbe; font-size: 0.85em;">@${idStr.padStart(4, '0')}</div>
                        </div>
                    </div>
                    <div style="position: relative; z-index: 1; padding: 0 15px 15px 15px;">${actionBtn}</div>
                </div>
            `);
        }
    } catch (e) {
        listDiv.innerHTML = '<p style="text-align:center; color: white;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
        console.error(e);
    }
}

// ส่วนของ Admin Reset
window.openAuthModal = () => document.getElementById('adminAuthModal').style.display = 'flex';
window.closeAuthModal = () => {
    document.getElementById('adminAuthModal').style.display = 'none';
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
};

window.verifyAndReset = async () => {
    if (document.getElementById('adminUser').value === "admin" && document.getElementById('adminPass').value === "admin") {
        if (confirm("ล้างข้อมูลทั้งหมด?")) {
            await remove(ref(db, 'members'));
            localStorage.clear();
            location.reload();
        }
    } else { alert("รหัสผ่านผิด"); }
};

renderList();
