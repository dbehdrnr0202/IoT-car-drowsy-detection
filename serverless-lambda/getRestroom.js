const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    const operation = event.httpMethod;
    const payload = {
        TableName: 'sleepy_shelter'
    }
    
    if(event.queryStringParameters) {
        payload.FilterExpression = 'sidoName = :location';
        payload.ExpressionAttributeValues = {
            ':location': event.queryStringParameters.location
        };
        
    }
    
    switch(operation) {
        case 'GET' :
            dynamo.scan(payload, (err, data) => {
                callback(null, {
                    'statusCode': 200,
                    'headers': {
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': JSON.stringify(data.Items)
                });
            });       
            break;
        default :
            callback(new Error('Unrecognized operation "${operation}"'));
            
    }   
    
};