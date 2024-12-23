<?php
require_once '../config/config.php';
require_once '../includes/Message.php';

header('Content-Type: application/json');

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('无效的消息数据');
    }
    
    $messageHandler = new Message();
    $messageId = $messageHandler->saveMessage($data);
    
    if (!$messageId) {
        throw new Exception('保存消息失败');
    }
    
    echo json_encode([
        'success' => true,
        'message' => '消息发送成功',
        'message_id' => $messageId
    ]);
    
} catch (Exception $e) {
    error_log("发送消息失败: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} 