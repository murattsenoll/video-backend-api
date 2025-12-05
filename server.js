const express = require('express');
const https = require('https');
const app = express();

app.use(express.json());

// CORS ayarları
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Apify API Token - Environment variable'dan alınıyor
const APIFY_TOKEN = process.env.APIFY_TOKEN;

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Backend with Apify is working!',
        tokenPresent: !!APIFY_TOKEN
    });
});

// Video bilgisi al
app.post('/api/video-info', (req, res) => {
    const { url } = req.body;
    
    console.log('Fetching video info for:', url);
    
    // Apify Actor'ü çalıştır
    const actorInput = JSON.stringify({
        videos: [{ url: url }],
        preferredQuality: '720p',
        preferredFormat: 'mp4'
    });
    
    const options = {
        hostname: 'api.apify.com',
        path: `/v2/acts/streamers~youtube-video-downloader/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': actorInput.length
        }
    };
    
    const apifyReq = https.request(options, (apifyRes) => {
        let data = '';
        
        apifyRes.on('data', (chunk) => {
            data += chunk;
        });
        
        apifyRes.on('end', () => {
            try {
                const results = JSON.parse(data);
                if (results && results.length > 0) {
                    const video = results[0];
                    console.log('Video info fetched from Apify:', video.title);
                    res.json({
                        id: video.id || 'unknown',
                        title: video.title || 'YouTube Video',
                        thumbnail: video.thumbnail || '',
                        duration: video.duration || 0,
                        url: video.downloadUrl || ''
                    });
                } else {
                    res.status(400).json({ error: 'Video bulunamadı' });
                }
            } catch (e) {
                console.error('Apify parse error:', e.message);
                res.status(500).json({ error: 'Video bilgisi alınamadı' });
            }
        });
    });
    
    apifyReq.on('error', (e) => {
        console.error('Apify request error:', e.message);
        res.status(500).json({ error: 'Apify bağlantı hatası' });
    });
    
    apifyReq.write(actorInput);
    apifyReq.end();
});

// Video URL al (indirme için) - Apify ile
app.post('/api/download-url', (req, res) => {
    const { url } = req.body;
    
    console.log('Getting download URL from Apify for:', url);
    
    // Apify Actor'ü çalıştır
    const actorInput = JSON.stringify({
        videos: [{ url: url }],
        preferredQuality: '720p',
        preferredFormat: 'mp4'
    });
    
    const options = {
        hostname: 'api.apify.com',
        path: `/v2/acts/streamers~youtube-video-downloader/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': actorInput.length
        }
    };
    
    const apifyReq = https.request(options, (apifyRes) => {
        let data = '';
        
        apifyRes.on('data', (chunk) => {
            data += chunk;
        });
        
        apifyRes.on('end', () => {
            try {
                console.log('Apify RAW Response:', data.substring(0, 500));
                const results = JSON.parse(data);
                console.log('Apify Parsed Results:', JSON.stringify(results, null, 2));
                
                if (results && results.length > 0) {
                    const video = results[0];
                    console.log('First video object keys:', Object.keys(video));
                    
                    // Farklı olası alan adlarını dene
                    const videoUrl = video.downloadUrl || video.url || video.videoUrl || video.download_url;
                    
                    if (videoUrl) {
                        console.log('Video URL from Apify:', videoUrl.substring(0, 100) + '...');
                        res.json({ videoUrl });
                    } else {
                        console.log('No download URL found in result, returning demo');
                        console.log('Available fields:', Object.keys(video));
                        res.json({ 
                            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                        });
                    }
                } else {
                    console.log('Empty results from Apify, returning demo');
                    res.json({ 
                        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                    });
                }
            } catch (e) {
                console.error('Apify parse error:', e.message);
                console.error('Raw data:', data.substring(0, 200));
                res.json({ 
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                });
            }
        });
    });
    
    apifyReq.on('error', (e) => {
        console.error('Apify request error:', e.message);
        res.json({ 
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        });
    });
    
    apifyReq.write(actorInput);
    apifyReq.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

