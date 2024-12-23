<?php
require_once '../config/config.php';
require_once '../includes/Message.php';

header('Content-Type: application/json');

try {
    $after = isset($_GET['after']) ? $_GET['after'] : null;
    
    $messageHandler = new Message();
    $messages = $messageHandler->getMessages($after);
    
    echo json_encode([
        'success' => true,
        'data' => $messages
    ]);
    
} catch (Exception $e) {
    error_log("获取消息失败: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} 