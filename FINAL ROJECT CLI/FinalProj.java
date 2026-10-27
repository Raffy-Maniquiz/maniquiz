import java.io.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class PhoneStoreApp {

    private static final Scanner scanner = new Scanner(System.in);
    private static User loggedInUser = null;

    public static void main(String[] args) {
        initializeFiles();
        seedDefaultAdmin();

        System.out.println("==========================================");
        System.out.println("   WELCOME TO CLI PHONE STORE SYSTEM      ");
        System.out.println("==========================================");

        while (true) {
            if (loggedInUser == null) {
                showLoginMenu();
            } else {
                showDashboard();
            }
        }
    }

    private static void initializeFiles() {
        try {
            new File("users.txt").createNewFile();
            new File("phones.txt").createNewFile();
            new File("sales.txt").createNewFile();
        } catch (IOException e) {
            System.out.println("Error initializing storage files: " + e.getMessage());
        }
    }

    private static void seedDefaultAdmin() {
        List<User> users = FileHandler.readUsers();
        if (users.isEmpty()) {
            FileHandler.writeUser(new User("admin", "admin123", "ADMIN"));
            FileHandler.writeUser(new User("manager", "mgr123", "MANAGER"));
            FileHandler.writeUser(new User("staff", "staff123", "STAFF"));
        }
    }

    private static void showLoginMenu() {
        System.out.println("\n--- LOGIN MENU ---");
        System.out.print("Username: ");
        String username = scanner.nextLine().trim();
        System.out.print("Password: ");
        String password = scanner.nextLine().trim();

        User user = FileHandler.authenticate(username, password);
        if (user != null) {
            loggedInUser = user;
            System.out.println("\nLogin successful! Welcome, " + user.getUsername() + " (" + user.getRole() + ")");
        } else {
            System.out.println("\nInvalid username or password. Please try again.");
        }
    }

    private static void logout() {
        System.out.println("\nLogging out... Goodbye, " + loggedInUser.getUsername());
        loggedInUser = null;
    }

    private static void showDashboard() {
        System.out.println("\n==========================================");
        System.out.println(" MAIN DASHBOARD | Role: " + loggedInUser.getRole());
        System.out.println("==========================================");
        System.out.println("1. View Phone Inventory");
        System.out.println("2. Sell a Phone (Checkout)");
        
        if (!loggedInUser.getRole().equals("STAFF")) {
            System.out.println("3. Add New Phone (Create)");
            System.out.println("4. Update Phone Details (Update)");
        }
        
        if (loggedInUser.getRole().equals("ADMIN")) {
            System.out.println("5. Delete Phone (Delete)");
            System.out.println("6. Manage Users (Create/Delete Users)");
        }

        System.out.println("0. Logout");
        System.out.print("Select an option: ");

        String choice = scanner.nextLine().trim();

        switch (choice) {
            case "1":
                PhoneManager.viewPhones();
                break;
            case "2":
                PhoneManager.sellPhone(loggedInUser.getUsername());
                break;
            case "3":
                if (checkPermission("MANAGER", "ADMIN")) PhoneManager.addPhone();
                break;
            case "4":
                if (checkPermission("MANAGER", "ADMIN")) PhoneManager.updatePhone();
                break;
            case "5":
                if (checkPermission("ADMIN")) PhoneManager.deletePhone();
                break;
            case "6":
                if (checkPermission("ADMIN")) UserManager.manageUsers();
                break;
            case "0":
                logout();
                break;
            default:
                System.out.println("Invalid option. Please try again.");
        }
    }

    private static boolean checkPermission(String... allowedRoles) {
        for (String role : allowedRoles) {
            if (loggedInUser.getRole().equalsIgnoreCase(role)) {
                return true;
            }
        }
        System.out.println("Access Denied: Your role (" + loggedInUser.getRole() + ") cannot perform this action.");
        return false;
    }
}

class User {
    private String username;
    private String password;
    private String role;

    public User(String username, String password, String role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }

    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public String getRole() { return role; }

    public String toFileString() {
        return username + "|" + password + "|" + role;
    }
}

class Phone {
    private String id;
    private String brand;
    private String model;
    private double price;
    private int stock;

    public Phone(String id, String brand, String model, double price, int stock) {
        this.id = id;
        this.brand = brand;
        this.model = model;
        this.price = price;
        this.stock = stock;
    }

    public String getId() { return id; }
    public String getBrand() { return brand; }
    public String getModel() { return model; }
    public double getPrice() { return price; }
    public int getStock() { return stock; }

    public void setBrand(String brand) { this.brand = brand; }
    public void setModel(String model) { this.model = model; }
    public void setPrice(double price) { this.price = price; }
    public void setStock(int stock) { this.stock = stock; }

    public String toFileString() {
        return id + "|" + brand + "|" + model + "|" + price + "|" + stock;
    }
}

class FileHandler {
    public static List<User> readUsers() {
        List<User> users = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new FileReader("users.txt"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split("\\|");
                if (parts.length == 3) {
                    users.add(new User(parts[0], parts[1], parts[2]));
                }
            }
        } catch (IOException e) {
            // File might not exist yet
        }
        return users;
    }

    public static void writeUser(User user) {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter("users.txt", true))) {
            writer.write(user.toFileString());
            writer.newLine();
        } catch (IOException e) {
            System.out.println("Error writing user.");
        }
    }

    public static void saveAllUsers(List<User> users) {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter("users.txt", false))) {
            for (User user : users) {
                writer.write(user.toFileString());
                writer.newLine();
            }
        } catch (IOException e) {
            System.out.println("Error saving users list.");
        }
    }

    public static User authenticate(String username, String password) {
        List<User> users = readUsers();
        for (User u : users) {
            if (u.getUsername().equals(username) && u.getPassword().equals(password)) {
                return u;
            }
        }
        return null;
    }

    public static List<Phone> readPhones() {
        List<Phone> phones = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new FileReader("phones.txt"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split("\\|");
                if (parts.length == 5) {
                    phones.add(new Phone(parts[0], parts[1], parts[2], Double.parseDouble(parts[3]), Integer.parseInt(parts[4])));
                }
            }
        } catch (IOException e) {
            // File might not exist yet
        }
        return phones;
    }

    public static void saveAllPhones(List<Phone> phones) {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter("phones.txt", false))) {
            for (Phone p : phones) {
                writer.write(p.toFileString());
                writer.newLine();
            }
        } catch (IOException e) {
            System.out.println("Error saving phones list.");
        }
    }

    public static void writeSale(String saleRecord) {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter("sales.txt", true))) {
            writer.write(saleRecord);
            writer.newLine();
        } catch (IOException e) {
            System.out.println("Error recording sale.");
        }
    }
}

class PhoneManager {
    private static final Scanner scanner = new Scanner(System.in);

    public static void viewPhones() {
        List<Phone> phones = FileHandler.readPhones();
        System.out.println("\n--- PHONE INVENTORY ---");
        if (phones.isEmpty()) {
            System.out.println("No phones found in inventory.");
            return;
        }
        System.out.printf("%-10s | %-12s | %-15s | %-10s | %-5s%n", "ID", "Brand", "Model", "Price", "Stock");
        System.out.println("---------------------------------------------------------------");
        for (Phone p : phones) {
            System.out.printf("%-10s | %-12s | %-15s | $%-9.2f | %-5d%n", 
                p.getId(), p.getBrand(), p.getModel(), p.getPrice(), p.getStock());
        }
    }

    public static void addPhone() {
        System.out.println("\n--- ADD NEW PHONE (CREATE) ---");
        System.out.print("Enter Phone ID (e.g., P001): ");
        String id = scanner.nextLine().trim();

        List<Phone> phones = FileHandler.readPhones();
        for (Phone p : phones) {
            if (p.getId().equalsIgnoreCase(id)) {
                System.out.println("Error: Phone ID already exists!");
                return;
            }
        }

        System.out.print("Enter Brand (e.g., Apple, Samsung): ");
        String brand = scanner.nextLine().trim();
        System.out.print("Enter Model (e.g., iPhone 15): ");
        String model = scanner.nextLine().trim();
        System.out.print("Enter Price: ");
        double price = Double.parseDouble(scanner.nextLine().trim());
        System.out.print("Enter Initial Stock Quantity: ");
        int stock = Integer.parseInt(scanner.nextLine().trim());

        phones.add(new Phone(id, brand, model, price, stock));
        FileHandler.saveAllPhones(phones);
        System.out.println("Success: Phone added to inventory!");
    }

    public static void updatePhone() {
        viewPhones();
        System.out.println("\n--- UPDATE PHONE DETAILS ---");
        System.out.print("Enter Phone ID to update: ");
        String id = scanner.nextLine().trim();

        List<Phone> phones = FileHandler.readPhones();
        Phone target = null;
        for (Phone p : phones) {
            if (p.getId().equalsIgnoreCase(id)) {
                target = p;
                break;
            }
        }

        if (target == null) {
            System.out.println("Phone ID not found.");
            return;
        }

        System.out.print("Enter new Brand (leave blank to keep '" + target.getBrand() + "'): ");
        String brand = scanner.nextLine().trim();
        if (!brand.isEmpty()) target.setBrand(brand);

        System.out.print("Enter new Model (leave blank to keep '" + target.getModel() + "'): ");
        String model = scanner.nextLine().trim();
        if (!model.isEmpty()) target.setModel(model);

        System.out.print("Enter new Price (leave blank to keep '" + target.getPrice() + "'): ");
        String priceStr = scanner.nextLine().trim();
        if (!priceStr.isEmpty()) target.setPrice(Double.parseDouble(priceStr));

        System.out.print("Enter new Stock (leave blank to keep '" + target.getStock() + "'): ");
        String stockStr = scanner.nextLine().trim();
        if (!stockStr.isEmpty()) target.setStock(Integer.parseInt(stockStr));

        FileHandler.saveAllPhones(phones);
        System.out.println("Success: Phone record updated!");
    }

    public static void deletePhone() {
        viewPhones();
        System.out.println("\n--- DELETE PHONE ---");
        System.out.print("Enter Phone ID to delete: ");
        String id = scanner.nextLine().trim();

        List<Phone> phones = FileHandler.readPhones();
        boolean removed = phones.removeIf(p -> p.getId().equalsIgnoreCase(id));

        if (removed) {
            FileHandler.saveAllPhones(phones);
            System.out.println("Success: Phone deleted from inventory.");
        } else {
            System.out.println("Phone ID not found.");
        }
    }

    public static void sellPhone(String username) {
        viewPhones();
        System.out.println("\n--- POINT OF SALE (CHECKOUT) ---");
        System.out.print("Enter Phone ID to sell: ");
        String id = scanner.nextLine().trim();

        List<Phone> phones = FileHandler.readPhones();
        Phone target = null;
        for (Phone p : phones) {
            if (p.getId().equalsIgnoreCase(id)) {
                target = p;
                break;
            }
        }

        if (target == null) {
            System.out.println("Phone ID not found.");
            return;
        }

        if (target.getStock() <= 0) {
            System.out.println("Error: Item is out of stock!");
            return;
        }

        System.out.print("Enter quantity to sell: ");
        int qty = Integer.parseInt(scanner.nextLine().trim());

        if (qty > target.getStock()) {
            System.out.println("Error: Not enough stock available. Current stock: " + target.getStock());
            return;
        }

        target.setStock(target.getStock() - qty);
        double totalPrice = target.getPrice() * qty;
        FileHandler.saveAllPhones(phones);

        String saleId = "S" + System.currentTimeMillis();
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String record = saleId + "|" + target.getId() + "|" + qty + "|" + totalPrice + "|" + username + "|" + timestamp;
        
        FileHandler.writeSale(record);
        System.out.println("\nSale Successful!");
        System.out.println("Total Amount: $" + totalPrice);
        System.out.println("Remaining Stock for " + target.getModel() + ": " + target.getStock());
    }
}

class UserManager {
    private static final Scanner scanner = new Scanner(System.in);

    public static void manageUsers() {
        while (true) {
            System.out.println("\n--- USER MANAGEMENT (ADMIN) ---");
            System.out.println("1. View Users");
            System.out.println("2. Create New User");
            System.out.println("3. Delete User");
            System.out.println("0. Back to Dashboard");
            System.out.print("Choose option: ");
            String choice = scanner.nextLine().trim();

            switch (choice) {
                case "1":
                    List<User> users = FileHandler.readUsers();
                    System.out.printf("\n%-15s | %-10s%n", "Username", "Role");
                    System.out.println("-------------------------");
                    for (User u : users) {
                        System.out.printf("%-15s | %-10s%n", u.getUsername(), u.getRole());
                    }
                    break;
                case "2":
                    System.out.print("Enter Username: ");
                    String uname = scanner.nextLine().trim();
                    System.out.print("Enter Password: ");
                    String pass = scanner.nextLine().trim();
                    System.out.print("Enter Role (ADMIN, MANAGER, STAFF): ");
                    String role = scanner.nextLine().trim().toUpperCase();

                    if (!role.equals("ADMIN") && !role.equals("MANAGER") && !role.equals("STAFF")) {
                        System.out.println("Invalid role specified.");
                        break;
                    }

                    FileHandler.writeUser(new User(uname, pass, role));
                    System.out.println("User created successfully!");
                    break;
                case "3":
                    System.out.print("Enter Username to delete: ");
                    String targetUser = scanner.nextLine().trim();
                    if (targetUser.equalsIgnoreCase("admin")) {
                        System.out.println("Cannot delete the primary admin account!");
                        break;
                    }
                    List<User> allUsers = FileHandler.readUsers();
                    boolean removed = allUsers.removeIf(u -> u.getUsername().equalsIgnoreCase(targetUser));
                    if (removed) {
                        FileHandler.saveAllUsers(allUsers);
                        System.out.println("User deleted successfully.");
                    } else {
                        System.out.println("User not found.");
                    }
                    break;
                case "0":
                    return;
                default:
                    System.out.println("Invalid choice.");
            }
        }
    }
}