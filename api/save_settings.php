<?php
require_once '../config/config.php';

header('Content-Type: application/json');

try {
    $clientId = $_POST['clientId'] ?? '';
    $nickname = $_POST['nickname'] ?? '';
    $avatarUrl = null;
    
    // 添加调试日志
    error_log("Received request for client: $clientId");
    error_log("POST data: " . print_r($_POST, true));
    error_log("FILES data: " . print_r($_FILES, true));
    
    // 处理头像上传
    if (isset($_FILES['avatar'])) {
        $file = $_FILES['avatar'];
        $fileName = uniqid() . '_' . $clientId . '.jpg';
        $targetPath = ROOT_PATH . '/assets/avatars/' . $fileName;
        
        // 检查并创建头像目录
        if (!is_dir(dirname($targetPath))) {
            mkdir(dirname($targetPath), 0777, true);
        }
        
        // 处理图片
        $image = imagecreatefromstring(file_get_contents($file['tmp_name']));
        $width = imagesx($image);
        $height = imagesy($image);
        
        // 创建正方形画布
        $size = min($width, $height);
        $newImage = imagecreatetruecolor(100, 100);
        
        // 裁剪并缩放图片
        imagecopyresampled(
            $newImage, $image,
            0, 0,
            ($width - $size) / 2, ($height - $size) / 2,
            100, 100, $size, $size
        );
        
        // 保存图片
        imagejpeg($newImage, $targetPath, 90);
        imagedestroy($image);
        imagedestroy($newImage);
        
        $avatarUrl = 'assets/avatars/' . $fileName;
    } 
    // 如果是预设头像
    else if (isset($_POST['avatarUrl'])) {
        $avatarUrl = $_POST['avatarUrl'];
        
        // 验证文件是否存在
        $fullPath = ROOT_PATH . '/' . urldecode($avatarUrl);
        error_log("Checking file: $fullPath");
        
        if (!file_exists($fullPath)) {
            // 尝试使用原始路径
            $fullPath = ROOT_PATH . '/' . $avatarUrl;
            if (!file_exists($fullPath)) {
                error_log("File does not exist: $fullPath");
                throw new Exception('头像文件不存在');
            }
        }
    }
    
    // 保存用户设置
    $settingsFile = ROOT_PATH . '/data/user_settings.json';
    $settings = [];
    
    if (file_exists($settingsFile)) {
        $settings = json_decode(file_get_contents($settingsFile), true) ?? [];
    }
    
    $settings[$clientId] = [
        'nickname' => $nickname,
        'avatar' => $avatarUrl,
        'updated_at' => time()
    ];
    
    // 添加调试日志
    error_log("Saving settings: " . json_encode($settings[$clientId]));
    
    // 确保目录存在
    if (!is_dir(dirname($settingsFile))) {
        mkdir(dirname($settingsFile), 0777, true);
    }
    
    // 保存设置
    if (file_put_contents($settingsFile, json_encode($settings)) === false) {
        throw new Exception('无法保存设置文件');
    }
    
    // 验证设置是否已保存
    $savedSettings = json_decode(file_get_contents($settingsFile), true);
    if (!isset($savedSettings[$clientId])) {
        throw new Exception('设置保存验证失败');
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'nickname' => $nickname,
            'avatar' => $avatarUrl
        ]
    ]);
    
} catch (Exception $e) {
    error_log("保存设置失败: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} 