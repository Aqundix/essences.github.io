const DEFAULT_BIO = "Welcome to my profile! This is a premium full-screen layout.";
const ICON_MAP = {
    'Instagram': 'fa-brands fa-instagram',
    'TikTok': 'fa-brands fa-tiktok',
    'Discord': 'fa-brands fa-discord',
    'Facebook': 'fa-brands fa-facebook',
    'Youtube': 'fa-brands fa-youtube',
    'Github': 'fa-brands fa-github',
    'Link': 'fa-solid fa-link'
};

let socialLinks = JSON.parse(localStorage.getItem('savedSocials')) || [];

// โหลดข้อมูลจาก LocalStorage เมื่อเปิดหน้าเว็บ
document.addEventListener("DOMContentLoaded", () => {
    const sName = localStorage.getItem('pName');
    const sBio = localStorage.getItem('pBio');
    const sAvatar = localStorage.getItem('pAvatar');
    const sBanner = localStorage.getItem('pBanner');

    if (sName) document.getElementById('text-name').innerText = sName;
    if (sBio) document.getElementById('text-bio').innerText = sBio;
    if (sAvatar) document.getElementById('display-avatar').src = sAvatar;
    if (sBanner) document.getElementById('display-banner').style.backgroundImage = `url('${sBanner}')`;
    
    renderSocials();
});

function switchView(viewId) {
    const views = document.querySelectorAll('.view');
    const targetView = document.getElementById(viewId);

    if (!targetView) return;

    // 1. เริ่มจางหน้าเก่าออก
    views.forEach(v => {
        v.style.opacity = '0';
        v.style.transform = 'translateY(15px)';
    });

    // 2. รอให้หน้าเก่าจางหายไป (300ms) แล้วจึงเปลี่ยนสถานะ Active
    setTimeout(() => {
        views.forEach(v => {
            v.classList.remove('active');
            v.style.display = 'none'; // ซ่อนหน้าอื่นทั้งหมด
        });

        // 3. แสดงหน้าใหม่
        targetView.style.display = 'flex';
        
        // ใช้ setTimeout เล็กน้อยเพื่อให้ Browser รับรู้การเปลี่ยน display ก่อนเริ่มเล่น Animation
        setTimeout(() => {
            targetView.classList.add('active');
            targetView.style.opacity = '1';
            targetView.style.transform = 'translateY(0)';
        }, 50);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
}


function prepareEditView() {
    // 1. ดึง Element จากหน้า Profile และ Edit
    const textName = document.getElementById('text-name');
    const textBio = document.getElementById('text-bio');
    const editName = document.getElementById('edit-name');
    const editBio = document.getElementById('edit-bio');

    if (!textName || !editName) return; // ป้องกัน Error ถ้าหา Element ไม่เจอ

    // 2. ดึงค่าปัจจุบัน
    const currentName = textName.innerText.trim();
    const currentBio = textBio.innerText.trim();

    // 3. ตรวจสอบค่าเริ่มต้น: ถ้าเป็นค่า Default ให้แสดงเป็นค่าว่างเพื่อให้ Placeholder ทำงาน
    editName.value = (currentName === "Username") ? "" : currentName;
    editBio.value = (currentBio === "Welcome to my custom profile.") ? "" : currentBio;

    // 4. อัปเดตตัวนับตัวอักษร
    updateCount();
    
    // 5. แสดงรายการ Social (ตรวจสอบชื่อฟังก์ชันให้ตรงกับที่คุณใช้)
    // หากคุณใช้ชื่อ renderSocials() หรือชื่ออื่น ให้เปลี่ยนตรงนี้ครับ
    if (typeof renderSocials === "function") {
        renderSocials(); 
    }
    
    // 6. สลับไปหน้าแก้ไข
    switchView('view-edit');
}

function updateCount() {
    const bioInput = document.getElementById('edit-bio');
    const charCount = document.getElementById('char-count');
    if (bioInput && charCount) {
        charCount.innerText = `${bioInput.value.length} / 250`;
    }
}


function addSocialInputRow(platform, url) {
    const container = document.getElementById('edit-social-list');
    const div = document.createElement('div');
    div.className = 'edit-social-item';
    div.innerHTML = `
        <span style="width:100px; color:#0095ff; font-weight:bold;">${platform}</span>
        <input type="hidden" class="social-platform" value="${platform}">
        <input type="text" class="social-url" placeholder="วางลิงก์ที่นี่..." value="${url}">
        <button class="btn-remove" onclick="this.parentElement.remove()">ลบ</button>
    `;
    container.appendChild(div);
}

function addNewSocial() {
    const platform = document.getElementById('select-platform').value;
    addSocialInputRow(platform, '');
}

function renderSocials() {
    const display = document.getElementById('display-socials');
    display.innerHTML = socialLinks.map(link => `
        <a href="${link.url}" target="_blank" class="social-item">
            <i class="${ICON_MAP[link.platform] || 'fa-solid fa-link'}"></i>
            <span>${link.platform}</span>
        </a>
    `).join('');
}

function saveAll() {
    const name = document.getElementById('edit-name').value;
    let bio = document.getElementById('edit-bio').value;

    if (!bio.trim()) bio = DEFAULT_BIO;

    // บันทึกข้อความ
    document.getElementById('text-name').innerText = name || "Username";
    document.getElementById('text-bio').innerText = bio;
    localStorage.setItem('pName', name);
    localStorage.setItem('pBio', bio);

    // บันทึก Social
    const platforms = document.querySelectorAll('.social-platform');
    const urls = document.querySelectorAll('.social-url');
    socialLinks = [];
    platforms.forEach((p, i) => {
        if (urls[i].value.trim()) {
            socialLinks.push({ platform: p.value, url: urls[i].value });
        }
    });
    localStorage.setItem('savedSocials', JSON.stringify(socialLinks));

    renderSocials();
    switchView('view-profile');
}

function previewMedia(input, targetId) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const result = e.target.result;
            const target = document.getElementById(targetId);
            if (target.tagName === 'IMG') {
                target.src = result;
                localStorage.setItem('pAvatar', result);
            } else {
                target.style.backgroundImage = `url('${result}')`;
                localStorage.setItem('pBanner', result);
            }
        };
        reader.readAsDataURL(file);
    }
}

function updateCount() {
    const len = document.getElementById('edit-bio').value.length;
    document.getElementById('char-count').innerText = `${len} / 250`;
}
function resetAllData() {
    // แสดงกล่องยืนยันเพื่อป้องกันการกดพลาด
    const confirmReset = confirm("คุณต้องการลบข้อมูลทั้งหมดและกลับไปใช้ค่าเริ่มต้นใช่หรือไม่? (การกระทำนี้ไม่สามารถย้อนกลับได้)");
    
    if (confirmReset) {
        // ล้างข้อมูลทั้งหมดใน LocalStorage
        localStorage.clear();
        
        // รีโหลดหน้าเว็บเพื่อให้กลับไปใช้ค่าเริ่มต้นที่ตั้งไว้ในโค้ด
        window.location.reload();
    }
}
