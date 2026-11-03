document.addEventListener("DOMContentLoaded", function () {
    initGreeting();
    renderStokTable();
    initCheckoutSelect();
    initLoginForm();
    initAddBookForm();
    initCheckoutForm();
});

// 1. Handling Local Time Greeting
function initGreeting() {
    const greetingHeading = document.getElementById("greetingHeading");
    const userGreeting = document.getElementById("userGreeting");
    const currentUser = JSON.parse(localStorage.getItem("loggedInUser"));

    if (greetingHeading || userGreeting) {
        const hour = new Date().getHours();
        let timeGreeting = "Selamat Pagi";

        if (hour >= 11 && hour < 15) {
            timeGreeting = "Selamat Siang";
        } else if (hour >= 15 && hour < 18) {
            timeGreeting = "Selamat Sore";
        } else if (hour >= 18 || hour < 4) {
            timeGreeting = "Selamat Malam";
        }

        const namaUser = currentUser ? currentUser.nama : "User";
        const roleUser = currentUser ? `(${currentUser.role})` : "";

        if (greetingHeading) greetingHeading.innerText = `${timeGreeting}, Selamat Datang ${namaUser}!`;
        if (userGreeting) userGreeting.innerText = `${timeGreeting}, ${namaUser} ${roleUser}`;
    }
}

// 2. Login Form Handling & Validasi
function initLoginForm() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const emailInput = document.getElementById("email").value.trim();
            const passwordInput = document.getElementById("password").value;

            let userFound = null;
            if (typeof dataPengguna !== 'undefined') {
                userFound = dataPengguna.find(u => u.email === emailInput && u.password === passwordInput);
            }

            if (userFound) {
                alert(`Login Berhasil! Selamat datang, ${userFound.nama} (${userFound.role})`);
                localStorage.setItem("loggedInUser", JSON.stringify(userFound));
                window.location.href = "dashboard.html";
            } else {
                alert("email/password yang anda masukkan salah");
            }
        });
    }
}

// Modal Toggle Functions
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "block";
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "none";
}

function handleModalSubmit(event, message) {
    event.preventDefault();
    alert(message);
    const modals = document.querySelectorAll(".modal");
    modals.forEach(m => m.style.display = "none");
}

// Helper konversi string harga
function parseHarga(hargaStr) {
    if (typeof hargaStr === 'number') return hargaStr;
    return parseInt(hargaStr.replace(/[^0-9]/g, '')) || 0;
}

// 3. Render & Tambah Stok (stok.html)
function getKatalog() {
    return JSON.parse(localStorage.getItem("katalogBuku")) || dataKatalogBuku;
}

function renderStokTable() {
    const tbody = document.getElementById("stokTableBody");
    if (!tbody) return;

    const katalog = getKatalog();
    tbody.innerHTML = "";

    katalog.forEach(buku => {
        const hargaNum = parseHarga(buku.harga);
        const coverSrc = buku.cover || 'img/pengantar_komunikasi.jpg';
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${buku.kodeBarang}</strong></td>
            <td><img src="${coverSrc}" alt="${buku.namaBarang}" class="book-cover-img" onerror="this.src='https://via.placeholder.com/50x65?text=Buku'"></td>
            <td><strong>${buku.namaBarang}</strong></td>
            <td>${buku.jenisBarang}</td>
            <td>Edisi ${buku.edisi}</td>
            <td>Rp ${hargaNum.toLocaleString('id-ID')}</td>
            <td><span class="badge">${buku.stok}</span></td>
            <td><button type="button" class="btn btn-danger" onclick="deleteStok('${buku.kodeBarang}')">Hapus</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function initAddBookForm() {
    const addBookForm = document.getElementById("addBookForm");
    if (addBookForm) {
        addBookForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const namaBarang = document.getElementById("newJudul").value;
            const jenisBarang = document.getElementById("newJenis").value;
            const edisi = document.getElementById("newEdisi").value || "1";
            const harga = parseInt(document.getElementById("newHarga").value);
            const stok = parseInt(document.getElementById("newStok").value);

            const katalog = getKatalog();
            const newKode = "BK" + (katalog.length + 1000);

            const newBuku = {
                kodeBarang: newKode,
                namaBarang: namaBarang,
                jenisBarang: jenisBarang,
                edisi: edisi,
                stok: stok,
                harga: "Rp " + harga.toLocaleString('id-ID'),
                cover: "img/pengantar_komunikasi.jpg"
            };
            katalog.push(newBuku);
            localStorage.setItem("katalogBuku", JSON.stringify(katalog));

            alert("Stok buku berhasil ditambahkan!");
            closeModal("addBookModal");
            renderStokTable();
            addBookForm.reset();
        });
    }
}

function deleteStok(kode) {
    if (confirm("Apakah Anda yakin ingin menghapus stok buku ini?")) {
        let katalog = getKatalog();
        katalog = katalog.filter(b => b.kodeBarang !== kode);
        localStorage.setItem("katalogBuku", JSON.stringify(katalog));
        renderStokTable();
    }
}

// 4. Halaman Pemesanan & Checkout (chackout.html)
let cart = [];

function initCheckoutSelect() {
    const select = document.getElementById("selectBuku");
    if (!select) return;

    const katalog = getKatalog();
    select.innerHTML = "";
    katalog.forEach(b => {
        const opt = document.createElement("option");
        opt.value = b.kodeBarang;
        opt.innerText = `${b.kodeBarang} - ${b.namaBarang} (${b.harga})`;
        select.appendChild(opt);
    });
}

function addOrderRow() {
    const select = document.getElementById("selectBuku");
    if (!select) return;
    const kode = select.value;
    const katalog = getKatalog();
    const buku = katalog.find(b => b.kodeBarang === kode);

    if (!buku) return;

    const existing = cart.find(item => item.kodeBarang === kode);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...buku, qty: 1 });
    }

    renderCartTable();
}

function renderCartTable() {
    const tbody = document.getElementById("cartTableBody");
    const totalBayarEl = document.getElementById("totalBayar");
    if (!tbody) return;

    tbody.innerHTML = "";
    let total = 0;

    cart.forEach((item, index) => {
        const hargaNum = parseHarga(item.harga);
        const subtotal = hargaNum * item.qty;
        total += subtotal;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><img src="${item.cover}" class="book-cover-img" style="width:35px; height:45px;" onerror="this.src='https://via.placeholder.com/35x45?text=Buku'"></td>
            <td><strong>${item.namaBarang}</strong></td>
            <td>Rp ${hargaNum.toLocaleString('id-ID')}</td>
            <td>
                <input type="number" value="${item.qty}" min="1" style="width: 60px; padding: 5px;" onchange="updateQty(${index}, this.value)">
            </td>
            <td>Rp ${subtotal.toLocaleString('id-ID')}</td>
            <td><button type="button" class="btn btn-danger" onclick="removeCartItem(${index})">X</button></td>
        `;
        tbody.appendChild(tr);
    });

    if (totalBayarEl) {
        totalBayarEl.innerText = `Rp ${total.toLocaleString('id-ID')}`;
    }
}

function updateQty(index, qty) {
    const parsedQty = parseInt(qty);
    if (parsedQty > 0) {
        cart[index].qty = parsedQty;
    } else {
        cart.splice(index, 1);
    }
    renderCartTable();
}

function removeCartItem(index) {
    cart.splice(index, 1);
    renderCartTable();
}

function initCheckoutForm() {
    const form = document.getElementById("checkoutForm");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (cart.length === 0) {
                alert("Keranjang pesanan masih kosong! Pilih buku terlebih dahulu.");
                return;
            }

            const nama = document.getElementById("namaPemesan").value;
            const randomDO = "2023" + Math.floor(1000 + Math.random() * 9000);

            alert(`Pemesanan Berhasil!\n\nNomor DO Anda: ${randomDO}\nNama: ${nama}\n\nSimpan nomor DO ini untuk tracking pengiriman.`);
            cart = [];
            renderCartTable();
            form.reset();
        });
    }
}

// 5. Tracking Pengiriman (tracking.html)
function searchDO() {
    const input = document.getElementById("doNumberInput").value.trim();
    const resultCard = document.getElementById("trackingResult");
    
    if (!input) {
        alert("Masukkan Nomor Delivery Order (contoh: 20230012 atau 20230013)!");
        return;
    }

    let found = null;
    if (typeof dataTracking !== 'undefined') {
        found = dataTracking[input];
    }

    if (found) {
        document.getElementById("resDO").innerText = found.nomorDO;
        document.getElementById("resNama").innerText = found.nama;
        document.getElementById("resTanggal").innerText = found.tanggalKirim;
        document.getElementById("resPaket").innerText = found.paket;
        document.getElementById("resEkspedisi").innerText = found.ekspedisi;
        document.getElementById("resTotal").innerText = found.total;
        
        let progressPercent = 50;
        if (found.status === "Selesai Antar" || found.status === "Paket Telah Diterima" || found.status === "Dikirim") {
            progressPercent = 100;
        } else if (found.status === "Dalam Perjalanan") {
            progressPercent = 65;
        }
        
        document.getElementById("progressBar").style.width = `${progressPercent}%`;
        document.getElementById("statusText").innerText = found.status;

        const timelineUl = document.getElementById("timelineList");
        timelineUl.innerHTML = "";
        found.perjalanan.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `<strong>${item.waktu}</strong> - ${item.keterangan}`;
            timelineUl.appendChild(li);
        });

        resultCard.classList.remove("hidden");
    } else {
        alert("Nomor Delivery Order tidak ditemukan! (Gunakan dummy data dari PDF: 20230012 atau 20230013)");
        resultCard.classList.add("hidden");
    }
}
