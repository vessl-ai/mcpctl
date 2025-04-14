import { MessageReader, MessageWriter } from 'vscode-jsonrpc';

export interface RPCTransport {
    reader: MessageReader;
    writer: MessageWriter;
    dispose(): void;
}

export interface RPCTransportFactory {
    create(options: RPCTransportOptions): Promise<RPCTransport>;
}

export interface RPCTransportOptions {
    /** 
     * Transport protocol type
     * Examples: 'http', 'tcp', 'ipc', etc.
     */
    type: string;

    /**
     * Server endpoint address to connect to
     * Examples: 'http://localhost:8080', '/tmp/socket.sock', etc.
     */
    endpoint?: string;

    /**
     * Port number for message communication
     * Primarily used when client sends messages to server
     */
    messagesPort?: number;

    /**
     * Port number for event reception
     * Primarily used for receiving server events
     */
    eventsPort?: number;

    /**
     * Additional connection parameters
     * Used for protocol-specific settings or authentication information
     */
    params?: Record<string, any>;
} 