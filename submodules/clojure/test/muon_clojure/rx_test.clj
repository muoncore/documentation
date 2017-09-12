(ns muon-clojure.rx-test
  (:require [muon-clojure.rx :as rx]
            [clojure.core.async :refer [chan to-chan <!! go-loop take
                                        sliding-buffer <! >! close!]]
            [midje.sweet :as midje]))

(defn plug-subscriber [p]
  (let [res (chan 1)
        N 16
        [s ch] (rx/subscriber N)]
    (.subscribe p s)
    (go-loop [elem (<! ch)]
      (println s ":" elem (= elem (* N 3)))
      (if (= elem (* N 3))
        (do
          (.onComplete s)
          (close! res)
          (println "closed"))
        (recur (<! ch))))
    res))

(let [p (rx/publisher (fn [_] (to-chan (range 100))) nil)
      chs (mapcat #(pmap (fn [_] (plug-subscriber p)) (range %)) (range 20))]
  (dorun (map #(<!! %) chs)))
