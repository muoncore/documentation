(ns muon-clojure.common
  (:require [clojure.tools.logging :as log]
            [muon-clojure.utils :as mcu]
            [clojure.core.async :refer [chan]]
            [clojure.java.data :as java]
            [abracad.avro :as avro]
            [abracad.avro.edn :as aedn]
            [muon-clojure.rx :as rx]
            [clojure.java.io :as io]
            [muon-clojure.data :as data])
  (:import (java.util LinkedList)
           (com.google.common.eventbus EventBus)
           (org.apache.avro.specific SpecificRecord)
           (io.muoncore MuonBuilder MultiTransportMuon MuonStreamGenerator)
           (io.muoncore.codec DelegatingCodecs MuonCodec)
           (io.muoncore.codec.avro AvroCodec)
           (io.muoncore.codec.json GsonCodec)
           (io.muoncore.config AutoConfiguration)
           (io.muoncore.memory.discovery InMemDiscovery)
           (io.muoncore.memory.transport InMemTransport)
           (io.muoncore.extension.amqp
            DefaultServiceQueue AMQPMuonTransport
            DefaultAmqpChannelFactory)
           (io.muoncore.extension.amqp.discovery
            AmqpDiscovery)
           (io.muoncore.transport ServiceCache)
           (io.muoncore.extension.amqp.rabbitmq09
            RabbitMq09ClientAmqpConnection RabbitMq09QueueListenerFactory)
           (io.muoncore Muon MuonStreamGenerator)
           (io.muoncore.api MuonFuture ImmediateReturnFuture)
           (io.muoncore.extension.amqp.discovery AmqpDiscovery)
           (org.reactivestreams Publisher)
           (io.muoncore.protocol.reactivestream.messages
            ReactiveStreamSubscriptionRequest)
           (io.muoncore.protocol.reactivestream.server
            PublisherLookup$PublisherType
            ReactiveStreamServerHandlerApi$PublisherGenerator)
           (io.muoncore.protocol.requestresponse.server
            RequestResponseServerHandlerApi$Handler
            RequestWrapper HandlerPredicates)
           (clojure.lang BigInt Cons IMeta IPersistentList IPersistentMap
                         IPersistentSet IPersistentVector ISeq Keyword PersistentArrayMap
                         PersistentQueue Ratio Sorted Symbol)))

(def type-mappings {:hot-cold PublisherLookup$PublisherType/HOT_COLD
                    :hot PublisherLookup$PublisherType/HOT
                    :cold PublisherLookup$PublisherType/COLD})

(defn stream-source [muon endpoint-name type gen-fn]
  (.publishGeneratedSource
   muon (str "/" endpoint-name)
   (get type-mappings type (get type-mappings :hot-cold))
   (reify ReactiveStreamServerHandlerApi$PublisherGenerator
     (^Publisher generatePublisher
      [this ^ReactiveStreamSubscriptionRequest request]
      (log/trace "generatePublisher")
      (let [params (into {} (.getArgs request))
            res (get params "stream-type" (:stream-type params))
            stream-type (if (or (nil? res)
                                (= "" (clojure.string/trim res)))
                          (if (nil? type) :hot-cold type)
                          res)
            final-params (dissoc
                          (assoc params "stream-type" stream-type)
                          :stream-type)]
        (log/trace "stream-source" (pr-str params))
        (log/trace "final stream-type" stream-type)
        (log/trace "final params" final-params)
        (rx/publisher gen-fn final-params))))))

(defn on-request [muon endpoint-name res-fn]
  (.handleRequest
   muon
   (HandlerPredicates/path (str "/" endpoint-name))
   (reify RequestResponseServerHandlerApi$Handler
     (^void handle [this ^RequestWrapper query-event]
      (log/info "handle" (pr-str query-event))
      (log/trace "handle" (pr-str query-event))
      (let [resource
            (mcu/keywordize (-> query-event .getRequest data/payload))
            res (res-fn resource)
            res (if (map? res) res {:_muon_wrapped_value res})]
        ;; TODO: Remove the need for wrapping values!
        (log/info "on-request" (pr-str resource))
        (log/trace "on-request" (pr-str resource))
        (.ok query-event (mcu/dekeywordize res)))))))

(def local-event-bus (EventBus.))
(def local-discovery (InMemDiscovery.))

(defn muon-from-config [config]
  (.build (MuonBuilder/withConfig config)))

(def basic-codecs (-> (DelegatingCodecs.)
                      (.withCodec (AvroCodec.))
                      (.withCodec (GsonCodec.))))

(defn muon-local [url service-name tags]
  (let [config (doto (AutoConfiguration.)
                 (.setServiceName service-name)
                 (.setTags (LinkedList. tags)))
        muon-transport (InMemTransport. config local-event-bus)
        muon (MultiTransportMuon. config local-discovery [muon-transport]
                                  basic-codecs)]
    muon))

(defn create-discovery [url]
  (let [connection (RabbitMq09ClientAmqpConnection. url)
        queue-factory
        (RabbitMq09QueueListenerFactory. (.getChannel connection))
        codecs basic-codecs
        discovery
        (AmqpDiscovery. queue-factory connection (ServiceCache.) codecs)]
    (.start discovery)
    discovery))

(defn muon-amqp [url service-name tags]
  (let [connection (RabbitMq09ClientAmqpConnection. url)
        queue-factory
        (RabbitMq09QueueListenerFactory. (.getChannel connection))
        service-queue (DefaultServiceQueue. service-name connection)
        channel-factory
        (DefaultAmqpChannelFactory. service-name queue-factory connection)
        discovery (create-discovery url)
        channel-factory (DefaultAmqpChannelFactory.
                         service-name queue-factory connection)
        muon-transport (AMQPMuonTransport.
                        url service-queue channel-factory)
        config (doto (AutoConfiguration.)
                 (.setServiceName service-name)
                 (.setTags (LinkedList. tags)))
        muon (MultiTransportMuon. config discovery [muon-transport] basic-codecs)]
    muon))

(defn muon-instance
  ([url service-name tags]
   (muon-instance {:url url :service-name service-name :tags tags}))
  ([options]
   (if (contains? options :config)
     (muon-from-config (:config options))
     (let [{:keys [url service-name tags]} options]
       (if (or (nil? url) (= url :local))
         (muon-local url service-name tags)
         (muon-amqp url service-name tags))))))
