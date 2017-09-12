FROM java:openjdk-8u45-jdk

MAINTAINER Simplicity Itself

RUN mkdir /applocal

COPY build/libs/muon-java-gradle-example-1.0.jar /applocal/

EXPOSE 8080

WORKDIR /applocal

CMD /usr/bin/java -Xmx600m -jar /applocal/muon-java-gradle-example-1.0.jar
