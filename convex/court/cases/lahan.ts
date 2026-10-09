// Perkara 3: Pos Jaga yang Terbakar. Konflik agraria di perkebunan sawit, kriminalisasi
// petani, dan pesan berantai. HANYA SERVER.

import type { CaseFile } from '../case';

export const lahan: CaseFile = {
	public: {
		id: 'lahan',
		title: 'Pos Jaga yang Terbakar',
		docket: 'PERKARA 88/PID.B/PN.PLK · NEGARA v. RAHMAT HIDAYAT',
		tagline: 'Ketua kelompok tani didakwa membakar pos satpam perusahaan sawit di tengah sengketa lahan.',
		setting: 'Desa Sungai Rangas, Kabupaten Katingan, Kalimantan Tengah',
		charge:
			'Pembakaran yang membahayakan nyawa (Pasal 187 KUHP): membakar pos satpam PT Sawit Mas Lestari pada 9 Agustus malam hingga satpam Yosep Lalang luka bakar.',
		brief:
			'Sudah dua minggu Kelompok Tani Sungai Rangas memblokade jalan kebun, menuntut 300 hektare lahan adat yang masuk HGU perusahaan dikembalikan. ' +
			'Pukul 23.20 pada 9 Agustus, pos satpam di blok C terbakar dan satpam Yosep terluka. Di lokasi ditemukan jeriken berlogo koperasi tani. ' +
			'Rahmat Hidayat, ketua kelompok tani yang memimpin blokade sore itu, ditangkap esok paginya.',
		accused: 'rahmat',
		suspects: {
			rahmat: { name: 'Rahmat Hidayat', short: 'Pak Rahmat', role: 'Ketua Kelompok Tani · terdakwa', bio: 'Memimpin blokade dan gugatan lahan adat. Orasinya sore itu disiarkan langsung di Facebook.' },
			bonar: { name: 'Bonar Sitompul', short: 'Bonar', role: 'Komandan regu pengamanan PT', bio: 'Memimpin satpam kebun. Ditugasi manajemen membuka blokade sebelum audit sertifikasi.' },
			doni: { name: 'Doni Saputra', short: 'Doni', role: 'Pemuda desa', bio: 'Anggota kelompok tani yang paling vokal di media sosial. Pernah menulis "bakar saja posnya".' }
		},
		witnesses: {
			yosep: { name: 'Yosep Lalang', short: 'Yosep', role: 'Satpam korban', bio: 'Berjaga di pos blok C malam itu dan menderita luka bakar.' },
			sandi: { name: 'Sandi Purba', short: 'Sandi', role: 'Anggota regu pengamanan', bio: 'Anak buah Bonar. Mengaku melihat pelaku lari dari pos.' },
			mariam: { name: 'Bu Mariam', short: 'Bu Mariam', role: 'Pemilik warung', bio: 'Warungnya di simpang jalan kebun, satu-satunya jalan menuju blok C.' }
		},
		timeline: [
			{ time: '16:00', text: 'Orasi blokade, disiarkan langsung di Facebook.' },
			{ time: '21:00', text: 'Tahlilan di rumah almarhumah Mak Inah.' },
			{ time: '22:30', text: 'Hujan lebat sampai 23.00.' },
			{ time: '23:20', text: 'Pos satpam blok C terbakar.' },
			{ time: '23:40', text: 'Laporan ke Polsek.' },
			{ time: '07:00', text: 'Rahmat ditangkap di rumahnya.' }
		],
		goals: {
			defense: 'Bangun keraguan yang wajar. Jeriken, orasi dan saksi mata belum tentu berarti Pak Rahmat. Siapa yang diuntungkan bila petani dicap anarkis?',
			prosecution: 'Buktikan Rahmat Hidayat bersalah secara sah dan meyakinkan. Ada sidik jari, ancaman di depan umum dan saksi mata — pastikan semuanya tahan uji.'
		}
	},

	evidence: [
		{ id: 'E1', kind: 'public', title: 'Berita acara olah TKP', text: 'Pos satpam blok C terbakar pukul 23.20. Ditemukan jeriken bensin 5 liter berlogo "Koperasi Tani Sungai Rangas" 3 meter dari pos.', supports: ['identity:rahmat', 'opportunity:rahmat'], reframedBy: ['D2'], truth: 'Jeriken itu disita satpam PT dari gudang koperasi dua minggu sebelumnya.', role: 'misleading' },
		{ id: 'E2', kind: 'public', title: 'Potongan siaran langsung orasi', text: 'Klip 20 detik yang beredar: Rahmat berteriak, "Kalau perusahaan tidak mundur, kami akan ambil tindakan!"', supports: ['motive:rahmat'], authentic: false, reliability: 'contradictory', flag: 'contradictory', underminedBy: ['D3'], truth: 'Kalimat lengkapnya: "…kami akan ambil tindakan hukum, kami gugat ke PTUN!"', role: 'misleading' },
		{ id: 'E3', kind: 'public', title: 'Laporan patroli regu pengamanan', text: 'Ditulis Bonar Sitompul: "Regu patroli sektor utara 22.00–24.00. Situasi aman." Sektor utara berjarak 7 km dari blok C.', reliability: 'contradictory', flag: 'contradictory', underminedBy: ['H1', 'sandi.contact', 'sandi.ngaku', 'mariam.sure'], truth: 'Bohong. Truk regu berhenti dekat pos blok C pukul 23.05–23.25.', role: 'key' },
		{ id: 'E4', kind: 'public', title: 'Keterangan awal korban', text: 'Yosep: "Saya tertidur, bangun karena panas. Saya dengar orang teriak \'tanah ini milik rakyat!\' lalu suara mesin menjauh."', supports: ['identity:rahmat'], reliability: 'unreliable', flag: 'unreliable', underminedBy: ['yosep.sure', 'H3', 'yosep.mobil'], truth: 'Teriakan itu dibuat regu Bonar untuk menjebak petani. Mesinnya truk, bukan motor.', role: 'misleading' },
		{ id: 'E5', kind: 'public', title: 'Unggahan Facebook Doni', text: 'Dua hari sebelum kejadian: "Pos satpam itu bakar saja biar mereka tahu rasa!"', supports: ['motive:doni'], truth: 'Gertakan anak muda di medsos. Doni sedang di Palangka Raya malam itu.', role: 'misleading' },
		{ id: 'E6', kind: 'public', title: 'Surat HGU perusahaan', text: 'HGU PT Sawit Mas Lestari berakhir Desember. Perpanjangan dan audit sertifikasi berkelanjutan mensyaratkan lahan "bebas konflik".', supports: ['motive:bonar'], truth: 'Perusahaan butuh blokade selesai dan petani dicap kriminal.', role: 'context' },
		{ id: 'E7', kind: 'public', title: 'Peta lokasi', text: 'Rumah Rahmat 6 km dari pos blok C lewat jalan tanah. Satu-satunya akses ke blok C adalah jalan kebun yang dijaga portal regu pengamanan.', supports: ['opportunity:bonar'], truth: 'Hampir mustahil masuk ke blok C tanpa lewat regu Bonar.', role: 'key' },
		{ id: 'E8', kind: 'public', title: 'Rilis pers Polres', text: '"Pelaku diduga kuat berasal dari kelompok tani yang melakukan blokade." Dirilis pukul 06.00, sebelum penangkapan.', supports: ['identity:rahmat'], reliability: 'unreliable', flag: 'unreliable', truth: 'Pernyataan dini berdasarkan laporan Bonar, bukan bukti.', role: 'misleading' },
		{ id: 'E9', kind: 'public', title: 'Data cuaca BMKG', text: 'Hujan lebat di Katingan 22.30–23.00. Jalan tanah menuju blok C berlumpur.', truth: 'Jejak ban setelah hujan akan tercetak jelas.', role: 'context' },
		{ id: 'E10', kind: 'public', title: 'Pesan berantai di grup warga', text: 'Dari nomor tak dikenal, esok paginya: "Yang bakar itu Doni, dia dibayar biar kelompok tani dicap anarkis."', supports: ['identity:doni', 'opportunity:doni'], authentic: false, reliability: 'contradictory', flag: 'contradictory', underminedBy: ['H4', 'mariam.doni'], truth: 'Disebar untuk memecah kelompok tani. Doni tidak di desa.', role: 'misleading' },

		{ id: 'D1', kind: 'defense', title: 'Daftar hadir dan foto tahlilan', text: 'Tahlilan di rumah almarhumah Mak Inah 21.00–23.30. Rahmat menandatangani daftar hadir; foto dengan metadata 23.05 menunjukkan ia memimpin doa.', reliability: 'unreliable', flag: 'unreliable', truth: 'Benar. Tapi tanda tangan daftar hadir bisa diisi belakangan dan metadata foto bisa disunting.', role: 'key' },
		{ id: 'D2', kind: 'defense', title: 'Berita acara penyitaan oleh satpam', text: '25 Juli: regu pengamanan PT "mengamankan" 4 jeriken berlogo koperasi dari gudang Koperasi Tani saat razia. Ditandatangani Bonar Sitompul.', supports: ['opportunity:bonar'], truth: 'Jeriken di TKP adalah salah satu yang disita.', role: 'key' },
		{ id: 'D3', kind: 'defense', title: 'Rekaman utuh orasi', text: 'Video 9 menit dari akun Facebook kelompok tani: "Kalau perusahaan tidak mundur, kami akan ambil tindakan hukum, kami gugat ke PTUN!"', truth: 'Konteks lengkap klip yang beredar.', role: 'key' },
		{ id: 'D4', kind: 'defense', title: 'Pesan suara tanpa nama', text: 'Diterima Rahmat 7 Agustus dari nomor tak dikenal: "Kalau portal nggak dibuka minggu ini, kalian yang repot." Suaranya mirip Bonar.', supports: ['motive:bonar'], reliability: 'unreliable', flag: 'unreliable', truth: 'Memang suara Bonar.', role: 'key' },

		{ id: 'P1', kind: 'prosecution', title: 'CCTV SPBU mini', text: '9 Agustus 19.10: Rahmat membeli 10 liter bensin ke dalam jeriken.', supports: ['opportunity:rahmat'], truth: 'Bensin untuk genset posko blokade. Tak ada catatan soal genset di berkas.', role: 'misleading' },
		{ id: 'P2', kind: 'prosecution', title: 'Sidik jari pada jeriken', text: 'Labfor: sidik jari Rahmat Hidayat ditemukan pada jeriken di TKP.', supports: ['identity:rahmat'], reframedBy: ['D2'], truth: 'Jeriken koperasi yang biasa ia pegang, sebelum disita satpam.', role: 'misleading' },
		{ id: 'P3', kind: 'prosecution', title: 'Tangkapan layar grup WhatsApp', text: 'Grup "Tani Bersatu", 20.00: Rahmat menulis "Malam ini kita tunjukkan kekuatan, semua kumpul!"', supports: ['motive:rahmat'], reframedBy: ['D1'], truth: 'Ajakan berkumpul di tahlilan dan doa bersama.', role: 'misleading' },
		{ id: 'P4', kind: 'prosecution', title: 'Keterangan Sandi di BAP', text: '"Saya lihat tiga orang berjaket hijau kelompok tani lari dari pos sekitar pukul 23.20."', supports: ['identity:rahmat'], reliability: 'contradictory', flag: 'contradictory', underminedBy: ['H1', 'H5', 'sandi.ngaku'], truth: 'Karangan atas perintah Bonar.', role: 'misleading' },

		{ id: 'H1', kind: 'hidden', title: 'Data GPS truk regu pengamanan', text: 'Truk double-cabin regu Bonar berhenti 40 meter dari pos blok C pukul 23.05–23.25, bukan di sektor utara.', supports: ['opportunity:bonar', 'timeline:bonar'], truth: 'Regu Bonar ada di lokasi.', role: 'key' },
		{ id: 'H2', kind: 'hidden', title: 'Rekening Bonar', text: 'Transfer Rp 75 juta dari manajer kebun pada 12 Agustus, keterangan "bonus pengamanan blokade".', supports: ['motive:bonar'], truth: 'Imbalan setelah blokade bubar.', role: 'key' },
		{ id: 'H3', kind: 'hidden', title: 'Analisis jejak ban', text: 'Jejak ban di lumpur dekat pos (tercetak setelah hujan berhenti 23.00) cocok dengan ban truk double-cabin PT. Tidak ada jejak motor.', supports: ['identity:bonar'], truth: 'Pelaku datang dengan truk perusahaan.', role: 'key' },
		{ id: 'H4', kind: 'hidden', title: 'Tiket dan check-in Doni', text: 'Doni naik bus ke Palangka Raya 8 Agustus dan menginap di kos sepupunya sampai 10 Agustus.', truth: 'Doni tidak di desa.', role: 'context' },
		{ id: 'H5', kind: 'hidden', title: 'Riwayat panggilan ponsel Sandi', text: 'Sandi menelepon Bonar 23.02 (3 menit) dan menelepon Polsek 23.40. Tidak ada panggilan atau pesan pukul 23.20.', supports: ['opportunity:bonar'], truth: 'Sandi bersama Bonar, bukan menyaksikan petani lari.', role: 'key' }
	],

	clarify: {
		E3: { reveals: 'H1', text: 'Majelis meminta data GPS kendaraan regu pengamanan.' },
		E7: { reveals: 'H1', text: 'Majelis menanyakan kendaraan apa saja yang lewat jalan kebun malam itu.' },
		E6: { reveals: 'H2', text: 'Majelis meminta PPATK menelusuri aliran dana terkait pengamanan blokade.' },
		E4: { reveals: 'H3', text: 'Majelis meminta analisis jejak di sekitar pos.' },
		E9: { reveals: 'H3', text: 'Majelis menanyakan jejak apa yang tertinggal di lumpur setelah hujan.' },
		E10: { reveals: 'H4', text: 'Majelis memeriksa keberadaan Doni malam itu.' },
		E5: { reveals: 'H4', text: 'Majelis memeriksa keberadaan Doni malam itu.' },
		P4: { reveals: 'H5', text: 'Majelis meminta riwayat panggilan ponsel saksi Sandi.' }
	},

	witnesses: {
		yosep: {
			persona:
				'Yosep Lalang, 34 tahun, satpam asal Dayak Ngaju, kontrak tahunan. Malam itu ia ketiduran di pos sekitar 23.00 karena hujan. Bangun karena panas, mendengar teriakan "tanah ini milik rakyat!" ' +
				'dan suara mesin menjauh — ia MENGIRA petani pelakunya, padahal suara mesinnya berat seperti mobil. Esoknya Bonar menjenguknya di rumah sakit dan memintanya ' +
				'"cerita yang didengar saja" dengan janji kontraknya diperpanjang. Ia sebenarnya akrab dengan Rahmat, yang dulu sering memberinya kopi.',
			answers: {
				where: { text: 'Jaga di pos blok C. Ketiduran sekitar jam sebelas, hujan deras.', honesty: 'truth' },
				saw: { text: 'Saya bangun sudah panas. Dengar orang teriak "tanah ini milik rakyat!" terus suara mesin menjauh. Pasti petani.', honesty: 'mistake', supports: ['identity:rahmat'], underminedBy: ['yosep.sure', 'H3', 'yosep.mobil'] },
				who: { text: 'Saya tidak lihat siapa-siapa, asapnya tebal.', honesty: 'truth' },
				sure: { text: 'Suara mesinnya… berat, kayak mobil, bukan motor. Tapi siapa lagi kalau bukan petani?', honesty: 'truth' },
				contact: { text: 'Pak Bonar besoknya datang ke rumah sakit. Bilang saya cukup cerita yang saya dengar saja, jangan macam-macam, nanti kontrak saya diperpanjang.', honesty: 'truth', supports: ['motive:bonar'] },
				rahmat: { text: 'Pak Rahmat dulu sering kasih saya kopi waktu jaga. Orangnya tidak kasar.', honesty: 'truth' },
				bonar: { text: 'Komandan saya. Malam itu harusnya dia patroli sektor utara.', honesty: 'truth' },
				doni: { text: 'Anak muda itu suka teriak-teriak di Facebook, tapi tidak pernah datang ke pos.', honesty: 'truth' }
			},
			confront: {
				H1: { text: 'Truk regu berhenti dekat pos? …Pantas suara mesinnya berat. Itu suara truk kami.', key: 'yosep.mobil', honesty: 'truth', supports: ['identity:bonar'] },
				H3: { text: 'Jejak truk, tidak ada jejak motor? Ya Tuhan. Berarti yang teriak itu bukan petani.', key: 'yosep.mobil', honesty: 'truth', supports: ['identity:bonar'] },
				E1: { text: 'Jeriken koperasi? Bulan lalu regu kami angkut jeriken-jeriken itu dari gudang koperasi waktu razia.', key: 'yosep.jeriken', honesty: 'truth', supports: ['opportunity:bonar'] }
			}
		},
		sandi: {
			persona:
				'Sandi Purba, 27 tahun, anggota regu pengamanan, anak buah Bonar. Malam itu ia di truk bersama Bonar yang berhenti 40 meter dari pos; Bonar turun membawa jeriken, ' +
				'regunya meneriakkan "tanah ini milik rakyat!" lalu kabur. Sandi BERBOHONG di BAP dan di sidang bahwa mereka patroli di utara dan ia melihat tiga petani berjaket hijau lari — ' +
				'karena Bonar mengancam memecatnya. Kalau ditanya langsung siapa yang menghubunginya, ia mengaku Bonar yang mengatur laporan. Kalau dikonfrontasi dengan GPS atau riwayat teleponnya, ia runtuh.',
			answers: {
				where: { text: 'Patroli bersama Komandan Bonar di sektor utara, jauh dari pos.', honesty: 'lie', underminedBy: ['sandi.contact', 'sandi.ngaku', 'H1'] },
				saw: { text: 'Waktu kami putar balik, saya lihat tiga orang berjaket hijau kelompok tani lari dari arah pos, sekitar jam sebelas lewat dua puluh.', honesty: 'lie', supports: ['identity:rahmat'], underminedBy: ['sandi.ngaku', 'H1', 'H5'] },
				who: { text: 'Gelap, tapi jaketnya hijau. Jaket kelompok tani.', honesty: 'lie', underminedBy: ['sandi.ngaku'] },
				sure: { text: 'Yakin, Yang Mulia.', honesty: 'lie', underminedBy: ['sandi.contact', 'sandi.ngaku', 'H5'] },
				contact: { text: 'Komandan Bonar bilang ke saya, kalau ditanya, bilang saja kita di utara. Laporannya beliau yang atur.', honesty: 'truth', supports: ['opportunity:bonar'] },
				rahmat: { text: 'Pak Rahmat yang pimpin blokade. Orangnya keras di orasi, tapi tidak pernah main fisik.', honesty: 'truth' },
				bonar: { text: 'Komandan dapat target dari manajer: portal harus dibuka sebelum audit. Katanya ada bonus.', honesty: 'truth', supports: ['motive:bonar'] },
				doni: { text: 'Doni? Seminggu ini saya tidak lihat dia di desa.', honesty: 'truth' }
			},
			broken: { key: 'sandi.ngaku', text: 'Sudah saya akui, Yang Mulia. Kami di dekat pos. Komandan turun bawa jeriken, saya tunggu di truk. Saya diancam dipecat.' },
			confront: {
				H1: { text: '…GPS-nya di blok C. Iya. Kami di sana. Komandan turun bawa jeriken, saya disuruh tunggu di truk dan ikut teriak. Saya tidak tahu Yosep ada di dalam. Ampun, Yang Mulia.', key: 'sandi.ngaku', honesty: 'truth', supports: ['opportunity:bonar', 'identity:bonar'] },
				H5: { text: 'Jam 23.02 saya telepon Komandan karena dia lama di pos… Iya, saya bohong soal tiga orang itu. Kami yang di sana.', key: 'sandi.ngaku', honesty: 'truth', supports: ['opportunity:bonar', 'identity:bonar'] },
				D2: { text: 'Jeriken itu yang kami angkut dari gudang koperasi waktu razia. Disimpan di gudang pos komando.', key: 'sandi.jeriken', honesty: 'truth', supports: ['opportunity:bonar'] }
			}
		},
		mariam: {
			persona:
				'Bu Mariam, 52 tahun, pemilik warung kopi di simpang satu-satunya jalan ke blok C, orang Banjar. Ia ikut tahlilan sampai 22.30, lalu buka warung lagi. ' +
				'Sekitar 22.55 ia melihat mobil lewat ke arah blok C dengan lampu dimatikan dan MENGIRA itu mobil petani yang mau jaga portal — keliru. ' +
				'Kalau ditanya seberapa yakin, ia ingat mobilnya double-cabin putih dengan lampu rotator kecil di atap, persis truk satpam PT, kembali ngebut pukul 23.25. ' +
				'Waktu ia pulang dari tahlilan 22.30, Pak Rahmat masih memimpin doa. Doni sudah seminggu di Palangka Raya.',
			answers: {
				where: { text: 'Di warung, Pak. Tadinya ikut tahlilan di rumah Mak Inah, jam setengah sebelas saya pulang buka warung lagi.', honesty: 'truth' },
				saw: { text: 'Jam sebelas kurang lima ada mobil lewat ke arah blok C, lampunya dimatikan. Saya kira mobil petani mau jaga portal.', honesty: 'mistake', supports: ['identity:rahmat'], underminedBy: ['mariam.sure'] },
				who: { text: 'Orangnya tidak kelihatan, gelap. Cuma mobilnya.', honesty: 'truth' },
				sure: { text: 'Kalau mobilnya saya ingat betul: double-cabin putih, ada lampu kedip kecil di atapnya — kayak truk satpam PT. Balik lagi ngebut sekitar jam setengah dua belas kurang lima.', honesty: 'truth', supports: ['identity:bonar', 'timeline:bonar'] },
				contact: { text: 'Besoknya ada orang PT datang ke warung, tanya-tanya saya lihat apa. Saya bilang tidak lihat apa-apa, takut.', honesty: 'truth', supports: ['motive:bonar'] },
				rahmat: { text: 'Waktu saya pulang dari tahlilan jam setengah sebelas, Pak Rahmat masih di depan, memimpin doa.', honesty: 'truth' },
				bonar: { text: 'Truknya sering lewat depan warung. Kadang mampir, tidak pernah bayar.', honesty: 'truth' },
				doni: { text: 'Doni sudah seminggu di Palangka Raya, ikut sepupunya. Ibunya cerita ke saya.', honesty: 'truth' }
			},
			confront: {
				E10: { text: 'Doni? Mana mungkin. Anak itu di Palangka Raya, ibunya sendiri bilang ke saya.', key: 'mariam.doni', honesty: 'truth' },
				E3: { text: 'Patroli di utara? Lho, truknya lewat depan warung saya ke arah blok C. Saya lihat sendiri.', key: 'mariam.truk', honesty: 'truth', supports: ['opportunity:bonar', 'identity:bonar'] },
				D1: { text: 'Iya, itu tahlilannya. Pak Rahmat di depan, saya duduk di belakang.', key: 'mariam.tahlil', honesty: 'truth' }
			}
		}
	},

	contradictions: [
		{ a: 'yosep.saw', b: 'yosep.sure', text: 'Yosep yakin petani bermotor, padahal suara mesinnya berat seperti mobil.' },
		{ a: 'yosep.saw', b: 'H3', text: 'Tidak ada jejak motor; yang ada jejak truk PT.' },
		{ a: 'E4', b: 'H3', text: 'Keterangan korban soal pelaku bermotor bertentangan dengan jejak ban.' },
		{ a: 'sandi.where', b: 'sandi.contact', text: 'Sandi bilang patroli di utara, lalu bilang Bonar yang mengatur laporan.' },
		{ a: 'sandi.where', b: 'H1', text: 'GPS menempatkan truk Sandi 40 meter dari pos.' },
		{ a: 'sandi.where', b: 'sandi.ngaku', text: 'Sandi mengaku mereka ada di dekat pos.' },
		{ a: 'sandi.saw', b: 'sandi.ngaku', text: 'Tiga petani berjaket hijau itu karangan.' },
		{ a: 'sandi.sure', b: 'sandi.ngaku', text: 'Sandi "yakin" — lalu mengaku berbohong.' },
		{ a: 'P4', b: 'H5', text: 'Sandi tidak menelepon siapa pun saat "melihat pelaku" pukul 23.20.' },
		{ a: 'P4', b: 'H1', text: 'Keterangan Sandi di BAP bertentangan dengan GPS truknya.' },
		{ a: 'E3', b: 'H1', text: 'Laporan patroli "sektor utara" bertentangan dengan GPS.' },
		{ a: 'E3', b: 'mariam.sure', text: 'Truk satpam lewat ke arah blok C, bukan ke utara.' },
		{ a: 'E3', b: 'sandi.contact', text: 'Laporan patroli diatur Bonar sendiri.' },
		{ a: 'E2', b: 'D3', text: 'Klip yang beredar memotong kata "tindakan hukum".' },
		{ a: 'E1', b: 'D2', text: 'Jeriken di TKP sudah disita satpam PT dua minggu sebelumnya.' },
		{ a: 'mariam.saw', b: 'mariam.sure', text: '"Mobil petani" yang dilihat Bu Mariam ternyata truk satpam PT.' },
		{ a: 'E10', b: 'H4', text: 'Pesan berantai menuduh Doni, padahal Doni di Palangka Raya.' },
		{ a: 'E10', b: 'mariam.doni', text: 'Pesan berantai menuduh Doni, padahal ia sudah seminggu di luar desa.' }
	],

	truth: {
		culprit: 'bonar',
		motive: 'Bonus Rp 75 juta dari manajemen untuk membubarkan blokade, dan target "lahan bebas konflik" sebelum audit dan perpanjangan HGU.',
		summary:
			'Bonar Sitompul, komandan regu pengamanan, membakar pos blok C untuk mengkriminalisasi kelompok tani. Ia memakai salah satu jeriken koperasi yang disita regunya dua minggu sebelumnya — ' +
			'jeriken yang dulu biasa dipegang Pak Rahmat. Setelah hujan reda, truk double-cabin regunya masuk ke blok C dengan lampu mati, lewat depan warung Bu Mariam. Bonar menyiram ' +
			'dan membakar pos, tanpa tahu Yosep tertidur di dalam, sementara anak buahnya meneriakkan "tanah ini milik rakyat!". Ia menulis laporan patroli palsu, memaksa Sandi bersaksi bohong, ' +
			'dan esoknya menyebar pesan berantai yang menuduh Doni untuk memecah kelompok tani. Pak Rahmat sedang memimpin tahlilan.',
		timeline: [
			{ time: '25 Jul', text: 'Regu Bonar menyita 4 jeriken dari gudang koperasi.' },
			{ time: '7 Agu', text: 'Bonar mengirim pesan suara ancaman ke Pak Rahmat.' },
			{ time: '8 Agu', text: 'Doni berangkat ke Palangka Raya.' },
			{ time: '16:00', text: 'Orasi: "…kami akan ambil tindakan hukum, kami gugat ke PTUN!"' },
			{ time: '19:10', text: 'Pak Rahmat membeli bensin untuk genset posko.' },
			{ time: '21:00', text: 'Pak Rahmat memimpin tahlilan sampai 23.30.' },
			{ time: '22:55', text: 'Truk regu Bonar lewat depan warung Bu Mariam, lampu mati.' },
			{ time: '23:02', text: 'Sandi menelepon Bonar yang sedang di pos.' },
			{ time: '23:20', text: 'Bonar membakar pos; regunya meneriakkan "tanah ini milik rakyat!".' },
			{ time: '23:25', text: 'Truk kembali ngebut. Jejak bannya tercetak di lumpur.' },
			{ time: '06:00', text: 'Polres merilis "pelaku dari kelompok tani"; pesan berantai menuduh Doni.' },
			{ time: '12 Agu', text: 'Bonar menerima "bonus pengamanan" Rp 75 juta.' }
		]
	}
};
