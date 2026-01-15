import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// --- 1. ฟังก์ชันพื้นฐาน UI ---
window.openModal = () => document.getElementById('editModal').style.display = 'flex';
window.closeModal = () => document.getElementById('editModal').style.display = 'none';

function getPersistentTag(seed) {
    const val = (parseInt(seed) * 48271) % 9000; 
    return (val + 1000).toString().padStart(4, '0'); 
}

// --- 2. ฟังก์ชันบีบอัดรูปภาพ (ลดขนาดข้อมูลให้โหลดเร็ว) ---
function compressImage(base64Str, maxWidth = 400, quality = 0.7) {
    return new Promise((resolve) => {
        if (!base64Str || base64Str.length < 1000) return resolve(base64Str); // ถ้าไม่ใช่ base64 หรือเล็กอยู่แล้ว
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
        img.onerror = () => resolve(base64Str);
    });
}

// --- 3. ฟังก์ชันหลัก: โหลดข้อมูล (Caching System) ---
async function loadProfile() {
    // กดดึงจาก Cache มาแสดงก่อนทันที
    const cachedData = localStorage.getItem(`cache_${userId}`);
    if (cachedData) {
        console.log("Rendering from cache for speed...");
        renderUI(JSON.parse(cachedData));
    }

    try {
        const snapshot = await get(ref(db, 'members/' + userId));
        if (snapshot.exists()) {
            const data = snapshot.val();
            // เก็บลง Cache ไว้ใช้ครั้งหน้า
            localStorage.setItem(`cache_${userId}`, JSON.stringify(data));
            renderUI(data); 
        } else {
            // ถ้าไม่มีข้อมูลใน DB เลย ให้โชว์ค่าว่าง
            renderUI(null);
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

// ฟังก์ชันสำหรับวาดข้อมูลลงบนหน้าจอ
function renderUI(data) {
    const myOwnedProfile = localStorage.getItem('my_owned_profile');
    
    // แสดงชื่อและแท็ก
    document.getElementById('displayName').innerText = data?.name || "Username";
    document.getElementById('displayTag').innerText = "@" + getPersistentTag(userId);
    document.getElementById('displayAbout').innerText = data?.about || "คลิก Edit เพื่อเริ่มแก้ไขโปรไฟล์ของคุณ...";
    document.getElementById('displayAvatar').src = data?.avatar || DEFAULT_AVATAR;

    // จัดการ Banner
    const bannerArea = document.getElementById('displayBanner');
    if (data?.banner && data.banner !== "none") {
        bannerArea.style.backgroundImage = `url('${data.banner}')`;
        bannerArea.style.backgroundColor = "transparent";
    } else {
        bannerArea.style.backgroundColor = "#5865f2";
        bannerArea.style.backgroundImage = "none";
    }

    // จัดการ Social Cards
    updateSocialDisplay(data);

    // เช็คสิทธิ์ปุ่มแก้ไข
    const isLocked = data?.isLocked || false;
    const isOwner = myOwnedProfile === userId;

    if (!isLocked || isOwner) {
        document.getElementById('editBtn').style.display = 'flex';
    } else {
        document.getElementById('editBtn').style.display = 'none';
    }
    
    // ปุ่มคืนสิทธิ์
    document.getElementById('resetOwnershipBtn').style.display = isOwner ? 'flex' : 'none';

    // ใส่ข้อมูลรอล่วงหน้าใน Modal
    if (data) {
        document.getElementById('inputName').value = data.name || "";
        document.getElementById('inputAbout').value = data.about || "";
        document.getElementById('previewAvatar').src = data.avatar || DEFAULT_AVATAR;
        if (data.banner) document.getElementById('previewBanner').style.backgroundImage = `url('${data.banner}')`;
        document.getElementById('inputFB').value = data.fb || "";
        document.getElementById('inputIG').value = data.ig || "";
        document.getElementById('inputGH').value = data.gh || "";
    }
}

// --- 4. ฟังก์ชันบันทึกข้อมูล (Save with Compression) ---
window.saveProfile = async function() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'flex';

    try {
        let avatarBase64 = document.getElementById('previewAvatar').src;
        let bannerStyle = document.getElementById('previewBanner').style.backgroundImage;
        let bannerBase64 = bannerStyle.replace('url("', '').replace('")', '');

        // บีบอัดรูปก่อนส่ง (นี่คือสิ่งที่ทำให้หน้าลิสต์โหลดเร็วขึ้น)
        const compressedAvatar = await compressImage(avatarBase64, 200, 0.6);
        const compressedBanner = await compressImage(bannerBase64, 600, 0.7);

        const updateData = {
            name: document.getElementById('inputName').value,
            about: document.getElementById('inputAbout').value,
            avatar: compressedAvatar,
            banner: compressedBanner,
            fb: document.getElementById('inputFB').value,
            ig: document.getElementById('inputIG').value,
            gh: document.getElementById('inputGH').value,
            isLocked: true // ล็อกโปรไฟล์ทันทีเมื่อมีการเซฟ
        };

        await update(ref(db, 'members/' + userId), updateData);
        localStorage.setItem('my_owned_profile', userId); // บันทึกว่าเราเป็นเจ้าของ
        
        alert("บันทึกข้อมูลเรียบร้อย!");
        closeModal();
        location.reload();
    } catch (e) {
        alert("บันทึกไม่สำเร็จ: " + e.message);
    } finally {
        overlay.style.display = 'none';
    }
};

// --- 5. ระบบ Admin ---
window.verifyAdminAccess = function() {
    const u = document.getElementById('admUser').value;
    const p = document.getElementById('admPass').value;
    if (u === "admin" && p === "admin1234") {
        document.getElementById('adminLoginModal').style.display = 'none';
        document.getElementById('adminMenuModal').style.display = 'flex';
    } else {
        alert("รหัสผ่านไม่ถูกต้อง");
    }
};

window.adminEditAction = function() {
    document.getElementById('adminMenuModal').style.display = 'none';
    window.openModal();
};

window.adminResetAllAction = async function() {
    if (confirm("ลบข้อมูลทั้งหมด?")) {
        await remove(ref(db, 'members'));
        localStorage.clear();
        location.href = "../index.html";
    }
};

// --- 6. ฟังก์ชันเสริมอื่นๆ ---
window.showPreview = function(input, previewId, isBanner = false) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById(previewId);
            if (isBanner) preview.style.backgroundImage = `url('${e.target.result}')`;
            else preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

function updateSocialDisplay(data) {
    const socialCard = document.getElementById('socialCard');
    const platforms = ['fb', 'ig', 'gh'];
    let hasSocial = false;

    platforms.forEach(p => {
        const val = data?.[p];
        const item = document.getElementById('item' + p.toUpperCase());
        const link = document.getElementById('link' + p.toUpperCase());
        if (val && val.trim() !== "") {
            item.style.display = 'flex';
            link.href = val.startsWith('http') ? val : `https://${val}`;
            hasSocial = true;
        } else {
            item.style.display = 'none';
        }
    });
    socialCard.style.display = hasSocial ? 'block' : 'none';
}

window.releaseProfile = async function() {
    if (confirm("คืนสิทธิ์โปรไฟล์นี้?")) {
        await remove(ref(db, 'members/' + userId));
        localStorage.removeItem('my_owned_profile');
        location.href = "../index.html";
    }
};

window.removeImage = function(previewId, type) {
    const preview = document.getElementById(previewId);
    if (confirm(`ลบรูป${type}?`)) {
        if (type === 'avatar') preview.src = DEFAULT_AVATAR;
        else {
            preview.style.backgroundImage = 'none';
            preview.style.backgroundColor = '#5865f2';
        }
    }
};

// รันฟังก์ชันเมื่อโหลดหน้า
window.onload = loadProfile;
