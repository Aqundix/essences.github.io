import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, remove, query, limitToFirst } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// ฟังก์ชันสุ่มตัวเลขแบบคงที่
function getPersistentTag(seed) {
    const val = (parseInt(seed) * 48271) % 9000; 
    return (val + 1000).toString().padStart(4, '0');
}

// --- ฟังก์ชันหลักในการแสดงผล (รวม Query Limit เพื่อความเร็ว) ---
async function renderList() {
    if (!listDiv) return;

    try {
        // 1. ใช้ Query ดึงแค่ 15-20 คนแรก เพื่อความรวดเร็วสูงสุด
        const membersRef = ref(db, 'members');
        const membersQuery = query(membersRef, limitToFirst(15)); 
        const snapshot = await get(membersQuery);
        
        const allData = snapshot.exists() ? snapshot.val() : {};
        const myOwnedProfile = localStorage.getItem('my_owned_profile');
        
        // ล้างข้อมูลเก่าก่อนแสดงผลใหม่
        listDiv.innerHTML = '';

        // 2. วนลูปสร้างการ์ด (ใช้ข้อมูลจาก Snapshot)
        for (let i = 1; i <= 15; i++) {
            const idStr = i.toString();
            const savedData = allData[idStr];
            const tagId = getPersistentTag(idStr);
            
            // การจัดการ Banner (ใช้สีพื้นฐานถ้าไม่มีรูป เพื่อให้โหลดเร็ว)
            let bannerStyle = "background-color: #5865f2;";
            if (savedData?.banner) {
                bannerStyle = `background-image: url('${savedData.banner}'); background-size: cover; background-position: center;`;
            }
        
            const isLocked = savedData?.isLocked || false;
            const isOwner = myOwnedProfile === idStr;
            let actionBtn = '';
        
            // เงื่อนไขปุ่ม
            if (isLocked && !isOwner) {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link locked">ดูโปรไฟล์</a>`;
            } else if (isOwner) {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link owned">แก้ไขของคุณ</a>`;
            } else if (myOwnedProfile && myOwnedProfile !== idStr) {
                actionBtn = `<span class="view-link limit">หมดสิทธิ์</span>`;
            } else {
                actionBtn = `<a href="page/profile.html?id=${idStr}" class="view-link">จัดการโปรไฟล์</a>`;
            }
        
            // รูป Avatar (เพิ่ม Loading='lazy' เพื่อความเร็ว)
            const avatarSrc = savedData?.avatar || "img/placeholder.jpg";

            const itemHTML = `
                <div class="profile-item">
                    <div class="card-banner" style="${bannerStyle}"></div>
                    <div class="banner-overlay"></div>
                    <div class="content-wrapper">
                        <div class="user-info-side">
                            <img class="avatar" src="${avatarSrc}" loading="lazy" alt="profile">
                            <div class="name-details">
                                <span class="name">${savedData?.name || "ว่างเปล่า"}</span>
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
        listDiv.innerHTML = '<p style="text-align:center; color: white; padding: 20px;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
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
    if (u === "admin0751" && p === "admin0751") {
        if (confirm("⚠️ คำเตือน: คุณกำลังจะล้างข้อมูลโปรไฟล์ทั้งหมด ยืนยันหรือไม่?")) {
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
        alert("รหัสผ่านไม่ถูกต้อง"); 
    }
};

// เริ่มการทำงาน
renderList();

// ปรับปรุง: ไม่แนะนำให้ใช้ window focus รีเฟรชข้อมูล 'ทั้งหมด' เพราะจะเปลือง Bandwidth 
// ให้รีเฟรชเฉพาะเวลาจำเป็นจริงๆ หรือใช้ปุ่มกดดีกว่า
