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

// --- ฟังก์ชันหลักที่ผูกกับ HTML ---

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
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById(previewId);
            if (isBanner) {
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

// ฟังก์ชันเซฟข้อมูลแบบ Merge (ป้องกันข้อมูลส่วนอื่นหาย)
window.saveProfile = async function() {
    const saveBtn = document.getElementById('mainSaveBtn');
    saveBtn.disabled = true;
    saveBtn.innerText = "Saving...";

    try {
        // ดึงข้อมูลเดิมมากันเหนียว
        const snapshot = await get(ref(db, 'members/' + userId));
        const oldData = snapshot.val() || {};

        const newData = {
            id: userId,
            name: document.getElementById('inputName').value || oldData.name || `Username ${userId}`,
            about: document.getElementById('inputAbout').value || oldData.about || "No bio yet.",
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
        alert("Error: " + e.message);
        saveBtn.disabled = false;
        saveBtn.innerText = "Save Changes";
    }
};

window.releaseProfile = async function() {
    if (!confirm("ต้องการลบข้อมูลและคืนสิทธิ์โปรไฟล์นี้ใช่หรือไม่?")) return;
    try {
        await remove(ref(db, 'members/' + userId));
        localStorage.removeItem('my_owned_profile');
        alert("คืนสิทธิ์สำเร็จ");
        window.location.href = "../index.html";
    } catch (e) {
        alert("Error: " + e.message);
    }
};

// --- ฟังก์ชันโหลดข้อมูลและตรวจสอบสิทธิ์ (แก้ปัญหาปุ่มหาย) ---

async function loadProfile() {
    const myOwnedProfile = localStorage.getItem('my_owned_profile');
    const formattedTag = "@" + userId.padStart(4, '0');
    
    try {
        const snapshot = await get(ref(db, 'members/' + userId));
        const data = snapshot.val();

        // 1. จัดการการแสดงผลปุ่ม (Edit / Restore)
        if (!data || !data.isLocked) {
            // ถ้ายังไม่มีใครจอง
            if (!myOwnedProfile) {
                document.getElementById('editBtn').style.display = 'inline-block';
            }
        } else if (myOwnedProfile === userId) {
            // ถ้าเราเป็นเจ้าของ
            document.getElementById('editBtn').style.display = 'inline-block';
            document.getElementById('resetOwnershipBtn').style.display = 'inline-block';
        }

        // 2. แสดงผลข้อมูล (ถ้าไม่มีให้ใช้ค่าเริ่มต้น)
        document.getElementById('displayName').innerText = data?.name || `Username ${userId}`;
        document.getElementById('displayTag').innerText = formattedTag;
        document.getElementById('displayAbout').innerText = data?.about || "คลิกปุ่ม Edit เพื่อเริ่มแก้ไขโปรไฟล์ของคุณ...";
        document.getElementById('displayAvatar').src = data?.avatar || DEFAULT_AVATAR;
        
        if (data?.banner) {
            document.getElementById('displayBanner').style.backgroundImage = data.banner;
        }

        // 3. ใส่ข้อมูลลงใน Modal (Input) เผื่อไว้ตอนกดแก้ไข
        if (data) {
            document.getElementById('inputName').value = data.name || "";
            document.getElementById('inputAbout').value = data.about || "";
            document.getElementById('previewAvatar').src = data.avatar || DEFAULT_AVATAR;
            document.getElementById('previewBanner').style.backgroundImage = data.banner || "";
            document.getElementById('inputFB').value = data.fb || "";
            document.getElementById('inputIG').value = data.ig || "";
            document.getElementById('inputGH').value = data.gh || "";
            
            // Social Card
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

// รันเมื่อโหลดหน้าจอ
window.onload = loadProfile;
