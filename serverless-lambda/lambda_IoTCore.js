const AWS = require('aws-sdk');

const dynamo = new AWS.DynamoDB.DocumentClient();
const iotdata = new AWS.IotData({ endpoint: 'a22mz3iyiit10s-ats.iot.ap-southeast-2.amazonaws.com'});

exports.handler = async (event) => {
    // TODO implement
    
    const alarmMessage = {
        topic: 'ALARM',
        message: 'alarm message',
        device: 'lambda_IoTCore_from_lambda_function'
    };
    
    const params = {
        topic: 'ALARM',
        payload: JSON.stringify(alarmMessage)
    };
    
    const newItem = {
        TableName: 'drowsyLog',
        Item: {
            ID : Date.now(),
            DATE : new Date().toLocaleString(),
            TYPE : 'DROWSY'
        }
    };
    
    try {
        await dynamo.put(newItem).promise();
        await iotdata.publish(params).promise();
        
        console.log('ALARM message published successfully.');
        return 'ALARM message published.';
    }catch(err) {
        console.error('Failed to publish ALARM message:', err);
        throw err;        
    }
};
