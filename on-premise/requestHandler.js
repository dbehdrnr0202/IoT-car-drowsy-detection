//For Express.js Framework
const express = require('express')
const app = express()

//For MongoDB Connection
const { MongoClient } = require('mongodb');
const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);
const dbName = 'team7db'; 


//Request Mapping
//for test
app.get("/", (req, res) => {
    console.log("[REQUEST] GET / ");
    res.status(200).send("TEST OK");
});


//GET /logs/drowsy 
app.get("/logs/drowsy", async (req, res) => {
    console.log("[REQUEST] GET /logs/drowsy");

    //to do : DB에 접근해서 졸음 기록을 전부 가져와 보여준다.
    const db = client.db(dbName);
    const collection = db.collection('drowsyLog');
    const result = await collection.find({}).toArray();

    //to do : 받은 data를 json형태로 변경
    // console.log("Found doc: ", result);

    //to do : 그냥 json을 응답으로 보내는 것으로 변경
    res.status(200).json(result);
});

//GET /logs/restroom?(location=xxxx) 
app.get("/logs/restroom", async (req, res) => {
    //to do : DB에 접근해서 졸음 쉼터 기록 보여준다.
    
    const db = client.db(dbName);
    const collection = db.collection('restroomLog');

    //Query parameter가 없는 경우 -> 모든 졸음 쉼터를 보여준다.
    if(!Object.keys(req.query).length) {
        console.log("[REQUEST] GET /logs/restroom");
        const result = await collection.find({}).toArray();
        
        // 쿼리 결과 제대로 나오는지 체크
        // console.log("Found doc: ", result);

        //to do : result를 json으로 변경 후 응답 메시지 전송
        res.status(200).json(result);

    }else{ //Query parameter가 있는 경우 -> 해당 지역에 대한 졸음 쉼터만 보여준다. 
        
        const location = req.query.location
        console.log("[REQUEST] GET /logs/restroom?location=" + location);
        
        const query = { 시도명 : location };
        const result = await collection.find(query).toArray();
        console.log("Found doc: ", result);
        
        //to do : result를 json으로 변경 후 응답 메시지 전송
        res.status(200).json(result);
    }
    
});

app.listen(3000, () => {
    console.log('Server is running on Port 3000');
    client.connect();
});

