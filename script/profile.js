import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
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

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('id') || "1";
const DEFAULT_AVATAR = "../img/profile.jpg";

// --- ฟังก์ชันสุ่ม Tag ID (ต้องเป็นสูตรเดียวกับหน้า list-profile.js) ---
function getPersistentTag(seed) {
    const val = (parseInt(seed) * 48271) % 9000; 
    return (val + 1000).toString().padStart(4, '0'); 
}

// --- ฟังก์ชัน UI ---
window.openModal = () => document.getElementById('editModal').style.display = 'flex';
window.closeModal = () => document.getElementById('editModal').style.display = 'none';

// ฟังก์ชันอัพโหลดรูปจากเครื่อง
window.showPreview = function(input, previewId, isBanner = false) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target.result;
            const preview = document.getElementById(previewId);
            if (isBanner) {
                preview.style.backgroundImage = `url('${result}')`;
            } else {
                preview.src = result;
            }
            preview.dataset.base64 = result; 
        };
        reader.readAsDataURL(file);
    }
};

// --- ฟังก์ชันจัดการ Social Card ---
function updateSocialDisplay(data) {
    const socialCard = document.getElementById('socialCard');
    const items = {
        fb: { item: 'itemFB', link: 'linkFB' },
        ig: { item: 'itemIG', link: 'linkIG' },
        gh: { item: 'itemGH', link: 'linkGH' }
    };

    let hasSocial = false;
    for (const [key, id] of Object.entries(items)) {
        let val = data?.[key];
        const itemEl = document.getElementById(id.item);
        const linkEl = document.getElementById(id.link);
        
        if (val && val.trim() !== "") {
            val = val.trim();
            itemEl.style.display = 'flex';
            // ตรวจสอบและเติม https:// อัตโนมัติป้องกันลิงก์เสีย
            linkEl.href = val.startsWith('http') ? val : `https://${val}`;
            hasSocial = true;
        } else {
            itemEl.style.display = 'none';
        }
    }
    // ถ้ามี social อย่างน้อย 1 อย่างให้แสดง card
    socialCard.style.display = hasSocial ? 'block' : 'none';
}

async function loadProfile() {
    // ดึง userId จาก URL (เช่น ?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (!userId) return;

    // --- ส่วนที่ 1: ดึงจาก Cache (ความเร็วสูง) ---
    const cachedData = localStorage.getItem(`cache_${userId}`);
    if (cachedData) {
        console.log("Loading from cache...");
        renderUI(JSON.parse(cachedData)); // ฟังก์ชันแสดงผลบนหน้าจอที่คุณมีอยู่
    }

    try {
        // --- ส่วนที่ 2: ดึงจาก Firebase (ข้อมูลล่าสุด) ---
        const snapshot = await get(ref(db, 'members/' + userId));
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            // เก็บลง Cache ไว้ใช้ครั้งหน้า
            localStorage.setItem(`cache_${userId}`, JSON.stringify(data));
            
            console.log("Loading from Firebase (Updated Data)...");
            renderUI(data); // อัปเดตหน้าจอด้วยข้อมูลใหม่
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
    }
}

// --- ฟังก์ชันโหลดข้อมูลและเช็คสิทธิ์ ---
async function loadProfile() {
    try {
        const snapshot = await get(ref(db, 'members/' + userId));
        const data = snapshot.exists() ? snapshot.val() : null;
        const myOwnedProfile = localStorage.getItem('my_owned_profile');

// ฟังก์ชันตรวจสอบรหัส Admin
window.verifyAdminAccess = function() {
    const u = document.getElementById('admUser').value;
    const p = document.getElementById('admPass').value;

    if (u === "admin" && p === "admin1234") { // ตั้งรหัสที่นี่
        document.getElementById('adminLoginModal').style.display = 'none';
        document.getElementById('adminMenuModal').style.display = 'flex';
        
        // ล้างค่าในช่องกรอก
        document.getElementById('admUser').value = "";
        document.getElementById('admPass').value = "";
    } else {
        alert("รหัสผ่าน Admin ไม่ถูกต้อง!");
    }
};

// ฟังก์ชัน: แก้ไขโปรไฟล์ผู้อื่น (Bypass ล็อก)
window.adminEditAction = function() {
    document.getElementById('adminMenuModal').style.display = 'none';
    // เปิด Modal แก้ไขที่มีอยู่แล้วขึ้นมาทันที
    window.openModal();
    alert("Admin Mode: คุณสามารถแก้ไขและบันทึกข้อมูลทับโปรไฟล์นี้ได้ทันที");
};

// ฟังก์ชัน: Reset Server (ล้างฐานข้อมูล 'members' ทั้งหมด)
window.adminResetAllAction = async function() {
    if (confirm("⚠️ คำเตือนร้ายแรง: คุณกำลังจะลบข้อมูลผู้ใช้งาน 'ทั้งหมด' ในระบบ ยืนยันหรือไม่?")) {
        try {
            const { getDatabase, ref, remove } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js");
            const database = getDatabase();
            await remove(ref(database, 'members'));
            localStorage.clear();
            alert("รีเซ็ตระบบสำเร็จ ข้อมูลทั้งหมดถูกลบแล้ว");
            location.href = "../index.html";
        } catch (e) {
            alert("Error: " + e.message);
        }
    }
};

        // 1. แสดงหน้าโปรไฟล์หลัก
        document.getElementById('displayName').innerText = data?.name || "Username";
        
        // ใช้ฟังก์ชันสุ่ม Tag ID ให้ตรงกับหน้าลิสต์
        const tagId = getPersistentTag(userId);
        document.getElementById('displayTag').innerText = "@" + tagId;
        
        document.getElementById('displayAbout').innerText = data?.about || "คลิก Edit เพื่อเริ่มแก้ไขโปรไฟล์ของคุณ...";
        document.getElementById('displayAvatar').src = data?.avatar || DEFAULT_AVATAR;
        
        const bannerArea = document.getElementById('displayBanner');
        if (data?.banner && data.banner !== "none") {
            bannerArea.style.backgroundImage = `url('${data.banner}')`;
            bannerArea.style.backgroundColor = "transparent";
        } else {
            bannerArea.style.backgroundColor = "#5865f2";
            bannerArea.style.backgroundImage = "none";
        }

        // เรียกใช้ฟังก์ชันแสดง Social
        updateSocialDisplay(data);

        // 2. เช็คสิทธิ์ปุ่ม Edit และ Restore
        const isLocked = data?.isLocked || false;
        const isOwner = myOwnedProfile === userId;

        // แสดงปุ่ม Edit ถ้ายังไม่มีใครจอง หรือ เราเป็นเจ้าของ
        if (!isLocked || isOwner) {
            const editBtn = document.getElementById('editBtn');
            if(editBtn) editBtn.style.display = 'flex';
        }
        
        // แสดงปุ่มคืนสิทธิ์เฉพาะเจ้าของเท่านั้น
        if (isOwner) {
            const resetBtn = document.getElementById('resetOwnershipBtn');
            if(resetBtn) resetBtn.style.display = 'flex';
        }

        // 3. เตรียมข้อมูลใส่ใน Modal (สำหรับตอนเปิดขึ้นมาแก้ไข)
        if (data) {
            document.getElementById('inputName').value = data.name || "";
            document.getElementById('inputAbout').value = data.about || "";
            document.getElementById('previewAvatar').src = data.avatar || DEFAULT_AVATAR;
            if (data.banner && data.banner !== "none") {
                document.getElementById('previewBanner').style.backgroundImage = `url('${data.banner}')`;
            }
            document.getElementById('inputFB').value = data.fb || "";
            document.getElementById('inputIG').value = data.ig || "";
            document.getElementById('inputGH').value = data.gh || "";
        }
    } catch (e) {
        console.error("Load error:", e);
    }
}

// ใน saveProfile ให้เรียกใช้ก่อน set(ref(...))
const compressedAvatar = await compressImage(avatar, 200, 0.6); // รูปโปรไฟล์เล็กหน่อย
const compressedBanner = await compressImage(banner, 600, 0.7); // แบนเนอร์ใหญ่ขึ้นนิด

// --- 1. วางฟังก์ชันบีบอัดไว้ด้านนอกสุด (บนสุดหรือล่างสุดของไฟล์ก็ได้) ---
function compressImage(base64Str, maxWidth = 400, quality = 0.7) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = maxWidth / img.width;
            canvas.width = maxWidth;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality)); 
        };
    });
}

// --- 2. แก้ไขในฟังก์ชัน saveProfile ---
window.saveProfile = async function() {
    // แสดง loading overlay
    document.getElementById('loadingOverlay').style.display = 'flex';

    try {
        // (โค้ดดึงค่าจาก Input ต่างๆ ของคุณ...)
        let avatar = document.getElementById('previewAvatar').src;
        let banner = document.getElementById('previewBanner').style.backgroundImage;
        // จัดการล้างค่า URL ของพื้นหลังถ้าจำเป็น
        banner = banner.replace('url("', '').replace('")', '');

        // --- เพิ่มจุดนี้: บีบอัดรูปก่อนเซฟ ---
        // บีบอัดรูปโปรไฟล์ให้เหลือความกว้าง 200px (ประหยัดพื้นที่มาก)
        const compressedAvatar = await compressImage(avatar, 200, 0.6);
        // บีบอัดแบนเนอร์ให้เหลือความกว้าง 600px
        const compressedBanner = await compressImage(banner, 600, 0.7);

        // ข้อมูลที่จะส่งขึ้น Firebase
        const updateData = {
            name: document.getElementById('inputName').value,
            about: document.getElementById('inputAbout').value,
            avatar: compressedAvatar, // ใช้ตัวที่บีบอัดแล้ว
            banner: compressedBanner, // ใช้ตัวที่บีบอัดแล้ว
            // ... ข้อมูลโซเชียลอื่นๆ
        };

        // --- ส่งข้อมูลขึ้น Firebase ---
        await update(ref(db, 'members/' + userId), updateData);
        
        alert("บันทึกข้อมูลเรียบร้อย!");
        closeModal();
        location.reload(); // โหลดหน้าใหม่เพื่อแสดงผล

    } catch (error) {
        console.error("Save Error:", error);
        alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
};
// --- ฟังก์ชันคืนสิทธิ์โปรไฟล์ ---
window.releaseProfile = async function() {
    if (confirm("ต้องการคืนสิทธิ์โปรไฟล์นี้เพื่อให้ผู้อื่นใช้งานหรือไม่? (ข้อมูลจะถูกลบ)")) {
        try {
            await remove(ref(db, 'members/' + userId));
            localStorage.removeItem('my_owned_profile');
            alert("คืนสิทธิ์เรียบร้อย");
            location.href = "../index.html";
        } catch (e) {
            alert("Error: " + e.message);
        }
    }
};

// --- ฟังก์ชันสำหรับลบรูปภาพใน Modal ---
window.removeImage = function(previewId, type) {
    const preview = document.getElementById(previewId);
    
    if (confirm(`คุณต้องการลบรูป${type === 'avatar' ? 'โปรไฟล์' : 'แบนเนอร์'}ใช่หรือไม่?`)) {
        if (type === 'avatar') {
            preview.src = DEFAULT_AVATAR;
            delete preview.dataset.base64;
        } else {
            preview.style.backgroundImage = 'none';
            preview.style.backgroundColor = '#5865f2';
            delete preview.dataset.base64;
        }
    }
};

window.onload = loadProfile;
