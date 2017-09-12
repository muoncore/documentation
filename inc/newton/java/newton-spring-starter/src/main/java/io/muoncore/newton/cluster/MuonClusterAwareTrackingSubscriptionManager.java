package io.muoncore.newton.cluster;

import io.muoncore.newton.NewtonEvent;
import io.muoncore.newton.StreamSubscriptionManager;
import io.muoncore.newton.eventsource.muon.EventStreamProcessor;
import io.muoncore.newton.query.EventStreamIndex;
import io.muoncore.newton.query.EventStreamIndexStore;
import io.muoncore.newton.utils.muon.MuonLookupUtils;
import io.muoncore.protocol.event.client.EventClient;
import io.muoncore.protocol.event.client.EventReplayMode;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.reactivestreams.Subscriber;
import org.reactivestreams.Subscription;

import java.util.Collections;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.function.Consumer;

@Slf4j
@AllArgsConstructor
public class MuonClusterAwareTrackingSubscriptionManager implements StreamSubscriptionManager {

  private final int RECONNECTION_BACKOFF = 5000;
  private EventClient eventClient;
  private EventStreamIndexStore eventStreamIndexStore;
  private LockService lockService;
  private EventStreamProcessor eventStreamProcessor;
  //avoid potential deadlock by doing all work on a different thread, not the event dispatch thread.
  private final Executor worker = Executors.newSingleThreadExecutor();

  @Override
  public void localNonTrackingSubscription(String streamName, Consumer<NewtonEvent> onData) {
    log.debug("Subscribing to event stream '{}' for full local replay", streamName);

    eventClient.replay(
      streamName,
      EventReplayMode.REPLAY_THEN_LIVE,
      new EventSubscriber(event -> {
        log.debug("NewtonEvent received " + event);
        final NewtonEvent newtonEvent = event.getPayload(MuonLookupUtils.getDomainClass(event));
        worker.execute(() -> {
          eventStreamProcessor.executeWithinEventContext(newtonEvent, onData);
        });
      }, throwable -> {
        log.warn("NewtonEvent subscription has ended, will attempt to reconnect in {}ms", RECONNECTION_BACKOFF);
        try {
          Thread.sleep(RECONNECTION_BACKOFF);
        } catch (InterruptedException e) {
          e.printStackTrace();
        }
        localNonTrackingSubscription(streamName, onData);
      }));
  }

  @Override
  public void globallyUniqueSubscription(String subscriptionName, String stream, Consumer<NewtonEvent> onData) {
    lockService.executeAndRepeatWithLock(subscriptionName, control -> {
      localTrackingSubscription(subscriptionName, stream, onData, error -> {
        control.releaseLock();
      });
    });
  }

  @Override
  public void localTrackingSubscription(String subscriptionName, String streamName, Consumer<NewtonEvent> onData) {
    localTrackingSubscription(subscriptionName, streamName, onData, throwable -> {
      log.warn("NewtonEvent subscription has ended, will attempt to reconnect in {}ms", RECONNECTION_BACKOFF);
      try {
        Thread.sleep(RECONNECTION_BACKOFF);
      } catch (InterruptedException e) {
        e.printStackTrace();
      }
      localTrackingSubscription(subscriptionName, streamName, onData);
    });
  }

  public void localTrackingSubscription(String subscriptionName, String streamName, Consumer<NewtonEvent> onData, Consumer<Throwable> onError) {

    log.debug("Subscribing to event stream '{}'...", streamName);

    EventStreamIndex eventStreamIndex = eventStreamIndexStore.findOneById(subscriptionName)
      .orElse(new EventStreamIndex(streamName, 0L));

    Long lastSeen = eventStreamIndex.getLastSeen() + 1;

    log.trace("Will play data from " + lastSeen);
    eventClient.replay(
      streamName,
      EventReplayMode.REPLAY_THEN_LIVE,
      Collections.singletonMap("from", lastSeen),
      new EventSubscriber(event -> {
        log.debug("NewtonEvent received: " + event);
        Class<? extends NewtonEvent> eventType = MuonLookupUtils.getDomainClass(event);
        log.info("Store is {}, event is {}, time is {}", eventStreamIndexStore, event, event.getOrderId());

        eventStreamIndexStore.save(new EventStreamIndex(subscriptionName, event.getOrderId()==null?0l:event.getOrderId()));
        final NewtonEvent newtonEvent = event.getPayload(eventType);
        worker.execute(() -> {
          eventStreamProcessor.executeWithinEventContext(newtonEvent, onData);
        });
      }, onError));
  }

  static class EventSubscriber implements Subscriber<io.muoncore.protocol.event.Event> {

    private Consumer<io.muoncore.protocol.event.Event> onData;
    private Consumer<Throwable> onError;

    public EventSubscriber(Consumer<io.muoncore.protocol.event.Event> onData, Consumer<Throwable> onError) {
      this.onData = onData;
      this.onError = onError;
    }

    @Override
    public void onSubscribe(Subscription subscription) {
      subscription.request(Long.MAX_VALUE);
    }

    @Override
    public void onNext(io.muoncore.protocol.event.Event event) {
      onData.accept(event);
    }

    @Override
    public void onError(Throwable throwable) {
      onError.accept(throwable);
    }

    @Override
    public void onComplete() {
      onError.accept(new IllegalStateException("The event store has terminated a stream subscription cleanly. This is not expected with REPLAY_THEN_LIVE"));
    }
  }


}
