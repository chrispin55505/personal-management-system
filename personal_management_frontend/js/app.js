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

        // Section-specific event listeners
        this.setupSectionListeners();
    }

    setupSectionListeners() {
        // Timetable section
        document.getElementById('addTimetableBtn')?.addEventListener('click', () => this.addTimetable());

        // Marks section
        document.getElementById('addMarksBtn')?.addEventListener('click', () => this.addMarks());

        // Money section
        document.getElementById('addMoneyBtn')?.addEventListener('click', () => this.addMoneyRecord());
        document.getElementById('addSavingsBtn')?.addEventListener('click', () => this.addSavings());

        // Modules section
        document.getElementById('addModuleBtn')?.addEventListener('click', () => this.addModule());

        // Appointments section
        document.getElementById('addAppointmentBtn')?.addEventListener('click', () => this.addAppointment());

        // Journeys section
        document.getElementById('addJourneyBtn')?.addEventListener('click', () => this.addJourney());
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
                    // Use the actual error message from backend
                    errorMessage = data.error;
                    if (data.details) {
                        errorMessage += `\n\nDetails: ${data.details}`;
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
            const data = await this.apiCall('/dashboard/stats');
            
            document.getElementById('appointmentCount').textContent = data.appointmentCount || 0;
            document.getElementById('moneyOwed').textContent = (data.moneyOwed || 0).toLocaleString();
            document.getElementById('moduleCount').textContent = data.moduleCount || 0;
            document.getElementById('journeyCount').textContent = data.journeyCount || 0;

            await this.loadRecentActivities();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    async loadRecentActivities() {
        try {
            const activities = await this.apiCall('/activities');
            const tbody = document.getElementById('recentActivities');
            tbody.innerHTML = '';

            activities.slice(0, 5).forEach(activity => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.formatDate(activity.date)}</td>
                    <td>${activity.description}</td>
                    <td>${activity.type}</td>
                    <td><span class="status status-${activity.status}">${activity.status}</span></td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Failed to load activities:', error);
        }
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
                        <button class="action-btn edit-btn" onclick="app.editTimetable(${exam.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn" onclick="app.deleteTimetable(${exam.id})"><i class="fas fa-trash"></i></button>
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
                    <td>${mark.moduleName}</td>
                    <td>${mark.lecturer}</td>
                    <td>${this.formatCategory(mark.category)}</td>
                    <td>${mark.marks}</td>
                    <td>${this.formatDate(mark.date)}</td>
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
            this.showNotification('Marks Added', `Added ${marks} marks`);
        } catch (error) {
            console.error('Failed to add marks:', error);
            alert(`Failed to add marks: ${error.message}`);
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

            document.getElementById('savingsAmount').value = '';
            document.getElementById('savingsDate').value = '';
            await this.loadSavings();
            this.showNotification('Savings Added', `Added ${parseFloat(amount).toLocaleString()} TZS to NMB savings`);
        } catch (error) {
            console.error('Failed to add savings:', error);
            alert(`Failed to add savings: ${error.message}`);
        }
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
                        <button class="action-btn edit-btn" onclick="app.editModule(${module.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn" onclick="app.deleteModule(${module.id})"><i class="fas fa-trash"></i></button>
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
            alert(`Failed to add module: ${error.message}`);
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
                    <td><span class="status status-${journey.status || 'pending'}">${journey.status || 'pending'}</span></td>
                    <td>
                        <button class="action-btn edit-btn" onclick="app.editJourney(${journey.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn" onclick="app.deleteJourney(${journey.id})"><i class="fas fa-trash"></i></button>
                        <button class="action-btn" style="background-color: var(--success); color: white;" onclick="app.completeJourney(${journey.id})"><i class="fas fa-check"></i></button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Failed to load journeys:', error);
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
            alert('Please fill in all required fields');
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
                    time: time || '00:00',
                    transportCost: transport,
                    foodCost: food,
                    totalCost: total,
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

    // Edit functions (placeholder implementations)
    editTimetable(id) {
        console.log('Edit timetable:', id);
        alert('Edit functionality coming soon!');
    }

    editModule(id) {
        console.log('Edit module:', id);
        alert('Edit functionality coming soon!');
    }

    editMoney(id) {
        console.log('Edit money record:', id);
        alert('Edit functionality coming soon!');
    }

    editAppointment(id) {
        console.log('Edit appointment:', id);
        alert('Edit functionality coming soon!');
    }

    editJourney(id) {
        console.log('Edit journey:', id);
        alert('Edit functionality coming soon!');
    }

    editSavings(id) {
        console.log('Edit savings:', id);
        alert('Edit functionality coming soon!');
    }

    // Complete functions
    completeJourney(id) {
        console.log('Complete journey:', id);
        alert('Complete functionality coming soon!');
    }

    clearJourneyForm() {
        document.getElementById('journeyFrom').value = '';
        document.getElementById('journeyTo').value = '';
        document.getElementById('journeyDate').value = '';
        document.getElementById('journeyTime').value = '';
        document.getElementById('transportCost').value = '';
        document.getElementById('foodCost').value = '';
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
                this.showNotification('Exam Deleted', 'Exam has been deleted successfully');
            } catch (error) {
                console.error('Failed to delete timetable:', error);
                alert('Failed to delete exam. Please try again.');
            }
        }
    }

    async editMarks(id) {
        console.log('Edit marks:', id);
        // TODO: Implement edit functionality
    }

    async deleteMarks(id) {
        if (confirm('Are you sure you want to delete these marks?')) {
            try {
                await this.apiCall(`/marks/${id}`, { method: 'DELETE' });
                await this.loadMarks();
                this.showNotification('Marks Deleted', 'Marks have been deleted successfully');
            } catch (error) {
                console.error('Failed to delete marks:', error);
                alert('Failed to delete marks. Please try again.');
            }
        }
    }

    async editMoney(id) {
        console.log('Edit money:', id);
        // TODO: Implement edit functionality
    }

    async deleteMoney(id) {
        if (confirm('Are you sure you want to delete this money record?')) {
            try {
                await this.apiCall(`/money/${id}`, { method: 'DELETE' });
                await this.loadMoney();
                await this.loadDashboardData();
                this.showNotification('Money Record Deleted', 'Money record has been deleted successfully');
            } catch (error) {
                console.error('Failed to delete money record:', error);
                alert('Failed to delete money record. Please try again.');
            }
        }
    }

    async markMoneyReturned(id) {
        try {
            await this.apiCall(`/money/${id}/return`, { method: 'PUT' });
            await this.loadMoney();
            await this.loadDashboardData();
            this.showNotification('Money Returned', 'Money has been marked as returned');
        } catch (error) {
            console.error('Failed to mark money as returned:', error);
            alert('Failed to update money record. Please try again.');
        }
    }

    async editSavings(id) {
        console.log('Edit savings:', id);
        // TODO: Implement edit functionality
    }

    async deleteSavings(id) {
        if (confirm('Are you sure you want to delete this savings record?')) {
            try {
                await this.apiCall(`/savings/${id}`, { method: 'DELETE' });
                await this.loadSavings();
                this.showNotification('Savings Deleted', 'Savings record has been deleted successfully');
            } catch (error) {
                console.error('Failed to delete savings:', error);
                alert('Failed to delete savings. Please try again.');
            }
        }
    }

    async editModule(id) {
        console.log('Edit module:', id);
        // TODO: Implement edit functionality
    }

    async deleteModule(id) {
        if (confirm('Are you sure you want to delete this module?')) {
            try {
                await this.apiCall(`/modules/${id}`, { method: 'DELETE' });
                await this.loadModules();
                await this.loadModulesIntoSelect();
                await this.loadDashboardData();
                this.showNotification('Module Deleted', 'Module has been deleted successfully');
            } catch (error) {
                console.error('Failed to delete module:', error);
                alert('Failed to delete module. Please try again.');
            }
        }
    }

    async editAppointment(id) {
        console.log('Edit appointment:', id);
        // TODO: Implement edit functionality
    }

    async deleteAppointment(id) {
        if (confirm('Are you sure you want to delete this appointment?')) {
            try {
                await this.apiCall(`/appointments/${id}`, { method: 'DELETE' });
                await this.loadAppointments();
                await this.loadDashboardData();
                this.showNotification('Appointment Deleted', 'Appointment has been deleted successfully');
            } catch (error) {
                console.error('Failed to delete appointment:', error);
                alert('Failed to delete appointment. Please try again.');
            }
        }
    }

    async completeAppointment(id) {
        try {
            await this.apiCall(`/appointments/${id}/complete`, { method: 'PUT' });
            await this.loadAppointments();
            await this.loadDashboardData();
            this.showNotification('Appointment Completed', 'Appointment has been marked as completed');
        } catch (error) {
            console.error('Failed to complete appointment:', error);
            alert('Failed to update appointment. Please try again.');
        }
    }

    async editJourney(id) {
        console.log('Edit journey:', id);
        // TODO: Implement edit functionality
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

    async completeJourney(id) {
        try {
            await this.apiCall(`/journeys/${id}/complete`, { method: 'PUT' });
            await this.loadJourneys();
            await this.loadDashboardData();
            this.showNotification('Journey Completed', 'Journey has been marked as completed');
        } catch (error) {
            console.error('Failed to complete journey:', error);
            alert('Failed to update journey. Please try again.');
        }
    }
}

// Initialize the application
const app = new PersonalManagementApp();
