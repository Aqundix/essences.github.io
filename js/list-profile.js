import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDocs, getDoc, collection, query, where, onSnapshot, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const ADMIN_EMAIL = "tyfrlegends@gmail.com";

// --- 1. ระบบจัดการ Loading ---
const hideLoading = () => {
    const loader = document.getElementById('loadingScreen');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => { loader.classList.add('hidden'); }, 500);
    }
};

// --- 2. ดึงข้อมูลโปรไฟล์ทั้งหมด ---
async function displayAllProfiles() {
    const container = document.getElementById('userProfileCardContainer');
    try {
        const querySnapshot = await getDocs(collection(db, "profiles"));
        if (querySnapshot.empty) {
            document.getElementById('noProfileText')?.classList.remove('hidden');
        } else {
            let html = `<h2 class="text-gray-500 text-[10px] mb-8 uppercase tracking-[0.3em] w-full text-center">Member Directory</h2>`;
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const isOwner = auth.currentUser && data.uid === auth.currentUser.uid;
                html += `
                    <div class="relative w-full mb-8 rounded-3xl bg-[#111] border border-white/5 p-6 shadow-xl">
                        <div class="flex items-center gap-4">
                            <img src="${data.photoURL || 'https://img.icons8.com/bubbles/200/user.png'}" class="w-16 h-16 rounded-full border-2 border-green-500">
                            <div>
                                <h3 class="text-lg font-bold text-white">${data.displayName} ${isOwner ? '<span class="text-[8px] bg-green-500 text-black px-2 py-0.5 rounded-full ml-2">YOU</span>' : ''}</h3>
                                <p class="text-gray-400 text-xs">@${data.username || 'user'}</p>
                            </div>
                        </div>
                    </div>`;
            });
            if (container) {
                container.innerHTML = html;
                container.classList.remove('hidden');
            }
        }
    } catch (e) {
        console.error("Display Error:", e);
    } finally {
        hideLoading(); // ปิดหน้าโหลดเสมอ
    }
}

// --- 3. ระบบแจ้งเตือน Real-time ---
function setupNotifications(user) {
    const list = document.getElementById('notiList');
    const badge = document.getElementById('notiBadge');
    if (!list) return;

    // คำเตือน: หากยังไม่ทำ Index ใน Firebase ส่วนนี้จะ Error และทำให้ค้าง
    const q = query(collection(db, "notifications"), where("receiverId", "==", user.uid), orderBy("createdAt", "desc"), limit(5));
    
    onSnapshot(q, (snap) => {
        let unread = 0;
        list.innerHTML = snap.empty ? `<div class="p-6 text-center text-gray-600 italic">ไม่มีแจ้งเตือน</div>` : "";
        
        snap.forEach(docSnap => {
            const d = docSnap.data();
            if(d.status === 'unread') unread++;
            list.innerHTML += `<div class="p-4 border-b border-gray-900">
                <div class="font-bold ${d.type === 'success' ? 'text-green-400' : 'text-red-400'}">${d.title}</div>
                <div class="text-gray-400 mt-1">${d.message}</div>
            </div>`;
        });
        if(badge) unread > 0 ? badge.classList.remove('hidden') : badge.classList.add('hidden');
    }, (err) => {
        console.warn("Notification error:", err);
        hideLoading(); // ถ้าพังก็ต้องปิดหน้าโหลด
    });
}

// --- 4. ตรวจสอบสถานะ User เมื่อเข้าหน้าเว็บ ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // เช็คสิทธิ์ Admin
        if (user.email === ADMIN_EMAIL) document.getElementById('adminSidebarLink')?.classList.remove('hidden');
        
        // อัปเดตรูป Header
        if (user.photoURL) document.getElementById('headerUserIcon').innerHTML = `<img src="${user.photoURL}" class="w-full h-full object-cover">`;

        displayAllProfiles();
        setupNotifications(user);
    } else {
        window.location.href = "../index.html";
    }
});

// ตัวอย่างโครงสร้าง HTML ที่คุณควรใส่ไว้ในไฟล์ list-profile.js
function createMemberCard(userData) {
    // ตรวจสอบว่ามี Banner ไหม ถ้าไม่มีให้ใช้สีพื้นหลังแทน
    const bannerUrl = userData.bannerURL || 'https://via.placeholder.com/800x200?text=No+Banner';

    return `
    <div class="member-card bg-[#111] border border-gray-800 rounded-2xl w-full mb-4 hover:border-green-500/50">
        <div class="member-banner" style="background-image: url('${bannerUrl}')"></div>
        
        <div class="member-content p-6 flex items-center gap-5">
            <div class="relative">
                <img src="${userData.profilePic || '../images/default.jpg'}" 
                     class="w-20 h-20 rounded-full border-4 border-[#111] relative z-20">
            </div>
            
            <div class="flex-1">
                <div class="flex items-center gap-2">
                    <h2 class="text-xl font-bold">${userData.displayName}</h2>
                    ${userData.isMe ? '<span class="bg-green-500 text-[10px] px-2 py-0.5 rounded-full text-black font-black uppercase">YOU</span>' : ''}
                </div>
                <p class="text-gray-400 text-sm">@user</p>
            </div>
        </div>
    </div>
    `;
}

// --- UI Event Listeners ---
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

document.getElementById('openMenu').onclick = () => { sidebar.classList.remove('-translate-x-full'); overlay.classList.remove('hidden'); };
document.getElementById('closeMenu').onclick = () => { sidebar.classList.add('-translate-x-full'); overlay.classList.add('hidden'); };
document.getElementById('overlay').onclick = () => { sidebar.classList.add('-translate-x-full'); overlay.classList.add('hidden'); };

document.getElementById('notiBell').onclick = (e) => {
    e.stopPropagation();
    document.getElementById('notiBox').classList.toggle('hidden');
};
document.addEventListener('click', () => document.getElementById('notiBox').classList.add('hidden'));

document.getElementById('logoutBtn').onclick = () => signOut(auth);

