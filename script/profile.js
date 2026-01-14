import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

window.openModal = () => document.getElementById('editModal').style.display = 'flex';
window.closeModal = () => document.getElementById('editModal').style.display = 'none';

window.updateCharCount = function() {
    const text = document.getElementById('inputAbout').value;
    document.getElementById('charCounter').innerText = `${text.length} / 255`;
};

window.showPreview = function(input, previewId, isBanner = false) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById(previewId);
            if (isBanner) {
                // เก็บค่า Base64 ลงใน style
                preview.style.backgroundImage = `url("${e.target.result}")`;
            } else {
                preview.src = e.target.result;
            }
        };
        reader.readAsDataURL(input.files[0]);
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

// --- ฟังก์ชันจัดการข้อมูล (Save Profile) ---

// --- แก้ไขเฉพาะฟังก์ชัน saveProfile ---
window.saveProfile = async function() {
    const saveBtn = document.getElementById('mainSaveBtn');
    saveBtn.disabled = true;
    saveBtn.innerText = "กำลังบันทึก...";

    try {
        const name = document.getElementById('inputName').value;
        const about = document.getElementById('inputAbout').value;
        const avatar = document.getElementById('previewAvatar').src;
        
        // ดึงค่า banner และล้าง url("...") ออก ให้เหลือแค่ตัวข้อมูล Base64 หรือ Link
        let bannerRaw = document.getElementById('previewBanner').style.backgroundImage;
        let bannerClean = bannerRaw.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
        
        // ถ้าไม่มีรูปให้เป็นค่าว่าง (เพื่อให้หน้า List แสดงสีพื้นฐานแทน)
        if (bannerClean === 'none' || bannerClean === '') bannerClean = "";

        const newData = {
            id: userId,
            name: name || `Username ${userId}`,
            about: about || "ยังไม่ได้ตั้ง Bio",
            avatar: avatar,
            banner: bannerClean, 
            fb: document.getElementById('inputFB').value || "",
            ig: document.getElementById('inputIG').value || "",
            gh: document.getElementById('inputGH').value || "",
            isLocked: true
        };

        await set(ref(db, 'members/' + userId), newData);
        localStorage.setItem('my_owned_profile', userId);
        alert("บันทึกข้อมูลเรียบร้อย!");
        window.location.href = "../index.html"; 
    } catch (e) {
        alert("เกิดข้อผิดพลาด: " + e.message);
        saveBtn.disabled = false;
        saveBtn.innerText = "Save Changes";
    }
};

window.releaseProfile = async function() {
    if (!confirm("คุณต้องการลบข้อมูลและคืนสิทธิ์โปรไฟล์นี้ใช่หรือไม่?")) return;
    try {
        await remove(ref(db, 'members/' + userId));
        localStorage.removeItem('my_owned_profile');
        alert("คืนสิทธิ์สำเร็จ");
        window.location.href = "../index.html";
    } catch (e) {
        alert("Error: " + e.message);
    }
};

// --- ฟังก์ชันโหลดข้อมูล ---

async function loadProfile() {
    const myOwnedProfile = localStorage.getItem('my_owned_profile');
    const formattedTag = "@" + userId.padStart(4, '0');
    
    try {
        const snapshot = await get(ref(db, 'members/' + userId));
        const data = snapshot.val();

        // 1. แสดงผลหน้าจอโปรไฟล์
        document.getElementById('displayName').innerText = data?.name || `Username ${userId}`;
        document.getElementById('displayTag').innerText = formattedTag;
        document.getElementById('displayAbout').innerText = data?.about || "คลิกปุ่ม Edit เพื่อเริ่มแก้ไขโปรไฟล์ของคุณ...";
        document.getElementById('displayAvatar').src = data?.avatar || DEFAULT_AVATAR;
        
        const bannerArea = document.getElementById('displayBanner');
        if (data?.banner && data.banner !== "none") {
            bannerArea.style.backgroundImage = data.banner;
        } else {
            bannerArea.style.backgroundColor = "#5865f2";
            bannerArea.style.backgroundImage = "none";
        }

        // 2. เช็คสิทธิ์ปุ่ม Edit
        const isLocked = data?.isLocked || false;
        const isOwner = myOwnedProfile === userId;

        if (!isLocked || isOwner) {
            document.getElementById('editBtn').style.display = 'inline-block';
        }
        
        if (isOwner) {
            document.getElementById('resetOwnershipBtn').style.display = 'inline-block';
        }

        // 3. ใส่ข้อมูลลงใน Modal (เพื่อให้เวลาเปิด Modal มาแก้ไข ข้อมูลเก่าจะยังอยู่)
        if (data) {
            document.getElementById('inputName').value = data.name || "";
            document.getElementById('inputAbout').value = data.about || "";
            document.getElementById('previewAvatar').src = data.avatar || DEFAULT_AVATAR;
            document.getElementById('previewBanner').style.backgroundImage = data.banner || "";
            document.getElementById('inputFB').value = data.fb || "";
            document.getElementById('inputIG').value = data.ig || "";
            document.getElementById('inputGH').value = data.gh || "";
        }
    } catch (e) {
        console.error("Load error:", e);
    }
}

window.onload = loadProfile;
