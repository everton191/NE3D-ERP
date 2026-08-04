package br.com.ne3d.erp;

import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallbackExtended;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.json.JSONObject;

import java.io.DataInputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

@CapacitorPlugin(name = "SimplificaBambuLan")
public class SimplificaBambuLanPlugin extends Plugin {
    private static final String KEY_IP = "bambu_lan_ip";
    private static final String KEY_SERIAL = "bambu_lan_serial";
    private static final String KEY_ACCESS_CODE = "bambu_lan_access_code";
    private static final String KEY_CLOUD_USERNAME = "bambu_cloud_mqtt_username";
    private static final String KEY_CLOUD_TOKEN = "bambu_cloud_mqtt_token";
    private static final String KEY_CLOUD_SERIAL = "bambu_cloud_mqtt_serial";
    private static final int MQTT_PORT = 8883;
    private static final int CAMERA_PORT = 6000;
    private static final int MAX_CAMERA_FRAME_BYTES = 8 * 1024 * 1024;

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Object statusLock = new Object();
    private JSONObject latestPrint = new JSONObject();
    private volatile String lastMessageAt = "";
    private volatile String connectionState = "disconnected";
    private volatile String connectionError = "";
    private volatile String connectionMode = "none";
    private MqttClient mqttClient;
    private SimplificaSecurePreferences securePreferences;

    @Override
    public void load() {
        securePreferences = new SimplificaSecurePreferences(getContext());
    }

    @PluginMethod
    public void getConfiguration(PluginCall call) {
        JSObject result = new JSObject();
        result.put("configured", !savedIp().isEmpty() && !savedSerial().isEmpty() && !savedAccessCode().isEmpty());
        result.put("ip", savedIp());
        result.put("serial", savedSerial());
        result.put("hasAccessCode", !savedAccessCode().isEmpty());
        result.put("cloudConfigured", !savedCloudUsername().isEmpty() && !savedCloudToken().isEmpty() && !savedCloudSerial().isEmpty());
        result.put("connectionState", connectionState);
        result.put("connectionMode", connectionMode);
        call.resolve(result);
    }

    @PluginMethod
    public void connect(PluginCall call) {
        final String ip = clean(call.getString("ip", savedIp()));
        final String serial = clean(call.getString("serial", savedSerial())).toUpperCase();
        final String accessCode = clean(call.getString("accessCode", savedAccessCode()));
        if (!isValidIpv4(ip)) {
            call.reject("Informe um endereço IPv4 válido da impressora.", "BAMBU_LAN_INVALID_IP");
            return;
        }
        if (serial.length() < 8 || serial.length() > 40) {
            call.reject("Informe o número de série da impressora.", "BAMBU_LAN_INVALID_SERIAL");
            return;
        }
        if (accessCode.length() < 6 || accessCode.length() > 32) {
            call.reject("Informe o código de acesso LAN da impressora.", "BAMBU_LAN_INVALID_ACCESS_CODE");
            return;
        }
        executor.execute(() -> connectBlocking(call, ip, serial, accessCode));
    }

    @PluginMethod
    public void connectCloud(PluginCall call) {
        final String host = clean(call.getString("host", "us.mqtt.bambulab.com"));
        final String username = clean(call.getString("username", savedCloudUsername()));
        final String token = clean(call.getString("token", savedCloudToken()));
        final String serial = clean(call.getString("serial", savedCloudSerial())).toUpperCase();
        if (host.isEmpty() || username.isEmpty() || token.length() < 20 || serial.length() < 8) {
            call.reject("Credenciais MQTT cloud incompletas.", "BAMBU_CLOUD_MQTT_INVALID_CREDENTIALS");
            return;
        }
        executor.execute(() -> connectCloudBlocking(call, host, username, token, serial));
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(statusResult());
    }

    @PluginMethod
    public void getCameraFrame(PluginCall call) {
        final String ip = clean(call.getString("ip", savedIp()));
        final String accessCode = clean(call.getString("accessCode", savedAccessCode()));
        if (!isValidIpv4(ip) || accessCode.isEmpty()) {
            call.reject("Configure a conexão LAN antes de abrir a câmera.", "BAMBU_LAN_NOT_CONFIGURED");
            return;
        }
        executor.execute(() -> cameraFrameBlocking(call, ip, accessCode));
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        executor.execute(() -> {
            disconnectInternal();
            call.resolve(statusResult());
        });
    }

    @PluginMethod
    public void clearConfiguration(PluginCall call) {
        executor.execute(() -> {
            disconnectInternal();
            securePreferences.putString(KEY_IP, "");
            securePreferences.putString(KEY_SERIAL, "");
            securePreferences.putString(KEY_ACCESS_CODE, "");
            securePreferences.putString(KEY_CLOUD_USERNAME, "");
            securePreferences.putString(KEY_CLOUD_TOKEN, "");
            securePreferences.putString(KEY_CLOUD_SERIAL, "");
            synchronized (statusLock) {
                latestPrint = new JSONObject();
            }
            call.resolve(statusResult());
        });
    }

    private void connectBlocking(PluginCall call, String ip, String serial, String accessCode) {
        connectMqttBlocking(call, "ssl://" + ip + ":" + MQTT_PORT, "bblp", accessCode, serial, "lan", ip);
    }

    private void connectCloudBlocking(PluginCall call, String host, String username, String token, String serial) {
        connectMqttBlocking(call, "ssl://" + host + ":" + MQTT_PORT, username, token, serial, "cloud", host);
    }

    private void connectMqttBlocking(PluginCall call, String brokerUrl, String username, String password, String serial, String mode, String endpoint) {
        try {
            disconnectInternal();
            connectionState = "connecting";
            connectionError = "";
            String clientId = "simplifica-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
            MqttClient client = new MqttClient(brokerUrl, clientId, new MemoryPersistence());
            MqttConnectOptions options = new MqttConnectOptions();
            options.setUserName(username);
            options.setPassword(password.toCharArray());
            options.setAutomaticReconnect(true);
            options.setCleanSession(true);
            options.setConnectionTimeout(8);
            options.setKeepAliveInterval(30);
            options.setSocketFactory(insecureTlsSocketFactory());
            client.setCallback(new MqttCallbackExtended() {
                @Override
                public void connectComplete(boolean reconnect, String serverURI) {
                    connectionState = "connected";
                }

                @Override
                public void connectionLost(Throwable cause) {
                    connectionState = "disconnected";
                    connectionError = cause == null ? "Conexão LAN encerrada." : clean(cause.getMessage());
                }

                @Override
                public void messageArrived(String topic, MqttMessage message) {
                    acceptMqttPayload(message == null ? "" : new String(message.getPayload(), StandardCharsets.UTF_8));
                }

                @Override
                public void deliveryComplete(IMqttDeliveryToken token) {}
            });
            client.connect(options);
            client.subscribe("device/" + serial + "/report", 0);
            mqttClient = client;
            if ("lan".equals(mode)) {
                securePreferences.putString(KEY_IP, endpoint);
                securePreferences.putString(KEY_SERIAL, serial);
                securePreferences.putString(KEY_ACCESS_CODE, password);
            } else {
                securePreferences.putString(KEY_CLOUD_USERNAME, username);
                securePreferences.putString(KEY_CLOUD_TOKEN, password);
                securePreferences.putString(KEY_CLOUD_SERIAL, serial);
            }
            connectionState = "connected";
            connectionMode = mode;
            publishPushAll(client, serial);
            call.resolve(statusResult());
        } catch (Exception error) {
            connectionState = "error";
            connectionError = clean(error.getMessage());
            call.reject("Não foi possível conectar à Bambu pela rede local: " + friendlyError(error), "BAMBU_LAN_CONNECT_FAILED", error);
        }
    }

    private void publishPushAll(MqttClient client, String serial) throws Exception {
        JSONObject pushing = new JSONObject();
        pushing.put("sequence_id", "1");
        pushing.put("command", "pushall");
        JSONObject request = new JSONObject();
        request.put("pushing", pushing);
        MqttMessage message = new MqttMessage(request.toString().getBytes(StandardCharsets.UTF_8));
        message.setQos(0);
        client.publish("device/" + serial + "/request", message);
    }

    private void acceptMqttPayload(String raw) {
        if (raw == null || raw.trim().isEmpty()) return;
        try {
            JSONObject root = new JSONObject(raw);
            JSONObject print = root.optJSONObject("print");
            if (print == null) return;
            synchronized (statusLock) {
                java.util.Iterator<String> keys = print.keys();
                while (keys.hasNext()) {
                    String key = keys.next();
                    latestPrint.put(key, print.opt(key));
                }
            }
            lastMessageAt = String.valueOf(System.currentTimeMillis());
            notifyListeners("bambuStatus", statusResult());
        } catch (Exception ignored) {
            connectionError = "A impressora enviou uma mensagem que não pôde ser interpretada.";
        }
    }

    private JSObject statusResult() {
        JSObject result = new JSObject();
        result.put("connectionState", connectionState);
        result.put("connected", "connected".equals(connectionState));
        result.put("error", connectionError);
        result.put("connectionMode", connectionMode);
        result.put("ip", savedIp());
        result.put("serial", savedSerial());
        result.put("lastMessageAt", lastMessageAt);
        synchronized (statusLock) {
            result.put("payload", latestPrint.toString());
        }
        return result;
    }

    private void cameraFrameBlocking(PluginCall call, String ip, String accessCode) {
        SSLSocket socket = null;
        try {
            socket = (SSLSocket) insecureTlsSocketFactory().createSocket();
            socket.connect(new InetSocketAddress(ip, CAMERA_PORT), 7000);
            socket.setSoTimeout(10000);
            socket.startHandshake();
            OutputStream output = socket.getOutputStream();
            byte[] auth = new byte[80];
            ByteBuffer header = ByteBuffer.wrap(auth).order(ByteOrder.LITTLE_ENDIAN);
            header.putInt(0, 0x40);
            header.putInt(4, 0x3000);
            copyAscii(auth, 16, 32, "bblp");
            copyAscii(auth, 48, 32, accessCode);
            output.write(auth);
            output.flush();
            DataInputStream input = new DataInputStream(socket.getInputStream());
            byte[] frameHeader = new byte[16];
            input.readFully(frameHeader);
            int frameSize = ByteBuffer.wrap(frameHeader).order(ByteOrder.LITTLE_ENDIAN).getInt(0);
            if (frameSize < 4 || frameSize > MAX_CAMERA_FRAME_BYTES) {
                throw new IllegalStateException("Tamanho de imagem inválido recebido da câmera.");
            }
            byte[] jpeg = new byte[frameSize];
            input.readFully(jpeg);
            if ((jpeg[0] & 0xff) != 0xff || (jpeg[1] & 0xff) != 0xd8) {
                throw new IllegalStateException("A câmera não retornou uma imagem JPEG válida.");
            }
            JSObject result = new JSObject();
            result.put("dataUrl", "data:image/jpeg;base64," + Base64.encodeToString(jpeg, Base64.NO_WRAP));
            result.put("bytes", jpeg.length);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Não foi possível obter a imagem da câmera: " + friendlyError(error), "BAMBU_LAN_CAMERA_FAILED", error);
        } finally {
            if (socket != null) {
                try { socket.close(); } catch (Exception ignored) {}
            }
        }
    }

    private void disconnectInternal() {
        MqttClient client = mqttClient;
        mqttClient = null;
        if (client != null) {
            try {
                if (client.isConnected()) client.disconnectForcibly(500, 500);
                client.close();
            } catch (Exception ignored) {}
        }
        connectionState = "disconnected";
        connectionMode = "none";
    }

    private SSLSocketFactory insecureTlsSocketFactory() throws Exception {
        TrustManager[] trustManagers = new TrustManager[] { new X509TrustManager() {
            @Override public void checkClientTrusted(X509Certificate[] chain, String authType) {}
            @Override public void checkServerTrusted(X509Certificate[] chain, String authType) {}
            @Override public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
        }};
        SSLContext context = SSLContext.getInstance("TLS");
        context.init(null, trustManagers, new SecureRandom());
        return context.getSocketFactory();
    }

    private void copyAscii(byte[] target, int offset, int maxLength, String value) {
        byte[] bytes = clean(value).getBytes(StandardCharsets.US_ASCII);
        System.arraycopy(bytes, 0, target, offset, Math.min(maxLength, bytes.length));
    }

    private String savedIp() { return securePreferences == null ? "" : clean(securePreferences.getString(KEY_IP)); }
    private String savedSerial() { return securePreferences == null ? "" : clean(securePreferences.getString(KEY_SERIAL)); }
    private String savedAccessCode() { return securePreferences == null ? "" : clean(securePreferences.getString(KEY_ACCESS_CODE)); }
    private String savedCloudUsername() { return securePreferences == null ? "" : clean(securePreferences.getString(KEY_CLOUD_USERNAME)); }
    private String savedCloudToken() { return securePreferences == null ? "" : clean(securePreferences.getString(KEY_CLOUD_TOKEN)); }
    private String savedCloudSerial() { return securePreferences == null ? "" : clean(securePreferences.getString(KEY_CLOUD_SERIAL)); }
    private String clean(String value) { return value == null ? "" : value.trim(); }

    private boolean isValidIpv4(String value) {
        String[] parts = clean(value).split("\\.");
        if (parts.length != 4) return false;
        try {
            for (String part : parts) {
                if (part.isEmpty() || part.length() > 3) return false;
                int number = Integer.parseInt(part);
                if (number < 0 || number > 255) return false;
            }
            return true;
        } catch (NumberFormatException error) {
            return false;
        }
    }

    private String friendlyError(Exception error) {
        String message = clean(error == null ? "" : error.getMessage());
        if (message.isEmpty()) return "verifique o IP, o código LAN e se o celular está na mesma rede Wi-Fi.";
        return message;
    }
}
