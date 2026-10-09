// Perkara latihan: Kotak Amal Masjid. Pendek (±15 menit): dua tokoh, dua saksi, sepuluh bukti.
// Video viral dan amukan warga, main hakim sendiri, dan pengurus yang menutupi kasnya. HANYA SERVER.

import type { CaseFile } from '../case';

export const amal: CaseFile = {
	public: {
		id: 'amal',
		title: 'Kotak Amal Masjid',
		docket: 'PERKARA 41/PID.B/PN.DPK · NEGARA v. DIMAS PRASETYO',
		tagline: 'Latihan ±15 menit. Kotak amal Ramadan raib; video viral menunjuk seorang driver ojol.',
		setting: 'Masjid Al-Ikhlas, Kampung Rawa Bambu, Depok',
		charge:
			'Pencurian dengan pemberatan (Pasal 363 KUHP): mengambil uang kotak amal Ramadan Masjid Al-Ikhlas sebesar Rp 18 juta pada malam hari.',
		brief:
			'Uang kotak amal untuk santunan anak yatim, Rp 18 juta, raib semalam setelah tarawih. Pagi harinya potongan CCTV 15 detik viral di grup warga: ' +
			'seorang pria berjaket ojol hijau memasukkan tangan ke kotak amal. Warga mendatangi kontrakan Dimas Prasetyo dan nyaris menghakiminya sebelum polisi datang.',
		accused: 'dimas',
		suspects: {
			dimas: {
				name: 'Dimas Prasetyo',
				short: 'Dimas',
				role: 'Driver ojol · terdakwa',
				bio: '24 tahun, sering salat di Al-Ikhlas kalau menunggu orderan malam. Cicilan motornya menunggak.'
			},
			harun: {
				name: 'H. Harun Rasyid',
				short: 'Pak Harun',
				role: 'Bendahara DKM',
				bio: 'Pengurus masjid sejak lama, pemegang kunci kotak amal dan buku kas.'
			}
		},
		witnesses: {
			udin: { name: 'Mang Udin', short: 'Mang Udin', role: 'Marbot masjid', bio: 'Mengunci masjid setiap malam dan menemukan kotak amal kosong saat sahur.' },
			ida: { name: 'Bu Ida', short: 'Bu Ida', role: 'Penjual gorengan', bio: 'Berjualan di depan masjid; mengaku melihat Dimas di dekat kotak amal.' }
		},
		timeline: [
			{ time: '19:00', text: 'Salat tarawih.' },
			{ time: '21:40', text: 'CCTV: pria berjaket ojol hijau di dekat kotak amal.' },
			{ time: '22:15', text: 'Marbot mengunci masjid.' },
			{ time: '04:10', text: 'Kotak amal ditemukan kosong, gemboknya dicongkel.' },
			{ time: '09:00', text: 'Potongan CCTV viral. Warga mendatangi kontrakan Dimas.' }
		],
		goals: {
			defense:
				'Bangun keraguan yang wajar. Video 15 detik dan amarah warga belum tentu berarti Dimas. Siapa lagi yang bisa membuka kotak itu malam-malam?',
			prosecution:
				'Buktikan Dimas Prasetyo bersalah secara sah dan meyakinkan. Ia ada di dekat kotak amal dan sedang butuh uang — tapi pastikan bukti Anda tahan uji.'
		},
		pace: { evidence: 3, witness: 3, cross: 3, clarifications: 1, closingSeconds: 120 },
		tutorial: true
	},

	evidence: [
		{
			id: 'E1',
			kind: 'public',
			title: 'Potongan CCTV viral',
			text: 'Klip 15 detik, 21.40: pria berjaket ojol hijau memasukkan tangan ke lubang kotak amal, lalu berjalan cepat keluar.',
			supports: ['opportunity:dimas', 'identity:dimas'],
			reliability: 'contradictory',
			flag: 'contradictory',
			underminedBy: ['D1'],
			reframedBy: ['D1', 'ida.salah'],
			truth: 'Dipotong dari rekaman 2 menit. Dimas memasukkan selembar Rp 50.000, bukan mengambil.',
			role: 'misleading'
		},
		{
			id: 'E2',
			kind: 'public',
			title: 'Foto kotak amal',
			text: 'Kotak amal kosong. Gemboknya rusak dengan bekas congkel di bagian luar.',
			truth: 'Gembok dibuka dengan kunci, baru dicongkel setelahnya agar tampak dibobol.',
			role: 'context'
		},
		{
			id: 'E3',
			kind: 'public',
			title: 'Keterangan tertulis marbot',
			text: '"Masjid saya kunci jam 22.15, kuncinya saya pegang. Tidak ada yang masuk lagi sampai sahur."',
			supports: ['opportunity:dimas'],
			reliability: 'contradictory',
			flag: 'contradictory',
			underminedBy: ['H1', 'udin.ngaku', 'ida.harun', 'ida.kunci'],
			truth: 'Bohong. Kunci dipinjamkan ke Pak Harun pukul 22.26.',
			role: 'misleading'
		},
		{
			id: 'E4',
			kind: 'public',
			title: 'Status WhatsApp Dimas',
			text: 'Diunggah 22.50 malam itu: "Alhamdulillah rezeki malam ini 🙏". Tangkapan layarnya beredar di grup RT.',
			supports: ['motive:dimas'],
			reframedBy: ['D2'],
			truth: 'Dimas mendapat tip Rp 100.000 dari penumpang.',
			role: 'misleading'
		},

		{
			id: 'D1',
			kind: 'defense',
			title: 'Rekaman utuh dari ponsel jamaah',
			text: 'Video 2 menit dari ponsel seorang jamaah: Dimas melipat selembar uang, memasukkannya ke kotak amal, lalu pergi pukul 21.43 karena ada orderan.',
			truth: 'Konteks lengkap potongan viral.',
			role: 'key'
		},
		{
			id: 'D2',
			kind: 'defense',
			title: 'Riwayat order aplikasi',
			text: 'Dimas mengantar penumpang Depok–Kebayoran 21.50–23.40. Tip Rp 100.000 tercatat 22.48.',
			truth: 'Alibi Dimas untuk pukul 22.30, dan arti "rezeki malam ini".',
			role: 'key'
		},

		{
			id: 'P1',
			kind: 'prosecution',
			title: 'Tagihan leasing motor',
			text: 'Cicilan motor Dimas menunggak tiga bulan, Rp 2,1 juta. Surat peringatan terakhir datang seminggu sebelumnya.',
			supports: ['motive:dimas'],
			truth: 'Benar ia butuh uang, tapi itu tidak membuatnya mencuri.',
			role: 'misleading'
		},
		{
			id: 'P2',
			kind: 'prosecution',
			title: 'Obeng di jok motor Dimas',
			text: 'Warga menemukan obeng di bawah jok motor Dimas saat "memeriksa" motornya, sebelum polisi datang.',
			supports: ['opportunity:dimas'],
			reliability: 'unreliable',
			flag: 'unreliable',
			underminedBy: ['H2'],
			truth: 'Obeng plus kecil yang dibawa hampir semua pengemudi ojol. Tidak cocok dengan bekas congkel.',
			role: 'misleading'
		},

		{
			id: 'H1',
			kind: 'hidden',
			title: 'Pesan WhatsApp marbot',
			text: '22.24, Pak Harun: "Din, pinjam kunci masjid, kitab saya ketinggalan." 22.26, Mang Udin: "Ambil di pos, Pak."',
			supports: ['opportunity:harun', 'timeline:harun'],
			truth: 'Pak Harun memegang kunci masjid setelah dikunci.',
			role: 'key'
		},
		{
			id: 'H2',
			kind: 'hidden',
			title: 'Pemeriksaan Labfor atas gembok',
			text: 'Gembok dibuka dengan anak kuncinya, lalu dicongkel dari luar dalam keadaan terbuka. Bekas congkel dari obeng pipih 6 mm; obeng milik Dimas berujung plus.',
			supports: ['opportunity:harun'],
			truth: 'Pelakunya memegang kunci kotak amal: Pak Harun.',
			role: 'key'
		}
	],

	clarify: {
		E3: { reveals: 'H1', text: 'Majelis meminta riwayat pesan marbot malam itu.' },
		E2: { reveals: 'H2', text: 'Majelis memerintahkan pemeriksaan Labfor atas gembok.' },
		P2: { reveals: 'H2', text: 'Majelis memerintahkan pemeriksaan Labfor atas gembok dan obeng.' }
	},

	witnesses: {
		udin: {
			persona:
				'Mang Udin, 55 tahun, marbot Al-Ikhlas, honornya dibayar lewat Pak Harun. Malam itu ia mengunci masjid 22.15, lalu pukul 22.26 meminjamkan kunci ke Pak Harun yang mengaku kitabnya ketinggalan. ' +
				'Ia BERBOHONG bahwa tak ada yang masuk lagi, karena takut honornya diputus dan tak mau menuduh pengurus. Bila dihadapkan pada pesan WhatsApp atau hasil Labfor, ia runtuh dan mengaku. ' +
				'Bicaranya pelan, logat Sunda, sering menyebut "Yang Mulia".',
			answers: {
				where: { text: 'Di pos, Yang Mulia. Jam sepuluh lewat seperempat masjid saya kunci, kuncinya saya pegang terus.', honesty: 'lie', underminedBy: ['H1', 'udin.ngaku'] },
				saw: { text: 'Sepi, Yang Mulia. Tidak ada yang masuk lagi sampai sahur.', honesty: 'lie', underminedBy: ['H1', 'udin.ngaku', 'ida.harun'] },
				who: { text: 'Yang terakhir dekat kotak amal ya si ojol itu, sebelum jam sepuluh.', honesty: 'omits', supports: ['opportunity:dimas'] },
				sure: { text: 'Yakin, Yang Mulia.', honesty: 'lie', underminedBy: ['H1', 'udin.ngaku'] },
				contact: { text: 'Tidak ada yang menghubungi saya malam itu.', honesty: 'lie', underminedBy: ['H1', 'udin.ngaku'] },
				dimas: { text: 'Anaknya sopan, sering salat di sini kalau narik malam.', honesty: 'truth' },
				harun: {
					text: 'Pak Harun bendahara, yang pegang kunci kotak amal. Akhir-akhir ini beliau pusing, anaknya harus bayar UKT, kas masjid juga mau diaudit sebelum Lebaran.',
					honesty: 'truth',
					supports: ['motive:harun']
				}
			},
			broken: {
				key: 'udin.ngaku',
				text: 'Saya mengaku, Yang Mulia. Jam setengah sebelas Pak Harun minta kunci masjid, katanya kitabnya ketinggalan. Saya takut honor saya diputus kalau cerita.'
			},
			confront: {
				H1: {
					text: '…Iya, Yang Mulia. Pak Harun minta kunci jam setengah sebelas. Saya ambilkan di pos. Maaf, saya bohong tadi.',
					key: 'udin.ngaku',
					honesty: 'truth',
					supports: ['opportunity:harun', 'timeline:harun']
				},
				H2: {
					text: 'Dibuka pakai kunci? Ya Allah… yang pegang kunci malam itu Pak Harun. Beliau pinjam jam setengah sebelas.',
					key: 'udin.ngaku',
					honesty: 'truth',
					supports: ['opportunity:harun', 'timeline:harun']
				},
				D1: { text: 'Oh, si ojol malah masukin uang? Saya kira… ya, saya tidak lihat sendiri, Yang Mulia.', key: 'udin.ojol', honesty: 'truth' }
			}
		},
		ida: {
			persona:
				'Bu Ida, 47 tahun, berjualan gorengan di depan masjid dan beres-beres sampai sekitar 22.30. Pukul 21.40 ia melihat dari luar jendela, lampu redup, Dimas memasukkan tangan ke kotak amal, ' +
				'dan MENGIRA ia mengambil uang — kekeliruan jujur. Sekitar 22.30 ia melihat motor Pak Harun kembali ke masjid. Pak Harun yang menyuruhnya bercerita ke warga dan polisi. ' +
				'Ia ramah, cepat bicara, dan merasa bersalah bila tahu salah sangka.',
			answers: {
				where: { text: 'Jualan gorengan di depan masjid, beres-beres sampai kira-kira setengah sebelas.', honesty: 'truth' },
				saw: {
					text: 'Mas ojol jaket hijau itu masukin tangan ke kotak amal, terus buru-buru pergi.',
					honesty: 'mistake',
					supports: ['opportunity:dimas', 'identity:dimas'],
					underminedBy: ['D1', 'ida.sure', 'ida.salah'],
					reframedBy: ['D1', 'ida.sure']
				},
				who: { text: 'Mas Dimas, saya kenal, suka beli gorengan saya.', honesty: 'truth', supports: ['identity:dimas'] },
				sure: {
					text: 'Saya lihat dari luar jendela, lampunya redup. Tangannya masuk kotak, itu saja. Masukin atau ngambil, saya tidak lihat jelas.',
					honesty: 'truth'
				},
				contact: { text: 'Pak Harun yang minta saya cerita ke warga dan ke polisi. Katanya biar cepat beres.', honesty: 'truth' },
				dimas: { text: 'Anaknya baik. Tapi warga sudah terlanjur marah, kemarin hampir dipukuli.', honesty: 'truth' },
				harun: {
					text: 'Pak Harun malam itu balik lagi ke masjid, saya lihat motornya lewat waktu saya beres-beres, kira-kira setengah sebelas.',
					honesty: 'truth',
					supports: ['timeline:harun', 'opportunity:harun']
				}
			},
			confront: {
				D1: { text: 'Oh… dia masukin uang? Astagfirullah, saya salah sangka. Maaf, Mas Dimas.', key: 'ida.salah', honesty: 'truth' },
				E3: {
					text: 'Dikunci jam sepuluh lewat? Tapi Pak Harun datang lagi setengah sebelas, motornya saya lihat parkir di samping masjid.',
					key: 'ida.kunci',
					honesty: 'truth',
					supports: ['timeline:harun', 'opportunity:harun']
				}
			}
		}
	},

	contradictions: [
		{ a: 'E1', b: 'D1', text: 'Potongan 15 detik menghilangkan bagian Dimas memasukkan uang ke kotak amal.' },
		{ a: 'ida.saw', b: 'D1', text: 'Rekaman utuh menunjukkan Dimas memasukkan uang, bukan mengambil.' },
		{ a: 'ida.saw', b: 'ida.sure', text: 'Bu Ida "melihat Dimas mengambil" padahal tak melihat jelas tangannya.' },
		{ a: 'udin.saw', b: 'H1', text: 'Marbot bilang tak ada yang masuk, padahal kunci dipinjam Pak Harun pukul 22.26.' },
		{ a: 'udin.saw', b: 'ida.harun', text: 'Bu Ida melihat Pak Harun kembali ke masjid setengah sebelas.' },
		{ a: 'E3', b: 'H1', text: 'Kunci masjid tidak dipegang marbot sepanjang malam.' },
		{ a: 'E3', b: 'ida.harun', text: 'Ada yang masuk lagi setelah masjid dikunci.' },
		{ a: 'E3', b: 'ida.kunci', text: 'Ada yang masuk lagi setelah masjid dikunci.' },
		{ a: 'udin.where', b: 'udin.ngaku', text: 'Mang Udin mengaku meminjamkan kunci ke Pak Harun.' },
		{ a: 'P2', b: 'H2', text: 'Obeng plus milik Dimas tidak cocok dengan bekas congkel obeng pipih.' },
		{ a: 'E4', b: 'D2', text: '"Rezeki malam ini" adalah tip penumpang yang tercatat 22.48.' }
	],

	truth: {
		culprit: 'harun',
		summary:
			'Bendahara DKM H. Harun Rasyid sudah "meminjam" Rp 12 juta dari kas masjid sejak Februari untuk UKT anaknya, dan audit menjelang Lebaran kian dekat. ' +
			'Malam itu ia meminjam kunci masjid dari Mang Udin pukul 22.26, membuka gembok kotak amal dengan anak kunci yang ia pegang, mengambil Rp 18 juta, lalu mencongkel gembok yang sudah terbuka agar tampak dibobol. ' +
			'Pagi harinya ia ikut menyebarkan potongan CCTV dan meminta Bu Ida bercerita ke warga. Dimas hanya berinfak Rp 50.000 lalu pergi mengantar penumpang.',
		motive: 'Menutup "pinjaman" Rp 12 juta dari kas masjid sebelum audit Lebaran.',
		timeline: [
			{ time: '21:40', text: 'Dimas memasukkan Rp 50.000 ke kotak amal.' },
			{ time: '21:43', text: 'Dimas pergi; order Depok–Kebayoran 21.50–23.40.' },
			{ time: '22:15', text: 'Mang Udin mengunci masjid.' },
			{ time: '22:26', text: 'Pak Harun meminjam kunci masjid.' },
			{ time: '22:30', text: 'Pak Harun membuka kotak amal dengan kunci, lalu mencongkel gemboknya. Bu Ida melihat motornya.' },
			{ time: '22:48', text: 'Dimas menerima tip Rp 100.000 dan mengunggah status.' },
			{ time: '09:00', text: 'Pak Harun ikut menyebarkan potongan CCTV di grup warga.' }
		]
	}
};
