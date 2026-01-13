// ดึง ID จาก URL
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('id') || "1";
const DEFAULT_AVATAR = "../img/profile.jpg";
const DEFAULT_BANNER_COLOR = "#5865f2";

const firebaseConfig = {
    apiKey: "AIzaSyBXf1-WXXaPd_IModQCbBI8NwvsZ1rgJWU",
    authDomain: "aqundix-d3f38.firebaseapp.com",
    projectId: "aqundix-d3f38",
    storageBucket: "aqundix-d3f38.firebasestorage.app",
    messagingSenderId: "923430604932",
    appId: "1:923430604932:web:a06344e33b3df87aef72d1",
    measurementId: "G-NC6SKF25ZB"
};

// --- ตั้งค่าระบบฐานข้อมูล (IndexedDB) ---
const dbName = "ProfileDB";
const storeName = "member_data";

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: "id" });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject("Database error: " + e.target.errorCode);
    });
}

// --- ใหม่: ฟังก์ชันตรวจสอบสิทธิ์การเข้าถึง ---
async function checkAccess() {
    const myOwnedProfile = localStorage.getItem('my_owned_profile');
    
    // 1. ถ้าเครื่องนี้เคยจอง ID อื่นไว้แล้ว แต่พยายามจะมาหน้า ID นี้
    if (myOwnedProfile && myOwnedProfile !== userId) {
        alert(`คุณได้สิทธิ์ดูแลโปรไฟล์ ID: ${myOwnedProfile} ไปแล้ว ไม่สามารถแก้ไขโปรไฟล์อื่นได้`);
        window.location.href = "../index.html";
        return false;
    }

    const db = await initDB();
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(userId);

    return new Promise((resolve) => {
        request.onsuccess = () => {
            const data = request.result;
            // 2. ถ้าโปรไฟล์นี้ถูก Locked (มีคนอื่นเซฟไปแล้ว) และไม่ใช่เราที่เป็นเจ้าของ
            if (data && data.isLocked && myOwnedProfile !== userId) {
                alert("โปรไฟล์นี้มีผู้ใช้คนอื่นดูแลอยู่แล้ว ไม่สามารถแก้ไขได้");
                window.location.href = "../index.html";
                resolve(false);
            }
            resolve(true);
        };
    });
}

// ฟังก์ชันโหลดข้อมูล
async function loadProfile() {
    // ตรวจสอบสิทธิ์ก่อนโหลดข้อมูล
    const hasPermission = await checkAccess();
    if (!hasPermission) return;

    try {
        const formattedTag = "@" + userId.padStart(4, '0');
        const db = await initDB();
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(userId);

        request.onsuccess = () => {
            const data = request.result;
            if (data) {
                data.tag = formattedTag;
                updateDisplay(data);
            } else {
                updateDisplay({
                    name: "Username " + userId,
                    tag: formattedTag,
                    about: "คลิกปุ่ม Edit เพื่อเริ่มแก้ไขโปรไฟล์ของคุณ...",
                    avatar: DEFAULT_AVATAR,
                    banner: "",
                    fb: "", ig: "", gh: ""
                });
            }
        };
    } catch (e) {
        console.error("Load error:", e);
    }
}

function updateDisplay(data) {
    document.getElementById('displayName').innerText = data.name;
    document.getElementById('displayTag').innerText = data.tag;
    document.getElementById('displayAbout').innerText = data.about;
    document.getElementById('displayAvatar').src = data.avatar || DEFAULT_AVATAR;
    
    const banner = document.getElementById('displayBanner');
    if (data.banner && data.banner !== "none" && data.banner !== "") {
        banner.style.backgroundImage = data.banner.includes('url(') ? data.banner : `url("${data.banner}")`;
        banner.style.backgroundSize = "cover";
        banner.style.backgroundPosition = "center";
    } else {
        banner.style.backgroundImage = "none";
        banner.style.backgroundColor = DEFAULT_BANNER_COLOR;
    }

    const socialCard = document.getElementById('socialCard');
    const hasSocial = data.fb || data.ig || data.gh;
    socialCard.style.display = hasSocial ? 'block' : 'none';
    
    if(hasSocial) {
        document.getElementById('itemFB').style.display = data.fb ? 'flex' : 'none';
        if(data.fb) document.getElementById('linkFB').href = data.fb;
        document.getElementById('itemIG').style.display = data.ig ? 'flex' : 'none';
        if(data.ig) document.getElementById('linkIG').href = data.ig;
        document.getElementById('itemGH').style.display = data.gh ? 'flex' : 'none';
        if(data.gh) document.getElementById('linkGH').href = data.gh;
    }
}

function showPreview(input, previewId, isBanner = false) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById(previewId);
            if (isBanner) {
                preview.style.backgroundImage = `url("${e.target.result}")`;
                preview.style.backgroundSize = "cover";
                preview.style.backgroundPosition = "center";
            } else {
                preview.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
}

// ฟังก์ชัน Save (เพิ่มระบบล็อกสิทธิ์)
async function saveProfile() {
    const newData = {
        id: userId,
        name: document.getElementById('inputName').value,
        about: document.getElementById('inputAbout').value,
        avatar: document.getElementById('previewAvatar').src, // เก็บเป็น Base64 หรือ Path
        banner: document.getElementById('previewBanner').style.backgroundImage,
        fb: document.getElementById('inputFB').value,
        ig: document.getElementById('inputIG').value,
        gh: document.getElementById('inputGH').value,
        isLocked: true, // บอกระบบว่าโปรไฟล์นี้มีคนจองแล้ว
        lastUpdated: new Date().getTime() // เก็บเวลาที่อัปเดตล่าสุด
    };

    try {
        const db = await initDB();
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        
        // ใช้ .put() เพื่อเขียนทับข้อมูลเดิมหรือสร้างใหม่หากยังไม่มี
        store.put(newData);

        transaction.oncomplete = () => {
            localStorage.setItem('my_owned_profile', userId);
            alert("บันทึกและอัปโหลดข้อมูลเข้าสู่ระบบเรียบร้อย!");
            updateDisplay(newData);
            closeModal();
        };
    } catch (e) {
        console.error("Save error:", e);
    }
}

function removeImage(previewId, type) {
    const preview = document.getElementById(previewId);
    if (type === 'avatar') {
        preview.src = DEFAULT_AVATAR;
        document.getElementById('uploadAvatar').value = "";
    } else if (type === 'banner') {
        preview.style.backgroundImage = "none";
        preview.style.backgroundColor = DEFAULT_BANNER_COLOR;
        document.getElementById('uploadBanner').value = "";
    }
}

async function openModal() {
    // ตรวจสอบสิทธิ์อีกครั้งก่อนเปิด Modal เพื่อความปลอดภัย
    const canEdit = await checkAccess();
    if (!canEdit) return;

    document.getElementById('editModal').style.display = 'flex';
    document.getElementById('inputName').value = document.getElementById('displayName').innerText;
    document.getElementById('inputAbout').value = document.getElementById('displayAbout').innerText;
    
    const db = await initDB();
    const tx = db.transaction(storeName, "readonly");
    const res = await new Promise(r => {
        const req = tx.objectStore(storeName).get(userId);
        req.onsuccess = () => r(req.result);
    });

    if (res) {
        document.getElementById('inputFB').value = res.fb || "";
        document.getElementById('inputIG').value = res.ig || "";
        document.getElementById('inputGH').value = res.gh || "";
    }
    
    document.getElementById('previewAvatar').src = document.getElementById('displayAvatar').src;
    document.getElementById('previewBanner').style.backgroundImage = document.getElementById('displayBanner').style.backgroundImage;
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

window.onload = loadProfile;


// --- เพิ่มฟังก์ชันนี้ลงใน profile.js ---

async function releaseProfile() {
    if (!confirm("คุณต้องการลบข้อมูลและคืนสิทธิ์โปรไฟล์นี้ใช่หรือไม่?\n(ข้อมูลในโปรไฟล์นี้จะถูกล้างและคุณจะสามารถไปเลือกโปรไฟล์อื่นได้)")) {
        return;
    }

    try {
        const db = await initDB();
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);

        // ลบข้อมูลโปรไฟล์นี้ออกจากฐานข้อมูล (หรือจะแค่ set isLocked เป็น false ก็ได้)
        // ในที่นี้เลือก delete เพื่อให้โปรไฟล์กลับเป็นค่าว่าง
        const request = store.delete(userId);

        request.onsuccess = () => {
            // ลบการจองในเครื่องผู้ใช้
            localStorage.removeItem('my_owned_profile');
            alert("คืนสิทธิ์โปรไฟล์เรียบร้อยแล้ว!");
            // ส่งกลับไปหน้าเลือกรายการ
            window.location.href = "../list-profile.html";
        };
    } catch (e) {
        alert("เกิดข้อผิดพลาด: " + e);
    }
}

// --- แก้ไขฟังก์ชัน loadProfile เพื่อให้ปุ่ม Reset แสดงเฉพาะเจ้าของ ---

async function loadProfile() {
    const hasPermission = await checkAccess();
    if (!hasPermission) return;

    // แสดงปุ่ม Reset Ownership เฉพาะในกรณีที่เครื่องนี้เป็นเจ้าของไอดีนี้
    const myOwnedProfile = localStorage.getItem('my_owned_profile');
    if (myOwnedProfile === userId) {
        document.getElementById('resetOwnershipBtn').style.display = 'inline-block';
    }

    // ... โค้ดส่วนที่เหลือของ loadProfile เดิม ...
    try {
        const formattedTag = "@" + userId.padStart(4, '0');
        const db = await initDB();
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(userId);

        request.onsuccess = () => {
            const data = request.result;
            if (data) {
                data.tag = formattedTag;
                updateDisplay(data);
            } else {
                updateDisplay({
                    name: "Username " + userId,
                    tag: formattedTag,
                    about: "คลิกปุ่ม Edit เพื่อเริ่มแก้ไขโปรไฟล์ของคุณ...",
                    avatar: DEFAULT_AVATAR,
                    banner: "",
                    fb: "", ig: "", gh: ""
                });
            }
        };
    } catch (e) {
        console.error("Load error:", e);
    }
}

function updateCharCount() {
    const textarea = document.getElementById('inputAbout');
    const counter = document.getElementById('charCounter');
    const currentLength = textarea.value.length;
    
    counter.innerText = `${currentLength} / 255`;
    
    // ถ้าเกิน 245 ตัวอักษร ให้เปลี่ยนสีเป็นสีส้ม (Class warning ใน CSS)
    if (currentLength >= 245) {
        counter.classList.add('warning');
    } else {
        counter.classList.remove('warning');
    }
}
