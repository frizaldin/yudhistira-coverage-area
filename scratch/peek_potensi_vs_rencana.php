<?php
require __DIR__ . "/../vendor/autoload.php";
$app = require __DIR__ . "/../bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$year = 2026;
$ids = App\Models\Customer::where("cabang_id", 52)->pluck("id");
$acIds = App\Models\CustomerPlan::whereIn("customer_id", $ids)->where("year", $year)->where("is_ac", 1)->distinct()->pluck("customer_id");
$agg = App\Models\CustomerPlan::whereIn("customer_id", $acIds)->where("year", $year)
  ->selectRaw("SUM(potential_exemplar) as pot, SUM(target_exemplar) as tgt, SUM(real_exemplar) as realx, COUNT(DISTINCT customer_id) as ac")
  ->first();
echo "AC={$agg->ac} potensi=" . round($agg->pot) . " rencana=" . round($agg->tgt) . " real=" . round($agg->realx) . "\n";
