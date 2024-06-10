// const { OpenAIClient } = require("@azure/openai");
// const { DefaultAzureCredential } = require("@azure/identity");

// async function main(prompt){
// //   const endpoint = "https://exquitech-openai-2.openai.azure.com/";
// //   const client = new OpenAIClient(endpoint, new DefaultAzureCredential());

// //   const { OpenAIClient, OpenAIKeyCredential } = require("@azure/openai");
//   const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
// // const client = new OpenAIClient(new OpenAIKeyCredential("0068929ae7a34b87b44ce8002fd3dece"));
// const client = new OpenAIClient("https://exquitech-openai-2.openai.azure.com/", new AzureKeyCredential("0068929ae7a34b87b44ce8002fd3dece"));

//   const deploymentId = "ex-turbo-instruct";
//   const deploymentName = "ex-turbo-instruct";
// prompt="explain deeply how cpu works and gpu and ram"
//   let promptIndex = 0;
//   const { choices } = await client.getCompletions(DeploymentName=deploymentName,Prompts= prompt,{MaxTokens:2000});
//   for (const choice of choices) {
//     const completion = choice.text;
//     // console.log(`Input: ${examplePrompts[promptIndex++]}`);
//     console.log(`Chatbot: ${completion}`);
//   }
//   return choices[0]
// }

// // main().catch((err) => {
// //   console.error("The sample encountered an error:", err);
// // });

/////////////////////////////////////////////////////////////////////



const { OpenAIClient ,AzureKeyCredential} = require("@azure/openai");


async function main_instruct(prompt){

  const client = new OpenAIClient(process.env.endpoint, new AzureKeyCredential(process.env.key));

  let textToSummarize2 = `you are a AI data extractor that help extracting room name and address.
  this is rooms array of objects [{"name":"Conference 11th floor","address":"Conference.11thfloor@exquitech.com"},{"name":"Developers Room","address":"developersroom@exquitech.com"},{"name":"DXB Meeting Room","address":"DXB.conference@exquitech.com"},{"name":"Managers room","address":"managersroom@exquitech.com"},{"name":"Meeting Booth","address":"Meeting.booth@exquitech.com"},{"name":"Phone Booth1","address":"Phone.Booth1@exquitech.com"},{"name":"Phone Booth2","address":"Phone.Booth2@exquitech.com"}] and this is input text is the conference room available tomorrow ?
   i want you to extract which room is in the input text want and output json object
   -------------------------------
   for example :
   input: i want to see if playing room is available
   array of rooms :[{name:room1 ,address:room1@mail.com},{name: play room ,address:play_room@mail.com}]
  output object should be : OUTPUT:{"chosenroom":"play room", "address":"play_room@mail.com"}
  and the output should be json object only and its name is OUTPUT
  --------------------------------
  i want consistent output only you should always output json object called OUTPUT
  N.B:only output json object, do not output code or text and always put quotes on chosenroom and adreess because i want to parse them later`;
  
  
  
  let textToSummarize = `you are a data extractor that help extracting room name and address.
  this is rooms array of objects [{"name":"Conference 11th floor","address":"Conference.11thfloor@exquitech.com"},{"name":"Developers Room","address":"developersroom@exquitech.com"},{"name":"DXB Meeting Room","address":"DXB.conference@exquitech.com"},{"name":"Managers room","address":"managersroom@exquitech.com"},{"name":"Meeting Booth","address":"Meeting.booth@exquitech.com"},{"name":"Phone Booth1","address":"Phone.Booth1@exquitech.com"},{"name":"Phone Booth2","address":"Phone.Booth2@exquitech.com"}] and this is input text is the conference room available tomorrow ?
   i want you to extract which room is in the input text want and output json object
   -------------------------------
   for example :
   input: i want to see if playing room is available
   array of rooms :[{name:room1 ,address:room1@mail.com},{name: play room ,address:play_room@mail.com}]
  output object should be : OUTPUT:{"chosenroom":"play room", "address":"play_room@mail.com"}
  and the output should be json object only and its name is OUTPUT
  --------------------------------
  -------------------------------
 for example :
 input: i want to see if playing room is available
 array of rooms :[{name:room1 ,address:room1@mail.com},{name: play room ,address:play_room@mail.com}]
output object should be : {chosenroom:play room, address:play_room@mail.com}
and the output should be json object only
--------------------------------`
  textToSummarize=prompt
  console.log(prompt)
 

  const deploymentName = "SDGPT";

  const { choices } = await client.getCompletions(deploymentName, textToSummarize, {
    maxTokens: 1000,
    // Temperature:0.2,
    Temperature:1,
    topP:0.5,
    frequencyPenalty:0,
    presencePenalty:0
    
  });
  const completion = choices[0].text;
  console.log(`Summarization: ${completion}`);
  return completion
}



async function main(prompt){

  const client = new OpenAIClient(process.env.endpoint, new AzureKeyCredential(process.env.key));

 
  
  
  let textToSummarize = ` `
  textToSummarize=prompt
  console.log(prompt)
 

  const deploymentName = "SDGPT";
  let messages=[{role:"user",content:prompt}]

  const { choices } = await client.getChatCompletions(deploymentName, messages, {
    maxTokens: 4000,
    Temperature:0.69,
    topP:0,
  });
  const completion = choices[0].message.content;
  console.log(`Summarization: ${completion}`);
  return completion
}



/////////////////////////////////////////////////////////////////


async function report_instruct(prompt){

  const client = new OpenAIClient(process.env.endpoint, new AzureKeyCredential(process.env.key));

  textToSummarize=prompt
 

  const deploymentName = "ex-turbo-instruct";

  const { choices } = await client.getCompletions(deploymentName, textToSummarize, {
    maxTokens: 4000,
    Temperature:0,
    topP:0,
  });
  const completion = choices[0].text;
  console.log(`Summarization: ${completion}`);
  return completion
}

async function report(prompt){
  console.log("single room")

  const client = new OpenAIClient(process.env.endpoint, new AzureKeyCredential(process.env.key));

  textToSummarize=prompt
 

  const deploymentName = "SDGPT";
  let messages=[{role:"user",content:prompt}]

  const { choices } = await client.getChatCompletions(deploymentName, messages, {
    maxTokens: 4000,
    Temperature:0.69,
    topP:0,
  });
  const completion = choices[0].message.content;
  console.log(`Summarization: ${completion}`);
  return completion
}

async function reportAllRooms_instruct(prompt){

  const client = new OpenAIClient(process.env.endpoint, new AzureKeyCredential(process.env.key));

  textToSummarize=prompt
 

  const deploymentName = "ex-turbo-instruct";

  const { choices } = await client.getCompletions(deploymentName, textToSummarize, {
    maxTokens: 4000,
    Temperature:0.69,
    topP:0,
  });
  const completion = choices[0].text;
  console.log(`Summarization: ${completion}`);
  return completion
}




async function reportAllRooms(prompt){

  const client = new OpenAIClient(process.env.endpoint, new AzureKeyCredential(process.env.key));

  textToSummarize=prompt
 

  const deploymentName = "SDGPT";
  let messages=[{role:"user",content:prompt}]

  const { choices } = await client.getChatCompletions(deploymentName, messages, {
    maxTokens: 4000,
    Temperature:0.69,
    topP:0,
  });
  const completion = choices[0].message.content;
  console.log(`Summarization: ${completion}`);
  return completion
}












module.exports={main,report,reportAllRooms}