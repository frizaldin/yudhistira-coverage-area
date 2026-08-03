<?php

use Spatie\ImageOptimizer\OptimizerChainFactory;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Http\UploadedFile;

function ensureFolder(string $path)
{
    $fullPath = env('FILE_PATH').$path;

    if (!file_exists($fullPath)) {
        mkdir($fullPath, 0755, true);
    }
}

/**
 * CALL FUCTION
 * uploadSpatie($request->file('image'))
 */
function uploadSpatie(UploadedFile $file, $raw_dir = 'uploads')
{
    if (!$file) return null;

    ensureFolder($raw_dir);

    $dir = env('FILE_PATH').$raw_dir;

    $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();

    $file->move($dir, $filename);

    $fullPath = $dir . '/' . $filename;

    $optimizerChain = OptimizerChainFactory::create();
    $optimizerChain->optimize($fullPath);

    return $raw_dir . '/' . $filename;
}

/**
 * CALL FUCTION
 * uploadIntervention($request->file('image'))
 */
function uploadIntervention(
    UploadedFile $file,
    string $raw_dir = 'uploads',
    ?int $width = 1280
): ?string
{
    ensureFolder($raw_dir);

    $dir = env('FILE_PATH') . $raw_dir;

    $manager = new ImageManager(new Driver());

    $filename = time() . '_' . uniqid() . '.webp';
    $fullPath = $dir . '/' . $filename;

    $image = $manager->read($file);

    if ($width) {
        $image = $image->scaleDown(width: $width);
    }

    $image->toWebp(85)->save($fullPath);

    return $raw_dir . '/' . $filename;
}

/**
 * CALL FUCTION
 * uploadHybrid($request->file('image'))
 */
function uploadHybrid(
    UploadedFile $file,
    $raw_dir = 'uploads',
    ?int $width = 1280
)
{
    if (!$file) return null;

    ensureFolder($raw_dir);

    $dir = env('FILE_PATH').$raw_dir;

    $filename = time() . '_' . uniqid() . '.webp';
    $fullPath = $dir . '/' . $filename;

    $manager = new ImageManager(new Driver());

    $image = $manager->read($file);

    if ($width) {
        $image = $image->scaleDown(width: $width);
    }

    $image->toWebp(85)->save($fullPath);

    if (function_exists('proc_open')) {
        $optimizerChain = OptimizerChainFactory::create();
        $optimizerChain->optimize($fullPath);
    }

    return $raw_dir . '/' . $filename;
}

/**
 * CALL FUCTION
 * uploadHybrid($request->file('file'))
 */
function uploadFile(UploadedFile $file, $raw_dir = 'uploads')
{
    if (!$file) return null;

    $dir = $raw_dir;

    $fullDir = env('FILE_PATH').$dir;

    ensureFolder($dir);

    $ext = $file->getClientOriginalExtension();

    $filename = time() . '_' . uniqid() . '.' . $ext;

    $file->move($fullDir, $filename);

    return $raw_dir . '/' . $filename;
}

/**
 * CALL FUNCION
 * removeFile($file)
 */
function removeFile(string $file)
{
    if (!$file) return false;

    if (str_contains($file, 'storage_seeder')) {
        return false;
    }

    $fullPath = env('FILE_PATH').$file;

    if (file_exists($fullPath)) {
        return unlink($fullPath);
    }

    return false;
}
