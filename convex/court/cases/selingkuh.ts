import type { CaseFile } from "../case";

export const nasiGorengJam2: CaseFile = {
  public: {
    id: "nasi-goreng-jam-2",
    title: "Perkara Nasi Goreng Jam 2 Pagi",
    docket: "PERKARA 07/PDT.C/2026/PN.JKT · RAKA v. MAYA",
    tagline: "Dua garpu, dua nasi goreng, satu tuduhan perselingkuhan.",
    setting: "Apartemen Cempaka, Jakarta",
    charge:
      "Maya dituduh berselingkuh setelah ditemukan makan nasi goreng berdua di apartemennya pada pukul 02:17.",
    brief:
      "Raka pulang larut malam dan menemukan dua garpu, dua porsi nasi goreng, serta pesan mencurigakan dari Dito. Maya mengaku hanya lapar. Raka yakin ada orang lain di apartemen.",
    accused: "maya",

    suspects: {
      maya: {
        name: "Maya Putri",
        short: "Maya",
        role: "Terdakwa · pacar Raka",
        bio: "Mengaku sedang lapar dan makan nasi goreng sendirian.",
      },
      dito: {
        name: "Dito Pratama",
        short: "Dito",
        role: "Rekan kerja Maya",
        bio: "Sering bekerja lembur bersama Maya dan mengirim pesan kepadanya malam itu.",
      },
      joko: {
        name: "Joko Santoso",
        short: "Pak Joko",
        role: "Satpam apartemen",
        bio: "Mengaku melihat seorang pria masuk ke lantai Maya dini hari.",
      },
    },

    witnesses: {
      rani: {
        name: "Rani",
        short: "Rani",
        role: "Teman Maya",
        bio: "Teman dekat Maya yang tahu kebiasaan makan dan hubungan Maya dengan Raka.",
      },
      joko: {
        name: "Pak Joko",
        short: "Pak Joko",
        role: "Satpam apartemen",
        bio: "Petugas keamanan yang berjaga di lobi malam itu.",
      },
      arif: {
        name: "Arif",
        short: "Arif",
        role: "Kurir makanan",
        bio: "Kurir yang mengantarkan pesanan makanan ke apartemen malam itu.",
      },
    },

    timeline: [
      { time: "01:20", text: "Raka masih berada di luar apartemen." },
      {
        time: "01:32",
        text: "Dua porsi nasi goreng dipesan ke apartemen Maya.",
      },
      {
        time: "01:48",
        text: 'Dito mengirim pesan kepada Maya: "Udah pulang?"',
      },
      {
        time: "01:55",
        text: "Seseorang dengan hoodie hitam terlihat menuju lantai Maya.",
      },
      {
        time: "02:10",
        text: "Dito mengunggah story sedang makan nasi goreng.",
      },
      {
        time: "02:17",
        text: "Raka tiba dan menemukan dua garpu serta makanan di meja.",
      },
    ],

    goals: {
      defense:
        "Buktikan bahwa Maya tidak bertemu Dito dan bahwa seluruh bukti dapat dijelaskan dengan kejadian yang lebih sederhana.",
      prosecution:
        "Buktikan bahwa Maya memiliki kesempatan bertemu orang lain dan sengaja menyembunyikan pertemuan tersebut dari Raka.",
    },
  },

  evidence: [
    {
      id: "E1",
      kind: "public",
      title: "Dua Garpu",
      text: "Di meja makan Maya ditemukan dua garpu yang diletakkan berdampingan.",
      supports: ["opportunity:maya"],
      truth:
        "Dua garpu memang digunakan, tetapi bukan berarti ada dua orang yang makan. Salah satunya digunakan untuk mengambil kerupuk.",
      role: "misleading",
    },

    {
      id: "E2",
      kind: "public",
      title: "Pesan Dito",
      text: 'Pada pukul 01:48 Dito mengirim pesan kepada Maya: "Udah pulang?"',
      supports: ["identity:dito"],
      truth:
        "Dito memang mengirim pesan, tetapi ia sedang memastikan apakah Maya sudah pulang karena mereka sebelumnya membicarakan pekerjaan.",
      role: "misleading",
    },

    {
      id: "E3",
      kind: "public",
      title: "Struk Dua Nasi Goreng",
      text: "Pesanan online pukul 01:32 berisi dua nasi goreng spesial.",
      supports: ["opportunity:maya"],
      truth:
        "Pesanan tersebut memang dikirim ke apartemen Maya, tetapi kedua porsi dipesan oleh Raka sebagai kejutan.",
      role: "key",
    },

    {
      id: "E4",
      kind: "public",
      title: "CCTV Hoodie Hitam",
      text: "Rekaman CCTV menunjukkan seseorang memakai hoodie hitam menuju lantai Maya pukul 01:55.",
      supports: ["identity:joko"],
      truth: "Orang tersebut adalah kurir makanan, bukan Dito.",
      role: "misleading",
    },

    {
      id: "E5",
      kind: "public",
      title: "Instagram Dito",
      text: 'Dito mengunggah foto nasi goreng pada pukul 02:10 dengan caption "Finally makan."',
      supports: ["identity:dito"],
      truth:
        "Dito memang makan nasi goreng, tetapi dia berada di rumahnya sendiri.",
      role: "misleading",
    },

    {
      id: "E6",
      kind: "public",
      title: "Gelas dengan Lipstik",
      text: "Sebuah gelas di apartemen Maya memiliki bekas lipstik.",
      supports: ["identity:maya"],
      truth:
        "Gelas tersebut memang milik Maya dan tidak memberikan bukti adanya orang lain.",
      role: "misleading",
    },

    {
      id: "E7",
      kind: "public",
      title: "Chat Maya kepada Rani",
      text: 'Maya mengirim pesan: "Jangan bilang Raka aku makan malam lagi."',
      supports: ["motive:maya"],
      truth:
        "Maya sedang menyembunyikan kebiasaan makannya karena sedang mengaku diet.",
      role: "misleading",
    },

    {
      id: "D1",
      kind: "defense",
      title: "Riwayat Pesanan",
      text: "Data aplikasi menunjukkan akun pemesan menggunakan akun Raka dan pembayaran dilakukan dengan metode pembayaran milik Raka.",
      truth:
        "Raka sendiri yang memesan dua nasi goreng sebagai kejutan untuk Maya.",
      role: "key",
    },

    {
      id: "D2",
      kind: "defense",
      title: "Lokasi Dito",
      text: "Data unggahan Dito dan koneksi Wi-Fi menunjukkan ponselnya berada di rumahnya pada pukul 02:10.",
      truth: "Dito tidak berada di apartemen Maya.",
      role: "key",
    },

    {
      id: "D3",
      kind: "defense",
      title: "Pesan Kurir",
      text: 'Kurir mengirim pesan kepada pelanggan: "Pak, makanan sudah saya taruh di depan pintu."',
      truth: "Orang berhoodie di CCTV adalah kurir makanan.",
      role: "key",
    },

    {
      id: "P1",
      kind: "prosecution",
      title: "Pesan Tengah Malam",
      text: "Dito menghubungi Maya hanya 29 menit sebelum Raka tiba.",
      supports: ["opportunity:dito"],
      truth: "Pesan tersebut mencurigakan tetapi tidak membuktikan pertemuan.",
      role: "misleading",
    },

    {
      id: "P2",
      kind: "prosecution",
      title: "Maya Berbohong",
      text: "Ketika pertama ditanya, Maya mengatakan hanya memesan satu nasi goreng.",
      supports: ["motive:maya"],
      truth:
        "Maya berbohong karena tidak ingin Raka tahu bahwa ia makan dua porsi dan membatalkan dietnya.",
      role: "key",
    },

    {
      id: "H1",
      kind: "hidden",
      title: "Rekaman Kurir",
      text: "Rekaman kamera lift menunjukkan orang berhoodie hitam membawa dua kantong makanan dan tidak pernah masuk ke unit Maya bersama orang lain.",
      supports: ["identity:pelaku"],
      truth: "Orang tersebut adalah Arif, kurir makanan.",
      role: "key",
    },

    {
      id: "H2",
      kind: "hidden",
      title: "Detail Pesanan",
      text: "Nomor pesanan cocok dengan akun Raka. Pesanan dibuat dari lokasi kantor Raka sebelum ia pulang.",
      supports: ["identity:pelaku"],
      truth: "Raka sendiri yang memesan makanan tersebut.",
      role: "key",
    },

    {
      id: "H3",
      kind: "hidden",
      title: "Chat Rahasia Maya",
      text: 'Maya mengirim pesan kepada Rani: "Aku ketahuan. Aku makan dua porsi."',
      supports: ["motive:maya"],
      truth: "Yang Maya sembunyikan hanyalah bahwa ia makan terlalu banyak.",
      role: "key",
    },
  ],

  clarify: {
    E3: {
      reveals: "H2",
      text: "Majelis meminta rincian akun dan lokasi pembuatan pesanan dua nasi goreng tersebut.",
    },

    E4: {
      reveals: "H1",
      text: "Majelis meminta rekaman lanjutan dari lift hingga pintu apartemen.",
    },

    E7: {
      reveals: "H3",
      text: "Majelis meminta konteks lengkap percakapan Maya dengan Rani.",
    },
  },

  witnesses: {
    rani: {
      persona:
        "Teman dekat Maya. Ia tahu Maya sedang mencoba diet dan sebenarnya tidak percaya Maya berselingkuh.",

      answers: {
        where: {
          text: "Maya bilang dia di apartemen.",
          honesty: "truth",
        },

        saw: {
          text: "Saya tidak melihat Maya bersama laki-laki lain malam itu.",
          honesty: "truth",
        },

        who: {
          text: "Maya bilang dia sendirian. Dia cuma menunggu makanan.",
          honesty: "truth",
        },

        sure: {
          text: "Saya yakin dia tidak bertemu Dito malam itu.",
          honesty: "truth",
        },

        contact: {
          text: "Maya memang sering chat dengan Dito karena pekerjaan.",
          honesty: "truth",
        },

        terdakwa: {
          text: "Maya memang punya kebiasaan menyembunyikan makanan dari Raka.",
          honesty: "truth",
        },

        pelaku: {
          text: "Kalau yang dimaksud orang yang datang malam itu, saya tidak tahu.",
          honesty: "truth",
        },

        umpan: {
          text: "Saya pernah melihat Dito di apartemen, tapi bukan malam itu.",
          honesty: "truth",
        },
      },

      confront: {
        H3: {
          text: "Iya... Maya memang bilang dia ketahuan makan dua porsi. Bukan ketahuan selingkuh.",
          key: "rani.makan",
          honesty: "truth",
        },
      },
    },

    joko: {
      persona:
        "Satpam yang bekerja malam itu. Ia mudah panik dan terlalu percaya diri ketika menceritakan apa yang dilihatnya.",

      answers: {
        where: {
          text: "Saya di lobi. Saya lihat ada pria pakai hoodie masuk sekitar jam dua.",
          honesty: "truth",
        },

        saw: {
          text: "Saya yakin dia laki-laki dan menuju lantai Maya.",
          honesty: "mistake",
          supports: ["identity:dito"],
          underminedBy: ["joko.siapa", "H1"],
        },

        who: {
          text: "Saya kira itu Dito. Tingginya mirip.",
          honesty: "mistake",
          supports: ["identity:dito"],
          underminedBy: ["H1"],
        },

        sure: {
          text: "Kalau wajahnya? Tidak kelihatan karena hoodie.",
          honesty: "truth",
        },

        contact: {
          text: "Tidak ada yang menghubungi saya malam itu.",
          honesty: "truth",
        },

        terdakwa: {
          text: "Saya tidak melihat Maya keluar dari apartemen.",
          honesty: "truth",
        },

        pelaku: {
          text: "Saya cuma yakin orang itu menuju lantai Maya.",
          honesty: "truth",
        },

        umpan: {
          text: "Saya pernah melihat Dito beberapa kali di gedung ini.",
          honesty: "truth",
        },
      },

      confront: {
        H1: {
          text: "Oh... kalau diperbesar memang dia membawa kantong makanan. Berarti saya salah kira. Saya tidak pernah melihat wajahnya.",
          key: "joko.salah",
          honesty: "truth",
        },
      },
    },

    arif: {
      persona:
        "Kurir makanan yang mengantar pesanan malam itu. Santai dan tidak peduli dengan drama hubungan Maya dan Raka.",

      answers: {
        where: {
          text: "Saya mengantar makanan ke Apartemen Cempaka sekitar jam dua pagi.",
          honesty: "truth",
        },

        saw: {
          text: "Saya tidak melihat siapa pun selain pelanggan yang menerima makanan.",
          honesty: "truth",
        },

        who: {
          text: "Saya tidak tahu nama pelanggannya. Saya hanya antar sesuai nomor unit.",
          honesty: "truth",
        },

        sure: {
          text: "Saya ingat membawa dua nasi goreng.",
          honesty: "truth",
        },

        contact: {
          text: "Saya menghubungi nomor pemesan karena pelanggan tidak langsung membuka pintu.",
          honesty: "truth",
        },

        terdakwa: {
          text: "Saya melihat seorang perempuan mengambil makanan dari depan pintu.",
          honesty: "truth",
        },

        pelaku: {
          text: "Saya tidak membawa orang lain. Saya sendirian.",
          honesty: "truth",
        },

        umpan: {
          text: "Saya tidak kenal Dito.",
          honesty: "truth",
        },
      },

      confront: {
        H2: {
          text: "Kalau nomor pesanannya itu, iya. Saya yang antar dua nasi goreng tersebut.",
          key: "arif.pesanan",
          honesty: "truth",
        },
      },
    },
  },

  contradictions: [
    {
      a: "joko.saw",
      b: "joko.who",
      text: "Pak Joko mengaku yakin melihat Dito, tetapi juga mengakui wajah orang tersebut tidak terlihat.",
    },

    {
      a: "E3",
      b: "D1",
      text: "Dua nasi goreng terlihat seperti bukti ada dua orang, tetapi ternyata pesanan dibuat oleh Raka sendiri.",
    },

    {
      a: "E5",
      b: "D2",
      text: "Dito terlihat sedang makan nasi goreng pada pukul 02:10, tetapi lokasinya berada di rumahnya.",
    },

    {
      a: "P2",
      b: "H3",
      text: "Maya memang berbohong tentang makanan, tetapi alasannya adalah diet, bukan perselingkuhan.",
    },

    {
      a: "E4",
      b: "H1",
      text: "Orang berhoodie di CCTV awalnya dianggap Dito, tetapi rekaman lengkap menunjukkan dia adalah kurir.",
    },
  ],

  truth: {
    culprit: "maya",

    summary:
      "Maya tidak berselingkuh. Ia memang berbohong kepada Raka karena malu mengakui bahwa ia makan dua porsi nasi goreng pada pukul dua pagi. Dua porsi tersebut sebenarnya dipesan oleh Raka sendiri sebagai kejutan. Dito berada di rumahnya dan hanya mengirim pesan terkait pekerjaan. Orang berhoodie di CCTV adalah kurir makanan.",

    motive:
      "Maya ingin menyembunyikan bahwa ia melanggar diet dan makan dua porsi nasi goreng. Kebohongan kecil tersebut membuat semua bukti terlihat seperti perselingkuhan.",

    timeline: [
      {
        time: "01:20",
        text: "Raka diam-diam memesan dua nasi goreng sebagai kejutan untuk Maya.",
      },

      {
        time: "01:32",
        text: "Pesanan dua nasi goreng dibuat menggunakan akun Raka.",
      },

      {
        time: "01:48",
        text: "Dito mengirim pesan kepada Maya mengenai pekerjaan.",
      },

      {
        time: "01:55",
        text: "Arif, kurir makanan, tiba di apartemen memakai hoodie hitam.",
      },

      {
        time: "02:00",
        text: "Maya mengambil dua nasi goreng dari depan pintu.",
      },

      {
        time: "02:10",
        text: "Dito mengunggah foto dirinya makan nasi goreng di rumah.",
      },

      {
        time: "02:17",
        text: "Raka tiba dan melihat dua garpu serta dua porsi nasi goreng.",
      },

      {
        time: "02:20",
        text: "Raka mulai menuduh Maya berselingkuh.",
      },

      {
        time: "02:30",
        text: "Maya mengaku makan dua porsi, tetapi awalnya tetap menyembunyikan alasannya.",
      },
    ],
  },
};
