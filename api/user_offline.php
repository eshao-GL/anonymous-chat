<?php
require_once '../config/config.php';

header('Content-Type: application/json');

try {
    $onlineUsersFile = ROOT_PATH . '/data/online_users.txt';
    $lockFile = ROOT_PATH . '/data/online_users.lock';
    
    // 获取文件锁
    $lockHandle = fopen($lockFile, 'w');
    if (!flock($lockHandle, LOCK_EX)) {
        throw new Exception('无法获取文件锁');
    }
    
    try {
        if (file_exists($onlineUsersFile)) {
            $onlineUsers = json_decode(file_get_contents($onlineUsersFile), true) ?: [];
            $userId = $_SERVER['REMOTE_ADDR'] . '_' . (isset($_SERVER['HTTP_USER_AGENT']) ? md5($_SERVER['HTTP_USER_AGENT']) : '');
            
            // 移除当前用户
            if (isset($onlineUsers[$userId])) {
                unset($onlineUsers[$userId]);
            }
            
            // 保存更新后的在线用户列表
            file_put_contents($onlineUsersFile, json_encode($onlineUsers));
        }
        
    } finally {
        // 释放文件锁
        flock($lockHandle, LOCK_UN);
        fclose($lockHandle);
    }
    
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    error_log("更新用户离线状态失败: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '更新用户状态失败'
    ]);
} 