package todo

import com.github.javafaker.Faker
import groovyx.net.http.RESTClient
import org.junit.ClassRule
import spock.lang.Shared
import spock.lang.Specification
import spock.lang.Stepwise
import spock.util.concurrent.PollingConditions
import utils.EventSubscriptionResource

@Stepwise
class TaskSpecification extends Specification {

  @Shared
  def rc = new RESTClient("http://localhost:9090", "application/json")
  @Shared
  Faker faker = new Faker()
  @Shared
  def id, description

  @ClassRule
  @Shared
  EventSubscriptionResource eventSubscriptionRule = new EventSubscriptionResource("newton-sample", "Task")

  def "Create a new task"() {
    when:
    def resp = rc.post(
      path: '/api/tasks',
      body: [
        description: faker.lorem().word()
      ]
    )

    this.id = resp.getHeaders("Location")[0].getValue().split("/").last()
    then:
    resp.status == 201

    new PollingConditions(timeout: 5).eventually {
      eventSubscriptionRule.getEventsRaised().find { it.eventType = "TaskCreatedEvent" }
    }

  }

  def "Change task description"() {
    this.description = faker.lorem().word()
    when:
    def resp = rc.put(
      path: "/api/tasks/${this.id}",
      body: [
        description: this.description
      ]
    )
    then:
    resp.status == 200

    new PollingConditions(timeout: 5).eventually {
      eventSubscriptionRule.getEventsRaised().find { it.eventType = "TaskDescriptionChangedEvent" }
    }

  }

  def "Get task details"() {
    when:
    def resp = rc.get(
      path: "/api/tasks/${this.id}"
    )
    then:
    resp.status == 200
    resp.data.description != this.description
  }

  def "List all tasks"() {
    when:
    def resp = rc.get(
      path: "/api/tasks"
    )
    then:
    resp.status == 200
    resp.data.size() >= 1
  }


}
