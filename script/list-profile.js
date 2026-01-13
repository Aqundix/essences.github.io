const listDiv = document.getElementById('member-list');
const dbName = "ProfileDB";
const storeName = "member_data";

const firebaseConfig = {
    apiKey: "AIzaSyBXf1-WXXaPd_IModQCbBI8NwvsZ1rgJWU",
    authDomain: "aqundix-d3f38.firebaseapp.com",
    projectId: "aqundix-d3f38",
    storageBucket: "aqundix-d3f38.firebasestorage.app",
    messagingSenderId: "923430604932",
    appId: "1:923430604932:web:a06344e33b3df87aef72d1",
    measurementId: "G-NC6SKF25ZB"
};

/** เชื่อมต่อฐานข้อมูล IndexedDB **/
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: "id" });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject("Database error");
    });
}

/** ดึงรายชื่อสมาชิกมาแสดงผลพร้อมระบบตรวจสอบสิทธิ์ **/
async function renderList() {
    if (!listDiv) return;
    
    try {
        const db = await initDB();
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const allRecordsRequest = store.getAll();

        allRecordsRequest.onsuccess = () => {
            const allData = allRecordsRequest.result;
            listDiv.innerHTML = '';
            
            const myOwnedProfile = localStorage.getItem('my_owned_profile');

            for (let i = 1; i <= 15; i++) {
                const idStr = i.toString();
                const savedData = allData.find(item => item.id === idStr);
                const defaultAvatar = "img/profile.jpg"; 

                let userData = {
                    name: "ยังไม่ได้ตั้งชื่อ",
                    tag: `@${idStr.padStart(4, '0')}`,
                    avatar: defaultAvatar, 
                    banner: "",
                    isLocked: false
                };

                if (savedData) {
                    userData.name = savedData.name || userData.name;
                    userData.avatar = (savedData.avatar && savedData.avatar !== "none") ? savedData.avatar : defaultAvatar;
                    userData.isLocked = savedData.isLocked || false;
                    
                    let rawBanner = savedData.banner || "";
                    userData.banner = rawBanner.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
                }

                // --- Logic การจัดการสิทธิ์ปุ่ม ---
                let actionButton = '';
                const isLockedByOthers = userData.isLocked && myOwnedProfile !== idStr;
                const isLockedByMe = myOwnedProfile === idStr;

                if (isLockedByOthers) {
                    actionButton = `<span class="view-link locked">ถูกจองแล้ว</span>`;
                } else if (isLockedByMe) {
                    actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link owned">แก้ไขของคุณ</a>`;
                } else if (myOwnedProfile && !isLockedByMe) {
                    actionButton = `<span class="view-link limit">จำกัด 1 สิทธิ์</span>`;
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
        };
    } catch (e) {
        listDiv.innerHTML = '<p style="text-align:center;">ไม่สามารถโหลดข้อมูลได้</p>';
    }
}

/** ใหม่: ระบบอัปเดตข้อมูลอัตโนมัติเมื่อกลับมาที่หน้าเดิม **/
window.addEventListener('focus', () => {
    renderList(); // โหลดข้อมูลใหม่ทันทีที่ผู้ใช้สลับหน้ากลับมา
});

/** ระบบ Admin และ Reset **/
function openAuthModal() { document.getElementById('adminAuthModal').style.display = 'flex'; }
function closeAuthModal() { 
    document.getElementById('adminAuthModal').style.display = 'none'; 
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
}

async function verifyAndReset() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;

    if (user === "admin" && pass === "admin") {
        if (confirm("ยืนยันการล้างข้อมูลและปลดล็อกโปรไฟล์ทั้งหมด?")) {
            const db = await initDB();
            const transaction = db.transaction(storeName, "readwrite");
            const store = transaction.objectStore(storeName);
            
            store.clear().onsuccess = () => {
                localStorage.clear();
                alert("รีเซ็ตระบบเรียบร้อย!");
                location.reload(); 
            };
        }
    } else { alert("รหัสผ่านไม่ถูกต้อง"); }
}

window.onclick = (e) => { if (e.target.id === 'adminAuthModal') closeAuthModal(); }

// รันครั้งแรกเมื่อโหลดหน้า
renderList();
