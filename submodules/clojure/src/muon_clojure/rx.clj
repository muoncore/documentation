(ns muon-clojure.rx
  (:use muon-clojure.utils)
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :refer [go-loop go <! >! <!! >!!
                                        chan buffer close! put!]]
            [clojure.core.async.impl.buffers :as buffers]
            [clojure.core.async.impl.protocols :as impl])
  (:import (org.reactivestreams Publisher Subscriber Subscription)
           (java.util Map)))

(defn close-subscription [s ch]
  (log/debug "::::::::::::: SUBSCRIBER" s "closing channel...")
  (close! ch)
  (.onComplete s))

(defn subscription [s ch]
  (reify Subscription
    (request [this n]
      (log/trace "::::: SUBSCRIPTION" s ":: request" n)
      (go
        (loop [remaining n]
          (when-not (= 0 remaining)
            (if-let [item (<! ch)]
              (do
                (log/trace "onNext" (dekeywordize item) remaining)
                (.onNext s (dekeywordize item))
                (recur (dec remaining)))
              (close-subscription s ch))))))
    (cancel [this]
      (close! ch)
      (log/debug "subscription cancelled"))))

(defn publisher [gen-fn params]
  (log/debug (str "::::::::::::::::::::::::::::::: " (pr-str params)))
  (reify Publisher
    (^void subscribe [this ^Subscriber s]
     (log/debug "subscribe::::::::: SUBSCRIBER" s)
     (let [ch (gen-fn (keywordize params))
           sobj (subscription s ch)]
       (log/trace "Assigned channel:" (.hashCode ch))
       (.onSubscribe s sobj)))))

(defn subscriber [n]
  (let [buf (buffers/fixed-buffer n)
        ch (chan buf)
        active-s (ref nil)
        requested (ref 0)
        request (fn [x]
                  (dosync
                   (.request @active-s x)
                   (alter requested #(+ % x))))
        s (reify Subscriber
            (^void onSubscribe [this ^Subscription s]
             (log/debug "onSubscribe" s)
             (dosync
              (alter active-s (fn [_] s)))
             (request n))
            (^void onNext [this ^Object obj]
             (when-not (nil? @active-s)
               (log/debug "onNext:::::::::::: CLIENTSIDE[-> " (.hashCode ch)
                          "][" (.hashCode this) "]" obj "/" (.count buf))
               (let [res (>!! ch obj)]
                 (log/trace "Push:" obj res @requested)
                 (dosync
                  (alter requested dec)
                  (if res
                    (if (<= @requested 0)
                      (request n))
                    (let [a-s @active-s]
                      (alter active-s (fn [_] nil))
                      (when-not (nil? a-s)
                        (.cancel a-s))))))))
            (^void onError [this ^Throwable t]
             (log/error "onError" (.getMessage t))
             (put! ch t))
            (^void onComplete [this]
             (when-not (nil? @active-s)
               (log/debug "onComplete")
               (close! ch)
               (dosync
                (let [a-s @active-s]
                  (alter active-s (fn [_] nil))
                  (when-not (nil? a-s)
                    (.cancel a-s)))))))]
    [s ch]))
