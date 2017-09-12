# muon-clojure

A Clojure client/server library for interacting with Muon microservices.

## Installation

`muon-clojure` is deployed in clojars.org:

![Clojars Project](https://img.shields.io/clojars/v/io.muoncore/muon-clojure.svg)

## Usage

### Client API

To import the library:

```clojure
(use 'muon-clojure.core)
```

#### Creating a muon client

```clojure
(def m (muon-client "amqp://mq-url" "service-name" "tag1" "tag2" "tag3"))
```

#### Sending a query or command

```clojure
(with-muon m (request! "request://target-service/endpoint" {:foo "bar"}))
```

#### Subscribe to a stream

```clojure
(require '[clojure.core.async :as async :refer [go <!]])

(let [ch (with-muon ms (subscribe! "stream://my-server/stream1"))]
  (go (loop [elem (<! ch)]
        (when-not (nil? elem)
          (println (pr-str elem)) (recur (<! ch))))))
```

#### Send an event to an eventstore

NOTE: This functionality is only available if there is an eventstore available subscribed to the same AMQP server. If you see the following message when initialising the client:

```
INFO  client:6 - Eventstore not found, event functionality not available!
```

then the calls to `(event)` won't be successful.

```clojure
(with-muon m (event! {:event-type "type" :stream-name "my-stream" :payload {:my :data}}))
```

For an explanation of the possible fields of the event, please refer to [https://github.com/microserviceux/documentation/blob/master/implementmuon/protocol/event/v1.adoc](https://github.com/microserviceux/documentation/blob/master/implementmuon/protocol/event/v1.adoc).

## Server API

In order to run a microservice in server mode, you will need to provide an implementation and start/stop the instance by means of the `component` library.

### Providing an implementation

An implementation of a microservice endpoints consists in a reification of the `muon-clojure.core/[MicroserviceStream,MicroserviceEvent,MicroserviceRequest]` protocols. Each of them is optional, and they serve different purposes:

* `MicroserviceStream` allows to expose subscription endpoints that should return a channel.
* `MicroserviceEvent` allows to expose an endpoint that will process (e.g. store) an event. These endpoints, in order to be compliant with the Muon Event protocol, should return the same event with an `order-id` and `event-time` filled. Please check the [https://github.com/microserviceux/documentation/blob/master/implementmuon/protocol/event/v1.adoc](schema docs).
* `MicroserviceRequest` allows to expose endpoints that should return and/or do something based on the parameters.

Example:

```clojure
(defrecord MyMicroservice [my-params]
  MicroserviceStream
  (stream-mappings [this]
    [{:endpoint "stream1" :type :cold
      :fn-process (fn [params]
                    (clojure.core.async/to-chan [{:val 1} {:val 2}]))}
     {:endpoint "stream2" :type :hot-cold
      :fn-process (fn [params]
                    (clojure.core.async/to-chan [{:val 1} {:val 2}]))}])
  MicroserviceEvent
  (handle-event [this event]
    (println "Event received!")
    (merge event {:order-id 1 :event-time 1}))
  MicroserviceRequest
  (request-mappings [this]
    [{:endpoint "echo"
      ;; As an example, we return the same payload that we receive
      :fn-process identity}]))
```

### Starting the microservice

In order to start the microservice, we have to provide some parameters and call `component/start`:

```clojure
(def params {:url "amqp://mq-url"
             :service-name "my-server"
             :tags ["tag4" "tag5"]
             :implementation (MyMicroservice. {:record :params})})
(def ms (com.stuartsierra.component/start (micro-service params)))
```

The microservice can be properly shut down by calling stop:

```(component/stop ms)```

### Using the server as a client

The microservice server in `muon-clojure` is a client at its core, so it can be used as a client as well:

```clojure
(with-muon ms (request! "request://my-server/echo" {:bar "baz"}))
=> {:bar "baz"}

(with-muon ms (event! {}))
=> Event received!
=> {:order-id 1, :event-time 1}

(with-muon ms (event! {:stream-name "test"}))
=> Event received!
=> {:stream-name "test", :order-id 1, :event-time 1}

(require '[clojure.core.async :as async :refer [go <!]])
(let [ch (with-muon ms (subscribe! "stream://my-server/stream1"))]
  (go (loop [elem (<! ch)]
        (when-not (nil? elem)
          (println (pr-str elem)) (recur (<! ch))))))
=> {:val 1.0}
=> {:val 2.0}
```

