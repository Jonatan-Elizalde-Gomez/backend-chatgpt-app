const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// Habilita CORS para todas las solicitudes
app.use(cors());

app.use(express.json());

const openAIKey = 'api_key'; // Reemplaza esto con tu clave de API de OpenAI real

app.post('/api/completions', async (req, res) => {
    try {
        const response = await axios.post('https://api.openai.com/v1/completions', req.body, {
            headers: {
                'Authorization': `Bearer ${openAIKey}`,
                'Content-Type': 'application/json',
            },
        });
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al procesar la solicitud" });
    }
});

const PORT = 5000; // Puedes elegir el puerto que prefieras
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));