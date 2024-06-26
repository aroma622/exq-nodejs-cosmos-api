require('dotenv').config();
const fs = require('fs');
const {MongoClient, ObjectId} = require('mongodb');
const axios = require('axios');
const url = process.env.COSMOS_CONNECTION_STRING;
const dbname = process.env.COSMOS_DB_NAME;


// const { MongoClient } = require('mongodb');
// const axios = require('axios');

const mongoUri = process.env.COSMOS_CONNECTION_STRING;
const dbName = process.env.COSMOS_DB_NAME
const collectionName = 'questionsanswers';
const azureEndpoint = `${process.env.LANGUAGE_ENDPOINT}language/query-knowledgebases/projects/${process.env.LANGUAGE_PROJECT}/qnas?api-version=2021-10-01`;
const azureApiKey =  process.env.OCP_APIM_SUBSCRIPTION_KEY


async function fetchMongoData() {
    const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);
    const data = await collection.find().toArray();
    await client.close();
    return data;
}

function stringTo10DigitNumber(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) & 0xFFFFFFFF; // Simple hash function
    }
    return Math.abs(hash) % 10000000000; // Ensure the number is positive and fits within 10 digits
}

function createQnaPayload(data) {
    const departmentLookup = {};
    const qnaPayload = [];

    // Group questions by department
    data.forEach(doc => {
        const department = doc.department;
        if (!departmentLookup[department]) {
            departmentLookup[department] = [];
        }
        departmentLookup[department].push(doc);
    });


    // if(data.length>0){
    //     const firstDoc = data[0];
    //     const { question, answer, department, url } = firstDoc;
    //     const id = stringTo10DigitNumber(firstDoc._id.toString());
    //     const metadata = constructMetadata(department, url);
    //     const addQnaItem = {
    //         op: "add",
    //         value: {
    //             id: id,
    //             answer: answer,
    //             source: "customsource",
    //             questions: [question],
    //             metadata: metadata,
    //             dialog: {
    //                 isContextOnly: false,
    //                 prompts: []
    //             }
    //         }
    //     };
    //     qnaPayload.push(addQnaItem);

    // }
    // Create a QnA pair for each individual question

    function constructMetadata(department, url) {
        const metadata = { department: department };
        if (url) {
            metadata.url = url;
        }
        return metadata;
    }


    data.forEach((doc,index) => {
        const { question, answer, department } = doc;
        // const url = doc.url ? doc.url.replace(/^https:\/\//, '').replace(/\|/g, '') : "";
        const url = doc.url ? doc.url.toLowerCase().replace("https://ceerev.sharepoint.com/sites/", '').replace(/\|/g, '').split("/")[0] : "";
        const id = stringTo10DigitNumber(doc._id.toString());
        if(index==0){
            console.log("IDIDIDIIDIDIDID")
            console.log(id)
            console.log("IDIDIDIIDIDIDID")
        }
        const metadata = constructMetadata(department, url);
        const operation = index === 0 ? "add" : "replace";
        const qnaItem = {
            op: "replace",
            value: {
                id: id,
                answer: answer,
                source: "customsource",
                questions: [question],
                metadata: metadata,
                dialog: {
                    isContextOnly: false,
                    prompts: []
                }
            }
        };
        qnaPayload.push(qnaItem);
    });

    // Create a QnA pair for each department
    Object.keys(departmentLookup).forEach((department,index) => {
        const departmentQuestions = departmentLookup[department];
        const id = stringTo10DigitNumber(department);
        if(index==0){
            console.log("IDIDIDIIDID")
            console.log(id)
        }
        const prompts = departmentQuestions.map((d, index) => ({
            displayOrder: index + 1,
            qnaId: stringTo10DigitNumber(d._id.toString()),
            displayText: d.question
        }));

        const qnaItem = {
            op: "replace",
            value: {
                id: id,
                answer: `Questions related to ${department}`,
                source: "customsource",
                questions: [department],
                metadata: { department: department },
                dialog: {
                    isContextOnly: false,
                    prompts: prompts
                }
            }
        };
        qnaPayload.push(qnaItem);
    });

    return qnaPayload;
}

async function sendToAzure(qnaPayload) {
    try {
        const response = await axios.patch(azureEndpoint, qnaPayload, {
            headers: {
                'Ocp-Apim-Subscription-Key': azureApiKey,
                'Content-Type': 'application/json'
            }
        });
        console.log("//////////////")
        console.log(response.status)
        console.log('Data successfully sent to Azure:', response.data);
    } catch (error) {
        console.error('Error sending data to Azure:', error.response ? error.response.data : error.message);
    }
}

async function getqnaAzure() {
    try {
        const response = await axios.get(azureEndpoint, {
            headers: {
                'Ocp-Apim-Subscription-Key': azureApiKey,
                'Content-Type': 'application/json'
            }
        });
        console.log("Response received from Azure:", response.data);
        
        // Check if the 'value' property exists and has data
        const hasData = Array.isArray(response.data?.value) && response.data.value.length > 0;
        
        // Return 1 if there is data, otherwise return 0
        return hasData ? 1 : 0;
    } catch (error) {
        console.error('Error receiving data to Azure:', error.response ? error.response.data : error.message);
        return 0; // Return 0 in case of error
    }
}

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }


 exports.chatbotqaUpdateCustomSource = async function(req, res) {
    req.setTimeout(600000); // 10 minutes
    console.log("Source URI:", process.env.AZURE_FAQ_SOURCE_URI);
    
    const refreshData = [
        {
            "op": "delete",
            "value": {
                "displayName": "customsource",
                "sourceUri": "customsource",
                "sourceKind": "file",
                "source": "customsource"
            }
        }
    ];
    
    console.log(refreshData);
    const refreshUrl = `${process.env.LANGUAGE_ENDPOINT}language/query-knowledgebases/projects/${process.env.LANGUAGE_PROJECT}/sources?api-version=2021-10-01`;
    console.log(refreshUrl);

    try {
        const response = await axios({
            method: 'patch',
            url: refreshUrl,
            headers: {
                'Ocp-Apim-Subscription-Key': process.env.OCP_APIM_SUBSCRIPTION_KEY,
                'Content-Type': 'application/json'
            },
            data: refreshData
        });
        console.log('Refresh Request Succeeded');
    } catch (error) {
        console.error('Refresh Request Failed:', error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }

    console.log("Waiting before fetching data...");
    await delay(20000); // Delay in seconds
    console.log("Delay completed. Fetching data...");

    try {
        let data = await fetchMongoData();
        let qnaPayload = createQnaPayload(data);
        await sendToAzure(qnaPayload);
        await delay(5000)
        let hasData = await getqnaAzure();
        let counter = 10;

        while (hasData === 0 && counter > 0) {
            data = await fetchMongoData();
            qnaPayload = createQnaPayload(data);
            await sendToAzure(qnaPayload);
            console.log(`Retry attempts left: ${counter}`);
            hasData = await getqnaAzure();
            counter--;
            console.log("counter")
            console.log(counter)
            if (hasData === 0 && counter > 0) {
                await delay(5000); // 2 seconds delay
            }
        }

        if (hasData === 0) {
            console.error('Failed to send data to Azure after 5 attempts');
            return res.status(500).json({ message: "Failed to send data to Azure" });
        }

    } catch (error) {
        console.error('Error during data processing or sending to Azure:', error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }

    console.log("Waiting before final deployment...");
    await delay(10000);

    try {
        const response = await axios({
            method: 'put',
            url: `${process.env.LANGUAGE_ENDPOINT}language/query-knowledgebases/projects/${process.env.LANGUAGE_PROJECT}/deployments/production?api-version=2021-10-01`,
            headers: {
                'Ocp-Apim-Subscription-Key': process.env.OCP_APIM_SUBSCRIPTION_KEY,
                'Content-Type': 'application/json'
            },
        });
        console.log("Deployment Response Code:", response.status);
        // Check if deployment was successful
        if (response.status === 200 || response.status===202) {
            console.log("Deployment successful.");
            return res.status(200).json({ message: "Question and answer added and knowledge base deployed" });
        } else {
            console.error('Deployment failed:', response.statusText);
            return res.status(500).json({ message: "Deployment failed" });
        }
    } catch (error) {
        console.error('Error during deployment:', error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};




// ///////////////////////////////////////


exports.getqnabody = async function(req, res) {
    req.setTimeout(600000); // 10 minutes

    try {
        const data = await fetchMongoData();
        const qnaPayload = createQnaPayload(data);

        return res.status(200).json({ message: qnaPayload });
    } catch (error) {
        console.error('Error fetching QnA body:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};