// کلاس اصلی برنامه دستیار هوش مصنوعی
class AIAssistant {
    constructor() {
        // مقداردهی اولیه
        this.conversations = [];
        this.currentConversationId = null;
        this.messageHistory = [];
        this.selectedMessageId = null;
        this.chatHistory = [];
        this.selectedChatId = null;
        this.deleteType = null;
        this.isScrolledToBottom = true; // آیا کاربر در پایین چت است؟
        
        // انتخاب عناصر DOM
        this.welcomeMessage = document.querySelector('.welcome-message');
        this.chatContainer = document.querySelector('.chat-container');
        this.messageInput = document.querySelector('.message-input');
        this.sendButton = document.querySelector('.send-button');
        this.attachButton = document.querySelector('.attach-button');
        this.refreshButton = document.querySelector('button.icon-button:nth-child(2)');
        this.videoButton = document.querySelector('button.icon-button:nth-child(1)');
        this.newChatButton = document.querySelector('button.icon-button:nth-child(3)');
        this.settingsButton = document.querySelector('.settings-container .icon-button');
        this.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        this.sidebar = document.querySelector('.sidebar');
        this.inputContainer = document.querySelector('.input-container');
        
        // بارگذاری گفتگوهای قبلی از localStorage
        this.loadConversations();
        
        // بارگذاری تاریخچه پیام‌ها از localStorage
        this.loadHistory();
        
        // اتصال رویدادها
        this.initializeEventListeners();
        
        // ایجاد یک گفتگوی جدید به صورت پیش‌فرض اگر گفتگویی وجود ندارد
        if (this.conversations.length === 0) {
            this.createNewChat();
        } else {
            // بارگذاری آخرین گفتگو
            this.loadLastConversation();
        }
    }
    
    // اتصال رویدادها به عناصر مختلف
    initializeEventListeners() {
        // منوی موبایل
        this.mobileMenuBtn.addEventListener('click', () => {
            this.mobileMenuBtn.classList.toggle('active');
            this.sidebar.classList.toggle('active');
            
            // فعال‌سازی اورلی موبایل
            const mobileOverlay = document.getElementById('mobileOverlay');
            if (mobileOverlay) {
                mobileOverlay.classList.toggle('active');
                
                // اضافه کردن رویداد کلیک به اورلی برای بستن منو
                if (mobileOverlay.classList.contains('active')) {
                    mobileOverlay.addEventListener('click', () => {
                        this.mobileMenuBtn.classList.remove('active');
                        this.sidebar.classList.remove('active');
                        mobileOverlay.classList.remove('active');
                    }, { once: true });
                }
            }
        });
        
        // دکمه ارسال پیام
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // ارسال پیام با کلید Enter
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // تغییر ارتفاع خودکار textarea
        this.messageInput.addEventListener('input', this.autoResizeTextarea.bind(this));

        // اضافه کردن رویداد اسکرول به container چت برای تشخیص موقعیت اسکرول
        this.chatContainer.addEventListener('scroll', this.handleScroll.bind(this));

        // رویدادهای مربوط به پنل تنظیمات
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        }
        
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
        
        // بستن پنل‌ها با کلیک در خارج از آن‌ها
        document.addEventListener('click', (e) => {
            const settingsPanel = document.getElementById('settingsPanel');
            const historyPanel = document.getElementById('historyPanel');
            const settingsButton = document.getElementById('settingsButton');
            const historyButton = document.getElementById('historyButton');
            
            // بررسی اینکه آیا پنل تنظیمات باز است و کلیک خارج از آن بوده است
            if (settingsPanel && settingsPanel.classList.contains('active') && 
                !settingsPanel.contains(e.target) && 
                settingsButton && !settingsButton.contains(e.target)) {
                this.closeSettings();
            }
            
            // بررسی اینکه آیا پنل تاریخچه باز است و کلیک خارج از آن بوده است
            if (historyPanel && historyPanel.classList.contains('active') && 
                !historyPanel.contains(e.target) && 
                historyButton && !historyButton.contains(e.target)) {
                this.closeHistory();
            }
        });
        
        // اتصال رویدادهای تم‌های رنگی در تنظیمات
        const colorThemeOptions = document.querySelectorAll('.color-theme-option');
        colorThemeOptions.forEach(option => {
            option.addEventListener('click', () => {
                // حذف کلاس active از همه‌ی گزینه‌ها
                colorThemeOptions.forEach(opt => opt.classList.remove('active'));
                
                // اضافه کردن کلاس active به گزینه‌ی انتخاب شده
                option.classList.add('active');
                
                // اعمال تم رنگی
                const theme = option.dataset.theme;
                this.applyColorTheme(theme);
            });
        });
        
        // بارگذاری تم ذخیره شده
        this.loadSavedColorTheme();
        
        const refreshModelsBtn = document.getElementById('refreshModelsBtn');
        if (refreshModelsBtn) {
            refreshModelsBtn.addEventListener('click', () => this.fetchModels());
        }
        
        const modelSearchInput = document.getElementById('modelSearchInput');
        if (modelSearchInput) {
            modelSearchInput.addEventListener('input', () => this.searchModels());
        }
        
        const apiKeyInput = document.getElementById('apiKey');
        if (apiKeyInput) {
            apiKeyInput.addEventListener('blur', () => this.checkAPIConnection());
        }
        
        const togglePasswordBtn = document.getElementById('togglePassword');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', () => {
                const apiKeyInput = document.getElementById('apiKey');
                if (apiKeyInput.type === 'password') {
                    apiKeyInput.type = 'text';
                    togglePasswordBtn.querySelector('i').className = 'fa fa-eye-slash';
                } else {
                    apiKeyInput.type = 'password';
                    togglePasswordBtn.querySelector('i').className = 'fa fa-eye';
                }
            });
        }
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', () => {
                if (themeToggle.checked) {
                    document.body.classList.add('dark-theme');
                } else {
                    document.body.classList.remove('dark-theme');
                }
            });
        }
        
        // جستجو و انتخاب مدل
        const customSelect = document.querySelector('.custom-select');
        const selectedDisplay = document.getElementById('selectedModelDisplay');
        
        if (customSelect && selectedDisplay) {
            // باز و بسته کردن کادر انتخاب
            selectedDisplay.addEventListener('click', () => {
                customSelect.classList.toggle('active');
                if (customSelect.classList.contains('active')) {
                    modelSearchInput.focus();
                }
            });
            
            // بستن کادر با کلیک خارج از آن
            document.addEventListener('click', (e) => {
                if (!customSelect.contains(e.target)) {
                    customSelect.classList.remove('active');
                }
            });
        }
        
        if (modelSearchInput) {
            modelSearchInput.addEventListener('input', () => this.searchModels());
        }
        
        // رویدادهای مربوط به تاریخچه
        const closeHistoryBtn = document.getElementById('closeHistoryBtn');
        if (closeHistoryBtn) {
            closeHistoryBtn.addEventListener('click', () => this.closeHistory());
        }
        
        // رویدادهای دیالوگ تأیید حذف
        const cancelDeleteBtn = document.getElementById('cancelDelete');
        const confirmDeleteBtn = document.getElementById('confirmDelete');
        
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => this.hideConfirmDialog());
        }
        
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.deleteSelectedMessage());
        }
        
        // رویدادهای دیگر از طریق index.html اتصال داده شده‌اند
    }
    
    // تغییر اندازه خودکار textarea
    autoResizeTextarea() {
        const textarea = this.messageInput;
        // تنظیم ارتفاع به صفر برای محاسبه صحیح ارتفاع واقعی
        textarea.style.height = 'auto';
        // تنظیم ارتفاع بر اساس محتوا
        const newHeight = Math.min(textarea.scrollHeight, 150);
        textarea.style.height = newHeight + 'px';
    }
    
    // بارگذاری گفتگوها از localStorage
    loadConversations() {
        const savedConversations = localStorage.getItem('ai-assistant-conversations');
        if (savedConversations) {
            try {
                this.conversations = JSON.parse(savedConversations);
            } catch (e) {
                console.error('خطا در بارگذاری گفتگوها:', e);
                this.conversations = [];
            }
        }
    }
    
    // ذخیره گفتگوها در localStorage
    saveConversations() {
        try {
            localStorage.setItem('ai-assistant-conversations', JSON.stringify(this.conversations));
        } catch (e) {
            console.error('خطا در ذخیره گفتگوها:', e);
        }
    }
    
    // بارگذاری آخرین گفتگو
    loadLastConversation() {
        if (this.conversations.length > 0) {
            const lastConversation = this.conversations[this.conversations.length - 1];
            this.currentConversationId = lastConversation.id;
            
            // پاکسازی پیام‌های قبلی
            this.clearChatMessages();
            
            // نمایش پیام‌های گفتگو
            if (lastConversation.messages.length > 0) {
                this.hideWelcomeMessage();
                lastConversation.messages.forEach(msg => {
                    const messageElement = this.createMessageElement(msg.sender, msg.text);
                    this.chatContainer.insertBefore(messageElement, this.inputContainer);
                });
                
                // اسکرول به پایین چت پس از بارگذاری پیام‌ها
                this.isScrolledToBottom = true;
                this.scrollToBottom();
            } else {
                this.showWelcomeMessage();
            }
        } else {
            this.createNewChat();
        }
    }
    
    // ایجاد گفتگوی جدید
    createNewChat() {
        this.autoSaveCurrentChat();
        this.clearChatMessages();
        this.showWelcomeMessage();
        this.conversations = [];
        if (this.welcomeMessage) {
            this.welcomeMessage.classList.remove('hidden');
        }
        
        // آیا انیمیشن لوگو را دوباره اجرا کنیم
        const logo = document.querySelector('.large-logo');
        if (logo) {
            logo.style.animation = 'none';
            setTimeout(() => {
                logo.style.animation = 'float 6s ease-in-out infinite';
            }, 10);
        }
    }
    
    // پاکسازی پیام‌های چت
    clearChatMessages() {
        // حذف همه پیام‌ها به جز عناصر اصلی
        const messagesToRemove = document.querySelectorAll('.message-bubble');
        messagesToRemove.forEach(msg => msg.remove());
    }
    
    // نمایش پیام خوش‌آمدگویی
    showWelcomeMessage() {
        this.welcomeMessage.classList.remove('hidden');
    }
    
    // مخفی کردن پیام خوش‌آمدگویی
    hideWelcomeMessage() {
        this.welcomeMessage.classList.add('hidden');
    }
    
    // ارسال پیام کاربر
    sendMessage() {
        const messageText = this.messageInput.value.trim();
        if (!messageText) return;
        
        // اضافه کردن پیام به گفتگو
        this.addMessage('user', messageText);
        
        // پاکسازی فیلد ورودی
        this.messageInput.value = '';
        this.autoResizeTextarea();
        
        // مخفی کردن پیام خوش‌آمدگویی اگر نمایش داده شده است
        this.hideWelcomeMessage();
        
        // شبیه‌سازی دریافت پاسخ از هوش مصنوعی
        this.simulateAIResponse(messageText);
    }
    
    // افزودن پیام به صفحه
    addMessage(sender, text) {
        // یافتن گفتگوی فعلی
        const conversation = this.conversations.find(c => c.id === this.currentConversationId);
        if (!conversation) return;
        
        // افزودن پیام به آرایه گفتگو
        conversation.messages.push({
            sender,
            text,
            timestamp: new Date().toISOString()
        });
        
        // ذخیره تغییرات
        this.saveConversations();
        
        // ایجاد حباب پیام
        const messageElement = this.createMessageElement(sender, text);
        
        // افزودن به DOM قبل از container ورودی پیام
        this.chatContainer.insertBefore(messageElement, this.inputContainer);
        
        // قبل از افزودن پیام جدید، وضعیت اسکرول را بررسی کنیم
        this.handleScroll();
        
        // اگر پیام از طرف هوش مصنوعی است، انیمیشن تایپ اعمال شود
        if (sender === 'ai') {
            const textContent = messageElement.querySelector('p');
            if (textContent) {
                const fullText = text;
                textContent.textContent = '';
                this.typeWriterEffect(textContent, fullText, 0);
            }
        } else {
            // اگر پیام از طرف کاربر است، به پایین اسکرول کنیم
            this.isScrolledToBottom = true;
            this.scrollToBottom();
        }
        
        // اسکرول به پایین صفحه
        this.scrollToBottom();
        
        // دیگر پیام‌ها به صورت تکی در تاریخچه ذخیره نمی‌شوند
        // ذخیره‌سازی تنها در زمان ایجاد چت جدید یا رفرش صفحه انجام می‌شود
        // if (sender === 'user') {
        //     this.addToHistory(text);
        // }
    }
    
    // افکت تایپ متن کاراکتر به کاراکتر
    typeWriterEffect(element, text, index) {
        if (index < text.length) {
            // افزودن کاراکتر جدید
            element.textContent += text.charAt(index);
            
            // اسکرول به پایین صفحه همزمان با تایپ
            this.scrollToBottom();
            
            // تنظیم سرعت تایپ - مقدار کمتر = سرعت بیشتر
            const typingSpeed = this.getTypingSpeed(text);
            
            // ادامه تایپ با کاراکتر بعدی
            setTimeout(() => {
                this.typeWriterEffect(element, text, index + 1);
            }, typingSpeed);
        }
    }
    
    // محاسبه سرعت تایپ مناسب برای متن
    getTypingSpeed(text) {
        // سرعت پایه برای متن‌های کوتاه
        let baseSpeed = 30;
        
        // برای متن‌های طولانی، سرعت بیشتر شود
        if (text.length > 500) {
            baseSpeed = 10;
        } else if (text.length > 200) {
            baseSpeed = 20;
        }
        
        // اضافه کردن کمی تصادفی‌سازی به سرعت برای واقعی‌تر شدن
        return baseSpeed + Math.random() * 20;
    }
    
    // ساخت عنصر پیام
    createMessageElement(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-bubble ${sender}-message`;
        
        const textContent = document.createElement('p');
        textContent.textContent = text;
        
        messageDiv.appendChild(textContent);
        
        return messageDiv;
    }
    
    // بررسی موقعیت اسکرول کاربر
    handleScroll() {
        // استفاده از chatContainer به جای document.body برای دقت بیشتر
        const container = this.chatContainer;
        const scrollPosition = container.scrollTop + container.clientHeight;
        const totalHeight = container.scrollHeight;
        
        // اگر کاربر نزدیک به انتهای صفحه باشد (با تلرانس 100 پیکسل)
        this.isScrolledToBottom = (totalHeight - scrollPosition) < 100;
    }
    
    // اسکرول به پایین چت - فقط اگر کاربر در پایین صفحه باشد
    scrollToBottom() {
        if (this.isScrolledToBottom) {
            this.chatContainer.scrollTo({
                top: this.chatContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
    
    // شبیه‌سازی پاسخ هوش مصنوعی
    async simulateAIResponse(userMessage) {
        // نمایش نشانگر تایپ
        const typingElement = document.createElement('div');
        typingElement.className = 'message-bubble ai-message typing';
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        
        typingElement.appendChild(typingIndicator);
        this.chatContainer.insertBefore(typingElement, this.inputContainer);
        
        // اطمینان از اسکرول به پایین برای دیدن نشانگر تایپ
        this.isScrolledToBottom = true;
        this.scrollToBottom();
        
        try {
            // بررسی تنظیمات API
            const savedSettings = localStorage.getItem('ai-assistant-settings');
            let useOpenRouter = false;
            
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                if (settings.apiKey) {
                    useOpenRouter = true;
                    this.settings = settings;
                }
            }
            
            let aiResponse;
            
            // تاخیر کمی قبل از نمایش پاسخ تا نشانگر تایپ چند لحظه نمایش داده شود
            await new Promise(resolve => setTimeout(resolve, 800));
            
            if (useOpenRouter) {
                // درخواست به اوپن روتر
                aiResponse = await this.sendRequestToOpenRouter(userMessage);
            }
            
            if (!aiResponse) {
                // استفاده از پاسخ پیش‌فرض اگر درخواست API موفق نبود
                aiResponse = this.generateAIResponse(userMessage);
            }
            
            // حذف نشانگر تایپ
            typingElement.remove();
            
            // افزودن پیام به چت
            this.addMessage('ai', aiResponse);
        } catch (error) {
            console.error('خطا در دریافت پاسخ:', error);
            
            // حذف نشانگر تایپ
            typingElement.remove();
            
            // نمایش پیام خطا در چت
            this.addMessage('ai', 'متأسفانه در دریافت پاسخ خطایی رخ داد. لطفاً دوباره تلاش کنید.');
        }
    }
    
    // تولید پاسخ هوش مصنوعی ساده
    generateAIResponse(userMessage) {
        const responses = [
            "من درک می‌کنم. چگونه می‌توانم کمک کنم؟",
            "اطلاعات بیشتری در این مورد می‌خواهید؟",
            "این موضوع جالبی است. می‌خواهید بیشتر درباره آن صحبت کنیم؟",
            "من یک دستیار هوش مصنوعی هستم و می‌توانم به سوالات مختلف پاسخ دهم.",
            "آیا سوال دیگری دارید که بتوانم پاسخ دهم؟",
            "متوجه شدم. چه کمک دیگری از من ساخته است؟",
            "ممنون از اشتراک‌گذاری این موضوع. آیا به اطلاعات بیشتری نیاز دارید؟",
            "من در حال یادگیری هستم. لطفاً سوالات بیشتری بپرسید تا بتوانم کمک بهتری به شما ارائه دهم.",
            "به‌عنوان یک دستیار هوش مصنوعی، من می‌توانم در موضوعات مختلفی به شما کمک کنم.",
            "نکته جالبی است. می‌توانید جزئیات بیشتری بیان کنید؟"
        ];
        
        // انتخاب یک پاسخ تصادفی
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // ذخیره خودکار گفتگوی فعلی در تاریخچه
    autoSaveCurrentChat() {
        // اگر گفتگوی فعلی پیام داشته باشد، آن را به تاریخچه اضافه کنیم
        if (this.conversations && this.conversations.length > 0) {
            // عنوان گفتگو را از اولین پیام کاربر استخراج می‌کنیم
            const firstUserMessage = this.conversations.find(msg => msg.sender === 'user');
            const chatSummary = firstUserMessage ? this.getSummaryFromMessage(firstUserMessage.text) : 'گفتگوی بدون عنوان';
            
            // تعداد پیام‌ها
            const messageCount = this.conversations.length;
            
            // بررسی اینکه این گفتگو قبلاً ذخیره شده است یا خیر
            const existingChats = this.loadChatHistory();
            const chatAlreadySaved = existingChats.some(chat => {
                // بررسی تطابق محتوای پیام‌ها
                if (chat.messages.length !== this.conversations.length) return false;
                
                for (let i = 0; i < chat.messages.length; i++) {
                    // مقایسه متن پیام‌ها
                    if (chat.messages[i].text !== this.conversations[i].text ||
                        chat.messages[i].sender !== this.conversations[i].sender) {
                        return false;
                    }
                }
                return true;
            });
            
            // اگر این گفتگو قبلاً ذخیره نشده باشد، آن را ذخیره می‌کنیم
            if (!chatAlreadySaved) {
                const chatHistory = [{
                    id: Date.now().toString(),
                    date: new Date(),
                    title: chatSummary,
                    messageCount: messageCount,
                    messages: this.conversations
                }, ...existingChats];
                
                // محدود کردن تعداد گفتگوهای ذخیره شده به 100
                const limitedHistory = chatHistory.slice(0, 100);
                localStorage.setItem('chatHistory', JSON.stringify(limitedHistory));
                
                // مجدداً تاریخچه را نمایش می‌دهیم اگر پنل تاریخچه باز است
                const historyPanel = document.getElementById('historyPanel');
                if (historyPanel && historyPanel.classList.contains('active')) {
                    this.renderChatHistory();
                }
            }
        }
    }
    
    // پشتیبان‌گیری از تاریخچه
    backupHistory() {
        try {
            // ذخیره گفتگوی فعلی قبل از پشتیبان‌گیری
            this.autoSaveCurrentChat();
            
            // دریافت تاریخچه از localStorage
            const chatHistory = this.loadChatHistory();
            
            if (chatHistory.length === 0) {
                this.showNotification('تاریخچه‌ای برای پشتیبان‌گیری وجود ندارد.', 'warning');
                return;
            }
            
            // تبدیل به رشته JSON با فرمت زیبا
            const historyJSON = JSON.stringify(chatHistory, null, 2);
            
            // ایجاد فایل برای دانلود
            const blob = new Blob([historyJSON], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // ایجاد لینک دانلود و کلیک خودکار
            const a = document.createElement('a');
            const date = new Date();
            const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            a.href = url;
            a.download = `chatgpt-backup-${dateStr}.json`;
            document.body.appendChild(a);
            a.click();
            
            // پاکسازی
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            this.showNotification('پشتیبان‌گیری با موفقیت انجام شد.', 'success');
        } catch (error) {
            console.error('خطا در پشتیبان‌گیری:', error);
            this.showNotification('خطا در پشتیبان‌گیری. لطفاً دوباره تلاش کنید.', 'error');
        }
    }
    
    // بازیابی تاریخچه از فایل پشتیبان
    restoreHistory() {
        try {
            // ایجاد عنصر input برای انتخاب فایل
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const restoredHistory = JSON.parse(e.target.result);
                        
                        // بررسی اعتبار ساختار فایل
                        if (!Array.isArray(restoredHistory)) {
                            throw new Error('فرمت فایل نامعتبر است.');
                        }
                        
                        // بررسی ساختار هر گفتگو
                        for (const chat of restoredHistory) {
                            if (!chat.id || !chat.messages || !Array.isArray(chat.messages)) {
                                throw new Error('ساختار گفتگوها در فایل پشتیبان نامعتبر است.');
                            }
                        }
                        
                        // آیا کاربر مطمئن است که می‌خواهد تاریخچه فعلی را جایگزین کند؟
                        if (confirm('آیا مطمئن هستید که می‌خواهید تاریخچه فعلی را با تاریخچه از فایل پشتیبان جایگزین کنید؟')) {
                            // ذخیره در localStorage
                            localStorage.setItem('chatHistory', JSON.stringify(restoredHistory));
                            
                            // بازخوانی تاریخچه و نمایش مجدد
                            this.renderChatHistory();
                            
                            this.showNotification(`${restoredHistory.length} گفتگو با موفقیت بازیابی شد.`, 'success');
                        }
                    } catch (error) {
                        console.error('خطا در بازیابی فایل پشتیبان:', error);
                        this.showNotification('فایل پشتیبان نامعتبر است. ' + error.message, 'error');
                    }
                };
                
                reader.onerror = () => {
                    this.showNotification('خطا در خواندن فایل. لطفاً دوباره تلاش کنید.', 'error');
                };
                
                reader.readAsText(file);
            });
            
            // شبیه‌سازی کلیک بر روی input
            document.body.appendChild(fileInput);
            fileInput.click();
            
            // پاکسازی
            setTimeout(() => {
                document.body.removeChild(fileInput);
            }, 100);
        } catch (error) {
            console.error('خطا در بازیابی:', error);
            this.showNotification('خطا در بازیابی. لطفاً دوباره تلاش کنید.', 'error');
        }
    }
    
    // استخراج خلاصه از پیام
    getSummaryFromMessage(text) {
        // حذف کاراکترهای خط جدید و تب
        const cleanText = text.replace(/[\n\t\r]/g, ' ').trim();
        
        // محدود کردن طول خلاصه
        const MAX_SUMMARY_LENGTH = 50;
        if (cleanText.length <= MAX_SUMMARY_LENGTH) {
            return cleanText;
        }
        
        // برش متن بلند
        return cleanText.substring(0, MAX_SUMMARY_LENGTH) + '...';
    }
    
    // بارگیری تاریخچه گفتگو از localStorage
    loadChatHistory() {
        try {
            const history = localStorage.getItem('chatHistory');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('خطا در بارگیری تاریخچه:', error);
            return [];
        }
    }
    
    // مدیریت تنظیمات
    openSettings() {
        const settingsPanel = document.getElementById('settingsPanel');
        const settingsButton = document.querySelector('.settings-container .icon-button');
        
        if (settingsPanel) {
            // بررسی وضعیت فعلی پنل
            if (settingsPanel.classList.contains('active')) {
                // اگر پنل باز است، آن را ببندیم
                settingsPanel.classList.remove('active');
                // حذف کلاس active از دکمه تنظیمات
                if (settingsButton) settingsButton.classList.remove('active');
            } else {
                // اگر پنل بسته است، آن را باز کنیم
                settingsPanel.classList.add('active');
                // افزودن کلاس active به دکمه تنظیمات
                if (settingsButton) settingsButton.classList.add('active');
                
                // بررسی اتصال به API
                this.checkAPIConnection();
                
                // بارگذاری تنظیمات ذخیره شده
                this.loadSavedSettings();
            }
        }
    }
    
    // بستن پنل تنظیمات
    closeSettings() {
        const settingsPanel = document.getElementById('settingsPanel');
        const settingsButton = document.querySelector('.settings-container .icon-button');
        
        if (settingsPanel) {
            settingsPanel.classList.remove('active');
            // حذف کلاس active از دکمه تنظیمات
            if (settingsButton) settingsButton.classList.remove('active');
        }
    }
    
    // ذخیره تنظیمات
    saveSettings() {
        const apiKey = document.getElementById('apiKey').value;
        const isDarkTheme = document.getElementById('themeToggle').checked;
        const selectedTone = document.getElementById('toneSelect').value;
        
        // دریافت تم رنگی انتخاب شده
        const activeColorTheme = document.querySelector('.color-theme-option.active');
        const colorTheme = activeColorTheme ? activeColorTheme.dataset.theme : 'default';
        
        // ذخیره در localStorage
        const settings = {
            apiKey,
            selectedModel: this.selectedModel || '',
            isDarkTheme,
            selectedTone,
            colorTheme
        };
        
        localStorage.setItem('ai-assistant-settings', JSON.stringify(settings));
        
        // اعمال تنظیمات
        this.applySettings(settings);
        
        // نمایش پیام موفقیت
        this.showNotification('تنظیمات با موفقیت ذخیره شد', 'success');
        
        // بستن پنل تنظیمات
        this.closeSettings();
    }
    
    // بارگذاری تنظیمات ذخیره شده
    loadSavedSettings() {
        const savedSettings = localStorage.getItem('ai-assistant-settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                
                // پر کردن فرم با مقادیر ذخیره شده
                if (settings.apiKey) document.getElementById('apiKey').value = settings.apiKey;
                if (settings.selectedModel) {
                    this.selectedModel = settings.selectedModel;
                    
                    // اطمینان از اینکه گزینه‌ها در لیست وجود دارد
                    this.fetchModels().then(() => {
                        this.selectModelById(settings.selectedModel);
                    });
                } else {
                    // اگر مدلی انتخاب نشده بود، لیست مدل‌ها را بارگذاری می‌کنیم
                    this.fetchModels();
                }
                
                // تنظیم وضعیت تم
                const themeToggle = document.getElementById('themeToggle');
                themeToggle.checked = settings.isDarkTheme || false;
                
                // تنظیم لحن انتخاب شده
                if (settings.selectedTone) {
                    document.getElementById('toneSelect').value = settings.selectedTone;
                }
                
                // بارگذاری تم رنگی
                if (settings.colorTheme) {
                    this.applyColorTheme(settings.colorTheme);
                    
                    // بروزرسانی وضعیت در رابط کاربری
                    const colorThemeOptions = document.querySelectorAll('.color-theme-option');
                    colorThemeOptions.forEach(option => {
                        option.classList.toggle('active', option.dataset.theme === settings.colorTheme);
                    });
                }
                
                // اعمال تنظیمات
                this.applySettings(settings);
            } catch (e) {
                console.error('خطا در بارگذاری تنظیمات:', e);
                
                // در صورت خطا، حداقل لیست مدل‌ها را بارگذاری می‌کنیم
                this.fetchModels();
            }
        } else {
            // اگر تنظیماتی وجود نداشت، لیست مدل‌ها را بارگذاری می‌کنیم
            this.fetchModels();
        }
    }
    
    // اعمال تنظیمات به برنامه
    applySettings(settings) {
        // اعمال تم تیره/روشن
        if (settings.isDarkTheme) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        
        // اعمال تم رنگی اگر تعریف شده باشد
        if (settings.colorTheme && settings.colorTheme !== 'default') {
            this.applyColorTheme(settings.colorTheme);
        }
        
        // ذخیره تنظیمات در نمونه کلاس
        this.settings = settings;
    }
    
    // اعمال تم رنگی
    applyColorTheme(theme) {
        // حذف همه‌ی کلاس‌های تم قبلی
        document.body.classList.remove('theme-blue', 'theme-green', 'theme-orange', 'theme-red', 'theme-pink', 'theme-dark');
        
        // اگر تم پیش‌فرض نیست، کلاس مربوطه را اضافه می‌کنیم
        if (theme && theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
    }
    
    // بارگذاری تم رنگی ذخیره شده
    loadSavedColorTheme() {
        const savedSettings = localStorage.getItem('ai-assistant-settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                
                if (settings.colorTheme) {
                    this.applyColorTheme(settings.colorTheme);
                    
                    // بروزرسانی وضعیت در رابط کاربری
                    const colorThemeOptions = document.querySelectorAll('.color-theme-option');
                    colorThemeOptions.forEach(option => {
                        option.classList.toggle('active', option.dataset.theme === settings.colorTheme);
                    });
                }
            } catch (e) {
                console.error('خطا در بارگذاری تم رنگی:', e);
            }
        }
    }
    
    // بررسی اتصال به API اوپن روتر
    async checkAPIConnection() {
        const statusIndicator = document.getElementById('connectionStatus');
        const apiKey = document.getElementById('apiKey').value;
        
        if (!apiKey) {
            statusIndicator.className = 'status-indicator disconnected';
            return;
        }
        
        try {
            // ارسال یک درخواست ساده برای بررسی اعتبار کلید API
            const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                statusIndicator.className = 'status-indicator connected';
                return true;
            } else {
                statusIndicator.className = 'status-indicator disconnected';
                return false;
            }
        } catch (error) {
            console.error('خطا در بررسی اتصال API:', error);
            statusIndicator.className = 'status-indicator disconnected';
            return false;
        }
    }
    
    // دریافت لیست مدل‌ها از اوپن روتر
    async fetchModels() {
        const modelOptions = document.getElementById('modelOptions');
        const refreshButton = document.getElementById('refreshModelsBtn');
        const apiKey = document.getElementById('apiKey').value;
        
        if (!apiKey) {
            this.showNotification('لطفا ابتدا کلید API را وارد کنید', 'error');
            return;
        }
        
        try {
            // نمایش حالت بارگذاری
            if (refreshButton) {
                refreshButton.classList.add('loading');
                refreshButton.disabled = true;
            }
            
            // حذف گزینه‌های قبلی
            if (modelOptions) {
                modelOptions.innerHTML = '<li class="loading-item">در حال بارگذاری مدل‌ها...</li>';
            }
            
            // دریافت لیست مدل‌ها
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // حذف پیام بارگذاری
                if (modelOptions) {
                    modelOptions.innerHTML = '';
                    
                    // گروه‌بندی مدل‌ها براساس ارائه‌دهنده
                    const modelsByProvider = {};
                    
                    data.data.forEach(model => {
                        // استخراج نام ارائه‌دهنده از شناسه مدل
                        const providerName = model.id.split('/')[0];
                        
                        if (!modelsByProvider[providerName]) {
                            modelsByProvider[providerName] = [];
                        }
                        
                        modelsByProvider[providerName].push(model);
                    });
                    
                    // اضافه کردن مدل‌ها به لیست براساس ارائه‌دهنده
                    Object.keys(modelsByProvider).sort().forEach(provider => {
                        // ایجاد عنوان برای هر ارائه‌دهنده
                        const headerLi = document.createElement('li');
                        headerLi.className = 'provider-header';
                        headerLi.textContent = provider;
                        headerLi.style.pointerEvents = 'none';
                        modelOptions.appendChild(headerLi);
                        
                        // اضافه کردن مدل‌های این ارائه‌دهنده
                        modelsByProvider[provider].forEach(model => {
                            const li = document.createElement('li');
                            li.dataset.value = model.id;
                            
                            // فقط نام مدل بدون توضیحات اضافه
                            li.textContent = model.name;
                            
                            // رویداد کلیک برای انتخاب مدل
                            li.addEventListener('click', () => {
                                this.selectModel(model.id, model.name);
                            });
                            
                            modelOptions.appendChild(li);
                        });
                    });
                    
                    // اگر مدل ذخیره شده وجود دارد، آن را انتخاب کنید
                    const savedSettings = localStorage.getItem('ai-assistant-settings');
                    if (savedSettings) {
                        try {
                            const settings = JSON.parse(savedSettings);
                            if (settings.selectedModel) {
                                this.selectModelById(settings.selectedModel);
                            }
                        } catch (e) {
                            console.error('خطا در بازیابی مدل ذخیره شده:', e);
                        }
                    }
                }
                
                this.showNotification('لیست مدل‌ها با موفقیت بارگذاری شد', 'success');
            } else {
                throw new Error('خطا در دریافت مدل‌ها');
            }
        } catch (error) {
            console.error('خطا در دریافت لیست مدل‌ها:', error);
            
            if (modelOptions) {
                modelOptions.innerHTML = '<li class="error-item">خطا در دریافت مدل‌ها</li>';
            }
            
            this.showNotification('خطا در دریافت لیست مدل‌ها', 'error');
        } finally {
            // حذف حالت بارگذاری
            if (refreshButton) {
                refreshButton.classList.remove('loading');
                refreshButton.disabled = false;
            }
        }
    }
    
    // جستجو در لیست مدل‌ها
    searchModels() {
        const searchInput = document.getElementById('modelSearchInput');
        const modelOptions = document.getElementById('modelOptions');
        const searchTerm = searchInput.value.toLowerCase();
        
        if (!modelOptions) return;
        
        // بررسی همه گزینه‌های لیست
        Array.from(modelOptions.children).forEach(option => {
            const text = option.textContent.toLowerCase();
            // نمایش یا پنهان کردن گزینه‌ها بر اساس متن جستجو
            if (text.includes(searchTerm)) {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        });
    }
    
    // نمایش اعلان
    showNotification(message, type = 'info') {
        // ایجاد اعلان
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // اضافه کردن به صفحه
        document.body.appendChild(notification);
        
        // نمایش با انیمیشن
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // حذف بعد از زمان مشخص
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // ارسال درخواست به اوپن روتر و دریافت پاسخ
    async sendRequestToOpenRouter(message) {
        const settings = this.settings || {};
        const apiKey = settings.apiKey;
        const selectedModel = settings.selectedModel;
        const selectedTone = settings.selectedTone || 'professional';
        
        if (!apiKey) {
            this.showNotification('لطفا کلید API را در تنظیمات وارد کنید', 'error');
            return null;
        }
        
        try {
            // تنظیم لحن پیام
            let systemMessage = '';
            switch (selectedTone) {
                case 'professional':
                    systemMessage = 'شما یک دستیار حرفه‌ای و رسمی هستید. پاسخ‌های دقیق و موثر ارائه دهید.';
                    break;
                case 'friendly':
                    systemMessage = 'شما یک دستیار دوستانه و گرم هستید. با لحنی صمیمی پاسخ دهید.';
                    break;
                case 'casual':
                    systemMessage = 'شما یک دستیار غیررسمی هستید. با لحنی معمولی و راحت صحبت کنید.';
                    break;
                case 'formal':
                    systemMessage = 'شما یک دستیار بسیار رسمی هستید. از واژگان و ساختارهای ادبی رسمی استفاده کنید.';
                    break;
                case 'enthusiastic':
                    systemMessage = 'شما یک دستیار پرانرژی و مشتاق هستید. با اشتیاق و هیجان پاسخ دهید.';
                    break;
                case 'humorous':
                    systemMessage = 'شما یک دستیار طنزآمیز هستید. از شوخی و طنز در پاسخ‌های خود استفاده کنید.';
                    break;
                case 'empathetic':
                    systemMessage = 'شما یک دستیار همدل و درک‌کننده هستید. با درک احساسات کاربر پاسخ دهید.';
                    break;
                case 'technical':
                    systemMessage = 'شما یک دستیار فنی هستید. از اصطلاحات تخصصی و دقت علمی در پاسخ‌های خود استفاده کنید.';
                    break;
                case 'simplistic':
                    systemMessage = 'شما یک دستیار ساده‌گو هستید. از زبان ساده و قابل فهم برای همه استفاده کنید.';
                    break;
                case 'poetic':
                    systemMessage = 'شما یک دستیار شاعرانه هستید. از تصاویر ادبی و زبان زیبا در پاسخ‌های خود استفاده کنید.';
                    break;
                default:
                    systemMessage = 'شما یک دستیار هوش مصنوعی کمک‌کننده هستید.';
            }
            
            // افزودن دستور برای حفظ حافظه مکالمه
            systemMessage += ' به خاطر داشته باشید که شما در حال ادامه یک مکالمه هستید. به محتوای کل تاریخچه گفتگو توجه کنید و پاسخی متناسب با موضوع کلی گفتگو ارائه دهید. مهم است که تمام زمینه مکالمه را در نظر بگیرید و فقط به آخرین پیام محدود نشوید.';
            
            // دریافت تاریخچه مکالمه فعلی
            const conversation = this.conversations.find(c => c.id === this.currentConversationId);
            const messages = [];
            
            // افزودن پیام سیستم
            messages.push({ role: 'system', content: systemMessage });
            
            if (conversation && conversation.messages.length > 0) {
                // تحلیل موضوع گفتگو برای کمک به هوش مصنوعی
                const conversationTopic = this.analyzeConversationTopic(conversation.messages);
                if (conversationTopic) {
                    messages.push({ 
                        role: 'system', 
                        content: `موضوع گفتگو: ${conversationTopic}. این اطلاعات را برای درک بهتر زمینه گفتگو در نظر بگیرید.` 
                    });
                }
                
                // محاسبه تعداد مناسب پیام‌های قبلی برای ارسال به API
                const chatHistory = this.prepareConversationHistory(conversation.messages, message);
                
                // افزودن پیام‌های تاریخچه به لیست پیام‌ها
                messages.push(...chatHistory);
                
                // نمایش تعداد پیام‌های ارسال شده در کنسول برای اشکال‌زدایی
                console.log(`ارسال ${chatHistory.length} پیام به API (از مجموع ${conversation.messages.length} پیام موجود)`);
            } else {
                // اگر تاریخچه‌ای وجود ندارد، فقط پیام فعلی را ارسال کنیم
                messages.push({ role: 'user', content: message });
            }
            
            // تخمین تعداد کل توکن‌های ارسالی
            const totalTokens = messages.reduce((sum, msg) => sum + this.estimateTokens(msg.content), 0);
            console.log(`تخمین توکن‌های ارسالی: ${totalTokens}`);
            
            // ارسال درخواست به API
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: selectedModel || 'openai/gpt-3.5-turbo',
                    messages: messages
                })
            });
            
            if (!response.ok) {
                throw new Error(`خطای HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('خطا در ارسال درخواست به OpenRouter:', error);
            this.showNotification('خطا در دریافت پاسخ از هوش مصنوعی', 'error');
            return null;
        }
    }
    
    // تحلیل موضوع گفتگو برای درک بهتر زمینه
    analyzeConversationTopic(messages) {
        if (!messages || messages.length === 0) return null;
        
        // استخراج پیام‌های کاربر
        const userMessages = messages.filter(msg => msg.sender === 'user').map(msg => msg.text);
        if (userMessages.length === 0) return null;
        
        // اگر فقط یک پیام داریم، آن را برگردانیم
        if (userMessages.length === 1) {
            return userMessages[0].length > 100 ? userMessages[0].substring(0, 100) + '...' : userMessages[0];
        }
        
        // ترکیب چند پیام اول و آخر برای تشخیص موضوع
        const firstMessage = userMessages[0];
        const lastMessage = userMessages[userMessages.length - 1];
        const middleIndex = Math.floor(userMessages.length / 2);
        const middleMessage = userMessages[middleIndex];
        
        let topic = '';
        
        // افزودن بخشی از اولین پیام
        if (firstMessage.length > 50) {
            topic += firstMessage.substring(0, 50) + '... ';
        } else {
            topic += firstMessage + ' ';
        }
        
        // اگر تعداد پیام‌ها زیاد است، پیام میانی را هم اضافه کنیم
        if (userMessages.length > 3 && middleMessage !== firstMessage && middleMessage !== lastMessage) {
            if (middleMessage.length > 30) {
                topic += middleMessage.substring(0, 30) + '... ';
            } else {
                topic += middleMessage + ' ';
            }
        }
        
        // افزودن بخشی از آخرین پیام
        if (lastMessage !== firstMessage) {
            if (lastMessage.length > 50) {
                topic += lastMessage.substring(0, 50) + '...';
            } else {
                topic += lastMessage;
            }
        }
        
        return topic;
    }
    
    // آماده‌سازی تاریخچه مکالمه با رعایت محدودیت توکن
    prepareConversationHistory(messages, currentMessage) {
        // تخمین توکن برای پیام فعلی
        const currentMessageTokens = this.estimateTokens(currentMessage);
        
        // محدودیت کلی توکن (حدود 8000 توکن برای مدل‌های جدیدتر)
        const maxTokens = 8000;
        
        // کنار گذاشتن بخشی از توکن‌ها برای پاسخ
        const reservedTokens = 1500; // 1500 توکن برای پاسخ
        
        // توکن‌های قابل استفاده برای تاریخچه
        const availableTokens = maxTokens - currentMessageTokens - reservedTokens - 300; // 300 توکن برای system message و موضوع
        
        const result = [];
        let tokenCount = 0;
        
        // فیلتر کردن پیام‌های خالی
        const validMessageList = messages.filter(msg => msg.text && msg.text.trim() !== '');
        
        // خلاصه‌سازی تاریخچه در صورتی که تعداد پیام‌ها زیاد باشد
        if (validMessageList.length > 30) {
            // پیام خلاصه با موضوع کلی گفتگو
            let summaryMessage = 'خلاصه گفتگوی قبلی: در این گفتگو کاربر و دستیار هوش مصنوعی درباره موضوعات زیر صحبت کرده‌اند: ';
            
            // تجمیع موضوعات از پیام‌های کاربر (حداکثر 5 مورد)
            const userMessages = validMessageList.filter(msg => msg.sender === 'user');
            const topicCount = Math.min(5, userMessages.length);
            
            for (let i = 0; i < topicCount; i++) {
                const index = Math.floor(i * userMessages.length / topicCount);
                const shortTopic = userMessages[index].text.length > 30 ? 
                    userMessages[index].text.substring(0, 30) + '...' : 
                    userMessages[index].text;
                summaryMessage += `"${shortTopic}", `;
            }
            
            // اضافه کردن پیام خلاصه
            const summaryTokens = this.estimateTokens(summaryMessage);
            tokenCount += summaryTokens;
            
            result.push({
                role: 'system',
                content: summaryMessage
            });
        }
        
        // تقسیم پیام‌ها به سه بخش: ابتدایی، میانی و انتهایی
        const totalMessages = validMessageList.length;
        
        // همیشه 5 پیام آخر را حتماً حفظ کنیم
        const lastMessages = validMessageList.slice(-5);
        let remainingMessages = [];
        
        // اگر بیش از 5 پیام داریم، بقیه پیام‌ها را بررسی کنیم
        if (totalMessages > 5) {
            remainingMessages = validMessageList.slice(0, totalMessages - 5);
        }
        
        // ابتدا پیام‌های قدیمی را اضافه کنیم (با نمونه‌برداری اگر زیاد باشند)
        if (remainingMessages.length > 10) {
            // نمونه‌برداری از پیام‌های میانی
            const samplingStep = Math.ceil(remainingMessages.length / 10);
            
            for (let i = 0; i < remainingMessages.length; i += samplingStep) {
                if (i < remainingMessages.length) {
                    const msg = remainingMessages[i];
                    const tokens = this.estimateTokens(msg.text);
                    
                    // اگر با افزودن این پیام از حد مجاز توکن عبور می‌کنیم، ادامه نمی‌دهیم
                    if (tokenCount + tokens > availableTokens) {
                        continue;
                    }
                    
                    tokenCount += tokens;
                    const role = msg.sender === 'user' ? 'user' : 'assistant';
                    result.push({ role, content: msg.text });
                }
            }
        } else {
            // اگر تعداد پیام‌ها کم است، همه را اضافه کنیم
            for (const msg of remainingMessages) {
                const tokens = this.estimateTokens(msg.text);
                
                // اگر با افزودن این پیام از حد مجاز توکن عبور می‌کنیم، ادامه نمی‌دهیم
                if (tokenCount + tokens > availableTokens) {
                    continue;
                }
                
                tokenCount += tokens;
                const role = msg.sender === 'user' ? 'user' : 'assistant';
                result.push({ role, content: msg.text });
            }
        }
        
        // حالا 5 پیام آخر را اضافه کنیم (اینها مهم‌ترین هستند)
        for (const msg of lastMessages) {
            const tokens = this.estimateTokens(msg.text);
            
            // اگر توکن‌های ما کافی نیست، یک پیام خلاصه اضافه کنیم و خارج شویم
            if (tokenCount + tokens > availableTokens) {
                // تنها اگر هنوز پیامی اضافه نکرده‌ایم یک خلاصه اضافه کنیم
                if (result.length <= 1) { // اگر فقط خلاصه اولیه را داریم یا هیچی
                    result.push({
                        role: 'system',
                        content: 'به دلیل محدودیت توکن، نمی‌توان تمام تاریخچه گفتگو را ارسال کرد. لطفاً با توجه به آخرین پیام کاربر پاسخ دهید.'
                    });
                }
                continue;
            }
            
            tokenCount += tokens;
            const role = msg.sender === 'user' ? 'user' : 'assistant';
            result.push({ role, content: msg.text });
        }
        
        // افزودن پیام فعلی
        result.push({ role: 'user', content: currentMessage });
        
        return result;
    }
    
    // تخمین تعداد توکن‌های یک متن
    estimateTokens(text) {
        if (!text) return 0;
        
        // تخمین ساده: هر 4 کاراکتر حدود 1 توکن (برای زبان فارسی ممکن است متفاوت باشد)
        // برای دقت بیشتر در کاربردهای واقعی باید از کتابخانه‌های تخمین توکن مثل tiktoken استفاده کرد
        return Math.ceil(text.length / 4);
    }
    
    // مدیریت قابلیت ویدیو
    handleVideoFeature() {
        alert('قابلیت ویدیو - این قسمت هنوز پیاده‌سازی نشده است');
    }
    
    // آپلود فایل
    uploadFile() {
        // ایجاد یک input فایل مخفی
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*, application/pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // تحریک کلیک روی input
        fileInput.click();
        
        // رویداد انتخاب فایل
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // محدودیت حجم فایل (5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                alert('حجم فایل بیش از 5 مگابایت است. لطفاً فایل کوچکتری انتخاب کنید.');
                document.body.removeChild(fileInput);
                return;
            }
            
            // نمایش نام فایل در چت
            let fileMessage = `فایل: ${file.name}`;
            const fileSize = (file.size / 1024).toFixed(2);
            if (fileSize < 1024) {
                fileMessage += ` (${fileSize} KB)`;
            } else {
                fileMessage += ` (${(fileSize / 1024).toFixed(2)} MB)`;
            }
            
            // افزودن پیام فایل آپلود شده
            this.addMessage('user', fileMessage);
            
            // پاکسازی
            document.body.removeChild(fileInput);
            
            // مخفی کردن پیام خوش‌آمدگویی اگر نمایش داده شده است
            this.hideWelcomeMessage();
            
            // شبیه‌سازی دریافت پاسخ از هوش مصنوعی
            this.simulateAIResponse(`فایل ${file.name} با موفقیت دریافت شد. در حال پردازش فایل...`);
        });
    }
    
    // انتخاب مدل با کلیک
    selectModel(modelId, modelName) {
        const modelOptions = document.getElementById('modelOptions');
        const selectedDisplay = document.getElementById('selectedModelDisplay');
        const customSelect = document.querySelector('.custom-select');
        
        // ذخیره مدل انتخاب شده
        this.selectedModel = modelId;
        
        // به‌روزرسانی نمایش مدل انتخاب شده
        if (selectedDisplay) {
            selectedDisplay.querySelector('span').textContent = modelName;
        }
        
        // مشخص کردن مدل انتخاب شده در لیست
        if (modelOptions) {
            Array.from(modelOptions.children).forEach(option => {
                if (option.dataset.value === modelId) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });
        }
        
        // بستن کادر انتخاب
        if (customSelect) {
            customSelect.classList.remove('active');
        }
    }
    
    // انتخاب مدل با شناسه
    selectModelById(modelId) {
        const modelOptions = document.getElementById('modelOptions');
        
        if (modelOptions) {
            const option = Array.from(modelOptions.children).find(opt => opt.dataset.value === modelId);
            
            if (option) {
                this.selectModel(modelId, option.textContent);
            }
        }
    }
    
    // افزودن پیام به تاریخچه
    addToHistory(text) {
        const messageId = Date.now().toString();
        const timestamp = new Date();
        
        this.messageHistory.push({
            id: messageId,
            text,
            timestamp
        });
        
        // محدود کردن تاریخچه به 100 پیام
        if (this.messageHistory.length > 100) {
            this.messageHistory.shift();
        }
        
        // ذخیره در localStorage
        this.saveHistory();
    }
    
    // ذخیره تاریخچه در localStorage
    saveHistory() {
        try {
            localStorage.setItem('ai-assistant-history', JSON.stringify(this.messageHistory));
        } catch (e) {
            console.error('خطا در ذخیره تاریخچه:', e);
        }
    }
    
    // بارگذاری تاریخچه از localStorage
    loadHistory() {
        const savedHistory = localStorage.getItem('ai-assistant-history');
        if (savedHistory) {
            try {
                this.messageHistory = JSON.parse(savedHistory);
            } catch (e) {
                console.error('خطا در بارگذاری تاریخچه:', e);
                this.messageHistory = [];
            }
        }
    }
    
    // نمایش تاریخچه پیام‌ها
    handleHistoryFeature() {
        const historyPanel = document.getElementById('historyPanel');
        const historyButton = document.getElementById('historyButton');
        
        if (historyPanel) {
            // بررسی وضعیت فعلی پنل
            if (historyPanel.classList.contains('active')) {
                // اگر پنل باز است، آن را ببندیم
                historyPanel.classList.remove('active');
                // حذف کلاس active از دکمه تاریخچه
                if (historyButton) historyButton.classList.remove('active');
            } else {
                // اگر پنل بسته است، آن را باز کنیم
                historyPanel.classList.add('active');
                // افزودن کلاس active به دکمه تاریخچه
                if (historyButton) historyButton.classList.add('active');
                
                // بارگذاری تاریخچه
                this.loadHistory();
                
                // نمایش تاریخچه
                this.renderChatHistory();
            }
        }
    }
    
    // بستن پنل تاریخچه
    closeHistory() {
        const historyPanel = document.getElementById('historyPanel');
        const historyButton = document.getElementById('historyButton');
        
        if (historyPanel) {
            historyPanel.classList.remove('active');
            // حذف کلاس active از دکمه تاریخچه
            if (historyButton) historyButton.classList.remove('active');
        }
    }
    
    // ذخیره کردن کل گفتگوی فعلی
    saveCurrentChat() {
        // یافتن گفتگوی فعلی
        const conversation = this.conversations.find(c => c.id === this.currentConversationId);
        if (!conversation || conversation.messages.length === 0) {
            this.showNotification('هیچ گفتگویی برای ذخیره وجود ندارد', 'warning');
            return;
        }
        
        // استخراج خلاصه گفتگو (اولین پیام کاربر)
        let summary = 'گفتگو';
        for (const msg of conversation.messages) {
            if (msg.sender === 'user') {
                summary = msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text;
                break;
            }
        }
        
        // بررسی وجود گفتگو در تاریخچه
        const existingChatIndex = this.chatHistory.findIndex(chat => 
            chat.conversation && chat.conversation.id === conversation.id
        );
        
        // تاریخ و زمان فعلی
        const timestamp = new Date();
        
        if (existingChatIndex !== -1) {
            // اگر گفتگو قبلاً ذخیره شده است، آن را به‌روزرسانی کنیم
            const existingChat = this.chatHistory[existingChatIndex];
            
            // به‌روزرسانی پیام‌های گفتگو
            existingChat.conversation.messages = JSON.parse(JSON.stringify(conversation.messages));
            
            // به‌روزرسانی زمان آخرین تغییر
            existingChat.timestamp = timestamp;
            
            // به‌روزرسانی خلاصه
            existingChat.summary = summary;
            
            // نمایش اعلان موفقیت
            this.showNotification('گفتگو با موفقیت در تاریخچه به‌روزرسانی شد', 'success');
        } else {
            // اگر گفتگو جدید است، یک آیتم جدید ایجاد کنیم
            const chatId = Date.now().toString();
            
            // ذخیره گفتگو در تاریخچه
            this.chatHistory.push({
                id: chatId,
                summary,
                timestamp,
                conversation: JSON.parse(JSON.stringify(conversation))
            });
            
            // نمایش اعلان موفقیت
            this.showNotification('گفتگو با موفقیت در تاریخچه ذخیره شد', 'success');
        }
        
        // محدود کردن تاریخچه به 100 گفتگو
        if (this.chatHistory.length > 100) {
            this.chatHistory.shift();
        }
        
        // ذخیره در localStorage
        this.saveChatHistory();
    }
    
    // ذخیره تاریخچه گفتگوها در localStorage
    saveChatHistory() {
        try {
            localStorage.setItem('ai-assistant-chat-history', JSON.stringify(this.chatHistory));
        } catch (e) {
            console.error('خطا در ذخیره تاریخچه گفتگوها:', e);
        }
    }
    
    // بارگذاری تاریخچه گفتگوها از localStorage
    loadHistory() {
        // بارگذاری تاریخچه پیام‌ها (برای سازگاری با نسخه قبلی)
        const savedHistory = localStorage.getItem('ai-assistant-history');
        if (savedHistory) {
            try {
                this.messageHistory = JSON.parse(savedHistory);
            } catch (e) {
                console.error('خطا در بارگذاری تاریخچه پیام‌ها:', e);
                this.messageHistory = [];
            }
        }
        
        // بارگذاری تاریخچه گفتگوها
        const savedChatHistory = localStorage.getItem('ai-assistant-chat-history');
        if (savedChatHistory) {
            try {
                this.chatHistory = JSON.parse(savedChatHistory);
            } catch (e) {
                console.error('خطا در بارگذاری تاریخچه گفتگوها:', e);
                this.chatHistory = [];
            }
        } else {
            this.chatHistory = [];
        }
    }
    
    // نمایش تاریخچه گفتگوها در پنل
    renderChatHistory() {
        const historyContainer = document.getElementById('historyContainer');
        const noHistory = document.getElementById('noHistory');
        
        if (!historyContainer || !noHistory) return;
        
        // پاکسازی محتوای قبلی
        historyContainer.innerHTML = '';
        
        // اضافه کردن دکمه ذخیره گفتگوی فعلی
        const saveButton = document.createElement('button');
        saveButton.className = 'save-chat-btn';
        saveButton.innerHTML = '<i class="fas fa-save"></i> ذخیره گفتگوی فعلی';
        saveButton.addEventListener('click', () => this.saveCurrentChat());
        historyContainer.appendChild(saveButton);
        
        // افزودن جداکننده
        const divider = document.createElement('div');
        divider.className = 'history-divider';
        historyContainer.appendChild(divider);
        
        // بررسی وجود تاریخچه
        if (this.chatHistory.length === 0 && this.messageHistory.length === 0) {
            historyContainer.style.display = 'flex';
            noHistory.style.display = 'flex';
            return;
        }
        
        // نمایش تاریخچه
        historyContainer.style.display = 'flex';
        noHistory.style.display = 'none';
        
        // نمایش تاریخچه گفتگوها (اولویت با گفتگوهای کامل)
        if (this.chatHistory.length > 0) {
            const chatHistoryHeader = document.createElement('h3');
            chatHistoryHeader.className = 'history-section-title';
            chatHistoryHeader.textContent = 'گفتگوهای ذخیره شده';
            historyContainer.appendChild(chatHistoryHeader);
            
            // مرتب‌سازی تاریخچه بر اساس زمان (جدیدترین در بالا)
            const sortedChatHistory = [...this.chatHistory].sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            
            // ایجاد آیتم‌های تاریخچه گفتگو
            sortedChatHistory.forEach(chat => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item chat-history-item';
                historyItem.dataset.id = chat.id;
                
                // فرمت تاریخ و زمان
                const date = new Date(chat.timestamp);
                const formattedDate = this.formatDate(date);
                
                // تعداد پیام‌های گفتگو
                const messageCount = chat.conversation.messages.length;
                
                historyItem.innerHTML = `
                    <span class="history-date">${formattedDate}</span>
                    <div class="history-content">
                        <div class="history-summary">${chat.summary}</div>
                        <div class="message-count">${messageCount} پیام</div>
                    </div>
                    <div class="history-actions">
                        <button class="history-delete">
                            <i class="fas fa-trash-alt"></i>
                            حذف
                        </button>
                    </div>
                `;
                
                // رویداد کلیک روی دکمه حذف
                const deleteButton = historyItem.querySelector('.history-delete');
                if (deleteButton) {
                    deleteButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.selectedChatId = chat.id;
                        this.showConfirmDialog('chat');
                    });
                }
                
                // رویداد کلیک روی آیتم تاریخچه برای بازیابی گفتگو
                historyItem.addEventListener('click', () => {
                    this.loadChatFromHistory(chat.id);
                });
                
                historyContainer.appendChild(historyItem);
            });
        }
        
        // نمایش تاریخچه پیام‌های تکی (برای سازگاری با نسخه قبلی)
        if (this.messageHistory.length > 0) {
            // افزودن جداکننده اگر هر دو نوع تاریخچه موجود باشند
            if (this.chatHistory.length > 0) {
                const anotherDivider = document.createElement('div');
                anotherDivider.className = 'history-divider';
                historyContainer.appendChild(anotherDivider);
                
                const msgHistoryHeader = document.createElement('h3');
                msgHistoryHeader.className = 'history-section-title';
                msgHistoryHeader.textContent = 'پیام‌های قبلی';
                historyContainer.appendChild(msgHistoryHeader);
            }
            
            // مرتب‌سازی تاریخچه بر اساس زمان (جدیدترین در بالا)
            const sortedHistory = [...this.messageHistory].sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            
            // ایجاد آیتم‌های تاریخچه پیام
            sortedHistory.forEach(message => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item message-history-item';
                historyItem.dataset.id = message.id;
                
                // فرمت تاریخ و زمان
                const date = new Date(message.timestamp);
                const formattedDate = this.formatDate(date);
                
                historyItem.innerHTML = `
                    <span class="history-date">${formattedDate}</span>
                    <div class="history-content">${message.text}</div>
                    <div class="history-actions">
                        <button class="history-delete">
                            <i class="fas fa-trash-alt"></i>
                            حذف
                        </button>
                    </div>
                `;
                
                // رویداد کلیک روی دکمه حذف
                const deleteButton = historyItem.querySelector('.history-delete');
                if (deleteButton) {
                    deleteButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.selectedMessageId = message.id;
                        this.showConfirmDialog('message');
                    });
                }
                
                // رویداد کلیک روی آیتم تاریخچه برای ارسال مجدد
                historyItem.addEventListener('click', () => {
                    // پر کردن فیلد ورودی با متن پیام
                    this.messageInput.value = message.text;
                    this.autoResizeTextarea();
                    
                    // بستن پنل تاریخچه
                    this.closeHistory();
                    
                    // فوکوس روی فیلد ورودی
                    this.messageInput.focus();
                });
                
                historyContainer.appendChild(historyItem);
            });
        }
    }
    
    // بازیابی گفتگو از تاریخچه
    loadChatFromHistory(chatId) {
        // یافتن گفتگوی ذخیره شده
        const savedChat = this.chatHistory.find(chat => chat.id === chatId);
        if (!savedChat) return;
        
        // ایجاد یک گفتگوی جدید بر اساس گفتگوی ذخیره شده
        this.currentConversationId = Date.now().toString();
        const newConversation = {
            id: this.currentConversationId,
            messages: JSON.parse(JSON.stringify(savedChat.conversation.messages))
        };
        
        // افزودن به لیست گفتگوها
        this.conversations.push(newConversation);
        
        // ذخیره تغییرات
        this.saveConversations();
        
        // پاکسازی پیام‌های قبلی
        this.clearChatMessages();
        
        // نمایش پیام‌های گفتگو
        if (newConversation.messages.length > 0) {
            this.hideWelcomeMessage();
            newConversation.messages.forEach(msg => {
                const messageElement = this.createMessageElement(msg.sender, msg.text);
                this.chatContainer.insertBefore(messageElement, this.inputContainer);
            });
            
            // اسکرول به پایین چت پس از بارگذاری پیام‌ها
            this.isScrolledToBottom = true;
            this.scrollToBottom();
        } else {
            this.showWelcomeMessage();
        }
        
        // بستن پنل تاریخچه
        this.closeHistory();
        
        // اسکرول به بالای صفحه
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // نمایش اعلان موفقیت
        this.showNotification('گفتگوی ذخیره شده با موفقیت بازیابی شد', 'success');
    }
    
    // نمایش دیالوگ تأیید حذف
    showConfirmDialog(type = 'message') {
        const confirmDialog = document.getElementById('confirmDialog');
        const confirmTitle = confirmDialog ? confirmDialog.querySelector('.confirm-title') : null;
        
        if (confirmDialog) {
            // تغییر عنوان دیالوگ بر اساس نوع حذف
            if (confirmTitle) {
                if (type === 'chat') {
                    confirmTitle.textContent = 'آیا از حذف این گفتگو اطمینان دارید؟';
                } else {
                    confirmTitle.textContent = 'آیا از حذف این پیام اطمینان دارید؟';
                }
            }
            
            // ذخیره نوع حذف
            this.deleteType = type;
            
            // نمایش دیالوگ
            confirmDialog.classList.add('show');
        }
    }
    
    // حذف آیتم انتخاب شده
    deleteSelectedMessage() {
        if (this.deleteType === 'chat') {
            // حذف گفتگو از تاریخچه
            if (!this.selectedChatId) return;
            
            this.chatHistory = this.chatHistory.filter(chat => chat.id !== this.selectedChatId);
            this.saveChatHistory();
        } else {
            // حذف پیام از تاریخچه
            if (!this.selectedMessageId) return;
            
            this.messageHistory = this.messageHistory.filter(message => message.id !== this.selectedMessageId);
            this.saveHistory();
        }
        
        // به‌روزرسانی نمایش تاریخچه
        this.renderChatHistory();
        
        // مخفی کردن دیالوگ تأیید
        this.hideConfirmDialog();
        
        // نمایش اعلان موفقیت
        this.showNotification(this.deleteType === 'chat' ? 'گفتگو با موفقیت حذف شد' : 'پیام با موفقیت حذف شد', 'success');
    }
    
    // مخفی کردن دیالوگ تأیید حذف
    hideConfirmDialog() {
        const confirmDialog = document.getElementById('confirmDialog');
        if (confirmDialog) {
            confirmDialog.classList.remove('show');
            this.selectedMessageId = null;
            this.selectedChatId = null;
            this.deleteType = null;
        }
    }
    
    // فرمت‌بندی تاریخ و زمان
    formatDate(date) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const isToday = date >= today;
        const isYesterday = date >= yesterday && date < today;
        
        // تنظیم فرمت ساعت
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        const time = date.toLocaleTimeString('fa-IR', timeOptions);
        
        // اگر امروز است، فقط ساعت را نمایش دهیم
        if (isToday) {
            return `امروز، ${time}`;
        }
        
        // اگر دیروز است، دیروز + ساعت را نمایش دهیم
        if (isYesterday) {
            return `دیروز، ${time}`;
        }
        
        // در غیر این صورت، تاریخ کامل را نمایش دهیم
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = date.toLocaleDateString('fa-IR', dateOptions);
        
        return `${formattedDate}، ${time}`;
    }
}

// مهلت کوتاه برای اطمینان از بارگذاری کامل DOM
document.addEventListener('DOMContentLoaded', () => {
    // ایجاد نمونه از کلاس دستیار
    window.assistant = new AIAssistant();
    
    // رجیستر سرویس ورکر برای PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered with scope:', reg.scope))
            .catch(err => console.error('Service Worker registration failed:', err));
    }
    
    // بررسی وضعیت حالت نمایش
    if (window.matchMedia('(display-mode: standalone)').matches) {
        document.body.classList.add('pwa-installed');
        console.log('برنامه در حالت نصب شده اجرا می‌شود');
    }
    
    // تنظیم رویداد نصب PWA
    let deferredPrompt;
    const installButton = document.createElement('button');
    installButton.classList.add('install-button');
    installButton.textContent = 'نصب برنامه';
    installButton.style.display = 'none';
    document.body.appendChild(installButton);
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installButton.style.display = 'block';
        
        installButton.addEventListener('click', () => {
            installButton.style.display = 'none';
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('کاربر برنامه را نصب کرد');
                } else {
                    console.log('کاربر از نصب برنامه انصراف داد');
                }
                deferredPrompt = null;
            });
        });
    });
    
    // اگر برنامه به صورت PWA باز شده باشد
    window.addEventListener('appinstalled', (evt) => {
        console.log('برنامه با موفقیت نصب شد');
        document.body.classList.add('pwa-installed');
        installButton.style.display = 'none';
    });
    
    // بررسی پارامتر url
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new') === 'true') {
        console.log('درخواست چت جدید از طریق شورت‌کات');
        window.assistant.createNewChat();
    }
    
    // افزودن رویداد برای ذخیره خودکار چت قبل از رفرش یا بستن صفحه
    window.addEventListener('beforeunload', () => {
        if (window.assistant) {
            window.assistant.autoSaveCurrentChat();
        }
    });
}); 