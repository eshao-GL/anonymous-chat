<?php
require_once '../config/config.php';

header('Content-Type: application/json');

try {
    $clientId = $_GET['clientId'] ?? '';
    
    if (!$clientId) {
        throw new Exception('缺少客户端ID');
    }
    
    $settingsFile = ROOT_PATH . '/data/user_settings.json';
    $settings = [];
    
    if (file_exists($settingsFile)) {
        $settings = json_decode(file_get_contents($settingsFile), true) ?? [];
    }
    
    $userSettings = $settings[$clientId] ?? [
        'nickname' => '匿名用户',
        'avatar' => 'assets/avatars/default.jpg',
        'updated_at' => time()
    ];
    
    echo json_encode([
        'success' => true,
        'data' => $userSettings
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} 