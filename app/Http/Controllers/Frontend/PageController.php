<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PageController extends Controller
{

    public function termsConditions()
    {
        return Inertia::render('TermsConditions')->rootView('fe');
    }

    public function privacyPolicy()
    {
        return Inertia::render('PrivacyPolicy')->rootView('fe');
    }
}
