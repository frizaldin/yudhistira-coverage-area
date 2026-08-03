<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CabangAreaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            ["Kode Cabang" => "DY01", "Nama Cabang" => "YOGYA A", "Nama Area" => "AREA JOGJA"],
            ["Kode Cabang" => "DY02", "Nama Cabang" => "YOGYA B", "Nama Area" => "AREA JOGJA"],
            ["Kode Cabang" => "DY04", "Nama Cabang" => "SOLO", "Nama Area" => "AREA JOGJA"],
            ["Kode Cabang" => "DY06", "Nama Cabang" => "PURWOKERTO", "Nama Area" => "AREA JOGJA"],
            ["Kode Cabang" => "DY08", "Nama Cabang" => "MAGELANG", "Nama Area" => "AREA JOGJA"],
            ["Kode Cabang" => "DY09", "Nama Cabang" => "SEMARANG", "Nama Area" => "AREA JOGJA"],
            ["Kode Cabang" => "JT03", "Nama Cabang" => "SURABAYA A", "Nama Area" => "AREA JATIM"],
            ["Kode Cabang" => "JT06", "Nama Cabang" => "SIDOARJO", "Nama Area" => "AREA JATIM"],
            ["Kode Cabang" => "JT13", "Nama Cabang" => "MALANG", "Nama Area" => "AREA JATIM"],
            ["Kode Cabang" => "JT15", "Nama Cabang" => "PROBOLINGGO", "Nama Area" => "AREA JATIM"],
            ["Kode Cabang" => "JT16", "Nama Cabang" => "KEDIRI", "Nama Area" => "AREA JATIM"],
            ["Kode Cabang" => "JT19", "Nama Cabang" => "JEMBER", "Nama Area" => "AREA JATIM"],
            ["Kode Cabang" => "JT22", "Nama Cabang" => "MADIUN", "Nama Area" => "AREA JATIM"],
            ["Kode Cabang" => "JT25", "Nama Cabang" => "PAMEKASAN", "Nama Area" => "AREA JATIM"],
            ["Kode Cabang" => "JT33", "Nama Cabang" => "SURABAYA B", "Nama Area" => "AREA JATIM"],
            ["Kode Cabang" => "JT34", "Nama Cabang" => "GRESIK", "Nama Area" => "AREA JATIM"],
            ["Kode Cabang" => "KT01", "Nama Cabang" => "DENPASAR", "Nama Area" => "AREA KTI-KAL"],
            ["Kode Cabang" => "KT03", "Nama Cabang" => "MATARAM", "Nama Area" => "AREA KTI-KAL"],
            ["Kode Cabang" => "KT04", "Nama Cabang" => "BANJARMASIN", "Nama Area" => "AREA KTI-KAL"],
            ["Kode Cabang" => "KT07", "Nama Cabang" => "SAMARINDA", "Nama Area" => "AREA KTI-KAL"],
            ["Kode Cabang" => "KT10", "Nama Cabang" => "MAKASSAR A", "Nama Area" => "AREA SULAWESI"],
            ["Kode Cabang" => "KT14", "Nama Cabang" => "PARE-PARE", "Nama Area" => "AREA SULAWESI"],
            ["Kode Cabang" => "KT15", "Nama Cabang" => "PALOPO", "Nama Area" => "AREA SULAWESI"],
            ["Kode Cabang" => "KT17", "Nama Cabang" => "KENDARI", "Nama Area" => "AREA SULAWESI"],
            ["Kode Cabang" => "KT18", "Nama Cabang" => "PALU", "Nama Area" => "AREA SULAWESI"],
            ["Kode Cabang" => "KT21", "Nama Cabang" => "MANADO", "Nama Area" => "AREA SULAWESI"],
            ["Kode Cabang" => "KT28", "Nama Cabang" => "MAKASSAR B", "Nama Area" => "AREA SULAWESI"],
            ["Kode Cabang" => "KT29", "Nama Cabang" => "PONTIANAK", "Nama Area" => "AREA KTI-KAL"],
            ["Kode Cabang" => "SM01", "Nama Cabang" => "PALEMBANG", "Nama Area" => "AREA SUMATERA"],
            ["Kode Cabang" => "SM02", "Nama Cabang" => "SUMSEL", "Nama Area" => "AREA SUMATERA"],
            ["Kode Cabang" => "SM03", "Nama Cabang" => "BANGKA", "Nama Area" => "AREA SUMATERA"],
            ["Kode Cabang" => "SM04", "Nama Cabang" => "JAMBI", "Nama Area" => "AREA SUMATERA"],
            ["Kode Cabang" => "SM05", "Nama Cabang" => "PADANG", "Nama Area" => "AREA SUMATERA"],
            ["Kode Cabang" => "SM08", "Nama Cabang" => "RIAU", "Nama Area" => "AREA SUMATERA"],
            ["Kode Cabang" => "SM10", "Nama Cabang" => "BENGKULU", "Nama Area" => "AREA SUMATERA"],
            ["Kode Cabang" => "SM11", "Nama Cabang" => "JALUKO", "Nama Area" => "AREA SUMATERA"],
            ["Kode Cabang" => "SM12", "Nama Cabang" => "BATAM", "Nama Area" => "AREA SUMATERA"],
            ["Kode Cabang" => "SM13", "Nama Cabang" => "LUBUK LINGGAU", "Nama Area" => "AREA SUMATERA"],
            ["Kode Cabang" => "SU04", "Nama Cabang" => "MEDAN UTAMA 1", "Nama Area" => "AREA SUMUT"],
            ["Kode Cabang" => "SU10", "Nama Cabang" => "RANTAU P", "Nama Area" => "AREA SUMUT"],
            ["Kode Cabang" => "SU12", "Nama Cabang" => "SIBOLGA", "Nama Area" => "AREA SUMUT"],
            ["Kode Cabang" => "SU13", "Nama Cabang" => "ACEH", "Nama Area" => "AREA SUMUT"],
            ["Kode Cabang" => "UM05", "Nama Cabang" => "UMK 2", "Nama Area" => "AREA UMK"],
            ["Kode Cabang" => "UM06", "Nama Cabang" => "UMK TANGERANG", "Nama Area" => "AREA UMK"],
            ["Kode Cabang" => "UM07", "Nama Cabang" => "UMK BOGOR", "Nama Area" => "AREA UMK"],
            ["Kode Cabang" => "UM19", "Nama Cabang" => "UMK Denpasar", "Nama Area" => "AREA UMK"],
            ["Kode Cabang" => "WS01", "Nama Cabang" => "PUTRA", "Nama Area" => "AREA JABOTABEK"],
            ["Kode Cabang" => "WS02", "Nama Cabang" => "SELATAN", "Nama Area" => "AREA JABOTABEK"],
            ["Kode Cabang" => "WS04", "Nama Cabang" => "BARAT", "Nama Area" => "AREA JABOTABEK"],
            ["Kode Cabang" => "WS06", "Nama Cabang" => "BEKASI", "Nama Area" => "AREA JABOTABEK"],
            ["Kode Cabang" => "WS13", "Nama Cabang" => "TANGERANG", "Nama Area" => "AREA JABOTABEK"],
            ["Kode Cabang" => "WS15", "Nama Cabang" => "BOGOR", "Nama Area" => "AREA JABOTABEK"],
            ["Kode Cabang" => "WS16", "Nama Cabang" => "BANDUNG", "Nama Area" => "AREA JABARPLUS"],
            ["Kode Cabang" => "WS18", "Nama Cabang" => "CIKAPURA", "Nama Area" => "AREA JABOTABEK"],
            ["Kode Cabang" => "WS21", "Nama Cabang" => "SERANG", "Nama Area" => "AREA JABARPLUS"],
            ["Kode Cabang" => "WS23", "Nama Cabang" => "CIREBON", "Nama Area" => "AREA JABARPLUS"],
            ["Kode Cabang" => "WS25", "Nama Cabang" => "TASIKMALAYA", "Nama Area" => "AREA JABARPLUS"],
            ["Kode Cabang" => "WS29", "Nama Cabang" => "LAMPUNG", "Nama Area" => "AREA JABARPLUS"],
            ["Kode Cabang" => "WS30", "Nama Cabang" => "DKI JAKARTA", "Nama Area" => "AREA JABOTABEK"]
        ];

        foreach ($data as $item) {
            $area = \App\Models\Area::firstOrCreate([
                'name' => $item['Nama Area']
            ]);

            \App\Models\Cabang::updateOrCreate(
                ['kode_cabang' => $item['Kode Cabang']],
                [
                    'area_id' => $area->id,
                    'nama_cabang' => $item['Nama Cabang']
                ]
            );
        }
    }
}
