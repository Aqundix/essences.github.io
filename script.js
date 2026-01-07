// เปลี่ยนรูปโปรไฟล์
function changeProfile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('profile-img');
            img.src = e.target.result;
            img.style.display = 'block';
            document.getElementById('profile-placeholder').style.display = 'none';
        }
        reader.readAsDataURL(file);
    }
}

// เปลี่ยนรูป Header (รองรับ .gif)
function changeHeader(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('header-bg').style.backgroundImage = `url('${e.target.result}')`;
        }
        reader.readAsDataURL(file);
    }
}

// อัปเดตตัวนับตัวอักษร Bio
function updateCount() {
    const bioInput = document.getElementById('input-bio');
    const countDisplay = document.getElementById('char-count');
    countDisplay.textContent = `${bioInput.value.length} / 250`;
}

// บันทึกข้อมูล
function saveData() {
    const name = document.getElementById('input-name').value;
    const bio = document.getElementById('input-bio').value;

    if (name.trim() !== "") {
        document.getElementById('display-name').textContent = name;
    }

    // อัปเดต Bio พร้อมจัดการการขึ้นบรรทัดใหม่
    if (bio.trim() !== "" || bio === "") {
        document.getElementById('display-bio').textContent = bio;
    }

    alert("บันทึกข้อมูลและรูปภาพสำเร็จ!");
}
