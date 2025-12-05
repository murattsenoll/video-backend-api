const express = require('express');
const { exec } = require('child_process');
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

// Test endpoint
app.get('/api/test', (req, res) => {
    exec('yt-dlp --version', (error, stdout, stderr) => {
        if (error) {
            return res.json({ 
                status: 'error', 
                message: 'yt-dlp not installed',
                error: error.message 
            });
        }
        res.json({ 
            status: 'ok', 
            ytdlpVersion: stdout.trim(),
            message: 'Backend is working!'
        });
    });
});

// Video bilgisi al
app.post('/api/video-info', (req, res) => {
    const { url } = req.body;
    
    console.log('Fetching video info for:', url);
    
    const command = `yt-dlp --dump-json --no-warnings "${url}"`;
    
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            console.error('yt-dlp error:', stderr || error.message);
            return res.status(400).json({ 
                error: 'Video bulunamadı',
                details: stderr || error.message
            });
        }
        
        try {
            const info = JSON.parse(stdout);
            console.log('Video info fetched:', info.title);
            res.json({
                id: info.id,
                title: info.title,
                thumbnail: info.thumbnail,
                duration: info.duration,
                url: info.url || (info.formats && info.formats[0] && info.formats[0].url)
            });
        } catch (e) {
            console.error('JSON parse error:', e.message);
            res.status(500).json({ error: 'Video bilgisi alınamadı' });
        }
    });
});

// Video URL al (indirme için)
app.post('/api/download-url', (req, res) => {
    const { url } = req.body;
    
    console.log('Getting download URL for:', url);
    
    // YouTube bot korumasını aşmak için ek parametreler
    const command = `yt-dlp --no-check-certificate --user-agent "Mozilla/5.0" --get-url "${url}"`;
    
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            console.error('yt-dlp error:', stderr || error.message);
            // Fallback: Demo video URL döndür
            console.log('Returning demo video as fallback');
            return res.json({ 
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            });
        }
        
        const videoUrl = stdout.trim().split('\n')[0]; // İlk URL'i al
        console.log('Video URL found:', videoUrl.substring(0, 100) + '...');
        res.json({ videoUrl });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

