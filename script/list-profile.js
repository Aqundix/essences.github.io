import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// เพิ่ม "remove" ในการ import
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

            // --- แก้ไข Logic Banner ให้แม่นยำขึ้น ---
            let bannerDisplay = "background-color: #5865f2;"; 
            if (savedData?.banner && savedData.banner !== "none" && savedData.banner !== "") {
                // ตรวจสอบว่ามี url() ครอบอยู่หรือยัง ถ้าไม่มีให้เติม
                const bVal = savedData.banner.includes('url(') ? savedData.banner : `url("${savedData.banner}")`;
                bannerDisplay = `background-image: ${bVal}; background-size: cover; background-position: center;`;
            }

            const isLocked = savedData?.isLocked || false;
            const isOwner = myOwnedProfile === idStr;

            let actionButton = '';
            if (isLocked && !isOwner) {
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #ed4245;">ดูโปรไฟล์</a>`;
            } else if (isOwner) {
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #43b581;">แก้ไขของคุณ</a>`;
            } else if (myOwnedProfile && myOwnedProfile !== idStr) {
                actionButton = `<span class="view-link" style="background: #4f545c; cursor: not-allowed; opacity: 0.6;">จำกัด 1 สิทธิ์</span>`;
            } else {
                actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link">จัดการโปรไฟล์</a>`;
            }

            const itemHTML = `
                <div class="profile-item" style="position: relative; overflow: hidden; background: #2f3136; border-radius: 8px; margin-bottom: 12px; min-height: 120px; border: 1px solid #444;">
                    <div class="card-banner" style="position: absolute; top: 0; left: 0; width: 100%; height: 60px; z-index: 0; ${bannerDisplay}"></div>
                    
                    <div class="user-info" style="position: relative; z-index: 1; padding: 45px 15px 10px 15px; display: flex; align-items: center; gap: 15px;">
                        <img src="${savedData?.avatar || defaultAvatar}" 
                             style="width: 65px; height: 65px; border-radius: 50%; border: 4px solid #2f3136; background: #2f3136; object-fit: cover;"
                             onerror="this.src='${defaultAvatar}'">
                        <div class="name-details" style="margin-top: 15px;">
                            <div class="name" style="color: white; font-weight: bold; font-size: 1.1em;">${savedData?.name || "Username " + idStr}</div>
                            <div class="tag" style="color: #b9bbbe; font-size: 0.85em;">@${idStr.padStart(4, '0')}</div>
                        </div>
                    </div>

                    <div style="position: relative; z-index: 1; padding: 5px 15px 15px 15px;">
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

// --- ส่วน Admin Functions ---

window.openAuthModal = function() { 
    const modal = document.getElementById('adminAuthModal');
    if(modal) modal.style.display = 'flex'; 
};

window.closeAuthModal = function() { 
    const modal = document.getElementById('adminAuthModal');
    if(modal) {
        modal.style.display = 'none'; 
        document.getElementById('adminUser').value = '';
        document.getElementById('adminPass').value = '';
    }
};

window.verifyAndReset = async function() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;

    if (user === "admin" && pass === "admin") {
        if (confirm("!!! คำเตือน !!!\nยืนยันการล้างข้อมูลทั้งหมดบน Server? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
            try {
                // เรียกใช้ remove() ที่ Import มาแล้ว
                await remove(ref(db, 'members'));
                localStorage.clear();
                alert("รีเซ็ตระบบเรียบร้อยแล้ว!");
                location.reload(); 
            } catch (e) {
                alert("เกิดข้อผิดพลาดขณะลบข้อมูล: " + e.message);
            }
        }
    } else { 
        alert("รหัสผ่านไม่ถูกต้อง"); 
    }
};

// ปิด Modal เมื่อคลิกข้างนอก
window.addEventListener('click', (e) => {
    const modal = document.getElementById('adminAuthModal');
    if (e.target === modal) window.closeAuthModal();
});

// รันครั้งแรกเมื่อโหลดหน้า
renderList();
// รีเฟรชข้อมูลเมื่อหน้าต่างกลับมาได้รับความสนใจ (Focus)
window.addEventListener('focus', renderList);
