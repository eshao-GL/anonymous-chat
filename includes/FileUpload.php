<?php
class FileUpload {
    private $uploadPath;
    
    public function __construct() {
        $this->uploadPath = UPLOAD_PATH;
        
        // 确保上传目录存在并可写
        if (!is_dir($this->uploadPath)) {
            if (!mkdir($this->uploadPath, 0777, true)) {
                error_log('Failed to create upload directory: ' . $this->uploadPath);
                throw new Exception('无法创建上传目录');
            }
        }
        
        // 确保目录可写
        if (!is_writable($this->uploadPath)) {
            chmod($this->uploadPath, 0777);
            if (!is_writable($this->uploadPath)) {
                error_log('Upload directory is not writable: ' . $this->uploadPath);
                throw new Exception('上传目录没有写入权限');
            }
        }
    }
    
    public function uploadFile($file, $type) {
        try {
            // 检查文件大小
            if ($file['size'] > MAX_FILE_SIZE) {
                error_log('文件过大');
                return false;
            }
            
            // 生成唯一文件名
            $fileName = uniqid() . ($type === 'audio' ? '.webm' : '.jpg');
            $filePath = $this->uploadPath . $fileName;
            
            // 移动文件
            if (!move_uploaded_file($file['tmp_name'], $filePath)) {
                error_log('移动文件失败');
                return false;
            }
            
            // 设置文件权限
            chmod($filePath, 0666);
            
            return $fileName;
            
        } catch (Exception $e) {
            error_log('文件上传失败: ' . $e->getMessage());
            return false;
        }
    }
} 