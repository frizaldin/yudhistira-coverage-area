<?php

use Illuminate\Http\Request;

function can(Request $request)
{
    if ($request->status == 'trash') {
        $url = $request->segment(2);
        $user = collect($request->user());
        $access = $user['role']['permissions'];
        foreach ($access as $key => $a) {
            if ($url == $a['menu']['key']) {
                return str_contains($a['action'], 'delete') ? true : false;
            }
        }
        return false;
    }

    return true;
}
