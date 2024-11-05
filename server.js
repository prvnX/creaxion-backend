require('dotenv').config();
const express=require('express');
const cors=require('cors');
const axios=require('axios');
const {Translate} = require('@google-cloud/translate').v2;

const app=express();
const port=process.env.PORT || 5001
const API_KEY=process.env.NVIDIA_API_KEY;
const Credentials = JSON.parse(process.env.CREDENTIALS);
const translateModel = new Translate({credentials: Credentials, projectId: Credentials.project_id});
app.use(cors());
app.use(express.json());

const translateToEnglish = async (text) => {
    try {
        const [response] = await translateModel.translate(text, 'en');
        return response;
    }
    catch (error) {
        console.error(error);
        return '';
    }
}

app.post("/generate-image-en",async (req,res)=>{
    const { textPrompts } = req.body;
    userPrompt=textPrompts[0].text;
    const options = {
        method: 'POST',
        url: 'https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: 'Bearer '+API_KEY
        },
        data: {
          height: 1024,
          width: 1024,
          text_prompts: [{text: userPrompt, weight: 1}],
          cfg_scale: 5,
          clip_guidance_preset: 'NONE',
          sampler: 'K_DPM_2_ANCESTRAL',
          samples: 1,
          seed: 0,
          steps: 25,
          style_preset: 'none'
        }
      };
      
      try {
        const response = await axios.request(options);
        const base64Image = response.data.artifacts[0].base64; // Extract base64 data
        res.json({ image: base64Image }); //send to the frontend
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
    });

    app.post("/generate-image-si",async (req,res)=>{
        const { textPrompts } = req.body;
        userPromptSi=textPrompts[0].text;
        try{
            const userPrompt = await translateToEnglish(userPromptSi); // Translate Sinhala prompt to English
            const options = {
                method: 'POST',
                url: 'https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl',
                headers: {
                  accept: 'application/json',
                  'content-type': 'application/json',
                  authorization: 'Bearer '+API_KEY
                },
                data: {
                  height: 1024,
                  width: 1024,
                  text_prompts: [{text: userPrompt, weight: 1}],
                  cfg_scale: 5,
                  clip_guidance_preset: 'NONE',
                  sampler: 'K_DPM_2_ANCESTRAL',
                  samples: 1,
                  seed: 0,
                  steps: 25,
                  style_preset: 'none'
                }
              };
              
              try {
                const response = await axios.request(options);
                const base64Image = response.data.artifacts[0].base64; // Extract base64 data
                res.json({ image: base64Image }); //send to the frontend
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to generate image' });
            }
            
        }
        catch(error){
            console.error(error);
            res.status(500).json({ error: 'Failed to translate prompt' });

        }
    });

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});