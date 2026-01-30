// Personal Management Dashboard - Frontend Application
class PersonalManagementApp {
    constructor() {
        // Dynamic API base URL for Railway.app deployment
        this.apiBase = this.getApiBase();
        this.currentUser = null;
        this.init();
    }

    getApiBase() {
        // Enhanced API base URL detection for Railway.app deployment
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        // If on Railway (or any production domain), use relative path
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return '/api';
        }
        
        // Local development - use the current port or fallback to 6000
        const localPort = port || 6000;
        return `http://localhost:${localPort}/api`;
    }

    async init() {
        this.setupEventListeners();
        await this.checkAuthStatus();
    }

    setupEventListeners() {
        // DOM Elements
        this.loginContainer = document.getElementById('loginContainer');
        this.dashboardContainer = document.getElementById('dashboardContainer');
        this.loginForm = document.getElementById('loginForm');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.navLinks = document.querySelectorAll('.nav-menu a');
        this.sections = document.querySelectorAll('.section');
        this.notification = document.getElementById('notification');
        this.notificationTitle = document.getElementById('notificationTitle');
        this.notificationMessage = document.getElementById('notificationMessage');
        this.closeNotification = document.getElementById('closeNotification');

        // Login form submission
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Logout functionality
        this.logoutBtn.addEventListener('click', () => this.handleLogout());

        // Navigation between sections
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Notification functionality
        this.closeNotification.addEventListener('click', () => {
            this.notification.style.display = 'none';
        });

        // Form submissions
        document.getElementById('addTimetableBtn')?.addEventListener('click', () => this.addTimetable());
        document.getElementById('addModuleBtn')?.addEventListener('click', () => this.addModule());
        document.getElementById('addMoneyBtn')?.addEventListener('click', () => this.addMoneyRecord());
        document.getElementById('addSavingsBtn')?.addEventListener('click', () => this.addSavings());
        document.getElementById('addAppointmentBtn')?.addEventListener('click', () => this.addAppointment());
        document.getElementById('addJourneyBtn')?.addEventListener('click', () => this.addJourney());
        document.getElementById('addMarksBtn')?.addEventListener('click', () => this.addMarks());
        document.getElementById('clearActivitiesBtn')?.addEventListener('click', () => this.clearRecentActivities());

        // Event delegation for action buttons
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const action = button.dataset.action;
            const id = button.dataset.id;

            if (action && id) {
                e.preventDefault();
                switch (action) {
                    case 'edit-module':
                        this.editModule(parseInt(id));
                        break;
                    case 'delete-module':
                        this.deleteModule(parseInt(id));
                        break;
                    case 'edit-timetable':
                        this.editTimetable(parseInt(id));
                        break;
                    case 'delete-timetable':
                        this.deleteTimetable(parseInt(id));
                        break;
                    case 'edit-money':
                        this.editMoney(parseInt(id));
                        break;
                    case 'delete-money':
                        this.deleteMoney(parseInt(id));
                        break;
                    case 'edit-appointment':
                        this.editAppointment(parseInt(id));
                        break;
                    case 'delete-appointment':
                        this.deleteAppointment(parseInt(id));
                        break;
                    case 'edit-journey':
                        this.editJourney(parseInt(id));
                        break;
                    case 'delete-journey':
                        this.deleteJourney(parseInt(id));
                        break;
                    case 'edit-savings':
                        this.editSavings(parseInt(id));
                        break;
                    case 'delete-savings':
                        this.deleteSavings(parseInt(id));
                        break;
                }
            }
        });
    }

    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.apiBase}/auth/status`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    this.currentUser = data.user;
                    this.showDashboard();
                } else {
                    this.showLogin();
                }
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showLogin();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.showDashboard();
                this.showNotification('Login Successful', `Welcome back, ${username}!`);
            } else {
                const error = await response.json();
                alert(error.message || 'Login failed. Try admin/admin123');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    }

    async handleLogout() {
        try {
            await fetch(`${this.apiBase}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        this.currentUser = null;
        this.showLogin();
    }

    handleNavigation(e) {
        e.preventDefault();

        // Remove active class from all links
        this.navLinks.forEach(item => item.classList.remove('active'));

        // Add active class to clicked link
        e.target.classList.add('active');

        // Hide all sections
        this.sections.forEach(section => section.classList.remove('active'));

        // Show selected section
        const sectionId = e.target.getAttribute('data-section');
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
        }

        // Load section-specific data
        this.loadSectionData(sectionId);
    }

    async loadSectionData(sectionId) {
        switch (sectionId) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'timetable':
                await this.loadTimetable();
                break;
            case 'ca-marks':
                await this.loadMarks();
                await this.loadModulesIntoSelect();
                break;
            case 'money-circle':
                await this.loadMoney();
                await this.loadSavings();
                break;
            case 'modules':
                await this.loadModules();
                break;
            case 'appointments':
                await this.loadAppointments();
                break;
            case 'skills':
                this.loadSkillsData();
                break;
            case 'journeys':
                await this.loadJourneys();
                break;
        }
    }

    showLogin() {
        this.loginContainer.style.display = 'flex';
        this.dashboardContainer.style.display = 'none';
    }

    showDashboard() {
        this.loginContainer.style.display = 'none';
        this.dashboardContainer.style.display = 'block';
        document.getElementById('currentUser').textContent = this.currentUser?.username || 'Admin User';
        this.loadDashboardData();
        this.startAutoRefresh(); // Start auto-refresh
    }

    showNotification(title, message) {
        this.notificationTitle.textContent = title;
        this.notificationMessage.textContent = message;
        this.notification.style.display = 'flex';

        setTimeout(() => {
            this.notification.style.display = 'none';
        }, 5000);
    }

    async apiCall(endpoint, options = {}) {
        try {
            const url = `${this.apiBase}${endpoint}`;
            console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                credentials: 'include',
                ...options
            });

            console.log(`📡 Response status: ${response.status}`);

            const data = await response.json();
            console.log(`✅ API Response:`, data);

            if (!response.ok) {
                // Handle backend error responses
                let errorMessage = 'Failed to add data. Please try again.';
                
                if (data.error) {
                    // Extract error from nested error object
                    if (data.error.message) {
                        errorMessage = data.error.message;
                    } else if (data.error.original) {
                        errorMessage = data.error.original;
                    }
                    
                    // Add suggestion if available
                    if (data.error.suggestion) {
                        errorMessage += `\n\nSuggestion: ${data.error.suggestion}`;
                    }
                } else if (data.message) {
                    errorMessage = data.message;
                } else {
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                }
                
                throw new Error(errorMessage);
            }

            // Handle success responses with enhanced format
            if (data.success && data.data) {
                return data.data;
            }
            
            return data;
        } catch (error) {
            console.error('❌ API call failed:', error);
            
            // Show user-friendly error message
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error - please check your connection');
            } else if (error.message.includes('HTTP error! status: 500')) {
                throw new Error('Server error - please try again later');
            } else {
                throw error;
            }
        }
    }

    // Dashboard methods
    async loadDashboardData() {
        try {
            console.log('🔄 Loading dashboard data...');
            const data = await this.apiCall('/dashboard/stats');
            console.log('📊 Dashboard data received:', data);
            
            // Update dashboard with animated counters - only update existing elements
            console.log('🔄 Updating dashboard counters...');
            this.animateCounter('moduleCount', data.moduleCount || 0);
            this.animateCounter('appointmentCount', data.appointmentCount || 0);
            this.animateCounter('moneyOwed', data.moneyOwed || 0);
            this.animateCounter('journeyCount', data.journeyCount || 0);
            
            // Try to update additional elements if they exist
            this.animateCounter('appointmentCompleted', data.appointmentCompleted || 0);
            this.animateCounter('moneyReturned', data.moneyReturned || 0);
            this.animateCounter('journeyCompleted', data.journeyCompleted || 0);
            this.animateCounter('savingsTotal', data.savingsTotal || 0);
            this.animateCounter('examCount', data.examCount || 0);
            this.animateCounter('recentActivityCount', data.recentActivityCount || 0);
            
            // Update progress bars and percentages if elements exist
            this.updateProgressBars(data);
            
            // Load recent activities
            await this.loadRecentActivities();
            
            // Load CA marks progress
            await this.loadCAMarksProgress();
            
            console.log('✅ Dashboard data loaded and updated successfully');
            
            // Force a visual update to ensure changes are visible
            this.forceDashboardUpdate();
            
        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
            alert('Failed to load dashboard data. Please try refreshing the page.');
        }
    }

    forceDashboardUpdate() {
        // Force a visual update by manually updating the display
        console.log('🔄 Forcing dashboard visual update...');
        
        const moduleCount = document.getElementById('moduleCount');
        const appointmentCount = document.getElementById('appointmentCount');
        const moneyOwed = document.getElementById('moneyOwed');
        const journeyCount = document.getElementById('journeyCount');
        
        if (moduleCount) {
            const currentValue = moduleCount.textContent;
            moduleCount.textContent = '0';
            setTimeout(() => {
                moduleCount.textContent = currentValue;
                console.log('🔄 Module count updated:', currentValue);
            }, 100);
        }
        
        if (appointmentCount) {
            const currentValue = appointmentCount.textContent;
            appointmentCount.textContent = '0';
            setTimeout(() => {
                appointmentCount.textContent = currentValue;
                console.log('🔄 Appointment count updated:', currentValue);
            }, 100);
        }
        
        if (moneyOwed) {
            const currentValue = moneyOwed.textContent;
            moneyOwed.textContent = '0';
            setTimeout(() => {
                moneyOwed.textContent = currentValue;
                console.log('🔄 Money owed updated:', currentValue);
            }, 100);
        }
        
        if (journeyCount) {
            const currentValue = journeyCount.textContent;
            journeyCount.textContent = '0';
            setTimeout(() => {
                journeyCount.textContent = currentValue;
                console.log('🔄 Journey count updated:', currentValue);
            }, 100);
        }
    }

    updateProgressBars(data) {
        // Calculate percentages for progress bars
        const appointmentTotal = (data.appointmentCount || 0) + (data.appointmentCompleted || 0);
        const appointmentCompletion = appointmentTotal > 0 ? (data.appointmentCompleted / appointmentTotal * 100) : 0;
        
        const journeyTotal = (data.journeyCount || 0) + (data.journeyCompleted || 0);
        const journeyCompletion = journeyTotal > 0 ? (data.journeyCompleted / journeyTotal * 100) : 0;
        
        const moneyTotal = (data.moneyOwed || 0) + (data.moneyReturned || 0);
        const moneyReturnRate = moneyTotal > 0 ? (data.moneyReturned / moneyTotal * 100) : 0;
        
        // Update progress bars if elements exist
        this.updateProgressBar('appointmentProgress', appointmentCompletion);
        this.updateProgressBar('journeyProgress', journeyCompletion);
        this.updateProgressBar('moneyProgress', moneyReturnRate);
        
        // Update status text
        this.updateStatusText('appointmentStatus', `${data.appointmentCompleted || 0}/${appointmentTotal} completed`);
        this.updateStatusText('journeyStatus', `${data.journeyCompleted || 0}/${journeyTotal} completed`);
        this.updateStatusText('moneyStatus', `${this.formatCurrency(data.moneyReturned || 0)} returned`);
    }

    updateProgressBar(elementId, percentage) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.width = `${percentage}%`;
            element.setAttribute('aria-valuenow', percentage);
            element.textContent = `${Math.round(percentage)}%`;
        }
    }

    updateStatusText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    formatCurrency(amount) {
        return parseFloat(amount || 0).toLocaleString() + ' TZS';
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.log(`⚠️ Dashboard element '${elementId}' not found - skipping update`);
            return;
        }
        
        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000; // 1 second animation
        const steps = 30;
        const increment = (targetValue - startValue) / steps;
        let currentStep = 0;
        
        console.log(`🔄 Animating counter '${elementId}': ${startValue} → ${targetValue}`);
        
        const timer = setInterval(() => {
            currentStep++;
            const currentValue = Math.round(startValue + (increment * currentStep));
            element.textContent = currentValue.toLocaleString();
            
            if (currentStep >= steps) {
                element.textContent = targetValue.toLocaleString();
                clearInterval(timer);
                console.log(`✅ Counter '${elementId}' animation complete: ${targetValue}`);
            }
        }, duration / steps);
    }

    // Auto-refresh dashboard every 10 seconds for more dynamic updates
    startAutoRefresh() {
        // Clear any existing interval
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        this.autoRefreshInterval = setInterval(async () => {
            console.log('🔄 Auto-refreshing dashboard...');
            await this.loadDashboardData();
        }, 10000); // 10 seconds for more dynamic updates
    }

    // Stop auto-refresh when needed
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    async loadRecentActivities() {
        try {
            console.log('🔄 Loading recent activities...');
            const activities = await this.apiCall('/activities');
            console.log('📋 Activities loaded:', activities);
            
            const tbody = document.getElementById('recentActivities');
            if (!tbody) {
                console.error('❌ recentActivities tbody not found');
                return;
            }
            
            tbody.innerHTML = '';

            if (!activities || activities.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `<td colspan="4" style="text-align: center; color: #666;">No recent activities</td>`;
                tbody.appendChild(row);
                return;
            }

            activities.slice(0, 5).forEach(activity => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.formatDate(activity.activity_date || activity.created_at)}</td>
                    <td>${activity.description}</td>
                    <td>${activity.type}</td>
                    <td><span class="status status-${activity.status}">${activity.status}</span></td>
                `;
                tbody.appendChild(row);
            });
            
            console.log(`✅ Displayed ${Math.min(5, activities.length)} activities`);
        } catch (error) {
            console.error('❌ Failed to load activities:', error);
            const tbody = document.getElementById('recentActivities');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Failed to load activities</td></tr>`;
            }
        }
    }

    // Clear recent activities
    async clearRecentActivities() {
        if (confirm('Are you sure you want to clear all recent activities? This action cannot be undone.')) {
            try {
                console.log('🗑️ Clearing recent activities...');
                const result = await this.apiCall('/activities', {
                    method: 'DELETE'
                });
                console.log('✅ Activities cleared:', result);
                
                // Reload activities to show empty list
                await this.loadRecentActivities();
                
                this.showNotification('Activities Cleared', 'All recent activities have been cleared successfully');
            } catch (error) {
                console.error('❌ Failed to clear activities:', error);
                alert('Failed to clear activities. Please try again.');
            }
        }
    }

    // CA Marks Progress methods
    async loadCAMarksProgress() {
        try {
            console.log('🔄 Loading CA marks progress...');
            const progressData = await this.apiCall('/ca-marks-progress');
            console.log('📊 CA marks progress data:', progressData);
            
            this.updateCAMarksDisplay(progressData);
            console.log('✅ CA marks progress updated successfully');
        } catch (error) {
            console.error('❌ Failed to load CA marks progress:', error);
            this.updateCAMarksDisplay(null);
        }
    }

    updateCAMarksDisplay(progressData) {
        // Update overall progress circle
        const progressBar = document.getElementById('caProgressBar');
        const percentageText = document.getElementById('caPercentage');
        const statusValue = document.getElementById('caStatusValue');
        
        // Always ensure we have valid data - never show null
        const totalModules = progressData ? progressData.totalModules || 0 : 0;
        const percentage = progressData ? progressData.percentage || 0 : 0;
        const status = progressData ? progressData.status || 'failed' : 'failed';
        const modules = progressData ? progressData.modules || [] : [];
        const excellentModules = progressData ? progressData.excellentModules || 0 : 0;
        const goodModules = progressData ? progressData.goodModules || 0 : 0;
        const failedModules = progressData ? progressData.failedModules || 0 : 0;
        
        console.log(`🔄 Updating CA Display: ${totalModules} modules, ${percentage}%, status: ${status}`);
        console.log(`📊 Module Breakdown: ${excellentModules} Excellent, ${goodModules} Good, ${failedModules} Failed`);
        
        // Calculate progress circle values
        const circumference = 2 * Math.PI * 50; // radius = 50
        const offset = circumference - (percentage / 100) * circumference;
        
        // Update progress circle - always show something
        if (progressBar) {
            progressBar.style.strokeDasharray = `${circumference} ${circumference}`;
            progressBar.style.strokeDashoffset = offset;
        }
        
        // Update percentage text - always show percentage
        if (percentageText) {
            percentageText.textContent = `${percentage}%`;
        }
        
        // Update status - always show dynamic status
        if (statusValue) {
            statusValue.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            statusValue.className = `status-value ${status}`;
        }
        
        // Update module progress list
        this.updateModuleProgressList(modules);
    }

    updateModuleProgressList(modules) {
        const moduleList = document.getElementById('moduleProgressList');
        if (!moduleList) return;
        
        if (!modules || modules.length === 0) {
            moduleList.innerHTML = '<p style="text-align: center; color: #666;">No CA marks recorded yet. Add marks to see progress!</p>';
            return;
        }
        
        moduleList.innerHTML = '';
        
        modules.forEach(module => {
            const moduleItem = document.createElement('div');
            moduleItem.className = 'module-progress-item';
            moduleItem.innerHTML = `
                <div class="module-info">
                    <div class="module-name">${module.moduleName} (${module.moduleCode})</div>
                    <div class="module-marks">${module.totalMarks}/40 marks from ${module.assessmentCount} assessments</div>
                </div>
                <div class="module-status">
                    <span class="module-status-badge ${module.status}">${module.status.toUpperCase()}</span>
                </div>
                <div class="module-progress-bar">
                    <div class="module-progress-fill" style="width: ${module.percentage}%"></div>
                </div>
                <div class="module-percentage">${module.percentage}%</div>
            `;
            moduleList.appendChild(moduleItem);
        });
    }

    // Timetable methods
    async loadTimetable() {
        try {
            const timetable = await this.apiCall('/timetable');
            const tbody = document.getElementById('timetableBody');
            tbody.innerHTML = '';

            timetable.forEach(exam => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${exam.module_code}</td>
                    <td>${exam.module_name}</td>
                    <td>${this.formatDate(exam.exam_date)}</td>
                    <td>${exam.exam_time}</td>
                    <td>${exam.venue || 'N/A'}</td>
                    <td>
                        <button class="action-btn edit-btn" data-id="${exam.id}" data-action="edit-timetable"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn" data-id="${exam.id}" data-action="delete-timetable"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Failed to load timetable:', error);
        }
    }

    async addTimetable() {
        const moduleCode = document.getElementById('moduleCode').value;
        const moduleName = document.getElementById('moduleName').value;
        const examDate = document.getElementById('examDate').value;
        const examTime = document.getElementById('examTime').value;
        const examVenue = document.getElementById('examVenue').value;

        if (!moduleCode || !moduleName || !examDate || !examTime) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await this.apiCall('/timetable', {
                method: 'POST',
                body: JSON.stringify({
                    moduleCode,
                    moduleName,
                    date: examDate,
                    time: examTime,
                    venue: examVenue
                })
            });

            this.clearTimetableForm();
            await this.loadTimetable();
            await this.loadDashboardData();
            this.showNotification('Exam Added', `Added ${moduleName} to timetable`);
        } catch (error) {
            console.error('Failed to add timetable:', error);
            alert(`Failed to add exam: ${error.message}`);
        }
    }

    clearTimetableForm() {
        document.getElementById('moduleCode').value = '';
        document.getElementById('moduleName').value = '';
        document.getElementById('examDate').value = '';
        document.getElementById('examTime').value = '';
        document.getElementById('examVenue').value = '';
    }

    // Marks methods
    async loadMarks() {
        try {
            const marks = await this.apiCall('/marks');
            const tbody = document.getElementById('marksBody');
            tbody.innerHTML = '';

            marks.forEach(mark => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${mark.module_name || mark.moduleName || 'N/A'}</td>
                    <td>${mark.lecturer || 'N/A'}</td>
                    <td>${this.formatCategory(mark.category)}</td>
                    <td>${mark.marks}</td>
                    <td>${this.formatDate(mark.marks_date || mark.date)}</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="app.editMarks(${mark.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn" onclick="app.deleteMarks(${mark.id})"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Failed to load marks:', error);
        }
    }

    async addMarks() {
        const moduleId = document.getElementById('moduleSelect').value;
        const category = document.getElementById('categorySelect').value;
        const marks = document.getElementById('marksInput').value;

        if (!moduleId || !marks) {
            alert('Please select a module and enter marks');
            return;
        }

        try {
            await this.apiCall('/marks', {
                method: 'POST',
                body: JSON.stringify({
                    moduleId,
                    category,
                    marks: parseFloat(marks)
                })
            });

            document.getElementById('marksInput').value = '';
            await this.loadMarks();
            await this.loadCAMarksProgress(); // Update CA marks progress
            this.showNotification('Marks Added', `Added ${marks} marks`);
        } catch (error) {
            console.error('Failed to add marks:', error);
            alert(`Failed to add marks: ${error.message}`);
        }
    }

    async editMarks(id) {
        try {
            const marks = await this.apiCall('/marks');
            const mark = marks.find(m => m.id === id);
            
            if (!mark) {
                alert('Marks not found');
                return;
            }
            
            // Populate form with existing data
            document.getElementById('moduleSelect').value = mark.module_id;
            document.getElementById('categorySelect').value = mark.category;
            document.getElementById('marksInput').value = mark.marks;
            
            // Change button to update mode
            const addBtn = document.getElementById('addMarksBtn');
            addBtn.innerHTML = '<i class="fas fa-save"></i> Update Marks';
            addBtn.onclick = () => this.updateMarks(id);
            
            // Scroll to form
            document.getElementById('ca-marks').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Failed to edit marks:', error);
            alert('Failed to load marks for editing');
        }
    }

    async updateMarks(id) {
        try {
            const moduleId = document.getElementById('moduleSelect').value;
            const category = document.getElementById('categorySelect').value;
            const marks = document.getElementById('marksInput').value;

            if (!moduleId || !marks) {
                alert('Please select a module and enter marks');
                return;
            }

            await this.apiCall(`/marks/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    moduleId,
                    category,
                    marks: parseFloat(marks)
                })
            });

            // Reset button to add mode
            const addBtn = document.getElementById('addMarksBtn');
            addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Marks';
            addBtn.onclick = () => this.addMarks();

            // Clear form and reload
            document.getElementById('marksInput').value = '';
            await this.loadMarks();
            await this.loadCAMarksProgress(); // Update CA marks progress
            this.showNotification('Marks Updated', `Updated marks to ${marks}`);
        } catch (error) {
            console.error('Failed to update marks:', error);
            alert(`Failed to update marks: ${error.message}`);
        }
    }

    async deleteMarks(id) {
        if (confirm('Are you sure you want to delete these marks?')) {
            try {
                await this.apiCall(`/marks/${id}`, { method: 'DELETE' });
                await this.loadMarks();
                await this.loadCAMarksProgress(); // Update CA marks progress
                this.showNotification('Marks Deleted', 'Marks have been deleted successfully');
            } catch (error) {
                console.error('Failed to delete marks:', error);
                alert('Failed to delete marks. Please try again.');
            }
        }
    }

    // Money methods
    async loadMoney() {
        try {
            const moneyRecords = await this.apiCall('/money');
            const tbody = document.getElementById('moneyBody');
            tbody.innerHTML = '';

            moneyRecords.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${record.person_name || 'N/A'}</td>
                    <td>${parseFloat(record.amount || 0).toLocaleString()} TZS</td>
                    <td>${this.formatDate(record.borrow_date)}</td>
                    <td>${record.expected_return_date ? this.formatDate(record.expected_return_date) : 'Not specified'}</td>
                    <td><span class="status status-${record.status || 'pending'}">${record.status || 'pending'}</span></td>
                    <td>
                        <button class="action-btn edit-btn" onclick="app.editMoney(${record.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn" onclick="app.deleteMoney(${record.id})"><i class="fas fa-trash"></i></button>
                        <button class="action-btn" style="background-color: var(--success); color: white;" onclick="app.markMoneyReturned(${record.id})"><i class="fas fa-check"></i></button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Failed to load money records:', error);
        }
    }

    async addMoneyRecord() {
        const personName = document.getElementById('personName').value;
        const amount = document.getElementById('amount').value;
        const borrowDate = document.getElementById('borrowDate').value;
        const returnDate = document.getElementById('returnDate').value;

        if (!personName || !amount || !borrowDate) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await this.apiCall('/money', {
                method: 'POST',
                body: JSON.stringify({
                    person: personName,
                    amount: parseFloat(amount),
                    borrowDate,
                    returnDate
                })
            });

            this.clearMoneyForm();
            await this.loadMoney();
            await this.loadDashboardData();
            this.showNotification('Money Record Added', `${personName} owes you ${parseFloat(amount).toLocaleString()} TZS`);
        } catch (error) {
            console.error('Failed to add money record:', error);
            alert(`Failed to add money record: ${error.message}`);
        }
    }

    clearMoneyForm() {
        document.getElementById('personName').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('borrowDate').value = '';
        document.getElementById('returnDate').value = '';
    }

    // Savings methods
    async loadSavings() {
        try {
            const savings = await this.apiCall('/savings');
            const tbody = document.getElementById('savingsBody');
            tbody.innerHTML = '';

            savings.forEach(saving => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.formatDate(saving.date)}</td>
                    <td>${parseFloat(saving.amount || 0).toLocaleString()} TZS</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="app.editSavings(${saving.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn" onclick="app.deleteSavings(${saving.id})"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Failed to load savings:', error);
        }
    }

    async addSavings() {
        const amount = document.getElementById('savingsAmount').value;
        const date = document.getElementById('savingsDate').value;

        if (!amount || !date) {
            alert('Please fill in all fields');
            return;
        }

        try {
            await this.apiCall('/savings', {
                method: 'POST',
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    date
                })
            });

            this.clearSavingsForm();
            await this.loadSavings();
            await this.loadDashboardData(); // Real-time dashboard update
            this.showNotification('Savings Added', `Added ${parseFloat(amount).toLocaleString()} TZS to NMB savings`);
        } catch (error) {
            console.error('Failed to add savings:', error);
            alert(`Failed to add savings: ${error.message}`);
        }
    }

    clearSavingsForm() {
        document.getElementById('savingsAmount').value = '';
        document.getElementById('savingsDate').value = '';
    }

    // Modules methods
    async loadModules() {
        try {
            const modules = await this.apiCall('/modules');
            const tbody = document.getElementById('modulesBody');
            tbody.innerHTML = '';

            modules.forEach(module => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${module.code}</td>
                    <td>${module.name}</td>
                    <td>${module.lecturer || 'N/A'}</td>
                    <td>Semester ${module.semester || 1}</td>
                    <td>Year ${module.year || 1}</td>
                    <td>
                        <button class="action-btn edit-btn" data-id="${module.id}" data-action="edit-module"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn" data-id="${module.id}" data-action="delete-module"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Failed to load modules:', error);
        }
    }

    async loadModulesIntoSelect() {
        try {
            const modules = await this.apiCall('/modules');
            const select = document.getElementById('moduleSelect');

            while (select.options.length > 1) {
                select.remove(1);
            }

            modules.forEach(module => {
                const option = document.createElement('option');
                option.value = module.id;
                option.textContent = `${module.code} - ${module.name}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to load modules into select:', error);
        }
    }

    async addModule() {
        const moduleCode = document.getElementById('moduleCodeInput').value;
        const moduleName = document.getElementById('moduleNameInput').value;
        const lecturerName = document.getElementById('lecturerName').value;
        const semester = document.getElementById('semester').value;
        const year = document.getElementById('year').value;

        if (!moduleCode || !moduleName) {
            alert('Please enter module code and name');
            return;
        }

        try {
            await this.apiCall('/modules', {
                method: 'POST',
                body: JSON.stringify({
                    code: moduleCode,
                    name: moduleName,
                    lecturer: lecturerName,
                    semester,
                    year
                })
            });

            this.clearModuleForm();
            await this.loadModules();
            await this.loadModulesIntoSelect();
            await this.loadDashboardData();
            this.showNotification('Module Added', `Added ${moduleCode} to your modules`);
        } catch (error) {
            console.error('Failed to add module:', error);
            
            // Extract proper error message
            let errorMessage = 'Failed to add module';
            if (error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'object') {
                errorMessage = JSON.stringify(error);
            }
            
            alert(errorMessage);
        }
    }

    clearModuleForm() {
        document.getElementById('moduleCodeInput').value = '';
        document.getElementById('moduleNameInput').value = '';
        document.getElementById('lecturerName').value = '';
    }

    // Appointments methods
    async loadAppointments() {
        try {
            const appointments = await this.apiCall('/appointments');
            const tbody = document.getElementById('appointmentsBody');
            tbody.innerHTML = '';

            appointments.sort((a, b) => {
                const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
                const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
                return dateA - dateB;
            });

            appointments.forEach(appointment => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${appointment.name}</td>
                    <td>${appointment.place || 'N/A'}</td>
                    <td>${this.formatDate(appointment.appointment_date)} at ${appointment.appointment_time}</td>
                    <td>${appointment.aim || 'N/A'}</td>
                    <td>${this.formatNotification(appointment.notification)}</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="app.editAppointment(${appointment.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn" onclick="app.deleteAppointment(${appointment.id})"><i class="fas fa-trash"></i></button>
                        <button class="action-btn" style="background-color: var(--success); color: white;" onclick="app.completeAppointment(${appointment.id})"><i class="fas fa-check"></i></button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Failed to load appointments:', error);
        }
    }

    async addAppointment() {
        const name = document.getElementById('appointmentName').value;
        const place = document.getElementById('appointmentPlace').value;
        const date = document.getElementById('appointmentDate').value;
        const time = document.getElementById('appointmentTime').value;
        const aim = document.getElementById('appointmentAim').value;
        const notification = document.getElementById('notificationType').value;

        if (!name || !date || !time) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await this.apiCall('/appointments', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    place,
                    date,
                    time,
                    aim,
                    notification
                })
            });

            this.clearAppointmentForm();
            await this.loadAppointments();
            await this.loadDashboardData();
            this.showNotification('Appointment Added', `Added ${name} on ${this.formatDate(date)} at ${time}`);
        } catch (error) {
            console.error('Failed to add appointment:', error);
            alert(`Failed to add appointment: ${error.message}`);
        }
    }

    clearAppointmentForm() {
        document.getElementById('appointmentName').value = '';
        document.getElementById('appointmentPlace').value = '';
        document.getElementById('appointmentDate').value = '';
        document.getElementById('appointmentTime').value = '';
        document.getElementById('appointmentAim').value = '';
    }

    // Journeys methods
    async loadJourneys() {
        try {
            const journeys = await this.apiCall('/journeys');
            const tbody = document.getElementById('journeysBody');
            tbody.innerHTML = '';

            journeys.sort((a, b) => new Date(a.journey_date) - new Date(b.journey_date));

            journeys.forEach(journey => {
                const transportCost = parseFloat(journey.transport_cost || 0);
                const foodCost = parseFloat(journey.food_cost || 0);
                const totalCost = transportCost + foodCost;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${journey.journey_from} → ${journey.journey_to}</td>
                    <td>${this.formatDate(journey.journey_date)} ${journey.journey_time ? 'at ' + journey.journey_time : ''}</td>
                    <td>${transportCost.toLocaleString()} TZS</td>
                    <td>${foodCost.toLocaleString()} TZS</td>
                    <td>${totalCost.toLocaleString()} TZS</td>
                    <td>
                        <select class="status-select status-${journey.status || 'pending'}" data-journey-id="${journey.id}" onchange="app.updateJourneyStatus(${journey.id}, this.value)">
                            <option value="pending" ${journey.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="completed" ${journey.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${journey.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td>
                        <button class="action-btn edit-btn" data-id="${journey.id}" data-action="edit-journey"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn" data-id="${journey.id}" data-action="delete-journey"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Failed to load journeys:', error);
        }
    }

    async updateJourneyStatus(id, newStatus) {
        try {
            await this.apiCall(`/journeys/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            
            // Update the select dropdown styling based on status
            const statusSelect = document.querySelector(`select[data-journey-id="${id}"]`);
            if (statusSelect) {
                statusSelect.className = `status-select status-${newStatus}`;
            }
            
            // Reload journeys to refresh the table
            await this.loadJourneys();
            await this.loadDashboardData();
            
            this.showNotification('Journey Status Updated', `Journey marked as ${newStatus}`);
        } catch (error) {
            console.error('Failed to update journey status:', error);
            alert(`Failed to update journey status: ${error.message}`);
        }
    }

    async addJourney() {
        const from = document.getElementById('journeyFrom').value;
        const to = document.getElementById('journeyTo').value;
        const date = document.getElementById('journeyDate').value;
        const time = document.getElementById('journeyTime').value;
        const transportCost = document.getElementById('transportCost').value;
        const foodCost = document.getElementById('foodCost').value;
        const status = document.getElementById('journeyStatus').value;

        if (!from || !to || !date) {
            alert('Please fill in from, to, and date fields');
            return;
        }

        const transport = parseFloat(transportCost) || 0;
        const food = parseFloat(foodCost) || 0;
        const total = transport + food;

        try {
            await this.apiCall('/journeys', {
                method: 'POST',
                body: JSON.stringify({
                    from,
                    to,
                    date,
                    time,
                    transportCost,
                    foodCost,
                    status
                })
            });

            this.clearJourneyForm();
            await this.loadJourneys();
            await this.loadDashboardData();
            this.showNotification('Journey Added', `Added journey to ${to} on ${this.formatDate(date)}`);
        } catch (error) {
            console.error('Failed to add journey:', error);
            alert(`Failed to add journey: ${error.message}`);
        }
    }

    // Edit functions
    editTimetable(id) {
        // Find the timetable entry and populate the form
        this.apiCall('/timetable').then(timetable => {
            const exam = timetable.find(e => e.id === id);
            if (exam) {
                document.getElementById('moduleCode').value = exam.module_code;
                document.getElementById('moduleName').value = exam.module_name;
                document.getElementById('examDate').value = exam.exam_date;
                document.getElementById('examTime').value = exam.exam_time;
                document.getElementById('examVenue').value = exam.venue || '';
                
                // Change button to update mode
                const addBtn = document.getElementById('addTimetableBtn');
                addBtn.textContent = 'Update Exam';
                addBtn.onclick = () => this.updateTimetable(id);
                
                // Scroll to form
                document.getElementById('timetable').scrollIntoView({ behavior: 'smooth' });
            }
        }).catch(error => {
            console.error('Failed to load timetable for editing:', error);
            alert('Failed to load exam data for editing');
        });
    }

    async updateTimetable(id) {
        const moduleCode = document.getElementById('moduleCode').value.trim();
        const moduleName = document.getElementById('moduleName').value.trim();
        const examDate = document.getElementById('examDate').value;
        const examTime = document.getElementById('examTime').value;
        const examVenue = document.getElementById('examVenue').value.trim();

        if (!moduleCode || !moduleName || !examDate || !examTime) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await this.apiCall(`/timetable/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    moduleCode,
                    moduleName,
                    date: examDate,
                    time: examTime,
                    venue: examVenue
                })
            });

            this.clearTimetableForm();
            await this.loadTimetable();
            await this.loadDashboardData();
            this.showNotification('Exam Updated', `Updated ${moduleName} in timetable`);
            
            // Reset button to add mode
            const addBtn = document.getElementById('addTimetableBtn');
            addBtn.textContent = 'Add Exam';
            addBtn.onclick = () => this.addTimetable();
        } catch (error) {
            console.error('Failed to update timetable:', error);
            alert(`Failed to update exam: ${error.message}`);
        }
    }

    editModule(id) {
        // Find the module and populate the form
        this.apiCall('/modules').then(modules => {
            const module = modules.find(m => m.id === id);
            if (module) {
                document.getElementById('moduleCode').value = module.code;
                document.getElementById('moduleName').value = module.name;
                document.getElementById('lecturerName').value = module.lecturer || '';
                document.getElementById('semester').value = module.semester || 1;
                document.getElementById('year').value = module.year || 1;
                
                // Change button to update mode
                const addBtn = document.getElementById('addModuleBtn');
                addBtn.textContent = 'Update Module';
                addBtn.onclick = () => this.updateModule(id);
                
                // Scroll to form
                document.getElementById('modules').scrollIntoView({ behavior: 'smooth' });
            }
        }).catch(error => {
            console.error('Failed to load module for editing:', error);
            alert('Failed to load module data for editing');
        });
    }

    async updateModule(id) {
        const code = document.getElementById('moduleCode').value.trim();
        const name = document.getElementById('moduleName').value.trim();
        const lecturer = document.getElementById('lecturerName').value.trim();
        const semester = document.getElementById('semester').value;
        const year = document.getElementById('year').value;

        if (!code || !name) {
            alert('Please fill in module code and name');
            return;
        }

        try {
            await this.apiCall(`/modules/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    code,
                    name,
                    lecturer,
                    semester: parseInt(semester),
                    year: parseInt(year)
                })
            });

            this.clearModuleForm();
            await this.loadModules();
            await this.loadDashboardData();
            this.showNotification('Module Updated', `Updated ${name} module`);
            
            // Reset button to add mode
            const addBtn = document.getElementById('addModuleBtn');
            addBtn.textContent = 'Add Module';
            addBtn.onclick = () => this.addModule();
        } catch (error) {
            console.error('Failed to update module:', error);
            alert(`Failed to update module: ${error.message}`);
        }
    }

    editMoney(id) {
        console.log('Edit money record:', id);
        alert('Edit functionality coming soon!');
    }

    editAppointment(id) {
        console.log('Edit appointment:', id);
        alert('Edit functionality coming soon!');
    }

    editSavings(id) {
        console.log('Edit savings:', id);
        alert('Edit functionality coming soon!');
    }

    async completeAppointment(id) {
        if (confirm('Are you sure you want to mark this appointment as completed?')) {
            try {
                await this.apiCall(`/appointments/${id}/complete`, { method: 'PUT' });
                await this.loadAppointments();
                await this.loadDashboardData();
                this.showNotification('Appointment Completed', 'Appointment has been marked as completed');
            } catch (error) {
                console.error('Failed to complete appointment:', error);
                alert(`Failed to complete appointment: ${error.message}`);
            }
        }
    }

    async markMoneyReturned(id) {
        if (confirm('Are you sure you want to mark this money as returned?')) {
            try {
                await this.apiCall(`/money/${id}/return`, { method: 'PUT' });
                await this.loadMoney();
                await this.loadDashboardData();
                this.showNotification('Money Returned', 'Money has been marked as returned');
            } catch (error) {
                console.error('Failed to mark money as returned:', error);
                alert(`Failed to mark money as returned: ${error.message}`);
            }
        }
    }

    clearJourneyForm() {
        document.getElementById('journeyFrom').value = '';
        document.getElementById('journeyTo').value = '';
        document.getElementById('journeyDate').value = '';
        document.getElementById('journeyTime').value = '';
        document.getElementById('transportCost').value = '';
        document.getElementById('foodCost').value = '';
        document.getElementById('journeyStatus').value = 'pending';
    }

    // Skills method
    loadSkillsData() {
        const skillBars = document.querySelector('.skill-bars');
        skillBars.innerHTML = '';

        const skills = [
            { name: 'Graphic Design', level: 85 },
            { name: 'Web Development', level: 90 },
            { name: 'Adobe Illustrator', level: 80 },
            { name: 'Adobe Acrobat', level: 75 },
            { name: 'MS Office', level: 95 },
            { name: 'Networking', level: 70 },
            { name: 'Operating Systems', level: 75 },
            { name: 'Accounting', level: 65 },
            { name: 'Entrepreneurship', level: 80 },
            { name: 'Computer Architecture', level: 75 },
            { name: 'Computer Maintenance & Repair', level: 85 },
            { name: 'Hardware Solutions', level: 80 },
            { name: 'IT Course for Diploma', level: 90 }
        ];

        skills.forEach(skill => {
            const skillItem = document.createElement('div');
            skillItem.className = 'skill-item';
            skillItem.innerHTML = `
                <div class="skill-name">
                    <span>${skill.name}</span>
                    <span>${skill.level}%</span>
                </div>
                <div class="skill-bar">
                    <div class="skill-level" style="width: ${skill.level}%"></div>
                </div>
            `;
            skillBars.appendChild(skillItem);
        });
    }

    // Helper functions
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatCategory(category) {
        const categories = {
            'group-assignment': 'Group Assignment',
            'individual-assignment': 'Individual Assignment',
            'test01': 'Test 01',
            'test02': 'Test 02',
            'presentation': 'Presentation'
        };
        return categories[category] || category;
    }

    formatNotification(notification) {
        const notifications = {
            '2hours': '2 hours before',
            '1day': '1 day before',
            '30min': '30 minutes before',
            'none': 'No notification'
        };
        return notifications[notification] || notification;
    }

    // Placeholder methods for edit/delete operations
    async editTimetable(id) {
        console.log('Edit timetable:', id);
        // TODO: Implement edit functionality
    }

    async deleteTimetable(id) {
        if (confirm('Are you sure you want to delete this exam?')) {
            try {
                await this.apiCall(`/timetable/${id}`, { method: 'DELETE' });
                await this.loadTimetable();
                await this.loadDashboardData(); // Real-time dashboard update
                this.showNotification('Exam Deleted', 'Exam has been deleted successfully');
            } catch (error) {
                console.error('Failed to delete timetable:', error);
                alert('Failed to delete exam. Please try again.');
            }
        }
    }

    async deleteMoney(id) {
        if (confirm('Are you sure you want to delete this money record?')) {
            try {
                await this.apiCall(`/money/${id}`, { method: 'DELETE' });
                await this.loadMoney();
                await this.loadDashboardData(); // Real-time dashboard update
                this.showNotification('Money Record Deleted', 'Money record has been deleted successfully');
            } catch (error) {
                console.error('Failed to delete money record:', error);
                alert('Failed to delete money record. Please try again.');
            }
        }
    }

    async deleteModule(id) {
        if (confirm('Are you sure you want to delete this module?')) {
            try {
                await this.apiCall(`/modules/${id}`, { method: 'DELETE' });
                await this.loadModules();
                await this.loadModulesIntoSelect();
                await this.loadDashboardData(); // Real-time dashboard update
                this.showNotification('Module Deleted', 'Module has been deleted successfully');
            } catch (error) {
                console.error('Failed to delete module:', error);
                alert('Failed to delete module. Please try again.');
            }
        }
    }

    async deleteAppointment(id) {
        if (confirm('Are you sure you want to delete this appointment?')) {
            try {
                await this.apiCall(`/appointments/${id}`, { method: 'DELETE' });
                await this.loadAppointments();
                await this.loadDashboardData(); // Real-time dashboard update
                this.showNotification('Appointment Deleted', 'Appointment has been deleted successfully');
            } catch (error) {
                console.error('Failed to delete appointment:', error);
                alert('Failed to delete appointment. Please try again.');
            }
        }
    }

    async deleteSavings(id) {
        if (confirm('Are you sure you want to delete this savings record?')) {
            try {
                await this.apiCall(`/savings/${id}`, { method: 'DELETE' });
                await this.loadSavings();
                await this.loadDashboardData(); // Real-time dashboard update
                this.showNotification('Savings Deleted', 'Savings record has been deleted successfully');
            } catch (error) {
                console.error('Failed to delete savings:', error);
                alert('Failed to delete savings. Please try again.');
            }
        }
    }

    editJourney(id) {
        // Find the journey and populate the form
        this.apiCall('/journeys').then(journeys => {
            const journey = journeys.find(j => j.id === id);
            if (journey) {
                document.getElementById('journeyFrom').value = journey.journey_from || '';
                document.getElementById('journeyTo').value = journey.journey_to || '';
                document.getElementById('journeyDate').value = journey.journey_date || '';
                document.getElementById('journeyTime').value = journey.journey_time || '';
                document.getElementById('transportCost').value = journey.transport_cost || '';
                document.getElementById('foodCost').value = journey.food_cost || '';
                document.getElementById('journeyStatus').value = journey.status || 'pending';
                
                // Change button to update mode
                const addBtn = document.getElementById('addJourneyBtn');
                addBtn.textContent = 'Update Journey';
                addBtn.onclick = () => this.updateJourney(id);
                
                // Scroll to form
                document.getElementById('journeys').scrollIntoView({ behavior: 'smooth' });
            }
        }).catch(error => {
            console.error('Failed to load journey for editing:', error);
            alert('Failed to load journey data for editing');
        });
    }

    async updateJourney(id) {
        const from = document.getElementById('journeyFrom').value.trim();
        const to = document.getElementById('journeyTo').value.trim();
        const date = document.getElementById('journeyDate').value;
        const time = document.getElementById('journeyTime').value;
        const transportCost = document.getElementById('transportCost').value;
        const foodCost = document.getElementById('foodCost').value;
        const status = document.getElementById('journeyStatus').value;

        if (!from || !to || !date) {
            alert('Please fill in from, to, and date fields');
            return;
        }

        try {
            await this.apiCall(`/journeys/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    from,
                    to,
                    date,
                    time,
                    transportCost,
                    foodCost,
                    status
                })
            });

            this.clearJourneyForm();
            await this.loadJourneys();
            await this.loadDashboardData();
            this.showNotification('Journey Updated', `Updated journey from ${from} to ${to}`);
            
            // Reset button to add mode
            const addBtn = document.getElementById('addJourneyBtn');
            addBtn.textContent = 'Add Journey';
            addBtn.onclick = () => this.addJourney();
        } catch (error) {
            console.error('Failed to update journey:', error);
            alert(`Failed to update journey: ${error.message}`);
        }
    }

    clearJourneyForm() {
        document.getElementById('journeyFrom').value = '';
        document.getElementById('journeyTo').value = '';
        document.getElementById('journeyDate').value = '';
        document.getElementById('journeyTime').value = '';
        document.getElementById('transportCost').value = '';
        document.getElementById('foodCost').value = '';
    }

    async deleteJourney(id) {
        if (confirm('Are you sure you want to delete this journey?')) {
            try {
                await this.apiCall(`/journeys/${id}`, { method: 'DELETE' });
                await this.loadJourneys();
                await this.loadDashboardData();
                this.showNotification('Journey Deleted', 'Journey has been deleted successfully');
            } catch (error) {
                console.error('Failed to delete journey:', error);
                alert('Failed to delete journey. Please try again.');
            }
        }
    }
}

// Initialize the application
const app = new PersonalManagementApp();
