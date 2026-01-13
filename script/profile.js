// 1. นำเข้า Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 2. ข้อมูล Config (ตรวจสอบความถูกต้องจาก Firebase Console ของคุณ)
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

// ดึง ID จาก URL
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('id') || "1";
const DEFAULT_AVATAR = "../img/profile.jpg";
const DEFAULT_BANNER_COLOR = "#5865f2";

/** --- หัวใจสำคัญ: ผูกฟังก์ชันเข้ากับ window เพื่อให้ HTML เรียกใช้งานได้ --- **/

window.openModal = async function() {
    // ตรวจสอบสิทธิ์ก่อนเปิด
    const myOwnedProfile = localStorage.getItem('my_owned_profile');
    if (myOwnedProfile && myOwnedProfile !== userId) {
        alert(`คุณได้สิทธิ์ดูแลโปรไฟล์ ID: ${myOwnedProfile} ไปแล้ว ไม่สามารถแก้ไขโปรไฟล์อื่นได้`);
        return;
    }

    document.getElementById('editModal').style.display = 'flex';
    
    // ดึงข้อมูลปัจจุบันมาใส่ใน Input
    document.getElementById('inputName').value = document.getElementById('displayName').innerText;
    document.getElementById('inputAbout').value = document.getElementById('displayAbout').innerText;
    
    const snapshot = await get(ref(db, 'members/' + userId));
    const data = snapshot.val();
    if (data) {
        document.getElementById('inputFB').value = data.fb || "";
        document.getElementById('inputIG').value = data.ig || "";
        document.getElementById('inputGH').value = data.gh || "";
    }
};

window.closeModal = function() {
    document.getElementById('editModal').style.display = 'none';
};

window.saveProfile = async function() {
    const newData = {
        id: userId,
        name: document.getElementById('inputName').value,
        about: document.getElementById('inputAbout').value,
        avatar: document.getElementById('previewAvatar').src,
        banner: document.getElementById('previewBanner').style.backgroundImage,
        fb: document.getElementById('inputFB').value,
        ig: document.getElementById('inputIG').value,
        gh: document.getElementById('inputGH').value,
        isLocked: true
    };

    try {
        await set(ref(db, 'members/' + userId), newData);
        localStorage.setItem('my_owned_profile', userId);
        alert("บันทึกข้อมูลเรียบร้อย!");
        updateDisplay(newData);
        window.closeModal();
    } catch (e) {
        alert("บันทึกล้มเหลว: " + e.message);
    }
};

window.releaseProfile = async function() {
    if (!confirm("คุณต้องการคืนสิทธิ์โปรไฟล์นี้ใช่หรือไม่?")) return;

    try {
        await remove(ref(db, 'members/' + userId));
        localStorage.removeItem('my_owned_profile');
        alert("คืนสิทธิ์โปรไฟล์เรียบร้อย!");
        window.location.href = "../index.html";
    } catch (e) {
        alert("Error: " + e.message);
    }
};

// ฟังก์ชันอื่นๆ ที่ต้องใช้ในหน้าเว็บ
window.showPreview = function(input, previewId, isBanner = false) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById(previewId);
            if (isBanner) {
                preview.style.backgroundImage = `url("${e.target.result}")`;
                preview.style.backgroundSize = "cover";
            } else {
                preview.src = e.target.result;
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.updateCharCount = function() {
    const textarea = document.getElementById('inputAbout');
    const counter = document.getElementById('charCounter');
    counter.innerText = `${textarea.value.length} / 255`;
};

/** --- ส่วนการโหลดข้อมูลจาก Cloud --- **/

async function loadProfile() {
    const formattedTag = "@" + userId.padStart(4, '0');
    try {
        const snapshot = await get(ref(db, 'members/' + userId));
        const data = snapshot.val();

        if (data) {
            data.tag = formattedTag;
            updateDisplay(data);
            
            // ตรวจสอบว่าเป็นเจ้าของหรือไม่ เพื่อโชว์ปุ่ม Restore
            const myOwned = localStorage.getItem('my_owned_profile');
            if (myOwned === userId) {
                document.getElementById('resetOwnershipBtn').style.display = 'flex';
            }
        } else {
            updateDisplay({
                name: "Username " + userId,
                tag: formattedTag,
                about: "คลิกปุ่ม Edit เพื่อเริ่มแก้ไขโปรไฟล์ของคุณ...",
                avatar: DEFAULT_AVATAR
            });
        }
    } catch (e) {
        console.error("Load error:", e);
    }
}

function updateDisplay(data) {
    document.getElementById('displayName').innerText = data.name;
    document.getElementById('displayTag').innerText = data.tag || "@0000";
    document.getElementById('displayAbout').innerText = data.about;
    document.getElementById('displayAvatar').src = data.avatar || DEFAULT_AVATAR;
    
    const banner = document.getElementById('displayBanner');
    if (data.banner && data.banner !== "none") {
        banner.style.backgroundImage = data.banner;
    } else {
        banner.style.backgroundColor = DEFAULT_BANNER_COLOR;
    }
}

// เริ่มต้นโหลดหน้าเว็บ
window.onload = loadProfile;
