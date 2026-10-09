// Perkara 1: Permata yang Hilang. Galeri seni di Menteng, utang pinjol dan judi online.
// HANYA SERVER.

import type { CaseFile } from '../case';

export const berlian: CaseFile = {
	public: {
		id: 'berlian',
		title: 'Permata yang Hilang',
		docket: 'PERKARA 0314/PID.B/PN.JKT.PST · NEGARA v. SARI LESTARI',
		tagline: 'Pencurian permata Rp 40 miliar dari brankas galeri di Menteng.',
		setting: 'Galeri Halim, Menteng, Jakarta Pusat',
		charge: 'Pencurian dengan pemberatan (Pasal 363 KUHP) atas permata "Nusantara" senilai Rp 40 miliar dari brankas Galeri Halim.',
		brief:
			'Malam gala amal 14 Maret, permata Nusantara dipindah ke brankas pukul 22.50. Pukul 06.50 kurator mendapati brankas kosong. ' +
			'Kurator junior Sari Lestari didakwa: kartu aksesnya membuka brankas pukul 23.42.',
		accused: 'sari',
		suspects: {
			sari: { name: 'Sari Lestari', short: 'Sari', role: 'Kurator junior · terdakwa', bio: 'Delapan tahun di galeri, dua kali dilewati promosi. Mengaku pulang pukul 23.15.' },
			bambang: { name: 'Bambang Kurniawan', short: 'Bambang', role: 'Kepala keamanan', bio: 'Bertugas semalaman menurut catatannya sendiri. Ikut memindahkan permata ke brankas.' },
			aldo: { name: 'Aldo Halim', short: 'Aldo', role: 'Anak pemilik galeri', bio: 'Tuan rumah gala. Kabarnya gaya hidupnya melebihi uang sakunya.' }
		},
		witnesses: {
			endang: { name: 'Bu Endang Suryani', short: 'Bu Endang', role: 'Warga sekitar', bio: 'Pulang pengajian lewat Jalan Kebon Sirih, tepat di seberang pintu servis galeri.' },
			wulan: { name: 'Wulan Pratiwi', short: 'Wulan', role: 'Satpam malam (outsourcing)', bio: 'Berkeliling malam itu. Ikut memindahkan permata ke brankas.' },
			ujang: { name: 'Pak Ujang', short: 'Pak Ujang', role: 'Juru parkir', bio: 'Menjaga parkiran staf sampai tengah malam dari pos di tepi jalan.' }
		},
		timeline: [
			{ time: '22:30', text: 'Gala amal selesai.' },
			{ time: '22:50', text: 'Permata dipindah dari etalase ke brankas.' },
			{ time: '23:15', text: 'Sari menandatangani daftar pulang.' },
			{ time: '23:30', text: 'Kamera koridor mati (perawatan).' },
			{ time: '23:41', text: 'Alarm brankas dinonaktifkan.' },
			{ time: '23:42', text: 'Brankas dibuka dengan kartu Sari.' },
			{ time: '23:45', text: 'Kamera menyala kembali.' },
			{ time: '23:47', text: 'Brankas tertutup.' },
			{ time: '06:50', text: 'Brankas didapati kosong.' }
		],
		goals: {
			defense: 'Bangun keraguan yang wajar. Anda cukup menunjukkan dakwaan terhadap Sari belum terbukti; menunjuk pelaku sebenarnya akan sangat membantu.',
			prosecution: 'Buktikan Sari Lestari bersalah secara sah dan meyakinkan. Berkas Anda kuat, tapi sebagian mungkin tak tahan diuji.'
		}
	},

	evidence: [
		{ id: 'E1', kind: 'public', title: 'Log akses brankas', text: 'Kartu SL-04 (atas nama Sari Lestari) membuka pintu brankas pukul 23.42. Pintu tertutup 23.47.', supports: ['opportunity:sari', 'identity:sari', 'timeline:sari'], reframedBy: ['D2', 'D3', 'wulan.sari'], truth: 'Kartu Sari, tapi dipakai Bambang setelah diambil dari laci Sari yang terbuka.', role: 'misleading' },
		{ id: 'E2', kind: 'public', title: 'Log panel alarm', text: 'Zona brankas dinonaktifkan pukul 23.41 dengan kode darurat 07. Kode 07 hanya dipegang tim keamanan dan pemilik.', supports: ['opportunity:bambang', 'identity:bambang'], truth: 'Bambang yang menonaktifkan. Sari tak pernah tahu kode 07.', role: 'key' },
		{ id: 'E3', kind: 'public', title: 'Laporan status CCTV', text: 'Kamera koridor brankas mati 23.30–23.45 untuk "perawatan terjadwal". Tak ada rekaman di jam itu.', supports: ['opportunity:bambang'], truth: 'Bambang sendiri yang menjadwalkan titik buta itu sore harinya.', role: 'key' },
		{ id: 'E4', kind: 'public', title: 'Daftar pulang & buku jaga keamanan', text: 'Sari Lestari pulang 23.15. Aldo Halim pulang 23.58. Buku jaga Bambang, tulisan tangannya: "Di meja jaga 23.00–00.30. Aman terkendali."', supports: ['timeline:sari', 'timeline:aldo'], reliability: 'contradictory', flag: 'contradictory', underminedBy: ['wulan.contact', 'wulan.ngaku', 'H2', 'H5', 'ujang.where'], truth: 'Jam pulang benar. Buku jaga Bambang bohong: ia meninggalkan meja pukul 23.30.', role: 'key' },
		{ id: 'E5', kind: 'public', title: 'Pesan WhatsApp Sari ke pemilik', text: 'Dua minggu sebelum gala: "Saya dilewati lagi, Bu? Setelah delapan tahun? Ibu akan menyesal."', supports: ['motive:sari'], reframedBy: ['D3'], truth: 'Marah sungguhan, ancaman kosong. Sari berencana mengundurkan diri, bukan mencuri.', role: 'misleading' },
		{ id: 'E6', kind: 'public', title: 'Berita acara pemindahan permata', text: 'Permata dipindah dari etalase ke brankas pukul 22.50 oleh B. Kurniawan dan W. Pratiwi.', supports: ['opportunity:bambang'], truth: 'Bambang tahu persis letak permata dan siapa yang menjaganya.', role: 'context' },
		{ id: 'E7', kind: 'public', title: 'Log palang parkir staf', text: 'B 2290 SLT (Sari, Kijang tua) keluar 23.16. Palang dibuka manual dari meja keamanan 23.46. B 1188 AHL (Aldo) keluar 00.02. Mobil staf terdaftar lain: B 4471 BKR (Bambang, Avanza, slot 4B).', supports: ['timeline:sari', 'opportunity:bambang'], truth: 'Sari sudah pergi 23.16. Bambang membuka palang untuk dirinya sendiri pukul 23.46.', role: 'key' },
		{ id: 'E8', kind: 'public', title: 'Keterangan awal Bu Endang', text: '"Seorang perempuan berjas hujan merah keluar dari pintu servis sekitar jam dua belas kurang seperempat, lalu jalan ke parkiran staf."', supports: ['identity:sari', 'timeline:sari'], reliability: 'unreliable', flag: 'unreliable', underminedBy: ['endang.who', 'endang.sure', 'endang.jas', 'H4'], truth: 'Itu Bambang memakai jas hujan staf bertudung. Bu Endang tak pernah melihat wajahnya.', role: 'misleading' },
		{ id: 'E9', kind: 'public', title: 'Berkas asuransi', text: 'Permata diasuransikan Rp 40 miliar. Inventarisasi penilaian bulan lalu dikerjakan S. Lestari, termasuk menghubungi penaksir di Singapura. Kontak keamanan di polis: B. Kurniawan.', supports: ['opportunity:bambang'], truth: 'Menjelaskan mengapa Sari mencari harga permata dan pembeli di Singapura.', role: 'context' },
		{ id: 'E10', kind: 'public', title: 'Pesan berantai tanpa nama', text: 'Masuk ke grup WhatsApp karyawan pukul 09.12 esok paginya, dari nomor tak dikenal: "Aldo itu kalah judi online ratusan juta. Jam 23.10 dia mondar-mandir di koridor brankas."', supports: ['motive:aldo', 'opportunity:aldo'], reliability: 'contradictory', authentic: false, flag: 'contradictory', underminedBy: ['ujang.aldo', 'wulan.aldo'], truth: 'Dikirim Bambang dari nomor sekali pakai untuk mengaburkan jejak. Aldo mabuk di lobi.', role: 'misleading' },

		{ id: 'D1', kind: 'defense', title: 'Data tidur jam tangan pintar Sari', text: 'Tidur terdeteksi 23.38 sampai 06.40. Detak jantung istirahat sepanjang malam.', supports: ['timeline:sari'], reliability: 'unreliable', flag: 'unreliable', truth: 'Benar, ia tidur, tapi jam itu hanya mendeteksi diam dan bisa saja dilepas.', role: 'context' },
		{ id: 'D2', kind: 'defense', title: 'Catatan petugas kebersihan lantai 2', text: '23.20 — ruang kantor dibersihkan. "Meja 4 (S. Lestari): laci terbuka, kartu akses kelihatan. Dibiarkan seperti semula."', supports: ['opportunity:bambang', 'opportunity:aldo'], truth: 'Kartu Sari tergeletak di laci terbuka setelah ia pulang. Bambang mengambilnya pukul 23.35.', role: 'key' },
		{ id: 'D3', kind: 'defense', title: 'Surat teguran HRD', text: 'Dua surat teguran untuk S. Lestari karena meninggalkan kartu akses di laci meja. Teguran kedua dibuat oleh B. Kurniawan.', supports: ['opportunity:bambang'], truth: 'Bambang tahu persis di mana kartu Sari biasa disimpan.', role: 'key' },
		{ id: 'D4', kind: 'defense', title: 'Tangkapan kamera dasbor tetangga', text: 'Sebuah MPV gelap keluar dari pintu staf, stempel waktu 23.47. Plat terbaca sebagian: "B 4471 ?K?". Jam kamera diketahui bisa melenceng sampai 5 menit.', supports: ['identity:bambang', 'timeline:bambang'], reliability: 'unreliable', flag: 'unreliable', truth: 'Avanza Bambang, membawa permata ke mobilnya.', role: 'key' },

		{ id: 'P1', kind: 'prosecution', title: 'Data ponsel Sari', text: 'Ponselnya lepas dari jaringan pukul 23.20 dan baru tersambung lagi 07.02.', supports: ['timeline:sari'], reframedBy: ['D1'], truth: 'Baterainya habis. Tak bersalah, tapi tampak mencurigakan.', role: 'misleading' },
		{ id: 'P2', kind: 'prosecution', title: 'Riwayat pencarian Sari', text: '12 hari sebelumnya: "harga permata nusantara", "pembeli permata pribadi singapura".', supports: ['motive:sari'], reframedBy: ['E9'], truth: 'Riset untuk penilaian asuransi (E9).', role: 'misleading' },
		{ id: 'P3', kind: 'prosecution', title: 'Mutasi rekening', text: 'Transfer masuk Rp 50 juta ke rekening Sari dua hari setelah pencurian, dari rekening atas nama "Rina L.".', supports: ['motive:sari'], truth: 'Uang arisan keluarga yang diterima lewat kakaknya, Rina. Tak ada catatan arisan itu di berkas.', role: 'misleading' },
		{ id: 'P4', kind: 'prosecution', title: 'Laporan serat forensik', text: 'Serat sintetis merah tersangkut di gagang brankas. Sari Lestari punya mantel merah.', supports: ['identity:sari'], underminedBy: ['H4'], reliability: 'contradictory', flag: 'contradictory', truth: 'Dari jas hujan staf yang dipakai Bambang. Mantel Sari dari wol.', role: 'misleading' },

		{ id: 'H1', kind: 'hidden', title: 'Surat perintah perawatan CCTV', text: 'Perintah kerja untuk mematikan kamera 23.30–23.45, dibuat pukul 16.12 hari itu oleh B. Kurniawan.', supports: ['opportunity:bambang'], truth: 'Ia membuat titik butanya sendiri.', role: 'key' },
		{ id: 'H2', kind: 'hidden', title: 'Data ponsel Bambang', text: 'Ponselnya dimatikan pukul 23.30 sampai 23.50.', supports: ['opportunity:bambang', 'timeline:bambang'], truth: 'Mati tepat selama pencurian.', role: 'key' },
		{ id: 'H3', kind: 'hidden', title: 'Pemeriksaan keuangan staf (PPATK)', text: 'Bambang Kurniawan berutang sekitar Rp 2 miliar ke belasan aplikasi pinjol ilegal, dengan riwayat setoran rutin ke situs judi online; penagih mendatangi rumahnya minggu itu. Aldo Halim: tidak ada utang berarti.', supports: ['motive:bambang'], truth: 'Motif sebenarnya.', role: 'key' },
		{ id: 'H4', kind: 'hidden', title: 'Adendum laboratorium serat', text: 'Serat itu poliester dan cocok dengan jas hujan merah inventaris tim keamanan. Mantel merah Sari Lestari dari wol.', supports: ['identity:bambang'], truth: 'Serat berasal dari Bambang.', role: 'key' },
		{ id: 'H5', kind: 'hidden', title: 'Data ponsel Wulan', text: 'Panggilan masuk dari Bambang Kurniawan pukul 23.28, 41 detik.', supports: ['opportunity:bambang'], truth: 'Bambang menyuruh satpam istirahat supaya koridor kosong.', role: 'key' }
	],

	clarify: {
		E3: { reveals: 'H1', text: 'Majelis menanyakan siapa yang menjadwalkan perawatan CCTV.' },
		P1: { reveals: 'H2', text: 'Majelis memerintahkan data ponsel semua staf yang bertugas.' },
		E4: { reveals: 'H2', text: 'Majelis mencocokkan buku jaga dengan data ponsel.' },
		E10: { reveals: 'H3', text: 'Majelis meminta PPATK memeriksa keuangan semua staf.' },
		P4: { reveals: 'H4', text: 'Majelis meminta laboratorium menuntaskan analisisnya.' },
		E8: { reveals: 'H4', text: 'Majelis menanyakan jas atau mantel merah apa saja yang ada di lokasi.' },
		E6: { reveals: 'H5', text: 'Majelis memanggil data ponsel satpam malam.' }
	},

	witnesses: {
		endang: {
			persona:
				'Bu Endang Suryani, 64 tahun, pensiunan guru SD, pulang pengajian lewat Jalan Kebon Sirih sekitar 23.44. Hujan baru reda. ' +
				'Ia melihat sosok ramping berjas hujan merah bertudung keluar dari pintu servis dan menyangka itu perempuan. ' +
				'Lampu di atas pintu mati dan ia berjarak 40 meter. Ia tak pernah melihat wajahnya. Jujur, tapi gengsi dan tak suka dibilang salah. Tidak kenal staf galeri.',
			answers: {
				where: { text: 'Di Jalan Kebon Sirih, pulang pengajian, persis di seberang pintu servis. Saya lihat jam di HP: 23.44.', honesty: 'truth' },
				saw: { text: 'Seorang perempuan berjas hujan merah keluar dari pintu servis, buru-buru ke parkiran staf.', honesty: 'mistake', supports: ['identity:sari'], underminedBy: ['endang.who', 'endang.sure', 'endang.jas', 'H4'] },
				who: { text: 'Ya… tudungnya dipakai. Wajahnya tidak kelihatan. Ramping, jalannya cepat. Saya kira perempuan.', honesty: 'truth' },
				sure: { text: 'Soal jamnya, yakin sekali. Soal orangnya… lampu di atas pintu mati, dan saya kira-kira empat puluh meter jauhnya.', honesty: 'truth' },
				contact: { text: 'Tidak ada. Saya sendiri yang lapor ke polisi besok paginya setelah lihat berita.', honesty: 'truth' },
				sari: { text: 'Saya tidak kenal. Disuruh menunjuk di antara orang banyak pun saya tak bisa.', honesty: 'truth' },
				bambang: { text: 'Tidak pernah ketemu.', honesty: 'truth' },
				aldo: { text: 'Cuma tahu dari berita gosip.', honesty: 'truth' }
			},
			confront: {
				H4: { text: '…Jas hujan staf? Ya, bisa jadi itu. Warnanya memang sama merahnya.', key: 'endang.jas', honesty: 'truth', supports: ['identity:bambang'] },
				P4: { text: 'Merah, betul. Itu yang saya lihat. Jas merah.', key: 'endang.merah', honesty: 'truth' },
				E7: { text: 'Ada mobil keluar parkiran tak lama setelahnya. Mobil keluarga warna gelap, kayaknya. Bukan Kijang — saya hafal Kijang, almarhum suami saya punya.', key: 'endang.mobil', honesty: 'truth', supports: ['identity:bambang'] },
				D4: { text: 'Mobil gelap, iya. Kurang lebih begitu.', key: 'endang.mobil', honesty: 'truth', supports: ['identity:bambang'] },
				E4: { text: 'Jam sebelas lewat seperempat dia sudah pulang? Kalau begitu yang saya lihat jam dua belas kurang seperempat… saya tidak bisa bilang itu dia. Saya cuma mengira.', key: 'endang.mengira', honesty: 'truth' }
			}
		},
		wulan: {
			persona:
				'Wulan Pratiwi, 26 tahun, satpam outsourcing dengan kontrak per tahun. Pukul 23.28 atasannya Bambang menelepon, menyuruhnya istirahat lebih awal, ' +
				'katanya ia sendiri yang akan menjaga koridor brankas. Wulan duduk di pantry 23.30–23.50 main HP. Ia takut kontraknya tidak diperpanjang kalau ketahuan meninggalkan pos, ' +
				'jadi ia BERBOHONG bahwa ia berkeliling seperti biasa dan tidak melihat apa-apa. Kalau ditanya langsung apakah ada yang menghubunginya, ia mengaku soal telepon itu. ' +
				'Kalau dikonfrontasi dengan log brankas atau data ponselnya, ia runtuh dan mengaku. Ia menyukai Sari. Ia tahu Bambang sering ditelepon penagih pinjol.',
			answers: {
				where: { text: 'Keliling, Yang Mulia. Tiap setengah jam seperti biasa. Setengah dua belas sayap timur, jam dua belas kurang seperempat koridor brankas.', honesty: 'lie', underminedBy: ['wulan.contact', 'wulan.ngaku', 'H5', 'E1'] },
				saw: { text: 'Tidak ada yang aneh. Koridor brankas kosong waktu saya lewat jam dua belas kurang seperempat.', honesty: 'lie', underminedBy: ['wulan.ngaku', 'E1'] },
				who: { text: 'Tidak ada siapa-siapa. Setelah staf gala pulang, saya tidak lihat orang.', honesty: 'lie', underminedBy: ['wulan.ngaku'] },
				sure: { text: 'Yakin. Saya… yakin. Saya selalu keliling.', honesty: 'lie', underminedBy: ['wulan.contact', 'wulan.ngaku', 'H5'] },
				contact: { text: 'Pak Bambang telepon sekitar setengah dua belas. Saya disuruh istirahat duluan, katanya beliau sendiri yang jaga koridor brankas.', honesty: 'truth', supports: ['opportunity:bambang'] },
				sari: { text: 'Mbak Sari baik, suka bawain kami kopi. Kartunya selalu ditaruh di laci meja — semua orang tahu. Pak Bambang sampai menegur dia soal itu.', honesty: 'truth', supports: ['opportunity:bambang'] },
				bambang: { text: 'Atasan saya. Belakangan ini dia gelisah, sering ditelepon orang soal utang. Dia suka keluar kalau angkat telepon.', honesty: 'truth', supports: ['motive:bambang'] },
				aldo: { text: 'Mas Aldo mabuk di lobi hampir sepanjang malam. Berisik. Saya tidak lihat dia dekat brankas.', honesty: 'truth' }
			},
			broken: { key: 'wulan.ngaku', text: 'Sudah saya bilang. Saya di pantry dari setengah dua belas sampai jam dua belas kurang sepuluh. Pak Bambang yang suruh.' },
			confront: {
				E1: { text: '…Jam dua belas kurang delapan belas? Saya… saya tidak di sana. Saya istirahat di pantry. Pak Bambang yang suruh. Saya takut kontrak saya tidak diperpanjang.', key: 'wulan.ngaku', honesty: 'truth', supports: ['opportunity:bambang'] },
				H5: { text: 'Iya, beliau telepon. Saya disuruh istirahat duluan, katanya beliau yang jaga koridor. Saya di pantry sampai jam dua belas kurang sepuluh. Maaf.', key: 'wulan.ngaku', honesty: 'truth', supports: ['opportunity:bambang'] },
				E3: { text: 'Kameranya memang dimatikan untuk perawatan. Pak Bambang sudah bilang sore harinya.', key: 'wulan.kamera', honesty: 'truth', supports: ['opportunity:bambang'] },
				E2: { text: 'Kode 07? Itu cuma tim keamanan yang pegang. Sama Bu Halim. Mbak Sari tidak tahu.', key: 'wulan.kode', honesty: 'truth', supports: ['opportunity:bambang', 'identity:bambang'] },
				D2: { text: 'Itu laci Mbak Sari, iya. Tidak pernah dikunci.', key: 'wulan.laci', honesty: 'truth', supports: ['opportunity:bambang'] }
			}
		},
		ujang: {
			persona:
				'Pak Ujang, 45 tahun, juru parkir galeri. Posnya menghadap jalan, bukan parkiran, jadi ia lebih banyak mendengar daripada melihat. ' +
				'Sekitar 23.45 ia mendengar mobil berknalpot brong keluar dan mengira itu Kijang tua milik Sari — KEKELIRUAN yang jujur, karena Kijang Sari keluar 23.16 dan ia sendiri yang melambai. ' +
				'Avanza Bambang di slot 4B knalpotnya sama brongnya. Ia melihat palang dibuka manual pukul 23.46, yang hanya bisa dari meja keamanan. Aldo mabuk di lobi sampai tengah malam.',
			answers: {
				where: { text: 'Di pos parkir sampai jam dua belas. Saya lihat palangnya naik manual jam 23.46 — itu cuma bisa dari meja keamanan.', honesty: 'truth', supports: ['opportunity:bambang'] },
				saw: { text: 'Pos saya menghadap jalan, jadi saya lebih banyak dengar. Jam dua belas kurang seperempat ada mobil knalpot brong keluar. Kayak Kijang tuanya Mbak Sari.', honesty: 'mistake', supports: ['identity:sari', 'timeline:sari'], underminedBy: ['E7', 'ujang.sure', 'ujang.sari'] },
				who: { text: 'Sopirnya tidak kelihatan. Cuma dengar mobilnya.', honesty: 'truth' },
				sure: { text: 'Yakin? Hmm… Avanza di slot 4B knalpotnya juga brong persis begitu. Itu mobilnya Pak Bambang.', honesty: 'truth', supports: ['identity:bambang'] },
				contact: { text: 'Tidak ada.', honesty: 'truth' },
				sari: { text: 'Mbak Sari pulang duluan, sekitar jam sebelas lewat seperempat. Melambai ke saya seperti biasa.', honesty: 'truth', supports: ['timeline:sari'] },
				bambang: { text: 'Pendiam. Parkir di 4B. Avanzanya dimodif, knalpotnya brong.', honesty: 'truth' },
				aldo: { text: 'Mas Aldo di lobi, mabuk berat, nyanyi-nyanyi sampai sopirnya jemput jam dua belas.', honesty: 'truth' }
			},
			confront: {
				E7: { text: 'Mobilnya Mbak Sari keluar 23.16? …Berarti bukan dia yang saya dengar. Pasti Avanza itu.', key: 'ujang.avanza', honesty: 'truth', supports: ['identity:bambang'] },
				D4: { text: 'B 4471? Itu Avanzanya Pak Bambang. Saya sering parkirkan.', key: 'ujang.avanza', honesty: 'truth', supports: ['identity:bambang'] },
				E10: { text: 'Mas Aldo di koridor brankas jam sebelas lewat sepuluh? Tidak mungkin — dia nyanyi di lobi. Semua orang dengar.', key: 'ujang.aldo', honesty: 'truth' }
			}
		}
	},

	contradictions: [
		{ a: 'wulan.where', b: 'wulan.contact', text: 'Wulan bilang berkeliling, tapi juga bilang Bambang menyuruhnya istirahat.' },
		{ a: 'wulan.where', b: 'H5', text: 'Keliling "seperti biasa" bertabrakan dengan telepon Bambang pukul 23.28.' },
		{ a: 'wulan.where', b: 'wulan.ngaku', text: 'Wulan mengaku tidak sedang berkeliling.' },
		{ a: 'wulan.saw', b: 'E1', text: 'Wulan melihat koridor kosong saat brankas sedang terbuka.' },
		{ a: 'wulan.sure', b: 'wulan.ngaku', text: 'Wulan "yakin" berkeliling — lalu mengaku tidak.' },
		{ a: 'endang.saw', b: 'endang.who', text: 'Bu Endang "melihat perempuan" tapi tak pernah melihat wajahnya.' },
		{ a: 'endang.saw', b: 'endang.sure', text: 'Bu Endang mengenali orang dari jarak 40 meter di bawah lampu mati.' },
		{ a: 'E8', b: 'endang.who', text: 'Keterangan awal menyebut perempuan, padahal wajahnya tak terlihat.' },
		{ a: 'ujang.saw', b: 'E7', text: 'Pak Ujang mendengar "Kijang Sari" 23.45, padahal Kijang itu keluar 23.16.' },
		{ a: 'ujang.saw', b: 'ujang.sari', text: 'Pak Ujang melambai ke Sari 23.15, lalu mendengar mobilnya 23.45.' },
		{ a: 'P4', b: 'H4', text: 'Seratnya poliester; mantel Sari dari wol.' },
		{ a: 'E4', b: 'wulan.contact', text: 'Buku jaga bilang Bambang tak pernah meninggalkan meja; ia bilang akan menjaga koridor.' },
		{ a: 'E4', b: 'H2', text: 'Bambang "di meja jaga semalaman" mematikan ponsel tepat di jam pencurian.' },
		{ a: 'E4', b: 'wulan.ngaku', text: 'Catatan "aman terkendali" menutupi bahwa ia menyuruh satpam pergi.' },
		{ a: 'D1', b: 'E1', text: 'Jam tangan Sari mencatat ia tidur 23.38; kartunya membuka brankas 23.42.' },
		{ a: 'E10', b: 'ujang.aldo', text: 'Pesan berantai menaruh Aldo di koridor; saksi menaruhnya mabuk di lobi.' }
	],

	truth: {
		culprit: 'bambang',
		motive: 'Utang sekitar Rp 2 miliar ke pinjol ilegal akibat judi online, dengan penagih yang sudah mendatangi rumahnya.',
		summary:
			'Bambang Kurniawan, kepala keamanan, mencuri permata Nusantara. Terjerat utang pinjol ilegal dari judi online, ia menjadwalkan titik buta kamera 23.30–23.45, ' +
			'menelepon satpam malam pukul 23.28 agar beristirahat, lalu mematikan ponselnya. Ia mengambil kartu Sari dari laci yang dulu pernah ia tegur, menonaktifkan alarm ' +
			'dengan kode 07 miliknya pukul 23.41 dan membuka brankas dengan kartu Sari pukul 23.42. Berjas hujan staf bertudung, ia keluar lewat pintu servis, membuka palang ' +
			'dari meja jaga pukul 23.46 dan menyembunyikan permata di Avanzanya. Esok paginya ia menyebar pesan berantai soal Aldo. Sari sedang tidur di rumah.',
		timeline: [
			{ time: '16:12', text: 'Bambang menjadwalkan "perawatan" kamera 23.30–23.45.' },
			{ time: '22:50', text: 'Bambang dan Wulan memindah permata ke brankas.' },
			{ time: '23:15', text: 'Sari pulang, kartunya tertinggal di laci terbuka; Kijangnya keluar 23.16.' },
			{ time: '23:20', text: 'Baterai ponsel Sari habis. Petugas kebersihan mencatat kartu di laci.' },
			{ time: '23:28', text: 'Bambang menelepon Wulan dan menyuruhnya istirahat.' },
			{ time: '23:30', text: 'Kamera mati. Bambang mematikan ponsel dan mengambil kartu Sari.' },
			{ time: '23:38', text: 'Sari tertidur di rumah.' },
			{ time: '23:41', text: 'Bambang menonaktifkan alarm dengan kode 07.' },
			{ time: '23:42', text: 'Bambang membuka brankas dengan kartu Sari.' },
			{ time: '23:44', text: 'Bu Endang melihat sosok berjas hujan merah keluar pintu servis.' },
			{ time: '23:46', text: 'Bambang membuka palang dari meja jaga dan menyimpan permata di Avanzanya.' },
			{ time: '23:47', text: 'Brankas tertutup. Knalpot brong Avanza terdengar Pak Ujang.' },
			{ time: '09:12', text: 'Bambang menyebar pesan berantai tentang Aldo.' }
		]
	}
};
