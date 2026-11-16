import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js"
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    increment,
    collection,
    query,
    orderBy,
    limit,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js"

const firebaseConfig = {
    apiKey: "AIzaSyA6I1Tvw61wzc6-2MVmcWXfZ17IwDYj7u4",
    authDomain: "rpl25-b6db4.firebaseapp.com",
    projectId: "rpl25-b6db4",
    storageBucket: "rpl25-b6db4.firebasestorage.app",
    messagingSenderId: "643920833293",
    appId: "1:643920833293:web:f5ac7fdc746e4e410d5e44"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

window.addEventListener("DOMContentLoaded", () => {
    dengarkanRiwayatTopUp()
})

// FUNGSI UTAMA: Simulasi Endpoint Bank melakukan Top Up
window.kirimTopUp = async function () {
    const targetUser = document.getElementById('target-user-id').value.trim()
    const nominal = parseInt(document.getElementById('nominal-topup').value)

    if (!targetUser || isNaN(nominal) || nominal <= 0) {
        tampilkanPesan("❌ Masukkan ID Siswa & Nominal yang valid!", "#dc3545")
        return
    }

    tampilkanPesan("Memproses transfer bank...", "#17a2b8")

    const userRef = doc(db, 'users', targetUser)

    try {
        const userSnap = await getDoc(userRef)

        // 1. Buat user jika belum ada
        if (!userSnap.exists()) {
            await setDoc(userRef, { saldo: 0, nama: "Siswa Baru" })
        }

        // 2. Tambah Saldo di Firestore secara Atomik (menggunakan increment)
        await updateDoc(userRef, {
            saldo: increment(nominal)
        })

        // 3. Catat Log Transaksi Top Up di collection 'topups'
        const topupId = "TOPUP-" + Date.now()
        const topupRef = doc(db, 'topups', topupId)

        await setDoc(topupRef, {
            userId: targetUser,
            amount: nominal,
            createdAt: Date.now()
        })

        tampilkanPesan(`✅ Berhasil Top Up Rp ${nominal.toLocaleString('id-ID')} ke ${targetUser}!`, "#28a745")

    } catch (error) {
        tampilkanPesan("Gagal melakukan top up: " + error.message, "#dc3545")
    }
}

// Realtime Listener untuk Riwayat Top Up di Layar Bank
function dengarkanRiwayatTopUp() {
    const topupsRef = collection(db, 'topups')
    const q = query(topupsRef, orderBy('createdAt', 'desc'), limit(5))

    onSnapshot(q, (snapshot) => {
        const listEl = document.getElementById('list-history')
        listEl.innerHTML = ""

        if (snapshot.empty) {
            listEl.innerHTML = '<li style="color: #888; font-size: 11px;">Belum ada transaksi top up...</li>'
            return
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data()
            const li = document.createElement('li')
            li.innerHTML = `
        <span><strong>${data.userId}</strong> (+Rp ${data.amount.toLocaleString('id-ID')})</span>
        <span style="color:#28a745; font-weight:bold;">SUKSES</span>
      `
            listEl.appendChild(li)
        })
    })
}

function tampilkanPesan(teks, warna) {
    const el = document.getElementById('pesan-box') || document.getElementById('pesan-bank')
    el.innerText = teks
    el.style.color = warna
}
