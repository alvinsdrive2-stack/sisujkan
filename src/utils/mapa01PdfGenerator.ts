interface Unit {
  id_unit: number
  nama_unit: string
  kode_unit: string
}

interface KelompokKerja {
  id: number
  nama: string
  urut: string
  units: Unit[]
}

interface Referensi {
  id: number
  nama: string
  value: boolean
}

interface Subkategori {
  id: number | null
  nama: string
  urut: number | null
  referensis: Referensi[]
}

interface Kategori {
  id: number | null
  kategori: string | null
  nama: string
  urut: number | null
  id_kelompok: number | null
  subkategoris: Subkategori[]
}

interface KelompokForm {
  id: number
  nama: string | null
  urut: number
  kategoris: Kategori[]
}

interface ReferensiFormItem {
  kelompok: KelompokForm
}

interface Mapa01Data {
  kelompok_kerja: {
    id: number
    kode: string
    nama_dokumen: string
    kelompok_kerja: KelompokKerja[]
  }
  referensi_form: ReferensiFormItem[]
}

// Helper untuk cek checkbox berdasarkan referensi
function getCheckedState(referensiForm: ReferensiFormItem[] | undefined, kategoriNama: string, refNama: string): boolean {
  if (!referensiForm) return false
  for (const item of referensiForm) {
    for (const kat of item.kelompok.kategoris || []) {
      if (kat.nama === kategoriNama) {
        for (const sub of kat.subkategoris || []) {
          for (const ref of sub.referensis || []) {
            const n = ref.nama?.trim().replace(/\s+/g, ' ').toLowerCase() || ''
            const s = refNama.trim().replace(/\s+/g, ' ').toLowerCase()
            if (n === s || n.includes(s)) return ref.value
          }
        }
      }
    }
  }
  return false
}

function generateKelompokKerjaHtml(kelompokKerja: KelompokKerja[]): string {
  if (!kelompokKerja || kelompokKerja.length === 0) return ''

  let html = ''

  kelompokKerja.forEach((kelompok) => {
    const unitsCount = kelompok.units.length
    html += `
      <table width="100%" cellpadding="5" cellspacing="0" align="center">
        <tr>
          <td style="width: 20%;" rowspan="${unitsCount + 1}">
            <strong>Kelompok Pekerjaan ${kelompok.urut}</strong>
          </td>
          <td style="width: 8%;" align="center"><strong>No.</strong></td>
          <td style="width: 22%;" align="center"><strong>Kode Unit</strong></td>
          <td style="width: 50%;" align="center"><strong>Judul Unit</strong></td>
        </tr>
    `

    kelompok.units.forEach((unit, i) => {
      html += `
        <tr>
          <td align="center">${i + 1}.</td>
          <td align="center">${unit.kode_unit}</td>
          <td>${unit.nama_unit}</td>
        </tr>
      `
    })

    html += `</table><br />`

    html += `
      <table width="100%" cellpadding="5" cellspacing="0" align="center" style="font-size: 10pt;">
        <tr>
          <td rowspan="2" style="width: 15%;" align="center"><strong>Unit Kompetensi</strong></td>
          <td rowspan="2" style="width: 18%;" align="center">
            <strong>Bukti-Bukti</strong><br />
            <small>(Kinerja, Produk, Portofolio, dan/atau Pengetahuan) diidentifikasi berdasarkan Kriteria Unjuk Kerja dan Pendekatan Asesmen.</small>
          </td>
          <td colspan="3" align="center"><strong>Jenis Bukti</strong></td>
          <td colspan="5" align="center"><strong>Metode dan Perangkat Asesmen<br />
            <small>CL (Ceklis Observasi), DIT (Daftar Instruksi 
Terstruktur), DPL (Daftar Pertanyaan Lisan), 
DPT (Daftar Pertanyaan Tertulis), VPK (Verifikasi 
Pihak Ketiga), CVP (Ceklis Verifikasi Portofolio), 
CRP (Ceklis Reviu Produk), PW (Pertanyaan 
Wawancara)</small></strong>
          </td>
        </tr>
        <tr>
          <td style="width: 5%;" align="center"><strong>L</strong></td>
          <td style="width: 5%;" align="center"><strong>TL</strong></td>
          <td style="width: 5%;" align="center"><strong>T</strong></td>
          <td style="width: 13%;" align="center" class="rotate-text">
                    <strong>Observasi langsung</strong><br />
                    <small>(kerja nyata/aktivitas waktu nyata di tempat kerja di lingkungan tempat kerja yang disimulasikan)</small></div>
                </td>
          <td style="width: 13%;" align="center" class="rotate-text">
                    <strong>Kegiatan Terstruktur</strong><br />
                    <small>(latihan simulasi dan bermain peran, proyek, presentasi, lembar kegiatan)</small>
                </td>
                <td style="width: 13%;" align="center" class="rotate-text">
                    <strong>Tanya Jawab</strong><br />
                    <small>(pertanyaan tertulis, wawancara, asesmen diri, tanya jawab lisan, angket, ujian lisan atau tertulis)</small>
                </td>
                <td style="width: 13%;" align="center" class="rotate-text">
                    <strong>Verifikasi Portfolio</strong><br />
                    <small>(sampel pekerjaan yang disusun oleh Asesi, produk dengan dokumentasi pendukung, bukti sejarah, jurnal atau buku catatan, informasi tentang pengalaman hidup)</small>
                </td>
                <td style="width: 10%;" align="center" class="rotate-text">
                    <strong>Reviu Produk</strong><br />
                    <small>Produk hasil proyek, contoh hasil kerja/produk</small>
                </td>
        </tr>
    `

    kelompok.units.forEach((unit, i) => {
      html += `
        <tr>
          <td style="font-size: 9pt;">${i + 1}. ${unit.nama_unit}</td>
          <td style="font-size: 9pt;">Hasil tanya jawab tentang: ${unit.nama_unit}</td>
          <td align="center">L</td>
          <td align="center"></td>
          <td align="center"><strong>T</strong></td>
          <td align="center"></td>
          <td align="center"></td>
          <td align="center"><strong>DPT</strong></td>
          <td align="center"></td>
          <td align="center"></td>
        </tr>
      `
    })

    html += `</table><br />`
  })

  return html
}

function generateModifikasiHtml(referensiForm: ReferensiFormItem[] | undefined): string {
  const modifikasiItems = [
    { prefix: '3.1.a', label: 'Karakteristik kandidat:', searchKey: 'Karakteristik kandidat' },
    { prefix: '3.1.b', label: 'Kebutuhan kontekstualisasi terkait tempat kerja:', searchKey: 'Kebutuhan kontekstualisasi' },
    { prefix: '3.2', label: 'Saran yang diberikan oleh paket pelatihan atau pengembang pelatihan', searchKey: 'Saran yang diberikan' },
    { prefix: '3.3', label: 'Penyesuaian perangkat asesmen terkait kebutuhan kontekstualisasi', searchKey: 'Penyesuaian perangkat asesmen' },
    { prefix: '3.4', label: 'Peluang untuk kegiatan asesmen terintegrasi', searchKey: 'Peluang untuk kegiatan asesmen' },
  ]

  let html = ''

  modifikasiItems.forEach((item) => {
    const checked = getCheckedState(referensiForm, 'Modifikasi', item.searchKey) ||
                    getCheckedStateFromKelompok3(referensiForm, item.searchKey)

    html += `
      <tr>
        <td style="width: 50%;">${item.prefix} ${item.label}</td>
        <td style="width: 50%;">
          <span class="radio ${checked ? 'radio-checked' : ''}"></span> Ada
          <span class="radio ${!checked ? 'radio-checked' : ''}"></span> Tidak ada
        </td>
      </tr>
    `
  })

  return html
}

function getCheckedStateFromKelompok3(referensiForm: ReferensiFormItem[] | undefined, searchKey: string): boolean {
  if (!referensiForm) return false
  for (const item of referensiForm) {
    if (item.kelompok.id === 3) {
      for (const kat of item.kelompok.kategoris || []) {
        for (const sub of kat.subkategoris || []) {
          for (const ref of sub.referensis || []) {
            const n = ref.nama?.trim().replace(/\s+/g, ' ').toLowerCase() || ''
            if (n.includes(searchKey.toLowerCase())) return ref.value
          }
        }
      }
    }
  }
  return false
}

export function generateMapa01Pdf(
  judul: string,
  nomor: string,
  mapaData: Mapa01Data | null
): string {
  const referensiForm = mapaData?.referensi_form || []
  const kelompokKerja = mapaData?.kelompok_kerja?.kelompok_kerja || []

  const asesi = {
    hasil_pelatihan_telusur: getCheckedState(referensiForm, 'Asesi', 'Hasil pelatihan dan/atau pendidikan, dimana kurikulum dan fasilitas praktek mampu telusur'),
    hasil_pelatihan_tidak_kompetensi: getCheckedState(referensiForm, 'Asesi', 'Hasil pelatihan dan/atau pendidikan, dimana kurikulum belum berbasis kompetensi'),
    pekerja_berpengalaman_telusur: getCheckedState(referensiForm, 'Asesi', 'Pekerja berpengalaman, dimana berasal dari industry/tempat kerja yang dalam operasionalnya mampu telusur'),
    pekerja_berpengalaman_tidak_telusur: getCheckedState(referensiForm, 'Asesi', 'Pekerja berpengalaman, dimana berasal dari industry/tempat kerja yang dalam operasionalnya belum berbasis'),
    otodidak: getCheckedState(referensiForm, 'Asesi', 'Pelatihan/belajar mandiri atau otodidak'),
  }

  const tujuan = {
    sertifikasi: getCheckedState(referensiForm, 'Tujuan Asesmen', 'Sertifikasi'),
    pkt: getCheckedState(referensiForm, 'Tujuan Asesmen', 'Pengakuan Kompetensi Terkini'),
    rpl: getCheckedState(referensiForm, 'Tujuan Asesmen', 'Rekognisi pembelajaran lampau'),
    lainnya: getCheckedState(referensiForm, 'Tujuan Asesmen', 'Lainnya'),
  }

  const konteks = {
    tempat_kerja_nyata: getCheckedState(referensiForm, 'Konteks Asesmen', 'Tempat kerja nyata'),
    tempat_kerja_simulasi: getCheckedState(referensiForm, 'Konteks Asesmen', 'Tempat kerja simulasi'),
    tersedia: getCheckedState(referensiForm, 'Konteks Asesmen', 'Tersedia'),
    terbatas: getCheckedState(referensiForm, 'Konteks Asesmen', 'Terbatas'),
    bukti_asesmen_rpl: getCheckedState(referensiForm, 'Konteks Asesmen', 'Bukti untuk mendukung asesmen'),
    aktivitas_kerja: getCheckedState(referensiForm, 'Konteks Asesmen', 'Aktivitas kerja di tempat kerja'),
    kegiatan_pembelajaran: getCheckedState(referensiForm, 'Konteks Asesmen', 'Kegiatan Pembelajaran'),
    lsp_gatensi: getCheckedState(referensiForm, 'Konteks Asesmen', 'LSP Gatensi Karya Konstruksi'),
    organisasi_pelatihan: getCheckedState(referensiForm, 'Konteks Asesmen', 'Organisasi Pelatihan'),
    asesor_perusahaan: getCheckedState(referensiForm, 'Konteks Asesmen', 'asesor perusahaan'),
  }

  const orang_relevan = {
    manajer_sertifikasi_lsp: getCheckedState(referensiForm, 'Orang yang relevan untuk dikonfirmasi', 'Manajer sertifikasi LSP'),
    master_assessor_lsp: getCheckedState(referensiForm, 'Orang yang relevan untuk dikonfirmasi', 'Master Assessor'),
    manajer_pelatihan_lsp: getCheckedState(referensiForm, 'Orang yang relevan untuk dikonfirmasi', 'Manajer pelatihan Lembaga Training'),
    lainnya: getCheckedState(referensiForm, 'Orang yang relevan untuk dikonfirmasi', 'Lainnya'),
  }

  const tolok_ukur = {
    skkni: getCheckedState(referensiForm, 'Tolok ukur asesmen', 'Standar Kompetensi'),
    kriteria_kurikulum: getCheckedState(referensiForm, 'Tolok ukur asesmen', 'Kriteria asesmen dari kurikulum'),
    spesifikasi_kinerja: getCheckedState(referensiForm, 'Tolok ukur asesmen', 'Spesifikasi kinerja suatu perusahaan'),
    spesifikasi_produk: getCheckedState(referensiForm, 'Tolok ukur asesmen', 'Spesifikasi Produk'),
    pedoman_khusus: getCheckedState(referensiForm, 'Tolok ukur asesmen', 'Pedoman khusus'),
  }

  const konfirmasi = {
    manajer_sertifikasi: false,
    master_assessor: false,
    manajer_pelatihan: false,
    lainnya: false,
  }

  const penyusun = { nama: '', nomor_met: '' }
  const validator = { nama: '', nomor_met: '' }

  // Generate full HTML
  const html = `<!doctype html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <title>FR.MAPA.01</title>
    <style>
        body {
            font-family: "Open Sans", Calibri, Candara, Segoe, Segoe UI, Optima, Arial, sans-serif;
            font-size: 11pt;
            margin: 20px;
        }
        .hd-dok {
            background-color: #c00000;
            color: #fff;
        }
        .hd-dok-b {
            background-color: #e79291;
            color: #000;
        }
        td {
            border: 0.2px solid black;
        }
        table {
            border: 0px solid black;
        }
        .noborder {
            border: 0 transparent !important;
        }
        .checkbox {
            width: 12px;
            height: 12px;
            border: 1px solid #000;
            display: inline-block;
            text-align: center;
            line-height: 11px;
            font-size: 10px;
        }
        .checked::after {
            content: "✔";
            font-size: 16px;
        }
        .radio {
            width: 12px;
            height: 12px;
            border: 1px solid #000;
            border-radius: 50%;
            display: inline-block;
            text-align: center;
            line-height: 11px;
            font-size: 10px;
        }
        .radio-checked::after {
            content: "•";
            font-size: 20px;
        }
        td.rotate-text {
            writing-mode: vertical-rl;
            text-orientation: mixed;
            transform: rotate(180deg);
            width: auto;
            height: 35vh;
            word-break: break-all;
            white-space: normal;
        }
        @media print {
            body { margin: 0; }
            .hd-dok {
                background-color: #c00000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
        }
        .hd-dok {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
    </style>
</head>
<body>
    <!-- Title -->
    <table width="100%" cellspacing="0" cellpadding="5" bgcolor="#fff" align="center">
        <tr>
            <td class="noborder">
                FR. MAPA.01 MERENCANAKAN AKTIVITAS DAN PROSES ASESMEN<br />
            </td>
        </tr>
    </table>
    <br />

    <!-- Header: Skema Sertifikasi -->
    <table width="100%" cellpadding="5" cellspacing="0" align="center">
        <tr>
            <td style="width: 30%;" rowspan="2">Skema Sertifikasi Okupasi Nasional</td>
            <td style="width: 15%;">Judul</td>
            <td style="width: 3%;">:</td>
            <td style="width: 52%;">${judul}</td>
        </tr>
        <tr>
            <td>Nomor</td>
            <td>:</td>
            <td>${nomor}</td>
        </tr>
    </table>
    <br />

    <!-- SECTION 1: Pendekatan Asesmen -->
    <table width="100%" cellpadding="5" cellspacing="0" align="center" class="noborder">
        <tr>
            <td class="noborder">
                <strong>1. Pendekatan Asesmen</strong><br />
            </td>
        </tr>
    </table>
    <table width="100%" cellpadding="5" cellspacing="0" align="center">
        <tr>
            <td class="hd-dok" colspan="5" style="font-weight: bold;">1.1. Asesi</td>
        </tr>
        <tr>
            <td rowspan="21" style="width: 5%; vertical-align: top;">1.1.</td>
            <td rowspan="5" style="width: 20%; vertical-align: top;">Asesi</td>
            <td colspan="3">
                <span class="checkbox ${asesi.hasil_pelatihan_telusur ? 'checked' : ''}"></span>
                Hasil pelatihan dan/atau pendidikan, dimana kurikulum dan fasilitas praktek mampu telusur terhadap standar kompetensi.
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <span class="checkbox ${asesi.hasil_pelatihan_tidak_kompetensi ? 'checked' : ''}"></span>
                Hasil pelatihan dan/atau pendidikan, dimana kurikulum belum berbasis kompetensi.
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <span class="checkbox ${asesi.pekerja_berpengalaman_telusur ? 'checked' : ''}"></span>
                Pekerja berpengalaman, dimana berasal dari industry/tempat kerja yang dalam operasionalnya mampu telusur dengan standar kompetensi.
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <span class="checkbox ${asesi.pekerja_berpengalaman_tidak_telusur ? 'checked' : ''}"></span>
                Pekerja berpengalaman, dimana berasal dari industry/tempat kerja yang dalam operasionalnya belum berbasis standar kompetensi.
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <span class="checkbox ${asesi.otodidak ? 'checked' : ''}"></span>
                Pelatihan/belajar mandiri atau otodidak.
            </td>
        </tr>

        <!-- Tujuan Asesmen -->
        <tr>
            <td rowspan="4" style="vertical-align: top;">Tujuan Asesmen</td>
            <td colspan="3">
                <span class="checkbox ${tujuan.sertifikasi ? 'checked' : ''}"></span>
                Sertifikasi
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <span class="checkbox ${tujuan.pkt ? 'checked' : ''}"></span>
                Pengakuan Kompetensi Terkini (PKT)
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <span class="checkbox ${tujuan.rpl ? 'checked' : ''}"></span>
                Rekognisi pembelajaran lampau (RPL)
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <span class="checkbox ${tujuan.lainnya ? 'checked' : ''}"></span>
                Lainnya
            </td>
        </tr>

        <!-- Konteks Asesmen -->
        <tr>
            <td rowspan="8" style="vertical-align: top;">Konteks Asesmen:</td>
            <td style="width: 15%;">Lingkungan</td>
            <td style="width: 25%;">
                <span class="checkbox ${konteks.tempat_kerja_nyata ? 'checked' : ''}"></span>
                Tempat kerja nyata
            </td>
            <td style="width: 25%;">
                <span class="checkbox ${konteks.tempat_kerja_simulasi ? 'checked' : ''}"></span>
                Tempat kerja simulasi
            </td>
        </tr>
        <tr>
            <td>Peluang untuk mengumpulkan bukti dalam sejumlah situasi</td>
            <td>
                <span class="checkbox ${konteks.tersedia ? 'checked' : ''}"></span>
                Tersedia
            </td>
            <td>
                <span class="checkbox ${konteks.terbatas ? 'checked' : ''}"></span>
                Terbatas
            </td>
        </tr>
        <tr>
            <td rowspan="3">Hubungan antara standar kompetensi dan</td>
            <td colspan="2">
                <span class="checkbox ${konteks.bukti_asesmen_rpl ? 'checked' : ''}"></span>
                Bukti untuk mendukung asesmen / RPL
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <span class="checkbox ${konteks.aktivitas_kerja ? 'checked' : ''}"></span>
                Aktivitas kerja di tempat kerja kandidat
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <span class="checkbox ${konteks.kegiatan_pembelajaran ? 'checked' : ''}"></span>
                Kegiatan Pembelajaran
            </td>
        </tr>
        <tr>
            <td rowspan="3">Siapa yang melakukan asesmen / RPL</td>
            <td colspan="2">
                <span class="checkbox ${konteks.lsp_gatensi ? 'checked' : ''}"></span>
                LSP Gatensi Karya Konstruksi
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <span class="checkbox ${konteks.organisasi_pelatihan ? 'checked' : ''}"></span>
                Organisasi Pelatihan
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <span class="checkbox ${konteks.asesor_perusahaan ? 'checked' : ''}"></span>
                Asesor perusahaan
            </td>
        </tr>

        <!-- Orang yang relevan -->
        <tr>
            <td rowspan="4" style="vertical-align: top;">Orang yang relevan untuk dikonfirmasi</td>
            <td colspan="3">
                <span class="checkbox ${orang_relevan.manajer_sertifikasi_lsp ? 'checked' : ''}"></span>
                Manajer sertifikasi LSP Gatensi Karya Konstruksi
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <span class="checkbox ${orang_relevan.master_assessor_lsp ? 'checked' : ''}"></span>
                Master Assessor / Master Trainer / Asesor Utama kompetensi
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <span class="checkbox ${orang_relevan.manajer_pelatihan_lsp ? 'checked' : ''}"></span>
                Manajer pelatihan Lembaga Training terakreditasi / Lembaga Training terdaftar
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <span class="checkbox ${orang_relevan.lainnya ? 'checked' : ''}"></span>
                Lainnya
            </td>
        </tr>

        <!-- Tolok Ukur Asesmen -->
        <tr>
            <td class="hd-dok" colspan="5" style="font-weight: bold;">1.2. Tolok ukur asesmen</td>
        </tr>
        <tr>
            <td rowspan="5" style="vertical-align: top;">1.2</td>
            <td rowspan="5" style="vertical-align: top;">Tolok ukur asesmen</td>
            <td colspan="3">
                <span class="checkbox ${tolok_ukur.skkni ? 'checked' : ''}"></span>
                Standar Kompetensi
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <span class="checkbox ${tolok_ukur.kriteria_kurikulum ? 'checked' : ''}"></span>
                Kriteria asesmen dari kurikulum pelatihan
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <span class="checkbox ${tolok_ukur.spesifikasi_kinerja ? 'checked' : ''}"></span>
                Spesifikasi kinerja suatu perusahaan atau industri
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <span class="checkbox ${tolok_ukur.spesifikasi_produk ? 'checked' : ''}"></span>
                Spesifikasi Produk
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <span class="checkbox ${tolok_ukur.pedoman_khusus ? 'checked' : ''}"></span>
                Pedoman khusus
            </td>
        </tr>
    </table>
    <br />

    <!-- SECTION 2: Mempersiapkan Rencana Asesmen -->
    <table width="100%" cellpadding="5" cellspacing="0" align="center" class="noborder">
        <tr>
            <td class="noborder">
                <strong>2. Mempersiapkan Rencana Asesmen</strong><br />
            </td>
        </tr>
    </table>

    ${generateKelompokKerjaHtml(kelompokKerja)}

    <!-- SECTION 3: Modifikasi dan Kontekstualisasi -->
    <table width="100%" cellpadding="5" cellspacing="0" align="center" class="noborder">
        <tr>
            <td class="noborder">
                <strong>3. Modifikasi dan Kontekstualisasi:</strong><br />
            </td>
        </tr>
    </table>
    <table width="100%" cellpadding="5" cellspacing="0" align="center">
        <tr>
            <td class="hd-dok" colspan="2" style="font-weight: bold;">Modifikasi dan Kontekstualisasi</td>
        </tr>
        ${generateModifikasiHtml(referensiForm)}
    </table>
    <p style="font-size: 10pt;">*Pilih salah satu opsi</p>
    <br />

    <!-- KONFIRMASI DENGAN ORANG YANG RELEVAN -->
    <table width="100%" cellpadding="5" cellspacing="0" align="center" class="noborder">
        <tr>
            <td class="noborder">
                <strong>Konfirmasi dengan orang yang relevan:</strong><br />
            </td>
        </tr>
    </table>
    <table width="100%" cellpadding="5" cellspacing="0" align="center">
        <tr>
            <td class="hd-dok" style="width: 40%;">Orang yang relevan</td>
            <td class="hd-dok" style="width: 30%;" align="center">Nama</td>
            <td class="hd-dok" style="width: 30%;">Tanda tangan</td>
        </tr>
        <tr>
            <td>
                <span class="checkbox ${konfirmasi.manajer_sertifikasi ? 'checked' : ''}"></span>
                Manajer sertifikasi
            </td>
            <td></td>
            <td></td>
        </tr>
        <tr>
            <td>
                <span class="checkbox ${konfirmasi.master_assessor ? 'checked' : ''}"></span>
                Master Assessor / Master Trainer / Asesor Utama kompetensi
            </td>
            <td></td>
            <td></td>
        </tr>
        <tr>
            <td>
                <span class="checkbox ${konfirmasi.manajer_pelatihan ? 'checked' : ''}"></span>
                Manajer pelatihan Lembaga Training terakreditasi / Lembaga Training terdaftar
            </td>
            <td></td>
            <td></td>
        </tr>
        <tr>
            <td>
                <span class="checkbox ${konfirmasi.lainnya ? 'checked' : ''}"></span>
                Lainnya:
            </td>
            <td></td>
            <td></td>
        </tr>
    </table>
    <br />

    <!-- TANDA TANGAN -->
    <table width="100%" cellpadding="5" cellspacing="0" align="center">
        <tr>
            <td class="hd-dok" style="width: 20%;">Status</td>
            <td class="hd-dok" style="width: 10%;" align="center">No</td>
            <td class="hd-dok" style="width: 25%;" align="center">Nama</td>
            <td class="hd-dok" style="width: 20%;">Nomor MET</td>
            <td class="hd-dok" style="width: 25%;">Tanda Tangan dan Tanggal</td>
        </tr>
        <tr>
            <td rowspan="2">Penyusun</td>
            <td align="center">1</td>
            <td>${penyusun.nama}</td>
            <td>${penyusun.nomor_met}</td>
            <td></td>
        </tr>
        <tr>
            <td align="center">2</td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
        <tr>
            <td rowspan="2">Validator</td>
            <td align="center">1</td>
            <td>${validator.nama}</td>
            <td>${validator.nomor_met}</td>
            <td></td>
        </tr>
        <tr>
            <td align="center">2</td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
    </table>
</body>
</html>`

  return html
}

// Function untuk download PDF (buka di new window untuk print)
export function downloadMapa01Pdf(
  judul: string,
  nomor: string,
  mapaData: Mapa01Data | null
): void {
  const html = generateMapa01Pdf(judul, nomor, mapaData)
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }
}

/**
 * Generate PDF as Blob untuk dikirim ke backend
 * Menggunakan html2canvas + jspdf
 */
export async function generateMapa01PdfBlob(
  judul: string,
  nomor: string,
  mapaData: Mapa01Data | null
): Promise<Blob | null> {
  try {
    // Dynamic import untuk reduce initial bundle size
    const html2canvas = (await import('html2canvas')).default
    const jsPDF = (await import('jspdf')).default

    // Generate HTML
    const html = generateMapa01Pdf(judul, nomor, mapaData)

    // Create temporary container
    const container = document.createElement('div')
    container.innerHTML = html
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '210mm' // A4 width
    container.style.background = '#fff'
    document.body.appendChild(container)

    // Wait for images/fonts to load
    await new Promise(resolve => setTimeout(resolve, 100))

    // Convert to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    // Remove temporary container
    document.body.removeChild(container)

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const imgData = canvas.toDataURL('image/png')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    // Calculate dimensions to fit A4
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const scaledWidth = imgWidth * ratio
    const scaledHeight = imgHeight * ratio

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, 0, scaledWidth, scaledHeight)

    // Return as Blob
    const blob = pdf.output('blob')
    return blob
  } catch (error) {
    console.error('Error generating PDF blob:', error)
    return null
  }
}

/**
 * Generate PDF dan langsung kirim ke backend
 */
export async function uploadMapa01PdfToBackend(
  judul: string,
  nomor: string,
  mapaData: Mapa01Data | null,
  uploadUrl: string,
  token: string,
  options?: {
    fileName?: string
    idIzin?: string
    additionalData?: Record<string, string>
  }
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Generate PDF Blob
    const blob = await generateMapa01PdfBlob(judul, nomor, mapaData)

    if (!blob) {
      return { success: false, message: 'Gagal generate PDF' }
    }

    // Create FormData
    const formData = new FormData()
    const fileName = options?.fileName || 'mapa01.pdf'
    formData.append('file', blob, fileName)

    // Add additional data if provided
    if (options?.idIzin) {
      formData.append('id_izin', options.idIzin)
    }
    if (options?.additionalData) {
      Object.entries(options.additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    // Upload to backend
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    const result = await response.json()

    if (response.ok) {
      return { success: true, message: 'PDF berhasil diupload', data: result }
    } else {
      return { success: false, message: result.message || 'Gagal upload PDF' }
    }
  } catch (error) {
    console.error('Error uploading PDF:', error)
    return { success: false, message: 'Terjadi kesalahan saat upload PDF' }
  }
}
