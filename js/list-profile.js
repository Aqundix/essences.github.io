import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, orderBy, updateDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// --- UI Elements ---
const loader = document.getElementById('loadingScreen');
const container = document.getElementById('userProfileCardContainer');
const modal = document.getElementById('profileModal');
const modalContent = document.getElementById('modalContent');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

// --- 1. ฟังก์ชันจัดการหน้าโหลด ---
const hideLoading = () => {
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.classList.add('hidden'), 500);
    }
};

// --- 2. ฟังก์ชันดึงโปรไฟล์แบบ Real-time ---
function displayAllProfiles() {
    if (!container) return;
    const q = query(collection(db, "profiles"));

    onSnapshot(q, (querySnapshot) => {
        container.innerHTML = `
            <div class="w-full flex justify-center items-center mb-8">
                <h2 class="text-gray-500 text-[10px] uppercase tracking-[0.4em] text-center">
                    Member Directory
                </h2>
            </div>
        `;
        
        container.className = "w-full flex flex-col items-center justify-center";
        container.classList.remove('hidden');

        if (querySnapshot.empty) {
            document.getElementById('noProfileText')?.classList.remove('hidden');
            hideLoading();
            return;
        } else {
            document.getElementById('noProfileText')?.classList.add('hidden');
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const isOwner = auth.currentUser && data.uid === auth.currentUser.uid;
            const hasBanner = data.banner && data.banner !== "";
            const backgroundStyle = hasBanner 
                ? `background-image: url('${data.banner}'); background-size: cover; background-position: center;` 
                : `background-color: #111;`;

            const card = document.createElement('div');
            card.className = "relative w-full max-w-[450px] mb-4 rounded-[2rem] border border-white/5 overflow-hidden shadow-xl cursor-pointer hover:border-green-500/50 transition-all mx-auto min-h-[110px] flex items-center profile-card";
            card.setAttribute('style', backgroundStyle);
            
            card.innerHTML = `
                <div class="absolute inset-0 ${hasBanner ? 'bg-black/50 backdrop-blur-[1px]' : 'bg-[#111]'}"></div>
                <div class="relative z-10 px-5 py-4 flex items-center gap-5 w-full">
                    <div class="relative flex-shrink-0">
                        <img src="${data.photoURL || 'https://img.icons8.com/bubbles/200/user.png'}" 
                             class="w-16 h-16 rounded-full border-[3px] border-green-500/80 object-cover shadow-lg bg-[#222]">
                        <div class="absolute bottom-0 right-0 w-4 h-4 bg-[#23a559] border-2 border-black rounded-full"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <h3 class="text-lg font-bold text-white tracking-tight drop-shadow-lg">${data.displayName || 'Unknown'}</h3>
                            ${isOwner ? '<span class="text-[9px] bg-[#23a559] text-black px-2 py-0.5 rounded-full font-black shadow-md">YOU</span>' : ''}
                        </div>
                        <p class="text-gray-300 text-xs mt-0.5 drop-shadow-md">@${data.username || 'user'}</p>
                    </div>
                    <div class="text-white/40 pr-2"><i class="fas fa-chevron-right text-sm"></i></div>
                </div>
            `;
            
            card.onclick = () => openProfileModal(data);
            container.appendChild(card);
        });
        hideLoading();
    }, (error) => {
        console.error("Profiles Error:", error);
        hideLoading();
    });
}

// --- 3. ระบบ Modal ---
function openProfileModal(data) {
    if (!modal || !modalContent) return;

    document.getElementById('modalName').textContent = data.displayName || "Unknown User";
    document.getElementById('modalUsername').textContent = `@${data.username || 'user'}`;
    document.getElementById('modalBio').textContent = data.bio || "No bio yet...";
    document.getElementById('modalAvatar').src = data.photoURL || 'https://img.icons8.com/bubbles/200/user.png';
    
    const banner = document.getElementById('modalBanner');
    if (data.banner && data.banner !== "") {
        banner.style.backgroundImage = `url(${data.banner})`;
        banner.style.backgroundSize = 'cover';
        banner.style.backgroundPosition = 'center';
    } else {
        banner.style.backgroundImage = 'none';
        banner.style.backgroundColor = '#5865f2';
    }

    const date = data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('th-TH') : 'N/A';
    document.getElementById('modalDate').textContent = date;

    modalContent.style.transition = 'none';
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'scale(0.9) translateY(20px)';

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    requestAnimationFrame(() => {
        modalContent.offsetHeight;
        modalContent.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        modalContent.style.opacity = '1';
        modalContent.style.transform = 'scale(1) translateY(0)';
    });
}

const closeModal = () => {
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'scale(0.9) translateY(20px)';
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
};

// --- 4. ระบบเปิด-ปิด Sidebar ---
const toggleSidebar = (isOpen) => {
    if (isOpen) {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
        document.body.style.overflow = '';
        setTimeout(() => { if (sidebar.classList.contains('-translate-x-full')) overlay.classList.add('hidden'); }, 400);
    }
};

// --- 5. ระบบ Notifications (Real-time) ---
function listenToNotifications(userId) {
    const notiBadge = document.getElementById('notiBadge');
    const notiList = document.getElementById('notiList');
    if (!notiBadge || !notiList) return;

    const q = query(
        collection(db, "notifications"),
        where("receiverId", "==", userId),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        let unreadCount = 0;
        let html = "";

        if (snapshot.empty) {
            html = '<div class="p-4 text-center text-gray-500 text-[11px]">ไม่มีการแจ้งเตือนใหม่</div>';
        } else {
            snapshot.forEach(docSnap => {
                const noti = docSnap.data();
                if (noti.status === "unread") unreadCount++;

                const typeColor = noti.type === 'approve' ? 'text-green-400' : 'text-red-400';
                
                // จัดการเรื่องวันที่ให้ปลอดภัย
                let dateStr = "";
                if (noti.createdAt) {
                    const d = noti.createdAt.toDate ? noti.createdAt.toDate() : new Date(noti.createdAt);
                    dateStr = d.toLocaleDateString('th-TH');
                }

                html += `
                    <div class="p-3 border-b border-white/5 hover:bg-white/5 transition-all ${noti.status === 'unread' ? 'bg-blue-500/5' : ''}">
                        <div class="flex justify-between items-start">
                            <span class="text-[11px] font-bold ${typeColor}">${noti.title || 'Notification'}</span>
                            <span class="text-[9px] text-gray-500">${dateStr}</span>
                        </div>
                        <p class="text-[10px] text-gray-400 mt-1">${noti.message || ''}</p>
                    </div>
                `;
            });
        }

        if (unreadCount > 0) {
            notiBadge.textContent = unreadCount;
            notiBadge.classList.remove('hidden');
        } else {
            notiBadge.classList.add('hidden');
        }
        notiList.innerHTML = html;
    }, (err) => {
        console.error("Noti Error (Check Index!):", err);
    });
}

async function markAllAsRead(userId) {
    const q = query(collection(db, "notifications"), where("receiverId", "==", userId), where("status", "==", "unread"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (docSnap) => {
        await updateDoc(docSnap.ref, { status: "read" });
    });
}

// --- 6. Event Listeners ---
document.getElementById('openMenu').onclick = () => toggleSidebar(true);
document.getElementById('closeMenu').onclick = () => toggleSidebar(false);
document.getElementById('overlay').onclick = () => toggleSidebar(false);
document.getElementById('closeModal').onclick = closeModal;
document.getElementById('modalOverlay').onclick = closeModal;
document.getElementById('logoutBtn').onclick = () => signOut(auth);

document.getElementById('notiBell').onclick = (e) => {
    e.stopPropagation();
    const notiBox = document.getElementById('notiBox');
    const isOpening = notiBox.classList.toggle('hidden');
    if (!isOpening && auth.currentUser) markAllAsRead(auth.currentUser.uid);
};

document.addEventListener('click', () => document.getElementById('notiBox')?.classList.add('hidden'));

// --- 7. Auth Change ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (user.email === ADMIN_EMAIL) document.getElementById('adminSidebarLink')?.classList.remove('hidden');
        if (user.photoURL) {
            const icon = document.getElementById('headerUserIcon');
            if(icon) icon.innerHTML = `<img src="${user.photoURL}" class="w-full h-full object-cover">`;
        }
        displayAllProfiles();
        listenToNotifications(user.uid);
    } else {
        window.location.href = "../index.html";
    }
});