document.addEventListener('DOMContentLoaded', async () => {
    const USERNAME = 'mpaAdmin';
    const PASSWORD = 'sysAdmin368';

    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const mainApp = document.getElementById('mainApp');
    const logoutBtn = document.getElementById('logoutBtn');
    const transferRequestsInput = document.getElementById('transferRequests');
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');

    localStorage.removeItem('isLoggedIn');
    loginModal.style.display = 'block';
    mainApp.style.display = 'none';

    hamburger.addEventListener('click', () => sidebar.classList.toggle('active'));
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !hamburger.contains(e.target) && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        if (username === USERNAME && password === PASSWORD) {
            localStorage.setItem('isLoggedIn', 'true');
            loginModal.style.display = 'none';
            mainApp.style.display = 'block';
            await Promise.all([
                fetchLearners(),
                fetchFees(),
                fetchBooks(),
                fetchClassBooks(),
                fetchFeeStructure(),
                fetchTermSettings(),
                fetchArchivedYears()
            ]);
            setupEventListeners();
        } else {
            alert('Invalid credentials');
        }
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('isLoggedIn');
        loginModal.style.display = 'block';
        mainApp.style.display = 'none';
        sidebar.classList.remove('active');
    });

    transferRequestsInput.addEventListener('change', () => {
        localStorage.setItem('transferRequests', transferRequestsInput.value);
    });

    const savedTransferRequests = localStorage.getItem('transferRequests');
    if (savedTransferRequests) transferRequestsInput.value = savedTransferRequests;

    let learners = [];
    let fees = [];
    let books = [];
    let classBooks = [];
    let feeStructure = {};
    let currentTerm = 'Term 1';
    let currentYear = new Date().getFullYear();

    async function fetchLearners() {
        const response = await fetch('/api/learners');
        learners = await response.json();
        displayLearners();
    }

    async function fetchFees() {
        const response = await fetch('/api/fees');
        fees = await response.json();
        displayFees();
    }

    async function fetchBooks() {
        const response = await fetch('/api/books');
        books = await response.json();
        displayBooks();
    }

    async function fetchClassBooks() {
        const response = await fetch('/api/classBooks');
        classBooks = await response.json();
        displayClassBooks();
    }

    async function fetchFeeStructure() {
        const response = await fetch('/api/feeStructure');
        feeStructure = await response.json() || {};
    }

    async function fetchTermSettings() {
        const response = await fetch('/api/termSettings');
        const settings = await response.json();
        if (settings) {
            currentTerm = settings.currentTerm;
            currentYear = settings.currentYear;
        }
        document.getElementById('currentTermYear').textContent = `${currentTerm} ${currentYear}`;
        document.getElementById('currentTerm').value = currentTerm;
        document.getElementById('currentYear').value = currentYear;
    }

    async function fetchArchivedYears() {
        try {
            const response = await fetch('/api/learnerArchives/years');
            const years = await response.json();
            const select = document.getElementById('learnerYearSelect');
            select.innerHTML = `<option value="${currentYear}">${currentYear} (Current)</option>` +
                years.map(year => `<option value="${year}">${year}</option>`).join('');
        } catch (err) {
            console.error('Error fetching archived years:', err);
        }
    }

    function getNextAdmissionNo() {
        const maxAdmission = learners.reduce((max, learner) => {
            const num = parseInt(learner.admissionNo.replace('MPA-', ''));
            return num > max ? num : max;
        }, 0);
        return `MPA-${String(maxAdmission + 1).padStart(3, '0')}`;
    }

    function setupEventListeners() {
        const addLearnerBtn = document.querySelector('.add-learner-btn');
        const addFeeBtn = document.querySelector('.add-fee-btn');
        const addBookBtn = document.querySelector('.add-book-btn');
        const addClassBookBtn = document.querySelector('.add-class-book-btn');

        // Learner Form
        document.getElementById('learnerForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const learner = {
                admissionNo: getNextAdmissionNo(),
                fullName: document.getElementById('fullName').value,
                gender: document.getElementById('gender').value,
                dob: document.getElementById('dob').value,
                grade: document.getElementById('grade').value,
                assessmentNumber: document.getElementById('assessmentNumber').value || undefined,
                parentName: document.getElementById('parentName').value,
                parentPhone: document.getElementById('parentPhone').value,
                parentEmail: document.getElementById('parentEmail').value
            };
            await fetch('/api/learners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(learner)
            });
            await fetchLearners();
            document.getElementById('learnerForm').reset();
            document.getElementById('addLearnerForm').style.display = 'none';
        });

        // Edit Learner Form
        document.getElementById('editLearnerFormElement')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const index = document.getElementById('editLearnerIndex').value;
            const learner = {
                fullName: document.getElementById('editFullName').value,
                gender: document.getElementById('editGender').value,
                dob: document.getElementById('editDob').value,
                grade: document.getElementById('editGrade').value,
                assessmentNumber: document.getElementById('editAssessmentNumber').value || undefined,
                parentName: document.getElementById('editParentName').value,
                parentPhone: document.getElementById('editParentPhone').value,
                parentEmail: document.getElementById('editParentEmail').value
            };
            await fetch(`/api/learners/${learners[index]._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(learner)
            });
            await fetchLearners();
            document.getElementById('editLearnerForm').style.display = 'none';
        });

        // Fee Form
        document.getElementById('feeForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const admissionNo = document.getElementById('feeAdmissionNo').value;
            const learner = learners.find(l => l.admissionNo === admissionNo);
            if (!learner) {
                alert('Learner not found!');
                return;
            }

            const amountPaid = parseFloat(document.getElementById('amountPaid').value);
            const term = document.getElementById('term').value;
            const feePerTerm = feeStructure[learner.grade.replace(' ', '').toLowerCase()] || 0;
            let balance = feePerTerm - amountPaid;
            let nextTermBalance = 0;

            if (balance < 0) {
                nextTermBalance = Math.abs(balance);
                balance = 0;
                if (term === 'Term 1') await updateNextTermFee(admissionNo, 'Term 2', nextTermBalance);
                if (term === 'Term 2') await updateNextTermFee(admissionNo, 'Term 3', nextTermBalance);
            }

            const fee = {
                admissionNo,
                term,
                amountPaid,
                balance
            };

            await fetch('/api/fees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fee)
            });

            await fetchFees();
            await sendFeeNotification(learner, fee);
            document.getElementById('feeForm').reset();
            document.getElementById('addFeeForm').style.display = 'none';
        });

        // Edit Fee Form
        document.getElementById('editFeeFormElement')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const index = document.getElementById('editFeeIndex').value;
            const admissionNo = document.getElementById('editFeeAdmissionNo').value;
            const learner = learners.find(l => l.admissionNo === admissionNo);
            if (!learner) {
                alert('Learner not found!');
                return;
            }

            const amountPaid = parseFloat(document.getElementById('editAmountPaid').value);
            const term = document.getElementById('editTerm').value;
            const feePerTerm = feeStructure[learner.grade.replace(' ', '').toLowerCase()] || 0;
            let balance = feePerTerm - amountPaid;
            let nextTermBalance = 0;

            if (balance < 0) {
                nextTermBalance = Math.abs(balance);
                balance = 0;
                if (term === 'Term 1') await updateNextTermFee(admissionNo, 'Term 2', nextTermBalance);
                if (term === 'Term 2') await updateNextTermFee(admissionNo, 'Term 3', nextTermBalance);
            }

            const fee = {
                admissionNo,
                term,
                amountPaid,
                balance
            };

            await fetch(`/api/fees/${fees[index]._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fee)
            });

            await fetchFees();
            await sendFeeNotification(learner, fee);
            document.getElementById('editFeeForm').style.display = 'none';
        });

        // Book Form
        document.getElementById('bookForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const book = {
                admissionNo: document.getElementById('bookAdmissionNo').value,
                subject: document.getElementById('subject').value,
                bookTitle: document.getElementById('bookTitle').value
            };
            await fetch('/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(book)
            });
            await fetchBooks();
            document.getElementById('bookForm').reset();
            document.getElementById('addBookForm').style.display = 'none';
        });

        // Edit Book Form
        document.getElementById('editBookFormElement')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const index = document.getElementById('editBookIndex').value;
            const book = {
                admissionNo: document.getElementById('editBookAdmissionNo').value,
                subject: document.getElementById('editSubject').value,
                bookTitle: document.getElementById('editBookTitle').value
            };
            await fetch(`/api/books/${books[index]._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(book)
            });
            await fetchBooks();
            document.getElementById('editBookForm').style.display = 'none';
        });

        // Class Book Form
        document.getElementById('classBookForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const classBook = {
                bookNumber: document.getElementById('bookNumber').value,
                subject: document.getElementById('classSubject').value,
                description: document.getElementById('bookDescription').value,
                totalBooks: parseInt(document.getElementById('totalBooks').value)
            };
            await fetch('/api/classBooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(classBook)
            });
            await fetchClassBooks();
            document.getElementById('classBookForm').reset();
            document.getElementById('addClassBookForm').style.display = 'none';
        });

        // Edit Class Book Form
        document.getElementById('editClassBookFormElement')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const index = document.getElementById('editClassBookIndex').value;
            const classBook = {
                bookNumber: document.getElementById('editBookNumber').value,
                subject: document.getElementById('editClassSubject').value,
                description: document.getElementById('editBookDescription').value,
                totalBooks: parseInt(document.getElementById('editTotalBooks').value)
            };
            await fetch(`/api/classBooks/${classBooks[index]._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(classBook)
            });
            await fetchClassBooks();
            document.getElementById('editClassBookForm').style.display = 'none';
        });

        // Fee Structure Form
        document.getElementById('feeStructureForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newFeeStructure = {
                playgroup: parseFloat(document.getElementById('playgroupFee').value),
                pp1: parseFloat(document.getElementById('pp1Fee').value),
                pp2: parseFloat(document.getElementById('pp2Fee').value),
                grade1: parseFloat(document.getElementById('grade1Fee').value),
                grade2: parseFloat(document.getElementById('grade2Fee').value),
                grade3: parseFloat(document.getElementById('grade3Fee').value),
                grade4: parseFloat(document.getElementById('grade4Fee').value),
                grade5: parseFloat(document.getElementById('grade5Fee').value),
                grade6: parseFloat(document.getElementById('grade6Fee').value),
                grade7: parseFloat(document.getElementById('grade7Fee').value),
                grade8: parseFloat(document.getElementById('grade8Fee').value),
                grade9: parseFloat(document.getElementById('grade9Fee').value)
            };
            await fetch('/api/feeStructure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFeeStructure)
            });
            await fetchFeeStructure();
            alert('Fee structure saved successfully');
        });

        // Term Settings Form
        document.getElementById('termSettingsForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const settings = {
                currentTerm: document.getElementById('currentTerm').value,
                currentYear: parseInt(document.getElementById('currentYear').value)
            };
            await fetch('/api/termSettings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            await fetchTermSettings();
            alert('Term settings saved successfully');
        });

        // New Academic Year
        document.getElementById('newAcademicYearBtn')?.addEventListener('click', async () => {
            if (confirm('Are you sure you want to start a new academic year? This will archive the current year\'s data and update learners\' grades.')) {
                await fetch('/api/newAcademicYear', { method: 'POST' });
                await Promise.all([fetchLearners(), fetchTermSettings(), fetchArchivedYears()]);
                alert('New academic year started successfully');
            }
        });

        // Add Learner Button
        addLearnerBtn.addEventListener('click', () => {
            document.getElementById('addLearnerForm').style.display = 'block';
            document.getElementById('assessmentNumber').style.display = 'none';
            document.getElementById('grade').addEventListener('change', function() {
                const grade = this.value;
                const assessmentNumberInput = document.getElementById('assessmentNumber');
                if (['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'].includes(grade)) {
                    assessmentNumberInput.style.display = 'block';
                } else {
                    assessmentNumberInput.style.display = 'none';
                    assessmentNumberInput.value = '';
                }
            });
        });

        // Add Fee Button
        addFeeBtn.addEventListener('click', () => {
            document.getElementById('feeAdmissionNo').innerHTML = learners.map(l => `<option value="${l.admissionNo}">${l.admissionNo} - ${l.fullName}</option>`).join('');
            document.getElementById('term').value = currentTerm;
            document.getElementById('addFeeForm').style.display = 'block';
        });

        // Add Book Button
        addBookBtn.addEventListener('click', () => {
            document.getElementById('bookAdmissionNo').innerHTML = learners.map(l => `<option value="${l.admissionNo}">${l.admissionNo} - ${l.fullName}</option>`).join('');
            document.getElementById('addBookForm').style.display = 'block';
        });

        // Add Class Book Button
        addClassBookBtn.addEventListener('click', () => {
            document.getElementById('addClassBookForm').style.display = 'block';
        });

        // Sidebar Navigation
        document.querySelectorAll('.sidebar a').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = a.getAttribute('href').substring(1);
                document.querySelectorAll('section').forEach(s => s.style.display = 'none');
                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    targetSection.style.display = 'block';
                }

                if (sectionId === 'fees') {
                    displayFees();
                } else if (sectionId === 'learners') {
                    displayLearners();
                } else if (sectionId === 'books') {
                    displayBooks();
                } else if (sectionId === 'classBooks') {
                    displayClassBooks();
                } else if (sectionId === 'feeStructure') {
                    loadFeeStructure();
                } else if (sectionId === 'dashboard') {
                    document.getElementById('dashboard').style.display = 'block';
                }

                sidebar.classList.remove('active');
            });
        });

        // Close Modals
        document.querySelectorAll('.close, .cancel').forEach(button => {
            button.addEventListener('click', () => {
                button.closest('.modal').style.display = 'none';
            });
        });

        // Download Buttons
        document.getElementById('downloadLearnersExcelBtn')?.addEventListener('click', async () => {
            const selectedYear = document.getElementById('learnerYearSelect').value;
            const learnersData = selectedYear === currentYear.toString() ? learners : await fetch(`/api/learnerArchives/${selectedYear}`).then(res => res.json());
            const data = learnersData.map(l => [l.admissionNo, l.fullName, l.gender, l.dob, l.grade, l.assessmentNumber || 'N/A', l.parentName, l.parentPhone]);
            downloadExcel(data, ['Admission No.', 'Full Name', 'Gender', 'DoB', 'Grade', 'Assessment Number', 'Parent Name', 'Parent Contact'], `learners_${selectedYear}`);
        });

        document.getElementById('downloadLearnersWordBtn')?.addEventListener('click', async () => {
            const selectedYear = document.getElementById('learnerYearSelect').value;
            const learnersData = selectedYear === currentYear.toString() ? learners : await fetch(`/api/learnerArchives/${selectedYear}`).then(res => res.json());
            const data = learnersData.map(l => [l.admissionNo, l.fullName, l.gender, l.dob, l.grade, l.assessmentNumber || 'N/A', l.parentName, l.parentPhone]);
            downloadWord(data, ['Admission No.', 'Full Name', 'Gender', 'DoB', 'Grade', 'Assessment Number', 'Parent Name', 'Parent Contact'], `learners_${selectedYear}`);
        });

        document.getElementById('downloadLearnersPdfBtn')?.addEventListener('click', async () => {
            const selectedYear = document.getElementById('learnerYearSelect').value;
            const learnersData = selectedYear === currentYear.toString() ? learners : await fetch(`/api/learnerArchives/${selectedYear}`).then(res => res.json());
            const data = learnersData.map(l => [l.admissionNo, l.fullName, l.gender, l.dob, l.grade, l.assessmentNumber || 'N/A', l.parentName, l.parentPhone]);
            downloadPdf(data, ['Admission No.', 'Full Name', 'Gender', 'DoB', 'Grade', 'Assessment Number', 'Parent Name', 'Parent Contact'], `learners_${selectedYear}`);
        });

        document.getElementById('downloadFeesExcelBtn')?.addEventListener('click', () => {
            const data = fees.map(f => [f.admissionNo, learners.find(l => l.admissionNo === f.admissionNo)?.fullName || 'N/A', f.term, f.amountPaid, f.balance]);
            downloadExcel(data, ['Admission No.', 'Full Name', 'Term', 'Amount Paid', 'Balance'], 'fees');
        });

        document.getElementById('downloadFeesWordBtn')?.addEventListener('click', () => {
            const data = fees.map(f => [f.admissionNo, learners.find(l => l.admissionNo === f.admissionNo)?.fullName || 'N/A', f.term, f.amountPaid, f.balance]);
            downloadWord(data, ['Admission No.', 'Full Name', 'Term', 'Amount Paid', 'Balance'], 'fees');
        });

        document.getElementById('downloadFeesPdfBtn')?.addEventListener('click', () => {
            const data = fees.map(f => [f.admissionNo, learners.find(l => l.admissionNo === f.admissionNo)?.fullName || 'N/A', f.term, f.amountPaid, f.balance]);
            downloadPdf(data, ['Admission No.', 'Full Name', 'Term', 'Amount Paid', 'Balance'], 'fees');
        });

        document.getElementById('downloadBooksExcelBtn')?.addEventListener('click', () => {
            const data = books.map(b => [b.admissionNo, learners.find(l => l.admissionNo === b.admissionNo)?.fullName || 'N/A', b.subject, b.bookTitle]);
            downloadExcel(data, ['Admission No.', 'Full Name', 'Subject', 'Book Title'], 'books');
        });

        document.getElementById('downloadBooksWordBtn')?.addEventListener('click', () => {
            const data = books.map(b => [b.admissionNo, learners.find(l => l.admissionNo === b.admissionNo)?.fullName || 'N/A', b.subject, b.bookTitle]);
            downloadWord(data, ['Admission No.', 'Full Name', 'Subject', 'Book Title'], 'books');
        });

        document.getElementById('downloadBooksPdfBtn')?.addEventListener('click', () => {
            const data = books.map(b => [b.admissionNo, learners.find(l => l.admissionNo === b.admissionNo)?.fullName || 'N/A', b.subject, b.bookTitle]);
            downloadPdf(data, ['Admission No.', 'Full Name', 'Subject', 'Book Title'], 'books');
        });
    }

    async function updateNextTermFee(admissionNo, nextTerm, amount) {
        const existingFee = fees.find(f => f.admissionNo === admissionNo && f.term === nextTerm);
        if (existingFee) {
            const updatedFee = { ...existingFee, amountPaid: (existingFee.amountPaid || 0) + amount };
            const feePerTerm = feeStructure[learners.find(l => l.admissionNo === admissionNo).grade.replace(' ', '').toLowerCase()] || 0;
            updatedFee.balance = feePerTerm - updatedFee.amountPaid;
            await fetch(`/api/fees/${existingFee._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedFee)
            });
        } else {
            const fee = {
                admissionNo,
                term: nextTerm,
                amountPaid: amount,
                balance: feeStructure[learners.find(l => l.admissionNo === admissionNo).grade.replace(' ', '').toLowerCase()] - amount
            };
            await fetch('/api/fees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fee)
            });
        }
    }

    async function sendFeeNotification(learner, fee) {
        // Check if the parent has opted out of SMS notifications
        const optedOutResponse = await fetch('/api/checkOptOut', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: learner.parentPhone })
        });
        const optedOut = await optedOutResponse.json();

        if (optedOut) {
            console.log(`Skipping SMS notification to ${learner.parentPhone} - user has opted out.`);
            alert(`SMS notification to ${learner.parentName} (${learner.parentPhone}) was skipped because they have opted out.`);
            return;
        }

        // Format the message to match the Twilio example: "fee bal : 2000"
        const message = `fee bal : ${fee.balance}`;
        console.log('Preparing to send SMS notification:', {
            phone: learner.parentPhone,
            message
        });

        try {
            const response = await fetch('/api/sendNotification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: learner.parentPhone,
                    message
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to send SMS: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('SMS notification sent successfully:', result);
            alert(`SMS notification sent successfully to ${learner.parentName} (${learner.parentPhone}). Message SID: ${result.sid}`);
        } catch (err) {
            console.error('Error sending SMS notification:', err.message);
            alert(`Failed to send SMS notification to ${learner.parentName} (${learner.parentPhone}): ${err.message}`);
        }
    }

    function displayLearners() {
        const tbody = document.querySelector('#learnersBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        learners.forEach((learner, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${learner.admissionNo}</td>
                <td>${learner.fullName}</td>
                <td>${learner.gender}</td>
                <td>${learner.dob}</td>
                <td>${learner.grade}</td>
                <td>${learner.assessmentNumber || 'N/A'}</td>
                <td>${learner.parentName}</td>
                <td>${learner.parentPhone}</td>
                <td>
                    <button onclick="editLearner('${learner._id}', ${index})">Edit</button>
                    <button onclick="deleteLearner('${learner._id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function displayFees() {
        const tbody = document.querySelector('#feesBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (fees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No fee records available.</td></tr>';
            return;
        }
        fees.forEach((fee, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${fee.admissionNo}</td>
                <td>${learners.find(l => l.admissionNo === fee.admissionNo)?.fullName || 'N/A'}</td>
                <td>${fee.term}</td>
                <td>${fee.amountPaid}</td>
                <td>${fee.balance}</td>
                <td>
                    <button onclick="editFee('${fee._id}', ${index})">Edit</button>
                    <button onclick="deleteFee('${fee._id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function displayBooks() {
        const tbody = document.querySelector('#booksBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        books.forEach((book, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${book.admissionNo}</td>
                <td>${learners.find(l => l.admissionNo === book.admissionNo)?.fullName || 'N/A'}</td>
                <td>${book.subject}</td>
                <td>${book.bookTitle}</td>
                <td>
                    <button onclick="editBook('${book._id}', ${index})">Edit</button>
                    <button onclick="deleteBook('${book._id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function displayClassBooks() {
        const tbody = document.querySelector('#classBooksBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        classBooks.forEach((book, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${book.bookNumber}</td>
                <td>${book.subject}</td>
                <td>${book.description}</td>
                <td>${book.totalBooks}</td>
                <td>
                    <button onclick="editClassBook('${book._id}', ${index})">Edit</button>
                    <button onclick="deleteClassBook('${book._id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.editLearner = (id, index) => {
        const learner = learners.find(l => l._id === id);
        document.getElementById('editLearnerIndex').value = index;
        document.getElementById('editFullName').value = learner.fullName;
        document.getElementById('editGender').value = learner.gender;
        document.getElementById('editDob').value = learner.dob;
        document.getElementById('editGrade').value = learner.grade;
        document.getElementById('editAssessmentNumber').value = learner.assessmentNumber || '';
        document.getElementById('editParentName').value = learner.parentName;
        document.getElementById('editParentPhone').value = learner.parentPhone;
        document.getElementById('editParentEmail').value = learner.parentEmail;
        document.getElementById('editAssessmentNumber').style.display = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'].includes(learner.grade) ? 'block' : 'none';
        document.getElementById('editLearnerForm').style.display = 'block';
    };

    window.editFee = (id, index) => {
        const fee = fees.find(f => f._id === id);
        document.getElementById('editFeeIndex').value = index;
        document.getElementById('editFeeAdmissionNo').innerHTML = learners.map(l => `<option value="${l.admissionNo}" ${l.admissionNo === fee.admissionNo ? 'selected' : ''}>${l.admissionNo} - ${l.fullName}</option>`).join('');
        document.getElementById('editTerm').value = fee.term;
        document.getElementById('editAmountPaid').value = fee.amountPaid;
        document.getElementById('editFeeForm').style.display = 'block';
    };

    window.editBook = (id, index) => {
        const book = books.find(b => b._id === id);
        document.getElementById('editBookIndex').value = index;
        document.getElementById('editBookAdmissionNo').innerHTML = learners.map(l => `<option value="${l.admissionNo}" ${l.admissionNo === book.admissionNo ? 'selected' : ''}>${l.admissionNo} - ${l.fullName}</option>`).join('');
        document.getElementById('editSubject').value = book.subject;
        document.getElementById('editBookTitle').value = book.bookTitle;
        document.getElementById('editBookForm').style.display = 'block';
    };

    window.editClassBook = (id, index) => {
        const book = classBooks.find(b => b._id === id);
        document.getElementById('editClassBookIndex').value = index;
        document.getElementById('editBookNumber').value = book.bookNumber;
        document.getElementById('editClassSubject').value = book.subject;
        document.getElementById('editBookDescription').value = book.description;
        document.getElementById('editTotalBooks').value = book.totalBooks;
        document.getElementById('editClassBookForm').style.display = 'block';
    };

    window.deleteLearner = async (id) => {
        if (confirm('Are you sure you want to delete this learner?')) {
            await fetch(`/api/learners/${id}`, { method: 'DELETE' });
            await fetchLearners();
        }
    };

    window.deleteFee = async (id) => {
        if (confirm('Are you sure you want to delete this fee record?')) {
            await fetch(`/api/fees/${id}`, { method: 'DELETE' });
            await fetchFees();
        }
    };

    window.deleteBook = async (id) => {
        if (confirm('Are you sure you want to delete this book record?')) {
            await fetch(`/api/books/${id}`, { method: 'DELETE' });
            await fetchBooks();
        }
    };

    window.deleteClassBook = async (id) => {
        if (confirm('Are you sure you want to delete this class book record?')) {
            await fetch(`/api/classBooks/${id}`, { method: 'DELETE' });
            await fetchClassBooks();
        }
    };

    function loadFeeStructure() {
        document.getElementById('playgroupFee').value = feeStructure.playgroup || '';
        document.getElementById('pp1Fee').value = feeStructure.pp1 || '';
        document.getElementById('pp2Fee').value = feeStructure.pp2 || '';
        document.getElementById('grade1Fee').value = feeStructure.grade1 || '';
        document.getElementById('grade2Fee').value = feeStructure.grade2 || '';
        document.getElementById('grade3Fee').value = feeStructure.grade3 || '';
        document.getElementById('grade4Fee').value = feeStructure.grade4 || '';
        document.getElementById('grade5Fee').value = feeStructure.grade5 || '';
        document.getElementById('grade6Fee').value = feeStructure.grade6 || '';
        document.getElementById('grade7Fee').value = feeStructure.grade7 || '';
        document.getElementById('grade8Fee').value = feeStructure.grade8 || '';
        document.getElementById('grade9Fee').value = feeStructure.grade9 || '';
    }

    // Download Functions
    function downloadExcel(data, headers, filename) {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, `${filename}.xlsx`);
    }

    function downloadWord(data, headers, filename) {
        const htmlContent = `
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <thead>
                    <tr>${headers.map(h => `<th style="background-color: #3498db; color: white; padding: 8px;">${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${data.map(row => `<tr>${row.map(cell => `<td style="padding: 8px;">${cell}</td>`).join('')}</tr>`).join('')}
                </tbody>
            </table>
        `;
        
        const doc = htmlDocx.asBlob(htmlContent);
        const url = URL.createObjectURL(doc);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.docx`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function downloadPdf(data, headers, filename) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.autoTable({
            head: [headers],
            body: data,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [52, 152, 219] },
        });
        doc.save(`${filename}.pdf`);
    }
});