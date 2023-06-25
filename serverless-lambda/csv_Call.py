import json
import csv
import boto3

def lambda_handler(event, context):
    region = 'ap-southeast-2'
    record_list = []
    
    try :
        s3 = boto3.client('s3')
        dynamodb = boto3.client('dynamodb', region_name = region)
        
        bucket = event["Records"][0]["s3"]["bucket"]['name']
        key = event["Records"][0]["s3"]["object"]["key"]
        
        print('Bucket', bucket, "key", key)
        
        csv_file = s3.get_object(Bucket = bucket, Key = key)
        
        record_list = csv_file['Body'].read().decode('utf-8').split("\n")
        
        csv_reader = csv_reader(record_list, delimiter=',', quotechar="'")
        
        for row in csv_reader:
            Id = row[0]
            Name = row[1]
            City = row[2]
            
            add_to_db = dynamodb.put_item(
                TableName = 'sleepy_shelter',
                Item = {
                '_id': {'S': str(_id)},
                'roadType': {'S': str(roadType)},
                'sidoName': {'S': str(sidoName)}
                }
                )
            print("Successfully uploaded")
            
    except Exception as e:
        print(str(e))