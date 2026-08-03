<?php

namespace App\Http\Controllers;

use App\Models\Configuration;
use App\Services\ConfigurationServices;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConfigurationController extends Controller
{
    private string $title;
    private string $code;

    public function __construct(
        private ConfigurationServices $services
    ) {
        $this->title = 'Configuration';
        $this->code = 'configuration';
    }

    /**
     * PAGES
     */
    function index(Request $request)
    {
        return Inertia::render('Configuration/Index', [
            'item' => Configuration::orderBy('id', 'desc')->first(),
            'title' => $this->title,
            'code' => $this->code,
         ]);
    }

    /**
     * ACTIONS
     */
    function update(Request $request)
    {
        return $this->services->update($request, params: [
            'code' => $this->code,
            'title' => $this->title,
        ]);
    }
}
