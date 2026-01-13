// 1. นำเข้า Firebase SDK แบบ CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 2. ตั้งค่า Firebase Config
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

/** ดึงรายชื่อสมาชิกมาแสดงผล **/
// ... (ส่วน Import และ Config เหมือนเดิม) ...

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
            const defaultAvatar = "img/profile.jpg"; 

            let userData = {
                name: savedData?.name || "ยังไม่ได้ตั้งชื่อ",
                tag: `@${idStr.padStart(4, '0')}`,
                avatar: (savedData?.avatar && savedData.avatar !== "none") ? savedData.avatar : defaultAvatar, 
                banner: savedData?.banner || "", // ดึงค่า Banner
                isLocked: savedData?.isLocked || false
            };

            // --- Logic การจัดการสิทธิ์ 1 คนต่อ 1 สิทธิ์ ---
            let actionButton = '';
            const isLockedByMe = myOwnedProfile === idStr;

            if (userData.isLocked && !isLockedByMe) {
                // โปรไฟล์นี้คนอื่นจองแล้ว
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #ed4245;">ดูโปรไฟล์ (จองแล้ว)</a>`;
            } else if (isLockedByMe) {
                // โปรไฟล์นี้เป็นของคุณ
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #43b581;">แก้ไขของคุณ</a>`;
            } else if (myOwnedProfile && myOwnedProfile !== idStr) {
                // คุณจองไอดีอื่นไปแล้ว (จำกัดสิทธิ์)
                actionButton = `<span class="view-link" style="background: #4f545c; cursor: not-allowed; opacity: 0.5;">จำกัด 1 สิทธิ์</span>`;
            } else {
                // ยังว่างและคุณยังไม่มีการจอง
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link">จัดการโปรไฟล์</a>`;
            }

            // จัดการเรื่องรูปแบนเนอร์ให้แสดงผล
            const hasBanner = userData.banner && userData.banner !== "" && userData.banner !== "none";
            // ถ้ามี Banner ให้แสดงเป็น img tag หรือใช้สไตล์ background
            const bannerHTML = hasBanner ? `<div class="banner-bg" style="background-image: ${userData.banner}; background-size: cover; background-position: center; height: 60px; width: 100%; position: absolute; top: 0; left: 0; z-index: 0;"></div>` : '';

            const itemHTML = `
                <div class="profile-item" style="position: relative; overflow: hidden; padding-top: 40px;">
                    ${bannerHTML}
                    <div class="user-info" style="position: relative; z-index: 1;">
                        <img src="${userData.avatar}" onerror="this.onerror=null; this.src='${defaultAvatar}';">
                        <div class="name-details">
                            <span class="name">${userData.name}</span>
                            <span class="tag">${userData.tag}</span>
                        </div>
                    </div>
                    <div style="position: relative; z-index: 1;">
                        ${actionButton}
                    </div>
                </div>
            `;
            listDiv.insertAdjacentHTML('beforeend', itemHTML);
        }
    } catch (e) {
        console.error(e);
        listDiv.innerHTML = '<p style="text-align:center; color: white;">ดึงข้อมูลล้มเหลว</p>';
    }
}

// ผูกฟังก์ชันเข้ากับหน้าต่าง (window) เพื่อให้ HTML เรียกใช้งานได้
window.openAuthModal = function() { 
    document.getElementById('adminAuthModal').style.display = 'flex'; 
};

window.closeAuthModal = function() { 
    document.getElementById('adminAuthModal').style.display = 'none'; 
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
};

window.verifyAndReset = async function() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;

    if (user === "admin" && pass === "admin") {
        if (confirm("ยืนยันการล้างข้อมูลทั้งหมดบน Server?")) {
            try {
                await remove(ref(db, 'members'));
                localStorage.clear();
                alert("รีเซ็ตระบบเรียบร้อย!");
                location.reload(); 
            } catch (e) {
                alert("เกิดข้อผิดพลาด: " + e.message);
            }
        }
    } else { 
        alert("รหัสผ่านไม่ถูกต้อง"); 
    }
};

window.onclick = (e) => { 
    if (e.target.id === 'adminAuthModal') window.closeAuthModal(); 
};

window.addEventListener('focus', renderList);
renderList();
