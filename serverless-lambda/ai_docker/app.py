import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import confusion_matrix, classification_report

IS_ACTIVE   = 0
IS_DROWSY   = 1
IS_SLEEPING = 2

def load_dataset_from_db():
  dynamodb = boto3.resource('dynamodb')

  table = dynamodb.Table("test_fitbitdata")
  res = table.scan()
  items = res['Items']
  total_length = len(items)  
  
  dataset_x = np.zeros((total_length, 2))
  dataset_y = np.zeros(total_length)

  for i in range(0, total_length):
    dataset_x[i][0] = items[i]['spo2']
    dataset_x[i][1] = items[i]['heart rate']
    dataset_y[i] = items[i]['sleep']
  X_train, X_test, y_train, y_test = train_test_split(dataset_x, dataset_y, test_size=0.2)
  
  #print(X_test, y_test)
  return (X_train, X_test, y_train, y_test)

def load_current_data():
  dynamodb = boto3.resource('dynamodb')

  table = dynamodb.Table("test_fitbitdata")
  res = table.scan()
  items = res['Items']
  total_length = len(items)
  res = table.query(
      KeyConditionExpression=Key('_id').eq(total_length)
  )
  items = res['Items']
  rtn = np.zeros((1, 2))
  
  rtn[0][0] = items[0]['spo2']
  rtn[0][1] = items[0]['heart rate']
  
  return rtn

def init(config):
  X_train, X_test, y_train, y_test = load_dataset_from_db()
  classifier = KNeighborsClassifier(config['n_neighbors'])
  classifier.fit(X_train, y_train)
  return classifier

def predict(classifier):
  data = load_current_data()
  y_pred = classifier.predict(data)
  return y_pred

def evaluate(classifier, config):
  X_train, X_test, y_train, y_test = load_dataset_from_db(config)
  conf_matrix = confusion_matrix(y_test, y_pred)
  #print(conf_matrix)

  report = classification_report(y_test, y_pred)
  #print(report)
  errors = []
  for i in range(1, 31):
    knn = KNeighborsClassifier(n_neighbors=i)
    knn.fit(X_train, y_train)
    pred_i = knn.predict(X_test)
    errors.append(np.mean(pred_i != y_test))

def publish(topic, msg):
    client = boto3.client('iot-data', region_name='ap-southeast-2')
    json_object = {
        'topic':topic,
        'message':msg,
        'device':'ai_module_from_lambda_function'
    }
    response = client.publish(topic=topic, qos = 1, payload = json.dumps(json_object))
    
def handler(event, context):
    # TODO implement
    msg = "msg from ai.py lamda_handler and didn't detected"
    
    config = {"mode": "train",
              "n_neighbors":5
              }
    knn = init(config)
    if predict(knn)!=IS_ACTIVE:
        publish('ALERT', 'detected')
        msg = "msg from ai.py lambda_handler and detected drowsiness"
    else:
        publish('ALERT', 'not detected') 
    
    #publish('ALERT', 'message')
    return {
        'statusCode': 200,
        'body': json.dumps(msg)
    }