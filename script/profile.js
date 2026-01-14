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
        // จำกัดขนาดไฟล์ไม่เกิน 1MB เพื่อไม่ให้ Firebase โหลดหนักเกินไป
        if (file.size > 1024 * 1024) {
            alert("ไฟล์ใหญ่เกินไป! กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 1MB");
            input.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const result = e.target.result;
            const preview = document.getElementById(previewId);
            if (isBanner) {
                preview.style.backgroundImage = `url('${result}')`;
            } else {
                preview.src = result;
            }
            // เก็บข้อมูล base64 ไว้ที่ element เพื่อเอาไป save ลง database
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

// --- ฟังก์ชันจัดการข้อมูล ---

window.saveProfile = async function() {
    const saveBtn = document.getElementById('mainSaveBtn');
    saveBtn.disabled = true;
    saveBtn.innerText = "กำลังบันทึก...";

    try {
        const snapshot = await get(ref(db, 'members/' + userId));
        const oldData = snapshot.val() || {};

        const newData = {
            id: userId,
            name: document.getElementById('inputName').value || oldData.name || `Username ${userId}`,
            about: document.getElementById('inputAbout').value || oldData.about || "ยังไม่ได้ตั้ง Bio",
            avatar: document.getElementById('previewAvatar').src,
            banner: document.getElementById('previewBanner').style.backgroundImage || oldData.banner || "",
            fb: document.getElementById('inputFB').value || "",
            ig: document.getElementById('inputIG').value || "",
            gh: document.getElementById('inputGH').value || "",
            isLocked: true
        };

        await set(ref(db, 'members/' + userId), newData);
        localStorage.setItem('my_owned_profile', userId);
        alert("บันทึกข้อมูลเรียบร้อย!");
        location.reload();
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
