<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\FrontUser;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        $googleUser = Socialite::driver('google')->user();

        $user = FrontUser::firstOrCreate(
            [
                'email' => $googleUser->email,
            ],
            [
                'name' => $googleUser->name,
                'email_verified_at' => now(),
                'password' => bcrypt(str()->random(32)),
                'active' => true,
                'avatar' => $googleUser->avatar,
            ]
        );

        Auth::guard('front_user')->login($user, true);

        return redirect()->route('home');
    }
}
