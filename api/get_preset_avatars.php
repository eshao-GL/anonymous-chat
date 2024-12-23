<?php
require_once '../config/config.php';

header('Content-Type: application/json');

try {
    $avatarPath = ROOT_PATH . '/assets/avatars/';
    $avatars = array_filter(scandir($avatarPath), function($file) {
        // 排除 . 和 .. 目录
        if ($file === '.' || $file === '..') {
            return false;
        }
        
        // 排除默认头像
        if ($file === 'default.jpg' || $file === 'default.png') {
            return false;
        }
        
        // 检查是否是图片文件
        $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif'])) {
            return false;
        }
        
        // 排除用户上传的头像（通常包含 uniqid 生成的字符串）
        if (strpos($file, '_') !== false) {
            return false;
        }
        
        return true;
    });
    
    echo json_encode([
        'success' => true,
        'avatars' => array_values($avatars)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} 