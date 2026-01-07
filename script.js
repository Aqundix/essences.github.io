// ฟังก์ชันแสดงตัวอย่างรูปภาพเมื่อเลือกไฟล์
function previewImage(event) {
    const reader = new FileReader();
    const profileImg = document.getElementById('profile-img');
    const placeholder = document.getElementById('profile-placeholder');

    reader.onload = function() {
        if (reader.readyState === 2) {
            profileImg.src = reader.result;
            profileImg.style.display = 'block';
            placeholder.style.display = 'none';
        }
    }
    
    if (event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
    }
}

// ฟังก์ชันบันทึกชื่อและคำอธิบาย
function saveProfile() {
    const nameInput = document.getElementById('input-name').value;
    const bioInput = document.getElementById('input-bio').value;

    if (nameInput.trim() !== "") {
        document.getElementById('display-name').textContent = nameInput;
    }

    if (bioInput.trim() !== "") {
        document.getElementById('display-bio').textContent = bioInput;
    }

    alert("บันทึกโปรไฟล์สำเร็จ!");
}
