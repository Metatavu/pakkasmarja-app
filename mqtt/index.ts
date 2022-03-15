import _ from "lodash";
import mqtt from 'mqtt/dist/mqtt';
import { IClientOptions } from "mqtt";

/**
 * Message subscribe callback handler
 */
export type OnMessageCallback = (message: any) => void;

/**
 * MQTT server connection configuration
 */
export interface MqttConfig {
  username: string;
  password: string;
  host: string;
  port: number;
  secure: boolean;
  topic: string;
  topicPrefix: string;
  topicPostfix: string;
  path?: string;
}

/**
 * Interface describing a pending MQTT message
 */
interface PendingMessage {
  subtopic: string;
  message: string | Buffer;
}

/**
 * Class that handles MQTT connection
 */
export class MqttConnection {

  private pending: Array<PendingMessage>;
  private config?: MqttConfig;
  private client?: mqtt.MqttClient;
  private subscribers: Map<String, Array<OnMessageCallback>>;

  /**
   * Constructor
   */
  constructor () {
    this.pending = [];
    this.subscribers = new Map();
  }

  /**
   * Connects to MQTT server
   *
   * @param config connection config
   */
  public connect = (config: MqttConfig) => {
    const {
      secure,
      host,
      port,
      path,
      username,
      password,
      topicPrefix,
      topic,
      topicPostfix
    } = config;

    this.config = config;

    const protocol = secure ? "wss://" : "ws://";
    const url = `${protocol}${host}:${port}${path || ""}`;
    const options: IClientOptions = {
      username: username,
      password: password,
      host: host,
      port: port,
      keepalive: 30
    };

    this.client = mqtt.connect(url, options);
    this.client.subscribe(`${topicPrefix}${topic}${topicPostfix}`);

    console.warn("MQTT connection established");

    this.client.on("connect", this.onClientConnect);
    this.client.on("close", this.onClientClose);
    this.client.on("offline", this.onClientOffline);
    this.client.on("error", this.onClientError);
    this.client.on("message", this.onClientMessage);
  }

  /**
   * Publishes a message
   *
   * @param subtopic subtopic
   * @param message message
   * @returns promise for sent package
   */
  public publish = (subtopic: string, message: any): Promise<mqtt.Packet | undefined> => {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        this.pending.push({
          subtopic: subtopic,
          message: message
        });

        return;
      }

      const topic = `${this.config!.topicPrefix}${this.config!.topic}/${subtopic}/`;

      this.client.publish(
        topic,
        JSON.stringify(message),
        (error, packet) => error ? reject(error) : resolve(packet)
      );
    });
  }

  /**
   * Subscribes to given subtopic
   *
   * @param subtopic subtopic
   * @param onMessage message handler
   */
  public subscribe = (subtopic: string, onMessage: OnMessageCallback) => {
    const topicSubscribers = this.subscribers.get(subtopic) || [];
    topicSubscribers.push(onMessage);
    this.subscribers.set(subtopic, topicSubscribers);
  }

  /**
   * Disconnects from the server
   */
  public disconnect = () => {
    this.client?.end();
  }

  /**
   * Handles client connect event
   */
  private onClientConnect = () => {
    while (this.pending.length) {
      const { message, subtopic } = this.pending.shift()!;
      this.publish(subtopic, message);
    }
  }

  /**
   * Handles client close event
   */
  private onClientClose = () => {
    console.warn("MQTT connection closed");
  }

  /**
   * Handles client offline event
   */
  private onClientOffline = () => {
    console.warn("MQTT connection offline");
  }

  /**
   * Handles client error event
   */
  private onClientError = (error: Error) => {
    console.error("MQTT connection error", error);
  }

  /**
   * Handles client message event
   *
   * @param topic topic
   * @param payload payload
   */
  private onClientMessage = (topic: string, payload: Buffer) => {
    const topicStripped = _.trim(topic, "/");
    const subtopicIndex = topicStripped.lastIndexOf("/") + 1;
    const subtopic = topicStripped.substring(subtopicIndex);
    const message = JSON.parse(payload.toString());
    const topicSubscribers = this.subscribers.get(subtopic) || [];
    topicSubscribers.forEach(topicSubscriber => topicSubscriber(message));
  }

}

export const mqttConnection = new MqttConnection();