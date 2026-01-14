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

window.showPreview = function(input, previewId, isBanner = false) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const result = e.target.result;
            const preview = document.getElementById(previewId);
            
            if (isBanner) {
                // สำหรับ Banner ใช้ backgroundImage
                preview.style.backgroundImage = `url('${result}')`;
                preview.style.backgroundColor = "transparent"; // ล้างสีพื้นหลังเดิม
            } else {
                // สำหรับ Avatar ใช้ src
                preview.src = result;
            }
            // สำคัญ: เก็บค่า Base64 ไว้ใน dataset เพื่อใช้ตอนกด Save
            preview.dataset.base64 = result;
        };
        reader.readAsDataURL(file);
    }
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

// ในส่วนของ loadProfile() หาบรรทัดที่จัดการ Banner
const data = snapshot.val();
if (data) {
    // แสดงผลหน้าหลัก
    const displayBanner = document.getElementById('displayBanner');
    if (data.banner) {
        displayBanner.style.backgroundImage = `url('${data.banner}')`;
        displayBanner.style.backgroundColor = "transparent";
    }

    // เซ็ตค่าใน Modal (Preview) - จุดนี้สำคัญมาก!
    const previewBanner = document.getElementById('previewBanner');
    if (data.banner) {
        previewBanner.style.backgroundImage = `url('${data.banner}')`;
        // ลบ dataset เก่าออกเพื่อให้ฟังก์ชัน save ใช้ค่าจาก style ถ้าไม่มีการอัพโหลดใหม่
        delete previewBanner.dataset.base64; 
    }
}

// ปรับปรุงฟังก์ชัน SaveProfile เดิม
window.saveProfile = async function() {
    const name = document.getElementById('inputName').value;
    const about = document.getElementById('inputAbout').value;
    
    // ดึงค่าจาก dataset ถ้ามีการเปลี่ยนรูปใหม่ ถ้าไม่มีให้ใช้ค่าเดิมจาก src หรือ backgroundImage
    const avatar = document.getElementById('previewAvatar').dataset.base64 || document.getElementById('previewAvatar').src;
    
    // สำหรับ Banner ต้องดึงค่า URL ออกจากรูปแบบ url("...")
    let banner = document.getElementById('previewBanner').dataset.base64;
    if (!banner) {
        const bgImg = document.getElementById('previewBanner').style.backgroundImage;
        banner = bgImg.slice(5, -2).replace(/"/g, ""); // ตัด url("...") ออกให้เหลือแต่ link
    }

    try {
        await set(ref(db, 'members/' + userId), {
            name: name,
            about: about,
            avatar: avatar,
            banner: banner, // เก็บค่าเป็น String URL/Base64 ตรงๆ
            fb: document.getElementById('inputFB').value,
            ig: document.getElementById('inputIG').value,
            gh: document.getElementById('inputGH').value,
            isLocked: true
        });
        localStorage.setItem('my_owned_profile', userId);
        alert("บันทึกข้อมูลเรียบร้อย!");
        location.reload();
    } catch (e) {
        alert("Error: " + e.message);
    }
};

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
        if (data?.banner) document.getElementById('displayBanner').style.backgroundImage = data.banner;

        // เช็คสิทธิ์เพื่อโชว์ปุ่ม
        const isLocked = data?.isLocked || false;
        const isOwner = myOwnedProfile === userId;

        if (!isLocked || isOwner) {
            document.getElementById('editBtn').style.display = 'inline-block';
        }
        
        if (isOwner) {
            document.getElementById('resetOwnershipBtn').style.display = 'inline-block';
        }

        // ใส่ข้อมูลลง Modal
        if (data) {
            document.getElementById('inputName').value = data.name || "";
            document.getElementById('inputAbout').value = data.about || "";
            document.getElementById('previewAvatar').src = data.avatar || DEFAULT_AVATAR;
            document.getElementById('previewBanner').style.backgroundImage = data.banner || "";
            
            if (data.fb || data.ig || data.gh) {
                document.getElementById('socialCard').style.display = 'block';
                if (data.fb) { document.getElementById('itemFB').style.display = 'flex'; document.getElementById('linkFB').href = data.fb; }
                if (data.ig) { document.getElementById('itemIG').style.display = 'flex'; document.getElementById('linkIG').href = data.ig; }
                if (data.gh) { document.getElementById('itemGH').style.display = 'flex'; document.getElementById('linkGH').href = data.gh; }
            }
        }
    } catch (e) {
        console.error("Load error:", e);
    }
}

window.onload = loadProfile;
