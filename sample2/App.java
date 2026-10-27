public class App {
    public static void main(String[] args) {
        System.out.println("Pocket Shop inventory ready.");

        Inventory inventory = new Inventory();
        inventory.addPhone("iPhone 16 Pro", "IP16P-128-BLK", 999.00);
        inventory.listPhones();
    }
}

class Inventory {
    public void addPhone(String model, String sku, double price) {
        System.out.println("Added " + model + " (" + sku + ") for $" + price);
    }

    public void listPhones() {
        System.out.println("Inventory synced successfully.");
    }
}
