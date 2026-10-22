/*
  LeakMap ESP32 Scanner
  ---------------------
  Sensors:
    DHT11        -> GPIO 4
    MLX90614     -> SDA 21, SCL 22
    Moisture     -> GPIO 34
    OLED SSD1306 -> SDA 21, SCL 22, address 0x3C

  Firebase:
    /live
      moisture
      thermalDelta
      acoustic
      airTemp
      humidity
      ts
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

#include <Wire.h>

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_MLX90614.h>

#include <DHT.h>


// =====================================================
// WIFI
// =====================================================

const char* WIFI_SSID = "surendhar";
const char* WIFI_PASSWORD = "7358993760";


// =====================================================
// FIREBASE
// =====================================================

const char* FIREBASE_HOST =
  "leak-map-3d971-default-rtdb.asia-southeast1.firebasedatabase.app";


// =====================================================
// PINS
// =====================================================

#define DHT_PIN       4
#define DHT_TYPE      DHT11

#define MOISTURE_PIN  34

#define SDA_PIN       21
#define SCL_PIN       22


// =====================================================
// OLED
// =====================================================

#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1

Adafruit_SSD1306 display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  OLED_RESET
);


// =====================================================
// SENSORS
// =====================================================

DHT dht(DHT_PIN, DHT_TYPE);

Adafruit_MLX90614 mlx =
  Adafruit_MLX90614();

bool mlxReady = false;


// =====================================================
// MOISTURE CALIBRATION
// =====================================================

// Change these later after testing your sensor.

const int MOISTURE_RAW_DRY = 3000;
const int MOISTURE_RAW_WET = 1200;


// =====================================================
// TIMING
// =====================================================

const unsigned long PUSH_INTERVAL = 2000;

unsigned long lastPush = 0;


// =====================================================
// WIFI CONNECTION
// =====================================================

bool connectWiFi() {

  Serial.println();
  Serial.println("================================");
  Serial.println("Connecting to WiFi");
  Serial.println("================================");

  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED &&
         attempts < 30) {

    delay(500);
    Serial.print(".");

    attempts++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("WiFi CONNECTED!");

    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    return true;

  } else {

    Serial.println("WiFi CONNECTION FAILED!");

    Serial.print("WiFi status: ");
    Serial.println(WiFi.status());

    return false;
  }
}


// =====================================================
// MOISTURE
// =====================================================

float readMoisture() {

  int raw = analogRead(MOISTURE_PIN);

  float percentage =
    (float)(MOISTURE_RAW_DRY - raw) /
    (MOISTURE_RAW_DRY - MOISTURE_RAW_WET)
    * 100.0;

  percentage = constrain(
    percentage,
    0.0,
    100.0
  );

  Serial.print("Moisture raw: ");
  Serial.print(raw);

  Serial.print(" | Moisture: ");
  Serial.print(percentage, 1);
  Serial.println("%");

  return percentage;
}


// =====================================================
// THERMAL
// =====================================================

float readThermalDelta(float airTemp) {

  if (!mlxReady) {
    return 0.0;
  }

  float objectTemp =
    mlx.readObjectTempC();

  if (isnan(objectTemp) ||
      isnan(airTemp)) {

    return 0.0;
  }

  float delta =
    fabs(objectTemp - airTemp);

  Serial.print("IR Object Temp: ");
  Serial.print(objectTemp, 2);

  Serial.print(" C | Thermal Delta: ");
  Serial.print(delta, 2);

  Serial.println(" C");

  return delta;
}


// =====================================================
// FIREBASE
// =====================================================

void pushToFirebase(
  float moisture,
  float thermalDelta,
  float acoustic,
  float airTemp,
  float humidity
) {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println(
      "WiFi disconnected. Reconnecting..."
    );

    connectWiFi();

    if (WiFi.status() != WL_CONNECTED) {
      return;
    }
  }


  WiFiClientSecure client;

  // For demo/student project.
  client.setInsecure();


  HTTPClient https;

  String url =
    "https://" +
    String(FIREBASE_HOST) +
    "/live.json";


  Serial.println();
  Serial.println("Sending data to Firebase...");

  if (!https.begin(client, url)) {

    Serial.println(
      "Firebase connection setup FAILED"
    );

    return;
  }


  https.addHeader(
    "Content-Type",
    "application/json"
  );


  String payload = "{";

  payload +=
    "\"moisture\":" +
    String(moisture, 1) +
    ",";

  payload +=
    "\"thermalDelta\":" +
    String(thermalDelta, 2) +
    ",";

  payload +=
    "\"acoustic\":" +
    String(acoustic, 1) +
    ",";

  payload +=
    "\"airTemp\":" +
    String(isnan(airTemp) ? 0.0 : airTemp, 1) +
    ",";

  payload +=
    "\"humidity\":" +
    String(isnan(humidity) ? 0.0 : humidity, 1) +
    ",";

  payload +=
    "\"ts\":" +
    String(millis());

  payload += "}";


  int httpCode =
    https.PUT(payload);


  if (httpCode > 0) {

    Serial.print(
      "Firebase response: "
    );

    Serial.println(httpCode);

    Serial.print(
      "Firebase data: "
    );

    Serial.println(payload);

  } else {

    Serial.print(
      "Firebase FAILED: "
    );

    Serial.println(
      https.errorToString(httpCode)
    );
  }


  https.end();
}


// =====================================================
// OLED
// =====================================================

void updateOLED(
  float airTemp,
  float humidity,
  float objectTemp,
  float moisture,
  float thermalDelta
) {

  display.clearDisplay();

  display.setTextSize(1);

  display.setTextColor(
    SSD1306_WHITE
  );


  // Header

  display.setCursor(20, 0);

  display.println(
    "LEAKMAP"
  );

  display.drawLine(
    0,
    10,
    128,
    10,
    SSD1306_WHITE
  );


  // Air temperature

  display.setCursor(0, 16);

  display.print(
    "Air: "
  );

  if (isnan(airTemp)) {

    display.println("ERR");

  } else {

    display.print(
      airTemp,
      1
    );

    display.println(" C");
  }


  // Humidity

  display.setCursor(0, 28);

  display.print(
    "Humidity: "
  );

  if (isnan(humidity)) {

    display.println("ERR");

  } else {

    display.print(
      humidity,
      1
    );

    display.println("%");
  }


  // IR temperature

  display.setCursor(0, 40);

  display.print(
    "IR: "
  );

  if (mlxReady &&
      !isnan(objectTemp)) {

    display.print(
      objectTemp,
      1
    );

    display.println(" C");

  } else {

    display.println(
      "NOT FOUND"
    );
  }


  // Moisture

  display.setCursor(0, 52);

  display.print(
    "Moisture: "
  );

  display.print(
    moisture,
    0
  );

  display.println("%");


  display.display();
}


// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(115200);

  delay(1000);


  Serial.println();
  Serial.println(
    "================================"
  );

  Serial.println(
    "       LEAKMAP SCANNER"
  );

  Serial.println(
    "================================"
  );


  // ADC

  analogReadResolution(12);


  // I2C

  Wire.begin(
    SDA_PIN,
    SCL_PIN
  );


  // DHT11

  dht.begin();

  Serial.println(
    "DHT11 initialized"
  );


  // MLX90614

  mlxReady = mlx.begin();

  if (mlxReady) {

    Serial.println(
      "MLX90614 detected"
    );

  } else {

    Serial.println(
      "WARNING: MLX90614 NOT detected"
    );

    Serial.println(
      "Thermal delta will be 0"
    );
  }


  // OLED

  if (!display.begin(
        SSD1306_SWITCHCAPVCC,
        0x3C
      )) {

    Serial.println(
      "OLED NOT detected!"
    );

  } else {

    Serial.println(
      "OLED initialized"
    );

    display.clearDisplay();

    display.setTextSize(1);

    display.setTextColor(
      SSD1306_WHITE
    );

    display.setCursor(
      15,
      25
    );

    display.println(
      "LeakMap Starting..."
    );

    display.display();

    delay(1500);
  }


  // WiFi

  connectWiFi();


  Serial.println();
  Serial.println(
    "System ready."
  );
}


// =====================================================
// LOOP
// =====================================================

void loop() {

  // -------------------------------------------------
  // Read DHT11
  // -------------------------------------------------

  float humidity =
    dht.readHumidity();

  float airTemp =
    dht.readTemperature();


  // -------------------------------------------------
  // Read MLX90614
  // -------------------------------------------------

  float objectTemp = 0;

  if (mlxReady) {

    objectTemp =
      mlx.readObjectTempC();
  }


  // -------------------------------------------------
  // Moisture
  // -------------------------------------------------

  float moisture =
    readMoisture();


  // -------------------------------------------------
  // Thermal difference
  // -------------------------------------------------

  float thermalDelta = 0;

  if (!isnan(airTemp)) {

    thermalDelta =
      readThermalDelta(airTemp);
  }


  // -------------------------------------------------
  // Acoustic
  // -------------------------------------------------

  // No acoustic sensor connected yet.

  float acoustic = 0.0;


  // -------------------------------------------------
  // Serial output
  // -------------------------------------------------

  Serial.println();
  Serial.println(
    "---------- SENSOR DATA ----------"
  );

  Serial.print(
    "Air Temperature: "
  );

  Serial.print(
    airTemp,
    1
  );

  Serial.println(" C");


  Serial.print(
    "Humidity: "
  );

  Serial.print(
    humidity,
    1
  );

  Serial.println(" %");


  Serial.print(
    "Object Temperature: "
  );

  Serial.print(
    objectTemp,
    1
  );

  Serial.println(" C");


  Serial.print(
    "Moisture: "
  );

  Serial.print(
    moisture,
    1
  );

  Serial.println(" %");


  Serial.print(
    "Thermal Delta: "
  );

  Serial.print(
    thermalDelta,
    2
  );

  Serial.println(" C");


  // -------------------------------------------------
  // OLED
  // -------------------------------------------------

  updateOLED(
    airTemp,
    humidity,
    objectTemp,
    moisture,
    thermalDelta
  );


  // -------------------------------------------------
  // Firebase
  // -------------------------------------------------

  pushToFirebase(
    moisture,
    thermalDelta,
    acoustic,
    airTemp,
    humidity
  );


  delay(PUSH_INTERVAL);
}