import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, getDocs, getDoc, collection, deleteDoc 
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

// --- 1. ระบบ UI & Loading ---
const setupNavigation = () => {
    const openBtn = document.getElementById('openMenu');
    const closeBtn = document.getElementById('closeMenu');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    const toggle = (show) => {
        sidebar?.classList.toggle('-translate-x-full', !show);
        overlay?.classList.toggle('hidden', !show);
    };

    if (openBtn) openBtn.onclick = () => toggle(true);
    if (closeBtn) closeBtn.onclick = () => toggle(false);
    if (overlay) overlay.onclick = () => toggle(false);
};

const hideLoading = () => {
    const loader = document.getElementById('loadingScreen');
    if (loader) {
        loader.classList.add('opacity-0');
        setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
};

// --- 2. ฟังก์ชันแสดงผลโปรไฟล์ทั้งหมด ---
async function displayAllProfiles() {
    const container = document.getElementById('userProfileCardContainer');
    if (!container) return;

    try {
        const querySnapshot = await getDocs(collection(db, "profiles"));
        const currentUser = auth.currentUser;
        
        let html = `<h2 class="text-gray-500 text-[10px] mb-8 uppercase tracking-[0.3em] w-full text-center">Member Directory</h2>`;
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const isOwner = currentUser && data.uid === currentUser.uid;

            let displayUsername = data.username ? `@${data.username}` : `@${data.email.split('@')[0]}`;

            html += `
                <div class="profile-card relative w-full overflow-hidden mb-10 rounded-[2rem] bg-gradient-to-br from-[#1e1f22] to-black border border-white/10 shadow-2xl">
                    <div class="h-32 w-full overflow-hidden bg-gray-800">
                        ${data.banner ? `<img src="${data.banner}" class="w-full h-full object-cover">` : ''}
                    </div>
                    
                    <div class="px-8 pb-10 flex flex-col items-center sm:items-start relative z-10 -mt-12">
                        <div class="w-24 h-24 rounded-full border-4 border-black bg-[#2b2d31] overflow-hidden shadow-xl mb-4">
                            <img src="${data.photoURL || 'https://img.icons8.com/bubbles/200/user.png'}" class="w-full h-full object-cover">
                        </div>
                        
                        <div class="text-center sm:text-left">
                            <div class="flex items-center justify-center sm:justify-start gap-2">
                                <h3 class="text-2xl font-bold text-white">${data.displayName || 'User'}</h3>
                                ${isOwner ? '<span class="text-[9px] bg-[#4ade80] text-black font-extrabold px-2 py-0.5 rounded-full">YOU</span>' : ''}
                            </div>
                            <p class="text-gray-400 font-medium text-sm">${displayUsername}</p>
                            <p class="text-gray-300 text-sm mt-3 opacity-80 leading-relaxed line-clamp-2">${data.bio || 'ไม่มีข้อมูลแนะนำตัว...'}</p>
                        </div>

                        <div class="mt-8 w-full flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
                            ${isOwner ? 
                                `<a href="edit-profile.html" class="bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold py-2.5 px-8 rounded-full transition duration-300 text-center shadow-lg">
                                    <i class="fas fa-edit mr-2"></i> Edit Profile
                                </a>` : 
                                `<button onclick="viewUserData('${docSnap.id}')" class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 px-8 rounded-full transition duration-300 text-center shadow-lg">
                                    <i class="fas fa-search mr-2"></i> View Profile
                                </button>`
                            }
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        container.classList.remove('hidden'); 
        hideLoading();
    } catch (e) {
        console.error("Error:", e);
        hideLoading();
    }
}

// --- 3. ระบบ Modal ดูโปรไฟล์ ---
window.viewUserData = async (uid) => {
    try {
        const docRef = doc(db, "profiles", uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            document.getElementById('modalName').textContent = data.displayName || 'User';
            document.getElementById('modalUsername').textContent = `@${data.username || data.email.split('@')[0]}`;
            document.getElementById('modalBio').textContent = data.bio || 'คนนี้ยังไม่มีคำแนะนำตัว...';
            document.getElementById('modalAvatarImg').src = data.photoURL || 'https://img.icons8.com/bubbles/200/user.png';
            
            const bannerImg = document.getElementById('modalBannerImg');
            if (data.banner) {
                bannerImg.src = data.banner;
                bannerImg.classList.remove('hidden');
            } else {
                bannerImg.classList.add('hidden');
            }

            document.getElementById('viewProfileModal').classList.remove('hidden');
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
    }
};

// ปิด Modal
const closeBtn = document.getElementById('closeProfileBtn');
const overlayBtn = document.getElementById('closeProfileOverlay');
if(closeBtn) closeBtn.onclick = () => document.getElementById('viewProfileModal').classList.add('hidden');
if(overlayBtn) overlayBtn.onclick = () => document.getElementById('viewProfileModal').classList.add('hidden');

// --- 4. ตรวจสอบสถานะและ Logout ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        setupNavigation();
        displayAllProfiles();
        const headerIcon = document.getElementById('headerUserIcon');
        if (headerIcon && user.photoURL) {
            headerIcon.innerHTML = `<img src="${user.photoURL}" class="w-full h-full rounded-full object-cover">`;
        }
    } else {
        window.location.href = "../index.html";
    }
});

const logoutModal = document.getElementById('logoutModal');
if(document.getElementById('logoutBtn')) document.getElementById('logoutBtn').onclick = () => logoutModal?.classList.remove('hidden');
if(document.getElementById('cancelLogout')) document.getElementById('cancelLogout').onclick = () => logoutModal?.classList.add('hidden');

if(document.getElementById('confirmLogout')) document.getElementById('confirmLogout').onclick = () => signOut(auth).then(() => window.location.href = "../index.html");

import { getFirestore, collection, query, where, onSnapshot, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

onAuthStateChanged(auth, (user) => {
    if (user) {
        const q = query(collection(db, "notifications"), where("receiverId", "==", user.uid), orderBy("createdAt", "desc"), limit(5));
        onSnapshot(q, (snap) => {
            const list = document.getElementById('notiList');
            const badge = document.getElementById('notiBadge');
            let unread = 0;
            list.innerHTML = "";
            
            if(snap.empty) {
                list.innerHTML = `<div class="p-6 text-center text-gray-600">ไม่มีการแจ้งเตือน</div>`;
                badge.classList.add('hidden'); return;
            }

            snap.forEach(doc => {
                const d = doc.data();
                if(d.status === 'unread') unread++;
                const item = document.createElement('div');
                item.className = `p-4 border-b border-gray-900 hover:bg-white/5 transition`;
                item.innerHTML = `<div class="font-bold ${d.type === 'success' ? 'text-green-400' : 'text-red-400'}">${d.title}</div><div class="text-gray-400 mt-1">${d.message}</div>`;
                list.appendChild(item);
            });
            unread > 0 ? badge.classList.remove('hidden') : badge.classList.add('hidden');
        });
    }
});

document.getElementById('notiBell').onclick = (e) => {
    e.stopPropagation();
    document.getElementById('notiBox').classList.toggle('hidden');
};
document.addEventListener('click', () => document.getElementById('notiBox').classList.add('hidden'));
