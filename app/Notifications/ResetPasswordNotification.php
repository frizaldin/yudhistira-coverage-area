<?php

namespace App\Notifications;

use App\Models\Configuration;
use App\Models\User;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Auth\Notifications\ResetPassword;

class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable)
    {
        $url = url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        $user = User::where('email', $notifiable->getEmailForPasswordReset())->first();
        $config = Configuration::first()?->toArray();

        return (new MailMessage)
            ->subject('Reset your password')
            ->greeting('Halo ' . $user->name . '!')
            ->line('You are receiving this email because we received a password reset request for your account.')
            ->action('Reset Password', $url)
            ->line('This password reset link will expire in 60 minutes.')
            ->line('If you did not request a password reset, please ignore this email.')
            ->salutation(' ');
    }
}
