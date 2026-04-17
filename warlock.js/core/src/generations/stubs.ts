export const communicatorsConfigStub = `import { env } from "@mongez/dotenv";
import type { CommunicatorConfigurations, RabbitMQClientOptions } from "@warlock.js/herald";

const communicatorConfigurations: CommunicatorConfigurations<RabbitMQClientOptions> = {
  driver: "rabbitmq",
  name: "default",
  isDefault: true,

  // ============================================================================
  // Connection Settings
  // ============================================================================

  host: env("RABBITMQ_HOST", "localhost"),
  port: env("RABBITMQ_PORT", 5672),
  username: env("RABBITMQ_USERNAME", "guest"),
  password: env("RABBITMQ_PASSWORD", "guest"),
  vhost: env("RABBITMQ_VHOST", "/"),

  // Or use connection URI (takes precedence over host/port)
  // uri: env("RABBITMQ_URL"),

  // ============================================================================
  // Connection Options
  // ============================================================================

  /** Heartbeat interval in seconds */
  heartbeat: 60,

  /** Connection timeout in milliseconds */
  connectionTimeout: 10000,

  /** Enable automatic reconnection on disconnect */
  reconnect: true,

  /** Delay between reconnection attempts in milliseconds */
  reconnectDelay: 5_000,

  // ============================================================================
  // Consumer Options
  // ============================================================================

  /** Default prefetch count (number of unacknowledged messages per consumer) */
  prefetch: 10,

  // ============================================================================
  // Client Options (Native amqplib options)
  // ============================================================================
  // These options are passed directly to amqplib.connect()
  // for low-level configuration like frame size, TLS, socket options, etc.
  // ============================================================================
  clientOptions: {
    // Frame max size in bytes (0 = no limit)
    // frameMax: 0,

    // Channel max (0 = unlimited)
    // channelMax: 0,

    // Socket options
    socket: {
      // Enable TCP keep-alive
      keepAlive: true,

      // Disable Nagle's algorithm for lower latency
      noDelay: true,

      // Socket timeout (in addition to heartbeat)
      // timeout: 30000,
    },

    // TLS/SSL options (uncomment for secure connections)
    // socket: {
    //   ca: fs.readFileSync('/path/to/ca.pem'),
    //   cert: fs.readFileSync('/path/to/cert.pem'),
    //   key: fs.readFileSync('/path/to/key.pem'),
    //   rejectUnauthorized: true,
    // },
  },
};

export default communicatorConfigurations;
`;
