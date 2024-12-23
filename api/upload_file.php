<?php
require_once '../config/config.php';
require_once '../includes/FileUpload.php';

header('Content-Type: application/json');

try {
    if (empty($_FILES['file'])) {
        throw new Exception('没有接收到文件');
    }
    
    $file = $_FILES['file'];
    
    error_log("接收到文件上传: " . print_r($file, true));
    
    // 检查文件上传错误
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('文件上传错误: ' . $file['error']);
    }
    
    // 检查MIME类型
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    error_log("文件MIME类型: " . $mimeType);
    
    // 确定文件类型
    $type = 'image';
    if (strpos($mimeType, 'audio') !== false || 
        strpos($mimeType, 'video/webm') !== false || 
        strpos($file['type'], 'audio') !== false) {
        $type = 'audio';
    }
    
    $uploader = new FileUpload();
    $filename = $uploader->uploadFile($file, $type);
    
    if ($filename === false) {
        throw new Exception('文件上传失败');
    }
    
    // 验证文件是否实际上传成功
    $uploadedFile = UPLOAD_PATH . $filename;
    if (!file_exists($uploadedFile)) {
        throw new Exception('文件保存失败');
    }
    
    echo json_encode([
        'success' => true,
        'filename' => $filename,
        'type' => $type,
        'size' => filesize($uploadedFile)
    ]);
    
} catch (Exception $e) {
    error_log("上传错误: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} 