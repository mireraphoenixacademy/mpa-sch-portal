require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // This line requires the cors package
const twilio = require('twilio');
const path = require('path');

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/school_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Twilio Client Setup
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

// In-memory store for opted-out numbers (replace with a database in production)
const optedOutNumbers = new Set();

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
    const learners = await Learner.find();
    res.json(learners);
});

app.post('/api/learners', async (req, res) => {
    const learner = new Learner(req.body);
    await learner.save();
    res.json(learner);
});

app.put('/api/learners/:id', async (req, res) => {
    const learner = await Learner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(learner);
});

app.delete('/api/learners/:id', async (req, res) => {
    await Learner.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
});

app.get('/api/fees', async (req, res) => {
    const fees = await Fee.find();
    res.json(fees);
});

app.post('/api/fees', async (req, res) => {
    const fee = new Fee(req.body);
    await fee.save();
    res.json(fee);
});

app.put('/api/fees/:id', async (req, res) => {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(fee);
});

app.delete('/api/fees/:id', async (req, res) => {
    await Fee.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
});

app.get('/api/books', async (req, res) => {
    const books = await Book.find();
    res.json(books);
});

app.post('/api/books', async (req, res) => {
    const book = new Book(req.body);
    await book.save();
    res.json(book);
});

app.put('/api/books/:id', async (req, res) => {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(book);
});

app.delete('/api/books/:id', async (req, res) => {
    await Book.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
});

app.get('/api/classBooks', async (req, res) => {
    const classBooks = await ClassBook.find();
    res.json(classBooks);
});

app.post('/api/classBooks', async (req, res) => {
    const classBook = new ClassBook(req.body);
    await classBook.save();
    res.json(classBook);
});

app.put('/api/classBooks/:id', async (req, res) => {
    const classBook = await ClassBook.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(classBook);
});

app.delete('/api/classBooks/:id', async (req, res) => {
    await ClassBook.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
});

app.get('/api/feeStructure', async (req, res) => {
    const feeStructure = await FeeStructure.findOne();
    res.json(feeStructure || {});
});

app.post('/api/feeStructure', async (req, res) => {
    await FeeStructure.deleteMany();
    const feeStructure = new FeeStructure(req.body);
    await feeStructure.save();
    res.json(feeStructure);
});

app.get('/api/termSettings', async (req, res) => {
    const settings = await TermSettings.findOne();
    res.json(settings || { currentTerm: 'Term 1', currentYear: new Date().getFullYear() });
});

app.post('/api/termSettings', async (req, res) => {
    await TermSettings.deleteMany();
    const settings = new TermSettings(req.body);
    await settings.save();
    res.json(settings);
});

app.get('/api/learnerArchives/years', async (req, res) => {
    const archives = await LearnerArchive.find();
    const years = archives.map(archive => archive.year);
    res.json(years);
});

app.get('/api/learnerArchives/:year', async (req, res) => {
    const archive = await LearnerArchive.findOne({ year: parseInt(req.params.year) });
    res.json(archive ? archive.learners : []);
});

app.post('/api/newAcademicYear', async (req, res) => {
    const currentSettings = await TermSettings.findOne();
    const currentYear = currentSettings.currentYear;
    const learners = await Learner.find();

    const archive = new LearnerArchive({
        year: currentYear,
        learners
    });
    await archive.save();

    const gradeMap = {
        'Playgroup': 'PP1',
        'PP1': 'PP2',
        'PP2': 'Grade 1',
        'Grade 1': 'Grade 2',
        'Grade 2': 'Grade 3',
        'Grade 3': 'Grade 4',
        'Grade 4': 'Grade 5',
        'Grade 5': 'Grade 6',
        'Grade 6': 'Grade 7',
        'Grade 7': 'Grade 8',
        'Grade 8': 'Grade 9',
        'Grade 9': null
    };

    for (let learner of learners) {
        const newGrade = gradeMap[learner.grade];
        if (newGrade) {
            learner.grade = newGrade;
            await learner.save();
        } else {
            await Learner.findByIdAndDelete(learner._id);
        }
    }

    await TermSettings.updateOne({}, { currentYear: currentYear + 1, currentTerm: 'Term 1' }, { upsert: true });
    res.sendStatus(200);
});

// Twilio Notification Endpoint
app.post('/api/sendNotification', async (req, res) => {
    const { phone, message } = req.body;

    try {
        const twilioMessage = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
        });
        res.json({ success: true, sid: twilioMessage.sid });
    } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Opt-Out Check Endpoint
app.post('/api/checkOptOut', async (req, res) => {
    const { phone } = req.body;
    res.json(optedOutNumbers.has(phone));
});

// Opt-Out Endpoint
app.post('/api/optOut', async (req, res) => {
    const { phone } = req.body;
    optedOutNumbers.add(phone);
    res.json({ success: true, message: 'You have opted out of SMS notifications.' });
});

// Serve Static Files
app.use(express.static('public'));

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});