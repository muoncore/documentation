package io.muoncore.example.protocol.continuousfunction;

import io.muoncore.Muon;
import io.muoncore.channel.Channel;
import io.muoncore.channel.ChannelConnection;
import io.muoncore.channel.Channels;
import io.muoncore.descriptors.ProtocolDescriptor;
import io.muoncore.descriptors.SchemaDescriptor;
import io.muoncore.message.MuonInboundMessage;
import io.muoncore.message.MuonOutboundMessage;
import io.muoncore.protocol.JSProtocol;
import io.muoncore.protocol.ServerJSProtocol;
import io.muoncore.protocol.ServerProtocolStack;

import java.util.Map;
import java.util.function.Supplier;

public class ContinuousJSServer implements ServerProtocolStack {

    private Muon muon;

    public ContinuousJSServer(Muon muon) {
        this.muon = muon;
    }

    @Override
    public Map<String, SchemaDescriptor> getSchemasFor(String s) {    //<1>
        return null;
    }

    @Override
    public ProtocolDescriptor getProtocolDescriptor() {          // <2>
        return null;
    }

    @Override
    public ChannelConnection<MuonInboundMessage, MuonOutboundMessage> createChannel() {    // <3>
        Channel<MuonInboundMessage, MuonOutboundMessage> channel = Channels.channel("transport", "api");

        ServerJSProtocol serverJSProtocol = new ServerJSProtocol(muon, "server-protocol", channel.right());// <4>
        serverJSProtocol.addTypeForDecoding("Subscription", Subscription.class);
        serverJSProtocol.start(ContinuousJSServer.class.getResourceAsStream("/continuous-server.js"));

        serverJSProtocol.setState("generator", (Supplier<String>) () -> {
            return "GENERATED TEXT " + System.currentTimeMillis();
        });

        return channel.left();
    }
}
