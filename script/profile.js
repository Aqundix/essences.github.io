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
        const val = data?.[key];
        const itemEl = document.getElementById(id.item);
        const linkEl = document.getElementById(id.link);
        
        if (val && val.trim() !== "") {
            itemEl.style.display = 'flex';
            // ตรวจสอบว่ามี http หรือไม่ ถ้าไม่มีให้เติม https://
            linkEl.href = val.startsWith('http') ? val : `https://${val}`;
            hasSocial = true;
        } else {
            itemEl.style.display = 'none';
        }
    }
    // ถ้ามี social อย่างน้อย 1 อย่างให้แสดง card
    socialCard.style.display = hasSocial ? 'block' : 'none';
}

// --- ฟังก์ชันโหลดข้อมูลและเช็คสิทธิ์ ---
async function loadProfile() {
    try {
        const snapshot = await get(ref(db, 'members/' + userId));
        const data = snapshot.exists() ? snapshot.val() : null;
        const myOwnedProfile = localStorage.getItem('my_owned_profile');

        // 1. แสดงหน้าโปรไฟล์หลัก
        document.getElementById('displayName').innerText = data?.name || "Username";
        document.getElementById('displayTag').innerText = "@" + userId.padStart(4, '0');
        document.getElementById('displayAbout').innerText = data?.about || "คลิก Edit เพื่อเริ่มแก้ไขโปรไฟล์ของคุณ...";
        document.getElementById('displayAvatar').src = data?.avatar || DEFAULT_AVATAR;
        
        const bannerArea = document.getElementById('displayBanner');
        if (data?.banner) {
            bannerArea.style.backgroundImage = `url('${data.banner}')`;
            bannerArea.style.backgroundColor = "transparent";
        } else {
            bannerArea.style.backgroundColor = "#5865f2";
            bannerArea.style.backgroundImage = "none";
        }

        // เรียกใช้ฟังก์ชันแสดง Social
        updateSocialDisplay(data);

        // 2. แสดงปุ่ม Edit และ Restore
        const isLocked = data?.isLocked || false;
        const isOwner = myOwnedProfile === userId;

        if (!isLocked || isOwner) {
            document.getElementById('editBtn').style.display = 'flex';
        }
        
        if (isOwner) {
            document.getElementById('resetOwnershipBtn').style.display = 'flex';
        }

        // 3. เตรียมข้อมูลใส่ใน Modal (Preview)
        if (data) {
            document.getElementById('inputName').value = data.name || "";
            document.getElementById('inputAbout').value = data.about || "";
            document.getElementById('previewAvatar').src = data.avatar || DEFAULT_AVATAR;
            if (data.banner) {
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

// --- ฟังก์ชันบันทึกข้อมูล พร้อม Loading ---
window.saveProfile = async function() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) loading.style.display = 'flex'; 

    const previewAvatar = document.getElementById('previewAvatar');
    const previewBanner = document.getElementById('previewBanner');

    const avatar = previewAvatar.dataset.base64 || previewAvatar.src;
    let banner = previewBanner.dataset.base64;
    
    if (!banner) {
        const bg = previewBanner.style.backgroundImage;
        banner = bg && bg !== 'none' ? bg.slice(5, -2).replace(/"/g, "") : "";
    }

    const profileData = {
        name: document.getElementById('inputName').value,
        about: document.getElementById('inputAbout').value,
        avatar: avatar,
        banner: banner,
        fb: document.getElementById('inputFB').value,
        ig: document.getElementById('inputIG').value,
        gh: document.getElementById('inputGH').value,
        isLocked: true
    };

    try {
        await set(ref(db, 'members/' + userId), profileData);
        localStorage.setItem('my_owned_profile', userId);
        
        setTimeout(() => {
            if (loading) loading.style.display = 'none';
            alert("บันทึกข้อมูลสำเร็จ!");
            location.reload();
        }, 1000); // หน่วงเวลา 1 วิให้เห็นหน้าจอโหลด
    } catch (e) {
        if (loading) loading.style.display = 'none';
        alert("เกิดข้อผิดพลาด: " + e.message);
    }
};

// --- ฟังก์ชันคืนสิทธิ์โปรไฟล์ ---
window.releaseProfile = async function() {
    if (confirm("ต้องการคืนสิทธิ์โปรไฟล์นี้เพื่อให้ผู้อื่นใช้งานหรือไม่?")) {
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

window.onload = loadProfile;
