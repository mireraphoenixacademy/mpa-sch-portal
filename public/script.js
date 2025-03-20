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
            await loadInitialData();
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

    async function loadInitialData() {
        const errors = [];
        try {
            await fetchLearners();
        } catch (error) {
            errors.push('learners');
        }
        try {
            await fetchFees();
        } catch (error) {
            errors.push('fees');
        }
        try {
            await fetchBooks();
        } catch (error) {
            errors.push('books');
        }
        try {
            await fetchClassBooks();
        } catch (error) {
            errors.push('class books');
        }
        try {
            await fetchFeeStructure();
        } catch (error) {
            errors.push('fee structure');
        }
        try {
            await fetchTermSettings();
        } catch (error) {
            errors.push('term settings');
        }
        try {
            await fetchArchivedYears();
        } catch (error) {
            errors.push('archived years');
        }
        if (errors.length > 0) {
            alert(`Failed to fetch the following data: ${errors.join(', ')}. Please try again later.`);
        }
    }

    async function fetchLearners() {
        console.log('Fetching learners...');
        const response = await fetch('/api/learners');
        if (!response.ok) {
            throw new Error(`Failed to fetch learners: ${response.status} ${response.statusText}`);
        }
        learners = await response.json();
        console.log('Fetched learners:', learners);
        displayLearners();
    }

    async function fetchFees() {
        console.log('Fetching fees...');
        const response = await fetch('/api/fees');
        if (!response.ok) {
            throw new Error(`Failed to fetch fees: ${response.status} ${response.statusText}`);
        }
        fees = await response.json();
        console.log('Fetched fees:', fees);
        displayFees();
    }

    async function fetchBooks() {
        console.log('Fetching books...');
        const response = await fetch('/api/books');
        if (!response.ok) {
            throw new Error(`Failed to fetch books: ${response.status} ${response.statusText}`);
        }
        books = await response.json();
        console.log('Fetched books:', books);
        displayBooks();
    }

    async function fetchClassBooks() {
        console.log('Fetching class books...');
        const response = await fetch('/api/classBooks');
        if (!response.ok) {
            throw new Error(`Failed to fetch class books: ${response.status} ${response.statusText}`);
        }
        classBooks = await response.json();
        console.log('Fetched class books:', classBooks);
        displayClassBooks();
    }

    async function fetchFeeStructure() {
        console.log('Fetching fee structure...');
        const response = await fetch('/api/feeStructure');
        if (!response.ok) {
            throw new Error(`Failed to fetch fee structure: ${response.status} ${response.statusText}`);
        }
        feeStructure = await response.json() || {};
        console.log('Fetched fee structure:', feeStructure);
        loadFeeStructure();
    }

    async function fetchTermSettings() {
        console.log('Fetching term settings...');
        const response = await fetch('/api/termSettings');
        if (!response.ok) {
            throw new Error(`Failed to fetch term settings: ${response.status} ${response.statusText}`);
        }
        const settings = await response.json();
        if (settings) {
            currentTerm = settings.currentTerm || 'Term 1';
            currentYear = settings.currentYear || new Date().getFullYear();
        }
        document.getElementById('currentTermYear').textContent = `${currentTerm} ${currentYear}`;
        document.getElementById('currentTerm').value = currentTerm;
        document.getElementById('currentYear').value = currentYear;
        console.log('Fetched term settings:', { currentTerm, currentYear });
    }

    async function fetchArchivedYears() {
        console.log('Fetching archived years...');
        const response = await fetch('/api/learnerArchives/years');
        if (!response.ok) {
            throw new Error(`Failed to fetch archived years: ${response.status} ${response.statusText}`);
        }
        const years = await response.json();
        const select = document.getElementById('learnerYearSelect');
        select.innerHTML = `<option value="${currentYear}">${currentYear} (Current)</option>` +
            years.map(year => `<option value="${year}">${year}</option>`).join('');
        console.log('Fetched archived years:', years);
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
            try {
                console.log('Adding learner:', learner);
                const response = await fetch('/api/learners', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(learner)
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to add learner: ${response.status} ${response.statusText} - ${errorText}`);
                }
                const savedLearner = await response.json();
                console.log('Learner added successfully:', savedLearner);
                await fetchLearners();
                document.getElementById('learnerForm').reset();
                document.getElementById('addLearnerForm').style.display = 'none';
                alert('Learner added successfully');
            } catch (error) {
                console.error('Error adding learner:', error.message);
                alert(`Failed to add learner: ${error.message}. Please try again.`);
            }
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
            try {
                console.log('Updating learner:', learner);
                const response = await fetch(`/api/learners/${learners[index]._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(learner)
                });
                if (!response.ok) {
                    throw new Error(`Failed to update learner: ${response.status} ${response.statusText}`);
                }
                await fetchLearners();
                document.getElementById('editLearnerForm').style.display = 'none';
                alert('Learner updated successfully');
            } catch (error) {
                console.error('Error updating learner:', error);
                alert('Failed to update learner. Please try again.');
            }
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

            try {
                console.log('Adding fee:', fee);
                const response = await fetch('/api/fees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fee)
                });
                if (!response.ok) {
                    throw new Error(`Failed to add fee: ${response.status} ${response.statusText}`);
                }
                alert(`Fee added successfully for ${learner.fullName}! Balance: ${balance}`);
                await fetchFees();
                document.getElementById('feeForm').reset();
                document.getElementById('addFeeForm').style.display = 'none';
            } catch (error) {
                console.error('Error adding fee:', error);
                alert('Failed to add fee. Please try again.');
            }
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

            try {
                console.log('Updating fee:', fee);
                const response = await fetch(`/api/fees/${fees[index]._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fee)
                });
                if (!response.ok) {
                    throw new Error(`Failed to update fee: ${response.status} ${response.statusText}`);
                }
                alert(`Fee updated successfully for ${learner.fullName}! Balance: ${balance}`);
                await fetchFees();
                document.getElementById('editFeeForm').style.display = 'none';
            } catch (error) {
                console.error('Error updating fee:', error);
                alert('Failed to update fee. Please try again.');
            }
        });

        // Book Form
        document.getElementById('bookForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const book = {
                admissionNo: document.getElementById('bookAdmissionNo').value,
                subject: document.getElementById('subject').value,
                bookTitle: document.getElementById('bookTitle').value
            };
            try {
                console.log('Adding book:', book);
                const response = await fetch('/api/books', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(book)
                });
                if (!response.ok) {
                    throw new Error(`Failed to add book: ${response.status} ${response.statusText}`);
                }
                await fetchBooks();
                document.getElementById('bookForm').reset();
                document.getElementById('addBookForm').style.display = 'none';
                alert('Book added successfully');
            } catch (error) {
                console.error('Error adding book:', error);
                alert('Failed to add book. Please try again.');
            }
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
            try {
                console.log('Updating book:', book);
                const response = await fetch(`/api/books/${books[index]._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(book)
                });
                if (!response.ok) {
                    throw new Error(`Failed to update book: ${response.status} ${response.statusText}`);
                }
                await fetchBooks();
                document.getElementById('editBookForm').style.display = 'none';
                alert('Book updated successfully');
            } catch (error) {
                console.error('Error updating book:', error);
                alert('Failed to update book. Please try again.');
            }
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
            try {
                console.log('Adding class book:', classBook);
                const response = await fetch('/api/classBooks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(classBook)
                });
                if (!response.ok) {
                    throw new Error(`Failed to add class book: ${response.status} ${response.statusText}`);
                }
                await fetchClassBooks();
                document.getElementById('classBookForm').reset();
                document.getElementById('addClassBookForm').style.display = 'none';
                alert('Class book added successfully');
            } catch (error) {
                console.error('Error adding class book:', error);
                alert('Failed to add class book. Please try again.');
            }
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
            try {
                console.log('Updating class book:', classBook);
                const response = await fetch(`/api/classBooks/${classBooks[index]._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(classBook)
                });
                if (!response.ok) {
                    throw new Error(`Failed to update class book: ${response.status} ${response.statusText}`);
                }
                await fetchClassBooks();
                document.getElementById('editClassBookForm').style.display = 'none';
                alert('Class book updated successfully');
            } catch (error) {
                console.error('Error updating class book:', error);
                alert('Failed to update class book. Please try again.');
            }
        });

        // Fee Structure Form
        document.getElementById('feeStructureForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newFeeStructure = {
                playgroup: parseFloat(document.getElementById('playgroupFee').value) || 0,
                pp1: parseFloat(document.getElementById('pp1Fee').value) || 0,
                pp2: parseFloat(document.getElementById('pp2Fee').value) || 0,
                grade1: parseFloat(document.getElementById('grade1Fee').value) || 0,
                grade2: parseFloat(document.getElementById('grade2Fee').value) || 0,
                grade3: parseFloat(document.getElementById('grade3Fee').value) || 0,
                grade4: parseFloat(document.getElementById('grade4Fee').value) || 0,
                grade5: parseFloat(document.getElementById('grade5Fee').value) || 0,
                grade6: parseFloat(document.getElementById('grade6Fee').value) || 0,
                grade7: parseFloat(document.getElementById('grade7Fee').value) || 0,
                grade8: parseFloat(document.getElementById('grade8Fee').value) || 0,
                grade9: parseFloat(document.getElementById('grade9Fee').value) || 0
            };
            try {
                console.log('Saving fee structure:', newFeeStructure);
                const response = await fetch('/api/feeStructure', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newFeeStructure)
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to save fee structure: ${response.status} ${response.statusText} - ${errorText}`);
                }
                const savedFeeStructure = await response.json();
                feeStructure = savedFeeStructure;
                console.log('Fee structure saved:', savedFeeStructure);
                alert('Fee structure saved successfully');
                loadFeeStructure();
            } catch (error) {
                console.error('Error saving fee structure:', error);
                alert(`Failed to save fee structure: ${error.message}. Please try again.`);
            }
        });

        // Term Settings Form
        document.getElementById('termSettingsForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const settings = {
                currentTerm: document.getElementById('currentTerm').value,
                currentYear: parseInt(document.getElementById('currentYear').value)
            };
            try {
                console.log('Saving term settings:', settings);
                const response = await fetch('/api/termSettings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settings)
                });
                if (!response.ok) {
                    throw new Error(`Failed to save term settings: ${response.status} ${response.statusText}`);
                }
                await fetchTermSettings();
                alert('Term settings saved successfully');
            } catch (error) {
                console.error('Error saving term settings:', error);
                alert('Failed to save term settings. Please try again.');
            }
        });

        // New Academic Year
        document.getElementById('newAcademicYearBtn')?.addEventListener('click', async () => {
            if (confirm('Are you sure you want to start a new academic year? This will archive the current year\'s data and update learners\' grades.')) {
                try {
                    console.log('Starting new academic year...');
                    const response = await fetch('/api/newAcademicYear', { method: 'POST' });
                    if (!response.ok) {
                        throw new Error(`Failed to start new academic year: ${response.status} ${response.statusText}`);
                    }
                    await Promise.all([fetchLearners(), fetchTermSettings(), fetchArchivedYears()]);
                    alert('New academic year started successfully');
                } catch (error) {
                    console.error('Error starting new academic year:', error);
                    alert('Failed to start new academic year. Please try again.');
                }
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
                console.log('Navigating to section:', sectionId);

                document.querySelectorAll('.sidebar a').forEach(link => link.classList.remove('active'));
                document.querySelectorAll('section').forEach(s => s.style.display = 'none');

                a.classList.add('active');

                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    console.log('Section found, displaying:', sectionId);
                    targetSection.style.display = 'block';
                } else {
                    console.error('Section not found:', sectionId);
                }

                if (sectionId === 'fees') {
                    console.log('Calling displayFees()');
                    displayFees();
                } else if (sectionId === 'learners') {
                    console.log('Calling displayLearners()');
                    displayLearners();
                } else if (sectionId === 'books') {
                    console.log('Calling displayBooks()');
                    displayBooks();
                } else if (sectionId === 'classBooks') {
                    console.log('Calling displayClassBooks()');
                    displayClassBooks();
                } else if (sectionId === 'feeStructure') {
                    console.log('Calling loadFeeStructure()');
                    loadFeeStructure();
                } else if (sectionId === 'dashboard') {
                    console.log('Displaying dashboard');
                    document.getElementById('dashboard').style.display = 'block';
                } else if (sectionId === 'transferRequests') {
                    console.log('Displaying transferRequests');
                    document.getElementById('transferRequests').style.display = 'block';
                } else if (sectionId === 'termSettings') {
                    console.log('Displaying termSettings');
                    document.getElementById('termSettings').style.display = 'block';
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
            try {
                console.log('Updating next term fee:', updatedFee);
                const response = await fetch(`/api/fees/${existingFee._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedFee)
                });
                if (!response.ok) {
                    throw new Error(`Failed to update next term fee: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error updating next term fee:', error);
            }
        } else {
            const fee = {
                admissionNo,
                term: nextTerm,
                amountPaid: amount,
                balance: feeStructure[learners.find(l => l.admissionNo === admissionNo).grade.replace(' ', '').toLowerCase()] - amount
            };
            try {
                console.log('Adding next term fee:', fee);
                const response = await fetch('/api/fees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fee)
                });
                if (!response.ok) {
                    throw new Error(`Failed to add next term fee: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error adding next term fee:', error);
            }
        }
    }

    function displayLearners() {
        const tbody = document.querySelector('#learnersBody');
        if (!tbody) {
            console.error('learnersBody element not found');
            return;
        }
        console.log('Populating learners table with data:', learners);
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
        if (!tbody) {
            console.error('feesBody element not found');
            return;
        }
        console.log('Populating fees table with data:', fees);
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
        if (!tbody) {
            console.error('booksBody element not found');
            return;
        }
        console.log('Populating books table with data:', books);
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
        if (!tbody) {
            console.error('classBooksBody element not found');
            return;
        }
        console.log('Populating class books table with data:', classBooks);
        tbody.innerHTML = '';
        classBooks.forEach((classBook, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${classBook.bookNumber}</td>
                <td>${classBook.subject}</td>
                <td>${classBook.description}</td>
                <td>${classBook.totalBooks}</td>
                <td>
                    <button onclick="editClassBook('${classBook._id}', ${index})">Edit</button>
                    <button onclick="deleteClassBook('${classBook._id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function loadFeeStructure() {
        console.log('Loading fee structure into form:', feeStructure);
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

    window.editLearner = (id, index) => {
        const learner = learners[index];
        document.getElementById('editLearnerIndex').value = index;
        document.getElementById('editFullName').value = learner.fullName;
        document.getElementById('editGender').value = learner.gender;
        document.getElementById('editDob').value = learner.dob;
        document.getElementById('editGrade').value = learner.grade;
        document.getElementById('editAssessmentNumber').value = learner.assessmentNumber || '';
        document.getElementById('editParentName').value = learner.parentName;
        document.getElementById('editParentPhone').value = learner.parentPhone;
        document.getElementById('editParentEmail').value = learner.parentEmail;
        document.getElementById('editLearnerForm').style.display = 'block';
    };

    window.deleteLearner = async (id) => {
        if (confirm('Are you sure you want to delete this learner?')) {
            try {
                console.log('Deleting learner with ID:', id);
                const response = await fetch(`/api/learners/${id}`, { method: 'DELETE' });
                if (!response.ok) {
                    throw new Error(`Failed to delete learner: ${response.status} ${response.statusText}`);
                }
                await fetchLearners();
                alert('Learner deleted successfully');
            } catch (error) {
                console.error('Error deleting learner:', error);
                alert('Failed to delete learner. Please try again.');
            }
        }
    };

    window.editFee = (id, index) => {
        const fee = fees[index];
        document.getElementById('editFeeIndex').value = index;
        document.getElementById('editFeeAdmissionNo').innerHTML = learners.map(l => `<option value="${l.admissionNo}" ${l.admissionNo === fee.admissionNo ? 'selected' : ''}>${l.admissionNo} - ${l.fullName}</option>`).join('');
        document.getElementById('editTerm').value = fee.term;
        document.getElementById('editAmountPaid').value = fee.amountPaid;
        document.getElementById('editFeeForm').style.display = 'block';
    };

    window.deleteFee = async (id) => {
        if (confirm('Are you sure you want to delete this fee record?')) {
            try {
                console.log('Deleting fee with ID:', id);
                const response = await fetch(`/api/fees/${id}`, { method: 'DELETE' });
                if (!response.ok) {
                    throw new Error(`Failed to delete fee: ${response.status} ${response.statusText}`);
                }
                await fetchFees();
                alert('Fee deleted successfully');
            } catch (error) {
                console.error('Error deleting fee:', error);
                alert('Failed to delete fee. Please try again.');
            }
        }
    };

    window.editBook = (id, index) => {
        const book = books[index];
        document.getElementById('editBookIndex').value = index;
        document.getElementById('editBookAdmissionNo').innerHTML = learners.map(l => `<option value="${l.admissionNo}" ${l.admissionNo === book.admissionNo ? 'selected' : ''}>${l.admissionNo} - ${l.fullName}</option>`).join('');
        document.getElementById('editSubject').value = book.subject;
        document.getElementById('editBookTitle').value = book.bookTitle;
        document.getElementById('editBookForm').style.display = 'block';
    };

    window.deleteBook = async (id) => {
        if (confirm('Are you sure you want to delete this book record?')) {
            try {
                console.log('Deleting book with ID:', id);
                const response = await fetch(`/api/books/${id}`, { method: 'DELETE' });
                if (!response.ok) {
                    throw new Error(`Failed to delete book: ${response.status} ${response.statusText}`);
                }
                await fetchBooks();
                alert('Book deleted successfully');
            } catch (error) {
                console.error('Error deleting book:', error);
                alert('Failed to delete book. Please try again.');
            }
        }
    };

    window.editClassBook = (id, index) => {
        const classBook = classBooks[index];
        document.getElementById('editClassBookIndex').value = index;
        document.getElementById('editBookNumber').value = classBook.bookNumber;
        document.getElementById('editClassSubject').value = classBook.subject;
        document.getElementById('editBookDescription').value = classBook.description;
        document.getElementById('editTotalBooks').value = classBook.totalBooks;
        document.getElementById('editClassBookForm').style.display = 'block';
    };

    window.deleteClassBook = async (id) => {
        if (confirm('Are you sure you want to delete this class book record?')) {
            try {
                console.log('Deleting class book with ID:', id);
                const response = await fetch(`/api/classBooks/${id}`, { method: 'DELETE' });
                if (!response.ok) {
                    throw new Error(`Failed to delete class book: ${response.status} ${response.statusText}`);
                }
                await fetchClassBooks();
                alert('Class book deleted successfully');
            } catch (error) {
                console.error('Error deleting class book:', error);
                alert('Failed to delete class book. Please try again.');
            }
        }
    };

    function downloadExcel(data, headers, filename) {
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    }

    function downloadWord(data, headers, filename) {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [new TextRun(`Report: ${filename}`), new TextRun({ text: '', break: 2 })]
                    }),
                    new Table({
                        rows: [
                            new TableRow({
                                children: headers.map(header => new TableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })], alignment: 'center' })],
                                    verticalAlign: 'center'
                                }))
                            }),
                            ...data.map(row => new TableRow({
                                children: row.map(cell => new TableCell({
                                    children: [new Paragraph({ children: [new TextRun(cell.toString())], alignment: 'center' })],
                                    verticalAlign: 'center'
                                }))
                            }))
                        ]
                    })
                ]
            }]
        });

        Packer.toBlob(doc).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        });
    }

    function downloadPdf(data, headers, filename) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.autoTable({
            head: [headers],
            body: data,
            styles: { halign: 'center' },
            headStyles: { fillColor: [0, 128, 128] }
        });
        doc.save(`${filename}.pdf`);
    }
});
