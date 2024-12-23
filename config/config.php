<?php
// 定义网站根目录
define('ROOT_PATH', dirname(__DIR__));

// 上传文件配置
define('UPLOAD_PATH', ROOT_PATH . '/assets/uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB

// 消息存储路径
define('MESSAGES_FILE', ROOT_PATH . '/data/messages.txt');

// 在线用户文件路径
define('ONLINE_USERS_FILE', ROOT_PATH . '/data/online_users.txt');

// 确保目录存在
if (!is_dir(UPLOAD_PATH)) {
    mkdir(UPLOAD_PATH, 0777, true);
}

if (!is_dir(dirname(MESSAGES_FILE))) {
    mkdir(dirname(MESSAGES_FILE), 0777, true);
}

// 确保在线用户文件目录存在
if (!is_dir(dirname(ONLINE_USERS_FILE))) {
    mkdir(dirname(ONLINE_USERS_FILE), 0777, true);
}

// 设置错误日志
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', ROOT_PATH . '/logs/php-error.log');

// 创建日志目录
if (!is_dir(ROOT_PATH . '/logs')) {
    mkdir(ROOT_PATH . '/logs', 0777, true);
}

// 添加安全头
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
header('Content-Security-Policy: upgrade-insecure-requests');