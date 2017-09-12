package io.muoncore.extension.amqp

import io.arivera.oss.embedded.rabbitmq.EmbeddedRabbitMq
import io.arivera.oss.embedded.rabbitmq.EmbeddedRabbitMqConfig
import io.arivera.oss.embedded.rabbitmq.bin.RabbitMqCommand
import org.zeroturnaround.exec.ProcessResult
import org.zeroturnaround.exec.StartedProcess
import spock.lang.AutoCleanup
import spock.lang.Shared
import spock.lang.Specification

abstract class BaseEmbeddedBrokerSpec extends Specification {

  @Shared
  private EmbeddedRabbitMq rabbitMq

  @Shared
  EmbeddedRabbitMqConfig config

  def cleanupSpec() {
    brokerStop()
  }

  def brokerStop() {
    if (rabbitMq) {
      rabbitMq.stop()
      rabbitMq = null
    }
  }

  def brokerStart() {
    if (!rabbitMq) {
      println "BOoting embedded rabbitmq"
      config = new EmbeddedRabbitMqConfig.Builder().port(6743)
              .build();
      rabbitMq = new EmbeddedRabbitMq(config);
      rabbitMq.start()

      sleep(3000)
      cmd "rabbitmqctl", "add_user", "muon", "microservices"
      cmd "rabbitmqctl", "set_user_tags", "muon", "administrator"
      cmd "rabbitmqctl", "set_permissions", "-p", "/", "muon", '.*', '.*', '.*'
    }
  }

  def setupSpec() {
    brokerStart()
  }

  def cmd(String cmd, String...args) {
    println "EXEC: $cmd $args"
    RabbitMqCommand command = new RabbitMqCommand(config, cmd, args);
    StartedProcess process = command.call();
    ProcessResult result = process.getFuture().get();
    println result.outputString()
  }
}
