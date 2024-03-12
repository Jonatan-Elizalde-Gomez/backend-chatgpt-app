const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const openAIKey = ''; // Añadir API

app.post('/api/start-session', async (req, res) => {
    try {
        const assistantId = "asst_4EPiP8mdVW72eZm2aUhIse5d";
        const response = await axios.post('https://api.openai.com/v1/threads', {}, {
            headers: {
                'Authorization': `Bearer ${openAIKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v1'
            },
        });
        //console.log(response)
        const test = await axios.post(`https://api.openai.com/v1/threads/${response.data.id}/runs`, {
            assistant_id: assistantId
        }, {
            headers: {
                'Authorization': `Bearer ${openAIKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v1'
            },
        });
        // Retorna el ID del thread al frontend
        res.json({ threadId: response.data.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al iniciar la sesión" });
    }
});

app.post('/api/send-message', async (req, res) => {
    const { threadId, message } = req.body;
    //console.log(threadId)
    //console.log(message)

    try {
        // Envía el mensaje del usuario al thread
        await axios.post(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            role: "user",
            content: message
        }, {
            headers: {
                'Authorization': `Bearer ${openAIKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v1'
            },
        });
        
        // Crea una ejecución para procesar el mensaje
        const runResponse = await axios.post(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            assistant_id: "asst_4EPiP8mdVW72eZm2aUhIse5d"
        }, {
            headers: {
                'Authorization': `Bearer ${openAIKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v1'
            },
        });
        
        // Espera un momento antes de intentar recuperar los mensajes para dar tiempo al asistente a responder
            const messagesResponse = await axios.get(`https://api.openai.com/v1/threads/${threadId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${openAIKey}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v1'
                },
            });
            
            // Retorna todos los mensajes del thread, incluidas las respuestas del asistente
            res.json(messagesResponse.data);
        
    } catch (error) {
        res.status(500).json({ error: "Error al enviar el mensaje" });
    }
});


app.get('/api/get-messages/:threadId', async (req, res) => {
    const { threadId } = req.params;

    try {
        // Obtén la lista de ejecuciones (runs) para el thread especificado
        const runsResponse = await axios.get(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            headers: {
                'Authorization': `Bearer ${openAIKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v1'
            },
        });

        if (runsResponse.data.data.length === 0) {
            return res.status(404).json({ error: "No se encontraron ejecuciones para este thread" });
        }

        
        const lastRunId = runsResponse.data.data[runsResponse.data.data.length - 1].id;
        console.log("aki :", `https://api.openai.com/v1/threads/${threadId}/runs/${lastRunId}`)
        // Verifica el estado de la última ejecución
        const checkRunStatus = async () => {
            const runStatusResponse = await axios.get(`https://api.openai.com/v1/threads/${threadId}/runs/${lastRunId}`, {
                headers: {
                    'Authorization': `Bearer ${openAIKey}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v1'
                },
            });

            return runStatusResponse.data.status;
        };

        // Sondeo: Espera hasta que el estado de la ejecución sea 'completed' o 'failed'
        while (true) {
            const status = await checkRunStatus();
            if (status === 'completed') {
                break;
            } else if (status === 'failed') {
                const runErrorResponse = await axios.get(`https://api.openai.com/v1/threads/${threadId}/runs/${lastRunId}/errors`, {
                    headers: {
                        'Authorization': `Bearer ${openAIKey}`,
                        'Content-Type': 'application/json',
                        'OpenAI-Beta': 'assistants=v1'
                    },
                });
                return res.status(500).json({ error: "La ejecución falló", last_error: runErrorResponse.data });
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo antes de volver a verificar
        }

        // Una vez completada la ejecución, obtén los mensajes del thread
        const messagesResponse = await axios.get(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            headers: {
                'Authorization': `Bearer ${openAIKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v1'
            },
        });

        // Retorna todos los mensajes del thread, incluidas las respuestas del asistente
        res.json(messagesResponse.data);
    } catch (error) {

        console.error(error);
        res.status(500).json({ error: "Error al recuperar los mensajes" });
    }
});


 

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
