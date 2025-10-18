#include <Servo.h>

// === Pin Variables ===
const int servoPin = 2;
const int trigPin = 5;
const int echoPin = 6;

// === Config ===
const int detectDistance = 9;   // cm threshold
const int holdTime = 1000;       // 1 second hold (ms)

// === Objects ===
Servo myServo;

// === Setup ===
void setup() {
  Serial.begin(9600);
  myServo.attach(servoPin);
  myServo.write(90);   // start centered at 0°

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  
}

// === Function to Measure Distance ===
long getDistance() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  long distance = duration * 0.034 / 2; // cm
  return distance;
}

unsigned long generateRandom8Digit() {
  // Generates a number between 10,000,000 and 99,999,999
  return random(10000000, 100000000);
}


// === Main Loop ===
void loop() {
  long distance = getDistance();
  //Serial.println(distance);

  if (distance > detectDistance) {
    unsigned long randomNumber = generateRandom8Digit();
    Serial.println(randomNumber);
    

    myServo.write(-90);       // rotate to +90
    delay(holdTime);
    myServo.write(90);       // rotate to +90

    delay(500);             // cooldown to avoid multiple triggers
  }

  delay(500);
}
