@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
    <img src="{{ $config['url_logo'] ?? 'images/default-logo.png' }}" style="width: 100%; height:100px;" class="logo">
</a>
</td>
</tr>
