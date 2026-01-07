// ฟังก์ชันสลับหน้า
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

// แสดงตัวอย่างรูปภาพ (รองรับ GIF ทันที)
function previewMedia(input, targetId) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const target = document.getElementById(targetId);
            if (target.tagName === 'IMG') {
                target.src = e.target.result;
            } else {
                target.style.backgroundImage = `url('${e.target.result}')`;
            }
        };
        reader.readAsDataURL(file);
    }
}

// อัปเดตตัวนับตัวอักษร
function updateCount() {
    const bioText = document.getElementById('edit-bio').value;
    document.getElementById('char-count').innerText = `${bioText.length} / 250`;
}

// บันทึกข้อมูล
function saveAll() {
    const newName = document.getElementById('edit-name').value;
    const newBio = document.getElementById('edit-bio').value;

    if (newName) document.getElementById('text-name').innerText = newName;
    if (newBio) document.getElementById('text-bio').innerText = newBio;

    // สลับกลับไปหน้าหลัก
    switchView('view-profile');
}
