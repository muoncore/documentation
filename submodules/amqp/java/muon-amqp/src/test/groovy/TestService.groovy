import io.muoncore.Muon
import io.muoncore.MuonBuilder
import io.muoncore.config.AutoConfiguration
import io.muoncore.config.MuonConfigBuilder

/**
 * Created by david on 10/06/17.
 */
class TestService {

    static void main(args) {

        AutoConfiguration config = MuonConfigBuilder.withServiceIdentifier("my-service").withTags("awesome")
                .build()

        Muon muon = MuonBuilder
                .withConfig(config).build();



    }

}
