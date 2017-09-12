package io.muoncore.example;

import io.muoncore.Muon;
import io.muoncore.MuonBuilder;
import io.muoncore.config.AutoConfiguration;
import io.muoncore.config.MuonConfigBuilder;
import io.muoncore.example.protocol.continuousfunction.ContinuousClient;
import lombok.extern.slf4j.Slf4j;

/**
 * Simple Muon example that acts as a client
 */
@Slf4j
public class ContinuousFunctionClient {

    public static void main(String[] args) throws Exception {

        AutoConfiguration config = MuonConfigBuilder.withServiceIdentifier("example-service-client").build();

        Muon muon = MuonBuilder.withConfig(config).build();
        muon.getDiscovery().blockUntilReady();

        ContinuousClient client = new ContinuousClient(muon);

        client.request("Hello World", 2, functionResponse -> {
            log.info("Server said " + functionResponse.getResponse());
        });
    }
}
