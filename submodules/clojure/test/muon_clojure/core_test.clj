(ns muon-clojure.core-test
  (:use midje.sweet)
  (:use muon-clojure.core)
  (:require [clojure.test :refer :all]
            [muon-clojure.common :as mcc]
            [com.stuartsierra.component :as component]
            [clojure.core.async :refer [to-chan <!!]])
  (:import (com.google.common.eventbus EventBus)
           (java.util LinkedList)
           (io.muoncore.config AutoConfiguration)))

(def events (ref []))

(defrecord TestMSImpl []
  MicroserviceStream
  (stream-mappings [this]
    [{:endpoint "stream-test" :type :hot-cold
      :fn-process (fn [params]
                    (to-chan
                     [{:val 1} {:val 2} {:val 3} {:val 4} {:val 5}]))}
     {:endpoint "stream-test-0" :type :hot-cold
      :fn-process (fn [params]
                    (to-chan
                     []))}
     {:endpoint "stream-test-1" :type :hot-cold
      :fn-process (fn [params]
                    (to-chan
                     [{:val 1}]))}])
  MicroserviceRequest
  (request-mappings [this]
    [{:endpoint "post-endpoint"
      :fn-process (fn [resource]
                    {:val (inc (:val resource))})}
     {:endpoint "get-endpoint"
      :fn-process (fn [resource] {:test :ok})}
     {:endpoint "get-num-endpoint"
      :fn-process (fn [resource] 3.14)}])
  MicroserviceEvent
  (handle-event [this event]
    (let [t (System/currentTimeMillis)
          ev (merge event {:order-id (* 1000 t) :event-time t})]
      (dosync (alter events conj ev))
      ev)))

(defn ch->seq [ch]
  (<!! (clojure.core.async/reduce
        (fn [prev n] (concat prev `(~n))) '() ch)))

(defn endpoint->ch [c uuid endpoint]
  (with-muon c (subscribe! (str "stream://" uuid "/" endpoint) {})))

(def uuid (.toString (java.util.UUID/randomUUID)))
(def ms (component/start
         (micro-service {:url #_"amqp://localhost" :local
                         :service-name uuid
                         :tags ["dummy" "test" "eventstore"]
                         :implementation (->TestMSImpl)})))
(def c (muon-client #_"amqp://localhost" :local (str uuid "-client")
                    "dummy" "test" "client"))

(defn post-val [uuid]
  (request! (str "rpc://" uuid "/post-endpoint") {:val 1}))

(defn post-vals [c uuid n]
  (let [s (repeatedly #(post-val uuid))]
    (with-muon c (doall (take n s)))))

(defn sample [f]
  (key (first (sort-by val (frequencies (take 10 (repeatedly f)))))))

(let [get-val
      (with-muon c (request! (str "rpc://" uuid "/get-endpoint")
                             {:test :ok}))
      get-num-val
      (with-muon c (request! (str "rpc://" uuid "/get-num-endpoint")
                             {:test :ok}))
      post-val
      (with-muon c (request! (str "rpc://" uuid "/post-endpoint")
                             {:val 1}))]
  (fact "Query works as expected" get-val => {:test "ok"})
  (fact "Query works as expected for non-map types"
        get-num-val => 3.14)
  (fact "Post works as expected" post-val => {:val 2}))

(fact "First element retrieved from stream is the first element provided by the service"
      (sample #(<!! (endpoint->ch c uuid "stream-test")))
      => {:val 1})
(fact "Stream results come ordered"
      (sample #(let [not-ordered (ch->seq (endpoint->ch c uuid "stream-test"))]
                 (= not-ordered (sort-by :val not-ordered))))
      => true)
(fact "There are 0 elements"
      (sample #(count (ch->seq (endpoint->ch c uuid "stream-test-0"))))
      => 0)
(fact "There is 1 element"
      (sample #(count (ch->seq (endpoint->ch c uuid "stream-test-1"))))
      => 1)
(fact "There are 5 elements"
      (sample #(count (ch->seq (endpoint->ch c uuid "stream-test"))))
      => 5)
(fact "Posting many times in a row works as expected"
      (sample #(post-vals c uuid 5)) => (take 5 (repeat {:val 2})))
(with-muon c (event! {:stream-name "test" :payload {:hello true}}))
(facts "If we send an event using the event protocol, it is properly received"
       (let [ev (first @events)]
         (fact ev => (contains {:stream-name "test"
                                :service-id (str uuid "-client")
                                :payload {:hello true}}))
         (fact (:order-id ev) => (roughly (* 1000 (System/currentTimeMillis))))
         (fact (:event-time ev) => (roughly (System/currentTimeMillis)))
         (fact (keys ev) => (just #{:event-type :stream-name :schema
                                    :caused-by :caused-by-relation
                                    :service-id :order-id :event-time
                                    :payload}))))

(component/stop c)
(component/stop ms)

(let [uuid (.toString (java.util.UUID/randomUUID))
      ms (component/start
          (micro-service {:url #_"amqp://localhost" :local
                          :service-name uuid
                          :tags ["dummy" "test" "eventstore"]
                          :implementation (->TestMSImpl)}))
      c (muon-client #_"amqp://localhost" :local (str uuid "-client")
                     "dummy" "test" "client")
      get-val
      (with-muon c (request! (str "rpc://" uuid "/get-endpoint")
                             {:test :ok}))
      get-num-val
      (with-muon c (request! (str "rpc://" uuid "/get-num-endpoint")
                             {:test :ok}))
      post-val
      (with-muon c (request! (str "rpc://" uuid "/post-endpoint")
                             {:val 1}))]
  (fact "Query works as expected" get-val => {:test "ok"})
  (fact "Query works as expected for non-map types"
        get-num-val => 3.14)
  (fact "Post works as expected" post-val => {:val 2})
  (component/stop ms))

(let [uuid (.toString (java.util.UUID/randomUUID))
      config (doto (AutoConfiguration.)
               (.setServiceName uuid)
               (.setTags (LinkedList. ["dummy" "test" "eventstore"])))
      _ (.put (.getProperties config) "muon.discovery.factories"
              "io.muoncore.discovery.InMemDiscoveryFactory")
      _ (.put (.getProperties config) "muon.transport.factories"
              "io.muoncore.transport.InMemTransportFactory")
      ms (component/start (micro-service {:config config
                                          :implementation (->TestMSImpl)}))
      config (doto (AutoConfiguration.)
               (.setServiceName (str uuid "-client"))
               (.setTags (LinkedList. ["dummy" "test" "client"])))
      _ (.put (.getProperties config) "muon.discovery.factories"
              "io.muoncore.discovery.InMemDiscoveryFactory")
      _ (.put (.getProperties config) "muon.transport.factories"
              "io.muoncore.transport.InMemTransportFactory")
      c (component/start (micro-service {:config config}))
      get-val
      (with-muon c (request! (str "rpc://" uuid "/get-endpoint")
                             {:test :ok}))
      get-num-val
      (with-muon c (request! (str "rpc://" uuid "/get-num-endpoint")
                             {:test :ok}))
      post-val
      (with-muon c (request! (str "rpc://" uuid "/post-endpoint")
                             {:val 1}))
      discovery
      (with-muon c (discover!))]
  (fact "Query works as expected" get-val => {:test "ok"})
  (fact "Query works as expected for non-map types"
        get-num-val => 3.14)
  (fact "Post works as expected" post-val => {:val 2.0})
  (fact "Discovery includes an eventstore"
        (count (filter (fn [x] (contains? (into #{} (:tags x)) "eventstore"))
                       discovery))
        => pos?)
  (component/stop ms))
