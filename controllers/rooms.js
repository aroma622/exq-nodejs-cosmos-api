const axios =require("axios")
const auth=require("./auth")
async function findRooms(){
    const url="https://graph.microsoft.com/beta/users/marwan.samrout@exquitech.com/findRooms";
            
            token= await auth()
            console.log("roooms")
            const response=await axios.get(url,{
                headers: {
                    'Authorization': token,
                  },
            })
            return response.data
}



async function AvailableRoom(mail,date){

// console.log("available")
// console.log(mail)
// console.log(date)
const originalDate = new Date(date);
const nextDay = new Date(originalDate);
nextDay.setDate(originalDate.getDate() + 1);

const nextdate=nextDay.toISOString().split('T')[0];

let url=`https://graph.microsoft.com/v1.0/users/${mail}/calendar/events?filter=start/dateTime ge '${date}'and start/dateTime lt '${nextdate}'`
console.log(url)
token= await auth()
            
            const response=await axios.get(url,{
                headers: {
                    'Authorization': token,
                    'Prefer':'outlook.timezone="Asia/Beirut"'
                  },
            })
            // console.log(response.data.value)
            return response.data

}


async function AvailableRoomTemp(mail,beginDate){

    console.log("available")
    console.log(mail)
    const originalDate = new Date(beginDate);
const nextDay = new Date(originalDate);
nextDay.setDate(originalDate.getDate() + 1);

const nextdate=nextDay.toISOString().split('T')[0];
    
    let url=`https://graph.microsoft.com/v1.0/users/${mail}/calendar/events?filter=start/dateTime ge '${beginDate}'and start/dateTime lt '${nextdate}'`
    console.log(url)
    token= await auth()
                
                const response=await axios.get(url,{
                    headers: {
                        'Authorization': token,
                        'Prefer':'outlook.timezone="Asia/Beirut"'
                      },
                })
                console.log(response.data.value)
                return response.data
    
    }




 function outputstring(rooms,user_input){


const formattedString = `
you are a AI data extractor that help extracting room name and address.
this is rooms array of objects  ${JSON.stringify(rooms.value)} and this is input text ${user_input}
 i want you to extract which room is in the input text want and output json object, you should only 
 -------------------------------
 for example :
 input: i want to see if playing room is available
 array of rooms :[{name:room1 ,address:room1@mail.com},{name: play room ,address:play_room@mail.com}]
output object should be : OUTPUT:{"chosenroom":"play room", "address":"play_room@mail.com"}
and the output should be json object only and its name is OUTPUT
--------------------------------
i want consistent output only you should always output json object called OUTPUT
N.B:only output json object, do not output code or text
`;



    return formattedString
}

function roomReport(name,schedule,datetime){
    

    
    let sched=`if the first meeting begin time is less than the specified endtime say it's available before first meeting.
    you are a AI summarizer that help to give when the room is available based on the meetings , check if this room ${name} is available at this date ${datetime}, check if the room is available before and after meetings time,  the room has meetings :`
    let counter=1
    for(const item of schedule){

        sched=sched + `meeting number ${counter} start time is at ${JSON.stringify(item.start)} and end time is at ${JSON.stringify(item.end)}`
        
        // console.log(item.start)


    }
   sched=sched+`\n---------------------------------------
   the output should not be long and it should be useful , and if the timezone is UTC convert the time from UTC to lebanon time (UTC+2) and if the timezone is Asia/Beirut dont convert it. 
   pay attention to timezone in meetings.
   ---------------------------------------`


    
    return sched
}


function roomReportTemp(name,schedule,begin,begintime,endtime){
    let sched=`if the first meeting begin time is less than the specified endtime say it's available before first meeting and specify the time.
    you are a AI summarizer that help to give when the room is available based on the meetings , check if this room ${name} is available between in this date ${begin} and from this time${begintime} to this time ${endtime}  , check if the room is available before and after meetings time,  the room has meetings :`
    let counter=1
    for(const item of schedule){

        sched=sched + `meeting number ${counter} start time is at ${JSON.stringify(item.start)} and end time is at ${JSON.stringify(item.end)} +\n`
        
        // console.log(item.start)
        counter+=1

    }
   sched=sched+`---------------------------------------
   the output should not be long and it should be useful.
   ---------------------------------------`
    
    
    return sched
}



function roomsReport(name,schedule,datetime){
    

    
    let sched=`this room ${name} has meetings: `
    let counter=1
    for(const item of schedule){

        sched=sched + `meeting number ${counter} start time is at ${JSON.stringify(item.start)} and end time is at ${JSON.stringify(item.end)}.`
        
        // console.log(item.start)


    }
   


    
    return sched
}



module.exports={findRooms,outputstring,AvailableRoom,roomReport,AvailableRoomTemp,roomReportTemp,roomsReport}