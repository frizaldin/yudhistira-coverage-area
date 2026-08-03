<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Configuration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HomeController extends Controller
{
    function index(Request $req)
    {
        $data = [
            'configuration' => Configuration::orderBy('id', 'desc')->first(),
            'user' => Auth::guard('front_user')->user()
        ];

        return Inertia::render('Welcome', $data)
            ->rootView('fe');
    }
}
