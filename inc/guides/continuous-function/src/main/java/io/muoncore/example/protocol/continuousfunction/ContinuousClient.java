package io.muoncore.example.protocol.continuousfunction;

import io.muoncore.Muon;

import java.util.function.Consumer;

public class ContinuousClient {

    private Muon muon;

    public ContinuousClient(Muon muon) {
        this.muon = muon;
    }

    //# tag::api[]
    public void request(String text, int time, Consumer<FunctionResponse> functionResponse) {
        //# end::api[]



    }
}
