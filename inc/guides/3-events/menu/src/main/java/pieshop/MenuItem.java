package pieshop;

import java.util.*;

public class MenuItem {

  private String id = UUID.randomUUID().toString();
  private String name;
  private double price;

  public MenuItem(String name, double price) {
    this.name = name;
    this.price = price;
  }

  public String getName() {
    return name;
  }

  public double getPrice() {
    return price;
  }
  public String getId() {
    return id;
  }
}
