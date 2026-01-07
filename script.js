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

// 5. จัดการรูปภาพ (แก้ปัญหาที่ 3 และ 4)
function previewMedia(input, displayId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const result = e.target.result;
            
            // แสดงในหน้าโปรไฟล์
            const displayEl = document.getElementById(displayId);
            if (displayId === 'display-banner') {
                displayEl.style.backgroundImage = `url('${result}')`;
            } else {
                displayEl.src = result;
            }

            // แสดงในหน้า Edit (Media Box) - แก้ปัญหาที่ 4
            const mediaBox = input.parentElement;
            mediaBox.style.backgroundImage = `url('${result}')`;
            mediaBox.style.backgroundSize = 'cover';
            mediaBox.style.backgroundPosition = 'center';
            mediaBox.style.color = 'transparent'; // ซ่อนไอคอน/ตัวหนังสือ
            
            // บันทึกลง Storage ทันที
            localStorage.setItem(displayId, result);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// 6. จัดการ Social (แก้ปัญหาที่ 1 และ 2)
function addNewSocial() {
    const platform = document.getElementById('select-platform').value;
    const url = prompt(`ใส่ลิงก์ ${platform} ของคุณ:`);

    if (url && url.trim() !== "") {
        // ป้องกันการเพิ่มซ้ำ (ปัญหาที่ 1)
        if (socialLinks.some(s => s.platform === platform)) {
            alert("คุณเพิ่มแพลตฟอร์มนี้ไปแล้ว");
            return;
        }
        socialLinks.push({ platform, url });
        renderEditSocials();
    }
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
