// 1. นำเข้า Firebase SDK แบบ CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 2. ตั้งค่า Firebase Config (จากข้อมูลที่คุณให้มา)
const firebaseConfig = {
    apiKey: "AIzaSyBXf1-WXXaPd_IModQCbBI8NwvsZ1rgJWU",
    authDomain: "aqundix-d3f38.firebaseapp.com",
    projectId: "aqundix-d3f38",
    storageBucket: "aqundix-d3f38.firebasestorage.app",
    messagingSenderId: "923430604932",
    appId: "1:923430604932:web:a06344e33b3df87aef72d1",
    measurementId: "G-NC6SKF25ZB"
};

// เริ่มต้น Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const listDiv = document.getElementById('member-list');

/** ดึงรายชื่อสมาชิกมาแสดงผลจาก Firebase **/
async function renderList() {
    if (!listDiv) return;
    listDiv.innerHTML = '<p style="text-align:center; color: white;">กำลังโหลดข้อมูลจาก Server...</p>';
    
    try {
        // ดึงข้อมูลทั้งหมดจาก Path "members" ใน Firebase
        const snapshot = await get(ref(db, 'members'));
        const allData = snapshot.exists() ? snapshot.val() : {};

        listDiv.innerHTML = '';
        const myOwnedProfile = localStorage.getItem('my_owned_profile');

        for (let i = 1; i <= 15; i++) {
            const idStr = i.toString();
            // ดึงข้อมูลสมาชิกจาก Firebase ตาม ID
            const savedData = allData[idStr];
            
            const defaultAvatar = "img/profile.jpg"; 

            let userData = {
                name: savedData?.name || "ยังไม่ได้ตั้งชื่อ",
                tag: `@${idStr.padStart(4, '0')}`,
                avatar: (savedData?.avatar && savedData.avatar !== "none") ? savedData.avatar : defaultAvatar, 
                banner: savedData?.banner || "",
                isLocked: savedData?.isLocked || false
            };

            // จัดการเรื่องรูปแบนเนอร์
            if (userData.banner) {
                userData.banner = userData.banner.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
            }

            // --- Logic การจัดการสิทธิ์ปุ่ม ---
            let actionButton = '';
            const isLockedByOthers = userData.isLocked && myOwnedProfile !== idStr;
            const isLockedByMe = myOwnedProfile === idStr;

            if (isLockedByOthers) {
                actionButton = `<span class="view-link locked" style="background: #ed4245; cursor: not-allowed; opacity: 0.8;">ถูกจองแล้ว</span>`;
            } else if (isLockedByMe) {
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link owned" style="background: #43b581;">แก้ไขของคุณ</a>`;
            } else if (myOwnedProfile && !isLockedByMe) {
                actionButton = `<span class="view-link limit" style="background: #4f545c; cursor: not-allowed; opacity: 0.5;">จำกัด 1 สิทธิ์</span>`;
            } else {
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link">จัดการโปรไฟล์</a>`;
            }

            const hasBanner = userData.banner && userData.banner !== "" && userData.banner !== "none";
            const bannerTag = hasBanner ? `<img src="${userData.banner}" class="banner-bg">` : '';

            const itemHTML = `
                <div class="profile-item">
                    ${bannerTag}
                    <div class="user-info">
                        <img src="${userData.avatar}" onerror="this.onerror=null; this.src='${defaultAvatar}';">
                        <div class="name-details">
                            <span class="name">${userData.name}</span>
                            <span class="tag">${userData.tag}</span>
                        </div>
                    </div>
                    ${actionButton}
                </div>
            `;
            listDiv.insertAdjacentHTML('beforeend', itemHTML);
        }
    } catch (e) {
        console.error("Firebase Error:", e);
        listDiv.innerHTML = '<p style="text-align:center; color: white;">ไม่สามารถดึงข้อมูลจาก Server ได้</p>';
    }
}

/** ระบบอัปเดตข้อมูลอัตโนมัติเมื่อกลับมาที่หน้าเดิม **/
window.addEventListener('focus', () => {
    renderList(); 
});

/** ระบบ Admin สำหรับ Reset ข้อมูล (ใน Firebase) **/
window.openAuthModal = function() { 
    document.getElementById('adminAuthModal').style.display = 'flex'; 
}

window.closeAuthModal = function() { 
    document.getElementById('adminAuthModal').style.display = 'none'; 
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
}

window.verifyAndReset = async function() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;

    if (user === "admin" && pass === "admin") {
        if (confirm("ยืนยันการล้างข้อมูลทั้งหมดบน Server?")) {
            try {
                // คำสั่งลบข้อมูลใน Path "members" ทั้งหมดบน Firebase
                const { getDatabase, ref, remove } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js");
                await remove(ref(getDatabase(), 'members'));
                
                localStorage.clear();
                alert("รีเซ็ตระบบบน Cloud เรียบร้อย!");
                location.reload(); 
            } catch (e) {
                alert("เกิดข้อผิดพลาดในการรีเซ็ต: " + e.message);
            }
        }
    } else { 
        alert("รหัสผ่านไม่ถูกต้อง"); 
    }
}

window.onclick = (e) => { 
    if (e.target.id === 'adminAuthModal') window.closeAuthModal(); 
}

// รันครั้งแรกเมื่อโหลดหน้า
renderList();
