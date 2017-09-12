package io.muoncore.example.protocol.continuousfunction;

import io.muoncore.Muon;
import io.muoncore.channel.ChannelConnection;
import io.muoncore.codec.Codecs;
import io.muoncore.example.ContinuousFunctionClient;
import io.muoncore.message.MuonInboundMessage;
import io.muoncore.message.MuonMessageBuilder;
import io.muoncore.message.MuonOutboundMessage;

import java.util.function.Consumer;

public class ContinuousClient {

    private Muon muon;

    public ContinuousClient(Muon muon) {
        this.muon = muon;
    }

    public void request(String targetService, String text, int time, Consumer<FunctionResponse> functionResponse) {
        ChannelConnection<MuonOutboundMessage, MuonInboundMessage> channel = muon.getTransportClient().openClientChannel();

        channel.receive(muonInboundMessage -> {   // <1>
            if (muonInboundMessage.getStep().equals("answer")) {
                FunctionResponse decode = muon.getCodecs().decode(muonInboundMessage.getPayload(), muonInboundMessage.getContentType(), FunctionResponse.class);
                functionResponse.accept(decode);  // <5>
            }
        });

        Subscription sub = new Subscription();    // <2>
        Codecs.EncodingResult encode = muon.getCodecs().encode(sub, muon.getDiscovery().getCodecsForService(targetService));

        channel.send(MuonMessageBuilder           // <3>
                .fromService(muon.getConfiguration().getServiceName())
                .protocol("continuous-function")
                .step("RegisterFunction")         // <4>
                .payload(encode.getPayload())
                .contentType(encode.getContentType())
                .build());
    }
}
