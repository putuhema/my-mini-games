// Perkara 3: Ijazah Wakil Gubernur Nusatama.
// Wakil Gubernur diduga menggunakan ijazah SMA palsu untuk memenuhi syarat pencalonan,
// sementara lawan politiknya diduga merekayasa skandal tersebut untuk menjatuhkannya.
// HANYA SERVER.

import type { CaseFile } from "../case";

export const ijazahWagub: CaseFile = {
  public: {
    id: "ijazah-wagub",
    title: "Ijazah di Balik Kursi Kekuasaan",
    docket: "PERKARA 31/PID.B/2026/PN.NST · NEGARA v. ARYA WIRATAMA",
    tagline:
      "Wakil Gubernur didakwa menggunakan ijazah SMA palsu untuk memenangkan pemilihan.",
    setting: "Kota Nusatama, Provinsi Nusatama",
    charge:
      "Pemalsuan dan penggunaan surat palsu: terdakwa diduga menggunakan ijazah SMA yang tidak pernah diterbitkan secara sah untuk memenuhi persyaratan pencalonan Wakil Gubernur.",
    brief:
      "Tiga bulan setelah dilantik sebagai Wakil Gubernur Nusatama, sebuah akun anonim mengunggah dokumen yang menyatakan bahwa ijazah SMA Arya Wiratama palsu. " +
      "Nomor ijazah tersebut tidak ditemukan dalam buku register sekolah, sementara seorang mantan kepala sekolah menyatakan tanda tangannya pada ijazah berbeda dari tanda tangan aslinya. " +
      "Arya mengaku memang bersekolah di sana dan yakin dirinya lulus, tetapi ia menyerahkan seluruh urusan dokumen pencalonan kepada tim politiknya. " +
      "Penyidik kemudian menemukan bahwa seseorang dari tim kampanye memiliki akses ke dokumen pendidikan Arya.",
    accused: "arya",

    suspects: {
      arya: {
        name: "Arya Wiratama",
        short: "Pak Arya",
        role: "Wakil Gubernur · terdakwa",
        bio: "Mantan anggota DPRD yang baru terpilih sebagai Wakil Gubernur Nusatama. Mengaku lulus SMA pada 2002.",
      },

      nanda: {
        name: "Nanda Prasetyo",
        short: "Nanda",
        role: "Ketua Tim Administrasi Kampanye",
        bio: "Orang yang mengurus hampir seluruh dokumen pencalonan Arya dan memiliki akses ke scan ijazahnya.",
      },

      rafi: {
        name: "Rafi Mahendra",
        short: "Rafi",
        role: "Mantan lawan politik Arya",
        bio: "Calon Wakil Gubernur dari kubu oposisi yang kalah tipis dalam pemilihan.",
      },
    },

    witnesses: {
      hendra: {
        name: "Hendra Wijaya",
        short: "Pak Hendra",
        role: "Mantan guru SMA Negeri 4 Nusatama",
        bio: "Guru yang mengajar Arya pada tahun terakhir sekolah dan yakin Arya pernah mengikuti ujian akhir.",
      },

      maya: {
        name: "Maya Sari",
        short: "Bu Maya",
        role: "Staf administrasi kampanye",
        bio: "Mantan staf yang mengumpulkan dokumen pendidikan seluruh kandidat dari tim kampanye.",
      },

      agus: {
        name: "Agus Rahman",
        short: "Pak Agus",
        role: "Mantan kepala SMA Negeri 4 Nusatama",
        bio: "Kepala sekolah pada periode ketika Arya mengaku lulus.",
      },
    },

    timeline: [
      {
        time: "1999",
        text: "Arya mulai bersekolah di SMA Negeri 4 Nusatama.",
      },
      {
        time: "2002",
        text: "Arya mengaku lulus SMA dan menerima ijazah.",
      },
      {
        time: "2024-02-04",
        text: "Arya menyerahkan dokumen pendidikan kepada tim pencalonan.",
      },
      {
        time: "2024-02-06",
        text: "Tim administrasi kampanye mengirim berkas pendidikan kepada penyelenggara pemilu.",
      },
      {
        time: "2024-11-27",
        text: "Arya terpilih sebagai Wakil Gubernur Nusatama.",
      },
      {
        time: "2025-03-12",
        text: "Akun anonim mengunggah tuduhan bahwa ijazah Arya palsu.",
      },
      {
        time: "2025-03-15",
        text: "Sekolah menyatakan nomor ijazah Arya tidak ditemukan dalam register lama.",
      },
      {
        time: "2025-04-02",
        text: "Penyidik menyita komputer milik tim administrasi kampanye.",
      },
      {
        time: "2025-06-18",
        text: "Arya ditetapkan sebagai tersangka.",
      },
    ],

    goals: {
      defense:
        "Bangun keraguan yang wajar bahwa Arya mengetahui adanya pemalsuan. Buktikan bahwa ia memang pernah bersekolah, menyerahkan dokumen kepada tim, dan bahwa orang lain memiliki akses serta kesempatan untuk mengubah dokumen tersebut.",

      prosecution:
        "Buktikan bahwa ijazah yang digunakan memang palsu dan Arya mengetahui atau sengaja menggunakan dokumen tersebut untuk memenuhi syarat pencalonan. Jangan hanya membuktikan bahwa nomor ijazah bermasalah.",
    },
  },

  evidence: [
    {
      id: "E1",
      kind: "public",
      title: "Salinan Ijazah Arya",
      text: "Ijazah SMA atas nama Arya Wiratama, tahun kelulusan 2002, nomor 04-2002-1187, dengan tanda tangan kepala sekolah Agus Rahman.",
      supports: ["identity:arya", "timeline:arya"],
      truth:
        "Dokumen inilah yang digunakan dalam berkas pencalonan, tetapi nomor dan tanda tangannya bermasalah.",
      role: "misleading",
    },

    {
      id: "E2",
      kind: "public",
      title: "Buku Register Kelulusan",
      text: "Nomor ijazah 04-2002-1187 tidak ditemukan dalam buku register kelulusan SMA Negeri 4 Nusatama tahun 2002.",
      supports: ["identity:arya"],
      truth:
        "Nomor tersebut memang tidak pernah tercatat dalam register resmi sekolah.",
      role: "key",
    },

    {
      id: "E3",
      kind: "public",
      title: "Foto Perpisahan Sekolah",
      text: "Foto acara perpisahan tahun 2002 menunjukkan Arya berdiri bersama siswa kelas XII SMA Negeri 4 Nusatama.",
      supports: ["identity:arya"],
      truth:
        "Arya memang bersekolah di sana dan mengikuti kegiatan perpisahan, tetapi foto tidak membuktikan bahwa ia lulus.",
      role: "misleading",
    },

    {
      id: "E4",
      kind: "public",
      title: "Pernyataan Mantan Kepala Sekolah",
      text: "Agus Rahman mengatakan tanda tangan pada ijazah Arya berbeda dari tanda tangannya pada dokumen sekolah lain yang dibuat pada tahun 2002.",
      supports: ["identity:arya"],
      truth:
        "Tanda tangan pada ijazah kemungkinan besar bukan tanda tangan asli Agus.",
      role: "key",
    },

    {
      id: "E5",
      kind: "public",
      title: "Keterangan Awal Bu Maya",
      text: 'Bu Maya mengatakan: "Pak Arya sendiri yang menyerahkan scan ijazah itu kepada saya dan mengatakan dokumennya sudah lengkap."',
      supports: ["identity:arya", "opportunity:arya"],
      reliability: "unreliable",
      flag: "unreliable",
      underminedBy: ["maya.ngaku", "D2"],
      truth:
        "Arya memang menyerahkan dokumen, tetapi dokumen itu sebelumnya diberikan kepadanya oleh Nanda.",
      role: "misleading",
    },

    {
      id: "E6",
      kind: "public",
      title: "Daftar Persyaratan Pencalonan",
      text: "Calon Wakil Gubernur wajib menyerahkan bukti pendidikan minimal SMA atau sederajat.",
      supports: ["motive:arya"],
      truth:
        "Persyaratan ini membuat keaslian ijazah menjadi penting bagi pencalonan Arya.",
      role: "context",
    },

    {
      id: "E7",
      kind: "public",
      title: "Hasil Verifikasi Administratif",
      text: "Dokumen pendidikan Arya dinyatakan lengkap oleh tim verifikasi tanpa pemeriksaan langsung ke sekolah.",
      supports: ["opportunity:nanda"],
      truth:
        "Verifikasi hanya memeriksa kelengkapan dokumen, bukan keaslian fisik ijazah.",
      role: "context",
    },

    {
      id: "E8",
      kind: "public",
      title: "Pesan Politik Rafi",
      text: 'Pesan Rafi beberapa minggu setelah pemilu: "Kalau kita bisa buktikan ijazahnya bermasalah, kursi mereka bisa jatuh."',
      supports: ["motive:rafi"],
      truth:
        "Rafi memang mempunyai kepentingan politik untuk menjatuhkan Arya.",
      role: "misleading",
    },

    {
      id: "E9",
      kind: "public",
      title: "Pengumuman Alumni",
      text: "Nama Arya tercantum dalam daftar alumni reuni angkatan 2002 SMA Negeri 4 Nusatama.",
      supports: ["identity:arya"],
      truth:
        "Arya memang dianggap sebagai bagian dari angkatan tersebut, tetapi daftar alumni bukan bukti resmi kelulusan.",
      role: "misleading",
    },

    {
      id: "E10",
      kind: "public",
      title: "Laporan Akun Anonim",
      text: 'Akun "SuaraNusatama" mengunggah foto ijazah Arya dengan caption: "Wakil Gubernur kita ternyata tidak pernah lulus SMA."',
      supports: ["motive:rafi"],
      reliability: "contradictory",
      flag: "contradictory",
      underminedBy: ["H4", "agus.pengirim"],
      truth:
        "Akun tersebut dibuat menggunakan nomor telepon yang terhubung dengan relawan politik Rafi.",
      role: "misleading",
    },

    // ───────── Defense ─────────

    {
      id: "D1",
      kind: "defense",
      title: "Raport Kelas XII",
      text: "Arsip sekolah menunjukkan Arya memiliki raport semester akhir dan nilai ujian sekolah pada tahun 2002.",
      supports: ["identity:arya"],
      truth:
        "Arya memang mengikuti pendidikan sampai akhir, tetapi raport tidak otomatis membuktikan ijazah diterbitkan.",
      role: "key",
    },

    {
      id: "D2",
      kind: "defense",
      title: "Riwayat Penyerahan Dokumen",
      text: "Catatan administrasi menunjukkan Nanda menerima dokumen pendidikan dari Arya sebelum mengirimkannya kepada tim verifikasi.",
      supports: ["opportunity:nanda"],
      truth:
        "Nanda adalah orang yang terakhir memegang dokumen sebelum diserahkan ke penyelenggara pemilu.",
      role: "key",
    },

    {
      id: "D3",
      kind: "defense",
      title: "Bukti Keberadaan Arya di Sekolah",
      text: "Buku pembayaran sekolah, kartu pelajar, raport, dan daftar kegiatan menunjukkan Arya benar-benar menjadi siswa SMA Negeri 4 Nusatama.",
      supports: ["identity:arya"],
      truth:
        "Arya bukan orang yang tiba-tiba mengaku pernah sekolah di sana. Ia memang siswa sekolah tersebut.",
      role: "context",
    },

    {
      id: "D4",
      kind: "defense",
      title: "Surat Keterangan Arsip Rusak",
      text: "Sekolah pernah mengalami kebocoran gudang arsip pada 2011 yang menyebabkan sebagian dokumen lama rusak.",
      truth:
        "Sebagian arsip memang rusak, tetapi buku register utama tidak termasuk arsip yang hilang.",
      role: "misleading",
    },

    // ───────── Prosecution ─────────

    {
      id: "P1",
      kind: "prosecution",
      title: "Perbedaan Format Ijazah",
      text: "Nomor ijazah Arya menggunakan format yang tidak sesuai dengan nomor ijazah siswa lain yang lulus pada tahun 2002.",
      supports: ["identity:arya"],
      truth:
        "Nomor pada dokumen Arya memang tidak sesuai dengan pola resmi sekolah.",
      role: "key",
    },

    {
      id: "P2",
      kind: "prosecution",
      title: "File Digital Ijazah",
      text: "File scan ijazah yang diserahkan kepada penyelenggara dibuat dan terakhir diedit pada komputer milik tim administrasi kampanye.",
      supports: ["opportunity:nanda"],
      truth: "File tersebut memang diproses di komputer Nanda.",
      role: "misleading",
    },

    {
      id: "P3",
      kind: "prosecution",
      title: "Pesan Arya kepada Nanda",
      text: 'Pesan Arya: "Pastikan berkas pendidikan saya aman. Jangan sampai ada masalah soal syarat."',
      supports: ["motive:arya"],
      truth:
        "Pesan itu dikirim sebelum verifikasi dan tidak menyebut pemalsuan atau pembuatan dokumen.",
      role: "misleading",
    },

    {
      id: "P4",
      kind: "prosecution",
      title: "Draft Surat Klarifikasi",
      text: 'Di komputer Nanda ditemukan draft: "Jika ditanya sekolah, katakan arsip lama sudah tidak lengkap."',
      supports: ["opportunity:nanda"],
      truth:
        "Draft tersebut dibuat Nanda sendiri sebelum kasus menjadi publik.",
      role: "key",
    },

    // ───────── Hidden ─────────

    {
      id: "H1",
      kind: "hidden",
      title: "Riwayat Edit Dokumen",
      text: 'File "ijazah_arya_final.pdf" dibuat dari template kosong. Metadata menunjukkan beberapa elemen teks seperti nomor ijazah dan tanggal kelulusan ditambahkan setelah file asli dipindai.',
      supports: ["identity:nanda"],
      truth:
        "Nanda mengedit file tersebut sebelum mengirimkannya ke penyelenggara pemilu.",
      role: "key",
    },

    {
      id: "H2",
      kind: "hidden",
      title: "Email ke Percetakan",
      text: 'Email Nanda kepada percetakan: "Tolong cetak ulang seperti contoh ini. Tanda tangan kepala sekolah harus dibuat semirip mungkin."',
      supports: ["identity:nanda"],
      truth: "Nanda meminta pembuatan ulang dokumen fisik.",
      role: "key",
    },

    {
      id: "H3",
      kind: "hidden",
      title: "Versi Dokumen Lama",
      text: "Di laptop Nanda ditemukan scan dokumen pendidikan Arya yang hanya berupa surat keterangan pernah bersekolah, bukan ijazah.",
      supports: ["identity:nanda", "opportunity:nanda"],
      truth:
        "Dokumen asli yang diberikan Arya kepada tim tidak pernah berupa ijazah dengan nomor 04-2002-1187.",
      role: "key",
    },

    {
      id: "H4",
      kind: "hidden",
      title: "Asal Akun Anonim",
      text: 'Nomor telepon yang digunakan akun "SuaraNusatama" pernah terdaftar pada ponsel milik relawan kampanye Rafi.',
      supports: ["identity:rafi", "motive:rafi"],
      truth:
        "Rafi memang memiliki hubungan dengan kampanye yang menyebarkan tuduhan tersebut.",
      role: "key",
    },

    {
      id: "H5",
      kind: "hidden",
      title: "Pesan Nanda",
      text: 'Pesan Nanda kepada seseorang di percetakan: "Yang penting Pak Arya tidak perlu tahu prosesnya. Saya yang urus."',
      supports: ["identity:nanda"],
      truth:
        "Nanda secara eksplisit bermaksud menyembunyikan proses pembuatan dokumen dari Arya.",
      role: "key",
    },
  ],

  clarify: {
    E1: {
      reveals: "H1",
      text: "Majelis meminta pemeriksaan forensik terhadap file asli yang digunakan dalam pencalonan.",
    },

    E5: {
      reveals: "H3",
      text: "Majelis meminta seluruh dokumen pendidikan yang pertama kali diterima tim kampanye dari Arya.",
    },

    P2: {
      reveals: "H1",
      text: "Majelis meminta riwayat perubahan file dari komputer tim administrasi.",
    },

    P4: {
      reveals: "H2",
      text: "Majelis meminta penyidik menelusuri percetakan yang membuat dokumen tersebut.",
    },

    E10: {
      reveals: "H4",
      text: "Majelis meminta penelusuran terhadap nomor telepon dan perangkat yang digunakan akun anonim.",
    },

    E2: {
      reveals: "H3",
      text: "Majelis meminta dokumen pendidikan paling awal yang diserahkan Arya kepada tim kampanye.",
    },
  },

  witnesses: {
    hendra: {
      persona:
        "Pak Hendra, 64 tahun, mantan guru SMA Negeri 4 Nusatama. Ia benar-benar mengajar Arya dan ingat Arya mengikuti ujian akhir. Ia MENGIRA Arya lulus karena mengingatnya ikut acara perpisahan, tetapi ia tidak pernah melihat ijazah Arya. Ia sopan dan sangat yakin dengan kenangan lamanya.",
      answers: {
        where: {
          text: "Saya mengajar di SMA Negeri 4 Nusatama dari 1997 sampai 2008.",
          honesty: "truth",
        },

        saw: {
          text: "Saya ingat Arya ikut ujian akhir dan hadir di acara perpisahan. Saya kira setelah itu dia menerima ijazah.",
          honesty: "mistake",
          supports: ["identity:arya"],
          underminedBy: ["hendra.who", "H3"],
        },

        who: {
          text: "Saya tidak pernah melihat sendiri dokumen ijazahnya. Saya hanya tahu dia ikut ujian dan perpisahan.",
          honesty: "truth",
        },

        sure: {
          text: "Kalau ditanya apakah saya melihat ijazahnya, tidak. Kalau apakah dia siswa kami, saya sangat yakin.",
          honesty: "truth",
        },

        contact: {
          text: "Saya sudah lama tidak berhubungan dengan Pak Arya.",
          honesty: "truth",
        },

        arya: {
          text: "Dia memang siswa saya. Saya ingat orangnya.",
          honesty: "truth",
        },

        nanda: {
          text: "Saya tidak mengenal Nanda dan tidak tahu siapa yang mengurus dokumen politiknya.",
          honesty: "truth",
        },

        rafi: {
          text: "Saya hanya tahu Rafi sebagai politikus yang sering berdebat dengan Arya.",
          honesty: "truth",
        },
      },

      confront: {
        H3: {
          text: "Kalau dokumen yang asli hanya surat keterangan sekolah, berarti saya terlalu cepat menyimpulkan bahwa Arya menerima ijazah.",
          key: "hendra.ragu",
          honesty: "truth",
        },
      },
    },

    maya: {
      persona:
        "Bu Maya, 32 tahun, mantan staf administrasi kampanye. Ia awalnya BERBOHONG bahwa Arya menyerahkan langsung ijazah kepada dirinya karena takut mengakui bahwa Nanda mengubah dokumen. Ia sebenarnya melihat Nanda memproses dokumen dan mengetahui bahwa berkas awal Arya bukan ijazah.",
      answers: {
        where: {
          text: "Saya menerima dokumen dari Pak Arya sendiri.",
          honesty: "lie",
          underminedBy: ["maya.ngaku", "D2"],
        },

        saw: {
          text: "Saya tidak pernah melihat Nanda mengedit dokumen pendidikan Pak Arya.",
          honesty: "lie",
          underminedBy: ["maya.ngaku", "H1"],
        },

        who: {
          text: "Pak Arya yang menyerahkan ijazah itu kepada kami.",
          honesty: "lie",
          underminedBy: ["maya.ngaku", "H3"],
        },

        sure: {
          text: "Saya yakin dokumen itu sudah ada sebelum masuk ke kantor kampanye.",
          honesty: "lie",
        },

        contact: {
          text: "Nanda adalah orang yang paling sering menangani dokumen pencalonan.",
          honesty: "truth",
          supports: ["opportunity:nanda"],
        },

        arya: {
          text: "Pak Arya menyerahkan beberapa dokumen pendidikan kepada tim.",
          honesty: "truth",
        },

        nanda: {
          text: "Nanda yang memegang komputer administrasi dan mengurus file pencalonan.",
          honesty: "truth",
          supports: ["opportunity:nanda"],
        },

        rafi: {
          text: "Saya tidak pernah bekerja dengan Rafi.",
          honesty: "truth",
        },
      },

      broken: {
        key: "maya.ngaku",
        text: "Sudah saya akui, Yang Mulia. Pak Arya menyerahkan surat keterangan sekolah, bukan ijazah seperti yang akhirnya masuk ke berkas. Nanda yang mengatakan akan mengurus sisanya.",
      },

      confront: {
        H1: {
          text: "...Saya bohong tadi. Saya memang melihat Nanda membuka file pendidikan Pak Arya dan mengubah nomor serta format dokumen.",
          key: "maya.ngaku",
          honesty: "truth",
          supports: ["identity:nanda"],
        },

        H3: {
          text: "Benar. Dokumen awal yang saya terima dari Pak Arya bukan ijazah. Itu surat keterangan dari sekolah.",
          key: "maya.dokumen",
          honesty: "truth",
          supports: ["identity:nanda"],
        },

        D2: {
          text: "Nanda adalah orang terakhir yang memegang dokumen sebelum dikirim ke penyelenggara.",
          key: "maya.nanda",
          honesty: "truth",
          supports: ["opportunity:nanda"],
        },
      },
    },

    agus: {
      persona:
        "Pak Agus Rahman, 59 tahun, mantan kepala SMA Negeri 4 Nusatama. Ia mengenal Arya dan mengingatnya sebagai siswa. Ia JUJUR mengenai tidak adanya nomor ijazah tersebut, tetapi tidak tahu siapa yang membuat dokumen palsu.",
      answers: {
        where: {
          text: "Saya menjabat kepala sekolah SMA Negeri 4 Nusatama pada 1998 sampai 2005.",
          honesty: "truth",
        },

        saw: {
          text: "Saya tidak pernah melihat ijazah yang sekarang beredar sebelum kasus ini muncul.",
          honesty: "truth",
        },

        who: {
          text: "Nomor 04-2002-1187 tidak pernah saya keluarkan.",
          honesty: "truth",
          supports: ["identity:arya"],
        },

        sure: {
          text: "Saya yakin nomor itu bukan nomor yang kami gunakan pada tahun 2002.",
          honesty: "truth",
        },

        contact: {
          text: "Tidak ada pihak dari tim kampanye yang pernah meminta saya mengonfirmasi ijazah tersebut sebelum pencalonan.",
          honesty: "truth",
        },

        arya: {
          text: "Arya memang pernah menjadi siswa di sekolah kami.",
          honesty: "truth",
        },

        nanda: {
          text: "Saya tidak mengenal Nanda secara pribadi.",
          honesty: "truth",
        },

        rafi: {
          text: "Saya tidak mengenal Rafi sebagai alumni atau staf sekolah.",
          honesty: "truth",
        },
      },

      confront: {
        E4: {
          text: "Tanda tangan itu bukan tanda tangan saya. Kalau saya menandatangani ijazah pada tahun 2002, bentuknya tidak seperti itu.",
          key: "agus.tanda",
          honesty: "truth",
        },
      },
    },
  },

  contradictions: [
    {
      a: "hendra.saw",
      b: "hendra.who",
      text: "Pak Hendra mengira Arya menerima ijazah, tetapi mengaku tidak pernah melihat ijazah tersebut.",
    },

    {
      a: "E2",
      b: "E3",
      text: "Arya memang terlihat sebagai siswa kelas XII, tetapi nomor ijazahnya tidak tercatat dalam register kelulusan.",
    },

    {
      a: "E5",
      b: "H3",
      text: "Bu Maya awalnya mengatakan Arya menyerahkan ijazah, tetapi dokumen awal yang diterima tim ternyata hanya surat keterangan sekolah.",
    },

    {
      a: "P2",
      b: "H1",
      text: "File yang digunakan dalam pencalonan ternyata mengalami perubahan pada komputer milik Nanda.",
    },

    {
      a: "P3",
      b: "H5",
      text: "Pesan Arya meminta dokumen aman, tetapi tidak menunjukkan bahwa ia mengetahui adanya pemalsuan.",
    },

    {
      a: "E10",
      b: "H4",
      text: "Akun yang menyebarkan tuduhan memiliki hubungan dengan kubu politik Rafi.",
    },

    {
      a: "E4",
      b: "H2",
      text: "Tanda tangan kepala sekolah pada dokumen palsu berbeda dari tanda tangan asli dan dokumen tersebut dipesan melalui Nanda.",
    },
  ],

  truth: {
    culprit: "nanda",

    motive:
      "Nanda takut pencalonan Arya gagal karena dokumen pendidikannya tidak memenuhi persyaratan, sehingga ia membuat dokumen baru untuk menyelamatkan pencalonan dan karier politiknya.",

    summary:
      "Arya memang pernah bersekolah di SMA Negeri 4 Nusatama dan mengikuti pendidikan sampai tingkat akhir. Namun, tidak ditemukan bukti bahwa ia pernah menerima ijazah dengan nomor 04-2002-1187. " +
      "Dokumen awal yang diserahkan Arya kepada tim kampanye hanyalah surat keterangan sekolah. Nanda, yang bertanggung jawab atas administrasi pencalonan, kemudian mengubah file tersebut dan membuat dokumen yang menyerupai ijazah resmi. " +
      "Ia bahkan meminta percetakan membuat ulang dokumen dengan tanda tangan kepala sekolah. Bukti menunjukkan Nanda sengaja menyembunyikan proses tersebut dari Arya. " +
      "Rafi memang mempunyai motif politik untuk menjatuhkan Arya dan terkait dengan akun anonim yang menyebarkan kasus, tetapi ia bukan orang yang membuat ijazah. " +
      "Pertanyaan terbesar dalam persidangan adalah apakah Arya mengetahui bahwa dokumen tersebut palsu. Bukti yang tersedia menunjukkan ia menyerahkan dokumen kepada tim, tetapi tidak menunjukkan secara langsung bahwa ia mengetahui tindakan Nanda.",

    timeline: [
      {
        time: "1999",
        text: "Arya mulai bersekolah di SMA Negeri 4 Nusatama.",
      },

      {
        time: "2002",
        text: "Arya mengikuti ujian akhir dan acara perpisahan, tetapi tidak tercatat menerima ijazah dengan nomor 04-2002-1187.",
      },

      {
        time: "2024-02-04",
        text: "Arya menyerahkan dokumen pendidikan yang ia miliki kepada tim kampanye.",
      },

      {
        time: "2024-02-05",
        text: "Nanda menyadari bahwa dokumen tersebut tidak cukup untuk memenuhi persyaratan pencalonan.",
      },

      {
        time: "2024-02-06",
        text: "Nanda mengubah file dan membuat versi dokumen yang menyerupai ijazah resmi.",
      },

      {
        time: "2024-02-07",
        text: "Nanda meminta percetakan membuat dokumen fisik dengan tanda tangan kepala sekolah.",
      },

      {
        time: "2024-02-08",
        text: "Dokumen tersebut dimasukkan ke dalam berkas pencalonan.",
      },

      {
        time: "2024-11-27",
        text: "Arya memenangkan pemilihan dan dilantik sebagai Wakil Gubernur.",
      },

      {
        time: "2025-03-12",
        text: "Akun anonim menyebarkan tuduhan bahwa ijazah Arya palsu.",
      },

      {
        time: "2025-04-02",
        text: "Penyidik menemukan jejak perubahan dokumen pada komputer Nanda.",
      },

      {
        time: "2025-06-18",
        text: "Arya ditetapkan sebagai tersangka.",
      },
    ],
  },
};
