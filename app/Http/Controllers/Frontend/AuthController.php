<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Configuration;
use App\Models\FrontUser;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Cache;
class AuthController extends Controller
{
    /**
     * PAGES
     */
    function index(Request $req)
    {
        return Inertia::render('Frontend/SignIn', [
            'configuration' => Configuration::orderBy('id', 'desc')->first()
        ])->rootView('fe');
    }

    function register(Request $req)
    {
        return Inertia::render('Frontend/SignUp', [
            'configuration' => Configuration::orderBy('id', 'desc')->first()
        ])->rootView('fe');
    }

    public function forgotPassword(Request $request)
    {
        return Inertia::render('Frontend/ForgotPassword', [
            'configuration' => Configuration::latest()->first(),
        ])->rootView('fe');
    }

    public function resetPassword(Request $request)
    {
        return Inertia::render('Frontend/ResetPassword', [
            'configuration' => Configuration::latest()->first(),
            'email' => $request->email,
            'token' => $request->token,
        ])->rootView('fe');
    }


    /**
     * ACTIONS
     */
    public function store(Request $request)
    {
        Auth::guard('web')->logout();

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (! Auth::guard('front_user')->attempt(
            $credentials,
            $request->boolean('remember')
        )) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $request->session()->regenerate();

        $user = Auth::guard('front_user')->user();

        if ($user->active == 2) {

            Auth::guard('front_user')->logout();

            throw ValidationException::withMessages([
                'email' => 'Your account has been deactivated. Please contact admin.',
            ]);
        }

        if (! $user->hasVerifiedEmail()) {

            $key = 'verify-email-resent-' . $user->id;

            if (! Cache::has($key)) {

                $user->sendEmailVerificationNotification();

                Cache::put($key, true, now()->addMinutes(5));
            }

            Auth::guard('front_user')->logout();

            throw ValidationException::withMessages([
                'email' => 'Please verify your email address before logging in. A new verification link has been sent to your email.',
            ]);
        }

        return redirect(route('home'));
    }

    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $status = Password::broker('front_users')->sendResetLink(
            $request->only('email')
        );

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return back()->with([
            'status' => __($status),
        ]);
    }

    public function logout(Request $request)
    {
        Auth::guard('front_user')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    public function newPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $status = Password::broker('front_users')->reset(
            $request->only(
                'email',
                'password',
                'password_confirmation',
                'token'
            ),
            function ($user) use ($request) {

                $user->forceFill([
                    'password' => Hash::make($request->password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status == Password::PASSWORD_RESET) {

            return redirect()
                ->route('login')
                ->with('status', __($status));
        }

        return back()->with([
            'status' => __($status),
        ]);
    }

    public function _register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.FrontUser::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = FrontUser::create([
            'name' => $request->name,
            'email' => $request->email,
            'active' => 2,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        return redirect(route('login'))->with([
            'status' => 'Registration successful. Please check your email to verify your account.',
        ]);
    }

    public function verifyEmail(Request $request)
    {
        $user = FrontUser::find($request->id);

        if (! $user) {
            abort(404);
        }

        if (! hash_equals(
            sha1($user->getEmailForVerification()),
            $request->hash
        )) {
            abort(403);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();

            $user->active = 1;
            $user->save();
        }

        return redirect(route('login'))
            ->with('status', 'Email verified successfully.');
    }
}
