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

            // ดึงค่า Banner และตรวจสอบความถูกต้อง
            let bannerStyle = "background-color: #5865f2;"; // สีเริ่มต้น
            if (savedData?.banner && savedData.banner !== "none" && savedData.banner !== "") {
                // หากข้อมูลเก็บมาในรูปแบบ url("...") อยู่แล้วให้นำมาใช้เลย
                bannerStyle = `background-image: ${savedData.banner}; background-size: cover; background-position: center;`;
            }

            const isLocked = savedData?.isLocked || false;
            const isOwner = myOwnedProfile === idStr;

            // --- ระบบจำกัดสิทธิ์ 1 คนต่อ 1 โปรไฟล์ ---
            let actionButton = '';
            if (isLocked && !isOwner) {
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #ed4245;">ดูโปรไฟล์</a>`;
            } else if (isOwner) {
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #43b581;">แก้ไขของคุณ</a>`;
            } else if (myOwnedProfile && myOwnedProfile !== idStr) {
                // มีสิทธิ์อื่นอยู่แล้ว ล็อคปุ่มจัดการ
                actionButton = `<span class="view-link" style="background: #4f545c; cursor: not-allowed; opacity: 0.6;">จำกัด 1 สิทธิ์</span>`;
            } else {
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link">จัดการโปรไฟล์</a>`;
            }

            const itemHTML = `
                <div class="profile-item" style="position: relative; overflow: hidden; background: #2f3136; border-radius: 8px; margin-bottom: 12px; min-height: 120px;">
                    <div class="card-banner" style="position: absolute; top: 0; left: 0; width: 100%; height: 50px; z-index: 0; ${bannerStyle}"></div>
                    
                    <div class="user-info" style="position: relative; z-index: 1; padding: 40px 15px 10px 15px; display: flex; align-items: center; gap: 15px;">
                        <img src="${savedData?.avatar || defaultAvatar}" 
                             style="width: 60px; height: 60px; border-radius: 50%; border: 4px solid #2f3136; background: #2f3136;"
                             onerror="this.src='${defaultAvatar}'">
                        <div class="name-details" style="margin-top: 10px;">
                            <div class="name" style="color: white; font-weight: bold; font-size: 1.1em;">${savedData?.name || "Username " + idStr}</div>
                            <div class="tag" style="color: #b9bbbe; font-size: 0.85em;">@${idStr.padStart(4, '0')}</div>
                        </div>
                    </div>

                    <div style="position: relative; z-index: 1; padding: 0 15px 15px 15px;">
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

// โหลดข้อมูลใหม่ทุกครั้งที่กลับมาที่หน้าต่างนี้
window.addEventListener('focus', renderList);
renderList();

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
