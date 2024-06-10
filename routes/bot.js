token=""
let rooms;
const axios =require("axios")
const router = require('express').Router();
const {main,report,reportAllRooms}=require('../controllers/gpt')
const {findRooms,outputstring,AvailableRoom,roomReport,roomReportTemp,AvailableRoomTemp,roomsReport}=require('../controllers/rooms')
const auth=require('../controllers/auth');
const { json } = require("express");


findRooms().then((r) => {
  console.log(r);
  rooms = r; // Assign the value to the global variable
}).catch((error) => {
  console.error("Error finding rooms:", error);
});


    router.route('/checkrooms').post(async function(req,res,next){
      console.log("checking room")
      // const finalOutput = rooms.value.map(person => `the name of the room is: ${person.name} and its mail is ${person.address}`).join(', ');
      text=main(finalOutput,req.body.text)
      console.log(finalOutput)
      res.json("").status(200).send();
    })
    router.route('/checkRoom')
    .post(async function(req, res, next) {
        try {
            console.log("post");
            console.log(req.body);
          
            // Assuming outputstring is a synchronous function
            const text = outputstring(rooms, req.body.user_input);

            // console.log(text);

            
            let gpttext = await main(text);

            console.log("text.......................");
            // console.log(gpttext);
            console.log("text.......................");

            if (gpttext) {
              console.log("gpt text befor",gpttext)
              gpttext= gpttext.replace(/'/g, '"');
              console.log("gpt text after",gpttext)
              // gpttext=  gpttext.replace(' ','')
                const jsonRegex = /{([^{}]*)}/;// Match everything between the outermost curly braces

                const match = gpttext.match(jsonRegex);

                if (match) {
                    const jsonString = match[0];
                    const jsonObject = JSON.parse(jsonString);

                    console.log(jsonObject);
                   let av= await AvailableRoom(jsonObject.address,req.body.date)
                   console.log(av)
                  //  console.log("length is ",av.value)
                    if(av.value.length==0){
                      res.json("yes it's available" ).status(200).send();
                      return
                    }
                    else{
                      console.log("REPORT ----------------------")
                      const reports=roomReport(jsonObject.chosenroom, av.value,req.body.datetime)
                      console.log(reports)
                      
                      const response=await report(reports)
                      console.log("REPORT ----------------------")
                      res.json(response).status(200).send();
                      return
                    }

                    res.json(JSON.stringify(jsonObject)).status(200).send();
                } else {
                    console.log("No JSON object found in the input string.");
                    //no JSON object found
                    res.json("oops there is something wrong").status(500).send();
                }
            } else {
                console.log("Unexpected response from main function.");
                //unexpected response
                res.json("oops there is something wrong").status(500).send();
            }
        } catch (error) {
            console.error("An error occurred:", error);
            //internal server error
            res.json("oops there is something wrong").status(500).send();
        }
    });



    
    router.route('/checkRoomTemp')
    .post(async function(req, res, next) {
      console.log("temp")
        try {
            console.log("post");
            console.log(req.body);

            // outputstring to prepare a prompt to retrieve json object of room name and address
            
            const text = outputstring(rooms, req.body.user_input);

            // console.log(text);

            
            let gpttext = await main(text);

            console.log("text.......................");
            // console.log(gpttext);
            console.log("text.......................");

            if (gpttext) {
              console.log("gpt text befor",gpttext)
              gpttext= gpttext.replace(/'/g, '"');
              console.log("gpt text after",gpttext)
              // gpttext=  gpttext.replace(' ','')
                const jsonRegex = /{([^{}]*)}/;// Match everything between the outermost curly braces

                const match = gpttext.match(jsonRegex);

                if (match) {
                    const jsonString = match[0];
                    const jsonObject = JSON.parse(jsonString);

                    console.log(jsonObject);
                   let av= await AvailableRoomTemp(jsonObject.address,req.body.begin)
                  //  console.log("length is ",av.value)
                    if(av.value.length==0){
                      res.json("yes it's available").status(200).send();
                      return
                    }
                    else{
                      console.log("REPORT ----------------------")
                      const reports=roomReportTemp(jsonObject.chosenroom, av.value,req.body.begin ,req.body.begintime,req.body.endtime)
                      console.log(reports)
                      
                      const response=await report(reports)
                      console.log("REPORT ----------------------")
                      res.json(response).status(200).send();
                      return
                    }

                    res.json(JSON.stringify(jsonObject)).status(200).send();
                } else {
                    console.log("No JSON object found in the input string.");
                    res.json("oops there is something wrong").status(500).send();
                }
            } else {
                console.log("Unexpected response from main function.");
                res.json("oops there is something wrong").status(500).send();
            }
        } catch (error) {
            console.error("An error occurred:", error);
            res.json("oops there is something wrong").status(500).send();
        }
    });






    
    router.route('/auth').post(async (req, res) => {
        console.log("auth");
        try {
          const tokenUrl = "https://login.microsoftonline.com/151a3694-1e2f-4a7f-bf26-102adc3fcc10/oauth2/token";
          const payload =  {'tenant_id': '151a3694-1e2f-4a7f-bf26-102adc3fcc10',
          'grant_type': 'client_credentials',
          'client_id': '829fbab7-29c9-409c-9e72-85e5158fba29',
          'client_secret': 'tLa8Q~GG_Xhx0IrQGC9qrftjwLHnwhgpBbDqvb0P',
          'scope': 'https://graph.microsoft.com/.default',
          'resource': 'https://graph.microsoft.com'};
      
          const response = await axios.post(tokenUrl, new URLSearchParams(payload), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });
          token=response.data.access_token
          console.log(token)
          res.json(response.data);
        } catch (error) {
          console.error('Error:', error.message);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      });

      router.route('/findrooms').get(async (req,res)=>{
        console.log("meeting rooms")

  
    const rooms = await findRooms();
    res.json(rooms);
  


      })
      router.route('/room').post(async (req,res)=>{
        console.log("meeting rooms")
            const url="https://graph.microsoft.com/beta/users/marwan.samrout@exquitech.com/findRooms";
            
            token= await auth()
            
            const response=await axios.get(url,{
                headers: {
                    'Authorization': token,
                  },
            })
            res.json(response.data)


      })
      
      router.route('/checkAllRooms2').post(async (req, res) => {
        console.log("checking all rooms ");
        console.log(req.body)
        let reports = `you are AI assistant that helps people to find if meetings rooms are available at a specific date.
        ----------------------------------------------
      based on this input:  ${req.body.user_input} which room is available ? ,here is a report about all the meetings in the rooms for the specified date:\n`;
    
        for (const e of rooms.value) {
            try {


                let av = await AvailableRoom(e.address, req.body.date);
    
                if (av.value.length === 0) {
                  reports+=` the ${e.name} doesnt have any meetings at the specified date.`
                    continue; // Skip to the next iteration
                } else {
                    let reporting = roomsReport(e.name, av.value, req.body.date);
                    reports += '\n' + reporting;
                }
            } catch (error) {
                console.error(`Error processing room ${e.name}: ${error.message}`);
            }
            reports+=`\n`
        }
        reports+=`--------------------------------------------
        please do a short report on which room is available at the specified date , if a room has 1 meeting list it in the report, and if the timezone is UTC convert the time to lebanon time (UTC+2) and if the timezone is Asia/Beirut dont convert the time,also write like you are talking to someone.`
       let gpt_resposne=await reportAllRooms(reports)
        console.log(reports);
        res.json(gpt_resposne);
        
    });


//this route is faster than /checkAllRooms2 to read the rooms array so the response time is reduced from(6.4 -5.5sec to 3.4sec -2.9sec)
    router.route('/checkAllRooms').post(async (req, res) => {
      console.log("checking all rooms ");
      console.log(req.body);
  
      let reports = `you are AI assistant that helps people to find if meeting rooms are available at a specific date.
      ----------------------------------------------
      based on this input: ${req.body.user_input} which room is available? Here is a report about all the meetings in the rooms for the specified date:\n`;
  
      const promises = rooms.value.map(async (e) => {
          try {
              let av = await AvailableRoom(e.address, req.body.date);
  
              if (av.value.length === 0) {
                  reports += ` the ${e.name} doesn't have any meetings at the specified date.`;
              } else {
                  let reporting = roomsReport(e.name, av.value, req.body.date);
                  reports += '\n' + reporting;
              }
          } catch (error) {
              console.error(`Error processing room ${e.name}: ${error.message}`);
          }
          reports += `\n`;
      });
  
      await Promise.all(promises);
  
      reports += `--------------------------------------------
      Please do a short report on which room is available at the specified date. If a room has 1 meeting, list it in the report. If the timezone is UTC, convert the time to Lebanon time (UTC+2), and if the timezone is Asia/Beirut, don't convert the time. Also, write as if you are talking to someone.`;
  
      let gpt_response = await reportAllRooms(reports);
      console.log(reports);
      res.json(gpt_response);
  });
    
      module.exports = router;