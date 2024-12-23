<?php

class Message {
    private $messagesFile;
    
    public function __construct() {
        $this->messagesFile = MESSAGES_FILE;
    }
    
    public function saveMessage($data) {
        try {
            $messages = $this->loadMessagesFromFile();
            
            // 获取用户设置
            $settingsFile = ROOT_PATH . '/data/user_settings.json';
            $settings = [];
            if (file_exists($settingsFile)) {
                $settings = json_decode(file_get_contents($settingsFile), true) ?? [];
            }
            
            // 获取用户信息
            $userSettings = $settings[$data['clientId']] ?? [
                'nickname' => '匿名用户',
                'avatar' => 'assets/avatars/default.jpg'
            ];
            
            // 获取当前时间戳
            $timestamp = time();
            $dateTime = new DateTime();
            $dateTime->setTimestamp($timestamp);
            
            // 添加时间戳、日期和消息ID，以及用户信息
            $message = [
                'id' => uniqid(),
                'type' => $data['type'],
                'content' => $data['content'],
                'timestamp' => $timestamp,
                'clientId' => $data['clientId'],
                'nickname' => $userSettings['nickname'],
                'avatar' => $userSettings['avatar'],
                'date' => [
                    'year' => $dateTime->format('Y'),
                    'month' => $dateTime->format('m'),
                    'day' => $dateTime->format('d'),
                    'hour' => $dateTime->format('H'),
                    'minute' => $dateTime->format('i'),
                    'second' => $dateTime->format('s')
                ]
            ];
            
            $messages[] = $message;
            
            if (file_put_contents($this->messagesFile, json_encode($messages)) === false) {
                throw new Exception('无法保存消息');
            }
            
            return $message['id'];
        } catch (Exception $e) {
            error_log("保存消息失败: " . $e->getMessage());
            return false;
        }
    }
    
    public function getMessages($after = null) {
        try {
            $messages = $this->loadMessagesFromFile();
            error_log("Total messages in file: " . count($messages));
            
            // 如果消息文件为空，直接返回空数组
            if (empty($messages)) {
                error_log("No messages in file");
                return [];
            }
            
            // 如果没有指定after参数，返回所有消息
            if ($after === null) {
                error_log("First load, returning all messages");
                return $messages;
            }
            
            // 找到指定ID的消息索引
            $afterIndex = -1;
            foreach ($messages as $i => $msg) {
                if ($msg['id'] === $after) {
                    $afterIndex = $i;
                    error_log("Found message at index: " . $i);
                    break;
                }
            }
            
            // 如果找不到指定ID，返回所有消息
            if ($afterIndex === -1) {
                error_log("Message ID not found, returning all messages");
                return $messages;
            }
            
            // 返回指定ID之后的所有消息（包括当前消息）
            $newMessages = array_slice($messages, $afterIndex + 1);
            error_log("Returning " . count($newMessages) . " messages after index " . $afterIndex);
            
            // 如果没有新消息，返回最后一条消息
            if (empty($newMessages) && isset($messages[$afterIndex])) {
                error_log("No new messages, returning last message");
                return [$messages[$afterIndex]];
            }
            
            return $newMessages;
            
        } catch (Exception $e) {
            error_log("获取消息失败: " . $e->getMessage());
            return [];
        }
    }
    
    private function loadMessagesFromFile() {
        if (!file_exists($this->messagesFile)) {
            error_log("Messages file does not exist");
            return [];
        }
        
        $content = file_get_contents($this->messagesFile);
        if ($content === false) {
            error_log("Failed to read messages file");
            throw new Exception('无法读取消息文件');
        }
        
        $messages = json_decode($content, true);
        if (!is_array($messages)) {
            error_log("Invalid messages data in file");
            return [];
        }
        
        return $messages;
    }
} 