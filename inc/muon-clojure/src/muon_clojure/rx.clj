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
      (log/info "::::: SUBSCRIPTION" s ":: request" n)
      (go
        (loop [remaining n]
          (when-not (= 0 remaining)
            (if-let [item (<! ch)]
              (do
                (log/info "onNext" (dekeywordize item))
                (.onNext s (dekeywordize item))
                (recur (dec remaining)))
              (close-subscription s ch))))))
    (cancel [this]
      (close! ch))))

(defn publisher [gen-fn params]
  (log/info (str "::::::::::::::::::::::::::::::: " (pr-str params)))
  (reify Publisher
    (^void subscribe [this ^Subscriber s]
     (log/info "subscribe::::::::: SUBSCRIBER" s)
     (let [ch (gen-fn (keywordize params))
           sobj (subscription s ch)]
       (log/info "Assigned channel:" (.hashCode ch))
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
             (log/info "onSubscribe" s)
             (dosync
              (alter active-s (fn [_] s))
              (request n)))
            (^void onNext [this ^Object obj]
             (when-not (nil? @active-s)
               (log/debug "onNext:::::::::::: CLIENTSIDE[-> " (.hashCode ch)
                          "][" (.hashCode this) "]" obj)
               (let [res (>!! ch obj)]
                 (log/trace "Push:" res)
                 (dosync
                  (alter requested dec)
                  (if res
                    (if (= 0 @requested)
                      (request n))
                    (do
                      (.cancel @active-s)
                      (alter active-s (fn [_] nil))))))))
            (^void onError [this ^Throwable t]
             (log/info "onError" (.getMessage t))
             (put! ch t))
            (^void onComplete [this]
             (when-not (nil? @active-s)
               (log/info "onComplete")
               (close! ch)
               (dosync
                (.cancel @active-s)
                (alter active-s (fn [_] nil))))))]
    [s ch]))
