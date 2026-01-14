import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ข้อมูล Config จากหน้าจอของคุณ (ภาพที่ 1)
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

// --- ฟังก์ชันสำหรับ UI ---

window.openModal = function() {
    document.getElementById('editModal').style.display = 'flex';
};

window.closeModal = function() {
    document.getElementById('editModal').style.display = 'none';
};

window.updateCharCount = function() {
    const text = document.getElementById('inputAbout').value;
    document.getElementById('charCounter').innerText = `${text.length} / 255`;
};

window.removeImage = function(previewId, type) {
    const preview = document.getElementById(previewId);
    if (type === 'avatar') {
        preview.src = DEFAULT_AVATAR;
    } else {
        preview.style.backgroundImage = "none";
        preview.style.backgroundColor = "#5865f2";
    }
};

// 1. ฟังก์ชันแสดงตัวอย่างรูป (และเก็บค่าไว้รอ Save)
window.showPreview = function(input, previewId, isBanner = false) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const result = e.target.result; // นี่คือ Base64 ของรูป
            const preview = document.getElementById(previewId);
            
            if (isBanner) {
                preview.style.backgroundImage = `url('${result}')`;
                preview.style.backgroundColor = "transparent";
            } else {
                preview.src = result;
            }
            // เก็บค่า Base64 ไว้ที่ตัวแปรสำรอง
            preview.dataset.base64 = result;
        };
        reader.readAsDataURL(file);
    }
};

// 2. ฟังก์ชันบันทึกข้อมูล (แก้ปัญหาข้อมูลหาย)
window.saveProfile = async function() {window.saveProfile = async function() {
    const previewAvatar = document.getElementById('previewAvatar');
    const previewBanner = document.getElementById('previewBanner');

    // 1. ดึงค่า Avatar
    const avatar = previewAvatar.dataset.base64 || previewAvatar.src;

    // 2. ดึงค่า Banner (จัดการเรื่อง url("") ออก)
    let banner = previewBanner.dataset.base64;
    if (!banner) {
        const bgImg = previewBanner.style.backgroundImage;
        // ถ้าไม่มีการอัปโหลดใหม่ ให้แกะเอา URL เดิมออกมา
        banner = bgImg ? bgImg.slice(5, -2).replace(/"/g, "") : "";
    }

    try {
        await set(ref(db, 'members/' + userId), {
            name: document.getElementById('inputName').value,
            about: document.getElementById('inputAbout').value,
            avatar: avatar,
            banner: banner,
            fb: document.getElementById('inputFB').value,
            ig: document.getElementById('inputIG').value,
            gh: document.getElementById('inputGH').value,
            isLocked: true
        });
        alert("บันทึกข้อมูลเรียบร้อย!");
        location.reload();
    } catch (e) {
        alert("Error: " + e.message);
    }
};

// ฟังก์ชันจัดการการเลือกรูปภาพ
window.handleImageUpload = function(input, previewId) {
    const file = input.files[0];
    if (file) {
        // ตรวจสอบขนาดไฟล์ (แนะนำไม่เกิน 1MB เพื่อป้องกัน Database เต็มเร็ว)
        if (file.size > 1024 * 1024) {
            alert("ไฟล์มีขนาดใหญ่เกินไป! กรุณาใช้รูปไม่เกิน 1MB");
            input.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            const previewElement = document.getElementById(previewId);
            
            if (previewId === 'previewAvatar') {
                previewElement.src = base64Image;
            } else {
                previewElement.style.backgroundImage = `url('${base64Image}')`;
            }
            // เก็บค่า Base64 ไว้ใน Attribute ของ Element เพื่อนำไป Save ต่อ
            previewElement.dataset.base64 = base64Image;
        };
        reader.readAsDataURL(file);
    }
};

// เพิ่มไว้ด้านบนของฟังก์ชัน loadProfile
const myOwnedProfile = localStorage.getItem('my_owned_profile');

// --- ฟังก์ชันโหลดข้อมูล (แก้ไขเรื่องปุ่มหาย) ---
async function loadProfile() {
    const myOwnedProfile = localStorage.getItem('my_owned_profile');
    const formattedTag = "@" + userId.padStart(4, '0');
    
    try {
        const snapshot = await get(ref(db, 'members/' + userId));
        const data = snapshot.val();

        // แสดงข้อมูลพื้นฐาน (ป้องกัน Loading ค้าง)
        document.getElementById('displayName').innerText = data?.name || `Username ${userId}`;
        document.getElementById('displayTag').innerText = formattedTag;
        document.getElementById('displayAbout').innerText = data?.about || "คลิกปุ่ม Edit เพื่อเริ่มแก้ไขโปรไฟล์ของคุณ...";
        document.getElementById('displayAvatar').src = data?.avatar || DEFAULT_AVATAR;
        // ในฟังก์ชัน loadProfile()
        const bannerArea = document.getElementById('displayBanner');
        if (data?.banner && data.banner !== "none" && data.banner !== "") {
            // ต้องครอบด้วย url() เพราะในฐานข้อมูลเราเก็บแค่ตัว Link/Base64
            bannerArea.style.backgroundImage = `url('${data.banner}')`;
            bannerArea.style.backgroundColor = "transparent";
        }

        // เช็คสิทธิ์เพื่อโชว์ปุ่ม
        // ค้นหาส่วนที่เช็ค isLocked ในไฟล์ profile.js
const isLocked = data?.isLocked || false;
const isOwner = myOwnedProfile === userId;

const editBtn = document.getElementById('editBtn');

// เงื่อนไข: ถ้ายังไม่ล็อค (คนแรกที่เข้ามา) หรือ ถ้าเราเป็นเจ้าของ ให้โชว์ปุ่ม Edit
if (!isLocked || isOwner) {
    editBtn.style.display = 'inline-block';
} else {
    editBtn.style.display = 'none'; // คนอื่นที่มาทีหลังจะไม่เห็นปุ่ม
}

// ปุ่ม Reset (คืนสิทธิ์) จะขึ้นเฉพาะคนที่เป็นเจ้าของเท่านั้น
if (isOwner) {
    document.getElementById('resetOwnershipBtn').style.display = 'inline-block';
}

        // ใส่ข้อมูลลง Modal
        // ค้นหาช่วงท้ายของฟังก์ชัน loadProfile และปรับตามนี้
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            // --- แสดงผลหน้าหลัก ---
            document.getElementById('displayAvatar').src = data.avatar || DEFAULT_AVATAR;
            const bannerArea = document.getElementById('displayBanner');
            if (data.banner) {
                bannerArea.style.backgroundImage = `url('${data.banner}')`;
                bannerArea.style.backgroundColor = "transparent";
            }
        
            // --- ส่วนสำคัญ: ใส่ข้อมูลลงใน Modal (Preview) ---
            document.getElementById('inputName').value = data.name || "";
            document.getElementById('inputAbout').value = data.about || "";
            
            // เซ็ต Preview รูปใน Modal
            const previewAvatar = document.getElementById('previewAvatar');
            const previewBanner = document.getElementById('previewBanner');
            
            previewAvatar.src = data.avatar || DEFAULT_AVATAR;
            if (data.banner) {
                previewBanner.style.backgroundImage = `url('${data.banner}')`;
                previewBanner.style.backgroundColor = "transparent";
                // ลบ dataset เพื่อรอรับการอัปโหลดใหม่
                delete previewBanner.dataset.base64;
            }
        }
    } catch (e) {
        console.error("Load error:", e);
    }
}

window.onload = loadProfile;
