<?php
header('Content-Type: application/json; charset=utf-8');

$baseDir = __DIR__ . '/TypeAnim';
if (!is_dir($baseDir)) {
  mkdir($baseDir, 0777, true);
}

// 尺寸 → 文件夹名映射（Windows 不允许冒号作为文件夹名）
$sizeFolderMap = [
  '16:9' => '16x9',
  '4:3' => '4x3',
  '1:1' => '1x1',
  '3:4' => '3x4',
  '9:16' => '9x16'
];

// 获取尺寸参数，默认 16:9
$size = $_REQUEST['size'] ?? '16:9';
if (!isset($sizeFolderMap[$size])) {
  $size = '16:9';
}
$folder = $sizeFolderMap[$size];
$dir = $baseDir . '/' . $folder;

// 自动迁移：首次访问 16x9 时将根目录的 JSON 文件移入
if ($size === '16:9' && !is_dir($dir)) {
  mkdir($dir, 0777, true);
  // 将根目录已有的 JSON 文件迁移到 16x9 子文件夹
  foreach (scandir($baseDir) as $f) {
    if ($f === '.' || $f === '..') continue;
    $rootFile = $baseDir . '/' . $f;
    if (is_file($rootFile) && pathinfo($f, PATHINFO_EXTENSION) === 'json') {
      @rename($rootFile, $dir . '/' . $f);
    }
  }
}

// 确保目录存在
if (!is_dir($dir)) {
  mkdir($dir, 0777, true);
}

// 保存文件
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'save') {
  $file = basename($_POST['file'] ?? '');
  $data = $_POST['data'] ?? '';
  if ($file && pathinfo($file, PATHINFO_EXTENSION) === 'json' && $data) {
    $path = $dir . '/' . $file;
    $bytes = @file_put_contents($path, $data);
    if ($bytes !== false) {
      echo json_encode(['status' => 'ok', 'file' => $file, 'mtime' => filemtime($path)], JSON_UNESCAPED_UNICODE);
    } else {
      echo json_encode(['status' => 'fail'], JSON_UNESCAPED_UNICODE);
    }
  } else {
    echo json_encode(['status' => 'invalid'], JSON_UNESCAPED_UNICODE);
  }
  exit;
}

// 删除文件
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete') {
  $file = basename($_POST['file'] ?? '');
  if ($file && pathinfo($file, PATHINFO_EXTENSION) === 'json') {
    $path = $dir . '/' . $file;
    if (is_file($path) && @unlink($path)) {
      echo 'ok';
    } else {
      echo 'fail';
    }
  } else {
    echo 'invalid';
  }
  exit;
}

// 重命名文件
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'rename') {
  $oldFile = basename($_POST['old'] ?? '');
  $newFile = basename($_POST['new'] ?? '');
  if ($oldFile && $newFile && pathinfo($oldFile, PATHINFO_EXTENSION) === 'json' && pathinfo($newFile, PATHINFO_EXTENSION) === 'json') {
    $oldPath = $dir . '/' . $oldFile;
    $newPath = $dir . '/' . $newFile;
    if (!is_file($oldPath)) {
      echo 'notfound';
    } elseif (is_file($newPath)) {
      echo 'exists';
    } elseif (@rename($oldPath, $newPath)) {
      echo 'ok';
    } else {
      echo 'fail';
    }
  } else {
    echo 'invalid';
  }
  exit;
}

// 复制文件
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'copy') {
  $srcFile = basename($_POST['src'] ?? '');
  if ($srcFile && pathinfo($srcFile, PATHINFO_EXTENSION) === 'json') {
    $srcPath = $dir . '/' . $srcFile;
    if (!is_file($srcPath)) {
      echo 'notfound';
      exit;
    }
    $base = pathinfo($srcFile, PATHINFO_FILENAME);
    $newFile = $base . '_副本.json';
    $newPath = $dir . '/' . $newFile;
    $i = 2;
    while (is_file($newPath)) {
      $newFile = $base . '_副本' . $i . '.json';
      $newPath = $dir . '/' . $newFile;
      $i++;
    }
    if (@copy($srcPath, $newPath)) {
      echo json_encode(['status' => 'ok', 'file' => $newFile], JSON_UNESCAPED_UNICODE);
    } else {
      echo json_encode(['status' => 'fail']);
    }
  } else {
    echo json_encode(['status' => 'invalid']);
  }
  exit;
}

// 列出文件
$files = [];
foreach (scandir($dir) as $f) {
  if ($f === '.' || $f === '..') continue;
  if (pathinfo($f, PATHINFO_EXTENSION) === 'json') {
    $filePath = $dir . '/' . $f;
    $files[] = [
      'name' => $f,
      'mtime' => filemtime($filePath)
    ];
  }
}
// 按修改时间倒序排列
usort($files, function($a, $b) {
  return $b['mtime'] - $a['mtime'];
});
echo json_encode($files, JSON_UNESCAPED_UNICODE);
