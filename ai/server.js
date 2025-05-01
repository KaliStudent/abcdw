// server.js
const express = require('express');
const cors = require('cors');
const shortid = require('shortid'); // For generating unique IDs
const { isURL } = require('validator'); // For URL validation
const mongoose = require('mongoose'); // For MongoDB connection
const app = express();
const port = process.env.PORT || 5000;

// Custom domain configuration
const BASE_DOMAIN = 'https://ai.abcw.xyz/';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/linkshortener', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Create the URL shortening endpoint
app.post('/api/shorten', async (req, res) => {
  try {
    const { originalUrl } = req.body;
    const userId = req.user ? req.user.id : null; // If using authentication

    // Validate URL
    if (!originalUrl || !isURL(originalUrl)) {
      return res.status(400).json({ error: 'Please provide a valid URL' });
    }

    // Check if URL already exists in database
    let url = await Url.findOne({ originalUrl });
    
    if (url) {
      // Return existing short URL if found
      return res.json({ shortUrl: `${BASE_DOMAIN}${url.urlCode}` });
    }
    
    // Generate a new short code
    const urlCode = shortid.generate();
    
    // Create new URL record
    url = new Url({
      originalUrl,
      urlCode,
      shortUrl: `${BASE_DOMAIN}${urlCode}`,
      userId,
      createdAt: new Date()
    });
    
    await url.save();
    
    // Return the shortened URL
    return res.json({ 
      shortUrl: `${BASE_DOMAIN}${urlCode}`,
      originalUrl: url.originalUrl,
      id: url._id
    });
  } catch (err) {
    console.error('Error shortening URL:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Redirect endpoint
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    // Find the URL in the database
    const url = await Url.findOne({ urlCode: code });
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    // Update click count
    url.clicks += 1;
    await url.save();
    
    // Redirect to the original URL
    return res.redirect(url.originalUrl);
  } catch (err) {
    console.error('Error redirecting:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Analytics API endpoint
app.get('/api/analytics/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    // Find the URL in the database
    const url = await Url.findOne({ urlCode: code });
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    // Get click data (would be more extensive in a real app)
    const clickData = {
      totalClicks: url.clicks,
      createdAt: url.createdAt,
      lastAccessed: url.updatedAt || url.createdAt
    };
    
    return res.json({ 
      shortUrl: `${BASE_DOMAIN}${url.urlCode}`,
      originalUrl: url.originalUrl,
      analytics: clickData
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// models/Url.js
const mongoose = require('mongoose');

const UrlSchema = new mongoose.Schema({
  urlCode: {
    type: String,
    required: true,
    unique: true,
  },
  originalUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  }
}, { timestamps: true });

const Url = mongoose.model('Url', UrlSchema);