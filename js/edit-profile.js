import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, setDoc, deleteDoc, 
    addDoc, collection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBXf1-WXXaPd_IModQCb0I8NwvsZ1rgJWU",
    authDomain: "aqundix-d3f38.firebaseapp.com",
    projectId: "aqundix-d3f38",
    storageBucket: "aqundix-d3f38.firebasestorage.app",
    messagingSenderId: "923430604932",
    appId: "1:923430604932:web:cc2985eaa5125dc9ef72d1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 1. ค่าเริ่มต้นและรูปสำรอง ---
const DEFAULT_AVATAR = "https://img.icons8.com/bubbles/200/user.png";
const DEFAULT_BANNER = ""; // ปล่อยว่างไว้ตาม CSS ที่คุณเขียนให้ซ่อนถ้าไม่มี src

// UI Elements
const editName = document.getElementById('editName');
const editBio = document.getElementById('editBio');
const previewName = document.getElementById('previewName');
const previewBio = document.getElementById('previewBio');
const previewEmail = document.getElementById('previewEmail');
const previewAvatar = document.getElementById('previewAvatar');
const previewBanner = document.getElementById('previewBanner');
const saveBtn = document.getElementById('saveBtn');

// --- 2. ฟังก์ชันจัดการรูปภาพเสีย (Broken Image) ---
const validateImage = (imgElement, fallback) => {
    imgElement.onerror = () => {
        imgElement.src = fallback;
        imgElement.onerror = null;
    };
};

// โค้ดในหน้า edit-profile.js (ฝั่งผู้ใช้)
async function handleSubmit() {
    const profileData = {
        name: document.getElementById('editName').value,
        bio: document.getElementById('editBio').value,
        avatar: document.getElementById('previewAvatar').src,
        banner: document.getElementById('previewBanner').src,
        status: "pending",
        submittedAt: new Date(),
        userId: "ID_ของผู้ใช้" // เช่น auth.currentUser.uid
    };

    try {
        // บันทึกลงถัง "รออนุมัติ" แทนการลง profile จริง
        await addDoc(collection(db, "pending_approvals"), profileData);
        alert("ส่งคำขอแก้ไขโปรไฟล์แล้ว กรุณารอแอดมินอนุมัติผ่านอีเมล");
    } catch (error) {
        console.error("Error:", error);
    }
}

// --- 3. ฟังก์ชันดึงข้อมูลผู้ใช้ ---
const loadUserData = async (user) => {
    try {
        const docRef = doc(db, "profiles", user.uid);
        const docSnap = await getDoc(docRef);
        const defaultUsername = user.email.split('@')[0]; 
        
        if (previewEmail) previewEmail.textContent = `@${defaultUsername}`;

        if (docSnap.exists()) {
            const data = docSnap.data();
            editName.value = data.displayName || user.displayName || defaultUsername;
            editBio.value = data.bio || "";
            previewName.textContent = editName.value;
            previewBio.textContent = data.bio || "Nothing here yet...";
            
            // ตั้งค่ารูปภาพ
            previewAvatar.src = data.photoURL || user.photoURL || DEFAULT_AVATAR;
            previewBanner.src = data.banner || DEFAULT_BANNER;
        } else {
            editName.value = user.displayName || defaultUsername;
            previewName.textContent = editName.value;
            previewAvatar.src = user.photoURL || DEFAULT_AVATAR;
            previewBanner.src = DEFAULT_BANNER;
        }
        
        validateImage(previewAvatar, DEFAULT_AVATAR);
        validateImage(previewBanner, DEFAULT_BANNER);

    } catch (error) {
        console.error("Error loading profile:", error);
    }
};

// --- 4. ระบบจัดการอัปโหลดและ "ลบรูปภาพ" ---
const setupImageActions = (triggerId, inputId, previewId, removeBtnId, fallbackUrl) => {
    const trigger = document.getElementById(triggerId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const removeBtn = document.getElementById(removeBtnId);

    if (trigger && input) {
        trigger.onclick = (e) => {
            if (e.target !== removeBtn && !removeBtn.contains(e.target)) {
                input.click();
            }
        };

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 1024 * 1024) { // จำกัด 1MB สำหรับ Base64
                    alert("Image size is too large (Limit 1MB)");
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => { preview.src = event.target.result; };
                reader.readAsDataURL(file);
            }
        };
    }

    if (removeBtn) {
        removeBtn.onclick = (e) => {
            e.stopPropagation(); // ไม่ให้ไปเรียก trigger.onclick
            preview.src = fallbackUrl;
            if (input) input.value = ""; 
        };
    }
};

setupImageActions('avatarTrigger', 'avatarInput', 'previewAvatar', 'removeAvatarBtn', DEFAULT_AVATAR);
setupImageActions('bannerTrigger', 'bannerInput', 'previewBanner', 'removeBannerBtn', DEFAULT_BANNER);

// --- 5. ระบบบันทึกข้อมูล ---
if (saveBtn) {
    saveBtn.onclick = async () => {
        const user = auth.currentUser;
        if (!user) return;

        saveBtn.disabled = true;
        saveBtn.innerText = "Sending Request...";

        try {
            const usernameOnly = user.email.split('@')[0];
            
            // เตรียมข้อมูลที่จะส่งไปให้แอดมินตรวจ
            const requestData = {
                uid: user.uid,
                email: user.email, 
                displayName: editName.value || usernameOnly,
                bio: editBio.value,
                photoURL: previewAvatar.src,
                banner: previewBanner.src,
                status: "pending",
                submittedAt: new Date().toISOString()
            };

            // บันทึกลง "pending_approvals" แทน "profiles"
            await addDoc(collection(db, "pending_approvals"), requestData);

            alert("ส่งคำขอแก้ไขโปรไฟล์แล้ว! โปรไฟล์จะอัปเดตหลังจากแอดมินตรวจสอบผ่าน Gmail");
            window.location.href = "../page/list-profile.html"; 
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerText = "Save Changes";
        }
    };
}

// --- 6. ส่วนประกอบอื่นๆ (Live Preview, Auth, Delete) ---
editName.oninput = (e) => previewName.textContent = e.target.value || "User Name";
editBio.oninput = (e) => previewBio.textContent = e.target.value || "Nothing here yet...";

onAuthStateChanged(auth, (user) => {
    if (user) loadUserData(user);
    else window.location.href = "../index.html";
});

document.getElementById('deleteProfileBtn').onclick = async () => {
    const user = auth.currentUser;
    if (confirm("⚠️ Are you sure you want to delete your profile?")) {
        try {
            await deleteDoc(doc(db, "profiles", user.uid));
            await signOut(auth);
            window.location.href = "../index.html";
        } catch (error) { alert("Delete failed: " + error.message); }
    }

};

