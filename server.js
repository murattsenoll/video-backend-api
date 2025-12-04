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
    
    const command = `yt-dlp --dump-json "${url}"`;
    
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            return res.status(400).json({ error: 'Video bulunamadı' });
        }
        
        try {
            const info = JSON.parse(stdout);
            res.json({
                id: info.id,
                title: info.title,
                thumbnail: info.thumbnail,
                duration: info.duration,
                url: info.url || info.formats[0].url
            });
        } catch (e) {
            res.status(500).json({ error: 'Video bilgisi alınamadı' });
        }
    });
});

// Video URL al (indirme için)
app.post('/api/download-url', (req, res) => {
    const { url } = req.body;
    
    const command = `yt-dlp -f "best[ext=mp4]" -g "${url}"`;
    
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            return res.status(400).json({ error: 'Video URL alınamadı' });
        }
        
        const videoUrl = stdout.trim();
        res.json({ videoUrl });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

