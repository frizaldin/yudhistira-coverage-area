<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Sales;
use Illuminate\Support\Facades\DB;

$sales = Sales::all();
$grouped = $sales->groupBy('name');
foreach($grouped as $name => $items) {
    if ($items->count() > 1) {
        $keep = $items->first();
        foreach($items as $item) {
            if ($item->id !== $keep->id) {
                DB::table('sales_activities')->where('sales_id', $item->id)->update(['sales_id' => $keep->id, 'sales_name' => $keep->name]);
                try {
                    DB::table('sales_area_covers')->where('sales_id', $item->id)->update(['sales_id' => $keep->id]);
                } catch (\Exception $e) {
                    DB::table('sales_area_covers')->where('sales_id', $item->id)->delete();
                }
                // DB::table('rjs')->where('sales_id', $item->id)->update(['sales_id' => $keep->id]);
                
                // If there's a code, keep it if the current keep doesn't have it
                if (empty($keep->code) && !empty($item->code)) {
                    $keep->code = $item->code;
                    $keep->save();
                }
                
                $item->delete();
                echo "Deleted duplicate for: {$name}\n";
            }
        }
    }
}
echo "Deduplication complete.\n";
