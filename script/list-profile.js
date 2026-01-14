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

        // ค้นหาส่วน loop ในไฟล์ list-profile.js แล้วแทนที่ด้วยโค้ดนี้
        for (let i = 1; i <= 15; i++) {
            const idStr = i.toString();
            const savedData = allData[idStr];
            
            // ตั้งค่า Banner (ถ้าไม่มีให้ใช้สีพื้นฐาน)
            let bannerStyle = "background-color: #5865f2;";
            if (savedData?.banner && savedData.banner !== "" && savedData.banner !== "none") {
                // ใช้ backgroundImage และครอบด้วย url() ให้เรียบร้อย
                // หาก savedData.banner เป็น base64 หรือ URL ของ GIF ระบบจะจัดการให้เอง
                bannerStyle = `background-image: url('${savedData.banner}'); background-size: cover; background-position: center;`;
                        }
        
            const isLocked = savedData?.isLocked || false;
            const isOwner = myOwnedProfile === idStr;
            let actionBtn = '';
        
            if (isLocked && !isOwner) {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link locked">ดูโปรไฟล์</a>`;
            } else if (isOwner) {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link owned">แก้ไขของคุณ</a>`;
            } else if (myOwnedProfile && myOwnedProfile !== idStr) {
                actionBtn = `<span class="view-link limit">ไม่มีสิทธิ์จอง</span>`;
            } else {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link">จัดการโปรไฟล์</a>`;
            }
        
            const itemHTML = `
                <div class="profile-item">
                    <div class="card-banner" style="${bannerStyle}"></div>
                    <div class="banner-overlay"></div>
                    <div class="user-content-wrapper">
                        <div class="user-info-side">
                            <img src="${savedData?.avatar || 'img/profile.jpg'}" class="avatar-img" onerror="this.src='img/profile.jpg'">
                            <div class="name-details">
                                <span class="name">${savedData?.name || "ยังไม่ได้ตั้งชื่อ"}</span>
                                <span class="tag">@${idStr.padStart(4, '0')}</span>
                            </div>
                        </div>
                        <div class="button-side">
                            ${actionBtn}
                        </div>
                    </div>
                </div>
            `;
            listDiv.insertAdjacentHTML('beforeend', itemHTML);
        }
    } catch (e) {
        listDiv.innerHTML = '<p style="text-align:center; color: white; padding: 20px;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
        console.error("Firebase Error:", e);
    }
}

// Admin functions
window.openAuthModal = () => document.getElementById('adminAuthModal').style.display = 'flex';
window.closeAuthModal = () => document.getElementById('adminAuthModal').style.display = 'none';
window.verifyAndReset = async () => {
    const u = document.getElementById('adminUser').value;
    const p = document.getElementById('adminPass').value;
    if (u === "admin" && p === "admin") {
        if (confirm("ล้างข้อมูลทั้งหมด?")) {
            await remove(ref(db, 'members'));
            localStorage.clear();
            location.reload();
        }
    } else { alert("รหัสผิด"); }
};

renderList();
window.addEventListener('focus', renderList);
