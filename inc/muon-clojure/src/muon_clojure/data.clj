(ns muon-clojure.data
  (:import (org.apache.avro Schema Schema$Type SchemaBuilder)
           (org.apache.avro.specific SpecificRecord)
           (io.muoncore.codec.avro AvroCodec AvroConverter)
           (clojure.lang BigInt Cons IMeta IPersistentList IPersistentMap
                         IPersistentSet IPersistentVector ISeq Keyword
                         PersistentArrayMap PersistentQueue Ratio Sorted Symbol))
  (:require [abracad.avro :as avro]
            [abracad.avro.edn :as aedn]))

(def avro-schema (aedn/new-schema))

(def converter
  (reify
    AvroConverter
    (decode [this encoded-data]
      (avro/decode avro-schema encoded-data))
    (encode [this data]
      (avro/binary-encoded avro-schema data))
    (getSchemaInfoFor [this type]
      (.toString (avro/parse-schema avro-schema)))
    (hasSchemasFor [this type]
      (>
       (count
        (filter true?
                (map
                 #(.isAssignableFrom % type)
                 #{Character Symbol Keyword Byte Short BigInt BigInteger
                   BigDecimal IPersistentList ISeq IPersistentVector
                   IPersistentMap IPersistentSet PersistentQueue Ratio})))
       0))))

(defn payload [n]
  (try
    (.getPayload n clojure.lang.PersistentArrayMap)
    (catch java.lang.UnsupportedOperationException e
      (into {} (.getPayload n java.util.Map)))))

(AvroCodec/registerConverter clojure.lang.PersistentArrayMap converter)
(AvroCodec/registerConverter clojure.lang.PersistentHashMap converter)
