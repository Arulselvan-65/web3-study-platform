require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const {Groq} =  require("groq-sdk");


const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/web3data', async (req, res) => {
    
    try{
      const { query } = req.body;
      const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });
    res.json(response);

    } catch (error) {
        console.log(error);
        res.status(error.response?.status || 500).json({ 
            error: error.response?.data || 'Internal Server Error' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});