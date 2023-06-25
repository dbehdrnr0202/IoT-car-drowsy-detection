const Gpio = require('pigpio').Gpio;
const mqtt = require('mqtt');
const mqttClient = mqtt.connect('mqtt://192.168.219.99:1883');
const topic = 'ALARM';
const ALARM_LENGTH = 500;

//mqtt broker에 연결
mqttClient.on('connect', () => {
    console.log('Connected to MQTT server');
    mqttClient.subscribe(topic, (err) => {
        if(err) console.log('Failed to subscribe topic');
        else console.log('Subscribed to topic');
    });
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

//console.log('function beep done');
//'ALARM' topic에서 message가 왔을 경우
mqttClient.on('message', (message) => {
    //console.log('recieved', message);
    if(message == 'ALARM') {
        //알람을 받았음을 명시적으로 출력 후 짧은 출력음
        console.log('received message the alarm');
        shortBeep();
    };
});