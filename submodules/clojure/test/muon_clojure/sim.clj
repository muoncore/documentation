(ns muon-clojure.sim
  (:use muon-clojure.core)
  (:require [midje.sweet :refer :all])
  (:require [clojure.test :refer :all]
            [muon-clojure.common :as mcc]
            [com.stuartsierra.component :as component]
            [clojure.core.async :refer [<! to-chan <!! close! go-loop]])
  (:import (com.google.common.eventbus EventBus)
           (java.util LinkedList)
           (io.muoncore.config AutoConfiguration)))

(defrecord TestMSImpl []
  MicroserviceStream
  (stream-mappings [this]
    [{:endpoint "stream-test" :type :hot
      :fn-process (fn [params]
                    (to-chan
                     (map #(hash-map :val %) (range))))}])
  MicroserviceRequest
  (request-mappings [this]
    [{:endpoint "get-num-endpoint"
      :fn-process (fn [resource] 3.14)}]))

(def uuid (.toString (java.util.UUID/randomUUID)))
(def ms (component/start
         (micro-service {:url #_"amqp://localhost" :local
                         :service-name uuid
                         :debug true
                         :tags ["dummy" "test" "eventstore"]
                         :implementation (->TestMSImpl)})))
(def c (muon-client #_"amqp://localhost" :local (str uuid "-client")
                    "dummy" "test" "client"))

(defn post-val [uuid]
  (request! (str "rpc://" uuid "/post-endpoint") {:val 1}))

#_(let [ch-server (:wiretap ms)
      ch-client (:wiretap c)]
  (go-loop [elem (<! ch-server)]
    (when-not (nil? elem)
      (println "CH-SERVER::::" elem)
      (recur (<! ch-server))))
  (go-loop [elem (<! ch-client)]
    (when-not (nil? elem)
      (println "CH-CLIENT::::" elem)
      (recur (<! ch-client)))))

(let [ch1 (with-muon c (subscribe! (str "stream://" uuid "/stream-test")
                                   {:stream-type :hot}))
      v1 (<!! ch1)
      ch2 (with-muon c (subscribe! (str "stream://" uuid "/stream-test")
                                   {:stream-type :hot}))
      v2 (<!! ch2)]
  (fact "v1" v1 => {:val 0})
  (fact "v2" v2 => {:val 0}))

(component/stop c)
(component/stop ms)
