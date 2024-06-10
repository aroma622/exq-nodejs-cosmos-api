const axios =require("axios")
async function auth(){
    try {
      // console.trace("Auth function is called");
        const tokenUrl = `https://login.microsoftonline.com/${process.env.tenant_id}/oauth2/token`;
        console.log(tokenUrl)
        const payload =  {'tenant_id': process.env.tenant_id,
        'grant_type': 'client_credentials',
        'client_id': process.env.client_id,
        'client_secret':process.env.client_secret,
        'scope': 'https://graph.microsoft.com/.default',
        'resource': 'https://graph.microsoft.com'};
    
        const response = await axios.post(tokenUrl, new URLSearchParams(payload), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        token=response.data.access_token
        console.log(token)
        return token
        
      } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
      }
  }

  module.exports=auth