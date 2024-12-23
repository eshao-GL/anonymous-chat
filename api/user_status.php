<?php
require_once '../config/config.php';

header('Content-Type: application/json');

try {
    $clientId = $_POST['clientId'] ?? '';
    $action = $_POST['action'] ?? ''; // 'join' 或 'leave'
    $nickname = $_POST['nickname'] ?? '匿名用户';
    
    if (!$clientId || !$action) {
        throw new Exception('参数不完整');
    }
    
    // 读取消息文件
    $messagesFile = ROOT_PATH . '/data/messages.json';
    $messages = [];
    if (file_exists($messagesFile)) {
        $messages = json_decode(file_get_contents($messagesFile), true) ?? [];
    }
    
    // 创建系统消息
    $message = [
        'id' => uniqid(),
        'type' => 'system',
        'content' => $action === 'join' ? 
            "{$nickname} 进入了聊天室" : 
            "{$nickname} 离开了聊天室",
        'timestamp' => time(),
        'clientId' => $clientId,
        'nickname' => $nickname,
        'date' => [
            'year' => date('Y'),
            'month' => date('m'),
            'day' => date('d')
        ]
    ];
    
    // 添加消息
    $messages[] = $message;
    
    // 保存消息
    if (file_put_contents($messagesFile, json_encode($messages)) === false) {
        throw new Exception('无法保存消息');
    }
    
    echo json_encode([
        'success' => true,
        'message' => $message
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} 