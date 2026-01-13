import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
            const defaultAvatar = "img/profile.jpg"; 

            let userData = {
                name: savedData?.name || "ยังไม่ได้ตั้งชื่อ",
                tag: `@${idStr.padStart(4, '0')}`,
                avatar: (savedData?.avatar && savedData.avatar !== "none") ? savedData.avatar : defaultAvatar, 
                banner: savedData?.banner || "", 
                isLocked: savedData?.isLocked || false
            };

            // --- แก้ไข Logic การจำกัดสิทธิ์ 1 คนต่อ 1 โปรไฟล์ ---
            let actionButton = '';
            const isLockedByMe = myOwnedProfile === idStr;

            if (userData.isLocked && !isLockedByMe) {
                // กรณีโปรไฟล์นี้คนอื่นจองแล้ว
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #ed4245;">ดูโปรไฟล์ (จองแล้ว)</a>`;
            } else if (isLockedByMe) {
                // กรณีโปรไฟล์นี้เป็นของเราเอง
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #43b581;">แก้ไขของคุณ</a>`;
            } else if (myOwnedProfile && myOwnedProfile !== idStr) {
                // กรณีเรามีโปรไฟล์อื่นอยู่แล้ว จะไม่สามารถกดจัดการอันนี้ได้
                actionButton = `<span class="view-link" style="background: #4f545c; cursor: not-allowed; opacity: 0.5;">จำกัด 1 สิทธิ์</span>`;
            } else {
                // กรณีว่าง และเรายังไม่มีการจองใดๆ
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link">จัดการโปรไฟล์</a>`;
            }

            // --- แก้ไขให้รูปปก (Banner) แสดงผล ---
            // ตรวจสอบว่า banner มีข้อมูลและไม่ใช่ค่า "none"
            const hasBanner = userData.banner && userData.banner !== "" && userData.banner !== "none";
            // ใช้สไตล์ inline เพื่อดึงรูปมาทำเป็นพื้นหลังส่วนบนของ Card
            const bannerHTML = hasBanner ? `<div class="banner-bg" style="background-image: ${userData.banner}; background-size: cover; background-position: center; height: 60px; width: 100%; position: absolute; top: 0; left: 0; border-radius: 8px 8px 0 0;"></div>` : '';

            const itemHTML = `
                <div class="profile-item" style="position: relative; overflow: hidden; padding-top: 45px; background: #2f3136; border-radius: 8px; margin-bottom: 10px;">
                    ${bannerHTML}
                    <div class="user-info" style="position: relative; z-index: 1; padding: 10px;">
                        <img src="${userData.avatar}" onerror="this.onerror=null; this.src='${defaultAvatar}';" style="width: 50px; height: 50px; border-radius: 50%; border: 3px solid #2f3136;">
                        <div class="name-details">
                            <span class="name" style="color: white; font-weight: bold;">${userData.name}</span>
                            <span class="tag" style="color: #b9bbbe; font-size: 0.8em;">${userData.tag}</span>
                        </div>
                    </div>
                    <div style="position: relative; z-index: 1; padding: 0 10px 10px 10px;">
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

window.addEventListener('focus', renderList);
renderList();

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
