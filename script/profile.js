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

// --- ฟังก์ชันอัพโหลดรูปจากเครื่อง ---
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
            preview.dataset.base64 = result; // เก็บค่าไว้รอ Save
        };
        reader.readAsDataURL(file);
    }
};

// --- ฟังก์ชันโหลดข้อมูลและเช็คสิทธิ์ปุ่ม ---
async function loadProfile() {
    try {
        const snapshot = await get(ref(db, 'members/' + userId));
        const data = snapshot.exists() ? snapshot.val() : null;
        const myOwnedProfile = localStorage.getItem('my_owned_profile');

        // 1. แสดงหน้าโปรไฟล์หลัก
        document.getElementById('displayName').innerText = data?.name || "Username";
        document.getElementById('displayTag').innerText = "@" + userId.padStart(4, '0');
        document.getElementById('displayAbout').innerText = data?.about || "คลิก Edit เพื่อเริ่มแก้ไขโปรไฟล์...";
        document.getElementById('displayAvatar').src = data?.avatar || DEFAULT_AVATAR;
        
        const bannerArea = document.getElementById('displayBanner');
        if (data?.banner) {
            bannerArea.style.backgroundImage = `url('${data.banner}')`;
        } else {
            bannerArea.style.backgroundColor = "#5865f2";
        }

        // 2. แสดงปุ่ม Edit และ Restore (แก้ไขจุดนี้ให้ปุ่มขึ้นแน่นอน)
        const isLocked = data?.isLocked || false;
        const isOwner = myOwnedProfile === userId;

        // ถ้าโปรไฟล์ยังว่างอยู่ (Locked = false) หรือ เราเป็นเจ้าของ ให้โชว์ปุ่ม Edit
        if (!isLocked || isOwner) {
            document.getElementById('editBtn').style.display = 'flex';
        }

        // ถ้าเราเป็นเจ้าของ ให้โชว์ปุ่ม Restore (คืนสิทธิ์)
        if (isOwner) {
            document.getElementById('resetOwnershipBtn').style.display = 'flex';
        }

        // 3. เตรียมข้อมูลใส่ใน Modal
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
    } catch (e) { console.error(e); }
}

// --- ฟังก์ชันบันทึกข้อมูล ---
window.saveProfile = async function() {
    const previewAvatar = document.getElementById('previewAvatar');
    const previewBanner = document.getElementById('previewBanner');

    const avatarBase64 = previewAvatar.dataset.base64 || previewAvatar.src;
    let bannerBase64 = previewBanner.dataset.base64;
    
    if (!bannerBase64) {
        const bg = previewBanner.style.backgroundImage;
        bannerBase64 = bg ? bg.slice(5, -2).replace(/"/g, "") : "";
    }

    try {
        await set(ref(db, 'members/' + userId), {
            name: document.getElementById('inputName').value,
            about: document.getElementById('inputAbout').value,
            avatar: avatarBase64,
            banner: bannerBase64,
            fb: document.getElementById('inputFB').value,
            ig: document.getElementById('inputIG').value,
            gh: document.getElementById('inputGH').value,
            isLocked: true
        });
        localStorage.setItem('my_owned_profile', userId);
        alert("บันทึกเรียบร้อย!");
        location.reload();
    } catch (e) { alert(e.message); }
};

// --- ฟังก์ชันคืนสิทธิ์โปรไฟล์ ---
window.releaseProfile = async function() {
    if (confirm("ต้องการคืนสิทธิ์โปรไฟล์นี้เพื่อให้ผู้อื่นใช้งานหรือไม่?")) {
        await remove(ref(db, 'members/' + userId));
        localStorage.removeItem('my_owned_profile');
        alert("คืนสิทธิ์เรียบร้อย");
        location.href = "../index.html";
    }
};

window.onload = loadProfile;
