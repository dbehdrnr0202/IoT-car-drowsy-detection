const CLIENT_ID = '23QZDK';
const CLIENT_SECRET = '5756ec4982474e3ff764607f669cb1a7';
const REDIRECT_URI = 'http://localhost:3000/';
let ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1FaREsiLCJzdWIiOiI3TTJWTE4iLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJlY2cgcnNldCByb3h5IHJudXQgcnBybyByc2xlIHJjZiByYWN0IHJyZXMgcmxvYyByd2VpIHJociBydGVtIiwiZXhwIjoxNjgzNDk2MzYxLCJpYXQiOjE2ODM0Njc1NjF9.ZMCo5CDlmx4y40aBspUPyeS861Q1H4qTg1-r0M6h2xg';
const REFRESH_TOKEN = '0edb02e1a6626925717d28a1d838e9ba7bc1d0187502736f08cfcada49eca363';

//For MongoDB Connection
const { MongoClient } = require('mongodb');
const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);
const dbName = 'team7db';

async function saveFitbitDataToMongoDB(data) {
  try {
    await client.connect(); // MongoDB 연결

    const database = client.db('fitbitdata');
    const collection = database.collection('fitbitdata');

    // 데이터 삽입
    await collection.insertOne({
      startDate: data['activities-heart'][0]['dateTime'], 
      endDate: data['activities-heart'][0]['endDate'],
      startTime: data['activities-heart'][0]['startTime'],
      endTime: data['activities-heart'][0]['endTime'],
      heartRate: data['activities-heart-intraday']['dataset'], //dataset 객체에는 시간대별 심박수와 각 시간대에 대한 기록 시각이 저장
      oxygenSaturation: data['oxygen-saturation'],
    });

    console.log('Fitbit data saved to MongoDB.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.close(); // MongoDB 연결 종료
  }
}

// Access Token을 Refresh Token으로 교체하는 함수 (토큰이 만료된 경우 Refresh 토큰을 사용하여 새로운 토큰을 발급)
async function getAccessTokenWithRefreshToken() {
  const response = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: REFRESH_TOKEN,
    }),
  });

  const data = await response.json();
  return data.access_token;
}

// Access Token을 사용하여 API에 요청을 보내는 함수
async function requestFitbitAPI(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: 'Bearer ' + ACCESS_TOKEN,
    },
  });

  if (response.status === 401) { // Access Token이 만료된 경우 (401 에러)
    const newAccessToken = await getAccessTokenWithRefreshToken();
    ACCESS_TOKEN = newAccessToken; // 새로운 Access Token으로 대체
    return requestFitbitAPI(url); // 재귀적으로 함수 호출하여 다시 시도
  }

  const data = await response.json();
  return data;
}

// 최신 심박수 데이터 가져오기
async function getLatestHeartRateData() {
  const heartrateUrl = 'https://api.fitbit.com/1/user/-/activities/heart/date/today/1d/1sec.json';
  const heartrateData = await requestFitbitAPI(heartrateUrl);
  return heartrateData['activities-heart-intraday']['dataset'];
}

// 최신 산소 포화도 데이터 가져오기
async function getLatestOxygenData() {
  const url = 'https://api.fitbit.com/1/user/-/oxygensaturation/date/today/1d/1sec.json';
  const data = await requestFitbitAPI(url);
  const dataset = data['oxygen-saturation'];

  return dataset;
}

// 5초마다 최신 심박수, 산소 포화도 데이터 가져오기
setInterval(async () => {
  const latestHeartRateData = await getLatestHeartRateData();
  const latestOxygenData = await getLatestOxygenData();
  console.log('Latest heart rate:', latestHeartRateData);
  console.log('Latest oxygen:', latestOxygenData);
}, 5000);

// 수면 데이터 가져오기
async function getSleepData() {
	const url = 'https://api.fitbit.com/1.2/user/-/sleep/date/today.json';
	const data = await requestFitbitAPI(url);
	return data;
  }
  
// 5초마다 수면 데이터 가져와서 자고 있으면 1, 안자고 있으면 0 출력
setInterval(async () => {
const sleepData = await getSleepData();
const latestSleep = sleepData['sleep'][0];
const isSleeping = latestSleep['isMainSleep'] && latestSleep['minutesAsleep'] > 0;
console.log(isSleeping ? 1 : 0);
}, 5000);



