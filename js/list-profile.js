import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, getDocs, getDoc, collection, query, where, onSnapshot, orderBy, limit 
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

const ADMIN_EMAIL = "tyfrlegends@gmail.com";

// --- ฟังก์ชันปิดหน้า Loading (บังคับปิดเสมอ) ---
const hideLoading = () => {
    const loader = document.getElementById('loadingScreen');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => { 
            loader.classList.add('hidden');
        }, 500);
    }
};

// --- ระบบแสดงโปรไฟล์ทั้งหมด ---
async function displayAllProfiles() {
    const container = document.getElementById('userProfileCardContainer');
    const noText = document.getElementById('noProfileText');
    if (!container) return;

    try {
        const querySnapshot = await getDocs(collection(db, "profiles"));
        
        if (querySnapshot.empty) {
            noText?.classList.remove('hidden');
            container.classList.add('hidden');
        } else {
            noText?.classList.add('hidden');
            container.classList.remove('hidden');
            
            let html = `<h2 class="text-gray-500 text-[10px] mb-8 uppercase tracking-[0.3em] w-full text-center">Member Directory</h2>`;
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const isOwner = auth.currentUser && data.uid === auth.currentUser.uid;
                html += `
                    <div class="profile-card relative w-full mb-10 rounded-[2rem] bg-gradient-to-br from-[#1e1f22] to-black border border-white/10 p-6 overflow-hidden">
                        ${data.banner ? `<img src="${data.banner}" class="absolute top-0 left-0 w-full h-24 object-cover opacity-30">` : ''}
                        <div class="relative z-10 flex flex-col items-center sm:items-start pt-8">
                            <img src="${data.photoURL || 'https://img.icons8.com/bubbles/200/user.png'}" class="w-20 h-20 rounded-full border-4 border-black mb-4">
                            <h3 class="text-xl font-bold text-white">${data.displayName} ${isOwner ? '<span class="text-[9px] bg-green-500 text-black px-2 py-0.5 rounded-full ml-2">YOU</span>' : ''}</h3>
                            <p class="text-gray-400 text-sm">@${data.username || data.email.split('@')[0]}</p>
                            <button onclick="viewUserData('${docSnap.id}')" class="mt-4 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-full text-sm transition">View Profile</button>
                        </div>
                    </div>`;
            });
            container.innerHTML = html;
        }
    } catch (e) {
        console.error("Display Error:", e);
    } finally {
        hideLoading(); // ไม่ว่าจะ Error หรือ สำเร็จ ต้องปิด Loading
    }
}

// --- ระบบแจ้งเตือน (Notifications) ---
function setupNotifications(user) {
    const list = document.getElementById('notiList');
    const badge = document.getElementById('notiBadge');
    if (!list) return;

    // คำเตือน: ถ้าตรงนี้ Error ให้เช็ค Firebase Index
    const q = query(collection(db, "notifications"), where("receiverId", "==", user.uid), orderBy("createdAt", "desc"), limit(5));
    
    onSnapshot(q, (snap) => {
        let unread = 0;
        list.innerHTML = "";
        if(snap.empty) {
            list.innerHTML = `<div class="p-6 text-center text-gray-600 italic">ไม่มีแจ้งเตือน</div>`;
            badge?.classList.add('hidden');
            return;
        }
        snap.forEach(docSnap => {
            const d = docSnap.data();
            if(d.status === 'unread') unread++;
            list.innerHTML += `
                <div class="p-4 border-b border-gray-900">
                    <div class="font-bold ${d.type === 'success' ? 'text-green-400' : 'text-red-400'}">${d.title}</div>
                    <div class="text-[11px] text-gray-400">${d.message}</div>
                </div>`;
        });
        if(badge) unread > 0 ? badge.classList.remove('hidden') : badge.classList.add('hidden');
    }, (err) => {
        console.warn("Notification error (Check Index):", err);
        hideLoading(); // ป้องกันค้างถ้า Noti พัง
    });
}

// --- การทำงานหลักเมื่อ User ล็อกอิน ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        setupNavigation();
        displayAllProfiles();
        //setupNotifications(user);
        
        // ตรวจสอบ Admin
        if (user.email === ADMIN_EMAIL) {
            document.getElementById('adminSidebarLink')?.classList.remove('hidden');
        }

        // อัปเดตรูป Header
        const headerIcon = document.getElementById('headerUserIcon');
        if (headerIcon && user.photoURL) {
            headerIcon.innerHTML = `<img src="${user.photoURL}" class="w-full h-full object-cover">`;
        }
    } else {
        window.location.href = "../index.html";
    }
});

// --- Event Listeners อื่นๆ ---
window.viewUserData = async (uid) => {
    try {
        const docSnap = await getDoc(doc(db, "profiles", uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('modalName').innerText = data.displayName;
            document.getElementById('modalUsername').innerText = `@${data.username || 'user'}`;
            document.getElementById('modalBio').innerText = data.bio || '-';
            document.getElementById('modalAvatarImg').src = data.photoURL;
            document.getElementById('viewProfileModal').classList.remove('hidden');
        }
    } catch (e) { console.error(e); }
};

document.getElementById('closeProfileBtn').onclick = () => document.getElementById('viewProfileModal').classList.add('hidden');
document.getElementById('notiBell').onclick = (e) => {
    e.stopPropagation();
    document.getElementById('notiBox').classList.toggle('hidden');
};
document.getElementById('logoutBtn').onclick = () => signOut(auth);
document.addEventListener('click', () => document.getElementById('notiBox')?.classList.add('hidden'));

const setupNavigationUI = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    document.getElementById('openMenu').onclick = () => { sidebar.classList.remove('-translate-x-full'); overlay.classList.remove('hidden'); };
    document.getElementById('closeMenu').onclick = () => { sidebar.classList.add('-translate-x-full'); overlay.classList.add('hidden'); };
};
setupNavigationUI();

