const { reglamento } = require("./archivo/reglamento");
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const openAIKey = 'api_key'; // Api de OpenAi

app.post('/api/completions', async (req, res) => {
    try {
        // Prepara el prompt con el contenido de la pregunta del usuario
        const prompt = `${req.body.prompt}`;

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            "messages":[
              {"role": "system", "content": reglamento},
              {"role": "user", "content": prompt}
            ],
              "temperature": 0.7,
              "max_tokens": 150,
              "model": "gpt-3.5-turbo"
          }, {
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

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));