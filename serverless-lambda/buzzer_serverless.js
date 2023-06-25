var awsIot = require('aws-iot-device-sdk');
const Gpio = require('pigpio').Gpio;
const topic = 'ALARM';
const ALARM_LENGTH = 500;

var device = awsIot.device({
   keyPath: "/home/team7/cert/a8ae8ec42b62b54a64986d5e9244a1f3b28197d602e071d33f4edd7c62763e27-private.pem.key",
  certPath: "/home/team7/cert/a8ae8ec42b62b54a64986d5e9244a1f3b28197d602e071d33f4edd7c62763e27-certificate.pem.crt",
    caPath: "/home/team7/cert/AmazonRootCA1.pem",
  clientId: "buzzer",
      host: "a22mz3iyiit10s-ats.iot.ap-southeast-2.amazonaws.com"
});
//buzzer를 gpio 18번에 출력 설정으로 초기화한다.
const beeper = new Gpio(18, {mode:Gpio.OUTPUT});
beeper.pwmWrite(0);

//interupt가 왔을 경우 buzzer가 꺼져야하므로, 0으로 다시 설정한다.
process.on('SIGINT', function(){
    beeper.pwmWrite(0);
    process.exit();
});
//짧은 출력음 출력
function shortBeep(){
    //frequency 4000으로
    beeper.pwmFrequency(4000);
    let maxDutyCycle = beeper.getPwmRange();
    let dutyCycle = Math.trunc(0.5*maxDutyCycle);
    beeper.pwmWrite(dutyCycle);
    setTimeout(function()       {
        //ALARM_LENGTH 만큼의 시간이 지난 후 frequency 0으로
        beeper.pwmWrite(0);
    }, ALARM_LENGTH);
}

// mqtt connect
device
  .on('connect', function() {
    console.log('connect');
    device.subscribe(topic);
    device.publish('topic_2', JSON.stringify({ test_data: 1}));
  });

// message 수신 event
device.on('message', (topic, payload) => {
        if (topic=='ALARM')	{
		console.log('received message the alarm')
		shortBeep();
	};
	console.log('from ',topic,'message: ', payload.toString());
})

// close event
device.on('close', (err) => err && console.log(err));

// reconnect event
device.on('reconnect', () => { });

// offline event
device.on('offline', () => { });

// error event
device.on('error', (error) => error && console.log(error));
