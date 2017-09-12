(defproject io.muoncore/muon-clojure "7.2.10"
  :description "A Clojure client/server library for interacting with Muon microservices."
  :url "https://github.com/muoncore/muon-clojure"
  :license {:name "GNU Affero General Public License Version 3"
            :url  "https://www.gnu.org/licenses/agpl-3.0.html"}
  :repositories [["snapshots"
                  {:url
                   "https://simplicityitself.artifactoryonline.com/simplicityitself/muon/"
                   :creds :gpg}]
                 ["releases" "https://simplicityitself.artifactoryonline.com/simplicityitself/repo/"]]
  :aot :all
  :javac-options ["-target" "1.8" "-source" "1.8" "-Xlint:-options"]
  #_#_:jvm-opts ["-agentpath:/opt/local/share/profiler/libyjpagent.jnilib"]
  :main muon-clojure.core
  :dependencies [[org.clojure/clojure "1.8.0"]
                 [org.clojure/tools.logging "0.4.0"]
                 [com.google.code.gson/gson "2.8.1"]
                 [org.clojure/core.async "0.3.443"]
                 [org.slf4j/slf4j-log4j12 "1.7.25"]
                 [com.damballa/abracad "0.4.13"]
                 [org.reactivestreams/reactive-streams "1.0.0.final"]
                 [org.clojure/java.data "0.1.1"]
                 [midje "1.8.3"]
                 [com.stuartsierra/component "0.3.2"]
                 [io.muoncore/muon-core "7.2.10"]
                 [io.muoncore/muon-event "7.2.10"]
                 [io.muoncore/muon-transport-amqp "7.2.10"]
                 [io.muoncore/muon-discovery-amqp "7.2.10"]]
  :plugins [[lein-midje "3.2"]])
