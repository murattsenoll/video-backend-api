const express = require('express');
const { exec } = require('child_process');
const app = express();

app.use(express.json());

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

