require('dotenv').config();
const fs = require('fs');
const {MongoClient, ObjectId} = require('mongodb');
const axios = require('axios');
const url = process.env.COSMOS_CONNECTION_STRING;
const dbname = process.env.COSMOS_DB_NAME;

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }

 exports.chatbotqaAdd = async function(req, res, next) {
    const client = new MongoClient(url);
    try {
        // Get the question, answer, and department from the request body
        const question = req.body.question;
        const answer = req.body.answer;
        const department = req.body.department;
        const category = req.body.category;
        const url = req.body.url;

        // Access the required database and collection
        const db = client.db(dbname);
        const collection = db.collection("questionsanswers");

        // Insert the new document
        const result = await collection.insertOne({
            question: question,
            answer: answer,
            department: department,
            category: category,
            url:url,
        });
      res.status(200).json({ message: "Question and answer added successfully." ,id:result.insertedId});
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message });
    } finally {
      // Close the database connection
      await client.close();
  }
}
exports.chatbotqaDelete = async (req, res) => { 
    const client = new MongoClient(url);
    try {
        // Extract ID from request body
        const id = req.params.id;
        if (!id) {
            res.status(400).json({ message: "ID is required" });
            return;
        }
        console.log(id);
        // Connect to the database
        await client.connect();
        // Access the required database and collection
        const db = client.db(dbname);
        const collection = db.collection("questionsanswers");
        // Delete the document with the specified ID
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        // Check if a document was actually deleted
        if (result.deletedCount === 1) {
            res.json({ success: true, message: 'Document successfully deleted!' });
        } else {
            res.json({ success: false, message: 'No document found with the provided ID.' });
        }
    } catch (err) {
      console.log(err);
      res.json({ success: false });
    } finally {
      // Close the database connection
      await client.close();
    }
 }

exports.chatbotqaUpdateSource = async function(req, res) {
  req.setTimeout(600000); // 10 minutes
  console.log("Source URI:", process.env.AZURE_FAQ_SOURCE_URI);
  const refreshData = [
        {
            "op": "replace",
            "value": {
                "displayName": process.env.AZURE_FAQ_SOURCE_NAME,
                "sourceKind": "url",
                "sourceUri": process.env.AZURE_FAQ_SOURCE_URI,
                "source": process.env.AZURE_FAQ_SOURCE_URI,
                "refresh": "true"
            }
        }
    ];
    console.log(refreshData);
    let refreshUrl = `${process.env.LANGUAGE_ENDPOINT}language/query-knowledgebases/projects/${process.env.LANGUAGE_PROJECT}/sources?api-version=2021-10-01`;
    console.log(refreshUrl);
    await axios({
        method: 'patch',
        url: refreshUrl,
        headers: {
            'Ocp-Apim-Subscription-Key': process.env.OCP_APIM_SUBSCRIPTION_KEY,
            'Content-Type': 'application/json'
        },
        data: refreshData
    }).then(response => {
        console.log('Response Code:', response.status);
        console.log('Response Data:', response);
        console.log('Request Succeeded');
    })
    .catch(error => {
        if (error.response) {
            console.log('Response Code:', error.response.status);
        }
        console.log(error.message)
        console.log('Request Failed');
        return res.status(500).json({ message: "Internal Server Error" });
    });
    // Update the knowledge base
    await delay(3000); // Delay in seconds
    // If soruce url refresh succeeded, then deploy
    try {
        let response = await axios({
            method: 'put',
            url: `${process.env.LANGUAGE_ENDPOINT}language/query-knowledgebases/projects/${process.env.LANGUAGE_PROJECT}/deployments/production?api-version=2021-10-01`,
            headers: {
                'Ocp-Apim-Subscription-Key': process.env.OCP_APIM_SUBSCRIPTION_KEY,
                'Content-Type': 'application/json'
            },
        });
        return res.status(200).json({ message: "Question and answer added and knowledge base deployed" });
    }catch (error) {    
        console.log(error.message)
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


exports.getQNA = async function(req, res) {
    const client = new MongoClient(url);
    try {
        await client.connect();
        const db = client.db(dbname);
        const collection = db.collection('questionsanswers');

        // Fetch unique values for department and category
        const uniqueDepartments = await collection.distinct('department');
        const uniqueCategories = await collection.distinct('category');

        // Fetch all questions
        const questions = await collection.find().toArray();

        // Prepare the response
        const response = {
            questions: questions.map(doc => {
                return {
                    id: doc._id,
                    question: doc.question,
                    answer: doc.answer,
                    department: doc.department,
                    category: doc.category,
                    url:doc.url || ''
                }
            }),
            departments: uniqueDepartments,
            categories: uniqueCategories,
        };

        res.json(response);
    } catch (err) {
        console.log(err.stack);
        res.status(500).json("Internal Server Error");
    } finally {
        await client.close();
    }
}
exports.getUniqueDepartmetns= async function(req,res){
    const client = new MongoClient(url);
    try {
        await client.connect();
        const db = client.db(dbname);
        const collection = db.collection('questionsanswers');

        // Fetch unique values for department and category
        const uniqueDepartments = await collection.distinct('department');
        res.json(uniqueDepartments)
    }catch(err){
        console.log(err,stack);
        res.status(500).json("Internal Server Error")
    }finally{
        await client.close()
    }
}
exports.updateDepartmentUrl = async function(req, res) {
    const client = new MongoClient(url);
    const { department, url: newUrl } = req.body;

    try {
        await client.connect();
        const db = client.db(dbname);
        const collection = db.collection('questionsanswers');

        const result = await collection.updateMany({ department: department }, { $set: { url: newUrl } });
        res.json({ message: 'URL updated successfully', matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json("Internal Server Error");
    } finally {
        await client.close();
    }
}

 exports.initMongoDbQNAdeprecated = async function(req, res) {
    const client = new MongoClient(url);
    try {
        await client.connect();
        console.log("Connected correctly to server")
        const db = client.db(dbname);
        console.log(`Connected correctly to database ${db.databaseName}`)
        const collection = db.collection('questionsanswers');
        console.log(`Connected correctly to collection ${collection.collectionName}`);
        const documents = JSON.parse(fs.readFileSync('./data/kb_init.json', 'utf8'));
        await collection.insertMany(documents);
        console.log("Inserted documents into the collection");

       




        const questions = await collection.find().toArray();
        res.json(questions);
    } catch (err) {
        console.log(err.stack);
        res.status(500).json("Internal Server Error");
    } finally {
        await client.close();
    }
 }




 exports.initMongoDbQNA = async function(req, res) {
    const client = new MongoClient(url);
    try {
        await client.connect();
        console.log("Connected correctly to server")
        const db = client.db(dbname);
        console.log(`Connected correctly to database ${db.databaseName}`)
        const collectionName = 'questionsanswers';
        const collection = db.collection(collectionName);
        const collectionExists = await db.listCollections({ name: collectionName }).hasNext();
        if (collectionExists) {
            await collection.drop();
            console.log(`Dropped collection ${collectionName}`);
        }
        console.log(`Connected correctly to collection ${collection.collectionName}`);
        
        const documents = JSON.parse(fs.readFileSync('./data/kb_init.json', 'utf8'));
        await collection.insertMany(documents);
        console.log("Inserted documents into the collection");

        const questions = await collection.find().toArray();
        res.json(questions);
    } catch (err) {
        console.log(err.stack);
        res.status(500).json("Internal Server Error");
    } finally {
        await client.close();
    }
}

 exports.getQnAHtml = async function(req, res) {
    req.setTimeout(600000); // 10 minutes
    const client = new MongoClient(url);
    try {
        await client.connect();
        const db = client.db(dbname);
        const collection = db.collection('questionsanswers');
        const questions = await collection.find().toArray();
        // Generate HTML
        let html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Q&A</title></head><body>';

        // Sort by department and category
        const sortedByDepartment = questions.reduce((acc, curr) => {
            const department = acc.find(dep => dep.name === curr.department);
            if (department) {
                const category = department.categories.find(cat => cat.name === curr.category);
                if (category) {
                    category.questions.push(curr);
                } else {
                    department.categories.push({
                        name: curr.category,
                        questions: [curr]
                    });
                }
            } else {
                acc.push({
                    name: curr.department,
                    categories: [{
                        name: curr.category,
                        questions: [curr]
                    }]
                });
            }
            return acc;
        }, []);

        // Append to HTML
        sortedByDepartment.forEach(dep => {
            //html += `<h1>${dep.name}</h1>`;
            dep.categories.forEach(cat => {
                html += `<h1>${dep.name} - ${cat.name}</h1>`;
                cat.questions.forEach(q => {
                    html += `<h3>${q.question}</h3><p>${q.answer}</p>`;
                });
            });
        });

        html += '</body></html>';
        // Send HTML response
        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.log(err.stack);
        res.status(500).json("Internal Server Error");
    } finally {
        await client.close();
    }
 };

 exports.chatbotqaUpdate = async (req, res) => {
    const client = new MongoClient(url);
    try {
        const { id, question, answer, department, category,url } = req.body;
        if (!id) {
            res.status(400).json({ success: false, message: 'ID is required' });
            return;
        }
        await client.connect();
        const db = client.db(dbname);
        const collection = db.collection('questionsanswers');

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    question,
                    answer,
                    department,
                    category,
                    url
                }
            }
        );

        if (result.matchedCount === 1) {
            res.json({ success: true, message: 'Document successfully updated!' });
        } else {
            res.json({ success: false, message: 'No document found with the provided ID.' });
        }
    } catch (err) {
        console.log(err);
        res.json({ success: false });
    } finally {
        await client.close();
    }
};



exports.chatbotqaAddunaswered = async function(req, res, next) {
    const client = new MongoClient(url);
    try {
        // Get the question, answer, and department from the request body
        const question = req.body.question;
        const datetime = new Date();
        const score = req.body.score;

        // Access the required database and collection
        const db = client.db(dbname);
        const collection = db.collection("unansweredquestions");

        // Insert the new document
        const result = await collection.insertOne({
            question: question,
            datetime: datetime,
            score: score,
            
        });
      res.status(200).json({ message: " unanswered Question added successfully." ,id:result.insertedId});
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message });
    } finally {
      // Close the database connection
      await client.close();
  }
}


exports.getUNQNA = async function(req, res) {
    const client = new MongoClient(url);
    try {
        await client.connect();
        const db = client.db(dbname);
        const collection = db.collection('unansweredquestions');

  

        // Fetch all questions
        const questions = await collection.find().toArray();

        // Prepare the response
        const response = {
            questions: questions.map(doc => {
                return {
                    id: doc._id,
                    question: doc.question,
                    score:doc.score,
                    datetime:doc.datetime
                }
            }),
          
        };

        res.json(response);
    } catch (err) {
        console.log(err.stack);
        res.status(500).json("Internal Server Error");
    } finally {
        await client.close();
    }
}


        // const unansweredCollection = db.collection('unansweredquestions');
        // console.log(`Connected correctly to collection ${unansweredCollection.collectionName}`);
        // const existingUnansweredCollectionCount = await unansweredCollection.countDocuments();
        // if (existingUnansweredCollectionCount === 0) {
        //     console.log("Creating 'unansweredquestions' collection");
        //     await unansweredCollection.createIndex({ question: 1 }, { unique: true });
        // }


        exports.initMongoDbUNQNA = async function(req, res) {
            const client = new MongoClient(url);
            try {
                await client.connect();
                console.log("Connected correctly to server")
                const db = client.db(dbname);
                console.log(`Connected correctly to database ${db.databaseName}`)
                const unansweredCollection = db.collection('unansweredquestions');
                console.log(`Connected correctly to collection ${unansweredCollection.collectionName}`);
                const existingUnansweredCollectionCount = await unansweredCollection.countDocuments();
                if (existingUnansweredCollectionCount === 0) {
                    console.log("Creating 'unansweredquestions' collection");
                    await unansweredCollection.createIndex({ question: 1 }, { unique: true });
                }
        
               
        
        
        
        
                
                res.json("MongoDB has been successfully initialized unanswered questions");
            } catch (err) {
                console.log(err.stack);
                res.status(500).json("Internal Server Error");
            } finally {
                await client.close();
            }
         }



         exports.chatbotunqaDelete = async (req, res) => { 
            const client = new MongoClient(url);
            try {
                // Extract ID from request body
                const id = req.params.id;
                if (!id) {
                    res.status(400).json({ message: "ID is required" });
                    return;
                }
                console.log(id);
                // Connect to the database
                await client.connect();
                // Access the required database and collection
                const db = client.db(dbname);
                const collection = db.collection("unansweredquestions");
                // Delete the document with the specified ID
                const result = await collection.deleteOne({ _id: new ObjectId(id) });
                // Check if a document was actually deleted
                if (result.deletedCount === 1) {
                    res.json({ success: true, message: 'Document successfully deleted!' });
                } else {
                    res.json({ success: false, message: 'No document found with the provided ID.' });
                }
            } catch (err) {
              console.log(err);
              res.json({ success: false });
            } finally {
              // Close the database connection
              await client.close();
            }
         }