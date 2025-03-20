require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.set('strictQuery', false); // Suppress Mongoose strictQuery deprecation warning

const connectToMongoDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://mpaAdmin:sysAdmin368@cluster0.k9fva.mongodb.net/school_management?retryWrites=true&w=majority&appName=Cluster0';
        console.log('Attempting to connect to MongoDB with URI:', mongoURI.replace(/:([^:@]+)@/, ':****@')); // Mask password in logs
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // 5 seconds to select a server
            socketTimeoutMS: 5000, // 5 seconds for socket operations
            connectTimeoutMS: 5000, // 5 seconds for initial connection
            maxPoolSize: 5, // Reduce pool size for free tier
            retryWrites: true, // Retry failed writes
        });
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message, error.stack);
        process.exit(1); // Exit the process if MongoDB connection fails
    }
};

// Call the connection function
connectToMongoDB();

// Health Check Endpoint
app.get('/health', async (req, res) => {
    try {
        const dbState = mongoose.connection.readyState; // 1 = connected, 0 = disconnected
        if (dbState !== 1) {
            throw new Error('MongoDB is not connected');
        }
        res.status(200).json({ status: 'OK', message: 'Server and MongoDB are running' });
    } catch (error) {
        console.error('Health check failed:', error.message);
        res.status(500).json({ status: 'ERROR', message: 'Health check failed', error: error.message });
    }
});

// Models
const learnerSchema = new mongoose.Schema({
    admissionNo: { type: String, required: true },
    fullName: { type: String, required: true },
    gender: { type: String, required: true },
    dob: { type: String, required: true },
    grade: { type: String, required: true },
    assessmentNumber: { type: String },
    parentName: { type: String, required: true },
    parentPhone: { type: String, required: true },
    parentEmail: { type: String, required: true }
});

const feeSchema = new mongoose.Schema({
    admissionNo: { type: String, required: true },
    term: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    balance: { type: Number, required: true }
});

const bookSchema = new mongoose.Schema({
    admissionNo: { type: String, required: true },
    subject: { type: String, required: true },
    bookTitle: { type: String, required: true }
});

const classBookSchema = new mongoose.Schema({
    bookNumber: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    totalBooks: { type: Number, required: true }
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
    currentTerm: { type: String, required: true },
    currentYear: { type: Number, required: true }
});

const learnerArchiveSchema = new mongoose.Schema({
    year: { type: Number, required: true },
    learners: [learnerSchema]
});

// Add indexes for better query performance
learnerSchema.index({ admissionNo: 1 });
feeSchema.index({ admissionNo: 1 });
bookSchema.index({ admissionNo: 1 });
classBookSchema.index({ bookNumber: 1 });
learnerArchiveSchema.index({ year: 1 });

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
        console.log('Fetching learners from MongoDB...');
        const learners = await Learner.find().lean().exec(); // Use lean() for faster queries
        console.log(`Fetched ${learners.length} learners`);
        res.json(learners);
    } catch (error) {
        console.error('Error fetching learners:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to fetch learners' });
    }
});

app.post('/api/learners', async (req, res) => {
    try {
        console.log('Adding new learner:', req.body);
        const learner = new Learner(req.body);
        await learner.validate(); // Explicitly validate the learner object
        console.log('Learner validation passed');
        await learner.save();
        console.log('Learner added successfully:', learner);
        res.json(learner);
    } catch (error) {
        console.error('Error adding learner:', error.message, error.stack);
        if (error.name === 'ValidationError') {
            console.error('Validation errors:', error.errors);
        }
        res.status(500).json({ error: 'Failed to add learner', details: error.message });
    }
});

app.put('/api/learners/:id', async (req, res) => {
    try {
        console.log(`Updating learner with ID ${req.params.id}:`, req.body);
        const learner = await Learner.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!learner) {
            console.log(`Learner with ID ${req.params.id} not found`);
            return res.status(404).json({ error: 'Learner not found' });
        }
        console.log('Learner updated successfully:', learner);
        res.json(learner);
    } catch (error) {
        console.error('Error updating learner:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to update learner' });
    }
});

app.delete('/api/learners/:id', async (req, res) => {
    try {
        console.log(`Deleting learner with ID ${req.params.id}`);
        const learner = await Learner.findByIdAndDelete(req.params.id);
        if (!learner) {
            console.log(`Learner with ID ${req.params.id} not found`);
            return res.status(404).json({ error: 'Learner not found' });
        }
        console.log('Learner deleted successfully');
        res.sendStatus(204);
    } catch (error) {
        console.error('Error deleting learner:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to delete learner' });
    }
});

app.get('/api/fees', async (req, res) => {
    try {
        console.log('Fetching fees from MongoDB...');
        const fees = await Fee.find().lean().exec();
        console.log(`Fetched ${fees.length} fees`);
        res.json(fees);
    } catch (error) {
        console.error('Error fetching fees:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to fetch fees' });
    }
});

app.post('/api/fees', async (req, res) => {
    try {
        console.log('Adding new fee:', req.body);
        const fee = new Fee(req.body);
        await fee.save();
        console.log('Fee added successfully:', fee);
        res.json(fee);
    } catch (error) {
        console.error('Error adding fee:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to add fee' });
    }
});

app.put('/api/fees/:id', async (req, res) => {
    try {
        console.log(`Updating fee with ID ${req.params.id}:`, req.body);
        const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!fee) {
            console.log(`Fee with ID ${req.params.id} not found`);
            return res.status(404).json({ error: 'Fee not found' });
        }
        console.log('Fee updated successfully:', fee);
        res.json(fee);
    } catch (error) {
        console.error('Error updating fee:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to update fee' });
    }
});

app.delete('/api/fees/:id', async (req, res) => {
    try {
        console.log(`Deleting fee with ID ${req.params.id}`);
        const fee = await Fee.findByIdAndDelete(req.params.id);
        if (!fee) {
            console.log(`Fee with ID ${req.params.id} not found`);
            return res.status(404).json({ error: 'Fee not found' });
        }
        console.log('Fee deleted successfully');
        res.sendStatus(204);
    } catch (error) {
        console.error('Error deleting fee:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to delete fee' });
    }
});

app.get('/api/books', async (req, res) => {
    try {
        console.log('Fetching books from MongoDB...');
        const books = await Book.find().lean().exec();
        console.log(`Fetched ${books.length} books`);
        res.json(books);
    } catch (error) {
        console.error('Error fetching books:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

app.post('/api/books', async (req, res) => {
    try {
        console.log('Adding new book:', req.body);
        const book = new Book(req.body);
        await book.save();
        console.log('Book added successfully:', book);
        res.json(book);
    } catch (error) {
        console.error('Error adding book:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to add book' });
    }
});

app.put('/api/books/:id', async (req, res) => {
    try {
        console.log(`Updating book with ID ${req.params.id}:`, req.body);
        const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!book) {
            console.log(`Book with ID ${req.params.id} not found`);
            return res.status(404).json({ error: 'Book not found' });
        }
        console.log('Book updated successfully:', book);
        res.json(book);
    } catch (error) {
        console.error('Error updating book:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

app.delete('/api/books/:id', async (req, res) => {
    try {
        console.log(`Deleting book with ID ${req.params.id}`);
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) {
            console.log(`Book with ID ${req.params.id} not found`);
            return res.status(404).json({ error: 'Book not found' });
        }
        console.log('Book deleted successfully');
        res.sendStatus(204);
    } catch (error) {
        console.error('Error deleting book:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to delete book' });
    }
});

app.get('/api/classBooks', async (req, res) => {
    try {
        console.log('Fetching class books from MongoDB...');
        const classBooks = await ClassBook.find().lean().exec();
        console.log(`Fetched ${classBooks.length} class books`);
        res.json(classBooks);
    } catch (error) {
        console.error('Error fetching class books:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to fetch class books' });
    }
});

app.post('/api/classBooks', async (req, res) => {
    try {
        console.log('Adding new class book:', req.body);
        const classBook = new ClassBook(req.body);
        await classBook.save();
        console.log('Class book added successfully:', classBook);
        res.json(classBook);
    } catch (error) {
        console.error('Error adding class book:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to add class book' });
    }
});

app.put('/api/classBooks/:id', async (req, res) => {
    try {
        console.log(`Updating class book with ID ${req.params.id}:`, req.body);
        const classBook = await ClassBook.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!classBook) {
            console.log(`Class book with ID ${req.params.id} not found`);
            return res.status(404).json({ error: 'Class book not found' });
        }
        console.log('Class book updated successfully:', classBook);
        res.json(classBook);
    } catch (error) {
        console.error('Error updating class book:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to update class book' });
    }
});

app.delete('/api/classBooks/:id', async (req, res) => {
    try {
        console.log(`Deleting class book with ID ${req.params.id}`);
        const classBook = await ClassBook.findByIdAndDelete(req.params.id);
        if (!classBook) {
            console.log(`Class book with ID ${req.params.id} not found`);
            return res.status(404).json({ error: 'Class book not found' });
        }
        console.log('Class book deleted successfully');
        res.sendStatus(204);
    } catch (error) {
        console.error('Error deleting class book:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to delete class book' });
    }
});

app.get('/api/feeStructure', async (req, res) => {
    try {
        console.log('Fetching fee structure from MongoDB...');
        const feeStructure = await FeeStructure.findOne().lean().exec();
        console.log('Fee structure fetched:', feeStructure);
        res.json(feeStructure || {});
    } catch (error) {
        console.error('Error fetching fee structure:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to fetch fee structure' });
    }
});

app.post('/api/feeStructure', async (req, res) => {
    try {
        console.log('Saving fee structure:', req.body);
        let feeStructure = await FeeStructure.findOne();
        if (feeStructure) {
            console.log('Updating existing fee structure...');
            feeStructure = await FeeStructure.findOneAndUpdate({}, req.body, { new: true });
        } else {
            console.log('Creating new fee structure...');
            feeStructure = new FeeStructure(req.body);
            await feeStructure.save();
        }
        console.log('Fee structure saved successfully:', feeStructure);
        res.json(feeStructure);
    } catch (error) {
        console.error('Error saving fee structure:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to save fee structure' });
    }
});

app.get('/api/termSettings', async (req, res) => {
    try {
        console.log('Fetching term settings from MongoDB...');
        const termSettings = await TermSettings.findOne().lean().exec();
        console.log('Term settings fetched:', termSettings);
        res.json(termSettings || { currentTerm: 'Term 1', currentYear: new Date().getFullYear() });
    } catch (error) {
        console.error('Error fetching term settings:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to fetch term settings' });
    }
});

app.post('/api/termSettings', async (req, res) => {
    try {
        console.log('Saving term settings:', req.body);
        let termSettings = await TermSettings.findOne();
        if (termSettings) {
            console.log('Updating existing term settings...');
            termSettings = await TermSettings.findOneAndUpdate({}, req.body, { new: true });
        } else {
            console.log('Creating new term settings...');
            termSettings = new TermSettings(req.body);
            await termSettings.save();
        }
        console.log('Term settings saved successfully:', termSettings);
        res.json(termSettings);
    } catch (error) {
        console.error('Error saving term settings:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to save term settings' });
    }
});

app.post('/api/newAcademicYear', async (req, res) => {
    try {
        console.log('Starting new academic year...');
        const termSettings = await TermSettings.findOne();
        if (!termSettings) {
            console.log('Term settings not found');
            return res.status(400).json({ error: 'Term settings not found' });
        }

        const currentYear = termSettings.currentYear;
        const learners = await Learner.find();

        console.log(`Archiving learners for year ${currentYear}...`);
        const archive = new LearnerArchive({
            year: currentYear,
            learners: learners
        });
        await archive.save();
        console.log('Learners archived successfully');

        const gradeOrder = ['Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
        for (let learner of learners) {
            const currentGradeIndex = gradeOrder.indexOf(learner.grade);
            if (currentGradeIndex < gradeOrder.length - 1) {
                learner.grade = gradeOrder[currentGradeIndex + 1];
                console.log(`Updating grade for learner ${learner.admissionNo} to ${learner.grade}`);
                await learner.save();
            } else {
                console.log(`Removing learner ${learner.admissionNo} (completed Grade 9)`);
                await Learner.findByIdAndDelete(learner._id);
            }
        }

        termSettings.currentYear = currentYear + 1;
        termSettings.currentTerm = 'Term 1';
        console.log('Updating term settings to:', termSettings);
        await termSettings.save();

        console.log('New academic year started successfully');
        res.sendStatus(200);
    } catch (error) {
        console.error('Error starting new academic year:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to start new academic year' });
    }
});

app.get('/api/learnerArchives/years', async (req, res) => {
    try {
        console.log('Fetching archived years from MongoDB...');
        const archives = await LearnerArchive.find({}, 'year').lean().exec();
        const years = archives.map(archive => archive.year);
        console.log(`Fetched archived years: ${years}`);
        res.json(years);
    } catch (error) {
        console.error('Error fetching archived years:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to fetch archived years' });
    }
});

app.get('/api/learnerArchives/:year', async (req, res) => {
    try {
        console.log(`Fetching archived learners for year ${req.params.year}...`);
        const archive = await LearnerArchive.findOne({ year: parseInt(req.params.year) }).lean().exec();
        if (!archive) {
            console.log(`Archive for year ${req.params.year} not found`);
            return res.status(404).json({ error: 'Archive not found' });
        }
        console.log(`Fetched archived learners for year ${req.params.year}`);
        res.json(archive.learners);
    } catch (error) {
        console.error('Error fetching archived learners:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to fetch archived learners' });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
