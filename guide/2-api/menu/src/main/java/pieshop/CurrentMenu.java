package pieshop;

import java.util.List;

public class CurrentMenu {

  private List<MenuItem> items;

  public CurrentMenu(List<MenuItem> items) {
    this.items = items;
  }

  public List<MenuItem> getItems() {
    return items;
  }
}
