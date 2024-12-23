# Anonymous Chat Room

一个基于 PHP 和原生 JavaScript 开发的匿名聊天室系统。支持文本、图片、语音消息，以及用户头像和昵称设置。

## 功能特点

- 💬 实时消息同步
- 📷 支持发送图片
- 🎤 支持语音消息（最长30秒）
- 😊 emoji表情支持
- 👤 自定义头像和昵称
- 🔔 新消息提醒（声音+视觉）
- 👥 在线人数显示
- 📱 移动端适配

## 技术栈

- 前端：原生 JavaScript、CSS3
- 后端：PHP 7+
- 存储：文件系统（JSON）
- 图标：Font Awesome 5

## 安装说明

1. 克隆仓库到本地
```bash
git clone https://github.com/yourusername/anonymous-chat.git
```

2. 确保服务器环境满足以下要求：
   - PHP 7.0+
   - GD 库（图片处理）
   - 文件写入权限

3. 配置目录权限
```bash
chmod -R 777 data/
chmod -R 777 assets/uploads/
chmod -R 777 assets/avatars/
chmod -R 777 logs/
```

4. 访问 index.html 即可使用

## 目录结构

```
.
├── api/                    # API接口
│   ├── get_messages.php    # 获取消息
│   ├── send_message.php    # 发送消息
│   ├── upload_file.php     # 文件上传
│   ├── user_status.php     # 用户状态管理
│   ├── online_users.php    # 在线用户统计
│   ├── user_offline.php    # 用户离线处理
│   ├── save_settings.php   # 保存用户设置
│   ├── get_settings.php    # 获取用户设置
│   └── get_preset_avatars.php # 获取预设头像
├── assets/                 # 静态资源
│   ├── css/               # 样式文件
│   │   └── style.css      # 主样式文件
│   ├── js/                # JavaScript文件
│   │   └── main.js        # 主逻辑文件
│   ├── avatars/           # 头像文件
│   │   ├── default.jpg    # 默认头像
│   │   └── preset/        # 预设头像目录
│   ├── uploads/           # 上传文件
│   │
│   │ 
│   └── sounds/            # 音效文件
│       └── notification.mp3 # 新消息提示音
├── config/                 # 配置文件
│   └── config.php         # 主配置文件
├── includes/              # PHP类文件
│   ├── Message.php        # 消息处理类
│   └── FileUpload.php     # 文件上传处理类
├── data/                  # 数据存储
│   ├── messages.json      # 消息记录
│   ├── user_settings.json # 用户设置
│   └── online_users.txt   # 在线用户记录
├── logs/                  # 日志文件
│   └── php-error.log      # PHP错误日志
└── index.html             # 入口文件
```

## 主要功能说明

### 消息系统
- 支持文本、图片、语音三种消息类型
- 消息实时同步，500ms轮询一次
- 新消息提醒（声音+视觉）
- 消息气泡样式区分自己/他人

### 用户系统
- 支持设置昵称和头像
- 提供预设头像选择
- 支持自定义头像上传
- 用户进入/离开提醒
- 在线人数统计

### 文件处理
- 图片自动压缩和裁剪
- 语音消息格式转换
- 文件类型验证
- 大小限制（默认5MB）

### 界面设计
- 响应式布局
- 移动端优化
- 暗色主题
- 动画效果

## 注意事项

1. 安全性
   - 建议在生产环境中添加用户认证
   - 建议添加消息内容过滤
   - 建议使用数据库替代文件存储

2. 性能
   - 大量消息时建议使用分页加载
   - 考虑使用 WebSocket 替代轮询
   - 建议添加消息缓存机制

3. 存储
   - 定期清理过期的上传文件
   - 监控存储空间使用情况
   - 建议设置文件上传限制


## 联系方式

- 作者：天意6233
- 邮箱：743277791@qq.com
- 项目地址：https://github.com/Eshao-GL/anonymous-chat
