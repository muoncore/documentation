package io.muoncore.example.protocol.continuousfunction;

import io.muoncore.Muon;
import io.muoncore.channel.Channel;
import io.muoncore.channel.ChannelConnection;
import io.muoncore.channel.Channels;
import io.muoncore.channel.support.Scheduler;
import io.muoncore.codec.Codecs;
import io.muoncore.descriptors.ProtocolDescriptor;
import io.muoncore.descriptors.SchemaDescriptor;
import io.muoncore.message.MuonInboundMessage;
import io.muoncore.message.MuonMessage;
import io.muoncore.message.MuonMessageBuilder;
import io.muoncore.message.MuonOutboundMessage;
import io.muoncore.protocol.ServerProtocolStack;

import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

public class ContinuousServer implements ServerProtocolStack {

    private Muon muon;
    private Scheduler.TimerControl timerControl;

    public ContinuousServer(Muon muon) {
        this.muon = muon;
        muon.getProtocolStacks().registerServerProtocol(this);
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

        channel.right().receive(muonInboundMessage -> {

            if (muonInboundMessage == null || muonInboundMessage.getChannelOperation() == MuonMessage.ChannelOperation.closed) {
                if (timerControl != null) {
                    timerControl.cancel();
                }
                return;
            }

            if (muonInboundMessage.getStep().equals("RegisterFunction")) {
                Subscription decode = muon.getCodecs().decode(
                        muonInboundMessage.getPayload(),
                        muonInboundMessage.getContentType(), Subscription.class);

                sendResponse(channel, muonInboundMessage.getSourceServiceName());

                timerControl = muon.getScheduler().executeIn(1000, TimeUnit.MILLISECONDS, () -> {
                    sendResponse(channel, muonInboundMessage.getSourceServiceName());
                });
            }
        });

        return channel.left();
    }

    private void sendResponse(Channel<MuonInboundMessage, MuonOutboundMessage> channel, String sourceService) {
        FunctionResponse response = new FunctionResponse();
        Codecs.EncodingResult encode = muon.getCodecs().encode(response, muon.getDiscovery().getCodecsForService(sourceService));

        channel.right().send(MuonMessageBuilder.fromService(muon.getConfiguration().getServiceName())
                .protocol("continuous-function")
                .toService(sourceService)
                .step("answer")
                .payload(encode.getPayload())
                .contentType(encode.getContentType())
                .build()
        );
    }
}
