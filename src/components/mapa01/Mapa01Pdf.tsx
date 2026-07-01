/**
 * Mapa01Pdf.tsx
 * PDF Document for MAPA01 - FR. MAPA.01 MERENCANAKAN AKTIVITAS DAN PROSES ASESMEN
 * Recreated to match the HTML component 1:1
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

// ============== TYPES ==============
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

interface Mapa01PdfProps {
  judul?: string
  nomor?: string
  mapaData?: Mapa01Data | null
}

// ============== STYLES ==============
const BORDER_COLOR = '#000';
const HEADER_BG = '#C00000';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
  },
  // Title
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  // Table base
  table: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 4,
    backgroundColor: '#fff',
  },
  cellHeader: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 6,
    backgroundColor: HEADER_BG,
  },
  cellHeaderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cellText: {
    fontSize: 10,
  },
  cellTextSmall: {
    fontSize: 8,
  },
  // Checkbox
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 1,
  },
  checkbox: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginRight: 4,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#000',
  },
  checkboxLabel: {
    fontSize: 9,
    lineHeight: 1.2,
    flex: 1,
  },
  // Header table widths
  headerCell1: { width: '35%' },
  headerCell2: { width: '10%' },
  headerCell3: { width: '5%' },
  headerCell4: { width: '50%' },
  // Section 1 widths (5 columns)
  col1: { width: '8%' },
  col2: { width: '15%' },
  col3: { width: '27%' },
  col4: { width: '25%' },
  col5: { width: '25%' },
  // Spacing
  spacer: {
    height: 8,
  },
});

// ============== HELPER COMPONENTS ==============
const Checkbox = ({ checked, label }: { checked: boolean; label: string }) => (
  <View style={styles.checkboxWrapper}>
    <View style={[styles.checkbox, checked ? styles.checkboxChecked : {}]} />
    <Text style={styles.checkboxLabel}>{label}</Text>
  </View>
);

const Cell = ({ children, style, width }: { children: any; style?: any; width?: string | number }) => (
  <View style={[styles.cell, width ? { width } : {}, style]}>
    {children}
  </View>
);

const HeaderCell = ({ children, width }: { children: any; width?: string | number }) => (
  <View style={[styles.cellHeader, width ? { width } : {}]}>
    {children}
  </View>
);

// ============== HEADER ==============
const PdfHeader = ({ judul, nomor }: { judul?: string; nomor?: string }) => (
  <>
    <Text style={styles.title}>FR. MAPA.01 MERENCANAKAN AKTIVITAS DAN PROSES ASESMEN</Text>
    <View style={styles.table}>
      <View style={styles.row}>
        <Cell width="35%"><Text>Skema Sertifikasi Okupasi Nasional</Text></Cell>
        <Cell width="10%"><Text>Judul</Text></Cell>
        <Cell width="5%"><Text>:</Text></Cell>
        <Cell width="50%"><Text>{judul || ''}</Text></Cell>
      </View>
      <View style={styles.row}>
        <Cell width="35%"><Text></Text></Cell>
        <Cell width="10%"><Text>Nomor</Text></Cell>
        <Cell width="5%"><Text>:</Text></Cell>
        <Cell width="50%"><Text>{nomor || ''}</Text></Cell>
      </View>
    </View>
    <View style={styles.spacer} />
  </>
);

// ============== SECTION 1 ==============
const PdfSection1 = ({ referensiForm }: { referensiForm?: ReferensiFormItem[] }) => {
  const getChecked = (kategori: string, refNama: string): boolean => {
    if (!referensiForm) return false;
    for (const item of referensiForm) {
      for (const kat of item.kelompok.kategoris || []) {
        if (kat.nama === kategori) {
          for (const sub of kat.subkategoris || []) {
            for (const ref of sub.referensis || []) {
              const n = ref.nama?.trim().replace(/\s+/g, ' ').toLowerCase() || '';
              const s = refNama.trim().replace(/\s+/g, ' ').toLowerCase();
              if (n === s || n.includes(s)) return ref.value;
            }
          }
        }
      }
    }
    return false;
  };

  return (
    <>
      {/* Section 1 Header */}
      <View style={styles.row}>
        <HeaderCell width="100%"><Text style={styles.cellHeaderText}>1. Pendekatan Asesmen</Text></HeaderCell>
      </View>

      {/* 1.1 Asesi */}
      <View style={styles.row}>
        <Cell width="8%"><Text>1.1.</Text></Cell>
        <Cell width="15%"><Text>Asesi</Text></Cell>
        <Cell width="77%">
          <Checkbox checked={getChecked("Asesi", "Hasil pelatihan dan/atau pendidikan, dimana kurikulum dan fasilitas praktek mampu telusur terhadap standar kompetensi.")} label="Hasil pelatihan dan/atau pendidikan, dimana kurikulum dan fasilitas praktek mampu telusur terhadap standar kompetensi." />
          <Checkbox checked={getChecked("Asesi", "Hasil pelatihan dan/atau pendidikan, dimana kurikulum belum berbasis kompetensi.")} label="Hasil pelatihan dan/atau pendidikan, dimana kurikulum belum berbasis kompetensi." />
          <Checkbox checked={getChecked("Asesi", "Pekerja berpengalaman, dimana berasal dari industry/tempat kerja yang dalam operasionalnya mampu telusur dengan standar kompetensi.")} label="Pekerja berpengalaman, dimana berasal dari industry/tempat kerja yang dalam operasionalnya mampu telusur dengan standar kompetensi." />
          <Checkbox checked={getChecked("Asesi", "Pekerja berpengalaman, dimana berasal dari industry/tempat kerja yang dalam operasionalnya belum berbasis standar kompetensi")} label="Pekerja berpengalaman, dimana berasal dari industry/tempat kerja yang dalam operasionalnya belum berbasis standar kompetensi." />
          <Checkbox checked={getChecked("Asesi", "Pelatihan/belajar mandiri atau otodidak.")} label="Pelatihan/belajar mandiri atau otodidak." />
        </Cell>
      </View>

      {/* Tujuan Asesmen */}
      <View style={styles.row}>
        <Cell width="8%"><Text></Text></Cell>
        <Cell width="15%"><Text>Tujuan Asesmen</Text></Cell>
        <Cell width="77%">
          <Checkbox checked={getChecked("Tujuan Asesmen", "Sertifikasi")} label="Sertifikasi" />
          <Checkbox checked={getChecked("Tujuan Asesmen", "Pengakuan Kompetensi Terkini (PKT)")} label="Pengakuan Kompetensi Terkini (PKT)" />
          <Checkbox checked={getChecked("Tujuan Asesmen", "Rekognisi pembelajaran lampau (RPL)")} label="Rekognisi pembelajaran lampau (RPL)" />
          <Checkbox checked={getChecked("Tujuan Asesmen", "Lainnya")} label="Lainnya" />
        </Cell>
      </View>

      {/* Konteks Asesmen - Lingkungan */}
      <View style={styles.row}>
        <Cell width="8%"><Text></Text></Cell>
        <Cell width="15%" style={{ justifyContent: 'center' }}><Text>Konteks Asesmen:</Text></Cell>
        <Cell width="12%"><Text style={{ fontWeight: 'bold', fontSize: 9 }}>Lingkungan</Text></Cell>
        <Cell width="32.5%">
          <Checkbox checked={getChecked("Konteks Asesmen", "Tempat kerja nyata")} label="Tempat kerja nyata" />
        </Cell>
        <Cell width="32.5%">
          <Checkbox checked={getChecked("Konteks Asesmen", "Tempat kerja simulasi")} label="Tempat kerja simulasi" />
        </Cell>
      </View>

      {/* Konteks Asesmen - Peluang */}
      <View style={styles.row}>
        <Cell width="8%"><Text></Text></Cell>
        <Cell width="15%"><Text></Text></Cell>
        <Cell width="12%"><Text style={{ fontSize: 8 }}>Peluang untuk mengumpulkan bukti dalam sejumlah situasi</Text></Cell>
        <Cell width="32.5%">
          <Checkbox checked={getChecked("Konteks Asesmen", "Tersedia")} label="Tersedia" />
        </Cell>
        <Cell width="32.5%">
          <Checkbox checked={getChecked("Konteks Asesmen", "Terbatas")} label="Terbatas" />
        </Cell>
      </View>

      {/* Konteks Asesmen - Hubungan standar */}
      <View style={styles.row}>
        <Cell width="8%"><Text></Text></Cell>
        <Cell width="15%"><Text></Text></Cell>
        <Cell width="12%"><Text style={{ fontSize: 8 }}>Hubungan antara standar kompetensi dan</Text></Cell>
        <Cell width="65%">
          <Checkbox checked={getChecked("Konteks Asesmen", "Bukti untuk mendukung asesmen / RPL")} label="Bukti untuk mendukung asesmen / RPL" />
        </Cell>
      </View>
      <View style={styles.row}>
        <Cell width="8%"><Text></Text></Cell>
        <Cell width="15%"><Text></Text></Cell>
        <Cell width="12%"><Text></Text></Cell>
        <Cell width="65%">
          <Checkbox checked={getChecked("Konteks Asesmen", "Aktivitas kerja di tempat kerja kandidat")} label="Aktivitas kerja di tempat kerja kandidat" />
          <Checkbox checked={getChecked("Konteks Asesmen", "Kegiatan Pembelajaran")} label="Kegiatan Pembelajaran" />
        </Cell>
      </View>

      {/* Konteks Asesmen - Siapa yang melakukan */}
      <View style={styles.row}>
        <Cell width="8%"><Text></Text></Cell>
        <Cell width="15%"><Text></Text></Cell>
        <Cell width="12%"><Text style={{ fontSize: 8 }}>Siapa yang melakukan asesmen / RPL</Text></Cell>
        <Cell width="65%">
          <Checkbox checked={getChecked("Konteks Asesmen", "LSP Gatensi Karya Konstruksi")} label="LSP Gatensi Karya Konstruksi" />
          <Checkbox checked={getChecked("Konteks Asesmen", "Organisasi Pelatihan")} label="Organisasi Pelatihan" />
          <Checkbox checked={getChecked("Konteks Asesmen", "asesor perusahaan")} label="asesor perusahaan" />
        </Cell>
      </View>

      {/* Orang yang relevan */}
      <View style={styles.row}>
        <Cell width="8%"><Text></Text></Cell>
        <Cell width="15%"><Text style={{ fontSize: 9 }}>Orang yang relevan untuk dikonfirmasi</Text></Cell>
        <Cell width="77%">
          <Checkbox checked={getChecked("Orang yang relevan untuk dikonfirmasi", "Manajer sertifikasi LSP Gatensi Karya Konstruksi")} label="Manajer sertifikasi LSP Gatensi Karya Konstruksi" />
          <Checkbox checked={getChecked("Orang yang relevan untuk dikonfirmasi", "Master Assessor / Master Trainer / Asesor Utama kompetensi")} label="Master Assessor / Master Trainer / Asesor Utama kompetensi" />
          <Checkbox checked={getChecked("Orang yang relevan untuk dikonfirmasi", "Manajer pelatihan Lembaga Training terakreditasi / Lembaga Training terdaftar")} label="Manajer pelatihan Lembaga Training terakreditasi / Lembaga Training terdaftar" />
          <Checkbox checked={getChecked("Orang yang relevan untuk dikonfirmasi", "Lainnya")} label="Lainnya" />
        </Cell>
      </View>

      {/* 1.2 Tolok ukur asesmen */}
      <View style={styles.row}>
        <Cell width="8%"><Text>1.2</Text></Cell>
        <Cell width="15%"><Text style={{ fontSize: 9 }}>Tolok ukur asesmen</Text></Cell>
        <Cell width="77%">
          <Checkbox checked={getChecked("Tolok ukur asesmen", "Standar Kompetensi")} label="Standar Kompetensi" />
          <Checkbox checked={getChecked("Tolok ukur asesmen", "Kriteria asesmen dari kurikulum pelatihan")} label="Kriteria asesmen dari kurikulum pelatihan" />
          <Checkbox checked={getChecked("Tolok ukur asesmen", "Spesifikasi kinerja suatu perusahaan atau industri")} label="Spesifikasi kinerja suatu perusahaan atau industri" />
          <Checkbox checked={getChecked("Tolok ukur asesmen", "Spesifikasi Produk")} label="Spesifikasi Produk" />
          <Checkbox checked={getChecked("Tolok ukur asesmen", "Pedoman khusus")} label="Pedoman khusus" />
        </Cell>
      </View>

      <View style={styles.spacer} />
    </>
  );
};

// ============== SECTION 2 ==============
const PdfSection2 = ({ kelompokKerja }: { kelompokKerja: KelompokKerja[] }) => (
  <>
    <View style={styles.row}>
      <HeaderCell width="100%"><Text style={styles.cellHeaderText}>2. Mempersiapkan Rencana Asesmen</Text></HeaderCell>
    </View>

    {kelompokKerja.map((kelompok) => (
      <View key={kelompok.id}>
        {/* Kelompok Header */}
        <View style={styles.row}>
          <Cell width="25%"><Text style={{ fontWeight: 'bold' }}>Kelompok Pekerjaan {kelompok.urut}</Text></Cell>
          <Cell width="10%"><Text style={{ fontWeight: 'bold', textAlign: 'center' }}>No.</Text></Cell>
          <Cell width="20%"><Text style={{ fontWeight: 'bold', textAlign: 'center' }}>Kode Unit</Text></Cell>
          <Cell width="45%"><Text style={{ fontWeight: 'bold', textAlign: 'center' }}>Judul Unit</Text></Cell>
        </View>

        {/* Units */}
        {kelompok.units.map((unit, idx) => (
          <View key={unit.id_unit} style={styles.row}>
            <Cell width="25%"><Text></Text></Cell>
            <Cell width="10%"><Text style={{ textAlign: 'center' }}>{idx + 1}.</Text></Cell>
            <Cell width="20%"><Text style={{ textAlign: 'center' }}>{unit.kode_unit}</Text></Cell>
            <Cell width="45%"><Text>{unit.nama_unit}</Text></Cell>
          </View>
        ))}

        {/* Metode Header */}
        <View style={styles.row}>
          <Cell width="18%"><Text style={{ fontWeight: 'bold', fontSize: 8 }}>Unit Kompetensi</Text></Cell>
          <Cell width="15%"><Text style={{ fontWeight: 'bold', fontSize: 8 }}>Bukti-Bukti</Text></Cell>
          <Cell width="4%"><Text style={{ fontWeight: 'bold', fontSize: 8, textAlign: 'center' }}>L</Text></Cell>
          <Cell width="4%"><Text style={{ fontWeight: 'bold', fontSize: 8, textAlign: 'center' }}>TL</Text></Cell>
          <Cell width="4%"><Text style={{ fontWeight: 'bold', fontSize: 8, textAlign: 'center' }}>T</Text></Cell>
          <Cell width="12%"><Text style={{ fontWeight: 'bold', fontSize: 7, textAlign: 'center' }}>Observasi</Text></Cell>
          <Cell width="12%"><Text style={{ fontWeight: 'bold', fontSize: 7, textAlign: 'center' }}>Terstruktur</Text></Cell>
          <Cell width="12%"><Text style={{ fontWeight: 'bold', fontSize: 7, textAlign: 'center' }}>Tanya Jawab</Text></Cell>
          <Cell width="10%"><Text style={{ fontWeight: 'bold', fontSize: 7, textAlign: 'center' }}>Portfolio</Text></Cell>
          <Cell width="9%"><Text style={{ fontWeight: 'bold', fontSize: 7, textAlign: 'center' }}>Reviu</Text></Cell>
        </View>

        {/* Unit Rows */}
        {kelompok.units.map((unit, idx) => (
          <View key={`row-${unit.id_unit}`} style={styles.row}>
            <Cell width="18%"><Text style={{ fontSize: 7 }}>{idx + 1}. {unit.nama_unit}</Text></Cell>
            <Cell width="15%"><Text style={{ fontSize: 7 }}>Hasil tanya jawab tentang:</Text><Text style={{ fontSize: 7 }}> {unit.nama_unit}</Text></Cell>
            <Cell width="4%"><Text style={{ textAlign: 'center' }}>L</Text></Cell>
            <Cell width="4%"><Text></Text></Cell>
            <Cell width="4%"><Text style={{ fontWeight: 'bold', textAlign: 'center' }}>T</Text></Cell>
            <Cell width="12%"><Text></Text></Cell>
            <Cell width="12%"><Text></Text></Cell>
            <Cell width="12%"><Text style={{ fontWeight: 'bold', textAlign: 'center' }}>DPT</Text></Cell>
            <Cell width="10%"><Text></Text></Cell>
            <Cell width="9%"><Text></Text></Cell>
          </View>
        ))}
      </View>
    ))}
    <View style={styles.spacer} />
  </>
);

// ============== SECTION 3 ==============
const PdfSection3 = ({ referensiForm }: { referensiForm?: ReferensiFormItem[] }) => {
  const getChecked = (refNama: string): boolean => {
    if (!referensiForm) return false;
    for (const item of referensiForm) {
      if (item.kelompok.id === 3) {
        for (const kat of item.kelompok.kategoris || []) {
          for (const sub of kat.subkategoris || []) {
            for (const ref of sub.referensis || []) {
              const n = ref.nama?.trim().replace(/\s+/g, ' ').toLowerCase() || '';
              const s = refNama.toLowerCase();
              if (n.includes(s)) return ref.value;
            }
          }
        }
      }
    }
    return false;
  };

  return (
    <>
      <View style={styles.row}>
        <HeaderCell width="100%"><Text style={styles.cellHeaderText}>3. Modifikasi dan Kontekstualisasi:</Text></HeaderCell>
      </View>

      <View style={styles.row}>
        <Cell width="60%"><Text>3.1.a Karakteristik kandidat:</Text></Cell>
        <Cell width="40%">
          <View style={{ flexDirection: 'row' }}>
            <Checkbox checked={getChecked("Karakteristik kandidat")} label="Ada" />
            <View style={{ width: 10 }} />
            <Checkbox checked={!getChecked("Karakteristik kandidat")} label="Tidak ada" />
          </View>
        </Cell>
      </View>

      <View style={styles.row}>
        <Cell width="60%"><Text>3.1.b Kebutuhan kontekstualisasi terkait tempat kerja:</Text></Cell>
        <Cell width="40%">
          <View style={{ flexDirection: 'row' }}>
            <Checkbox checked={getChecked("Kebutuhan kontekstualisasi")} label="Ada" />
            <View style={{ width: 10 }} />
            <Checkbox checked={!getChecked("Kebutuhan kontekstualisasi")} label="Tidak ada" />
          </View>
        </Cell>
      </View>

      <View style={styles.row}>
        <Cell width="60%"><Text>3.2 Saran yang diberikan oleh paket pelatihan atau pengembang pelatihan</Text></Cell>
        <Cell width="40%">
          <View style={{ flexDirection: 'row' }}>
            <Checkbox checked={getChecked("Saran yang diberikan")} label="Ada" />
            <View style={{ width: 10 }} />
            <Checkbox checked={!getChecked("Saran yang diberikan")} label="Tidak ada" />
          </View>
        </Cell>
      </View>

      <View style={styles.row}>
        <Cell width="60%"><Text>3.3 Penyesuaian perangkat asesmen terkait kebutuhan kontekstualisasi</Text></Cell>
        <Cell width="40%">
          <View style={{ flexDirection: 'row' }}>
            <Checkbox checked={getChecked("Penyesuaian perangkat asesmen")} label="Ada" />
            <View style={{ width: 10 }} />
            <Checkbox checked={!getChecked("Penyesuaian perangkat asesmen")} label="Tidak ada" />
          </View>
        </Cell>
      </View>

      <View style={styles.row}>
        <Cell width="60%"><Text>3.4 Peluang untuk kegiatan asesmen terintegrasi</Text></Cell>
        <Cell width="40%">
          <View style={{ flexDirection: 'row' }}>
            <Checkbox checked={getChecked("Peluang untuk kegiatan asesmen")} label="Ada" />
            <View style={{ width: 10 }} />
            <Checkbox checked={!getChecked("Peluang untuk kegiatan asesmen")} label="Tidak ada" />
          </View>
        </Cell>
      </View>

      <Text style={{ fontSize: 9, marginTop: 4 }}>*Pilih salah satu opsi</Text>
      <View style={styles.spacer} />
    </>
  );
};

// ============== TANDA TANGAN ==============
const PdfTandaTangan = () => (
  <>
    <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Konfirmasi dengan orang yang relevan:</Text>

    <View style={styles.row}>
      <HeaderCell width="33%"><Text style={styles.cellHeaderText}>Orang yang relevan</Text></HeaderCell>
      <HeaderCell width="33%"><Text style={styles.cellHeaderText}>Nama</Text></HeaderCell>
      <HeaderCell width="34%"><Text style={styles.cellHeaderText}>Tandatangan</Text></HeaderCell>
    </View>

    <View style={styles.row}>
      <Cell width="33%"><Checkbox checked={false} label="Manajer sertifikasi" /></Cell>
      <Cell width="33%"><Text></Text></Cell>
      <Cell width="34%"><Text></Text></Cell>
    </View>
    <View style={styles.row}>
      <Cell width="33%"><Checkbox checked={false} label="Master Assessor / Master Trainer" /></Cell>
      <Cell width="33%"><Text></Text></Cell>
      <Cell width="34%"><Text></Text></Cell>
    </View>
    <View style={styles.row}>
      <Cell width="33%"><Checkbox checked={false} label="Manajer pelatihan" /></Cell>
      <Cell width="33%"><Text></Text></Cell>
      <Cell width="34%"><Text></Text></Cell>
    </View>
    <View style={styles.row}>
      <Cell width="33%"><Checkbox checked={false} label="Lainnya:" /></Cell>
      <Cell width="33%"><Text></Text></Cell>
      <Cell width="34%"><Text></Text></Cell>
    </View>

    <View style={styles.spacer} />

    {/* Status Table */}
    <View style={styles.row}>
      <HeaderCell width="15%"><Text style={styles.cellHeaderText}>Status</Text></HeaderCell>
      <HeaderCell width="8%"><Text style={styles.cellHeaderText}>No</Text></HeaderCell>
      <HeaderCell width="25%"><Text style={styles.cellHeaderText}>Nama</Text></HeaderCell>
      <HeaderCell width="20%"><Text style={styles.cellHeaderText}>Nomor MET</Text></HeaderCell>
      <HeaderCell width="32%"><Text style={styles.cellHeaderText}>Tanda Tangan</Text></HeaderCell>
    </View>

    <View style={styles.row}>
      <Cell width="15%"><Text>Penyusun</Text></Cell>
      <Cell width="8%"><Text style={{ textAlign: 'center' }}>1</Text></Cell>
      <Cell width="25%"><Text></Text></Cell>
      <Cell width="20%"><Text></Text></Cell>
      <Cell width="32%"><Text></Text></Cell>
    </View>
    <View style={styles.row}>
      <Cell width="15%"><Text></Text></Cell>
      <Cell width="8%"><Text></Text></Cell>
      <Cell width="25%"><Text></Text></Cell>
      <Cell width="20%"><Text></Text></Cell>
      <Cell width="32%"><Text></Text></Cell>
    </View>
    <View style={styles.row}>
      <Cell width="15%"><Text>Validator</Text></Cell>
      <Cell width="8%"><Text style={{ textAlign: 'center' }}>1</Text></Cell>
      <Cell width="25%"><Text></Text></Cell>
      <Cell width="20%"><Text></Text></Cell>
      <Cell width="32%"><Text></Text></Cell>
    </View>
    <View style={styles.row}>
      <Cell width="15%"><Text></Text></Cell>
      <Cell width="8%"><Text></Text></Cell>
      <Cell width="25%"><Text></Text></Cell>
      <Cell width="20%"><Text></Text></Cell>
      <Cell width="32%"><Text></Text></Cell>
    </View>
  </>
);

// ============== MAIN DOCUMENT ==============
export function Mapa01Pdf({ judul = '', nomor = '', mapaData }: Mapa01PdfProps) {
  const kelompokKerja = mapaData?.kelompok_kerja?.kelompok_kerja || [];
  const referensiForm = mapaData?.referensi_form || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader judul={judul} nomor={nomor} />
        <PdfSection1 referensiForm={referensiForm} />
        {kelompokKerja.length > 0 && <PdfSection2 kelompokKerja={kelompokKerja} />}
        <PdfSection3 referensiForm={referensiForm} />
        <PdfTandaTangan />
      </Page>
    </Document>
  );
}

export default Mapa01Pdf;
