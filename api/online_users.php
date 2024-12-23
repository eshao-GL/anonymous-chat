<?php
require_once '../config/config.php';

header('Content-Type: application/json');

try {
    $onlineUsersFile = ROOT_PATH . '/data/online_users.txt';
    $lockFile = ROOT_PATH . '/data/online_users.lock';
    $currentTime = time();
    
    // 获取文件锁
    $lockHandle = fopen($lockFile, 'w');
    if (!flock($lockHandle, LOCK_EX)) {
        throw new Exception('无法获取文件锁');
    }
    
    try {
        // 读取和清理在线用户
        $onlineUsers = [];
        if (file_exists($onlineUsersFile)) {
            $onlineUsers = json_decode(file_get_contents($onlineUsersFile), true) ?: [];
            
            // 清理超过5秒无活动的用户
            $onlineUsers = array_filter($onlineUsers, function($lastActive) use ($currentTime) {
                return ($currentTime - $lastActive) < 5; // 5秒
            });
        }
        
        // 更新当前用户的活动时间
        $userId = $_SERVER['REMOTE_ADDR'] . '_' . (isset($_SERVER['HTTP_USER_AGENT']) ? md5($_SERVER['HTTP_USER_AGENT']) : '');
        $onlineUsers[$userId] = $currentTime;
        
        // 保存更新后的在线用户列表
        file_put_contents($onlineUsersFile, json_encode($onlineUsers));
        
        echo json_encode([
            'success' => true,
            'online_count' => count($onlineUsers)
        ]);
        
    } finally {
        // 释放文件锁
        flock($lockHandle, LOCK_UN);
        fclose($lockHandle);
    }
    
} catch (Exception $e) {
    error_log("获取在线人数失败: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '获取在线人数失败'
    ]);
} 