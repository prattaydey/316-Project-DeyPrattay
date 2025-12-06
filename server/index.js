// THESE ARE NODE APIs WE WISH TO USE
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')

// CREATE OUR SERVER
dotenv.config()
const PORT = process.env.PORT || 4000;
const DB_VENDOR = process.env.DB_VENDOR || 'mongodb'; // 'mongo' or 'postgres'
const app = express()

// SETUP THE MIDDLEWARE
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: ["http://localhost:3000"],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

// SETUP OUR OWN ROUTERS AS MIDDLEWARE
const authRouter = require('./routes/auth-router')
app.use('/auth', authRouter)
const storeRouter = require('./routes/store-router')
app.use('/store', storeRouter)
const songRouter = require('./routes/song-router')
app.use('/songs', songRouter)

// pick the db implementation
async function initDb() {
    let DBImpl;
    if (DB_VENDOR === 'postgres') {
        DBImpl = require('./db/postgresql');
    } else {
        DBImpl = require('./db/mongodb');
    }
    const db = new DBImpl();
    await db.init();
    app.locals.db = db;
    console.log(`DB initialized with vendor=${DB_VENDOR}`);
}
initDb().catch(err => {
    console.error('DB init failed:', err);
    process.exit(1);
});

// PUT THE SERVER IN LISTENING MODE
app.listen(PORT, () => console.log(`Playlister Server running on port ${PORT}`))


