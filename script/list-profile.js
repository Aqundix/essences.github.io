const listDiv = document.getElementById('member-list');
const dbName = "ProfileDB";
const storeName = "member_data";

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
    listDiv.innerHTML = '<p style="text-align:center;">กำลังโหลดข้อมูลสมาชิก...</p>';
    try {
        const db = await initDB();
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const allRecordsRequest = store.getAll();

        allRecordsRequest.onsuccess = () => {
            const allData = allRecordsRequest.result;
            listDiv.innerHTML = '';
            
            // ดึง ID ที่เครื่องนี้เป็นเจ้าของจาก localStorage
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

                // --- ส่วนคำนวณปุ่ม Action ตามเงื่อนไขสิทธิ์ ---
                let actionButton = '';
                const isLockedByOthers = userData.isLocked && myOwnedProfile !== idStr;
                const isLockedByMe = myOwnedProfile === idStr;

                if (isLockedByOthers) {
                    // 1. ถ้ามีคนอื่นจองไปแล้ว
                    actionButton = `<span class="view-link" style="background: #ed4245; cursor: not-allowed; opacity: 0.8;">ถูกจองแล้ว</span>`;
                } else if (isLockedByMe) {
                    // 2. ถ้าเครื่องเราเป็นเจ้าของ ID นี้
                    actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link" style="background: #43b581;">แก้ไขของคุณ</a>`;
                } else if (myOwnedProfile && !isLockedByMe) {
                    // 3. ถ้าเครื่องเราจองอันอื่นไปแล้ว แต่อันนี้ยังว่างอยู่ (ก็กดไม่ได้)
                    actionButton = `<span class="view-link" style="background: #4f545c; cursor: not-allowed; opacity: 0.5;">จำกัด 1 สิทธิ์</span>`;
                } else {
                    // 4. ยังไม่มีใครจอง และเครื่องนี้ยังไม่ได้จองใคร
                    actionButton = `<a href="page/profile.html?id=${idStr}" class="view-link">จัดการโปรไฟล์</a>`;
                }
                // ตรวจสอบว่ามีข้อมูลแบนเนอร์จริง และไม่ใช่ค่าว่าง หรือคำว่า "none"
                const hasBanner = userData.banner && 
                    userData.banner !== "" && 
                    userData.banner !== "none" && 
                    userData.banner !== "undefined";

                // สร้างแท็ก Banner เฉพาะเมื่อมีข้อมูลรูปภาพเท่านั้น
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

/** ระบบจัดการ Modal สำหรับ Admin **/
function openAuthModal() { 
    document.getElementById('adminAuthModal').style.display = 'flex'; 
}

function closeAuthModal() { 
    document.getElementById('adminAuthModal').style.display = 'none'; 
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
}

/** ยืนยันรหัสผ่านและล้างข้อมูลทั้งหมด (Reset ระบบ) **/
async function verifyAndReset() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;

    if (user === "admin" && pass === "admin") {
        if (confirm("ยืนยันการล้างข้อมูลและปลดล็อกโปรไฟล์ทั้งหมด?")) {
            const db = await initDB();
            const transaction = db.transaction(storeName, "readwrite");
            const store = transaction.objectStore(storeName);
            
            store.clear().onsuccess = () => {
                // ล้าง localStorage ของ admin เอง และรีเฟรชหน้าเพื่อให้ระบบเริ่มใหม่
                localStorage.clear();
                alert("รีเซ็ตระบบเรียบร้อย! ทุกโปรไฟล์เปิดว่างแล้ว");
                closeAuthModal();
                location.reload(); 
            };
        }
    } else { 
        alert("Username หรือ Password ไม่ถูกต้อง"); 
    }
}

// ปิด Modal เมื่อคลิกนอกกรอบ
window.onclick = (e) => { 
    if (e.target.id === 'adminAuthModal') closeAuthModal(); 
}

// เริ่มต้นโหลดรายการเมื่อเปิดหน้าเว็บ
renderList();
