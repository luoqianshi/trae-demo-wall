package com.sva.config;

import com.mysql.cj.conf.PropertySet;
import com.mysql.cj.protocol.ServerSession;
import com.mysql.cj.protocol.SocketConnection;
import com.mysql.cj.protocol.SocketFactory;

import java.io.Closeable;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketAddress;
import java.nio.channels.SocketChannel;

/**
 * Custom SocketFactory that uses SocketChannel to avoid Windows JDK Socket.createImpl bug.
 * The standard Socket.createImpl() fails with "Socket operation on nonsocket" on some Windows environments.
 */
public class CustomSocketFactory implements SocketFactory {

    private Socket rawSocket = null;

    @Override
    public <T extends Closeable> T connect(String hostname, int portNumber, PropertySet pset, int loginTimeout) throws IOException {
        try {
            SocketAddress addr = new InetSocketAddress(hostname, portNumber);
            SocketChannel channel = SocketChannel.open();

            if (loginTimeout > 0) {
                channel.socket().connect(addr, loginTimeout * 1000);
            } else {
                channel.connect(addr);
            }

            Socket socket = channel.socket();
            this.rawSocket = socket;
            return (T) socket;
        } catch (IOException e) {
            throw e;
        }
    }

    @Override
    public <T extends Closeable> T performTlsHandshake(SocketConnection socketConnection, ServerSession serverSession) throws IOException {
        return null;
    }
}
