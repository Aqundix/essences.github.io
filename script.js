// 1. ตั้งค่า Supabase (ใส่ URL และ Key ของคุณ)
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. ตัวแปร Global
const ICON_MAP = {
    'Instagram': 'fa-brands fa-instagram',
    'TikTok': 'fa-brands fa-tiktok',
    'Discord': 'fa-brands fa-discord',
    'Facebook': 'fa-brands fa-facebook',
    'Youtube': 'fa-brands fa-youtube',
    'Github': 'fa-brands fa-github',
    'Link': 'fa-solid fa-link'
};

let socialLinks = [];
let currentUsername = "";

// 3. เริ่มต้นระบบเมื่อโหลดหน้าจอ
document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    currentUsername = params.get('u');
    
    if (currentUsername) {
        // ถ้ามี User ใน URL ให้โหลดโปรไฟล์
        const registerView = document.getElementById('view-register');
        if (registerView) registerView.style.display = 'none';
        await loadProfile(currentUsername);
    } else {
        // ถ้าไม่มี ให้ไปหน้าลงทะเบียน
        switchView('view-register');
    }
});

// 4. ฟังก์ชันหลัก (Core Functions)
async function loadProfile(username) {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

    if (data) {
        document.getElementById('text-name').innerText = data.name || "Username";
        document.getElementById('text-bio').innerText = data.bio || "";
        socialLinks = data.socials || [];
        
        if (data.avatar_url) document.getElementById('display-avatar').src = data.avatar_url;
        if (data.banner_url) document.getElementById('display-banner').style.backgroundImage = `url('${data.banner_url}')`;
        
        renderProfileSocials();
        switchView('view-profile');
    } else {
        alert("ไม่พบผู้ใช้ชื่อนี้ ระบบจะพาไปหน้าลงทะเบียน");
        window.location.href = window.location.pathname;
    }
}

async function saveAll() {
    const nameVal = document.getElementById('edit-name').value.trim() || "Username";
    const bioVal = document.getElementById('edit-bio').value.trim() || "";

    const { error } = await supabaseClient
        .from('profiles')
        .update({ 
            name: nameVal, 
            bio: bioVal, 
            socials: socialLinks 
        })
        .eq('username', currentUsername);

    if (!error) {
        await loadProfile(currentUsername); // โหลดข้อมูลใหม่เพื่ออัปเดต UI
    } else {
        alert("บันทึกไม่สำเร็จ: " + error.message);
    }
}

async function registerUser() {
    const usernameInput = document.getElementById('reg-username');
    const username = usernameInput.value.trim().toLowerCase();
    const msg = document.getElementById('reg-msg');

    if (username.length < 3) {
        msg.innerText = "ชื่อสั้นเกินไป (ขั้นต่ำ 3 ตัว)";
        return;
    }

    // สร้างข้อมูลใหม่
    const { error } = await supabaseClient
        .from('profiles')
        .insert([{ 
            username: username, 
            name: username,
            bio: "Welcome to my profile",
            socials: [] 
        }]);

    if (!error) {
        window.location.href = `?u=${username}`;
    } else {
        msg.innerText = "ชื่อนี้อาจถูกใช้ไปแล้ว หรือเกิดข้อผิดพลาด";
    }
}

// 5. การจัดการรูปภาพ (Supabase Storage)
async function previewMedia(input, displayId) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUsername}-${displayId}.${fileExt}`;

        // อัปโหลด (ใช้ upsert เพื่อทับไฟล์เดิมของ user คนนี้)
        const { data, error } = await supabaseClient.storage
            .from('media')
            .upload(fileName, file, { upsert: true });

        if (error) {
            alert("อัปโหลดไม่สำเร็จ: " + error.message);
            return;
        }

        const { data: urlData } = supabaseClient.storage.from('media').getPublicUrl(fileName);
        const publicUrl = urlData.publicUrl;

        // บันทึก URL ลง Table
        const updateField = (displayId === 'display-banner') ? { banner_url: publicUrl } : { avatar_url: publicUrl };
        await supabaseClient.from('profiles').update(updateField).eq('username', currentUsername);

        // แสดงผลทันที
        if (displayId === 'display-banner') {
            document.getElementById(displayId).style.backgroundImage = `url('${publicUrl}')`;
        } else {
            document.getElementById(displayId).src = publicUrl;
        }
    }
}

// 6. ฟังก์ชันจัดการ UI (Helper Functions)
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'flex';
    }
}

function prepareEditView() {
    const currentName = document.getElementById('text-name').innerText;
    const currentBio = document.getElementById('text-bio').innerText;

    document.getElementById('edit-name').value = (currentName === "Username") ? "" : currentName;
    document.getElementById('edit-bio').value = (currentBio.includes("Welcome")) ? "" : currentBio;

    updateCount();
    renderEditSocials();
    switchView('view-edit');
}

function renderProfileSocials() {
    const container = document.getElementById('display-socials');
    if (!container) return;
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

function addNewSocial() {
    const platform = document.getElementById('select-platform').value;
    const url = prompt(`ใส่ลิงก์ ${platform} ของคุณ:`);
    if (!url || !url.includes('.')) return;

    if (socialLinks.some(s => s.platform === platform)) {
        alert("คุณเพิ่มแพลตฟอร์มนี้ไปแล้ว");
        return;
    }

    socialLinks.push({ platform, url: url.startsWith('http') ? url : `https://${url}` });
    renderEditSocials();
}

function removeSocial(index) {
    socialLinks.splice(index, 1);
    renderEditSocials();
}

function updateCount() {
    const bio = document.getElementById('edit-bio').value;
    document.getElementById('char-count').innerText = `${bio.length} / 250`;
}
