// 1. ตั้งค่าพื้นฐานและตัวแปร Global
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

// 2. เริ่มทำงานเมื่อโหลดหน้าเว็บ
document.addEventListener("DOMContentLoaded", () => {
    loadSavedData();
});

// 3. ฟังก์ชันสลับหน้า (Switch View)
function switchView(viewId) {
    // ซ่อนทุก View โดยการเอา class active ออก
    const views = document.querySelectorAll('.view');
    views.forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none'; // เพิ่มบรรทัดนี้เพื่อความชัวร์
    });

    // แสดงเฉพาะ View ที่เลือก
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block'; // แสดงผลหน้าจอ
        window.scrollTo(0, 0); // เลื่อนขึ้นบนสุด
    }
}


// 4. เตรียมข้อมูลก่อนเข้าหน้าแก้ไข (แก้ปัญหา Placeholder)
function prepareEditView() {
    const currentName = document.getElementById('text-name').innerText;
    const currentBio = document.getElementById('text-bio').innerText;

    // ถ้าเป็นค่าเริ่มต้น ให้ช่องกรอกเป็นค่าว่างเพื่อโชว์ Placeholder สีเทา
    document.getElementById('edit-name').value = (currentName === "Username") ? "" : currentName;
    document.getElementById('edit-bio').value = (currentBio === "Welcome to my custom profile.") ? "" : currentBio;

    updateCount();
    renderEditSocials(); // แสดง Social ที่เคยเพิ่มไว้ในหน้า Edit
    switchView('view-edit');
}

// 5. จัดการรูปภาพ (แก้ปัญหาที่ 3 และ 4)
function previewMedia(input, displayId) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const result = e.target.result;
            const targetElement = document.getElementById(displayId);
            
            if (displayId === 'display-banner') {
                targetElement.style.backgroundImage = `url('${result}')`;
                targetElement.setAttribute('data-src', result); // เก็บ URL ไว้ใน attribute ชั่วคราว
            } else {
                targetElement.src = result;
            }
        };
        reader.readAsDataURL(file);
    }
}


// 6. จัดการ Social (แก้ปัญหาที่ 1 และ 2)
function addNewSocial() {
    const platform = document.getElementById('select-platform').value;
    const url = prompt(`ใส่ลิงก์ ${platform} ของคุณ (ตัวอย่าง: https://${platform.toLowerCase()}.com/username):`);

    if (!url || url.trim() === "") return;

    // 1. ตรวจสอบรูปแบบ URL พื้นฐาน (Regex)
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    if (!urlPattern.test(url)) {
        alert("กรุณาใส่รูปแบบลิงก์ที่ถูกต้อง (เช่น https://...)");
        return;
    }

    // 2. ตรวจสอบว่าลิงก์ตรงกับแพลตฟอร์มที่เลือกหรือไม่ (Domain Check)
    const lowerURL = url.toLowerCase();
    const platformDomain = platform.toLowerCase();
    
    // ยกเว้นกรณีเลือก 'Other Link' จะไม่ตรวจชื่อโดเมน
    if (platform !== "Link") {
        if (!lowerURL.includes(platformDomain)) {
            alert(`ลิงก์นี้ดูเหมือนไม่ใช่ลิงก์ของ ${platform} กรุณาตรวจสอบอีกครั้ง`);
            return;
        }
    }

    // 3. ตรวจสอบการเพิ่มซ้ำ (ถ้าผ่านการตรวจลิงก์แล้ว)
    if (socialLinks.some(s => s.platform === platform)) {
        alert("คุณเพิ่มแพลตฟอร์มนี้ไปแล้ว");
        return;
    }

    // เพิ่มข้อมูลเข้าสู่ระบบ
    socialLinks.push({ platform, url: url.startsWith('http') ? url : `https://${url}` });
    renderEditSocials();
    alert(`เพิ่ม ${platform} เรียบร้อยแล้ว!`);
}


function renderEditSocials() {
    const list = document.getElementById('edit-social-list');
    list.innerHTML = "";
    socialLinks.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'edit-social-item';
        div.innerHTML = `
            <span><i class="${ICON_MAP[item.platform]}"></i> ${item.platform}</span>
            <button class="btn-remove" onclick="removeSocial(${index})"><i class="fa-solid fa-xmark"></i></button>
        `;
        list.appendChild(div);
    });
}

function removeSocial(index) {
    socialLinks.splice(index, 1);
    renderEditSocials();
}

// 7. บันทึกและอัปเดต (แก้ปัญหา Save แล้วไม่เด้ง/ไม่อัปเดต)
function saveAll() {
    // 1. หาตำแหน่ง Index ของโปรไฟล์ที่กำลังแก้
    const profileIndex = allProfiles.findIndex(p => p.id === currentEditingId);
    
    if (profileIndex !== -1) {
        // 2. ดึงข้อมูลจาก Input ต่างๆ มาอัปเดตใน Array
        allProfiles[profileIndex].name = document.getElementById('edit-name').value;
        allProfiles[profileIndex].bio = document.getElementById('edit-bio').value;
        
        // ดึงรูป Avatar จากหน้าจอ (ที่เป็น Base64)
        allProfiles[profileIndex].avatar = document.getElementById('display-avatar').src;
        
        // ดึงรูป Banner จาก data-attribute ที่เราเก็บไว้
        const bannerData = document.getElementById('display-banner').getAttribute('data-src');
        if (bannerData) {
            allProfiles[profileIndex].banner = bannerData;
        }

        // 3. บันทึกลง LocalStorage
        localStorage.setItem('user_profiles', JSON.stringify(allProfiles));
        
        // 4. แจ้งเตือนและรีเฟรชหน้าลิสต์
        alert('บันทึกข้อมูลเรียบร้อย!');
        renderMiniList(); // อัปเดตรายชื่อหน้าแรกทันที
        switchView('view-list'); // กลับหน้าหลัก
    }
}


function renderProfileSocials() {
    const container = document.getElementById('display-socials');
    container.innerHTML = "";
    socialLinks.forEach(item => {
        const a = document.createElement('a');
        a.href = item.url;
        a.target = "_blank";
        a.className = "social-item";
        a.innerHTML = `<i class="${ICON_MAP[item.platform]}"></i> <span>${item.platform}</span>`;
        container.appendChild(a);
    });
}

// 8. โหลดข้อมูลเมื่อเข้าเว็บ
function loadSavedData() {
    const n = localStorage.getItem('pName');
    const b = localStorage.getItem('pBio');
    const av = localStorage.getItem('display-avatar');
    const bn = localStorage.getItem('display-banner');

    if (n) document.getElementById('text-name').innerText = n;
    if (b) document.getElementById('text-bio').innerText = b;
    if (av) {
        document.getElementById('display-avatar').src = av;
        document.getElementById('input-avatar').parentElement.style.backgroundImage = `url('${av}')`;
        document.getElementById('input-avatar').parentElement.style.color = 'transparent';
    }
    if (bn) {
        document.getElementById('display-banner').style.backgroundImage = `url('${bn}')`;
        document.getElementById('input-banner').parentElement.style.backgroundImage = `url('${bn}')`;
        document.getElementById('input-banner').parentElement.style.color = 'transparent';
    }
    renderProfileSocials();
}

function updateCount() {
    const bio = document.getElementById('edit-bio').value;
    document.getElementById('char-count').innerText = `${bio.length} / 250`;
}

function resetAllData() {
    if (confirm("ล้างข้อมูลทั้งหมด?")) {
        localStorage.clear();
        location.reload();
    }
}

// จำลองข้อมูล 15 โปรไฟล์
const profiles = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    name: `User Profile ${i + 1}`,
    bio: `This is the bio for user number ${i + 1}`,
    avatar: `https://i.pravatar.cc/150?u=${i + 1}` // รูปสุ่มจากอินเทอร์เน็ต
}));

function renderMiniList() {
    const container = document.getElementById('mini-list-container');
    container.innerHTML = '';

    profiles.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'mini-card';
        card.onclick = () => selectProfile(profile);

        card.innerHTML = `
            <img src="${profile.avatar}" class="mini-avatar" alt="avatar">
            <div class="mini-info">
                <h3>${profile.name}</h3>
                <p>Click to view profile</p>
            </div>
            <i class="fa-solid fa-chevron-right arrow-icon"></i>
        `;
        container.appendChild(card);
    });
}

// ฟังก์ชันสลับหน้าและโหลดข้อมูล
function selectProfile(profile) {
    // 1. อัปเดตข้อมูลในหน้า View Profile
    document.getElementById('display-avatar').src = profile.avatar;
    document.getElementById('text-name').innerText = profile.name;
    document.getElementById('text-bio').innerText = profile.bio;

    // 2. สลับหน้า
    switchView('view-profile');
}

// ฟังก์ชันสำหรับสลับ View (ปรับปรุงจากของเดิม)
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
}

// เรียกใช้งานตอนโหลดหน้าเว็บ
window.onload = () => {
    renderMiniList();
};

// 1. สร้างข้อมูลเริ่มต้น (ถ้ายังไม่มีในเครื่อง)
let allProfiles = JSON.parse(localStorage.getItem('user_profiles')) || Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    name: `User Profile ${i + 1}`,
    bio: `Welcome to profile number ${i + 1}`,
    avatar: `https://i.pravatar.cc/150?u=${i + 1}`,
    banner: 'https://images.unsplash.com/photo-1579546129310-c74464aa8c9d',
    socials: []
}));

let currentEditingId = null;

// 2. ฟังก์ชันแสดงรายการหน้าแรก
function renderMiniList() {
    const container = document.getElementById('mini-list-container');
    container.innerHTML = '';
    
    // ดึงข้อมูลล่าสุดจาก allProfiles
    allProfiles.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'mini-card';
        card.onclick = () => selectProfile(profile.id);

        card.innerHTML = `
            <img src="${profile.avatar}" class="mini-avatar">
            <div class="mini-info">
                <h3>${profile.name}</h3>
                <p>${profile.bio.substring(0, 30)}...</p>
            </div>
            <i class="fa-solid fa-chevron-right arrow-icon"></i>
        `;
        container.appendChild(card);
    });
}

// 3. ฟังก์ชันเลือกโปรไฟล์และแสดงผล
function selectProfile(id) {
    // 1. ค้นหาข้อมูลโปรไฟล์จาก ID ที่คลิก
    const profile = allProfiles.find(p => p.id === id);
    if (!profile) return;

    // 2. เก็บ ID ปัจจุบันไว้ในตัวแปร Global เพื่อใช้ตอน Save
    currentEditingId = id; 

    // 3. นำข้อมูลไปแสดงในหน้า view-profile (หน้า Preview)
    document.getElementById('display-avatar').src = profile.avatar || '';
    document.getElementById('text-name').innerText = profile.name || 'No Name';
    document.getElementById('text-bio').innerText = profile.bio || '';
    
    const banner = document.getElementById('display-banner');
    if (profile.banner) {
        banner.style.backgroundImage = `url('${profile.banner}')`;
        banner.setAttribute('data-src', profile.banner);
    } else {
        banner.style.backgroundImage = 'none';
    }

    // 4. สลับหน้าไปที่ view-profile
    switchView('view-profile');
}


// 4. ฟังก์ชันบันทึกข้อมูล (Save)
function saveAll() {
    const profileIndex = allProfiles.findIndex(p => p.id === currentEditingId);
    
    if (profileIndex !== -1) {
        // อัปเดตข้อมูลในตัวแปร
        allProfiles[profileIndex].name = document.getElementById('edit-name').value;
        allProfiles[profileIndex].bio = document.getElementById('edit-bio').value;
        allProfiles[profileIndex].avatar = document.getElementById('display-avatar').src;
        // หมายเหตุ: banner และ socials ควรถูกอัปเดตตามลำดับการทำงานจริงของคุณ

        // บันทึกลง LocalStorage
        localStorage.setItem('user_profiles', JSON.stringify(allProfiles));
        
        alert('บันทึกข้อมูลเรียบร้อยแล้ว!');
        
        // อัปเดตหน้าแสดงผลและกลับไปหน้า List
        renderMiniList();
        switchView('view-list');
    }
}

// 5. เตรียมหน้า Edit โดยดึงข้อมูลจาก currentProfile
function prepareEditView() {
    const profile = allProfiles.find(p => p.id === currentEditingId);
    
    // เอาข้อมูลเดิมใส่เข้าไปในช่อง Input ก่อนแก้
    document.getElementById('edit-name').value = profile.name;
    document.getElementById('edit-bio').value = profile.bio;
    
    // อัปเดตตัวเลขตัวอักษร Bio
    updateCount(); 
    
    switchView('view-edit');
}


// โหลดข้อมูลเมื่อเปิดหน้าเว็บ
window.onload = () => {
    renderMiniList();
};
