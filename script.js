// 1. ตั้งค่า Supabase (นำมาจากหน้า Settings > API ใน Supabase)
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let socialLinks = [];
let currentUsername = "";

// 2. ดึง Username จาก URL (เช่น ?u=mario)
function getUsernameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('u'); // คืนค่า 'mario'
}

document.addEventListener("DOMContentLoaded", async () => {
    currentUsername = getUsernameFromURL();
    
    if (currentUsername) {
        await loadProfile(currentUsername);
    } else {
        // ถ้าไม่มี u= ในลิงก์ ให้แสดงหน้าว่างหรือแจ้งเตือน
        document.getElementById('text-name').innerText = "โปรดระบุ Username ใน URL";
    }
});

// 3. ฟังก์ชันดึงข้อมูลจาก Supabase
async function loadProfile(username) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

    if (data) {
        // อัปเดตหน้า UI
        document.getElementById('text-name').innerText = data.name;
        document.getElementById('text-bio').innerText = data.bio;
        socialLinks = data.socials || [];
        
        if (data.avatar_url) document.getElementById('display-avatar').src = data.avatar_url;
        if (data.banner_url) document.getElementById('display-banner').style.backgroundImage = `url('${data.banner_url}')`;
        
        renderProfileSocials();
    } else {
        console.log("ไม่พบผู้ใช้ชื่อนี้");
    }
}

// 4. ฟังก์ชันบันทึกข้อมูล (Save)
async function saveAll() {
    const nameVal = document.getElementById('edit-name').value.trim() || "Username";
    const bioVal = document.getElementById('edit-bio').value.trim() || "Welcome...";

    const { error } = await supabase
        .from('profiles')
        .update({ 
            name: nameVal, 
            bio: bioVal, 
            socials: socialLinks 
        })
        .eq('username', currentUsername);

    if (!error) {
        await loadProfile(currentUsername);
        switchView('view-profile');
    } else {
        alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
    }
}

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
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
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

async function previewMedia(input, displayId) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUsername}-${displayId}-${Math.random()}.${fileExt}`;

        // 1. อัปโหลดไป Supabase Storage (ต้องสร้าง Bucket ชื่อ 'media' ก่อน)
        const { data, error } = await supabase.storage
            .from('media')
            .upload(fileName, file);

        if (error) {
            alert("อัปโหลดรูปไม่สำเร็จ: " + error.message);
            return;
        }

        // 2. รับ URL สาธารณะของรูป
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);
        const publicUrl = urlData.publicUrl;

        // 3. อัปเดต URL ลงในตาราง Profiles ทันที
        const updateField = (displayId === 'display-banner') ? { banner_url: publicUrl } : { avatar_url: publicUrl };
        await supabase.from('profiles').update(updateField).eq('username', currentUsername);

        // 4. แสดงผลบนหน้าจอ
        if (displayId === 'display-banner') {
            document.getElementById(displayId).style.backgroundImage = `url('${publicUrl}')`;
        } else {
            document.getElementById(displayId).src = publicUrl;
        }
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
    const nameVal = document.getElementById('edit-name').value.trim();
    const bioVal = document.getElementById('edit-bio').value.trim();

    // บันทึกค่า (ถ้าว่างให้ใช้ค่าเริ่มต้น)
    const finalName = nameVal || "Username";
    const finalBio = bioVal || "Welcome to my custom profile.";

    localStorage.setItem('pName', finalName);
    localStorage.setItem('pBio', finalBio);
    localStorage.setItem('savedSocials', JSON.stringify(socialLinks));

    // อัปเดตหน้า Profile ทันที
    document.getElementById('text-name').innerText = finalName;
    document.getElementById('text-bio').innerText = finalBio;
    renderProfileSocials();

    // เด้งกลับหน้าหลัก
    switchView('view-profile');
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
