class ChatRoom {
    constructor() {
        // 首先初始化客户端ID
        this.initializeClientId();
        
        // 获取DOM元素
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.emojiBtn = document.getElementById('emojiBtn');
        this.imageBtn = document.getElementById('imageBtn');
        this.audioBtn = document.getElementById('audioBtn');
        this.imagePreviewModal = document.getElementById('imagePreviewModal');
        this.notificationSound = document.getElementById('notificationSound');
        
        // 初始化状态
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.lastMessageId = null;
        this.isPolling = false;
        this.touchStartY = 0;
        this.isScrolling = false;
        
        // 添加消息缓存
        this.messageCache = new Map();
        
        // 获取在线人数元素（不再创建新元素）
        this.onlineCount = document.querySelector('.online-count');
        
        // 添加新消息提示元素
        this.newMessagesAlert = document.createElement('div');
        this.newMessagesAlert.className = 'new-messages-alert';
        this.newMessagesAlert.style.display = 'none';
        this.newMessagesAlert.addEventListener('click', () => {
            this.scrollToBottom();
            this.hideNewMessagesAlert();
        });
        document.body.appendChild(this.newMessagesAlert);
        
        // 添加未读消息计数
        this.unreadCount = 0;
        
        // 修改音效播放状态的初始化
        this.soundEnabled = false;
        
        // 尝试预加载音频
        this.notificationSound.load();
        
        // 初始化音效
        this.notificationSound.volume = 1;
        
        // 添加用户交互监听，用于启用音效
        document.addEventListener('click', () => {
            this.notificationSound.play().then(() => {
                this.notificationSound.pause();
                this.soundEnabled = true;
            }).catch(() => {});
        }, { once: true });
        
        this.initializeEventListeners();
        this.initializeEmojiPicker();
        this.initializeImagePreview();
        this.initializeAudioPlayers();
        
        // 开始轮询新消息和在线人数
        this.startPolling();
        this.startOnlinePolling();
        
        // 添加触摸和滚动控制
        this.initializeTouchControl();
        
        // 添加页面卸载事件
        window.addEventListener('beforeunload', () => {
            // 发送用户离线请求
            navigator.sendBeacon('api/user_offline.php');
        });
        
        // 添加设置相关元素
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.settingsClose = document.querySelector('.settings-close');
        this.nicknameInput = document.getElementById('nicknameInput');
        this.currentAvatar = document.getElementById('currentAvatar');
        this.avatarInput = document.getElementById('avatarInput');
        this.changeAvatarBtn = document.getElementById('changeAvatarBtn');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        
        // 初始化设置
        this.initializeSettings();
        
        // 初始化用户状态监听
        this.initializeUserStatus();
        
        // 将实例保存到全局变量
        window.chatRoom = this;
    }
    
    initializeEventListeners() {
        // 发送按钮点击事件
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // 输�������������回车发送
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // 图片上传
        this.imageBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => this.handleImageUpload(e.target.files[0]);
            input.click();
        });
        
        // 录音按钮
        this.audioBtn.addEventListener('click', () => this.toggleAudioRecording());
        
        // 自动调整输入框高度
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 150) + 'px';
        });
        
        // 使用 passive 监听滚动事件以提高性能
        this.chatMessages.addEventListener('scroll', () => {
            const isAtBottom = this.chatMessages.scrollHeight - this.chatMessages.scrollTop <= this.chatMessages.clientHeight + 50;
            if (isAtBottom) {
                this.hideNewMessagesAlert();
            }
        }, { passive: true });
    }
    
    initializeEmojiPicker() {
        const emojis = ['😊', '😂', '🤣', '❤️', '👍', '🌟', '🤔', '😢', '🙏', '🥰', '🤗'];
        const picker = document.createElement('div');
        picker.className = 'emoji-picker';
        
        emojis.forEach(emoji => {
            const span = document.createElement('span');
            span.textContent = emoji;
            span.onclick = () => {
                this.messageInput.value += emoji;
                picker.style.display = 'none';
            };
            picker.appendChild(span);
        });
        
        this.emojiBtn.parentNode.appendChild(picker);
        
        this.emojiBtn.onclick = () => {
            picker.style.display = picker.style.display === 'grid' ? 'none' : 'grid';
        };
        
        document.addEventListener('click', (e) => {
            if (!this.emojiBtn.contains(e.target) && !picker.contains(e.target)) {
                picker.style.display = 'none';
            }
        });
    }
    
    initializeImagePreview() {
        this.imagePreviewModal.addEventListener('click', () => {
            this.imagePreviewModal.classList.remove('active');
        });
    }
    
    initializeAudioPlayers() {
        this.chatMessages.addEventListener('click', (e) => {
            const player = e.target.closest('.audio-player');
            if (!player) return;
            
            const audio = document.getElementById(player.dataset.audioId);
            const playIcon = player.querySelector('.audio-play-btn i');
            
            if (audio.paused) {
                // 停止所有其他正在播放的音频
                document.querySelectorAll('audio').forEach(a => {
                    if (a !== audio && !a.paused) {
                        a.pause();
                        const otherPlayer = document.querySelector(`[data-audio-id="${a.id}"]`);
                        otherPlayer.classList.remove('playing');
                        otherPlayer.querySelector('i').className = 'fas fa-play';
                    }
                });
                
                // 播放当前音频
                audio.play().then(() => {
                    player.classList.add('playing');
                    playIcon.className = 'fas fa-pause';
                }).catch(error => {
                    console.error('播放失败:', error);
                    alert('音频播放失败，���重试');
                    playIcon.className = 'fas fa-play';
                });
            } else {
                audio.pause();
                player.classList.remove('playing');
                playIcon.className = 'fas fa-play';
            }
            
            // 放束时重置
            audio.addEventListener('ended', () => {
                player.classList.remove('playing');
                playIcon.className = 'fas fa-play';
            });
        });
    }
    
    initializeTouchControl() {
        let startY = 0;
        let startScrollTop = 0;
        
        this.chatMessages.addEventListener('touchstart', (e) => {
            startY = e.touches[0].pageY;
            startScrollTop = this.chatMessages.scrollTop;
            this.isScrolling = true;
        });
        
        this.chatMessages.addEventListener('touchmove', (e) => {
            const deltaY = e.touches[0].pageY - startY;
            this.chatMessages.scrollTop = startScrollTop - deltaY;
        });
        
        this.chatMessages.addEventListener('touchend', () => {
            // 延迟重置滚动状态，让最后的滚动动画完成
            setTimeout(() => {
                this.isScrolling = false;
            }, 100);
        });
    }
    
    async sendMessage(type = 'text', content = null) {
        const messageContent = content || this.messageInput.value.trim();
        if (!messageContent) return;
        
        try {
            const response = await fetch('api/send_message.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: type,
                    content: messageContent,
                    clientId: this.clientId
                })
            });
            
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.message || '发送失败');
            }
            
            // 发送第一条消息后启用音效
            this.soundEnabled = true;
            
            // 清空输入框
            if (type === 'text') {
                this.messageInput.value = '';
                this.messageInput.style.height = 'auto';
            }
            
            // 立即获取新消息
            this.pollMessages();
            
        } catch (error) {
            console.error('发送消息失败:', error);
            alert('发送消息失败: ' + error.message);
        }
    }
    
    async handleImageUpload(file) {
        try {
            // 显示上传进度提示
            const loadingMessage = this.showLoadingMessage('正在上传图片...');
            
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('api/upload_file.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            this.removeLoadingMessage(loadingMessage);
            
            if (!result.success) {
                throw new Error(result.message || '上传失败');
            }
            
            await this.sendMessage('image', result.filename);
            
        } catch (error) {
            console.error('上传图片失败:', error);
            alert('上传图片失败: ' + error.message);
        }
    }
    
    async toggleAudioRecording() {
        try {
            if (!this.isRecording) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                
                this.audioChunks = [];
                
                const options = {
                    mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
                };
                
                this.mediaRecorder = new MediaRecorder(stream, options);
                
                this.mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        this.audioChunks.push(e.data);
                    }
                };
                
                this.mediaRecorder.onstop = async () => {
                    try {
                        const mimeType = this.mediaRecorder.mimeType;
                        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
                        
                        const audioFile = new File([audioBlob], 'audio.' + (mimeType.includes('webm') ? 'webm' : 'ogg'), {
                            type: mimeType,
                            lastModified: Date.now()
                        });
                        
                        await this.uploadAudio(audioFile);
                    } catch (error) {
                        console.error('处理录音数据失败:', error);
                        alert('处理录音失败: ' + error.message);
                    } finally {
                        stream.getTracks().forEach(track => track.stop());
                    }
                };
                
                // 开始录音
                this.mediaRecorder.start();
                this.isRecording = true;
                this.audioBtn.classList.add('recording');
                
                // 添加录音指示器
                const indicator = document.createElement('div');
                indicator.className = 'recording-indicator';
                indicator.innerHTML = `
                    <div class="recording-dot"></div>
                    <span>正在录音...</span>
                `;
                this.audioBtn.parentNode.appendChild(indicator);
                
                // 3秒后自动停止录音
                setTimeout(() => {
                    if (this.isRecording) {
                        this.toggleAudioRecording();
                    }
                }, 3000);
                
            } else {
                // 停止录音
                this.mediaRecorder.stop();
                this.isRecording = false;
                this.audioBtn.classList.remove('recording');
                
                // 除录音指示器
                const indicator = document.querySelector('.recording-indicator');
                if (indicator) {
                    indicator.remove();
                }
            }
        } catch (error) {
            console.error('录音失败:', error);
            alert('无法访问麦克风，请确保已授予录音权限');
        }
    }
    
    async uploadAudio(audioFile) {
        try {
            const loadingMessage = this.showLoadingMessage('正在上传语音...');
            
            const formData = new FormData();
            formData.append('file', audioFile);
            
            const response = await fetch('api/upload_file.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            this.removeLoadingMessage(loadingMessage);
            
            if (!response.ok || !result.success) {
                throw new Error(result.message || '上传失败');
            }
            
            await this.sendMessage('audio', result.filename);
            
        } catch (error) {
            console.error('上传语音失败:', error);
            alert('上传语音失败: ' + error.message);
        }
    }
    
    showLoadingMessage(text) {
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'loading-message';
        loadingMessage.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${text}</div>
        `;
        this.chatMessages.appendChild(loadingMessage);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        return loadingMessage;
    }
    
    removeLoadingMessage(loadingMessage) {
        if (loadingMessage && loadingMessage.parentNode) {
            loadingMessage.remove();
        }
    }
    
    startPolling() {
        // 每500秒轮询一次
        setInterval(() => this.pollMessages(), 500);
    }
    
    async pollMessages() {
        if (this.isPolling) return;
        
        try {
            this.isPolling = true;
            
            const response = await fetch(`api/get_messages.php${this.lastMessageId ? `?after=${this.lastMessageId}` : ''}`);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || '获取消息失败');
            }
            
            const newMessages = result.data;
            if (newMessages.length === 0) return;
            
            // 检查是否在底部
            const isAtBottom = this.chatMessages.scrollHeight - this.chatMessages.scrollTop <= this.chatMessages.clientHeight + 50;
            
            // 只在有lastMessageId时（不是首次加载）才检查新消息
            if (this.lastMessageId !== null) {
                // 如果不在底部且有新消息
                if (!isAtBottom) {
                    // 只统计���是自己发的新消息
                    const unreadMessages = newMessages.filter(msg => 
                        msg.clientId !== this.clientId && 
                        !this.messageCache.has(msg.id)
                    );
                    
                    if (unreadMessages.length > 0) {
                        this.unreadCount += unreadMessages.length;
                        this.showNewMessagesAlert();
                    }
                }
            }
            
            // 处理每新消息
            for (const msg of newMessages) {
                if (this.messageCache.has(msg.id)) continue;
                
                // 只为其他客户端的消息播放音效
                if (msg.clientId && msg.clientId !== this.clientId) {
                    await this.playNotificationSound();
                }
                
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message';
                messageDiv.dataset.self = msg.clientId === this.clientId ? 'true' : 'false';
                
                // 添加用户信息
                const userInfoDiv = document.createElement('div');
                userInfoDiv.className = 'message-user-info';
                
                // 添加头像
                const avatarImg = document.createElement('img');
                avatarImg.src = msg.avatar || 'assets/avatars/default.jpg';
                avatarImg.className = 'message-avatar';
                avatarImg.alt = '用户头像';
                userInfoDiv.appendChild(avatarImg);
                
                // 添加用户信息容器（昵称和时间）
                const userTextInfo = document.createElement('div');
                userTextInfo.className = 'user-text-info';
                
                // 添加昵称
                if (msg.nickname) {
                    const nicknameDiv = document.createElement('div');
                    nicknameDiv.className = 'message-nickname';
                    nicknameDiv.textContent = msg.nickname;
                    userTextInfo.appendChild(nicknameDiv);
                }
                
                // 添加时间
                const timeDiv = document.createElement('div');
                timeDiv.className = 'message-time';
                const messageDate = new Date(msg.timestamp * 1000);
                const dateStr = `${msg.date.year}-${msg.date.month}-${msg.date.day} ${messageDate.toLocaleTimeString()}`;
                timeDiv.textContent = dateStr;
                userTextInfo.appendChild(timeDiv);
                
                userInfoDiv.appendChild(userTextInfo);
                messageDiv.appendChild(userInfoDiv);
                
                // 根据消息类型创不同的内容
                let content = '';
                switch (msg.type) {
                    case 'text':
                        content = `<div class="message-text">${this.escapeHtml(msg.content)}</div>`;
                        break;
                    case 'image':
                        content = `<img src="assets/uploads/${msg.content}" alt="图片息" class="message-image" onclick="document.getElementById('imagePreviewModal').querySelector('img').src = this.src; document.getElementById('imagePreviewModal').classList.add('active');">`;
                        break;
                    case 'audio':
                        const audioId = `audio-${msg.id}`;
                        content = `
                            <div class="audio-player" data-audio-id="${audioId}">
                                <audio id="${audioId}" preload="metadata">
                                    <source src="assets/uploads/${msg.content}" type="audio/webm">
                                    <source src="assets/uploads/${msg.content}" type="audio/ogg">
                                </audio>
                                <button class="audio-play-btn">
                                    <i class="fas fa-play"></i>
                                </button>
                                <div class="audio-info">
                                    <div class="audio-wave">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>`;
                        break;
                    case 'system':
                        content = `<div class="message-system">${msg.content}</div>`;
                        break;
                    default:
                        content = `<div class="message-text">不支持的消息类型</div>`;
                }
                
                // 在添加消息内容之前，创建一个内容容器
                const contentContainer = document.createElement('div');
                contentContainer.className = 'message-content';
                
                // 将内容添加到容器中
                contentContainer.innerHTML = content;
                
                // 将容器添加到消息div中
                messageDiv.appendChild(contentContainer);
                
                // 添加消息到聊天窗口
                this.chatMessages.appendChild(messageDiv);
                this.messageCache.set(msg.id, true);
            }
            
            // 更新最后一条消息的ID
            if (newMessages.length > 0) {
                this.lastMessageId = newMessages[newMessages.length - 1].id;
            }
            
            // 如果在底部，自动滚动并隐藏提示
            if (isAtBottom) {
                this.scrollToBottom();
                this.hideNewMessagesAlert();
            }
            
        } catch (error) {
            console.error('轮询消息失败:', error);
            this.lastMessageId = null;
            this.messageCache.clear();
        } finally {
            this.isPolling = false;
        }
    }
    
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // 添加在线人数轮询方法
    startOnlinePolling() {
        // 立即执行一次
        this.pollOnlineCount();
        // 每3秒轮询一次
        setInterval(() => this.pollOnlineCount(), 3000);
    }
    
    async pollOnlineCount() {
        try {
            const response = await fetch('api/online_users.php');
            const result = await response.json();
            
            if (result.success) {
                this.onlineCount.textContent = `在线人数: ${result.online_count}`;
            }
        } catch (error) {
            console.error('获取在线人数失败:', error);
        }
    }
    
    // 修改显示新消息提示的方法
    showNewMessagesAlert() {
        this.newMessagesAlert.innerHTML = `
            <span>${this.unreadCount}条新消息</span>
            <i class="fas fa-chevron-down" style="margin-left: 8px;"></i>
        `;
        this.newMessagesAlert.style.display = 'block';
    }
    
    // 添加隐藏新消息提示的方法
    hideNewMessagesAlert() {
        this.newMessagesAlert.style.display = 'none';
        this.unreadCount = 0;
    }
    
    // 修改滚动到底部的方法
    scrollToBottom() {
        this.chatMessages.scrollTo({
            top: this.chatMessages.scrollHeight,
            behavior: 'auto' // 修改为 auto，移除平滑滚动
        });
    }
    
    // 添加初始化 clientId 的方法
    initializeClientId() {
        // 使用 localStorage 而不是 sessionStorage，这样刷新页面后 ID 不会改变
        let clientId = localStorage.getItem('chatClientId');
        
        // 如果没有，生成一个新的
        if (!clientId) {
            const random = Math.random().toString(36).substring(2, 15);
            const timestamp = Date.now();
            const userAgent = navigator.userAgent.replace(/[^a-zA-Z0-9]/g, '');
            clientId = `${random}_${timestamp}_${userAgent.substring(0, 10)}`;
            localStorage.setItem('chatClientId', clientId);
        }
        
        this.clientId = clientId;
        console.log('Client ID:', this.clientId); // 添加日志
    }
    
    // 简化音效播放方法
    async playNotificationSound() {
        if (!this.soundEnabled) {
            return;
        }
        
        try {
            this.notificationSound.currentTime = 0;
            await this.notificationSound.play();
        } catch (error) {
            console.error('播放通知音效失败:', error);
        }
    }
    
    initializeSettings() {
        // 打开设置
        this.settingsBtn.addEventListener('click', () => {
            this.settingsModal.classList.add('active');
        });
        
        // 关闭设置
        this.settingsClose.addEventListener('click', () => {
            this.settingsModal.classList.remove('active');
        });
        
        // 更换头像
        this.changeAvatarBtn.addEventListener('click', () => {
            this.avatarInput.click();
        });
        
        this.avatarInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.currentAvatar.src = e.target.result;
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
        
        // 保存设置
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        
        // 加载保存的设置
        this.loadSettings();
        
        // 添加设头像按钮
        this.chooseAvatarBtn = document.getElementById('chooseAvatarBtn');
        this.presetAvatars = document.querySelector('.preset-avatars');
        
        // 加载预设头像
        this.loadPresetAvatars();
        
        // 切换预设头像显示
        this.chooseAvatarBtn.addEventListener('click', () => {
            this.presetAvatars.style.display = 
                this.presetAvatars.style.display === 'none' ? 'grid' : 'none';
        });
    }
    
    async saveSettings() {
        try {
            console.log('Saving settings for client ID:', this.clientId);
            
            const formData = new FormData();
            formData.append('clientId', this.clientId);
            formData.append('nickname', this.nicknameInput.value.trim());
            
            // 获取当前显示的头像路径
            const currentAvatarSrc = this.currentAvatar.src;
            console.log('Current avatar src:', currentAvatarSrc);
            
            // 如果是上传的新头像
            if (this.avatarInput.files[0]) {
                formData.append('avatar', this.avatarInput.files[0]);
            } 
            // 如果是预设头像或默认头像
            else if (currentAvatarSrc) {
                // 从完整URL中提取文件名
                const fileName = decodeURIComponent(currentAvatarSrc.split('/').pop());
                const avatarUrl = `assets/avatars/${fileName}`;
                formData.append('avatarUrl', avatarUrl);
                console.log('Saving avatar URL:', avatarUrl);
            }
            
            const response = await fetch('api/save_settings.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            console.log('Save settings response:', result);
            
            if (result.success) {
                this.settingsModal.classList.remove('active');
                localStorage.setItem('chatNickname', this.nicknameInput.value.trim());
                if (result.data.avatar) {
                    localStorage.setItem('chatAvatar', result.data.avatar);
                    console.log('Saved avatar to localStorage:', result.data.avatar);
                    
                    // 立即更新当前显示的头像
                    this.currentAvatar.src = result.data.avatar;
                }
                alert('设置保存成功！');
            } else {
                throw new Error(result.message || '保存失败');
            }
            
        } catch (error) {
            console.error('保存设置失败:', error);
            alert('保存设置失败: ' + error.message);
        }
    }
    
    async loadSettings() {
        try {
            console.log('Loading settings for client ID:', this.clientId); // 添加日志
            
            // 从服务器获取设置
            const response = await fetch(`api/get_settings.php?clientId=${this.clientId}`);
            const result = await response.json();
            
            console.log('Loaded settings:', result); // 修改日志，显示完整响应
            
            if (result.success) {
                const settings = result.data;
                
                // 设置昵称
                if (settings.nickname) {
                    this.nicknameInput.value = settings.nickname;
                }
                
                // 设置头像
                if (settings.avatar) {
                    console.log('Setting avatar to:', settings.avatar); // 添加日志
                    this.currentAvatar.src = settings.avatar;
                    localStorage.setItem('chatAvatar', settings.avatar);
                } else {
                    console.log('Using default avatar'); // 添加日志
                    this.currentAvatar.src = 'assets/avatars/default.jpg';
                    localStorage.setItem('chatAvatar', 'assets/avatars/default.jpg');
                }
            }
        } catch (error) {
            console.error('加载设置失败:', error);
            this.currentAvatar.src = 'assets/avatars/default.jpg';
            localStorage.setItem('chatAvatar', 'assets/avatars/default.jpg');
        }
    }
    
    async loadPresetAvatars() {
        try {
            const response = await fetch('api/get_preset_avatars.php');
            const result = await response.json();
            
            if (result.success) {
                // 清空预设头像容器
                this.presetAvatars.innerHTML = '';
                
                // 为每个预设头像创建元素
                result.avatars.forEach(avatar => {
                    const img = document.createElement('img');
                    img.src = `assets/avatars/${avatar}`;
                    img.className = 'preset-avatar';
                    img.alt = '预设头像';
                    
                    // 修改点击事件，只更新显示的头像，不自动保存
                    img.addEventListener('click', () => {
                        // 更新显示的头像
                        this.currentAvatar.src = img.src;
                        
                        // 移除其他头像的选中状态
                        this.presetAvatars.querySelectorAll('.preset-avatar').forEach(avatar => {
                            avatar.classList.remove('selected');
                        });
                        
                        // 添加选中状态
                        img.classList.add('selected');
                    });
                    
                    this.presetAvatars.appendChild(img);
                });
            }
        } catch (error) {
            console.error('加载预设头像失败:', error);
        }
    }
    
    // 添加新方法来初始化用户状态
    initializeUserStatus() {
        // 页面可见性变化时发送状态
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // 延迟发送加入消息，确���设置已加载
                setTimeout(() => this.sendUserStatus('join'), 1000);
            } else {
                this.sendUserStatus('leave');
            }
        });
        
        // 页面关闭时发送离开消息
        window.addEventListener('beforeunload', () => {
            // 使用同步 XMLHttpRequest 确保消息发送
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append('clientId', this.clientId);
            formData.append('action', 'leave');
            formData.append('nickname', this.nicknameInput.value.trim() || '匿名用户');
            
            xhr.open('POST', 'api/user_status.php', false);
            xhr.send(formData);
        });
        
        // 在设置加载完成后发送加入消息
        this.loadSettings().then(() => {
            setTimeout(() => this.sendUserStatus('join'), 1000);
        });
    }

    async sendUserStatus(action) {
        try {
            const formData = new FormData();
            formData.append('clientId', this.clientId);
            formData.append('action', action);
            formData.append('nickname', this.nicknameInput.value.trim() || '匿名用户');
            
            const response = await fetch('api/user_status.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('发送用户状态失败:', error);
        }
    }
}

// 初始化聊天室
document.addEventListener('DOMContentLoaded', () => {
    new ChatRoom();
}); 