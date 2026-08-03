<?php

use Illuminate\Support\Facades\Route;

// Redirect root to admin system
Route::get('/', fn() => redirect('/system'));

require __DIR__ . '/auth.php';

