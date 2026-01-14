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

// ฟังก์ชันสุ่มตัวเลขแบบคงที่ (เพื่อให้โปรไฟล์เดิมได้เลข ID เดิมทุกครั้งที่โหลดหน้าเว็บ)
function getPersistentTag(seed) {
    // ใช้สูตรคณิตศาสตร์สร้างเลขสุ่มจากค่า Index (Seed)
    const val = (parseInt(seed) * 48271) % 9000; 
    return (val + 1000).toString().padStart(4, '0'); // ผลลัพธ์ 1000 - 9999
}

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
            const tagId = getPersistentTag(idStr); // เรียกใช้ฟังก์ชันสุ่ม ID
            
            // การจัดการ Banner
            let bannerStyle = "background-color: #5865f2;";
            if (savedData?.banner && savedData.banner !== "" && savedData.banner !== "none") {
                bannerStyle = `background-image: url('${savedData.banner}'); background-size: cover; background-position: center;`;
            }
        
            const isLocked = savedData?.isLocked || false;
            const isOwner = myOwnedProfile === idStr;
            let actionBtn = '';
        
            // เงื่อนไขการแสดงผลปุ่ม
            if (isLocked && !isOwner) {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link locked">ดูโปรไฟล์</a>`;
            } else if (isOwner) {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link owned">แก้ไขของคุณ</a>`;
            } else if (myOwnedProfile && myOwnedProfile !== idStr) {
                actionBtn = `<span class="view-link limit">หมดสิทธิ์</span>`;
            } else {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link">จัดการโปรไฟล์</a>`;
            }
        
            // โครงสร้าง HTML แบบพรีเมียม (สอดคล้องกับ CSS ใหม่)
            const itemHTML = `
                <div class="profile-item">
                    <div class="card-banner" style="${bannerStyle}"></div>
                    <div class="banner-overlay"></div>
                    <div class="content-wrapper">
                        <div class="user-info-side">
                            <img src="${savedData?.avatar || 'img/profile.jpg'}" class="avatar-img" onerror="this.src='img/profile.jpg'">
                            <div class="name-details">
                                <span class="name">${savedData?.name || "ยังไม่มีชื่อ"}</span>
                                <span class="tag">@${tagId}</span>
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
        listDiv.innerHTML = '<p style="text-align:center; color: white; padding: 20px;">เกิดข้อผิดพลาดในการเชื่อมต่อ</p>';
        console.error("Firebase Error:", e);
    }
}

// --- Admin System ---
window.openAuthModal = () => {
    const modal = document.getElementById('adminAuthModal');
    if(modal) modal.style.display = 'flex';
};

window.closeAuthModal = () => {
    const modal = document.getElementById('adminAuthModal');
    if(modal) modal.style.display = 'none';
};

window.verifyAndReset = async () => {
    const u = document.getElementById('adminUser').value;
    const p = document.getElementById('adminPass').value;
    if (u === "admin" && p === "admin") {
        if (confirm("⚠️ คำเตือน: คุณกำลังจะล้างข้อมูลทั้ง 15 โปรไฟล์ ยืนยันหรือไม่?")) {
            try {
                await remove(ref(db, 'members'));
                localStorage.clear();
                alert("รีเซ็ตระบบเรียบร้อย");
                location.reload();
            } catch (err) {
                alert("ไม่สามารถลบข้อมูลได้: " + err.message);
            }
        }
    } else { 
        alert("ชื่อผู้ใช้หรือรหัสผ่าน Admin ไม่ถูกต้อง"); 
    }
};

// เริ่มการทำงาน
renderList();

// เมื่อ User สลับ Tab กลับมา ให้รีเฟรชข้อมูลอัตโนมัติ
window.addEventListener('focus', renderList);
