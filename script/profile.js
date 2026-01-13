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

// --- ฟังก์ชันที่ต้องส่งออกไปให้ HTML (window.) ---

window.openModal = async function() {
    const myOwnedProfile = localStorage.getItem('my_owned_profile');
    if (myOwnedProfile && myOwnedProfile !== userId) {
        alert(`คุณจอง ID: ${myOwnedProfile} ไปแล้ว ไม่สามารถแก้ไข ID อื่นได้`);
        return;
    }
    document.getElementById('editModal').style.display = 'flex';
};

window.closeModal = function() {
    document.getElementById('editModal').style.display = 'none';
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
    }
};

window.updateCharCount = function() {
    const text = document.getElementById('inputAbout').value;
    document.getElementById('charCounter').innerText = `${text.length} / 255`;
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
        alert("บันทึกสำเร็จ!");
        location.reload();
    } catch (e) {
        alert("บันทึกล้มเหลว: " + e.message);
    }
};

window.releaseProfile = async function() {
    if (confirm("ต้องการคืนสิทธิ์โปรไฟล์นี้หรือไม่?")) {
        await remove(ref(db, 'members/' + userId));
        localStorage.removeItem('my_owned_profile');
        window.location.href = "../index.html";
    }
};

// --- โหลดข้อมูลเมื่อเปิดหน้า ---
async function loadData() {
    const snapshot = await get(ref(db, 'members/' + userId));
    const data = snapshot.val();
    const formattedTag = "@" + userId.padStart(4, '0');

    if (data) {
        document.getElementById('displayName').innerText = data.name;
        document.getElementById('displayTag').innerText = formattedTag;
        document.getElementById('displayAbout').innerText = data.about;
        document.getElementById('displayAvatar').src = data.avatar || DEFAULT_AVATAR;
        if (data.banner) document.getElementById('displayBanner').style.backgroundImage = data.banner;
        
        // ใส่ข้อมูลลงใน Modal เตรียมไว้
        document.getElementById('inputName').value = data.name;
        document.getElementById('inputAbout').value = data.about;
        document.getElementById('previewAvatar').src = data.avatar || DEFAULT_AVATAR;
        document.getElementById('previewBanner').style.backgroundImage = data.banner || "";
        document.getElementById('inputFB').value = data.fb || "";
        document.getElementById('inputIG').value = data.ig || "";
        document.getElementById('inputGH').value = data.gh || "";

        // จัดการเรื่องปุ่ม Restore และ Social Card
        const myOwned = localStorage.getItem('my_owned_profile');
        if (myOwned === userId) document.getElementById('resetOwnershipBtn').style.display = 'inline-block';
        
        if (data.fb || data.ig || data.gh) {
            document.getElementById('socialCard').style.display = 'block';
            if (data.fb) { document.getElementById('itemFB').style.display = 'flex'; document.getElementById('linkFB').href = data.fb; }
            if (data.ig) { document.getElementById('itemIG').style.display = 'flex'; document.getElementById('linkIG').href = data.ig; }
            if (data.gh) { document.getElementById('itemGH').style.display = 'flex'; document.getElementById('linkGH').href = data.gh; }
        }
    } else {
        document.getElementById('displayTag').innerText = formattedTag;
    }
}

window.onload = loadData;
