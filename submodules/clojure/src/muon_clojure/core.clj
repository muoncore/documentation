(ns muon-clojure.core
  (:gen-class)
  (:require [muon-clojure.utils :as mcu]
            [muon-clojure.common :as mcc]
            [muon-clojure.data :as data]
            [clojure.tools.logging :as log]
            [clojure.core.async :refer [go-loop go <! >! chan buffer close!]]
            [muon-clojure.rx :as rx]
            [com.stuartsierra.component :as component])
  (:use clojure.java.data)
  (:import (io.muoncore.protocol.requestresponse Response)
           (io.muoncore.exception MuonException)
           (io.muoncore.protocol.event.client DefaultEventClient)
           (io.muoncore.protocol.event ClientEvent)
           (io.muoncore Muon MuonStreamGenerator)
           (io.muoncore.api MuonFuture ImmediateReturnFuture)
           (io.muoncore.channel ChannelConnection
                                ChannelConnection$ChannelFunction)
           (io.muoncore.protocol.event.server EventServerProtocolStack)
           (io.muoncore.channel.impl StandardAsyncChannel)
           (com.google.common.eventbus EventBus)
           (java.util.function Predicate)))

(def ^:dynamic *muon-config* nil)

(defprotocol MicroserviceStream (stream-mappings [this]))
(defprotocol MicroserviceRequest (request-mappings [this]))
(defprotocol MicroserviceEvent (handle-event [this event]))
(defprotocol ClientConnection
  (wiretap [this])
  (discover [this])
  (request [this service-url params])
  (subscribe [this service-url params]))

(defn expose-streams! [muon mappings]
  (dorun (map #(mcc/stream-source
                muon (:endpoint %) (:stream-type %) (:fn-process %))
              mappings)))

(defn expose-requests! [muon mappings]
  (dorun (map #(mcc/on-request muon (:endpoint %) (:fn-process %))
              mappings)))

(defn impl-request [muon service-url params]
  (log/trace (pr-str params))
  (let [response (.request muon service-url params)]
    (log/trace "Response:" (pr-str response))
    (let [got-response (.get response)
          payload (data/payload got-response)]
      (log/trace "Response payload:" (pr-str payload))
      payload)))

(defn params->uri [service-url params]
  (let [query-string (map #(str (name (key %)) "=" (val %)) params)
        url-string (str service-url "?"
                        (clojure.string/join "&" query-string))
        uri (java.net.URI. url-string)]
    (log/trace "Query string:" url-string)
    uri))

(defn impl-subscribe [muon service-url params]
  (let [uri (params->uri service-url params)
        ch (chan 1024)] ;; TODO: Increase this number?
    (go
      (log/trace "Creating failsafe channel")
      (log/trace "Subscribing...")
      (try
        (let [[sbr failsafe-ch] (rx/subscriber 1024)]
          (log/trace "We have a subscriber object")
          (.subscribe muon uri sbr)
          (log/trace "Starting processing loop for" (.hashCode failsafe-ch))
          (loop [ev (<! failsafe-ch) timeout 1]
            (log/trace "Arrived" ev "for" (.hashCode failsafe-ch))
            (if (nil? ev)
              (do
                (log/info ":::::: Stream closed")
                (close! failsafe-ch)
                (close! ch))
              (let [thrown? (instance? Throwable ev)]
                (if (>! ch (mcu/keywordize (data/payload ev)))
                  (do
                    (log/trace "Client received" (pr-str ev))
                    (if thrown?
                      (if (and (instance? MuonException ev)
                               (= (.getMessage ev) "Stream does not exist"))
                        (do
                          (log/info "Stream does not exist, shutting down")
                          (close! failsafe-ch)
                          (close! ch))
                        (do
                          (log/info (str "::::::::::::: Stream failed, resubscribing after "
                                         timeout "ms..."))
                          (Thread/sleep timeout)
                          (.subscribe muon uri
                                      clojure.lang.PersistentArrayMap
                                      (rx/subscriber failsafe-ch))
                          (recur (<! failsafe-ch) (* 2 timeout))))
                      (recur (<! failsafe-ch) 1)))
                  (do
                    (log/info ":::::: Subscription channel has been closed from outside!")
                    (close! failsafe-ch)
                    (.onComplete sbr)))))))
        (catch Throwable t
          (log/trace "Error in subscription:" (.getMessage t))
          (.printStackTrace t)))
      (log/trace "Subscription ended"))
    ch))

(defn impl-discover [muon]
  (map from-java (-> muon (.getDiscovery) (.getKnownServices)))) 

(defn channel-function [implementation]
  (reify ChannelConnection$ChannelFunction
    (apply [_ event-wrapper]
      (let [event-raw (.getEvent event-wrapper)
            event {:event-type (.getEventType event-raw)
                   :stream-name (.getStreamName event-raw)
                   :schema (.getSchema event-raw)
                   :caused-by (.getCausedById event-raw)
                   :caused-by-relation (.getCausedByRelation event-raw)
                   :service-id (.getService event-raw)
                   :order-id (.getOrderId event-raw)
                   :event-time (.getEventTime event-raw)
                   :payload (mcu/keywordize (data/payload event-raw))}
            {:keys [order-id event-time] :as rich-event}
            (handle-event implementation event)]
        (if (contains? rich-event :error)
          (.failed event-wrapper (:error rich-event))
          (.persisted event-wrapper order-id event-time))))))

(declare muon-client)

(defrecord Microservice [options]
  ClientConnection
  (wiretap [this] (:wiretap this))
  (request [this service-url params]
    (impl-request (:muon this) service-url params))
  (subscribe [this service-url params]
    (impl-subscribe (:muon this) service-url params))
  (discover [this]
    (impl-discover (:muon this)))
  component/Lifecycle
  (start [component]
    (if (nil? (:muon component))
      (let [implementation (:implementation options)
            options (if (and (not (nil? implementation))
                             (satisfies? MicroserviceEvent implementation))
                      (update options :tags conj "eventstore")
                      options)
            muon (mcc/muon-instance options)
            tc (.getTransportControl muon)
            debug? (true? (:debug options))
            taps (if debug?
                   (let [tap (.tap tc
                                   (reify Predicate (test [_ _] true)))
                         [s ch] (rx/subscriber 1024)]
                     (.subscribe tap s)
                     {:wiretap ch :tap tap})
                   {})]
        (when-not (nil? implementation)
          (if (satisfies? MicroserviceStream implementation)
            (expose-streams! muon (stream-mappings implementation)))
          (if (satisfies? MicroserviceRequest implementation)
            (expose-requests! muon (request-mappings implementation)))
          (if (satisfies? MicroserviceEvent implementation)
            (let [handler (channel-function implementation)
                  event-stack (EventServerProtocolStack.
                               handler (.getCodecs muon)
                               (.getDiscovery muon))]
              (.registerServerProtocol
               (.getProtocolStacks muon) event-stack))))
        (.blockUntilReady (.getDiscovery muon))
        (merge component taps {:muon muon :event-client (atom nil)}))
      component))
  (stop [{:keys [muon] :as component}]
    (if (nil? (:muon component))
      component
      (do
        (try
          (if-let [wiretap (:wiretap component)]
            (close! wiretap))
          #_(if-let [tap (:tap component)]
            (.shutdown tap))
          ;; TODO: Re-check if transport and discovery
          ;;       have to be shut down
          (.shutdown muon)
          (catch Exception e
            (log/debug "Something wrong when stopping:" (.getMessage e))))
        (merge component {:muon nil :event-client nil
                          :wiretap nil :tap nil})))))

(defn micro-service [options]
  (map->Microservice {:options options}))

(defn anonymous-micro-service []
  (component/start
   (micro-service {:url :local
                   :service-name (.toString (java.util.UUID/randomUUID))
                   :tags ["anonymous"]})))

(defn muon-client [url service-name & tags]
  (component/start (map->Microservice
                    {:options {:url url
                               :service-name service-name
                               :tags tags}})))

(defmacro with-muon [muon & body]
  `(binding [*muon-config* ~muon]
     ~@body))

(defn event-client [mc]
  (if-let [ec @(:event-client *muon-config*)]
    ec
    (let [new-ec (try
                   ;; TODO: Make event client handling smarter
                   (DefaultEventClient. (:muon *muon-config*))
                   (catch MuonException e
                     (log/info (str "Eventstore not found, "
                                    "event functionality not available!"))
                     nil))]
      (swap! (:event-client *muon-config*) (fn [_] new-ec))
      new-ec)))

(defn event! [{:keys [event-type stream-name schema caused-by
                      caused-by-relation #_service-id payload]
               :as event}]
  ;; TODO: Make event client handling smarter
  (if-let [ec (event-client *muon-config*)]
    (let [ev (ClientEvent. event-type stream-name schema caused-by
                                caused-by-relation #_service-id
                                (mcu/dekeywordize payload))
          res (.event ec ev)
          order-id (.getOrderId res)
          event-time (.getEventTime res)]
      (if (and (= 0 event-time) (= 0 order-id))
        (throw (MuonException. "Event not posted"))
        (merge event {:order-id (.getOrderId res)
                      :event-time (.getEventTime res)})))
    (throw (UnsupportedOperationException. "Eventstore not available"))))

(defn subscribe!
  [service-url {:keys [from stream-type stream-name]
                :or {from (System/currentTimeMillis) stream-type nil
                     stream-name "events"}
                :as params}]
  (let [params (mcu/dekeywordize
                 (merge params {:from (str from) :stream-type stream-type
                                :stream-name stream-name} ))]
    (log/info ":::::::: CLIENT SUBSCRIBING" service-url params)
    (subscribe *muon-config* service-url params)))

(defn request! [service-url params]
  (let [item-json (mcu/dekeywordize params)
        _ (log/info ":::::::: CLIENT REQUESTING" service-url item-json)
        payload (mcu/keywordize
                 (into {} (request *muon-config* service-url item-json)))
        payload (if (contains? payload :_muon_wrapped_value)
                  (:_muon_wrapped_value payload) payload)]
    payload))

(defn discover! [] (discover *muon-config*))
