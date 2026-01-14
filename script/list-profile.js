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
            
            // การจัดการสไตล์ Banner
            let finalBannerStyle = "background-color: #5865f2;"; 
            if (savedData?.banner && savedData.banner !== "none" && savedData.banner !== "") {
                const bUrl = savedData.banner.includes('url(') ? savedData.banner : `url("${savedData.banner}")`;
                finalBannerStyle = `background-image: ${bUrl}; background-size: cover; background-position: center;`;
            }

            const isLocked = savedData?.isLocked || false;
            const isOwner = myOwnedProfile === idStr;
            let actionBtn = '';

            if (isLocked && !isOwner) {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #ed4245;">ดูโปรไฟล์</a>`;
            } else if (isOwner) {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #43b581;">แก้ไขของคุณ</a>`;
            } else if (myOwnedProfile) {
                actionBtn = `<span class="view-link" style="background: #4f545c; opacity: 0.6; cursor: not-allowed;">จำกัด 1 สิทธิ์</span>`;
            } else {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link">จัดการโปรไฟล์</a>`;
            }

            // HTML Structure สำหรับ Card แบบใหม่
            const itemHTML = `
                <div class="profile-item">
                    <div class="card-banner" style="${finalBannerStyle}"></div>
                    <div class="banner-overlay"></div>
                    <div class="user-content">
                        <div class="user-info-main">
                            <img src="${savedData?.avatar || 'img/profile.jpg'}" class="avatar-img" onerror="this.src='img/profile.jpg'">
                            <div class="name-details">
                                <div class="user-name">${savedData?.name || "ยังไม่ได้ตั้งชื่อ"}</div>
                                <div class="user-tag">@${idStr.padStart(4, '0')}</div>
                            </div>
                        </div>
                        <div class="button-area">${actionBtn}</div>
                    </div>
                </div>
            `;
            listDiv.insertAdjacentHTML('beforeend', itemHTML);
        }
    } catch (e) {
        listDiv.innerHTML = '<p style="text-align:center; color: white;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
        console.error(e);
    }
}

// ส่วนงาน Admin
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
window.addEventListener('focus', renderList);
