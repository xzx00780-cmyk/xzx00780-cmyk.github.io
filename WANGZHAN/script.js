class BlogApp {
    constructor() {
        this.articles = this.loadFromStorage('articles') || [];
        this.comments = this.loadFromStorage('comments') || [];
        this.userLikes = this.loadFromStorage('userLikes') || [];
        this.drawings = this.loadFromStorage('drawings') || [];
        this.messages = this.loadFromStorage('messages') || [];
        this.currentArticle = null;
        // 图片管理相关变量
        this.images = this.loadFromStorage('images') || [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.renderArticles();
    }

    // 存储管理
    loadFromStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (error) {
            return null;
        }
    }

    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }



    // 事件监听
    setupEventListeners() {
        // 导航
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView(e.target.dataset.view);
            });
        });

        // 标题点击返回首页
        document.querySelector('header h1').addEventListener('click', () => {
            this.switchView('home');
        });

        // 文章列表点击
        document.addEventListener('click', (e) => {
            if (e.target.closest('.article-item')) {
                const articleId = e.target.closest('.article-item').dataset.articleId;
                this.openArticle(articleId);
            }
        });

        // 返回按钮
        document.getElementById('backBtn').addEventListener('click', () => {
            this.showListView();
        });

        // 点赞按钮
        document.getElementById('likeBtn').addEventListener('click', () => {
            this.toggleLike();
        });

        // 评论按钮
        document.getElementById('commentBtn').addEventListener('click', () => {
            this.showCommentForm();
        });

        // 提交评论
        document.getElementById('submitComment').addEventListener('click', () => {
            this.submitComment();
        });

        // 提交留言
        document.getElementById('submitMessage').addEventListener('click', () => {
            this.submitMessage();
        });



        // 图片预览
        document.getElementById('articleImage').addEventListener('change', (e) => {
            this.handleImagePreview(e);
        });

        // 移除图片上传功能的事件监听器

        // 绘画留言功能
        document.getElementById('messageClearCanvas').addEventListener('click', () => {
            this.clearMessageCanvas();
        });

        document.getElementById('messageSaveDrawing').addEventListener('click', () => {
            this.saveMessageDrawing();
        });

        // 管理页面的删除按钮
        document.addEventListener('click', (e) => {
            if (e.target.textContent === '删除') {
                const articleId = e.target.closest('.manage-article-item').dataset.articleId;
                this.deleteArticle(articleId);
            }
        });

        // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (this.currentArticle) {
                this.showListView();
            }
        }
    });
}

    // 视图切换
    switchView(viewName) {
        // 更新导航状态
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // 切换视图
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById(`${viewName}-view`).classList.add('active');

        // 隐藏文章详情和新建表单
        document.getElementById('articleDetail').style.display = 'none';
        document.getElementById('newArticleForm').style.display = 'none';

        // 根据视图更新内容
        switch (viewName) {
            case 'home':
                // 首页无需额外处理
                break;
            case 'articles':
                this.renderArticles();
                break;
            case 'draw':
                this.renderFeaturedImage();
                break;
            case 'message':
                this.renderMessages();
                this.initMessageDrawing();
                break;
        }
    }

    // 加载初始数据
    loadInitialData() {
        if (this.articles.length === 0) {
            const sampleArticles = [
                {
                    id: this.generateId(),
                    title: '欢迎来到我的博客',
                    content: '这是我的第一篇博客文章！\n\n欢迎大家访问我的FISH博客，这里我会分享我的生活感悟、技术心得和一些有趣的故事。\n\n希望这个博客能够成为我们交流的桥梁。如果您有任何想法或建议，欢迎通过评论与我互动。',
                    image: null,
                    views: 0,
                    likes: 0,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    title: '纯文本博客的特点',
                    content: '这个博客采用了纯文本的设计风格，具有以下特点：\n\n1. 简洁明了 - 专注于内容本身\n2. 易于阅读 - 传统的文本排版\n3. 加载快速 - 没有多余的装饰元素\n4. 兼容性好 - 在各种设备上都能正常显示\n\n在快节奏的现代生活中，有时候回归简单的文字阅读反而能带来更好的体验。',
                    image: null,
                    views: 0,
                    likes: 0,
                    createdAt: new Date(Date.now() - 86400000).toISOString()
                }
            ];

            this.articles = sampleArticles;
            this.saveToStorage('articles', this.articles);
        }
    }

    // 渲染文章列表
    renderArticles() {
        const articleList = document.getElementById('articleList');
        
        if (this.articles.length === 0) {
            articleList.innerHTML = `
                <div class="empty-state">
                    还没有文章。点击"管理"开始创建您的第一篇文章吧！
                </div>
            `;
            return;
        }

        const sortedArticles = [...this.articles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        articleList.innerHTML = sortedArticles.map(article => `
            <div class="article-item" data-article-id="${article.id}">
                <div class="article-title">${article.title}</div>
                <div class="article-meta">
                    ${this.formatDate(article.createdAt)} | 
                    浏览: ${article.views} | 
                    点赞: ${article.likes} | 
                    评论: ${this.getCommentCount(article.id)}
                </div>
                <div class="article-preview">${this.getPreview(article.content)}</div>
                ${article.image ? `<img src="${article.image}" alt="${article.title}" class="article-image">` : ''}
            </div>
        `).join('');
    }



    // 打开文章详情
    openArticle(articleId) {
        this.currentArticle = this.articles.find(article => article.id === articleId);
        if (!this.currentArticle) return;

        // 增加浏览数
        this.currentArticle.views++;
        this.saveToStorage('articles', this.articles);

        // 隐藏列表视图
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));

        // 显示文章详情
        document.getElementById('articleDetail').style.display = 'block';

        // 更新文章内容
        document.getElementById('articleTitle').textContent = this.currentArticle.title;
        document.getElementById('articleContent').textContent = this.currentArticle.content;
        
        const articleImage = document.getElementById('articleImage');
        if (this.currentArticle.image) {
            articleImage.innerHTML = `<img src="${this.currentArticle.image}" alt="${this.currentArticle.title}">`;
            articleImage.style.display = 'block';
        } else {
            articleImage.style.display = 'none';
        }

        // 更新点赞状态
        const isLiked = this.userLikes.includes(articleId);
        document.getElementById('likeCount').textContent = this.currentArticle.likes;
        const likeBtn = document.getElementById('likeBtn');
        likeBtn.innerHTML = `${isLiked ? '❤️' : '👍'} <span id="likeCount">${this.currentArticle.likes}</span>`;

        // 渲染评论
        this.renderComments();

        // 重新获取likeCount元素（因为innerHTML替换了）
        this.likeCountElement = document.getElementById('likeCount');
    }

    // 显示列表视图
    showListView() {
        this.currentArticle = null;
        document.getElementById('articleDetail').style.display = 'none';
        this.switchView('home');
    }

    // 点赞功能
    toggleLike() {
        if (!this.currentArticle) return;

        const articleId = this.currentArticle.id;
        const isLiked = this.userLikes.includes(articleId);

        if (isLiked) {
            // 取消点赞
            this.currentArticle.likes--;
            this.userLikes = this.userLikes.filter(id => id !== articleId);
            document.getElementById('likeBtn').innerHTML = `👍 <span id="likeCount">${this.currentArticle.likes}</span>`;
        } else {
            // 点赞
            this.currentArticle.likes++;
            this.userLikes.push(articleId);
            document.getElementById('likeBtn').innerHTML = `❤️ <span id="likeCount">${this.currentArticle.likes}</span>`;
        }

        this.likeCountElement = document.getElementById('likeCount');
        this.saveToStorage('articles', this.articles);
        this.saveToStorage('userLikes', this.userLikes);

        // 更新列表显示
        if (document.getElementById('home-view').classList.contains('active')) {
            this.renderArticles();
        }
        if (document.getElementById('manage-view').classList.contains('active')) {
            this.renderManagePanel();
        }
    }

    // 显示评论表单
    showCommentForm() {
        document.getElementById('commentForm').style.display = 
            document.getElementById('commentForm').style.display === 'none' ? 'block' : 'none';
    }

    // 提交评论
    submitComment() {
        if (!this.currentArticle) return;

        const nameInput = document.getElementById('commenterName');
        const contentInput = document.getElementById('commentContent');
        
        const name = nameInput.value.trim();
        const content = contentInput.value.trim();

        if (!name || !content) {
            alert('请填写昵称和评论内容');
            return;
        }

        const comment = {
            id: this.generateId(),
            articleId: this.currentArticle.id,
            author: name,
            content: content,
            createdAt: new Date().toISOString()
        };

        this.comments.push(comment);
        this.saveToStorage('comments', this.comments);

        // 清空表单
        nameInput.value = '';
        contentInput.value = '';
        document.getElementById('commentForm').style.display = 'none';

        // 重新渲染评论
        this.renderComments();

        // 更新文章列表中的评论数
        this.renderArticles();
        if (document.getElementById('manage-view').classList.contains('active')) {
            this.renderManagePanel();
        }
    }

    // 渲染评论
    renderComments() {
        if (!this.currentArticle) return;

        const articleComments = this.comments.filter(comment => comment.articleId === this.currentArticle.id);
        document.getElementById('commentCount').textContent = articleComments.length;

        const commentsList = document.getElementById('commentsList');
        
        if (articleComments.length === 0) {
            commentsList.innerHTML = '<div class="empty-state">暂无评论，来发表第一条评论吧！</div>';
            return;
        }

        commentsList.innerHTML = articleComments
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(comment => `
                <div class="comment-item">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author}</span>
                        <span class="comment-time">${this.formatDate(comment.createdAt)}</span>
                    </div>
                    <div class="comment-content">${comment.content}</div>
                </div>
            `).join('');
    }



    // 图片预览
    handleImagePreview(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('imagePreview');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="预览图片">`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    }



    // 工具函数
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        
        return date.toLocaleDateString('zh-CN');
    }

    getPreview(content) {
        return content.length > 100 ? content.substring(0, 100) + '...' : content;
    }

    getCommentCount(articleId) {
        return this.comments.filter(comment => comment.articleId === articleId).length;
    }

    // 绘画功能
    initDrawing() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布样式
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // 绑定绘画事件
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // 移动端支持
        this.canvas.addEventListener('touchstart', (e) => this.startDrawing(e));
        this.canvas.addEventListener('touchmove', (e) => this.draw(e));
        this.canvas.addEventListener('touchend', () => this.stopDrawing());
        
        // 工具按钮事件
        document.getElementById('clearCanvas').addEventListener('click', () => this.clearCanvas());
        document.getElementById('saveDrawing').addEventListener('click', () => this.saveDrawing());
        
        // 颜色和笔刷大小
        document.getElementById('colorPicker').addEventListener('change', (e) => {
            this.ctx.strokeStyle = e.target.value;
        });
        
        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.ctx.lineWidth = e.target.value;
        });
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        this.lastX = clientX - rect.left;
        this.lastY = clientY - rect.top;
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        const currentX = clientX - rect.left;
        const currentY = clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();
        
        this.lastX = currentX;
        this.lastY = currentY;
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    saveDrawing() {
        const dataURL = this.canvas.toDataURL();
        const drawing = {
            id: this.generateId(),
            image: dataURL,
            createdAt: new Date().toISOString()
        };
        
        this.drawings.push(drawing);
        this.saveToStorage('drawings', this.drawings);
        this.renderDrawings();
        
        alert('作品已保存！');
    }

    renderDrawings() {
        const savedDrawings = document.getElementById('savedDrawings');
        
        if (this.drawings.length === 0) {
            savedDrawings.innerHTML = '<div class="empty-state">还没有保存的作品，快来创作吧！</div>';
            return;
        }
        
        savedDrawings.innerHTML = this.drawings.map(drawing => `
            <div class="drawing-item">
                <img src="${drawing.image}" alt="绘画作品" onclick="blogApp.viewDrawing('${drawing.id}')">
                <div class="drawing-info">
                    <small>${this.formatDate(drawing.createdAt)}</small>
                </div>
            </div>
        `).join('');
    }

    viewDrawing(drawingId) {
        const drawing = this.drawings.find(d => d.id === drawingId);
        if (drawing) {
            // 创建模态窗口查看大图
            const modal = document.createElement('div');
            modal.className = 'drawing-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <img src="${drawing.image}" alt="绘画作品">
                    <div class="drawing-meta">
                        <small>创作时间: ${this.formatDate(drawing.createdAt)}</small>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // 关闭模态窗口
            modal.querySelector('.close-modal').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        }
    }

    // 留言板功能
    submitMessage() {
        const nameInput = document.getElementById('messageName');
        const contentInput = document.getElementById('messageContent');
        
        const name = nameInput.value.trim();
        const content = contentInput.value.trim();
        
        if (!name) {
            alert('请输入昵称');
            return;
        }
        
        if (!content) {
            alert('请输入留言内容');
            return;
        }
        
        const message = {
            id: this.generateId(),
            name: name,
            content: content,
            createdAt: new Date().toISOString()
        };
        
        this.messages.unshift(message);
        this.saveToStorage('messages', this.messages);
        
        // 清空表单
        nameInput.value = '';
        contentInput.value = '';
        
        // 重新渲染留言列表
        this.renderMessages();
        
        alert('留言发表成功！');
    }

    // 渲染留言列表
    renderMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        
        if (this.messages.length === 0) {
            messagesContainer.innerHTML = '<div class="empty-state">还没有留言，来发表第一条留言吧！</div>';
            return;
        }
        
        messagesContainer.innerHTML = this.messages.map(message => {
            if (message.type === 'drawing') {
                // 绘画留言
                return `
                    <div class="message-item drawing-message">
                        <div class="message-header">
                            <span class="message-author">${message.title} - 绘画作品</span>
                            <small class="message-time">${this.formatDate(message.createdAt)}</small>
                        </div>
                        <div class="message-drawing">
                            <img src="${message.image}" alt="${message.title}" onclick="blogApp.viewMessageDrawing('${message.id}')" style="max-width: 100%; max-height: 200px; cursor: pointer; border: 1px solid #ddd;">
                        </div>
                    </div>
                `;
            } else {
                // 普通文字留言
                return `
                    <div class="message-item">
                        <div class="message-header">
                            <span class="message-author">${message.name}</span>
                            <small class="message-time">${this.formatDate(message.createdAt)}</small>
                        </div>
                        <div class="message-content">${message.content}</div>
                    </div>
                `;
            }
        }).join('');
    }

    // 查看特色图片（放大）
    viewFeaturedImage() {
        // 创建模态窗口查看大图
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>特色图片展示</h3>
                <img src="beijing/A.webp" alt="特色图片">
                <div class="image-meta">
                    <small>网站背景图片展示</small>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 关闭模态窗口
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // 绘画留言功能
    initMessageDrawing() {
        this.messageCanvas = document.getElementById('messageCanvas');
        this.messageCtx = this.messageCanvas.getContext('2d');
        
        // 设置画布样式
        this.messageCtx.lineCap = 'round';
        this.messageCtx.lineJoin = 'round';
        this.messageCtx.strokeStyle = '#000000';
        this.messageCtx.lineWidth = 3;
        
        // 绑定绘画事件
        this.messageCanvas.addEventListener('mousedown', (e) => this.startMessageDrawing(e));
        this.messageCanvas.addEventListener('mousemove', (e) => this.drawMessage(e));
        this.messageCanvas.addEventListener('mouseup', () => this.stopMessageDrawing());
        this.messageCanvas.addEventListener('mouseout', () => this.stopMessageDrawing());
        
        // 移动端支持
        this.messageCanvas.addEventListener('touchstart', (e) => this.startMessageDrawing(e));
        this.messageCanvas.addEventListener('touchmove', (e) => this.drawMessage(e));
        this.messageCanvas.addEventListener('touchend', () => this.stopMessageDrawing());
        
        // 颜色和笔刷大小
        document.getElementById('messageColorPicker').addEventListener('change', (e) => {
            this.messageCtx.strokeStyle = e.target.value;
        });
        
        document.getElementById('messageBrushSize').addEventListener('input', (e) => {
            this.messageCtx.lineWidth = e.target.value;
        });
    }

    startMessageDrawing(e) {
        this.isMessageDrawing = true;
        const rect = this.messageCanvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        this.messageLastX = clientX - rect.left;
        this.messageLastY = clientY - rect.top;
    }

    drawMessage(e) {
        if (!this.isMessageDrawing) return;
        
        const rect = this.messageCanvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        const currentX = clientX - rect.left;
        const currentY = clientY - rect.top;
        
        this.messageCtx.beginPath();
        this.messageCtx.moveTo(this.messageLastX, this.messageLastY);
        this.messageCtx.lineTo(currentX, currentY);
        this.messageCtx.stroke();
        
        this.messageLastX = currentX;
        this.messageLastY = currentY;
    }

    stopMessageDrawing() {
        this.isMessageDrawing = false;
    }

    clearMessageCanvas() {
        this.messageCtx.clearRect(0, 0, this.messageCanvas.width, this.messageCanvas.height);
    }

    saveMessageDrawing() {
        const dataURL = this.messageCanvas.toDataURL();
        const titleInput = document.getElementById('messageDrawingName');
        const title = titleInput.value.trim();
        
        if (!title) {
            alert('请输入绘画留言的标题');
            return;
        }
        
        const drawingMessage = {
            id: this.generateId(),
            type: 'drawing',
            title: title,
            image: dataURL,
            createdAt: new Date().toISOString()
        };
        
        this.messages.unshift(drawingMessage);
        this.saveToStorage('messages', this.messages);
        
        // 清空表单和画布
        titleInput.value = '';
        this.clearMessageCanvas();
        
        // 重新渲染留言列表
        this.renderMessages();
        
        alert('绘画留言发表成功！');
    }

    // 查看绘画留言（放大）
    viewMessageDrawing(messageId) {
        const message = this.messages.find(m => m.id === messageId);
        if (message && message.type === 'drawing') {
            // 创建模态窗口查看大图
            const modal = document.createElement('div');
            modal.className = 'drawing-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h3>${message.title}</h3>
                    <img src="${message.image}" alt="${message.title}">
                    <div class="drawing-meta">
                        <small>创作时间: ${this.formatDate(message.createdAt)}</small>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // 关闭模态窗口
            modal.querySelector('.close-modal').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        }
    }
     
     // 渲染特色图片展示
    renderFeaturedImage() {
        const imagesContainer = document.getElementById('imagesContainer');
        
        imagesContainer.innerHTML = `
            <div class="featured-image-container">
                <img src="beijing/A.webp" alt="特色图片" class="featured-image">
                <div class="image-info">
                    <h4>特色图片展示</h4>
                    <small>点击图片可放大查看</small>
                </div>
            </div>
        `;
        
        // 使用事件监听器而不是内联 onclick
        const featuredImage = imagesContainer.querySelector('.featured-image');
        featuredImage.addEventListener('click', () => {
            this.viewFeaturedImage();
        });
    }
    
    // 查看图片（放大）
    viewImage(imageId) {
        const image = this.images.find(i => i.id === imageId);
        if (image) {
            // 创建模态窗口查看大图
            const modal = document.createElement('div');
            modal.className = 'image-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h3>${image.title}</h3>
                    <img src="${image.url}" alt="${image.title}">
                    <div class="image-meta">
                        <small>上传时间: ${this.formatDate(image.createdAt)}</small>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // 关闭模态窗口
            modal.querySelector('.close-modal').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        }
    }
 

}

// 初始化应用
const blogApp = new BlogApp();