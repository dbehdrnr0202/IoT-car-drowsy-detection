import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import confusion_matrix, classification_report
import os
import paho.mqtt.client as mqtt
from pymongo import MongoClient

IS_ACTIVE   = 0
IS_DROWSY   = 1
IS_SLEEPING = 2

# 데이터 읽기 함수
def load_dataset(config):
  # 1. 데이터 준비
  col_names = ['spo2', 'heart rate', 'sleep']

  # csv 파일에서 DataFrame을 생성
  dataset = pd.read_csv(config['file'], encoding='UTF-8', header=0)

  X = dataset.iloc[:, 4:-1].to_numpy() # DataFrame을 np.ndarray로 변환
  # print(X)
  # y = 전체 행, 마지막 열 데이터
  y = dataset.iloc[:, -1].to_numpy()
  X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
  return (X_train, X_test, y_train, y_test)

def load_dataset_from_db():
  client = MongoClient("mongodb://localhost:27017/")
  db = client['team7db']
  fitbit_collection = db['test_fitbit_data']
  #print(list(fitbit_collection.find({}).sort("_id", -1)))
  dataset_x = np.zeros((fitbit_collection.estimated_document_count(), 2))
  dataset_y = np.zeros(fitbit_collection.estimated_document_count())
  index = 0
  for data in fitbit_collection.find({}).limit(1).sort("_id", -1):
    #print(data)
    dataset_x[index][0] = data['spo2']
    dataset_x[index][1] = data['heart rate']
    dataset_y[index] = data['sleep']
  #X = dataset.iloc[:, 0:-1].to_numpy()
  #y = dataset.iloc[:, -1].to_numpy()
  #print(dataset_x, dataset_y)
  X_train, X_test, y_train, y_test = train_test_split(dataset_x, dataset_y, test_size=0.2)
  return (X_train, X_test, y_train, y_test)

def load_current_data():
  client = MongoClient("mongodb://localhost:27017/")
  db = client['team7db']
  fitbit_collection = db['test_fitbit_data']
  datas = fitbit_collection.find().sort("_id", -1)
  rtn = np.zeros((1, 2))
  for data in datas:
    rtn[0][0] = data['spo2']
    rtn[0][1] = data['heart rate']
    #print(spo2, heart_rate)
    break
  return rtn

def init(config):
  X_train, X_test, y_train, y_test = load_dataset_from_db()
  classifier = KNeighborsClassifier(config['n_neighbors'])
  classifier.fit(X_train, y_train)
  return classifier

def predict(classifier):
  data = load_current_data()
  #data.reshape(-1, 1)
  y_pred = classifier.predict(data)
  return y_pred

def evaluate(classifier, config):
  X_train, X_test, y_train, y_test = load_dataset(config)
  conf_matrix = confusion_matrix(y_test, y_pred)
  print(conf_matrix)

  report = classification_report(y_test, y_pred)
  print(report)
  errors = []
  for i in range(1, 31):
    knn = KNeighborsClassifier(n_neighbors=i)
    knn.fit(X_train, y_train)
    pred_i = knn.predict(X_test)
    #print("iter:",i)
    #print("predicted\t", pred_i)
    #print("golden\t\t", y_test)
    errors.append(np.mean(pred_i != y_test))
def on_message(client, userdata, message):
  print("message received ", str(message.payload.decode("utf-8")))
  print("message topic=", message.topic)
  print("message qos=", message.qos)
  print("message retain flag=", message.retain)
  if predict(knn)!= IS_ACTIVE:
    client.publish(config['pub_topic'], "alert")
    print("ALERT MESSAGE SENT")
  else:
    print("Just Closed Eyes")
if(__name__=="__main__"):
    root_dir = '/'
    output_dir = os.path.join(root_dir, "output")
    #if not os.path.exists(output_dir):
    #    os.makedirs(output_dir)
    # 입력 데이터셋 MNIST dataset
    config = {"mode": "train",
              "model_name":"epoch_{0:d}.pt".format(10),
              "output_dir":output_dir,
              "epoch":10,
              "root_dir":root_dir,
              "file":"testdata.csv",
              "broker_address":"119.71.178.4",
              "broker_port":1883,
              "client_name":"ai module",
              "sub_topic":"DROWSY",
              "pub_topic":"ALERT",
              "n_neighbors":5
              }
    client = mqtt.Client(config['client_name'])
    knn = init(config)

    client.connect(config['broker_address'], config['broker_port'])
    client.subscribe(config['sub_topic'])
    client.on_message = on_message
    print("ready for loop")
    client.loop_forever()
    if(config["mode"] == "predict"):
        print("test")
        print("prediction test: ", predict(knn))
    #else:
        #knn.test(config)

