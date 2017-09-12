package pieshop;

import io.muoncore.Muon;
import io.muoncore.MuonBuilder;
import io.muoncore.config.AutoConfiguration;
import io.muoncore.config.MuonConfigBuilder;
import io.muoncore.protocol.reactivestream.server.PublisherLookup;
import io.reactivex.BackpressureStrategy;
import io.reactivex.Flowable;
import io.reactivex.subjects.PublishSubject;

import java.util.Arrays;

import static io.muoncore.protocol.requestresponse.server.HandlerPredicates.all;

//# tag::structure-a[]
public class Menu {

  private CurrentMenu menu = standardMenu();

  public Menu() {
    AutoConfiguration config =
      MuonConfigBuilder.withServiceIdentifier(
        "menu").build();

    Muon muon = MuonBuilder.withConfig(config).build();

    //# end::structure-a[]

    //# tag::rpc[]
    muon.handleRequest(all(), request -> {
      request.ok(menu);
    });
    //# end::rpc[]


    //# tag::stream[]
    PublishSubject<CurrentMenu> publishSubject = PublishSubject.create();  //<1>

    muon.publishSource(
      "/live",                                                             //<2>
      PublisherLookup.PublisherType.HOT,
      publishSubject.toFlowable(BackpressureStrategy.BUFFER));

    //Simulate menu updates for this episode of the Guide!
    new Thread(() -> {
      while(true) {
        try {
          Thread.sleep(1000);
          publishSubject.onNext(menu);
        } catch (InterruptedException e) {
          e.printStackTrace();
        }
      }
    }).start();

    //# end::stream[]

    //# tag::structure-b[]

    // define your Muon endpoints here...
  }

  private CurrentMenu standardMenu() {
    return new CurrentMenu(Arrays.asList(
      new MenuItem("Pork Pie", 2.50),
      new MenuItem("Blueberry Pie", 2.50),
      new MenuItem("Radish Pie", 2.50),
      new MenuItem("Apple Pie", 2.50)
    ));
  }

  public static void main(String[] args) {
    new Menu();
  }
}
//# end::structure-b[]
