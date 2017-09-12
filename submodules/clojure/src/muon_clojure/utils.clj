(ns muon-clojure.utils
  (:require [clojure.tools.logging :as log]))

(defn dekeywordize
  "Converts the keys in a map from keywords to strings."
  [m]
  (if (map? m)
    (into {}
          (apply merge
                 (map (fn [[k v]] {(if (keyword? k)
                                     (name k)
                                     (str k))
                                   (if (map? v)
                                     (dekeywordize v)
                                     (if (sequential? v)
                                       (into (empty v) (map dekeywordize v))
                                       (if (keyword? v)
                                         (name v)
                                         v)))})
                      m)))
    (if (sequential? m)
      (into (empty m) (map dekeywordize m))
      (if (keyword? m)
        (name m)
        m))))

(defn keywordize
  "Converts the keys in a map from strings to keywords"
  [m]
  #_(log/info "keywordize" (class m) ":" (pr-str m))
  (if (or
        (instance? java.util.HashMap m)
        (instance? com.google.gson.internal.LinkedTreeMap m))
    (keywordize (into {} m))
    (if (map? m)
      (apply merge
             (map (fn [[k v]] {(if (keyword? k)
                                 k
                                 (keyword k))
                               (if (instance? com.google.gson.internal.LinkedTreeMap v)
                                 (keywordize (into {} v))
                                 (if (map? v)
                                   (keywordize v)
                                   (if (instance? java.util.ArrayList v)
                                     (keywordize (into [] v))
                                     (if (sequential? v)
                                       (into (empty v) (map keywordize v))
                                       v))))})
                  m))
      (if (instance? java.util.ArrayList m)
        (keywordize (into [] m))
        (if (sequential? m)
          (into (empty m) (map keywordize m))
          m)))))
