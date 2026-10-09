// Perkara 2: Dana Desa Sukamaju. Korupsi BLT Dana Desa menjelang Pilkades, video viral
// yang dipotong, dan ormas yang ternyata tim sukses. HANYA SERVER.

import type { CaseFile } from "../case";

export const bansos: CaseFile = {
  public: {
    id: "bansos",
    title: "Dana Desa Sukamaju",
    docket: "PERKARA 27/PID.SUS-TPK/PN.BDG · NEGARA v. RATNA WULANDARI",
    tagline:
      "Kepala desa didakwa korupsi BLT Rp 1,2 miliar, tiga bulan sebelum Pilkades.",
    setting: "Desa Sukamaju, Kabupaten Garut, Jawa Barat",
    charge:
      "Tindak pidana korupsi (Pasal 2 dan 3 UU Tipikor): menyalurkan BLT Dana Desa senilai Rp 1,2 miliar kepada 312 penerima fiktif dan mencairkannya untuk kepentingan pribadi.",
    brief:
      "Audit Inspektorat menemukan 312 nama penerima BLT yang ternyata warga sudah meninggal atau pindah. Daftarnya disahkan dengan akun Kepala Desa. " +
      "Sebuah video Kades menerima amplop dari pengusaha viral di TikTok, dan sebuah ormas melapor ke Kejaksaan. Pilkades tinggal tiga bulan lagi. " +
      "Kepala Desa Ratna Wulandari didakwa.",
    accused: "ratna",
    suspects: {
      ratna: {
        name: "Ratna Wulandari",
        short: "Bu Ratna",
        role: "Kepala Desa · terdakwa",
        bio: 'Kades petahana, dikenal tegas menolak "titipan" proyek. Mencalonkan diri lagi di Pilkades.',
      },
      agus: {
        name: "Agus Setiawan",
        short: "Agus",
        role: "Sekretaris Desa",
        bio: "Operator sistem keuangan desa dan pemegang stempel. Mendaftar sebagai calon Kades melawan Ratna.",
      },
      darmo: {
        name: "H. Darmo Sutisna",
        short: "Haji Darmo",
        role: "Pemilik CV Berkah Jaya",
        bio: "Pemasok sembako desa tanpa tender. Keponakan ketua komisi di DPRD kabupaten.",
      },
    },
    witnesses: {
      slamet: {
        name: "Pak Slamet",
        short: "Pak Slamet",
        role: "Ketua RT 03",
        bio: "Pulang ronda lewat depan kantor desa pada malam pencairan.",
      },
      yanti: {
        name: "Bu Yanti Rohayati",
        short: "Bu Yanti",
        role: "Bendahara desa",
        bio: "Ikut menandatangani cek pencairan dana BLT.",
      },
      rizal: {
        name: "Rizal Fauzi",
        short: "Rizal",
        role: 'Admin akun "Sukamaju Update"',
        bio: "Pertama kali mengunggah video amplop yang kemudian viral.",
      },
    },
    timeline: [
      {
        time: "11 Mei",
        text: "Akun Kades menginput penerima BLT tambahan malam hari.",
      },
      {
        time: "18 Mei",
        text: "Input kedua. Mobil dinas terlihat di kantor desa malam hari.",
      },
      { time: "25 Mei", text: "Input ketiga." },
      { time: "27 Mei", text: "Pencairan tunai Rp 1,2 miliar lewat enam cek." },
      {
        time: "1 Jun",
        text: 'Video "Kades terima amplop" diunggah dan viral.',
      },
      { time: "3 Jun", text: "Ormas Laskar Peduli Desa melapor ke Kejaksaan." },
      { time: "20 Jun", text: "Audit Inspektorat: 312 penerima fiktif." },
    ],
    goals: {
      defense:
        "Bangun keraguan yang wajar. Akun dan tanda tangan atas nama Bu Ratna belum tentu berarti tangan Bu Ratna. Siapa yang paling diuntungkan bila ia jatuh menjelang Pilkades?",
      prosecution:
        "Buktikan Ratna Wulandari bersalah secara sah dan meyakinkan. Akun, tanda tangan dan video ada di pihak Anda — tapi pastikan semuanya tahan uji.",
    },
  },

  evidence: [
    {
      id: "E1",
      kind: "public",
      title: "Laporan audit Inspektorat",
      text: "312 penerima BLT tidak ditemukan: KTP warga yang sudah meninggal atau pindah. Daftar disahkan dengan tanda tangan elektronik Kepala Desa.",
      supports: ["opportunity:ratna", "identity:ratna"],
      reframedBy: ["D2", "E7", "yanti.agus"],
      truth: "Disahkan dengan akun Ratna, tapi akun itu dioperasikan Agus.",
      role: "misleading",
    },
    {
      id: "E2",
      kind: "public",
      title: "Log sistem keuangan desa (Siskeudes)",
      text: 'Akun "kades.sukamaju" menginput 312 nama pada malam 11, 18 dan 25 Mei, pukul 22.00–23.30, dari jaringan kantor desa.',
      supports: ["opportunity:ratna", "timeline:ratna"],
      reframedBy: ["D1", "D2"],
      truth:
        "Input dilakukan Agus dengan password Ratna; dua malam di antaranya Ratna sedang di Jakarta.",
      role: "misleading",
    },
    {
      id: "E3",
      kind: "public",
      title: "Video TikTok viral",
      text: "Klip 15 detik dari akun anonim: Bu Kades menerima amplop tebal dari Haji Darmo di sebuah rumah. Ditonton 1,2 juta kali.",
      supports: ["motive:ratna"],
      authentic: false,
      reliability: "contradictory",
      flag: "contradictory",
      underminedBy: ["D3", "rizal.salah"],
      truth:
        "Dipotong dari video 2 menit: amplop itu uang duka untuk keluarga almarhum, diserahkan lewat Kades di rumah duka.",
      role: "misleading",
    },
    {
      id: "E4",
      kind: "public",
      title: "Slip penarikan bank",
      text: 'Enam penarikan tunai total Rp 1,2 miliar dengan cek bertanda tangan Kades dan bendahara. Catatan teller: "penarik laki-laki, berseragam PDH."',
      supports: ["opportunity:ratna", "identity:agus"],
      truth:
        "Agus yang datang ke bank. Tanda tangan Kades di cek hasil cetak pindaian.",
      role: "key",
    },
    {
      id: "E5",
      kind: "public",
      title: "Kontrak pengadaan sembako",
      text: "Kontrak dengan CV Berkah Jaya (milik Haji Darmo) Rp 800 juta, dipecah menjadi empat paket penunjukan langsung tanpa tender.",
      supports: ["motive:darmo", "opportunity:darmo"],
      truth:
        "Pemecahan paket itu memang praktik buruk, tapi harga sesuai harga pasar. Bukan sumber kerugian BLT.",
      role: "misleading",
    },
    {
      id: "E6",
      kind: "public",
      title: "Daftar calon Pilkades",
      text: "Pilkades Sukamaju tiga bulan lagi. Calon terdaftar: Ratna Wulandari (petahana) dan Agus Setiawan (Sekdes, cuti kampanye mulai Juni).",
      supports: ["motive:agus"],
      truth: "Agus butuh dana kampanye dan butuh Ratna jatuh.",
      role: "context",
    },
    {
      id: "E7",
      kind: "public",
      title: "SK pembagian tugas perangkat desa",
      text: "Sekdes Agus Setiawan ditunjuk sebagai operator Siskeudes dan pemegang stempel desa.",
      supports: ["opportunity:agus"],
      truth: "Agus memegang sistem dan stempel.",
      role: "key",
    },
    {
      id: "E8",
      kind: "public",
      title: "Keterangan awal Pak Slamet",
      text: '"Malam 18 Mei saya lihat lampu kantor desa nyala dan mobil dinas Bu Kades parkir di depan. Pasti Bu Kades lembur."',
      supports: ["identity:ratna", "timeline:ratna"],
      reliability: "unreliable",
      flag: "unreliable",
      underminedBy: ["slamet.who", "H3", "D1", "slamet.mobil"],
      truth:
        "Mobil dinas itu dipinjam Agus. Pak Slamet tidak melihat siapa pun.",
      role: "misleading",
    },
    {
      id: "E9",
      kind: "public",
      title: "Unggahan Facebook Haji Darmo",
      text: '"Alhamdulillah proyek sembako lancar, terima kasih Bu Kades dan perangkat desa Sukamaju 🙏"',
      supports: ["motive:darmo"],
      truth: "Basa-basi pengusaha. Tidak membuktikan apa-apa.",
      role: "misleading",
    },
    {
      id: "E10",
      kind: "public",
      title: "Laporan ormas ke Kejaksaan",
      text: 'Ormas "Laskar Peduli Desa" melaporkan Kades Ratna atas dugaan korupsi BLT, melampirkan video viral dan "keterangan warga".',
      supports: ["motive:ratna"],
      reliability: "contradictory",
      flag: "contradictory",
      underminedBy: ["H4", "rizal.pengirim"],
      truth: "Ketua ormas adalah koordinator tim sukses Agus.",
      role: "misleading",
    },

    {
      id: "D1",
      kind: "defense",
      title: "Bukti Rakornas APDESI di Jakarta",
      text: "Daftar hadir dan tagihan hotel: Ratna di Jakarta 17–19 Mei dan 24–26 Mei untuk rapat koordinasi asosiasi kepala desa.",
      truth:
        "Ratna tak mungkin menginput pada 18 dan 25 Mei. Pada 11 Mei ia memang di desa.",
      role: "key",
    },
    {
      id: "D2",
      kind: "defense",
      title: "Pesan WhatsApp Ratna ke Agus",
      text: 'Januari: "Gus, tolong inputkan data BLT ya, password kades masih yang lama." Dibalas: "Siap Bu."',
      supports: ["opportunity:agus"],
      truth:
        "Agus tahu password Ratna. Ini juga menunjukkan kelalaian Ratna berbagi password.",
      role: "key",
    },
    {
      id: "D3",
      kind: "defense",
      title: "Video utuh dari ponsel warga",
      text: "Rekaman 2 menit, metadata utuh: di rumah duka almarhum Pak Karta, Haji Darmo menitipkan amplop uang duka lewat Bu Kades, yang langsung menyerahkannya ke istri almarhum.",
      truth: "Konteks lengkap video viral.",
      role: "key",
    },
    {
      id: "D4",
      kind: "defense",
      title: "Foto nota percetakan",
      text: 'Foto nota tanpa cap dari pegawai percetakan: pesanan 5.000 kaos dan kalender "AGUS untuk SUKAMAJU", Rp 350 juta, lunas tunai 28 Mei.',
      supports: ["motive:agus"],
      reliability: "unreliable",
      flag: "unreliable",
      truth: "Asli. Dibayar dari uang BLT sehari setelah pencairan.",
      role: "key",
    },

    {
      id: "P1",
      kind: "prosecution",
      title: "Mutasi rekening Ratna",
      text: "Transfer masuk Rp 150 juta pada 2 Juni dari rekening Darmo Sutisna.",
      supports: ["motive:ratna"],
      truth:
        "Pembayaran jual-beli sebidang sawah milik Ratna kepada Haji Darmo. Akta jual belinya tidak ada di berkas.",
      role: "misleading",
    },
    {
      id: "P2",
      kind: "prosecution",
      title: "Keterangan tertulis bendahara",
      text: 'Bu Yanti: "Saya hanya ikut tanda tangan cek yang sudah ditandatangani Bu Kades."',
      supports: ["identity:ratna"],
      reliability: "contradictory",
      flag: "contradictory",
      underminedBy: ["H2", "yanti.contact", "yanti.ngaku"],
      truth: "Cek dibawa Agus ke rumah Yanti, tanda tangan Kades hasil cetak.",
      role: "misleading",
    },
    {
      id: "P3",
      kind: "prosecution",
      title: "CCTV toko seberang kantor desa",
      text: "18 Mei 22.40: mobil dinas Kades (pelat merah) parkir di depan kantor desa selama satu jam.",
      supports: ["timeline:ratna", "opportunity:ratna"],
      reframedBy: ["H3", "D1"],
      truth: "Mobil dinas dipakai Agus.",
      role: "misleading",
    },
    {
      id: "P4",
      kind: "prosecution",
      title: "Pembelian mobil",
      text: "Ratna membeli Pajero bekas Rp 280 juta pada pertengahan Juni.",
      supports: ["motive:ratna"],
      truth: "Dari hasil jual sawah (lihat P1). Tak ada catatan di berkas.",
      role: "misleading",
    },

    {
      id: "H1",
      kind: "hidden",
      title: "Log perangkat Siskeudes",
      text: 'Login akun "kades.sukamaju" pada ketiga malam berasal dari ponsel Android terdaftar atas nama Agus Setiawan.',
      supports: ["identity:agus", "opportunity:agus"],
      truth: "Agus yang menginput.",
      role: "key",
    },
    {
      id: "H2",
      kind: "hidden",
      title: "Uji forensik tanda tangan cek",
      text: "Tanda tangan Kades pada keenam cek adalah hasil cetak pindaian, bukan tanda tangan basah.",
      supports: ["opportunity:agus"],
      truth: "Ratna tak pernah menandatangani cek itu.",
      role: "key",
    },
    {
      id: "H3",
      kind: "hidden",
      title: "Buku pemakaian mobil dinas",
      text: '18 dan 25 Mei: mobil dinas dipinjam Sekdes Agus Setiawan "untuk urusan desa", malam hari.',
      supports: ["opportunity:agus", "timeline:agus"],
      truth: "Yang di kantor malam itu Agus.",
      role: "key",
    },
    {
      id: "H4",
      kind: "hidden",
      title: "Asal-usul video dan laporan ormas",
      text: "Ketua Laskar Peduli Desa terdaftar sebagai koordinator tim sukses Agus. Video 15 detik pertama kali dikirim dari nomor milik Agus.",
      supports: ["motive:agus", "identity:agus"],
      truth: "Agus mengatur serangan politik terhadap Ratna.",
      role: "key",
    },
    {
      id: "H5",
      kind: "hidden",
      title: "Perjanjian utang kampanye",
      text: "Agus berutang Rp 600 juta kepada seorang pemodal politik, jatuh tempo sebelum Pilkades, dijamin sertifikat rumahnya.",
      supports: ["motive:agus"],
      truth: "Motif keuangan Agus.",
      role: "key",
    },
  ],

  clarify: {
    E2: {
      reveals: "H1",
      text: "Majelis meminta log perangkat dari pengelola Siskeudes.",
    },
    E4: {
      reveals: "H2",
      text: "Majelis memerintahkan uji forensik tanda tangan pada cek.",
    },
    P2: {
      reveals: "H2",
      text: "Majelis memerintahkan uji forensik tanda tangan pada cek.",
    },
    P3: { reveals: "H3", text: "Majelis meminta buku pemakaian mobil dinas." },
    E8: {
      reveals: "H3",
      text: "Majelis menanyakan siapa yang memakai mobil dinas malam itu.",
    },
    E10: {
      reveals: "H4",
      text: "Majelis menelusuri asal video dan siapa pengurus ormas pelapor.",
    },
    E3: {
      reveals: "H4",
      text: "Majelis menelusuri siapa pengirim pertama video itu.",
    },
    E6: {
      reveals: "H5",
      text: "Majelis meminta laporan dana kampanye para calon.",
    },
  },

  witnesses: {
    slamet: {
      persona:
        "Pak Slamet, 58 tahun, Ketua RT 03, pensiunan mantri. Malam 18 Mei sekitar 22.40 ia pulang ronda lewat depan kantor desa, melihat lampu menyala dan mobil dinas pelat merah, " +
        "lalu MENGIRA itu Bu Kades — kekeliruan jujur, karena kaca mobil gelap dan ia tak melihat siapa pun. Ia menghormati Bu Ratna meski tak selalu sependapat. " +
        "Dua hari setelah video viral, Agus datang ke rumahnya dan memintanya bercerita ke wartawan. Ia orang Sunda yang sopan dan suka berbelit sedikit.",
      answers: {
        where: {
          text: "Pulang ronda dari pos kamling, lewat depan kantor desa, kira-kira jam sebelas kurang dua puluh.",
          honesty: "truth",
        },
        saw: {
          text: "Lampu kantor desa nyala, mobil dinas Bu Kades parkir di depan. Pasti Bu Kades lembur, pikir saya.",
          honesty: "mistake",
          supports: ["identity:ratna", "timeline:ratna"],
          underminedBy: ["slamet.who", "H3", "D1", "slamet.mobil"],
        },
        who: {
          text: "Orangnya mah tidak kelihatan, kaca mobilnya gelap. Saya cuma lihat mobilnya.",
          honesty: "truth",
        },
        sure: {
          text: "Kalau mobil dinas, yakin, pelatnya merah. Kalau orangnya… ya, saya kira Bu Kades saja.",
          honesty: "truth",
        },
        contact: {
          text: "Pak Sekdes Agus datang ke rumah dua hari setelah video ramai. Minta saya cerita ke wartawan apa yang saya lihat malam itu.",
          honesty: "truth",
          supports: ["motive:agus"],
        },
        ratna: {
          text: "Bu Ratna orangnya baik, tapi keras. Banyak yang tidak suka karena beliau menolak titipan proyek.",
          honesty: "truth",
        },
        agus: {
          text: "Pak Agus rajin, sering di kantor desa sampai malam. Lagi siap-siap nyalon Kades juga.",
          honesty: "truth",
          supports: ["opportunity:agus"],
        },
        darmo: {
          text: "Haji Darmo pengusaha besar, pamannya pejabat di DPRD. Semua orang segan sama beliau.",
          honesty: "truth",
        },
      },
      confront: {
        H3: {
          text: "Mobilnya dipinjam Pak Agus? Wah… berarti yang di kantor malam itu bisa saja Pak Agus.",
          key: "slamet.mobil",
          honesty: "truth",
          supports: ["opportunity:agus", "identity:agus"],
        },
        D1: {
          text: "Bu Kades di Jakarta tanggal 18? Lha… terus siapa atuh yang di kantor?",
          key: "slamet.ragu",
          honesty: "truth",
        },
        P3: {
          text: "Iya, itu mobilnya. Persis yang saya lihat.",
          key: "slamet.cctv",
          honesty: "truth",
        },
      },
    },
    yanti: {
      persona:
        'Bu Yanti Rohayati, 41 tahun, bendahara desa. Pada 26 Mei malam Agus membawa enam cek ke rumahnya yang sudah "ditandatangani Bu Kades" dan bilang Bu Kades setuju lewat telepon. ' +
        "Yanti ikut menandatangani. Ia BERBOHONG bahwa Bu Kades sendiri yang menyerahkan cek, karena Agus mengancam membongkar pinjaman Rp 20 juta yang pernah ia ambil dari kas desa. " +
        "Kalau ditanya langsung siapa yang menghubunginya, ia mengaku Agus yang membawa cek. Kalau dikonfrontasi dengan slip bank atau uji tanda tangan, ia runtuh dan mengaku semuanya.",
      answers: {
        where: {
          text: "Di rumah, Yang Mulia. Cek itu Bu Kades sendiri yang kasih ke saya, sudah ditandatangani.",
          honesty: "lie",
          underminedBy: ["yanti.contact", "yanti.ngaku", "H2"],
        },
        saw: {
          text: "Bu Kades yang menyuruh mencairkan. Saya cuma ikut perintah.",
          honesty: "lie",
          underminedBy: ["yanti.contact", "yanti.ngaku"],
        },
        who: {
          text: "Ya Bu Kades.",
          honesty: "lie",
          underminedBy: ["yanti.ngaku"],
        },
        sure: {
          text: "Ya… yakin, Yang Mulia.",
          honesty: "lie",
          underminedBy: ["yanti.contact", "yanti.ngaku", "H2"],
        },
        contact: {
          text: "Pak Agus yang mengantar cek ke rumah saya malam-malam. Katanya Bu Kades sudah setuju lewat telepon.",
          honesty: "truth",
          supports: ["opportunity:agus", "identity:agus"],
        },
        ratna: {
          text: "Bu Kades jarang pegang keuangan langsung. Semuanya lewat Pak Sekdes.",
          honesty: "truth",
          supports: ["opportunity:agus"],
        },
        agus: {
          text: "Pak Agus pegang stempel dan semua urusan Siskeudes. Password Bu Kades juga beliau yang pegang.",
          honesty: "truth",
          supports: ["opportunity:agus"],
        },
        darmo: {
          text: "Pembayaran ke CV Berkah Jaya sesuai harga pasar, notanya lengkap. Saya cek sendiri.",
          honesty: "truth",
        },
      },
      broken: {
        key: "yanti.ngaku",
        text: "Sudah saya akui, Yang Mulia. Pak Agus yang bawa ceknya, dan Pak Agus yang ke bank. Saya takut diancam.",
      },
      confront: {
        H2: {
          text: "…Tanda tangannya cetakan? Ya Allah. Saya tidak pernah lihat Bu Kades tanda tangan. Pak Agus yang bawa ceknya ke rumah. Saya diancam, Yang Mulia.",
          key: "yanti.ngaku",
          honesty: "truth",
          supports: ["opportunity:agus", "identity:agus"],
        },
        E4: {
          text: "Laki-laki berseragam… iya, yang ke bank Pak Agus, pakai PDH. Saya cuma tanda tangan di rumah. Maaf, saya bohong tadi.",
          key: "yanti.ngaku",
          honesty: "truth",
          supports: ["opportunity:agus", "identity:agus"],
        },
        D2: {
          text: "Semua orang di kantor tahu password Bu Kades dipegang Pak Agus.",
          key: "yanti.password",
          honesty: "truth",
          supports: ["opportunity:agus"],
        },
        E7: {
          text: "Betul, stempel di laci Pak Agus. Kunci lacinya cuma beliau yang pegang.",
          key: "yanti.stempel",
          honesty: "truth",
          supports: ["opportunity:agus"],
        },
      },
    },
    rizal: {
      persona:
        'Rizal Fauzi, 23 tahun, admin akun gosip desa "Sukamaju Update" di TikTok dan Instagram. Pada 1 Juni nomor tak dikenal mengiriminya klip 15 detik, ' +
        "dan ia langsung mengunggahnya tanpa memeriksa — KEKELIRUAN karena mengejar viral. Foto profil pengirim memakai kaos kampanye biru. " +
        'Setelah viral ada yang mentransfer Rp 5 juta "uang bensin dari teman-teman relawan". Ia gaul, defensif, tapi tidak jahat.',
      answers: {
        where: {
          text: "Lagi nongkrong di warkop, tiba-tiba ada yang kirim video lewat WA.",
          honesty: "truth",
        },
        saw: {
          text: "Videonya jelas, Bu Kades terima amplop tebal dari Haji Darmo. Saya posting, langsung meledak.",
          honesty: "mistake",
          supports: ["motive:ratna"],
          underminedBy: ["D3", "rizal.sure", "rizal.salah"],
        },
        who: {
          text: "Pengirimnya nomor tidak dikenal. Foto profilnya pakai kaos kampanye biru.",
          honesty: "truth",
        },
        sure: {
          text: "Durasinya cuma lima belas detik… jujur saya tidak cek video aslinya. Yang penting naik dulu.",
          honesty: "truth",
        },
        contact: {
          text: 'Habis viral, ada yang transfer lima juta. Katanya "uang bensin dari teman-teman relawan".',
          honesty: "truth",
          supports: ["motive:agus"],
        },
        ratna: {
          text: "Bu Kades? Netizen sih sudah vonis duluan. Saya mah cuma posting.",
          honesty: "truth",
        },
        agus: {
          text: "Pak Agus sering endorse akun saya waktu ada acara desa. Kaos kampanyenya biru, sih.",
          honesty: "truth",
          supports: ["identity:agus"],
        },
        darmo: {
          text: "Haji Darmo jarang muncul di medsos, kecuali pamer proyek.",
          honesty: "truth",
        },
      },
      confront: {
        D3: {
          text: "Itu… uang duka? Astaga. Saya potong di luar konteks. Saya siap klarifikasi.",
          key: "rizal.salah",
          honesty: "truth",
        },
        H4: {
          text: "Nomor itu nomornya Pak Agus? Pantas profilnya kaos kampanye. Jadi saya dipakai.",
          key: "rizal.pengirim",
          honesty: "truth",
          supports: ["motive:agus", "identity:agus"],
        },
        E10: {
          text: "Ormas itu? Mereka yang pertama ramai-ramai bagikan postingan saya, sebelum orang lain.",
          key: "rizal.ormas",
          honesty: "truth",
        },
      },
    },
  },

  contradictions: [
    {
      a: "slamet.saw",
      b: "slamet.who",
      text: 'Pak Slamet "melihat Bu Kades" padahal hanya melihat mobil berkaca gelap.',
    },
    {
      a: "slamet.saw",
      b: "H3",
      text: "Mobil dinas malam itu dipinjam Agus, bukan dipakai Bu Kades.",
    },
    {
      a: "slamet.saw",
      b: "D1",
      text: "Bu Kades di Jakarta pada malam 18 Mei.",
    },
    {
      a: "E8",
      b: "D1",
      text: "Keterangan awal menaruh Bu Kades di kantor saat ia di Jakarta.",
    },
    {
      a: "E8",
      b: "H3",
      text: "Mobil dinas yang terlihat sedang dipinjam Agus.",
    },
    {
      a: "E2",
      b: "D1",
      text: "Akun Kades menginput dari kantor desa saat Kades di Jakarta.",
    },
    { a: "E2", b: "H1", text: "Akun Kades dipakai dari ponsel milik Agus." },
    {
      a: "P3",
      b: "D1",
      text: "CCTV menunjukkan mobil dinas di kantor saat Kades di Jakarta.",
    },
    {
      a: "yanti.where",
      b: "yanti.contact",
      text: "Bu Yanti bilang cek dari Bu Kades, lalu bilang Agus yang mengantar.",
    },
    {
      a: "yanti.saw",
      b: "yanti.contact",
      text: 'Bu Yanti "diperintah Bu Kades", padahal yang datang Agus.',
    },
    {
      a: "yanti.where",
      b: "yanti.ngaku",
      text: "Bu Yanti mengaku cek dibawa Agus.",
    },
    {
      a: "yanti.sure",
      b: "yanti.ngaku",
      text: 'Bu Yanti "yakin" — lalu mengaku berbohong.',
    },
    {
      a: "P2",
      b: "H2",
      text: "Bendahara bilang Kades sudah tanda tangan; forensik bilang tanda tangannya cetakan.",
    },
    {
      a: "P2",
      b: "yanti.contact",
      text: "Keterangan tertulis bendahara bertentangan dengan pengakuannya di sidang.",
    },
    { a: "E3", b: "D3", text: "Video 15 detik memotong konteks uang duka." },
    {
      a: "rizal.saw",
      b: "D3",
      text: '"Amplop suap" itu uang duka untuk keluarga almarhum.',
    },
    {
      a: "rizal.saw",
      b: "rizal.sure",
      text: "Rizal menyimpulkan suap dari klip yang tak pernah ia periksa.",
    },
    {
      a: "E10",
      b: "H4",
      text: "Ormas pelapor dipimpin tim sukses lawan politik terdakwa.",
    },
  ],

  truth: {
    culprit: "agus",
    motive:
      "Kursi Kepala Desa dan utang kampanye Rp 600 juta ke pemodal politik yang jatuh tempo sebelum Pilkades.",
    summary:
      "Sekdes Agus Setiawan menggelapkan dana BLT. Sebagai operator Siskeudes ia tahu password Bu Ratna, lalu pada tiga malam menginput 312 penerima fiktif dari KTP warga yang " +
      "sudah meninggal atau pindah — dua di antaranya saat Bu Ratna di Jakarta, dengan mobil dinas yang ia pinjam. Ia mencetak tanda tangan Kades dari pindaian ke enam cek, " +
      'membawanya ke rumah bendahara yang ia ancam, lalu mencairkannya sendiri berseragam PDH. Uangnya untuk kaos, kalender dan "serangan fajar". Ia lalu memotong video uang duka ' +
      'jadi "amplop suap", mengirimnya ke admin akun gosip, dan menggerakkan ormas tim suksesnya melapor. Haji Darmo memang memecah paket tanpa tender, tapi tidak mengambil uang BLT.',
    timeline: [
      {
        time: "Jan",
        text: "Bu Ratna meminta Agus menginput data BLT dengan password Kades.",
      },
      {
        time: "11 Mei",
        text: "Agus menginput gelombang pertama nama fiktif dari ponselnya.",
      },
      {
        time: "17 Mei",
        text: "Bu Ratna berangkat ke Rakornas APDESI di Jakarta.",
      },
      {
        time: "18 Mei",
        text: "Agus meminjam mobil dinas, menginput gelombang kedua. Pak Slamet melihat mobilnya.",
      },
      {
        time: "25 Mei",
        text: "Saat Bu Ratna kembali ke Jakarta, Agus menginput gelombang ketiga.",
      },
      {
        time: "26 Mei",
        text: "Agus membawa cek bertanda tangan cetakan ke rumah Bu Yanti.",
      },
      {
        time: "27 Mei",
        text: "Agus mencairkan Rp 1,2 miliar di bank, berseragam PDH.",
      },
      {
        time: "28 Mei",
        text: "Agus melunasi pesanan kaos dan kalender kampanye Rp 350 juta.",
      },
      {
        time: "1 Jun",
        text: 'Agus mengirim klip 15 detik ke admin "Sukamaju Update".',
      },
      { time: "3 Jun", text: "Ormas tim sukses Agus melapor ke Kejaksaan." },
    ],
  },
};
