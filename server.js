require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Suppress the punycode deprecation warning (not critical for this application)
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.set('strictQuery', false); // Suppress Mongoose strictQuery deprecation warning

const connectToMongoDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';
        console.log('Attempting to connect to MongoDB with URI:', mongoURI.replace(/\/\/.*@/, '//<hidden>@')); // Debug log with hidden credentials
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
            socketTimeoutMS: 45000, // Increase socket timeout to 45 seconds
        });
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message);
        // Instead of exiting, keep the app running to avoid 502 errors, but log the issue
        // process.exit(1); // Commented out to prevent immediate crash
        throw new Error('MongoDB connection failed'); // Let the app handle the error gracefully
    }
};

// Call the connection function and handle errors
connectToMongoDB().catch((error) => {
    console.error('MongoDB connection error during startup:', error.message);
    // Keep the server running to avoid 502 errors, but indicate the issue
    app.get('/health', (req, res) => {
        res.status(503).json({ status: 'error', message: 'Service unavailable: MongoDB connection failed' });
    });
});

// Models
const learnerSchema = new mongoose.Schema({
    admissionNo: String,
    fullName: String,
    gender: String,
    dob: String,
    grade: String,
    assessmentNumber: String,
    parentName: String,
    parentPhone: String,
    parentEmail: String
});

const feeSchema = new mongoose.Schema({
    admissionNo: String,
    term: String,
    amountPaid: Number,
    balance: Number
});

const bookSchema = new mongoose.Schema({
    admissionNo: String,
    subject: String,
    bookTitle: String
});

const classBookSchema = new mongoose.Schema({
    bookNumber: String,
    subject: String,
    description: String,
    totalBooks: Number
});

const feeStructureSchema = new mongoose.Schema({
    playgroup: Number,
    pp1: Number,
    pp2: Number,
    grade1: Number,
    grade2: Number,
    grade3: Number,
    grade4: Number,
    grade5: Number,
    grade6: Number,
    grade7: Number,
    grade8: Number,
    grade9: Number
});

const termSettingsSchema = new mongoose.Schema({
    currentTerm: String,
    currentYear: Number
});

const learnerArchiveSchema = new mongoose.Schema({
    year: Number,
    learners: [learnerSchema]
});

const Learner = mongoose.model('Learner', learnerSchema);
const Fee = mongoose.model('Fee', feeSchema);
const Book = mongoose.model('Book', bookSchema);
const ClassBook = mongoose.model('ClassBook', classBookSchema);
const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
const TermSettings = mongoose.model('TermSettings', termSettingsSchema);
const LearnerArchive = mongoose.model('LearnerArchive', learnerArchiveSchema);

// API Routes
app.get('/api/learners', async (req, res) => {
    try {
        const learners = await Learner.find();
        res.json(learners);
    } catch (error) {
        console.error('Error fetching learners:', error.message);
        res.status(500).json({ error: 'Failed to fetch learners' });
    }
});

app.post('/api/learners', async (req, res) => {
    try {
        const learner = new Learner(req.body);
        await learner.save();
        res.json(learner);
    } catch (error) {
        console.error('Error adding learner:', error.message);
        res.status(500).json({ error: 'Failed to add learner' });
    }
});

app.put('/api/learners/:id', async (req, res) => {
    try {
        const learner = await Learner.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!learner) {
            return res.status(404).json({ error: 'Learner not found' });
        }
        res.json(learner);
    } catch (error) {
        console.error('Error updating learner:', error.message);
        res.status(500).json({ error: 'Failed to update learner' });
    }
});

app.delete('/api/learners/:id', async (req, res) => {
    try {
        const learner = await Learner.findByIdAndDelete(req.params.id);
        if (!learner) {
            return res.status(404).json({ error: 'Learner not found' });
        }
        res.sendStatus(204);
    } catch (error) {
        console.error('Error deleting learner:', error.message);
        res.status(500).json({ error: 'Failed to delete learner' });
    }
});

app.get('/api/fees', async (req, res) => {
    try {
        const fees = await Fee.find();
        res.json(fees);
    } catch (error) {
        console.error('Error fetching fees:', error.message);
        res.status(500).json({ error: 'Failed to fetch fees' });
    }
});

app.post('/api/fees', async (req, res) => {
    try {
        const fee = new Fee(req.body);
        await fee.save();
        res.json(fee);
    } catch (error) {
        console.error('Error adding fee:', error.message);
        res.status(500).json({ error: 'Failed to add fee' });
    }
});

app.put('/api/fees/:id', async (req, res) => {
    try {
        const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!fee) {
            return res.status(404).json({ error: 'Fee not found' });
        }
        res.json(fee);
    } catch (error) {
        console.error('Error updating fee:', error.message);
        res.status(500).json({ error: 'Failed to update fee' });
    }
});

app.delete('/api/fees/:id', async (req, res) => {
    try {
        const fee = await Fee.findByIdAndDelete(req.params.id);
        if (!fee) {
            return res.status(404).json({ error: 'Fee not found' });
        }
        res.sendStatus(204);
    } catch (error) {
        console.error('Error deleting fee:', error.message);
        res.status(500).json({ error: 'Failed to delete fee' });
    }
});

app.get('/api/books', async (req, res) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (error) {
        console.error('Error fetching books:', error.message);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

app.post('/api/books', async (req, res) => {
    try {
        const book = new Book(req.body);
        await book.save();
        res.json(book);
    } catch (error) {
        console.error('Error adding book:', error.message);
        res.status(500).json({ error: 'Failed to add book' });
    }
});

app.put('/api/books/:id', async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(book);
    } catch (error) {
        console.error('Error updating book:', error.message);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

app.delete('/api/books/:id', async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.sendStatus(204);
    } catch (error) {
        console.error('Error deleting book:', error.message);
        res.status(500).json({ error: 'Failed to delete book' });
    }
});

app.get('/api/classBooks', async (req, res) => {
    try {
        const classBooks = await ClassBook.find();
        res.json(classBooks);
    } catch (error) {
        console.error('Error fetching class books:', error.message);
        res.status(500).json({ error: 'Failed to fetch class books' });
    }
});

app.post('/api/classBooks', async (req, res) => {
    try {
        const classBook = new ClassBook(req.body);
        await classBook.save();
        res.json(classBook);
    } catch (error) {
        console.error('Error adding class book:', error.message);
        res.status(500).json({ error: 'Failed to add class book' });
    }
});

app.put('/api/classBooks/:id', async (req, res) => {
    try {
        const classBook = await ClassBook.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!classBook) {
            return res.status(404).json({ error: 'Class book not found' });
        }
        res.json(classBook);
    } catch (error) {
        console.error('Error updating class book:', error.message);
        res.status(500).json({ error: 'Failed to update class book' });
    }
});

app.delete('/api/classBooks/:id', async (req, res) => {
    try {
        const classBook = await ClassBook.findByIdAndDelete(req.params.id);
        if (!classBook) {
            return res.status(404).json({ error: 'Class book not found' });
        }
        res.sendStatus(204);
    } catch (error) {
        console.error('Error deleting class book:', error.message);
        res.status(500).json({ error: 'Failed to delete class book' });
    }
});

app.get('/api/feeStructure', async (req, res) => {
    try {
        const feeStructure = await FeeStructure.findOne();
        res.json(feeStructure || {});
    } catch (error) {
        console.error('Error fetching fee structure:', error.message);
        res.status(500).json({ error: 'Failed to fetch fee structure' });
    }
});

app.post('/api/feeStructure', async (req, res) => {
    try {
        let feeStructure = await FeeStructure.findOne();
        if (feeStructure) {
            // Update existing fee structure
            feeStructure = await FeeStructure.findOneAndUpdate({}, req.body, { new: true });
        } else {
            // Create new fee structure
            feeStructure = new FeeStructure(req.body);
            await feeStructure.save();
        }
        res.json(feeStructure);
    } catch (error) {
        console.error('Error saving fee structure:', error.message);
        res.status(500).json({ error: 'Failed to save fee structure' });
    }
});

app.get('/api/termSettings', async (req, res) => {
    try {
        const termSettings = await TermSettings.findOne();
        res.json(termSettings || { currentTerm: 'Term 1', currentYear: new Date().getFullYear() });
    } catch (error) {
        console.error('Error fetching term settings:', error.message);
        res.status(500).json({ error: 'Failed to fetch term settings' });
    }
});

app.post('/api/termSettings', async (req, res) => {
    try {
        let termSettings = await TermSettings.findOne();
        if (termSettings) {
            termSettings = await TermSettings.findOneAndUpdate({}, req.body, { new: true });
        } else {
            termSettings = new TermSettings(req.body);
            await termSettings.save();
        }
        res.json(termSettings);
    } catch (error) {
        console.error('Error saving term settings:', error.message);
        res.status(500).json({ error: 'Failed to save term settings' });
    }
});

app.post('/api/newAcademicYear', async (req, res) => {
    try {
        const termSettings = await TermSettings.findOne();
        if (!termSettings) {
            return res.status(400).json({ error: 'Term settings not found' });
        }

        const currentYear = termSettings.currentYear;
        const learners = await Learner.find();

        // Archive current year's learners
        const archive = new LearnerArchive({
            year: currentYear,
            learners: learners
        });
        await archive.save();

        // Update learners' grades
        const gradeOrder = ['Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
        for (let learner of learners) {
            const currentGradeIndex = gradeOrder.indexOf(learner.grade);
            if (currentGradeIndex < gradeOrder.length - 1) {
                learner.grade = gradeOrder[currentGradeIndex + 1];
                await learner.save();
            } else {
                await Learner.findByIdAndDelete(learner._id); // Remove learners who have completed Grade 9
            }
        }

        // Update term settings
        termSettings.currentYear = currentYear + 1;
        termSettings.currentTerm = 'Term 1';
        await termSettings.save();

        res.sendStatus(200);
    } catch (error) {
        console.error('Error starting new academic year:', error.message);
        res.status(500).json({ error: 'Failed to start new academic year' });
    }
});

app.get('/api/learnerArchives/years', async (req, res) => {
    try {
        const archives = await LearnerArchive.find({}, 'year');
        const years = archives.map(archive => archive.year);
        res.json(years);
    } catch (error) {
        console.error('Error fetching archived years:', error.message);
        res.status(500).json({ error: 'Failed to fetch archived years' });
    }
});

app.get('/api/learnerArchives/:year', async (req, res) => {
    try {
        const archive = await LearnerArchive.findOne({ year: parseInt(req.params.year) });
        if (!archive) {
            return res.status(404).json({ error: 'Archive not found' });
        }
        res.json(archive.learners);
    } catch (error) {
        console.error('Error fetching archived learners:', error.message);
        res.status(500).json({ error: 'Failed to fetch archived learners' });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
